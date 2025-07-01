import React from 'react';
import { UI_STRINGS, GENERIC_ICONS } from '@/constants';
import { SquaresPlusIcon } from '@heroicons/react/24/solid';
import { useUI } from '@/contexts/UIContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useModal } from '@/contexts/ModalContext';
import { useProject } from '@/contexts/ProjectContext';


export const Header: React.FC<{ onNewRequest: () => void; }> = React.memo(({ onNewRequest }) => {
  const { toggleAssistant, activeView } = useUI();
  const { handleNavigateToMiniApps } = useProject();
  const { settings } = useSettings();
  const { openModal } = useModal();
  
  const HistoryIcon = GENERIC_ICONS.History;
  const SettingsIcon = GENERIC_ICONS.Settings;
  const NewRequestIcon = GENERIC_ICONS.NewRequest;
  const AssistantIcon = GENERIC_ICONS.AIAssistant;
  const MiniAppIcon = GENERIC_ICONS.MiniApp;

  const isSidebarMode = settings.general.aiAssistantDisplayMode.startsWith('sidebar');
  const showButtonText = settings.general.headerButtonMode === 'icon-and-text';

  const iconMarginClass = showButtonText ? 'mr-0 sm:mr-2' : '';
  const textSpanClass = showButtonText ? 'hidden sm:inline' : 'hidden';

  return (
    <header className="bg-slate-900/80 backdrop-blur-md shadow-lg sticky top-0 z-40 print:hidden">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <SquaresPlusIcon className="h-8 w-8 sm:h-10 sm:w-10 text-sky-500 mr-2 sm:mr-3"/>
          <h1 className="text-xl sm:text-2xl font-bold text-sky-400 tracking-tight">
            {UI_STRINGS.appName}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
            <button
              onClick={onNewRequest}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center text-sm"
              title={UI_STRINGS.newRequest}
              aria-label={UI_STRINGS.newRequest}
            >
              <NewRequestIcon className={`h-5 w-5 ${iconMarginClass}`} />
              <span className={textSpanClass}>{UI_STRINGS.newRequest}</span>
            </button>
            <button
              onClick={handleNavigateToMiniApps}
              disabled={activeView === 'home'}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title={UI_STRINGS.createMiniApp}
              aria-label={UI_STRINGS.createMiniApp}
            >
                <MiniAppIcon className={`h-5 w-5 ${iconMarginClass}`} />
                <span className={textSpanClass}>{UI_STRINGS.createMiniApp}</span>
            </button>
            <button
              onClick={() => openModal('history')}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center text-sm"
              title={UI_STRINGS.projectHistory}
              aria-label={UI_STRINGS.projectHistory}
            >
              <HistoryIcon className={`h-5 w-5 ${iconMarginClass}`} />
              <span className={textSpanClass}>{UI_STRINGS.projectHistory}</span>
            </button>
             <button
              onClick={() => openModal('settings')}
              className="settings-button bg-slate-700 hover:bg-slate-600 font-semibold p-2 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
              title={UI_STRINGS.settings}
              aria-label={UI_STRINGS.settings}
            >
              <SettingsIcon className="h-5 w-5" />
            </button>
            {isSidebarMode && (
                <button
                onClick={toggleAssistant}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold p-2 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
                title={UI_STRINGS.aiAssistantTitle}
                aria-label={UI_STRINGS.aiAssistantTitle}
              >
                <AssistantIcon className="h-5 w-5" />
              </button>
            )}
        </div>
      </div>
    </header>
  );
});