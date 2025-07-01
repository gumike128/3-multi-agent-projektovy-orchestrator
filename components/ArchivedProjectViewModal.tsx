import React from 'react';
import { ArchivedProject, Agent, InterpretedProjectDetails } from '@/types'; 
import { UI_STRINGS, AGENT_ROLE_DETAILS, GENERIC_ICONS } from '@/constants'; 
import { XMarkIcon, TagIcon, LightBulbIcon, WrenchScrewdriverIcon, UsersIcon, ListBulletIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface ArchivedProjectViewModalProps {
  project: ArchivedProject | null;
  onClose: () => void;
}

const DetailSection: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; sectionId?: string }> = ({ title, icon: Icon, children, sectionId }) => (
  <div className="mb-3 p-3 bg-slate-700/70 rounded-md border border-slate-600/50 print:bg-slate-50 print:border-slate-200" id={sectionId}>
    <h4 className="text-md font-semibold text-sky-300 mb-2 flex items-center print:text-sky-700">
      <Icon className="h-5 w-5 mr-2 text-sky-400 print:text-sky-600" />
      {title}
    </h4>
    {children}
  </div>
);


export const ArchivedProjectViewModal: React.FC<ArchivedProjectViewModalProps> = ({ project, onClose }) => {
  if (!project) return null;

  const handlePrint = () => {
    window.print();
  };
  
  const PrinterIcon = GENERIC_ICONS.Printer;
  const modalTitleId = `archived-project-title-${project.id}`;

  const getAgentStatusLabel = (agent: Agent) => {
    if (agent.status === "Completed") return UI_STRINGS.agentStatusCompleted;
    if (agent.status === "Active") return UI_STRINGS.agentStatusActive;
    return UI_STRINGS.agentStatusIdle;
  };

  return (
      <div className="bg-slate-800 p-3 sm:p-4 md:p-6 rounded-xl shadow-2xl w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col print:shadow-none print:border-none print:bg-white print:text-black print:w-full print:max-w-none print:h-auto print:max-h-none print:m-0 print:p-0 print:rounded-none">
        <div className="flex justify-between items-center mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-slate-700 print:border-slate-300">
          <div>
            <h2 id={modalTitleId} className="text-lg sm:text-xl md:text-2xl font-semibold text-sky-400 print:text-sky-600">{project.title}</h2>
            <p className="text-xs text-slate-400 print:text-slate-500">
              {UI_STRINGS.orchestratedOn}: {new Date(project.timestamp).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-sky-400 transition-colors print:hidden"
            title={UI_STRINGS.closeModal}
            aria-label={UI_STRINGS.closeModal}
          >
            <XMarkIcon className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-1.5 pr-1 sm:pr-2 text-sm sm:text-base print:overflow-visible print:text-black print:pr-0">
          <DetailSection title={UI_STRINGS.originalRequest} icon={DocumentTextIcon}>
            <p className="italic text-xs sm:text-sm">{project.description}</p>
          </DetailSection>

          <DetailSection title={UI_STRINGS.projectDetails} icon={TagIcon}>
            <div className="space-y-1.5 text-xs sm:text-sm">
              <p><strong className="text-sky-200 print:text-sky-700">{UI_STRINGS.projectType}:</strong> {project.interpretedDetails.projectType}</p>
              <div>
                <strong className="text-sky-200 print:text-sky-700">{UI_STRINGS.goals}:</strong>
                <ul className="list-disc list-inside ml-4">
                  {project.interpretedDetails.goals.map((goal, i) => <li key={i}>{goal}</li>)}
                </ul>
              </div>
              <div>
                <strong className="text-sky-200 print:text-sky-700">{UI_STRINGS.expertiseNeeded}:</strong>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {project.interpretedDetails.expertise.map((exp, i) => (
                    <span key={i} className="bg-sky-700 text-sky-100 text-xs px-2 py-0.5 rounded-full print:bg-sky-100 print:text-sky-800 print:border print:border-sky-300">{exp}</span>
                  ))}
                </div>
              </div>
            </div>
          </DetailSection>

          <DetailSection title={UI_STRINGS.teamComposition} icon={UsersIcon}>
            <div className="space-y-2">
              {project.team.map(agent => {
                const RoleIcon = AGENT_ROLE_DETAILS[agent.role]?.icon || UsersIcon;
                return (
                  <div key={agent.id} className="p-2 bg-slate-600/30 rounded print:bg-slate-100 print:border print:border-slate-200">
                    <div className="flex items-center space-x-2">
                      <RoleIcon className="h-5 w-5 text-sky-400 flex-shrink-0 print:text-sky-600" />
                      <div>
                        <span className="font-medium text-xs sm:text-sm">{agent.name} ({agent.role})</span>
                        <p className="text-xs text-slate-400 print:text-slate-500">Status: {getAgentStatusLabel(agent)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 pl-7 print:text-slate-600">
                        <strong className="text-sky-300 print:text-sky-700">Úloha:</strong> {agent.assignedTask || "N/A"}
                    </p>
                    {agent.taskOutput && (
                       <div className="mt-1 pl-7 prose prose-xs prose-invert max-w-none print:text-slate-600 print:prose-slate">
                         <strong className="text-xs text-sky-300 print:text-sky-700">{UI_STRINGS.agentTaskOutputLabel}:</strong>
                         <div className="bg-slate-500/30 p-1.5 rounded-sm"><MarkdownRenderer>{agent.taskOutput}</MarkdownRenderer></div>
                       </div>
                    )}
                  </div>
                );
              })}
            </div>
          </DetailSection>
          
          {project.newExecutionPlan && project.newExecutionPlan.length > 0 && (
             <DetailSection title={UI_STRINGS.newExecutionPlanTitle} icon={ListBulletIcon}>
                {project.newExecutionPlan.map(phase => (
                    <div key={phase.id} className="mb-3 p-2 bg-slate-600/20 rounded print:bg-slate-50 print:my-2">
                        <h5 className="font-semibold text-sky-200 print:text-sky-700 text-sm">{phase.title}</h5>
                        <p className="text-xs italic text-slate-300 print:text-slate-600 mb-1">{phase.objective}</p>
                        {phase.subTasks.map(subTask => (
                            <div key={subTask.id} className="ml-2 pl-2 border-l border-slate-500 py-1 my-1 print:border-slate-300">
                                <p className="text-xs font-medium text-slate-100 print:text-slate-700">{subTask.title}</p>
                                <p className="text-xs text-slate-400 print:text-slate-500">Status: {subTask.status}</p>
                                {subTask.elaboratedContent && (
                                     <div className="mt-1 prose prose-xs prose-invert max-w-none print:text-slate-600 print:prose-slate">
                                        <strong className="text-xs text-sky-300 print:text-sky-600">Vypracovaný obsah:</strong>
                                        <MarkdownRenderer>{subTask.elaboratedContent}</MarkdownRenderer>
                                     </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
             </DetailSection>
          )}

          {project.documentationOutline && (
            <DetailSection title={UI_STRINGS.documentation} icon={DocumentTextIcon}>
              <div className="prose prose-sm prose-invert max-w-none bg-slate-600/50 p-2 rounded print:bg-slate-100 print:border print:border-slate-200">
                 <MarkdownRenderer>{project.documentationOutline}</MarkdownRenderer>
              </div>
            </DetailSection>
          )}

          {project.phaseDocuments && project.phaseDocuments.length > 0 && (
            <DetailSection title={UI_STRINGS.phaseDocumentsTitle} icon={GENERIC_ICONS.DocumentsList}>
                {project.phaseDocuments.map(doc => (
                    <div key={doc.id} className="mb-2 p-2 bg-slate-600/20 rounded print:bg-slate-50 print:my-2">
                         <h5 className="font-semibold text-sky-200 print:text-sky-700 text-sm">{doc.title}</h5>
                         <p className="text-xs text-slate-400 print:text-slate-500">Posledná úprava: {new Date(doc.lastModified).toLocaleString()}</p>
                         <div className="mt-1 prose prose-xs prose-invert max-w-none print:text-slate-600 print:prose-slate">
                            <MarkdownRenderer>{doc.content}</MarkdownRenderer>
                         </div>
                    </div>
                ))}
            </DetailSection>
          )}

        </div>
         <div className="mt-auto pt-3 sm:pt-4 border-t border-slate-700 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 print:hidden">
            <button
                onClick={handlePrint}
                className="w-full sm:w-1/2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition flex items-center justify-center text-sm sm:text-base"
                title={UI_STRINGS.printAction}
                aria-label={UI_STRINGS.printAction}
            >
                <PrinterIcon className="h-5 w-5 mr-2" />
                {UI_STRINGS.printAction}
            </button>
            <button
                onClick={onClose}
                className="w-full sm:w-1/2 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition text-sm sm:text-base"
                title={UI_STRINGS.closeModal}
                aria-label={UI_STRINGS.closeModal}
            >
                {UI_STRINGS.closeModal}
            </button>
        </div>
      </div>
  );
};