import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import { useUI } from '@/contexts/UIContext';
import { 
    generateMiniAppIdeas,
    generateMiniAppCode,
    optimizeMiniAppPrompt,
} from '@/services/geminiService';
import type { MiniAppIdea, MiniApp, MiniAppTab } from '@/types';
import { useAsyncCleanup } from '@/hooks/useAsyncCleanup';
import { MiniAppError } from '@/utils/errors';
import { ProgressTracker, DEFAULT_MINIAPP_STEPS } from '@/utils/progressTracking';
import { validateMiniAppIdea, validateMiniApp } from '@/utils/typeValidation';
import { miniAppRequestQueue } from '@/utils/requestQueue';
import { sanitizeMiniAppContent } from '@/utils/security';

interface MiniAppContextType {
    miniAppIdeas: MiniAppIdea[];
    miniApps: MiniApp[];
    miniAppTabs: MiniAppTab[];
    isGeneratingIdeas: boolean;
    isGeneratingMoreIdeas: boolean;
    handleCreateMiniApp: (idea: MiniAppIdea) => Promise<void>;
    handleCreateCustomMiniApp: (description: string) => Promise<void>;
    handleGenerateMoreIdeas: () => Promise<void>;
    handleCloseMiniAppTab: (tabId: string) => void;
    handleSaveMiniAppToDocs: (miniAppId: string) => void;
    handleDownloadMiniApp: (miniAppId: string) => void;
}

interface MiniAppProviderProps {
    children: React.ReactNode;
    projectContext: {
        projectTitle: string;
        projectDescription: string;
    };
}

const MiniAppContext = createContext<MiniAppContextType | undefined>(undefined);

export const MiniAppProvider: React.FC<MiniAppProviderProps> = ({ 
    children, 
    projectContext 
}) => {
    const { setError, setLoadingMessage, setProgress } = useUI();
    const { getSignal } = useAsyncCleanup();
    
    // State
    const [miniAppIdeas, setMiniAppIdeas] = useState<MiniAppIdea[]>([]);
    const [miniApps, setMiniApps] = useState<MiniApp[]>([]);
    const [miniAppTabs, setMiniAppTabs] = useState<MiniAppTab[]>([]);
    const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
    const [isGeneratingMoreIdeas, setIsGeneratingMoreIdeas] = useState(false);

    // Progress tracking
    const progressTracker = useMemo(() => new ProgressTracker(
        DEFAULT_MINIAPP_STEPS,
        (progress, message) => {
            setProgress(progress);
            setLoadingMessage(message);
        }
    ), [setProgress, setLoadingMessage]);

    const handleCreateMiniApp = useCallback(async (idea: MiniAppIdea) => {
        progressTracker.reset();
        
        try {
            // Validate input
            if (!validateMiniAppIdea(idea)) {
                throw new MiniAppError('Invalid mini-app idea format', 'VALIDATION_ERROR');
            }

            progressTracker.nextStep('Optimizing prompt...');
            const effectivePrompt = idea.creationPrompt || 
                (await optimizeMiniAppPrompt(
                    idea.description, 
                    projectContext.projectDescription,
                    getSignal()
                )).creationPrompt;

            progressTracker.nextStep('Generating code...');
            const code = await generateMiniAppCode(effectivePrompt);
            
            if (!code) {
                throw new MiniAppError('Failed to generate code', 'API_ERROR', true);
            }

            progressTracker.nextStep('Creating mini-app...');
            const sanitizedCode = sanitizeMiniAppContent(code);
            
            const miniApp: MiniApp = {
                id: `miniapp-${Date.now()}`,
                title: idea.title,
                htmlContent: sanitizedCode,
                creationPrompt: effectivePrompt
            };

            if (!validateMiniApp(miniApp)) {
                throw new MiniAppError('Invalid mini-app format', 'VALIDATION_ERROR');
            }

            progressTracker.nextStep('Saving result...');
            setMiniApps(prev => [...prev, miniApp]);
            setMiniAppTabs(prev => [...prev, {
                id: `tab-${Date.now()}`,
                title: idea.title,
                miniAppId: miniApp.id,
                type: 'miniapp'
            }]);

        } catch (error) {
            console.error('Failed to create mini-app:', error);
            if (error instanceof MiniAppError) {
                setError(error.message);
            } else {
                setError('Failed to create mini-app');
            }
            throw error;
        } finally {
            progressTracker.reset();
        }
    }, [projectContext, getSignal, progressTracker, setError]);

    const handleCreateCustomMiniApp = useCallback(async (userDescription: string) => {
        try {
            setIsGeneratingIdeas(true);
            const initialIdea: MiniAppIdea = {
                title: userDescription.split('\n')[0].slice(0, 50) || "Custom Mini App",
                description: userDescription,
                creationPrompt: userDescription
            };
            await handleCreateMiniApp(initialIdea);
        } catch (error) {
            console.error('Failed to create custom mini-app:', error);
            setError(error instanceof MiniAppError ? error.message : 'Failed to create custom mini-app');
        } finally {
            setIsGeneratingIdeas(false);
        }
    }, [handleCreateMiniApp, setError]);

    const handleGenerateMoreIdeas = useCallback(async () => {
        try {
            setIsGeneratingMoreIdeas(true);
            const projectContext = `${projectContext.projectTitle}\n${projectContext.projectDescription}`;
            const existingTitles = miniAppIdeas.map(idea => idea.title);
            
            const newIdeas = await generateMiniAppIdeas(projectContext, getSignal());
            if (!Array.isArray(newIdeas)) {
                throw new MiniAppError('Invalid response format', 'API_ERROR');
            }

            const validIdeas = newIdeas
                .filter(idea => validateMiniAppIdea(idea))
                .filter(idea => !existingTitles.includes(idea.title));

            // Queue generation of new ideas
            validIdeas.forEach((idea, index) => {
                miniAppRequestQueue.enqueue({
                    id: `gen-${Date.now()}-${index}`,
                    operation: () => handleCreateMiniApp(idea),
                    priority: index
                });
            });

            setMiniAppIdeas(prev => [...prev, ...validIdeas]);
        } catch (error) {
            console.error('Failed to generate more ideas:', error);
            setError(error instanceof MiniAppError ? error.message : 'Failed to generate more mini-app ideas');
        } finally {
            setIsGeneratingMoreIdeas(false);
        }
    }, [projectContext, getSignal, miniAppIdeas, handleCreateMiniApp, setError]);

    const handleCloseMiniAppTab = useCallback((tabId: string) => {
        setMiniAppTabs(prev => prev.filter(tab => tab.id !== tabId));
    }, []);

    const handleSaveMiniAppToDocs = useCallback((miniAppId: string) => {
        // This will be implemented in the ProjectContext as it requires access to phase documents
        console.log('Save mini app to docs:', miniAppId);
    }, []);

    const handleDownloadMiniApp = useCallback((miniAppId: string) => {
        const miniApp = miniApps.find(app => app.id === miniAppId);
        if (!miniApp) return;

        const blob = new Blob([miniApp.htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${miniApp.title.toLowerCase().replace(/\s+/g, '-')}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [miniApps]);

    const contextValue = useMemo(() => ({
        miniAppIdeas,
        miniApps,
        miniAppTabs,
        isGeneratingIdeas,
        isGeneratingMoreIdeas,
        handleCreateMiniApp,
        handleCreateCustomMiniApp,
        handleGenerateMoreIdeas,
        handleCloseMiniAppTab,
        handleSaveMiniAppToDocs,
        handleDownloadMiniApp,
    }), [
        miniAppIdeas,
        miniApps,
        miniAppTabs,
        isGeneratingIdeas,
        isGeneratingMoreIdeas,
        handleCreateMiniApp,
        handleCreateCustomMiniApp,
        handleGenerateMoreIdeas,
        handleCloseMiniAppTab,
        handleSaveMiniAppToDocs,
        handleDownloadMiniApp,
    ]);

    return (
        <MiniAppContext.Provider value={contextValue}>
            {children}
        </MiniAppContext.Provider>
    );
};

export const useMiniApp = () => {
    const context = useContext(MiniAppContext);
    if (context === undefined) {
        throw new Error('useMiniApp must be used within a MiniAppProvider');
    }
    return context;
};
