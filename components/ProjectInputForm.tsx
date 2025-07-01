import React, { useState, useMemo } from 'react';
import { UI_STRINGS, PROJECT_TYPES_EXAMPLES, GENERIC_ICONS } from '@/constants';
import { PlayIcon } from '@heroicons/react/24/solid';
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
    // Shuffle array and take first 3
    return [...PROJECT_TYPES_EXAMPLES]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
  }, []); // Empty dependency array ensures this runs only once per component mount

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim()) {
      handleProjectSubmit(title.trim(), description.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setDescription(example);
    if (!title.trim()) {
        const exampleTitle = example.split(' ').slice(0, 4).join(' ') + "...";
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
        console.error("Failed to refine description:", error);
        setRefineError(error instanceof Error ? error.message : "Vylepšenie zlyhalo.");
    } finally {
        setIsRefining(false);
    }
  };

  const RefineIcon = GENERIC_ICONS.Refine;

  return (
    <div className="bg-slate-800 p-8 rounded-xl shadow-2xl space-y-6">
      <h2 className="text-3xl font-bold text-center text-sky-400 mb-6">{UI_STRINGS.appName}</h2>
      <p className="text-slate-300 text-center mb-8">
        Popíšte vašu projektovú požiadavku. Náš inteligentný orchestrátor analyzuje vstup, zostaví tím špecializovaných agentov a vygeneruje komplexný plán realizácie.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="projectTitle" className="block text-sm font-medium text-sky-300 mb-1">
            {UI_STRINGS.projectTitleLabel}
          </label>
          <input
            type="text"
            id="projectTitle"
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out"
            placeholder={UI_STRINGS.projectTitlePlaceholder}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="projectDescription" className="block text-sm font-medium text-sky-300">
              {UI_STRINGS.projectDescriptionLabel}
            </label>
            <button
                type="button"
                onClick={handleRefineDescription}
                disabled={isLoading || isRefining || !description.trim()}
                className="flex items-center text-xs font-semibold text-purple-300 hover:text-purple-200 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
            >
                {isRefining ? (
                     <svg className="animate-spin h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                    <RefineIcon className="h-4 w-4 mr-1.5 text-purple-400"/>
                )}
                {isRefining ? UI_STRINGS.aiAssistantRefining : UI_STRINGS.aiAssistantRefineDescription}
            </button>
          </div>
          {refineError && <p className="text-xs text-red-400 mb-1">{refineError}</p>}
          <textarea
            id="projectDescription"
            rows={6}
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out"
            placeholder={UI_STRINGS.projectDescriptionPlaceholder}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading || isRefining}
            required
          />
        </div>
        <div className="text-sm text-slate-400">
          <p className="font-semibold mb-1">Napríklad (pre popis):</p>
          <ul className="list-disc list-inside space-y-1">
            {randomExamples.map((ex, idx) => (
              <li key={idx}>
                <button 
                  type="button" 
                  onClick={() => handleExampleClick(ex)} 
                  className="text-sky-400 hover:text-sky-300 hover:underline disabled:text-slate-500 disabled:no-underline"
                  disabled={isLoading}
                >
                  {ex}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="submit"
          className="w-full flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || !description.trim() || !title.trim()}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Spracovávam...
            </>
          ) : (
            <>
              <PlayIcon className="h-6 w-6 mr-2" />
              {UI_STRINGS.submitButton}
            </>
          )}
        </button>
      </form>
    </div>
  );
};