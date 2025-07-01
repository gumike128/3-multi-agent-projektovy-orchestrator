
import React from 'react';
// import { ExecutionPhase } from '@/types'; // Už nie je potrebné
import { UI_STRINGS } from '@/constants';
import { DocumentTextIcon, CogIcon } from '@heroicons/react/24/outline';

interface DocumentationSectionProps {
  projectType: string | null;
  executionPlan: null; // Explicitne null, keďže starý plán bol odstránený
  isLoading: boolean;
  onGenerateOutline: () => Promise<void>;
  outline: string | null;
}

export const DocumentationSection: React.FC<DocumentationSectionProps> = ({
  projectType,
  // executionPlan, // parameter odstránený
  isLoading,
  onGenerateOutline,
  outline,
}) => {
  if (!projectType) { // Podmienka upravená, executionPlan už nie je potrebný
    return null;
  }

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-2xl">
      <h3 className="text-xl font-semibold text-sky-400 mb-4 flex items-center">
        <DocumentTextIcon className="h-6 w-6 mr-2 text-sky-400" />
        {UI_STRINGS.documentation}
      </h3>
      {!outline && (
        <button
          onClick={onGenerateOutline}
          disabled={isLoading}
          className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-50 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <CogIcon className="animate-spin h-5 w-5 mr-2" />
              {UI_STRINGS.generatingDocs}
            </>
          ) : (
            UI_STRINGS.generateOutline
          )}
        </button>
      )}
      {outline && (
        <div className="mt-4 bg-slate-700 p-4 rounded-lg border border-slate-600">
          <h4 className="text-md font-semibold text-sky-300 mb-2">Navrhovaná Osnova Dokumentácie:</h4>
          <pre className="whitespace-pre-wrap text-sm text-slate-200">{outline}</pre>
        </div>
      )}
    </div>
  );
};