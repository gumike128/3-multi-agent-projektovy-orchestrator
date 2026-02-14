import React, { useState } from 'react';
import type { AppSettings, SettingsTab, AIAssistantDisplayMode, HeaderButtonMode } from '@/types';
import { UI_STRINGS, GENERIC_ICONS } from '@/constants';
import { useSettings } from '@/contexts/SettingsContext';
import { XMarkIcon, PaintBrushIcon, CpuChipIcon, KeyIcon, ArrowUturnLeftIcon, InformationCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsTabButton: React.FC<{
    id: SettingsTab,
    label: string,
    icon: React.ElementType,
    activeTab: SettingsTab,
    onClick: (tab: SettingsTab) => void
}> = ({ id, label, icon: Icon, activeTab, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`
            flex-grow sm:flex-grow-0 flex items-center justify-center sm:justify-start whitespace-nowrap py-3 px-2 sm:px-4 border-b-2 font-medium text-sm transition-colors duration-200
            ${activeTab === id
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-sky-300 hover:border-sky-400'
            }
        `}
        aria-current={activeTab === id ? 'page' : undefined}
    >
        <Icon className="mr-2 h-5 w-5" />
        {label}
    </button>
);

const FormField: React.FC<{ label: string, description?: string, htmlFor: string, children: React.ReactNode }> = ({ label, description, htmlFor, children }) => (
    <div>
        <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-100">
            {label}
        </label>
        {children}
        {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
    </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
    const { settings: initialSettings, saveSettings, resetSettingsToDefaults } = useSettings();
    const [settings, setSettings] = useState<AppSettings>(initialSettings);
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [showApiKey, setShowApiKey] = useState(false);
    const [showGroqApiKey, setShowGroqApiKey] = useState(false);
    const apiKeyExists = Boolean(settings.ai.apiKey?.trim());

    const handleGeneralChange = (field: string, value: any) => {
        setSettings(s => ({ ...s, general: { ...s.general, [field]: value } }));
    };

    const handleAIChange = (field: string, value: any) => {
        setSettings(s => ({ ...s, ai: { ...s.ai, [field]: value } }));
    };

    const handleModelParamChange = (field: string, value: any) => {
        setSettings(s => ({
            ...s,
            ai: {
                ...s.ai,
                modelParams: { ...s.ai.modelParams, [field]: Number(value) }
            }
        }));
    };
    
    const handleSave = () => {
        saveSettings(settings);
        onClose();
    };

    const handleReset = () => {
        resetSettingsToDefaults();
        // The context will update the state, which will flow down.
        // We can optionally close the modal after reset.
        onClose();
    };

    const modalTitleId = "settings-modal-title";

    const tabs = [
        { id: 'general' as SettingsTab, label: UI_STRINGS.settingsGeneralTab, icon: PaintBrushIcon },
        { id: 'ai' as SettingsTab, label: UI_STRINGS.settingsAITab, icon: CpuChipIcon },
        { id: 'api' as SettingsTab, label: UI_STRINGS.settingsAPITab, icon: KeyIcon }
    ];

    return (
            <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-md sm:max-w-xl md:max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 id={modalTitleId} className="text-xl sm:text-2xl font-semibold text-sky-400">{UI_STRINGS.settingsModalTitle}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-sky-400 transition-colors" title={UI_STRINGS.closeModal}>
                        <XMarkIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                    </button>
                </div>

                <div className="border-b border-slate-700">
                    <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Settings Tabs">
                        {tabs.map(tab => <SettingsTabButton key={tab.id} {...tab} activeTab={activeTab} onClick={setActiveTab} />)}
                    </nav>
                </div>

                <div className="overflow-y-auto mt-4 space-y-4 pr-1 sm:pr-2">
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-fade-in">
                           <FormField label={UI_STRINGS.settingsThemeLabel} htmlFor="theme-select">
                               <select
                                   id="theme-select"
                                   value={settings.general.theme}
                                   onChange={(e) => handleGeneralChange('theme', e.target.value)}
                                   className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                               >
                                   <option value="dark">{UI_STRINGS.settingsThemeDark}</option>
                                   <option value="light">{UI_STRINGS.settingsThemeLight}</option>
                               </select>
                           </FormField>
                           <FormField label={UI_STRINGS.settingsAIAssistantDisplayMode} htmlFor="assistant-display-mode-select">
                               <select
                                   id="assistant-display-mode-select"
                                   value={settings.general.aiAssistantDisplayMode}
                                   onChange={(e) => handleGeneralChange('aiAssistantDisplayMode', e.target.value as AIAssistantDisplayMode)}
                                   className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                               >
                                   <option value="none">{UI_STRINGS.settingsAIAssistantDisplayModeNone}</option>
                                   <option value="fab">{UI_STRINGS.settingsAIAssistantDisplayModeFab}</option>
                                   <option value="tab">{UI_STRINGS.settingsAIAssistantDisplayModeTab}</option>
                                   <option value="sidebar-left">{UI_STRINGS.settingsAIAssistantDisplayModeSidebarLeft}</option>
                                   <option value="sidebar-right">{UI_STRINGS.settingsAIAssistantDisplayModeSidebarRight}</option>
                               </select>
                           </FormField>
                            <FormField label={UI_STRINGS.settingsHeaderButtonMode} htmlFor="header-button-mode-select">
                               <select
                                   id="header-button-mode-select"
                                   value={settings.general.headerButtonMode}
                                   onChange={(e) => handleGeneralChange('headerButtonMode', e.target.value as HeaderButtonMode)}
                                   className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                               >
                                   <option value="icon-and-text">{UI_STRINGS.settingsHeaderButtonModeIconAndText}</option>
                                   <option value="icon-only">{UI_STRINGS.settingsHeaderButtonModeIconOnly}</option>
                               </select>
                           </FormField>
                        </div>
                    )}
                    {activeTab === 'ai' && (
                        <div className="space-y-6 animate-fade-in">
                             <FormField label={UI_STRINGS.settingsAITemperatureLabel} htmlFor="temperature-range" description={UI_STRINGS.settingsAITemperatureDescription}>
                                <div className="flex items-center space-x-3">
                                    <input id="temperature-range" type="range" min="0" max="1" step="0.1" value={settings.ai.modelParams.temperature} onChange={(e) => handleModelParamChange('temperature', e.target.value)} className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"/>
                                    <input type="number" value={settings.ai.modelParams.temperature} onChange={(e) => handleModelParamChange('temperature', e.target.value)} className="w-20 p-1 bg-slate-700 border border-slate-600 rounded-md text-center"/>
                                </div>
                            </FormField>
                             <FormField label={UI_STRINGS.settingsAITopPLabel} htmlFor="topP-range" description={UI_STRINGS.settingsAITopPDescription}>
                                 <div className="flex items-center space-x-3">
                                    <input id="topP-range" type="range" min="0" max="1" step="0.05" value={settings.ai.modelParams.topP} onChange={(e) => handleModelParamChange('topP', e.target.value)} className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"/>
                                    <input type="number" value={settings.ai.modelParams.topP} onChange={(e) => handleModelParamChange('topP', e.target.value)} className="w-20 p-1 bg-slate-700 border border-slate-600 rounded-md text-center"/>
                                 </div>
                            </FormField>
                             <FormField label={UI_STRINGS.settingsAITopKLabel} htmlFor="topK-input" description={UI_STRINGS.settingsAITopKDescription}>
                                <input id="topK-input" type="number" min="1" step="1" value={settings.ai.modelParams.topK} onChange={(e) => handleModelParamChange('topK', e.target.value)} className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"/>
                            </FormField>
                             <FormField label={UI_STRINGS.settingsApiCallDelay} htmlFor="delay-input" description={UI_STRINGS.settingsApiCallDelayDescription}>
                                <input id="delay-input" type="number" min="0" step="100" value={settings.ai.apiCallDelay} onChange={(e) => handleAIChange('apiCallDelay', Number(e.target.value))} className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"/>
                            </FormField>
                        </div>
                    )}
                    {activeTab === 'api' && (
                        <div className="space-y-4 animate-fade-in">
                            <h4 className="font-semibold text-lg">{UI_STRINGS.apiKeyStatus}</h4>
                            <div className={`p-4 rounded-lg flex items-center ${apiKeyExists ? 'bg-green-800/50 border-green-600' : 'bg-red-800/50 border-red-600'} border`}>
                                <InformationCircleIcon className={`h-6 w-6 mr-3 ${apiKeyExists ? 'text-green-400' : 'text-red-400'}`} />
                                <p className={apiKeyExists ? 'text-green-200' : 'text-red-200'}>
                                    {apiKeyExists ? UI_STRINGS.apiKeyDetected : UI_STRINGS.apiKeyNotDetected}
                                </p>
                            </div>

                            <FormField label={UI_STRINGS.apiKeyInputLabel} htmlFor="api-key-input" description={UI_STRINGS.apiKeyInputHelp}>
                                <div className="mt-1 flex gap-2">
                                    <input
                                        id="api-key-input"
                                        type={showApiKey ? 'text' : 'password'}
                                        value={settings.ai.apiKey}
                                        onChange={(e) => handleAIChange('apiKey', e.target.value)}
                                        placeholder={UI_STRINGS.apiKeyInputPlaceholder}
                                        className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                        autoComplete="off"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(prev => !prev)}
                                        className="px-3 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600"
                                        aria-label={showApiKey ? 'Skryť API kľúč' : 'Zobraziť API kľúč'}
                                        title={showApiKey ? 'Skryť API kľúč' : 'Zobraziť API kľúč'}
                                    >
                                        {showApiKey ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleAIChange('apiKey', '')}
                                    className="mt-2 text-xs font-semibold text-slate-300 hover:text-white"
                                >
                                    {UI_STRINGS.apiKeyClearButton}
                                </button>
                            </FormField>

                            <FormField label={UI_STRINGS.groqApiKeyInputLabel} htmlFor="groq-api-key-input" description={UI_STRINGS.groqApiKeyInputHelp}>
                                <div className="mt-1 flex gap-2">
                                    <input
                                        id="groq-api-key-input"
                                        type={showGroqApiKey ? 'text' : 'password'}
                                        value={settings.ai.groqApiKey}
                                        onChange={(e) => handleAIChange('groqApiKey', e.target.value)}
                                        placeholder={UI_STRINGS.groqApiKeyInputPlaceholder}
                                        className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                        autoComplete="off"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowGroqApiKey(prev => !prev)}
                                        className="px-3 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600"
                                        aria-label={showGroqApiKey ? 'Skryť Groq API kľúč' : 'Zobraziť Groq API kľúč'}
                                        title={showGroqApiKey ? 'Skryť Groq API kľúč' : 'Zobraziť Groq API kľúč'}
                                    >
                                        {showGroqApiKey ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleAIChange('groqApiKey', '')}
                                    className="mt-2 text-xs font-semibold text-slate-300 hover:text-white"
                                >
                                    {UI_STRINGS.groqApiKeyClearButton}
                                </button>
                            </FormField>

                             <div>
                                <h5 className="font-semibold text-md mb-2">{UI_STRINGS.apiKeyHowTo}</h5>
                                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition text-sm">
                                    {UI_STRINGS.apiKeyGetHere}
                                </a>
                             </div>
                        </div>
                    )}
                </div>
                
                <div className="mt-auto pt-4 border-t border-slate-700 flex flex-col sm:flex-row-reverse gap-3">
                    <button onClick={handleSave} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition flex items-center justify-center">
                        <GENERIC_ICONS.SaveChanges className="h-5 w-5 mr-2" />
                        {UI_STRINGS.settingsSaveButton}
                    </button>
                     <button onClick={handleReset} className="w-full sm:w-auto bg-red-800 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition flex items-center justify-center">
                        <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
                        {UI_STRINGS.settingsResetButton}
                    </button>
                    <button onClick={onClose} className="w-full sm:w-auto bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition sm:mr-auto">
                        Zrušiť
                    </button>
                </div>
            </div>
    );
};