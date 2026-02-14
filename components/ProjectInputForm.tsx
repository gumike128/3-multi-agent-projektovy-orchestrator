import React, { useState, useMemo } from 'react';
import { UI_STRINGS, PROJECT_TYPES_EXAMPLES, GENERIC_ICONS } from '@/constants';
import { PlayIcon } from '@heroicons/react/24/solid';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { refineProjectDescription } from '@/services/aiAssistantService';
import { useProject } from '@/contexts/ProjectContext';
import { useUI } from '@/contexts/UIContext';

export const ProjectInputForm: React.FC = () => {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  const { handleProjectSubmit } = useProject();
  const { isLoading } = useUI();

  const randomExamples = useMemo(() => {
    return [...PROJECT_TYPES_EXAMPLES]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim()) {
      handleProjectSubmit(title.trim(), description.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setDescription(example);
    if (!title.trim()) {
      const exampleTitle = `${example.split(' ').slice(0, 4).join(' ')}...`;
      setTitle(exampleTitle);
    }
  };

  const handleRefineDescription = async () => {
    if (!description.trim() || isRefining) return;
    setIsRefining(true);
    setRefineError(null);
    try {
      const refined = await refineProjectDescription(description);
      setDescription(refined);
    } catch (error) {
      console.error('Failed to refine description:', error);
      setRefineError(error instanceof Error ? error.message : 'Vylepšenie zlyhalo.');
    } finally {
      setIsRefining(false);
    }
  };

  const RefineIcon = GENERIC_ICONS.Refine;

  return (
    <section className="glass-panel mx-auto max-w-5xl p-5 sm:p-8">
      <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div>
          <h2 className="section-title">{UI_STRINGS.appName}</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            Premeníme vašu myšlienku na plán realizácie s jasnou štruktúrou, tímom agentov a postupnými krokmi.
            Návrh je optimalizovaný pre rýchle zadanie, čitateľnosť a responzívne používanie.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          <p className="mb-2 flex items-center gap-2 font-semibold text-sky-200"><SparklesIcon className="h-4 w-4" /> UX quick-start</p>
          <ul className="space-y-1 text-slate-300">
            <li>• Najprv názov a cieľ projektu.</li>
            <li>• Potom kontext a požiadavky v 3–5 vetách.</li>
            <li>• AI asistenta použite na vylepšenie textu.</li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" aria-label="Project setup form">
        <div>
          <label htmlFor="projectTitle" className="mb-2 block text-sm font-medium text-sky-200">
            {UI_STRINGS.projectTitleLabel}
          </label>
          <input
            type="text"
            id="projectTitle"
            className="w-full rounded-xl border border-white/15 bg-slate-900/70 p-3 text-slate-100 placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
            placeholder={UI_STRINGS.projectTitlePlaceholder}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="projectDescription" className="block text-sm font-medium text-sky-200">
              {UI_STRINGS.projectDescriptionLabel}
            </label>
            <button
              type="button"
              onClick={handleRefineDescription}
              disabled={isLoading || isRefining || !description.trim()}
              className="inline-flex items-center text-xs font-semibold text-purple-300 transition-colors hover:text-purple-200 disabled:cursor-not-allowed disabled:text-slate-500"
            >
              {isRefining ? (
                <svg className="mr-1.5 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <RefineIcon className="mr-1.5 h-4 w-4 text-purple-400" />
              )}
              {isRefining ? UI_STRINGS.aiAssistantRefining : UI_STRINGS.aiAssistantRefineDescription}
            </button>
          </div>
          {refineError && <p className="mb-1 text-xs text-red-400">{refineError}</p>}
          <textarea
            id="projectDescription"
            rows={6}
            className="w-full rounded-xl border border-white/15 bg-slate-900/70 p-3 text-slate-100 placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
            placeholder={UI_STRINGS.projectDescriptionPlaceholder}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading || isRefining}
            required
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-300">
          <p className="mb-2 font-semibold text-slate-200">Napríklad (pre popis):</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {randomExamples.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleExampleClick(ex)}
                className="rounded-lg border border-sky-300/20 bg-sky-500/10 px-3 py-2 text-left text-xs text-sky-100 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary w-full py-3 text-base"
          disabled={isLoading || !description.trim() || !title.trim()}
        >
          {isLoading ? (
            <>
              <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Spracovávam...
            </>
          ) : (
            <>
              <PlayIcon className="mr-2 h-6 w-6" />
              {UI_STRINGS.submitButton}
            </>
          )}
        </button>
      </form>
    </section>
  );
};
