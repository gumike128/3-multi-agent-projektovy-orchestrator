import React, { useState } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { UI_STRINGS, GENERIC_ICONS } from '@/constants';
import type { MiniAppIdea } from '@/types';
import { SparklesIcon } from '@heroicons/react/24/solid';

const IdeaCard: React.FC<{ idea: MiniAppIdea, onCreate: (idea: MiniAppIdea) => void, isCreating: boolean }> = ({ idea, onCreate, isCreating }) => (
    <div className="bg-slate-700/80 p-4 rounded-lg shadow-lg border border-slate-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-grow">
            <h4 className="font-semibold text-green-300">{idea.title}</h4>
            <p className="text-sm text-slate-300 mt-1">{idea.description}</p>
        </div>
        <button 
            onClick={() => onCreate(idea)} 
            disabled={isCreating}
            className="w-full sm:w-auto flex-shrink-0 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-wait"
        >
            <GENERIC_ICONS.MiniApp className="h-5 w-5 mr-2" />
            {UI_STRINGS.createMiniAppButton}
        </button>
    </div>
);

const CustomAppCreator: React.FC = () => {
    const { handleCreateCustomMiniApp, isLoadingPlan } = useProject();
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (description.trim()) {
            handleCreateCustomMiniApp(description);
        }
    };
    
    return (
        <div className="mb-8 p-4 bg-slate-700/50 rounded-xl border border-slate-600">
            <form onSubmit={handleSubmit}>
                <label htmlFor="custom-miniapp-desc" className="block text-sm font-medium text-sky-300 mb-2">
                    {UI_STRINGS.customMiniAppInputLabel}
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        id="custom-miniapp-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Napr. kalkulačka na výpočet úrokov..."
                        className="flex-grow p-3 bg-slate-700 border border-slate-500 rounded-lg text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out"
                        disabled={isLoadingPlan}
                    />
                    <button
                        type="submit"
                        disabled={isLoadingPlan || !description.trim()}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-5 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-wait"
                    >
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        {UI_STRINGS.optimizeAndCreateButton}
                    </button>
                </div>
            </form>
        </div>
    );
}

export const MiniAppWorkspace: React.FC = () => {
    const { 
        miniAppIdeas, 
        isGeneratingIdeas, 
        isGeneratingMoreIdeas,
        handleCreateMiniApp, 
        handleGenerateMoreMiniAppIdeas,
        isLoadingPlan 
    } = useProject();

    return (
        <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-inner border border-slate-700 h-full flex flex-col animate-fade-in">
             <header className="mb-6 pb-4 border-b border-slate-700">
                <h2 className="text-xl sm:text-2xl font-bold text-green-400 flex items-center">
                    <GENERIC_ICONS.MiniApp className="h-8 w-8 mr-3" />
                    {UI_STRINGS.miniAppWorkspaceTitle}
                </h2>
                <p className="text-slate-400 mt-1">
                    Vytvorte si vlastnú miniaplikáciu alebo si vyberte z AI generovaných návrhov prispôsobených vášmu projektu.
                </p>
            </header>
            
            <CustomAppCreator />

            <div className="flex-grow overflow-y-auto pr-2">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">{UI_STRINGS.miniAppIdeasTitle}</h3>
                
                {isGeneratingIdeas && (
                    <div className="flex items-center justify-center text-slate-400 p-8">
                        <GENERIC_ICONS.Processing className="animate-spin h-6 w-6 mr-3" />
                        <span>{UI_STRINGS.generatingMiniAppIdeas}</span>
                    </div>
                )}

                {!isGeneratingIdeas && miniAppIdeas.length > 0 && (
                    <div className="space-y-4">
                        {miniAppIdeas.map((idea, index) => (
                            <IdeaCard 
                                key={index} 
                                idea={idea} 
                                onCreate={handleCreateMiniApp}
                                isCreating={isLoadingPlan}
                            />
                        ))}
                    </div>
                )}
                
                {!isGeneratingIdeas && miniAppIdeas.length > 0 && (
                    <div className="mt-8 text-center">
                        <button 
                            onClick={handleGenerateMoreMiniAppIdeas}
                            disabled={isGeneratingMoreIdeas || isLoadingPlan}
                            className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-6 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-wait mx-auto"
                        >
                            {isGeneratingMoreIdeas ? (
                                <>
                                 <GENERIC_ICONS.Processing className="animate-spin h-5 w-5 mr-2" />
                                 {UI_STRINGS.generatingMoreSuggestions}
                                </>
                            ) : (
                                UI_STRINGS.moreSuggestionsButton
                            )}
                        </button>
                    </div>
                )}

                {!isGeneratingIdeas && miniAppIdeas.length === 0 && (
                     <div className="text-center text-slate-500 italic p-8 border-2 border-dashed border-slate-700 rounded-lg">
                        <p>Pre tento projekt sa nepodarilo vygenerovať žiadne sugestívne návrhy.</p>
                        <p className="text-xs mt-1">Skúste pridať detailnejší popis projektu alebo si vytvorte vlastnú miniaplikáciu vyššie.</p>
                    </div>
                )}
            </div>
        </div>
    );
};