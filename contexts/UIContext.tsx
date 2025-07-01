import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';
import type { WorkspaceTab } from '@/types';
import { UI_STRINGS } from '@/constants';

interface UIContextType {
    isLoading: boolean;
    loadingMessage: string;
    error: string | null;
    activeView: 'home' | 'workspace';
    activeTab: WorkspaceTab;
    isAssistantOpen: boolean;

    setLoading: (loading: boolean, message?: string) => void;
    setLoadingMessage: (message: string) => void;
    setError: (errorMessage: string | null) => void;
    setActiveView: (view: 'home' | 'workspace') => void;
    setActiveTab: (tab: WorkspaceTab) => void;
    toggleAssistant: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>(UI_STRINGS.interpretingRequest);
    const [error, setErrorState] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<'home' | 'workspace'>('home');
    const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
    const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);

    const setLoading = useCallback((loading: boolean, message: string = UI_STRINGS.interpretingRequest) => {
        setIsLoading(loading);
        if (loading) {
            setLoadingMessage(message);
        }
    }, []);

    const setError = useCallback((errorMessage: string | null) => {
        setErrorState(errorMessage);
    }, []);

    const toggleAssistant = useCallback(() => setIsAssistantOpen(p => !p), []);
    
    const value = useMemo(() => ({
        isLoading, loadingMessage, error, activeView, activeTab, isAssistantOpen,
        setLoading, setLoadingMessage, setError, setActiveView, setActiveTab, toggleAssistant
    }), [isLoading, loadingMessage, error, activeView, activeTab, isAssistantOpen,
        setLoading, setLoadingMessage, setError, setActiveView, setActiveTab, toggleAssistant
    ]);

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = (): UIContextType => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};