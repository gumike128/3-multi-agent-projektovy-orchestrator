import React from 'react';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { UIProvider } from '@/contexts/UIContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { ModalProvider } from '@/contexts/ModalContext';

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <SettingsProvider>
            <ModalProvider>
                <UIProvider>
                    <ProjectProvider>
                        {children}
                    </ProjectProvider>
                </UIProvider>
            </ModalProvider>
        </SettingsProvider>
    );
};