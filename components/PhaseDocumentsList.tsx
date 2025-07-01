
import React from 'react';
import { PhaseDocument } from '@/types';
import { UI_STRINGS, GENERIC_ICONS } from '@/constants';

interface PhaseDocumentsListProps {
  documents: PhaseDocument[];
  onSelectDocument: (documentId: string) => void;
}

export const PhaseDocumentsList: React.FC<PhaseDocumentsListProps> = ({ documents, onSelectDocument }) => {
  const ListIcon = GENERIC_ICONS.DocumentsList;
  const ViewIcon = GENERIC_ICONS.ViewDocument;

  if (!documents || documents.length === 0) {
    return (
      <div className="bg-slate-800 p-6 rounded-xl shadow-2xl mt-8">
        <h3 className="text-xl font-semibold text-sky-400 mb-4 flex items-center">
          <ListIcon className="h-6 w-6 mr-2 text-sky-400" />
          {UI_STRINGS.phaseDocumentsTitle}
        </h3>
        <p className="text-slate-400 italic">{UI_STRINGS.noDocumentsGenerated}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-2xl mt-8">
      <h3 className="text-xl font-semibold text-sky-400 mb-4 flex items-center">
        <ListIcon className="h-6 w-6 mr-2 text-sky-400" />
        {UI_STRINGS.phaseDocumentsTitle}
      </h3>
      <div className="space-y-3">
        {documents.map(doc => (
          <div key={doc.id} className="bg-slate-700 p-3 rounded-lg border border-slate-600 flex justify-between items-center hover:border-sky-500 transition-colors">
            <div>
              <h4 className="font-medium text-slate-100">{doc.title}</h4>
              <p className="text-xs text-slate-400">
                {UI_STRINGS.documentLastModified}: {new Date(doc.lastModified).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => onSelectDocument(doc.id)}
              className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium py-1.5 px-3 rounded-md shadow-sm transition duration-150 ease-in-out flex items-center"
              title={UI_STRINGS.viewDocumentButton}
            >
              <ViewIcon className="h-4 w-4 mr-1.5" />
              {UI_STRINGS.viewDocumentButton}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
