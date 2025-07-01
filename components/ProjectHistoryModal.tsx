import React from 'react';
import { ArchivedProject } from '@/types';
import { UI_STRINGS, GENERIC_ICONS } from '@/constants';
import { EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useModal } from '@/contexts/ModalContext';

interface ProjectHistoryModalProps {
  projects: ArchivedProject[];
  onClearHistory: () => void;
}

export const ProjectHistoryModal: React.FC<ProjectHistoryModalProps> = React.memo(({
  projects,
  onClearHistory,
}) => {
  const { closeModal, openModal } = useModal();
  const ClearIcon = GENERIC_ICONS.Clear;
  const modalTitleId = "project-history-modal-title";

  const handleViewProject = (project: ArchivedProject) => {
      openModal('archivedProject', { project });
  };

  return (
      <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-md sm:max-w-xl md:max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 id={modalTitleId} className="text-xl sm:text-2xl font-semibold text-sky-400">{UI_STRINGS.projectHistory}</h2>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-sky-400 transition-colors"
            title={UI_STRINGS.closeModal}
            aria-label={UI_STRINGS.closeModal}
          >
            <XMarkIcon className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>
        </div>

        {projects.length === 0 ? (
          <p className="text-slate-400 text-center py-8">{UI_STRINGS.noHistory}</p>
        ) : (
          <div className="overflow-y-auto space-y-3 flex-grow pr-1 sm:pr-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-slate-700 p-3 sm:p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-slate-600 hover:border-sky-500"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="mb-2 sm:mb-0">
                    <h3 className="text-md sm:text-lg font-semibold text-sky-300">{project.title}</h3>
                    <p className="text-xs text-slate-400">
                      {UI_STRINGS.orchestratedOn}: {new Date(project.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleViewProject(project)}
                    className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-medium py-1.5 px-3 rounded-md shadow-sm transition duration-150 ease-in-out flex items-center justify-center"
                    title={UI_STRINGS.viewProjectDetails}
                    aria-label={`${UI_STRINGS.viewProjectDetails} for ${project.title}`}
                  >
                    <EyeIcon className="h-4 w-4 mr-1.5" />
                    {UI_STRINGS.viewProjectDetails}
                  </button>
                </div>
                 <p className="text-sm text-slate-300 mt-2 truncate">{project.description}</p>
              </div>
            ))}
          </div>
        )}

        {projects.length > 0 && (
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-700">
            <button
              onClick={onClearHistory}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center justify-center"
              title={UI_STRINGS.clearHistory}
              aria-label={UI_STRINGS.clearHistory}
            >
              <ClearIcon className="h-5 w-5 mr-2" />
              {UI_STRINGS.clearHistory}
            </button>
          </div>
        )}
      </div>
  );
});