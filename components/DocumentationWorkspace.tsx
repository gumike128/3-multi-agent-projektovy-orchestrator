import React, { useState, useEffect } from 'react';
import { PhaseDocument } from '@/types';
import { UI_STRINGS } from '@/constants';
import { PhaseDocumentViewer } from '@/components/PhaseDocumentViewer';
import { RectangleGroupIcon } from '@heroicons/react/24/outline';

interface DocumentationWorkspaceProps {
    documents: PhaseDocument[];
    onSaveChanges: (docId: string, content: string) => Promise<boolean>;
}

export const DocumentationWorkspace: React.FC<DocumentationWorkspaceProps> = ({ documents, onSaveChanges }) => {
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

    useEffect(() => {
        if (documents.length > 0 && !selectedDocId) {
            setSelectedDocId(documents[0].id);
        } else if (documents.length > 0 && selectedDocId && !documents.find(d => d.id === selectedDocId)) {
            setSelectedDocId(documents[0].id);
        }
    }, [documents, selectedDocId]);

    const selectedDocument = documents.find(doc => doc.id === selectedDocId);

    if (!documents || documents.length === 0) {
        return (
            <div className="text-center text-slate-400 italic mt-6 p-8 bg-slate-800 rounded-lg">
                <RectangleGroupIcon className="mx-auto h-12 w-12 text-slate-500" />
                <h3 className="mt-2 text-lg font-medium">{UI_STRINGS.noDocumentsGenerated}</h3>
                <p className="mt-1 text-sm text-slate-500">Dokumenty sa generujú a dopĺňajú počas spracovania exekučného plánu.</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-250px)]">
            <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 bg-slate-800 p-3 rounded-xl border border-slate-700 overflow-y-auto">
                <h3 className="text-lg font-semibold text-sky-400 mb-3 px-1">{UI_STRINGS.phaseDocumentsTitle}</h3>
                <div className="space-y-2">
                    {documents.map(doc => (
                        <button
                            key={doc.id}
                            onClick={() => setSelectedDocId(doc.id)}
                            data-selected={selectedDocId === doc.id}
                            className={`
                                documentation-list-item w-full text-left p-3 rounded-lg transition-colors duration-200 border-l-4
                                ${selectedDocId === doc.id
                                    ? 'bg-sky-900/50 border-sky-500'
                                    : 'bg-slate-700/50 border-transparent'
                                }
                            `}
                        >
                            <p className="font-medium text-slate-100">{doc.title}</p>
                            <p className="text-xs text-slate-400 mt-1">
                                {UI_STRINGS.documentLastModified}: {new Date(doc.lastModified).toLocaleDateString()}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="w-full md:w-2/3 lg:w-3/4 bg-slate-800 rounded-xl border border-slate-700 flex flex-col">
                {selectedDocument ? (
                    <PhaseDocumentViewer 
                        document={selectedDocument} 
                        onSaveChanges={onSaveChanges}
                        isModal={false}
                    />
                ) : (
                    <div className="flex-grow flex items-center justify-center text-slate-500">
                        Vyberte dokument zo zoznamu.
                    </div>
                )}
            </div>
        </div>
    );
};
