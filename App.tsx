import React from 'react';

import { AppContextProvider } from '@/contexts/AppContextProvider';
import { useSettings } from '@/contexts/SettingsContext';
import { useUI } from '@/contexts/UIContext';
import { useProject } from '@/contexts/ProjectContext';

import { ModalManager } from '@/components/ModalManager';
import { ProjectInputForm } from '@/components/ProjectInputForm';
import { TeamDisplay } from '@/components/TeamDisplay';
import { NewProjectPlanDisplay } from '@/components/NewProjectPlanDisplay';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { InterpretedDetailsCard } from '@/components/InterpretedDetailsCard';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AIChatAssistant } from '@/components/AIChatAssistant';
import { WorkspaceTabs } from '@/components/WorkspaceTabs';
import { DynamicContentViewer } from '@/components/DynamicContentViewer';
import { DocumentationWorkspace } from '@/components/DocumentationWorkspace';
import { MiniAppWorkspace } from '@/components/MiniAppWorkspace';
import { MiniAppViewer } from '@/components/MiniAppViewer';
import { UI_STRINGS, GENERIC_ICONS } from '@/constants'; 
import { RectangleGroupIcon } from '@heroicons/react/24/outline';
import type { ProjectStateForAssistant } from '@/types';

const AppContent: React.FC = () => {
    // Hooks to consume contexts
    const { settings } = useSettings();
    const { 
        isLoading, loadingMessage, error, activeView, activeTab, 
        isAssistantOpen, setActiveTab
    } = useUI();
    const {
        projectTitle, projectDescription, interpretedDetails, team, initialAgentTasksCompleted,
        newExecutionPlan, isLoadingPlan, phaseDocuments,
        assistantChatHistory, aiGeneratedTabs, miniAppTabs, miniApps,
        handleGenerateNewExecutionPlan, handleElaborateSubTaskContent, handleReElaborateSubTask,
        handleElaborateEntirePhase, handleSearchForSubTask, handleSavePhaseDocumentChanges,
        handleChatHistoryChange, handleCreateAIGeneratedTab,
        handleUpdateAIGeneratedTabContent, handleContinueInAIGeneratedTab, handleSaveAIGeneratedTabToDocs,
        resetApp, currentProjectId
    } = useProject();

    const projectStateForAssistant: ProjectStateForAssistant = {
        currentProjectId, projectTitle, projectDescription, interpretedDetails, team, newExecutionPlan, phaseDocuments, activeTab
    };

    const CreatePlanIcon = GENERIC_ICONS.CreatePlan;
    const assistantDisplayMode = settings.general.aiAssistantDisplayMode;
    
    const renderWorkspaceContent = () => {
        const currentAITab = aiGeneratedTabs.find(t => t.id === activeTab);
        if (currentAITab) {
            return <DynamicContentViewer 
                        key={currentAITab.id}
                        tab={currentAITab}
                    />;
        }

        const currentMiniAppTab = miniAppTabs.find(t => t.id === activeTab);
        if (currentMiniAppTab) {
            const miniApp = miniApps.find(m => m.id === currentMiniAppTab.miniAppId);
            if (miniApp) {
                return <MiniAppViewer key={currentMiniAppTab.id} tab={currentMiniAppTab} miniApp={miniApp} />;
            }
        }
        
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 sm:gap-8 animate-fade-in">
                        <InterpretedDetailsCard 
                            details={interpretedDetails}
                            projectTitle={projectTitle}
                            projectDescription={projectDescription}
                        />
                        {team && <TeamDisplay team={team} />}
                    </div>
                );
            case 'plan':
                 return (
                    <div className="animate-fade-in">
                        {team && initialAgentTasksCompleted && !newExecutionPlan && !isLoadingPlan && (
                            <div className="glass-panel my-6 flex justify-center p-8 text-center sm:my-8">
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-100">Prvý krok je hotový!</h3>
                                    <p className="text-slate-400 mt-2 mb-4 max-w-xl mx-auto">Tím agentov spracoval počiatočné úlohy. Teraz môžete vygenerovať podrobný exekučný plán pre váš projekt.</p>
                                    <button
                                        onClick={handleGenerateNewExecutionPlan}
                                        disabled={isLoadingPlan}
                                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center mx-auto disabled:opacity-50 disabled:cursor-wait text-base"
                                        aria-label={UI_STRINGS.generateNewPlanButton}
                                    >
                                        <CreatePlanIcon className="h-6 w-6 mr-2" />
                                        {UI_STRINGS.generateNewPlanButton}
                                    </button>
                                </div>
                            </div>
                        )}
                        {newExecutionPlan && ( 
                            <NewProjectPlanDisplay
                                plan={newExecutionPlan}
                                onElaborateSubTask={handleElaborateSubTaskContent}
                                onElaborateEntirePhase={handleElaborateEntirePhase}
                                onReElaborateSubTask={handleReElaborateSubTask}
                                onSearchForSubTask={handleSearchForSubTask}
                            />
                        )}
                    </div>
                );
            case 'docs':
                return (
                     <div className="animate-fade-in">
                        {phaseDocuments ? (
                            <DocumentationWorkspace documents={phaseDocuments} onSaveChanges={handleSavePhaseDocumentChanges} />
                        ) : (
                             <div className="glass-panel mt-6 p-8 text-center italic text-slate-300">
                                <RectangleGroupIcon className="mx-auto h-12 w-12 text-slate-500" />
                                <h3 className="mt-2 text-lg font-medium">{UI_STRINGS.noDocumentsGenerated}</h3>
                                <p className="mt-1 text-sm text-slate-500">Vygenerujte exekučný plán pre vytvorenie dokumentov.</p>
                            </div>
                        )}
                    </div>
                );
            case 'miniapps':
                return <MiniAppWorkspace />;
            case 'ai-assistant':
                 return <AIChatAssistant
                            displayMode="tab"
                            isOpen={true}
                            projectState={projectStateForAssistant}
                            chatHistory={assistantChatHistory}
                            onChatHistoryChange={handleChatHistoryChange}
                            onIncorporateSuggestion={handleCreateAIGeneratedTab}
                        />
            default:
                return null;
        }
    };

    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-slate-100">
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40">
                <div className="absolute left-[-10rem] top-[-8rem] h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
                <div className="absolute right-[-8rem] top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl" />
                <div className="absolute bottom-[-10rem] left-1/3 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
            </div>
            <Header onNewRequest={resetApp} />
            <ModalManager />
          
            <div className="relative flex-1 flex flex-row overflow-hidden">
                {assistantDisplayMode === 'sidebar-left' && (
                    <AIChatAssistant
                        displayMode="sidebar-left"
                        isOpen={isAssistantOpen}
                        projectState={projectStateForAssistant}
                        chatHistory={assistantChatHistory}
                        onChatHistoryChange={handleChatHistoryChange}
                        onIncorporateSuggestion={handleCreateAIGeneratedTab}
                    />
                )}
            
                <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300
                    ${assistantDisplayMode === 'sidebar-left' && isAssistantOpen ? 'ml-0 md:ml-[28rem]' : ''}
                    ${assistantDisplayMode === 'sidebar-right' && isAssistantOpen ? 'mr-0 md:mr-[28rem]' : ''}
                `}>
                    <div className="relative z-10 flex-grow container mx-auto w-full max-w-[1440px] px-3 py-6 sm:px-6 sm:py-8 overflow-y-auto">
                        {activeView === 'home' && !isLoading && <ProjectInputForm />}
    
                        <LoadingSpinner isLoading={isLoading || isLoadingPlan} text={loadingMessage} />
    
                        {activeView === 'workspace' && interpretedDetails && !isLoading && (
                            <div className="h-full flex flex-col">
                                <div>
                                    <ErrorMessage message={error} />
                                    <WorkspaceTabs 
                                        showAIAssistantTab={assistantDisplayMode === 'tab'}
                                    />
                                </div>
                                
                                <div className="mt-6 flex-grow min-h-0">
                                    {renderWorkspaceContent()}
                                </div>
                            </div>
                        )}
                    </div>
                    <Footer />
                </main>
    
                {assistantDisplayMode === 'sidebar-right' && (
                    <AIChatAssistant
                        displayMode="sidebar-right"
                        isOpen={isAssistantOpen}
                        projectState={projectStateForAssistant}
                        chatHistory={assistantChatHistory}
                        onChatHistoryChange={handleChatHistoryChange}
                        onIncorporateSuggestion={handleCreateAIGeneratedTab}
                    />
                )}
            </div>
    
            {assistantDisplayMode === 'fab' && activeView !== 'home' && (
                <AIChatAssistant
                    displayMode="fab"
                    isOpen={isAssistantOpen}
                    projectState={projectStateForAssistant}
                    chatHistory={assistantChatHistory}
                    onChatHistoryChange={handleChatHistoryChange}
                    onIncorporateSuggestion={handleCreateAIGeneratedTab}
                />
            )}
        </div>
    );
};


/**
 * Main application component responsible for providing contexts.
 */
const App: React.FC = () => {
    return (
        <AppContextProvider>
            <AppContent />
        </AppContextProvider>
    );
};

export default App;