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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl print:hidden">
      <div className="container mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-xl border border-sky-300/20 bg-sky-400/10 p-2">
            <SquaresPlusIcon className="h-7 w-7 text-sky-300 sm:h-8 sm:w-8" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight text-sky-100 sm:text-xl">
              {UI_STRINGS.appName}
            </h1>
            <p className="hidden text-xs text-slate-400 sm:block">AI orchestrácia projektov • moderný workspace</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={onNewRequest}
            className="btn-primary text-sm"
            title={UI_STRINGS.newRequest}
            aria-label={UI_STRINGS.newRequest}
          >
            <NewRequestIcon className={`h-5 w-5 ${iconMarginClass}`} />
            <span className={textSpanClass}>{UI_STRINGS.newRequest}</span>
          </button>
          <button
            onClick={handleNavigateToMiniApps}
            disabled={activeView === 'home'}
            className="inline-flex items-center rounded-xl border border-emerald-300/20 bg-emerald-500/80 px-3 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            title={UI_STRINGS.createMiniApp}
            aria-label={UI_STRINGS.createMiniApp}
          >
            <MiniAppIcon className={`h-5 w-5 ${iconMarginClass}`} />
            <span className={textSpanClass}>{UI_STRINGS.createMiniApp}</span>
          </button>
          <button
            onClick={() => openModal('history')}
            className="inline-flex items-center rounded-xl border border-cyan-300/20 bg-cyan-500/80 px-3 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-cyan-400"
            title={UI_STRINGS.projectHistory}
            aria-label={UI_STRINGS.projectHistory}
          >
            <HistoryIcon className={`h-5 w-5 ${iconMarginClass}`} />
            <span className={textSpanClass}>{UI_STRINGS.projectHistory}</span>
          </button>
          <button
            onClick={() => openModal('settings')}
            className="settings-button inline-flex items-center rounded-xl border border-white/20 bg-slate-800 px-2.5 py-2 text-slate-100 shadow-md transition hover:bg-slate-700"
            title={UI_STRINGS.settings}
            aria-label={UI_STRINGS.settings}
          >
            <SettingsIcon className="h-5 w-5" />
          </button>
          {isSidebarMode && (
            <button
              onClick={toggleAssistant}
              className="inline-flex items-center rounded-xl border border-fuchsia-300/20 bg-fuchsia-500/80 px-2.5 py-2 text-white shadow-md transition hover:bg-fuchsia-400"
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
