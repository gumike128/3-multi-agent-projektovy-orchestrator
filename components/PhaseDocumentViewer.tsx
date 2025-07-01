import React, { useState, useEffect } from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { PhaseDocument } from '@/types';
import { UI_STRINGS, GENERIC_ICONS } from '@/constants';
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface PhaseDocumentViewerProps {
  document: PhaseDocument;
  onClose?: () => void; // Optional for panel mode
  onSaveChanges: (documentId: string, newContent: string) => Promise<boolean>;
  isModal?: boolean; // New prop to distinguish display mode
}

export const PhaseDocumentViewer: React.FC<PhaseDocumentViewerProps> = ({ document, onClose, onSaveChanges, isModal = true }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(document.content);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const modalTitleId = `phase-document-viewer-title-${document.id}`;
  const EditIcon = GENERIC_ICONS.Edit;
  const SaveChangesIcon = GENERIC_ICONS.SaveChanges;
  const ProcessingIcon = GENERIC_ICONS.Processing;

  useEffect(() => {
    setEditedContent(document.content);
    setIsEditing(false);
    setError(null);
    setSuccessMessage(null);
  }, [document]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    const success = await onSaveChanges(document.id, editedContent);
    setIsSaving(false);
    if (success) {
      setIsEditing(false);
      setSuccessMessage(UI_STRINGS.documentUpdatedSuccessfully);
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setError(UI_STRINGS.errorUpdatingDocument);
    }
  };

  const ViewerContent = (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-slate-700">
          <div className="flex items-center mb-2 sm:mb-0">
            <DocumentTextIcon className="h-6 w-6 sm:h-7 sm:w-7 mr-2 text-sky-400" />
            <div>
              <h2 id={modalTitleId} className="text-lg sm:text-xl font-semibold text-sky-300">{document.title}</h2>
              <p className="text-xs text-slate-400">
                {UI_STRINGS.documentLastModified}: {new Date(document.lastModified).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
             {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-1.5 px-3 rounded-md shadow-sm transition text-xs sm:text-sm flex items-center justify-center flex-grow sm:flex-grow-0" aria-label={UI_STRINGS.editDocumentButton}>
                    <EditIcon className="h-4 w-4 mr-1.5" /> {UI_STRINGS.editDocumentButton}
                </button>
             )}
            {isModal && onClose && (
                <button onClick={onClose} className="text-slate-400 hover:text-sky-400 transition-colors py-1.5 px-2 flex-grow-0" title={UI_STRINGS.closeDocumentViewerButton} aria-label={UI_STRINGS.closeDocumentViewerButton}>
                    <XMarkIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                </button>
            )}
          </div>
        </div>
        
        {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
        {successMessage && <p className="text-green-400 text-xs mb-2">{successMessage}</p>}

        <div className="overflow-y-auto flex-grow prose prose-sm prose-invert max-w-none p-1 sm:p-2 bg-slate-700/50 rounded-md">
          {isEditing && !isSaving ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-full min-h-[300px] bg-slate-900 text-slate-100 p-2 rounded-md border border-slate-600 focus:ring-sky-500 focus:border-sky-500 text-sm"
              aria-label="Obsah dokumentu na úpravu"
            />
          ) : (
            <MarkdownRenderer>{editedContent}</MarkdownRenderer>
          )}
        </div>
        <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-700 text-right space-x-2">
          {isEditing && (
            <>
              <button onClick={() => { setIsEditing(false); setEditedContent(document.content); }} className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition text-xs sm:text-sm">Zrušiť</button>
              <button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition text-xs sm:text-sm disabled:opacity-50 min-w-[120px]">
                {isSaving ? <><ProcessingIcon className="animate-spin h-4 w-4 inline-block mr-2" /> {UI_STRINGS.savingToDocument.split("...")[0]}...</> : <><SaveChangesIcon className="h-4 w-4 inline-block mr-2" /> {UI_STRINGS.saveDocumentChangesButton}</>}
              </button>
            </>
          )}
        </div>
    </>
  );

  if (isModal) {
    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-[70] p-2 sm:p-4" role="dialog" aria-modal="true" aria-labelledby={modalTitleId}>
            <div className="bg-slate-800 p-3 sm:p-5 rounded-xl shadow-2xl w-full max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col border border-sky-500/50">
                {ViewerContent}
            </div>
        </div>
    );
  }
  
  return (
    <div className="p-3 sm:p-5 h-full flex flex-col">
        {ViewerContent}
    </div>
  );
};