import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import type { AppSettings } from '@/types';
import { getSettings as getSettingsService, saveSettings as saveSettingsService, DEFAULT_SETTINGS } from '@/services/settingsService';

interface SettingsContextType {
    settings: AppSettings;
    saveSettings: (newSettings: AppSettings) => void;
    resetSettingsToDefaults: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(getSettingsService());

    useEffect(() => {
        const body = document.body;
        if (settings.general.theme === 'light') {
            body.classList.add('light');
        } else {
            body.classList.remove('light');
        }
    }, [settings.general.theme]);

    const saveSettings = useCallback((newSettings: AppSettings) => {
        setSettings(newSettings);
        saveSettingsService(newSettings);
    }, []);
    
    const resetSettingsToDefaults = useCallback(() => {
       if (window.confirm("Naozaj chcete obnoviť všetky nastavenia na predvolené hodnoty?")) {
           setSettings(DEFAULT_SETTINGS);
           saveSettingsService(DEFAULT_SETTINGS);
       }
    }, []);

    const value = useMemo(() => ({
        settings,
        saveSettings,
        resetSettingsToDefaults
    }), [settings, saveSettings, resetSettingsToDefaults]);

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
