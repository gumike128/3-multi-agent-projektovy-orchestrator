import React, { useState, useEffect } from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { NewExecutionPhase, NewSubTask, AgentRole } from '@/types';
import { UI_STRINGS, GENERIC_ICONS, AGENT_ROLE_DETAILS } from '@/constants';
import { ChevronDownIcon, ChevronUpIcon, BeakerIcon, DocumentTextIcon, MagnifyingGlassIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface NewProjectPlanDisplayProps {
    plan: NewExecutionPhase[] | null;
    onElaborateSubTask: (phaseId: string, subTaskId: string, isBatch?: boolean) => Promise<boolean>;
    onElaborateEntirePhase: (phaseId: string) => Promise<void>;
    onReElaborateSubTask: (phaseId: string, subTaskId: string) => Promise<boolean>;
    onSearchForSubTask: (phaseId: string, subTaskId: string, query: string) => Promise<boolean>;
}

interface SubTaskDetailTabsProps {
    subTask: NewSubTask;
    phaseId: string;
    onSearch: (phaseId: string, subTaskId: string, query: string) => Promise<boolean>;
}

const SubTaskDetailTabs: React.FC<SubTaskDetailTabsProps> = ({ subTask, phaseId, onSearch }) => {
    const [activeTab, setActiveTab] = useState<'content' | 'search' | 'details'>('content');

    const handleSearch = () => {
        const query = window.prompt(UI_STRINGS.searchPromptTitle, `${UI_STRINGS.searchPromptDefault}${subTask.title}`);
        if (query) {
            onSearch(phaseId, subTask.id, query);
        }
    };
    
    return (
        <div className="mt-3 bg-slate-800/50 rounded-lg p-3">
            <div className="border-b border-slate-700">
                <nav className="-mb-px flex space-x-4" aria-label="SubTask Tabs">
                    <button onClick={() => setActiveTab('content')} className={`flex items-center py-2 px-1 border-b-2 text-xs font-medium ${activeTab === 'content' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-sky-300'}`}><BeakerIcon className="h-4 w-4 mr-1.5" /> Obsah</button>
                    <button onClick={() => setActiveTab('search')} className={`flex items-center py-2 px-1 border-b-2 text-xs font-medium ${activeTab === 'search' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-sky-300'}`}><MagnifyingGlassIcon className="h-4 w-4 mr-1.5" /> Vyhľadávanie</button>
                    <button onClick={() => setActiveTab('details')} className={`flex items-center py-2 px-1 border-b-2 text-xs font-medium ${activeTab === 'details' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-sky-300'}`}><DocumentTextIcon className="h-4 w-4 mr-1.5" /> Detaily</button>
                </nav>
            </div>
            <div className="pt-3">
                {activeTab === 'content' && (
                    <div className="prose prose-sm prose-invert max-w-none">
                        {subTask.elaboratedContent ? <MarkdownRenderer>{subTask.elaboratedContent}</MarkdownRenderer> : <p className="italic text-slate-400">Obsah ešte nebol vygenerovaný.</p>}
                    </div>
                )}
                {activeTab === 'search' && (
                    <div>
                        <button onClick={handleSearch} className="mb-3 w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-1.5 px-3 rounded-md shadow-sm transition duration-150 ease-in-out flex items-center justify-center">
                            <GENERIC_ICONS.Search className="h-4 w-4 mr-1.5" /> {UI_STRINGS.searchRelatedInfoButton}
                        </button>
                        {subTask.searchResults ? (
                            <div className="bg-slate-900/50 p-2 rounded-md">
                                {subTask.searchResults.text ? <div className="prose prose-xs prose-invert max-w-none"><MarkdownRenderer>{subTask.searchResults.text}</MarkdownRenderer></div> : <p className="text-xs text-slate-400 italic">{UI_STRINGS.searchNoResults}</p>}
                                {subTask.searchResults.sources && subTask.searchResults.sources.length > 0 && (
                                    <div>
                                        <h6 className="text-xs font-semibold text-sky-300 mb-1 mt-2">Zdroje:</h6>
                                        <ul className="list-disc list-inside space-y-0.5">{subTask.searchResults.sources.map((s, i) => s.uri && <li key={i} className="text-xs"><a href={s.uri} target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:underline">{s.title || s.uri}</a></li>)}</ul>
                                    </div>
                                )}
                            </div>
                        ) : <p className="text-xs text-slate-400 italic">Pre túto pod-úlohu zatiaľ neprebehlo žiadne vyhľadávanie.</p>}
                    </div>
                )}
                 {activeTab === 'details' && (
                    <div>
                        <h6 className="text-xs font-semibold text-sky-300 mb-1">Inštrukcia pre elaboráciu (Prompt):</h6>
                        <p className="text-xs text-slate-300 bg-slate-900/50 p-2 rounded-md">"{subTask.elaborationPrompt}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};


interface SubTaskCardProps {
    subTask: NewSubTask;
    phaseId: string;
    onElaborate: (phaseId: string, subTaskId: string, isBatch?: boolean) => Promise<boolean>;
    onReElaborate: (phaseId: string, subTaskId: string) => Promise<boolean>;
    onSearch: (phaseId: string, subTaskId: string, query: string) => Promise<boolean>;
    onFeedback?: (phaseId: string, subTaskId: string, feedback: 'positive' | 'negative') => void;
}

const SubTaskCard: React.FC<SubTaskCardProps> = React.memo(({ subTask, phaseId, onElaborate, onReElaborate, onSearch, onFeedback }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const roleDetails = subTask.assignedAgentRoleHint ? AGENT_ROLE_DETAILS[subTask.assignedAgentRoleHint as AgentRole] : null;
    const isProcessing = subTask.status === 'GeneratingSubTask';
    
    let statusText = UI_STRINGS.subTaskStatusPending;
    let statusColor = "text-slate-400";
    switch (subTask.status) {
        case 'GeneratingSubTask': statusText = UI_STRINGS.subTaskStatusGenerating; statusColor = "text-yellow-400"; break;
        case 'SavedToDocument': statusText = UI_STRINGS.subTaskStatusSavedToDocument; statusColor = "text-teal-400"; break;
    }

    return (
        <div className="bg-slate-700/80 p-3 rounded-lg border border-slate-600">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <h5 className="font-semibold text-slate-100">{subTask.title}</h5>
                     {roleDetails && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleDetails.base} ${roleDetails.textColor}`}>{subTask.assignedAgentRoleHint}</span>}
                </div>
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 text-slate-400 hover:text-sky-300">
                    {isExpanded ? <ChevronUpIcon className="h-5 w-5"/> : <ChevronDownIcon className="h-5 w-5"/>}
                </button>
            </div>
            <p className={`text-xs font-medium ${statusColor} mt-2`}>Status: {statusText} {isProcessing && <GENERIC_ICONS.Processing className="inline-block animate-spin h-3 w-3 ml-1" />}</p>
            
            {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-600">
                    <div className="flex flex-wrap gap-2 items-center mb-3">
                        {subTask.status === 'Pending' && !isProcessing && (
                            <button onClick={() => onElaborate(phaseId, subTask.id, false)} className="flex-grow sm:flex-grow-0 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold py-1.5 px-3 rounded-md shadow-sm transition flex items-center justify-center">
                                <GENERIC_ICONS.ElaborateTask className="h-4 w-4 mr-1.5" /> {UI_STRINGS.elaborateSubTaskButton}
                            </button>
                        )}
                        {(subTask.status === 'SavedToDocument' || subTask.status === 'Pending') && !isProcessing && (
                             <button onClick={() => onReElaborate(phaseId, subTask.id)} className="flex-grow sm:flex-grow-0 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold py-1.5 px-3 rounded-md shadow-sm transition flex items-center justify-center">
                                <GENERIC_ICONS.ReElaborateTask className="h-4 w-4 mr-1.5" /> {UI_STRINGS.reElaborateSubTaskButton}
                            </button>
                        )}
                        {subTask.status === 'SavedToDocument' && onFeedback && (
                            <>
                                <button onClick={() => onFeedback(phaseId, subTask.id, 'positive')} className="flex-grow sm:flex-grow-0 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1.5 px-3 rounded-md shadow-sm transition flex items-center justify-center">
                                    <CheckIcon className="h-4 w-4 mr-1.5" /> Positive Feedback
                                </button>
                                <button onClick={() => onFeedback(phaseId, subTask.id, 'negative')} className="flex-grow sm:flex-grow-0 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1.5 px-3 rounded-md shadow-sm transition flex items-center justify-center">
                                    <XMarkIcon className="h-4 w-4 mr-1.5" /> Negative Feedback
                                </button>
                            </>
                        )}
                    </div>
                    <SubTaskDetailTabs subTask={subTask} phaseId={phaseId} onSearch={onSearch} />
                </div>
            )}
        </div>
    );
});


interface PhaseContentProps extends NewProjectPlanDisplayProps {
    phase: NewExecutionPhase;
}

const PhaseContent: React.FC<PhaseContentProps> = React.memo(({ phase, onElaborateSubTask, onElaborateEntirePhase, onReElaborateSubTask, onSearchForSubTask }) => {
    const hasPending = phase.subTasks.some(st => st.status === 'Pending');
    const showElaboratePhaseButton = phase.phaseExecutionStatus === 'Idle' && hasPending;
    const completedSubTasks = phase.subTasks.filter(st => st.status === 'SavedToDocument').length;
    const totalSubTasks = phase.subTasks.length;
    const progressPercentage = totalSubTasks > 0 ? (completedSubTasks / totalSubTasks) * 100 : 0;

    return (
        <div className="bg-slate-800 p-3 sm:p-4 rounded-lg shadow-xl border border-slate-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="w-full sm:flex-grow flex items-center text-left p-2 bg-slate-700/50 rounded-md">
                    <GENERIC_ICONS.Phase className="h-6 w-6 mr-3 text-sky-400 flex-shrink-0" />
                    <div className="flex-grow">
                        <h4 className="text-md sm:text-lg font-semibold text-sky-300">{phase.title}</h4>
                        <p className="text-xs text-slate-400">{phase.objective}</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                    {showElaboratePhaseButton && <button onClick={() => onElaborateEntirePhase(phase.id)} disabled={phase.phaseExecutionStatus === 'ProcessingSubTasks'} className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-3 rounded-md shadow-sm transition flex items-center justify-center disabled:opacity-50"><GENERIC_ICONS.ElaboratePhase className="h-4 w-4 mr-1.5" /> {UI_STRINGS.elaborateEntirePhaseButton}</button>}
                </div>
            </div>
            <div className="px-2 mb-2">
                <p className="text-xs text-slate-300 mb-1">{UI_STRINGS.subTaskProgress}: {completedSubTasks}/{totalSubTasks}</p>
                <div className="w-full bg-slate-600 rounded-full h-2"><div className="bg-sky-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div></div>
            </div>
            <div className="space-y-3 pl-1 sm:pl-2 pt-2 border-l-0 sm:border-l-2 border-slate-700 sm:ml-1">
                {phase.subTasks.map(subTask => (
                    <SubTaskCard 
                        key={subTask.id} 
                        subTask={subTask} 
                        phaseId={phase.id} 
                        onElaborate={onElaborateSubTask}
                        onReElaborate={onReElaborateSubTask}
                        onSearch={onSearchForSubTask}
                    />
                ))}
            </div>
        </div>
    );
});

export const NewProjectPlanDisplay: React.FC<NewProjectPlanDisplayProps> = (props) => {
    const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ [key: string]: 'positive' | 'negative' | null }>({});

    const handleFeedback = (phaseId: string, subTaskId: string, type: 'positive' | 'negative') => {
        const key = `${phaseId}-${subTaskId}`;
        setFeedback(prev => ({ ...prev, [key]: type }));
        // Here you would typically send this feedback to a service or context for further processing
        console.log(`Feedback for ${key}: ${type}`);
    };

    useEffect(() => {
        if (props.plan && props.plan.length > 0 && !activePhaseId) {
            setActivePhaseId(props.plan[0].id);
        } else if (props.plan && props.plan.length > 0 && activePhaseId && !props.plan.find(p => p.id === activePhaseId)) {
             setActivePhaseId(props.plan[0].id);
        }
    }, [props.plan, activePhaseId]);

    if (!props.plan || props.plan.length === 0) {
        return <div className="text-center text-slate-400 italic mt-6">Exekučný plán ešte nebol vygenerovaný.</div>;
    }

    const activePhase = props.plan.find(p => p.id === activePhaseId);

    return (
        <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-sky-400 text-center mb-3 sm:mb-4">{UI_STRINGS.newExecutionPlanTitle}</h2>
            
            <div className="border-b border-slate-700">
                <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto pb-1" aria-label="Fázy">
                    {props.plan.map(phase => (
                        <button
                            key={phase.id}
                            onClick={() => setActivePhaseId(phase.id)}
                            className={`
                                flex-shrink-0 flex items-center whitespace-nowrap py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200
                                ${activePhaseId === phase.id
                                    ? 'border-sky-500 text-sky-400'
                                    : 'border-transparent text-slate-400 hover:text-sky-300 hover:border-sky-400'
                                }
                            `}
                            aria-current={activePhaseId === phase.id ? 'page' : undefined}
                        >
                            <GENERIC_ICONS.Phase className="mr-2 h-4 w-4" />
                            {phase.title}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="mt-4">
                {activePhase && (
                    <PhaseContent 
                        key={activePhase.id} 
                        phase={activePhase}
                        onFeedback={handleFeedback}
                        {...props}
                    />
                )}
            </div>
        </div>
    );
};
