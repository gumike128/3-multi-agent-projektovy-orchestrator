import React, { useState, useEffect } from 'react';
import type { AIGeneratedTab } from '@/types';
import { UI_STRINGS, GENERIC_ICONS } from '@/constants';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { useProject } from '@/contexts/ProjectContext';

interface DynamicContentViewerProps {
  tab: AIGeneratedTab;
}

export const DynamicContentViewer: React.FC<DynamicContentViewerProps> = ({ tab }) => {
    const { handleUpdateAIGeneratedTabContent, handleContinueInAIGeneratedTab, handleSaveAIGeneratedTabToDocs } = useProject();
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(tab.content);
    
    useEffect(() => {
        setEditedContent(tab.content);
    }, [tab.content]);

    const handleSave = () => {
        handleUpdateAIGeneratedTabContent(tab.id, editedContent);
        setIsEditing(false);
    };

    const handleContinue = async () => {
        const instruction = window.prompt(UI_STRINGS.dynamicTabContinueWithAIPrompt);
        if (instruction) {
            await handleContinueInAIGeneratedTab(tab.id, editedContent, instruction);
        }
    };

    const EditIcon = GENERIC_ICONS.Edit;
    const SaveChangesIcon = GENERIC_ICONS.SaveChanges;
    const ContinueIcon = GENERIC_ICONS.Refine;
    const SaveToDocsIcon = GENERIC_ICONS.SaveToDocument;
    
    return (
        <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-inner border border-slate-700 flex flex-col h-full animate-fade-in">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b border-slate-700">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-purple-300">{tab.title}</h2>
                    <p className="text-sm text-slate-400">{UI_STRINGS.dynamicTabContentTitle}</p>
                </div>
                <div className="flex items-center space-x-2 mt-3 sm:mt-0 w-full sm:w-auto">
                    <button onClick={handleContinue} className="flex-1 sm:flex-none flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-3 rounded-md shadow-sm transition text-xs">
                        <ContinueIcon className="h-4 w-4 mr-1.5" /> {UI_STRINGS.dynamicTabContinueWithAI}
                    </button>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="flex-1 sm:flex-none flex items-center justify-center bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-3 rounded-md shadow-sm transition text-xs">
                            <EditIcon className="h-4 w-4 mr-1.5" /> {UI_STRINGS.editDocumentButton}
                        </button>
                    )}
                     <button onClick={() => handleSaveAIGeneratedTabToDocs(tab.id, tab.title, editedContent)} className="flex-1 sm:flex-none flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-3 rounded-md shadow-sm transition text-xs">
                        <SaveToDocsIcon className="h-4 w-4 mr-1.5" /> {UI_STRINGS.dynamicTabSaveToDocs}
                    </button>
                </div>
            </header>

            <div className="flex-grow overflow-y-auto prose prose-sm prose-invert max-w-none p-2 bg-slate-700/50 rounded-md">
                {isEditing ? (
                    <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full h-full min-h-[400px] bg-slate-900 text-slate-100 p-2 rounded-md border border-slate-600 focus:ring-sky-500 focus:border-sky-500 text-sm"
                        aria-label="Obsah na úpravu"
                    />
                ) : (
                    <MarkdownRenderer>{editedContent}</MarkdownRenderer>
                )}
            </div>

            {isEditing && (
                <footer className="mt-4 pt-4 border-t border-slate-700 flex justify-end space-x-3">
                     <button onClick={() => setIsEditing(false)} className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition text-sm">
                        Zrušiť
                    </button>
                     <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition text-sm flex items-center">
                        <SaveChangesIcon className="h-5 w-5 mr-2" />
                        {UI_STRINGS.saveDocumentChangesButton}
                    </button>
                </footer>
            )}
        </div>
    );
};