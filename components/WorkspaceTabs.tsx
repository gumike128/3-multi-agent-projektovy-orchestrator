import React from 'react';
import type { WorkspaceTab } from '@/types';
import { UI_STRINGS, GENERIC_ICONS } from '@/constants';
import { HomeIcon, Bars3Icon, ClipboardDocumentListIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useUI } from '@/contexts/UIContext';
import { useProject } from '@/contexts/ProjectContext';

interface WorkspaceTabsProps {
    showAIAssistantTab: boolean;
}

export const WorkspaceTabs: React.FC<WorkspaceTabsProps> = React.memo(({ showAIAssistantTab }) => {
    const { activeTab, setActiveTab } = useUI();
    const { aiGeneratedTabs, miniAppTabs, handleCloseAIGeneratedTab, handleCloseMiniAppTab } = useProject();

    const staticTabs: { id: WorkspaceTab; name: string; icon: React.ElementType }[] = [
        { id: 'overview', name: 'Prehľad', icon: HomeIcon },
        { id: 'plan', name: 'Exekučný Plán', icon: Bars3Icon },
        { id: 'docs', name: 'Dokumentácia', icon: ClipboardDocumentListIcon },
        { id: 'miniapps', name: 'Miniaplikácie', icon: GENERIC_ICONS.MiniApp },
    ];
    
    if (showAIAssistantTab) {
        staticTabs.push({ id: 'ai-assistant', name: 'AI Asistent', icon: GENERIC_ICONS.AIAssistant });
    }

    return (
        <div className="border-b border-slate-700 mb-6 print:hidden">
            <nav className="-mb-px flex space-x-1 sm:space-x-2 overflow-x-auto" aria-label="Tabs">
                {staticTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            group flex-shrink-0 flex items-center whitespace-nowrap py-3 px-2 sm:px-3 border-b-2 font-medium text-sm transition-colors duration-200
                            ${activeTab === tab.id
                                ? 'border-sky-500 text-sky-400'
                                : 'border-transparent text-slate-400 hover:text-sky-300 hover:border-sky-400'
                            }
                        `}
                        aria-current={activeTab === tab.id ? 'page' : undefined}
                    >
                        <tab.icon className={`mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-sky-400' : 'text-slate-400 group-hover:text-sky-300'}`} />
                        {tab.name}
                    </button>
                ))}
                {aiGeneratedTabs.map((tab) => (
                     <div
                        key={tab.id}
                        className={`
                            group flex-shrink-0 flex items-center whitespace-nowrap py-1.5 pl-3 pr-1 my-1.5 border-b-2 font-medium text-sm transition-colors duration-200 rounded-md
                            ${activeTab === tab.id
                                ? 'border-purple-500 text-purple-300 bg-purple-900/40'
                                : 'border-transparent text-slate-400 hover:text-purple-300 hover:bg-slate-700/50'
                            }
                        `}
                     >
                        <button
                            onClick={() => setActiveTab(tab.id)}
                            className="flex items-center h-full"
                            aria-current={activeTab === tab.id ? 'page' : undefined}
                        >
                            <GENERIC_ICONS.DynamicTab className={`mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-300'}`} />
                            <span className="max-w-[120px] sm:max-w-[200px] truncate">{tab.title}</span>
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleCloseAIGeneratedTab(tab.id); }}
                            className="ml-2 p-0.5 rounded-full hover:bg-slate-600"
                            aria-label={`Zavrieť záložku ${tab.title}`}
                        >
                           <XMarkIcon className="h-4 w-4" />
                        </button>
                    </div>
                ))}
                 {miniAppTabs.map((tab) => (
                     <div
                        key={tab.id}
                        className={`
                            group flex-shrink-0 flex items-center whitespace-nowrap py-1.5 pl-3 pr-1 my-1.5 border-b-2 font-medium text-sm transition-colors duration-200 rounded-md
                            ${activeTab === tab.id
                                ? 'border-green-500 text-green-300 bg-green-900/40'
                                : 'border-transparent text-slate-400 hover:text-green-300 hover:bg-slate-700/50'
                            }
                        `}
                     >
                        <button
                            onClick={() => setActiveTab(tab.id)}
                            className="flex items-center h-full"
                            aria-current={activeTab === tab.id ? 'page' : undefined}
                        >
                            <GENERIC_ICONS.MiniApp className={`mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-green-400' : 'text-slate-400 group-hover:text-green-300'}`} />
                            <span className="max-w-[120px] sm:max-w-[200px] truncate">{tab.title}</span>
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleCloseMiniAppTab(tab.id); }}
                            className="ml-2 p-0.5 rounded-full hover:bg-slate-600"
                            aria-label={`Zavrieť záložku ${tab.title}`}
                        >
                           <XMarkIcon className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </nav>
        </div>
    );
});