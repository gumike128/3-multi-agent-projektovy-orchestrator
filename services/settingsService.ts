import type { AppSettings, GeneralSettings } from '@/types';
import { LOCAL_STORAGE_SETTINGS_KEY } from '@/constants';

export const DEFAULT_SETTINGS: AppSettings = {
    general: {
        theme: 'dark',
        aiAssistantDisplayMode: 'fab',
        headerButtonMode: 'icon-and-text',
    },
    ai: {
        modelParams: {
            temperature: 0.7,
            topP: 1,
            topK: 32,
        },
        apiCallDelay: 1000,
    }
};

export const getSettings = (): AppSettings => {
    try {
        const serializedState = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
        if (serializedState === null) {
            return DEFAULT_SETTINGS;
        }
        const storedSettings = JSON.parse(serializedState);
        // Merge with defaults to ensure all keys are present, even after an update
        return {
            ...DEFAULT_SETTINGS,
            ...storedSettings,
            general: {
                ...DEFAULT_SETTINGS.general,
                ...storedSettings.general,
            },
            ai: {
                ...DEFAULT_SETTINGS.ai,
                ...storedSettings.ai,
                modelParams: {
                    ...DEFAULT_SETTINGS.ai.modelParams,
                    ...storedSettings.ai?.modelParams,
                },
            },
        };
    } catch (error) {
        console.error("Could not load settings from local storage:", error);
        return DEFAULT_SETTINGS;
    }
};

export const saveSettings = (settings: AppSettings): void => {
    try {
        const serializedState = JSON.stringify(settings);
        localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, serializedState);
    } catch (error) {
        console.error("Could not save settings to local storage:", error);
    }
};

export const resetSettings = (): void => {
    try {
        localStorage.removeItem(LOCAL_STORAGE_SETTINGS_KEY);
    } catch (error) {
        console.error("Could not clear settings from local storage:", error);
    }
};

export const getApiKeyStatus = (): boolean => {
    const apiKey = process.env.API_KEY;
    return typeof apiKey === 'string' && apiKey.trim() !== '';
};