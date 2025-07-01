import React, { createContext, useState, useContext, useMemo, useCallback, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
import { useUI } from '@/contexts/UIContext';
import { produce } from 'immer';
import { 
    interpretRequest,
    generateAgentTask, 
    executeAgentTask,
    generateNewExecutionPlan,
    elaborateSubTaskContent,
    searchRelatedInformation,
    continueElaboration,
    generateMiniAppIdeas,
    generateMiniAppCode,
    optimizeMiniAppPrompt,
} from '@/services/geminiService';
import type { AgentOutputForPlanGen, RawExecutionPhase } from '@/services/geminiService';
import { composeTeam } from '@/services/orchestratorService';
import { getArchivedProjects, saveArchivedProject, clearArchivedProjects as clearHistoryService } from '@/services/localStorageService';
import type { InterpretedProjectDetails, Agent, ArchivedProject, NewExecutionPhase, PhaseDocument, ChatMessage, AIGeneratedTab, GroundingChunkWeb, MiniAppIdea, MiniApp, MiniAppTab } from '@/types'; 
import { UI_STRINGS } from '@/constants';

interface ProjectContextType {
    projectTitle: string;
    projectDescription: string;
    currentProjectId: string | null;
    interpretedDetails: InterpretedProjectDetails | null;
    team: Agent[] | null;
    initialAgentTasksCompleted: boolean;
    isLoadingPlan: boolean;
    newExecutionPlan: NewExecutionPhase[] | null;
    phaseDocuments: PhaseDocument[] | null;
    archivedProjects: ArchivedProject[];
    assistantChatHistory: ChatMessage[];
    aiGeneratedTabs: AIGeneratedTab[];
    miniAppIdeas: MiniAppIdea[];
    isGeneratingIdeas: boolean;
    isGeneratingMoreIdeas: boolean;
    miniApps: MiniApp[];
    miniAppTabs: MiniAppTab[];

    resetApp: () => void;
    handleProjectSubmit: (title: string, description: string) => Promise<void>;
    handleGenerateNewExecutionPlan: () => Promise<void>;
    handleElaborateSubTaskContent: (phaseId: string, subTaskId: string, isBatch?: boolean, isReElaboration?: boolean) => Promise<boolean>;
    handleReElaborateSubTask: (phaseId: string, subTaskId: string) => Promise<boolean>;
    handleElaborateEntirePhase: (phaseId: string) => Promise<void>;
    handleSearchForSubTask: (phaseId: string, subTaskId: string, query: string) => Promise<boolean>;
    handleSavePhaseDocumentChanges: (documentId: string, newContent: string) => Promise<boolean>;
    handleChatHistoryChange: (newHistory: ChatMessage[]) => void;
    handleCreateAIGeneratedTab: (title: string, content: string) => void;
    handleCloseAIGeneratedTab: (tabId: string) => void;
    handleUpdateAIGeneratedTabContent: (tabId: string, newContent: string) => void;
    handleContinueInAIGeneratedTab: (tabId: string, content: string, instruction: string) => Promise<void>;
    handleSaveAIGeneratedTabToDocs: (tabId: string, title: string, content: string) => void;
    handleClearHistory: () => void;
    handleNavigateToMiniApps: () => void;
    handleCreateMiniApp: (idea: MiniAppIdea) => Promise<void>;
    handleCreateCustomMiniApp: (userDescription: string) => Promise<void>;
    handleGenerateMoreMiniAppIdeas: () => Promise<void>;
    handleCloseMiniAppTab: (tabId: string) => void;
    handleSaveMiniAppToDocs: (miniAppId: string) => void;
    handleDownloadMiniApp: (miniAppId: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { setLoading, setLoadingMessage, setError, setActiveView, activeTab, setActiveTab } = useUI();
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Project State
    const [projectTitle, setProjectTitle] = useState<string>('');
    const [projectDescription, setProjectDescription] = useState<string>('');
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null); 
    const [interpretedDetails, setInterpretedDetails] = useState<InterpretedProjectDetails | null>(null);
    const [team, setTeam] = useState<Agent[] | null>(null);
    const [initialAgentTasksCompleted, setInitialAgentTasksCompleted] = useState<boolean>(false);
    const [isLoadingPlan, setIsLoadingPlan] = useState<boolean>(false); 
    const [newExecutionPlan, setNewExecutionPlan] = useState<NewExecutionPhase[] | null>(null);
    const [phaseDocuments, setPhaseDocuments] = useState<PhaseDocument[] | null>(null);
    const [assistantChatHistory, setAssistantChatHistory] = useState<ChatMessage[]>([]);
    const [aiGeneratedTabs, setAiGeneratedTabs] = useState<AIGeneratedTab[]>([]);
    const [archivedProjects, setArchivedProjects] = useState<ArchivedProject[]>([]);
    
    // Mini-App State
    const [miniAppIdeas, setMiniAppIdeas] = useState<MiniAppIdea[]>([]);
    const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
    const [isGeneratingMoreIdeas, setIsGeneratingMoreIdeas] = useState(false);
    const [miniApps, setMiniApps] = useState<MiniApp[]>([]);
    const [miniAppTabs, setMiniAppTabs] = useState<MiniAppTab[]>([]);

    const newExecutionPlanRef = useRef(newExecutionPlan);
    useEffect(() => { newExecutionPlanRef.current = newExecutionPlan; }, [newExecutionPlan]);
    
    useEffect(() => {
        setArchivedProjects(getArchivedProjects());
    }, []);

    const updateActiveArchivedProject = useCallback((updatedData: Partial<Omit<ArchivedProject, 'id' | 'timestamp' | 'title' | 'description'>>) => {
        if (!currentProjectId) return;
        setArchivedProjects(prevProjects => {
            const updatedProjects = produce(prevProjects, draft => {
                const projectToUpdate = draft.find(p => p.id === currentProjectId);
                if (projectToUpdate) {
                    Object.assign(projectToUpdate, updatedData);
                    projectToUpdate.timestamp = new Date().toISOString();
                }
            });
            const projectToSave = updatedProjects.find(p => p.id === currentProjectId);
            if (projectToSave) saveArchivedProject(projectToSave);
            return [...updatedProjects].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        });
    }, [currentProjectId]);

    const resetApp = useCallback(() => {
        setActiveView('home');
        setActiveTab('overview');
        setProjectTitle('');
        setProjectDescription('');
        setCurrentProjectId(null);
        setInterpretedDetails(null);
        setTeam(null);
        setLoading(false);
        setError(null);
        setInitialAgentTasksCompleted(false);
        setIsLoadingPlan(false);
        setNewExecutionPlan(null);
        setPhaseDocuments(null);
        setAssistantChatHistory([]);
        setAiGeneratedTabs([]);
        setMiniAppIdeas([]);
        setIsGeneratingIdeas(false);
        setIsGeneratingMoreIdeas(false);
        setMiniApps([]);
        setMiniAppTabs([]);
    }, [setActiveView, setActiveTab, setLoading, setError]);

    const handleProjectSubmit = useCallback(async (title: string, description: string) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            resetApp();
            const newProjectId = `project-${Date.now()}-${nanoid(4)}`;
            
            const initialState = {
                projectTitle: title,
                projectDescription: description,
                currentProjectId: newProjectId
            };
            setProjectTitle(initialState.projectTitle);
            setProjectDescription(initialState.projectDescription);
            setCurrentProjectId(initialState.currentProjectId);
            
            setLoading(true, UI_STRINGS.interpretingRequest);
            const details = await interpretRequest(description);
            
            if (abortControllerRef.current?.signal.aborted) return;
            setInterpretedDetails(details);

            setLoading(true, UI_STRINGS.generatingTeam);
            const composedTeam = useMemo(() => composeTeam(details.projectType, details.expertise), 
                [details.projectType, details.expertise]);
            
            if (abortControllerRef.current?.signal.aborted) return;
            setLoading(true, UI_STRINGS.generatingAgentTasks);
            
            const teamWithTasks = await Promise.all(
                composedTeam.map(async (agent) => {
                    try {
                        const task = await generateAgentTask(agent.role, `${title}: ${description}`);
                        return {
                            ...agent,
                            assignedTask: task,
                            status: "Active" as Agent['status'],
                            isWorking: true,
                            taskOutput: null
                        } as Agent;
                    } catch (err) {
                        console.error(`Failed to generate task for ${agent.role}:`, err);
                        return {
                            ...agent,
                            assignedTask: "Task generation failed",
                            status: "Error" as Agent['status'],
                            isWorking: false,
                            taskOutput: null
                        } as Agent;
                    }
                })
            );

            if (abortControllerRef.current?.signal.aborted) return;
            setTeam(teamWithTasks);
            setActiveView('workspace');

            setLoading(true, UI_STRINGS.executingInitialTasks);
            const executedTeam = await Promise.all(
                teamWithTasks.map(async (agent) => {
                    if (agent.status === "Error") return agent;
                    
                    try {
                        const output = await executeAgentTask(agent.role, agent.assignedTask, description);
                        return {
                            ...agent,
                            taskOutput: output,
                            status: "Completed" as const,
                            isWorking: false
                        };
                    } catch (err) {
                        const errorMessage = `Auto-execution failed for ${agent.role}: ${err instanceof Error ? err.message : 'Unknown error'}`;
                        console.error(errorMessage);
                        return {
                            ...agent,
                            taskOutput: `CHYBA: ${errorMessage}`,
                            status: "Error" as const,
                            isWorking: false
                        };
                    }
                })
            );

            if (abortControllerRef.current?.signal.aborted) return;
            
            const batchUpdates = () => {
                setTeam(executedTeam);
                setInitialAgentTasksCompleted(true);
                
                const initialDocument: PhaseDocument = {
                    id: `doc-initial-${newProjectId}`,
                    phaseId: 'initial-description',
                    title: 'Úvodná špecifikácia projektu',
                    content: `# ${title}\n\n${description}`,
                    lastModified: new Date().toISOString(),
                };
                setPhaseDocuments([initialDocument]);

                const newArchivedProject: ArchivedProject = {
                    id: newProjectId,
                    title,
                    description,
                    timestamp: new Date().toISOString(),
                    interpretedDetails: details,
                    team: executedTeam,
                    documentationOutline: null,
                    newExecutionPlan: null,
                    phaseDocuments: [initialDocument],
                };
                saveArchivedProject(newArchivedProject);
                setArchivedProjects(prev => [newArchivedProject, ...prev]);
            };
            
            batchUpdates();
        } catch (error) {
            console.error('Project submission failed:', error);
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
            setLoading(false);
        }
    }, [resetApp, setLoading, setError, setActiveView]);

    // Execution Plan Handlers
    const handleGenerateNewExecutionPlan = useCallback(async () => {
        try {
            setIsLoadingPlan(true);
            const agentOutputs = team?.map(agent => ({
                agentRole: agent.role,
                assignedTask: agent.assignedTask,
                taskOutput: agent.taskOutput || ''
            })) as AgentOutputForPlanGen[];

            const plan = await generateNewExecutionPlan(projectTitle, projectDescription, agentOutputs || []);
            const transformedPlan: NewExecutionPhase[] = plan.map(phase => ({
                id: `phase-${Date.now()}-${nanoid(4)}`,
                title: phase.phaseTitle || 'Untitled Phase',
                objective: phase.phaseObjective || '',
                subTasks: phase.subTasks.map(task => ({
                    id: `task-${Date.now()}-${nanoid(4)}`,
                    title: task.title,
                    elaborationPrompt: task.elaborationPrompt,
                    status: 'Pending' as const,
                    assignedAgentRoleHint: task.agentRoleHint
                }))
            }));
            setNewExecutionPlan(transformedPlan);
            updateActiveArchivedProject({ newExecutionPlan: transformedPlan });
        } catch (error) {
            console.error('Failed to generate execution plan:', error);
            setError('Failed to generate execution plan');
        } finally {
            setIsLoadingPlan(false);
        }
    }, [team, projectTitle, projectDescription, setError, updateActiveArchivedProject]);

    const handleElaborateSubTaskContent = useCallback(async (phaseId: string, subTaskId: string, isBatch?: boolean, isReElaboration?: boolean) => {
        try {
            if (!newExecutionPlan) return false;

            const phase = newExecutionPlan.find(p => p.id === phaseId);
            const subTask = phase?.subTasks.find(st => st.id === subTaskId);
            
            if (!phase || !subTask) return false;

            const elaboratedContent = await elaborateSubTaskContent(
                subTask.title,
                subTask.elaborationPrompt,
                phase.objective,
                `${projectTitle}: ${projectDescription}`,
                subTask.assignedAgentRoleHint
            );

            setNewExecutionPlan(prevPlan => {
                if (!prevPlan) return null;
                return prevPlan.map(p => {
                    if (p.id !== phaseId) return p;
                    return {
                        ...p,
                        subTasks: p.subTasks.map(st => {
                            if (st.id !== subTaskId) return st;
                            return {
                                ...st,
                                elaboratedContent,
                                status: 'SavedToDocument' as const
                            };
                        })
                    };
                });
            });

            updateActiveArchivedProject({ newExecutionPlan });
            return true;
        } catch (error) {
            console.error('Failed to elaborate sub-task:', error);
            setError('Failed to elaborate sub-task content');
            return false;
        }
    }, [newExecutionPlan, projectTitle, projectDescription, setError, updateActiveArchivedProject]);

    const handleReElaborateSubTask = useCallback(async (phaseId: string, subTaskId: string) => {
        return handleElaborateSubTaskContent(phaseId, subTaskId, false, true);
    }, [handleElaborateSubTaskContent]);

    const handleElaborateEntirePhase = useCallback(async (phaseId: string) => {
        try {
            if (!newExecutionPlan) return;

            const phase = newExecutionPlan.find(p => p.id === phaseId);
            if (!phase) return;

            for (const subTask of phase.subTasks) {
                if (subTask.status === 'Pending') {
                    await handleElaborateSubTaskContent(phaseId, subTask.id, true);
                }
            }
        } catch (error) {
            console.error('Failed to elaborate phase:', error);
            setError('Failed to elaborate phase');
        }
    }, [newExecutionPlan, handleElaborateSubTaskContent, setError]);

    const handleSearchForSubTask = useCallback(async (phaseId: string, subTaskId: string, query: string) => {
        try {
            if (!newExecutionPlan) return false;

            const phase = newExecutionPlan.find(p => p.id === phaseId);
            const subTask = phase?.subTasks.find(st => st.id === subTaskId);
            
            if (!phase || !subTask) return false;

            const searchResults = await searchRelatedInformation(query);
            if (!searchResults?.text) return false;

            const formattedResults = {
                text: searchResults.text,
                sources: searchResults.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter(chunk => chunk.web).map(chunk => chunk.web!) || []
            };

            setNewExecutionPlan(prevPlan => {
                if (!prevPlan) return null;
                return prevPlan.map(p => {
                    if (p.id !== phaseId) return p;
                    return {
                        ...p,
                        subTasks: p.subTasks.map(st => {
                            if (st.id !== subTaskId) return st;
                            return {
                                ...st,
                                searchResults: formattedResults
                            };
                        })
                    };
                });
            });

            updateActiveArchivedProject({ newExecutionPlan });
            return true;
        } catch (error) {
            console.error('Failed to search for sub-task:', error);
            setError('Failed to search for related information');
            return false;
        }
    }, [newExecutionPlan, setError, updateActiveArchivedProject]);

    const handleSavePhaseDocumentChanges = useCallback(async (documentId: string, newContent: string) => {
        try {
            setPhaseDocuments(prevDocs => {
                if (!prevDocs) return null;
                return prevDocs.map(doc => {
                    if (doc.id !== documentId) return doc;
                    const versionHistory = doc.versionHistory || [];
                    return {
                        ...doc,
                        content: newContent,
                        lastModified: new Date().toISOString(),
                        versionHistory: [...versionHistory, {
                            content: doc.content,
                            timestamp: new Date().toISOString()
                        }]
                    };
                });
            });
            updateActiveArchivedProject({ phaseDocuments });
            return true;
        } catch (error) {
            console.error('Failed to save document changes:', error);
            setError('Failed to save document changes');
            return false;
        }
    }, [phaseDocuments, setError, updateActiveArchivedProject]);

    const handleChatHistoryChange = useCallback((newHistory: ChatMessage[]) => {
        setAssistantChatHistory(newHistory);
    }, []);

    const handleCreateAIGeneratedTab = useCallback((title: string, content: string) => {
        setAiGeneratedTabs(prev => [...prev, {
            id: `tab-${Date.now()}`,
            title,
            content,
            type: 'ai-content'
        }]);
    }, []);

    const handleCloseAIGeneratedTab = useCallback((tabId: string) => {
        setAiGeneratedTabs(prev => prev.filter(tab => tab.id !== tabId));
    }, []);

    const handleUpdateAIGeneratedTabContent = useCallback((tabId: string, newContent: string) => {
        setAiGeneratedTabs(prev => prev.map(tab => 
            tab.id === tabId ? { ...tab, content: newContent } : tab
        ));
    }, []);

    const handleContinueInAIGeneratedTab = useCallback(async (tabId: string, content: string, instruction: string) => {
        try {
            const continuation = await continueElaboration(content, instruction);
            handleUpdateAIGeneratedTabContent(tabId, continuation);
        } catch (error) {
            console.error('Failed to continue elaboration:', error);
            setError('Failed to continue elaboration');
        }
    }, [handleUpdateAIGeneratedTabContent, setError]);

    const handleSaveAIGeneratedTabToDocs = useCallback((tabId: string, title: string, content: string) => {
        const newDoc: PhaseDocument = {
            id: `doc-${Date.now()}`,
            phaseId: 'ai-generated',
            title,
            content,
            lastModified: new Date().toISOString(),
            sourceTabId: tabId
        };
        setPhaseDocuments(prev => [...(prev || []), newDoc]);
        updateActiveArchivedProject({ phaseDocuments });
    }, [updateActiveArchivedProject]);

    const handleClearHistory = useCallback(() => {
        clearHistoryService();
        setArchivedProjects([]);
    }, []);

    const handleNavigateToMiniApps = useCallback(() => {
        setActiveView('workspace');
        setActiveTab('miniapps');
    }, [setActiveView]);

    const handleCreateMiniApp = useCallback(async (idea: MiniAppIdea) => {
        try {
            // Use idea's existing creation prompt or generate an optimized one
            const effectivePrompt = idea.creationPrompt || 
                (await optimizeMiniAppPrompt(idea.description, projectDescription)).creationPrompt;
            
            // Generate code using the effective prompt
            const code = await generateMiniAppCode(effectivePrompt);
            
            // Create the mini app with the generated code
            const miniApp: MiniApp = {
                id: `miniapp-${Date.now()}`,
                title: idea.title,
                htmlContent: code,
                creationPrompt: effectivePrompt
            };
            setMiniApps(prev => [...prev, miniApp]);
            setMiniAppTabs(prev => [...prev, {
                id: `tab-${Date.now()}`,
                title: idea.title,
                miniAppId: miniApp.id,
                type: 'miniapp'
            }]);
            updateActiveArchivedProject({ miniApps, miniAppTabs });
        } catch (error) {
            console.error('Failed to create mini-app:', error);
            setError('Failed to create mini-app');
        }
    }, [setError, updateActiveArchivedProject]);

    const handleCreateCustomMiniApp = useCallback(async (userDescription: string) => {
        try {
            setIsGeneratingIdeas(true);
            const projectContext = `Custom App Request: ${userDescription}\nProject Context: ${projectDescription}`;
            const ideas = await generateMiniAppIdeas(projectContext);
            
            const initialIdea: MiniAppIdea = {
                title: userDescription.split('\n')[0].slice(0, 50) || "Custom Mini App",
                description: userDescription,
                creationPrompt: userDescription
            };
            await handleCreateMiniApp(initialIdea);
        } catch (error) {
            console.error('Failed to create custom mini-app:', error);
            setError('Failed to create custom mini-app');
        } finally {
            setIsGeneratingIdeas(false);
        }
    }, [handleCreateMiniApp, setError, setIsGeneratingIdeas, projectDescription]);

    const handleGenerateMoreMiniAppIdeas = useCallback(async () => {
        try {
            setIsGeneratingMoreIdeas(true);
            const projectContext = `${projectTitle}\n${projectDescription}`;
            const existingTitles = miniAppIdeas.map(idea => idea.title);
            const newIdeas = await generateMiniAppIdeas(projectContext);
            const validIdeas: MiniAppIdea[] = Array.isArray(newIdeas) ? newIdeas.filter(idea => 
                !existingTitles.includes(idea.title)
            ) : [];
            setMiniAppIdeas(prev => [...prev, ...validIdeas]);
        } catch (error) {
            console.error('Failed to generate more ideas:', error);
            setError('Failed to generate more mini-app ideas');
        } finally {
            setIsGeneratingMoreIdeas(false);
        }
    }, [projectTitle, projectDescription, miniAppIdeas, setError]);

    const handleCloseMiniAppTab = useCallback((tabId: string) => {
        setMiniAppTabs(prev => prev.filter(tab => tab.id !== tabId));
    }, []);

    const handleSaveMiniAppToDocs = useCallback((miniAppId: string) => {
        const miniApp = miniApps.find(app => app.id === miniAppId);
        if (!miniApp) return;

        const newDoc: PhaseDocument = {
            id: `doc-${Date.now()}`,
            phaseId: 'miniapp',
            title: `Mini-App: ${miniApp.title}`,
            content: miniApp.htmlContent,
            lastModified: new Date().toISOString()
        };
        setPhaseDocuments(prev => [...(prev || []), newDoc]);
        updateActiveArchivedProject({ phaseDocuments });
    }, [miniApps, updateActiveArchivedProject]);

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
        projectTitle,
        projectDescription,
        currentProjectId,
        interpretedDetails,
        team,
        initialAgentTasksCompleted,
        isLoadingPlan,
        newExecutionPlan,
        phaseDocuments,
        archivedProjects,
        assistantChatHistory,
        aiGeneratedTabs,
        miniAppIdeas,
        isGeneratingIdeas,
        isGeneratingMoreIdeas,
        miniApps,
        miniAppTabs,
        resetApp,
        handleProjectSubmit,
        handleGenerateNewExecutionPlan,
        handleElaborateSubTaskContent,
        handleReElaborateSubTask,
        handleElaborateEntirePhase,
        handleSearchForSubTask,
        handleSavePhaseDocumentChanges,
        handleChatHistoryChange,
        handleCreateAIGeneratedTab,
        handleCloseAIGeneratedTab,
        handleUpdateAIGeneratedTabContent,
        handleContinueInAIGeneratedTab,
        handleSaveAIGeneratedTabToDocs,
        handleClearHistory,
        handleNavigateToMiniApps,
        handleCreateMiniApp,
        handleCreateCustomMiniApp,
        handleGenerateMoreMiniAppIdeas,
        handleCloseMiniAppTab,
        handleSaveMiniAppToDocs,
        handleDownloadMiniApp,
    }), [
        projectTitle,
        projectDescription,
        currentProjectId,
        interpretedDetails,
        team,
        initialAgentTasksCompleted,
        isLoadingPlan,
        newExecutionPlan,
        phaseDocuments,
        archivedProjects,
        assistantChatHistory,
        aiGeneratedTabs,
        miniAppIdeas,
        isGeneratingIdeas,
        isGeneratingMoreIdeas,
        miniApps,
        miniAppTabs,
        resetApp,
        handleProjectSubmit,
        handleGenerateNewExecutionPlan,
        handleElaborateSubTaskContent,
        handleReElaborateSubTask,
        handleElaborateEntirePhase,
        handleSearchForSubTask,
        handleSavePhaseDocumentChanges,
        handleChatHistoryChange,
        handleCreateAIGeneratedTab,
        handleCloseAIGeneratedTab,
        handleUpdateAIGeneratedTabContent,
        handleContinueInAIGeneratedTab,
        handleSaveAIGeneratedTabToDocs,
        handleClearHistory,
        handleNavigateToMiniApps,
        handleCreateMiniApp,
        handleCreateCustomMiniApp,
        handleGenerateMoreMiniAppIdeas,
        handleCloseMiniAppTab,
        handleSaveMiniAppToDocs,
        handleDownloadMiniApp,
    ]);

    return <ProjectContext.Provider value={contextValue}>{children}</ProjectContext.Provider>;
};
