import React, { useState, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
import type { Chat } from '@google/genai';
import { UI_STRINGS, GENERIC_ICONS } from '@/constants';
import type { ProjectStateForAssistant, ChatMessage, Suggestion, AIAssistantDisplayMode } from '@/types';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { getInitialSuggestions, startChatSession, sendMessageToAssistant } from '@/services/aiAssistantService';
import { useUI } from '@/contexts/UIContext';

interface AIChatAssistantProps {
    isOpen: boolean;
    projectState: ProjectStateForAssistant;
    chatHistory: ChatMessage[];
    onChatHistoryChange: (newHistory: ChatMessage[]) => void;
    onIncorporateSuggestion: (title: string, content: string) => void;
    displayMode: AIAssistantDisplayMode;
}

const incorporateRegex = /\[\s*ZAPRACOVAT_ACTION\s*\][\s\S]*?Názov pre záložku\s*:\s*(.*?)\s*\[\s*\/\s*ZAPRACOVAT_ACTION\s*\]/is;

export const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ 
    isOpen, projectState, chatHistory, onChatHistoryChange, onIncorporateSuggestion, displayMode 
}) => {
    const { toggleAssistant } = useUI();
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
    const [suggestionsLoadedForProject, setSuggestionsLoadedForProject] = useState<string | null>(null);
    const [suggestionPreferences, setSuggestionPreferences] = useState<string>('');
    
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatHistoryRef = useRef(chatHistory);

    const AssistantIcon = GENERIC_ICONS.AIAssistant;
    const SendIcon = GENERIC_ICONS.Send;
    const IncorporateIcon = GENERIC_ICONS.Incorporate;
    const RefreshIcon = GENERIC_ICONS.Refresh;
    
    useEffect(() => {
        chatHistoryRef.current = chatHistory;
    }, [chatHistory]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isOpen]);

    useEffect(() => {
        if (projectState.currentProjectId) {
            chatRef.current = startChatSession(chatHistory);
            if ((isOpen || displayMode === 'tab') && chatHistory.length === 0) {
                onChatHistoryChange([{ id: `msg-${nanoid()}`, role: 'assistant', content: UI_STRINGS.aiAssistantWelcome }]);
            }
        }
    }, [projectState.currentProjectId, isOpen, onChatHistoryChange, chatHistory.length, displayMode]);

    useEffect(() => {
        const isVisible = isOpen || displayMode === 'tab';

        const fetchSuggestions = async () => {
            if (isVisible && projectState.currentProjectId && projectState.currentProjectId !== suggestionsLoadedForProject && !suggestionsLoading) {
                setSuggestionsLoading(true);
                setSuggestionsError(null);
                setSuggestions([]);
                setSuggestionsLoadedForProject(projectState.currentProjectId); 
                
                try {
                    const fetchedSuggestions = await getInitialSuggestions(projectState, suggestionPreferences);
                    setSuggestions(fetchedSuggestions);
                } catch (error) {
                    console.error("Error getting initial suggestions:", error);
                    setSuggestionsError(error instanceof Error ? error.message : UI_STRINGS.aiAssistantError);
                } finally {
                    setSuggestionsLoading(false);
                }
            }
        };

        fetchSuggestions();
    }, [isOpen, displayMode, projectState, suggestionsLoadedForProject, suggestionsLoading, suggestionPreferences]);

    const handleSendMessage = async (messageText: string, isSuggestionFollowUp: boolean = false): Promise<void> => {
        if (!messageText.trim() || isGenerating || !chatRef.current) return;

        const userMessage: ChatMessage = { id: `msg-${nanoid()}`, role: 'user', content: messageText };
        const updatedHistoryWithUser = [...chatHistoryRef.current, userMessage];
        onChatHistoryChange(updatedHistoryWithUser);
        
        setInputValue('');
        setIsGenerating(true);

        const assistantMessageId = `msg-${nanoid()}`;
        let assistantResponse = '';
        
        onChatHistoryChange([...updatedHistoryWithUser, { id: assistantMessageId, role: 'assistant', content: '' }]);

        try {
            const stream = await sendMessageToAssistant(chatRef.current, messageText, projectState, isSuggestionFollowUp);
            
            for await (const chunk of stream) {
                assistantResponse += chunk.text;
                 onChatHistoryChange(chatHistoryRef.current.map(msg => 
                    msg.id === assistantMessageId ? { ...msg, content: assistantResponse + '...' } : msg
                ));
            }

            onChatHistoryChange(chatHistoryRef.current.map(msg => 
                msg.id === assistantMessageId ? { ...msg, content: assistantResponse } : msg
            ));

        } catch (error) {
            console.error("Assistant chat error:", error);
            const errorMessage = error instanceof Error && error.message.includes('429') ? UI_STRINGS.rateLimitError : UI_STRINGS.aiAssistantError;
            onChatHistoryChange(chatHistoryRef.current.map(msg => 
                msg.id === assistantMessageId ? { ...msg, content: errorMessage } : msg
            ));
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleRegenerateSuggestions = (): void => {
        if (!suggestionsLoading && !isGenerating) {
            setSuggestionsLoadedForProject(null);
        }
    };

    const handleUpdatePreferences = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
        setSuggestionPreferences(e.target.value);
        setSuggestionsLoadedForProject(null); // Trigger reload with new preferences
    };

    const ChatPanel = (
         <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {chatHistory.map((msg: ChatMessage) => {
                const match = msg.content.match(incorporateRegex);
                const showIncorporate = !!match;
                
                let tabTitle = '';
                if (match && typeof match[1] === 'string') {
                    let extracted = match[1].trim();
                    if ((extracted.startsWith('"') && extracted.endsWith('"')) || (extracted.startsWith("'") && extracted.endsWith("'"))) {
                        tabTitle = extracted.slice(1, -1);
                    } else {
                        tabTitle = extracted;
                    }
                }

                const cleanContent = showIncorporate ? msg.content.replace(incorporateRegex, '').trim() : msg.content;

                return (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-end gap-2 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                           {msg.role === 'assistant' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white"><AssistantIcon className="w-5 h-5"/></div>}
                            <div className={`max-w-[85%] rounded-lg px-3 py-2 ${msg.role === 'user' ? 'bg-sky-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-100 rounded-bl-none'}`}>
                                <div className="prose prose-sm prose-invert max-w-none">
                                    <MarkdownRenderer>{cleanContent || '...'}</MarkdownRenderer>
                                </div>
                            </div>
                        </div>
                        {showIncorporate && (
                            <button
                                onClick={() => onIncorporateSuggestion(tabTitle, cleanContent)}
                                className="mt-2 flex items-center bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-md transition-all"
                            >
                                <IncorporateIcon className="h-4 w-4 mr-1.5" />
                                {UI_STRINGS.incorporateSuggestion}
                            </button>
                        )}
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
    );

    const SuggestionsPanel = (
        <div className="p-4 border-t border-slate-700 flex-shrink-0">
            {suggestionsLoading && (
                <div className="text-center text-xs text-slate-400 p-2 flex items-center justify-center">
                    <GENERIC_ICONS.Processing className="animate-spin h-4 w-4 mr-2" />
                    Načítavam návrhy...
                </div>
            )}
            {suggestionsError && (
                <div className="text-center text-xs text-red-400 bg-red-900/50 p-2 rounded-md border border-red-800">{suggestionsError}</div>
            )}
            {suggestions.length > 0 && !suggestionsLoading && (
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs text-slate-400 font-semibold">{UI_STRINGS.aiAssistantSuggestionsTitle}</h4>
                        <button
                            onClick={handleRegenerateSuggestions}
                            disabled={isGenerating || suggestionsLoading}
                            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
                            title="Obnoviť návrhy"
                            aria-label="Obnoviť návrhy"
                        >
                            <RefreshIcon className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleSendMessage(s.prompt, true)}
                                disabled={isGenerating}
                                className="bg-slate-600/50 hover:bg-slate-600 text-slate-200 text-xs text-left font-medium py-1.5 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {s.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
    
    const InputPanel = (
         <div className="p-4 border-t border-slate-700 flex-shrink-0">
            <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); handleSendMessage(inputValue, false); }} className="flex items-center gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                    placeholder={UI_STRINGS.aiAssistantChatPlaceholder}
                    disabled={isGenerating}
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-sky-500"
                />
                <button type="submit" disabled={isGenerating || !inputValue.trim()} className="bg-sky-600 hover:bg-sky-700 text-white rounded-lg p-2 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors">
                    <SendIcon className="h-5 w-5" />
                </button>
            </form>
        </div>
    );

    const PanelContent = (
        <>
            <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
                <h3 className="text-lg font-semibold text-purple-300 flex items-center">
                    <AssistantIcon className="h-6 w-6 mr-2"/>
                    {UI_STRINGS.aiAssistantTitle}
                </h3>
                {displayMode !== 'tab' && <button onClick={toggleAssistant} className="text-slate-400 hover:text-white">&times;</button>}
            </header>
            {ChatPanel}
            <div className="p-4 border-t border-slate-700 flex-shrink-0">
                <h4 className="text-xs text-slate-400 font-semibold mb-2">Suggestion Preferences</h4>
                <textarea
                    value={suggestionPreferences}
                    onChange={handleUpdatePreferences}
                    placeholder="Enter topics or areas for AI suggestions (e.g., UI design, data analysis)"
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-sky-500 mb-3"
                    rows={2}
                    disabled={isGenerating || suggestionsLoading}
                />
            </div>
            {SuggestionsPanel}
            {InputPanel}
        </>
    );

    if (displayMode === 'fab') {
        return (
            <>
                <button
                    onClick={toggleAssistant}
                    className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg z-40 transition-transform hover:scale-110"
                    aria-label={UI_STRINGS.aiAssistantTitle}
                >
                    <AssistantIcon className="h-8 w-8" />
                </button>
                <div className={`fixed bottom-24 right-6 w-[90vw] max-w-md h-[70vh] max-h-[700px] bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
                   {PanelContent}
                </div>
            </>
        );
    }

    if (displayMode.startsWith('sidebar')) {
        const side = displayMode === 'sidebar-left' ? 'left-0' : 'right-0';
        return (
            <aside className={`fixed top-0 h-full w-full md:w-[28rem] bg-slate-800 border-slate-700 flex flex-col z-30 transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : (displayMode === 'sidebar-left' ? '-translate-x-full' : 'translate-x-full')}
                ${displayMode === 'sidebar-left' ? 'border-r' : 'border-l'}
                ${side}`}
            >
                {PanelContent}
            </aside>
        );
    }
    
    if (displayMode === 'tab') {
         return (
            <div className="bg-slate-800 rounded-xl shadow-inner h-full flex flex-col border border-slate-700">
                {ChatPanel}
                {SuggestionsPanel}
                {InputPanel}
            </div>
        );
    }

    return null;
};
