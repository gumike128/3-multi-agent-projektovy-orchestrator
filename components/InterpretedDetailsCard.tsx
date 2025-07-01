import React from 'react';
import { InterpretedProjectDetails } from '@/types';
import { UI_STRINGS } from '@/constants';
import { MagnifyingGlassCircleIcon, LightBulbIcon, WrenchScrewdriverIcon, TagIcon, ChatBubbleBottomCenterTextIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface InterpretedDetailsCardProps {
  details: InterpretedProjectDetails | null;
  projectTitle: string;
  projectDescription: string;
}

export const InterpretedDetailsCard: React.FC<InterpretedDetailsCardProps> = React.memo(({ details, projectTitle, projectDescription }) => {
  if (!details) {
    return null;
  }

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-2xl h-full">
      <h3 className="text-xl font-semibold text-sky-400 mb-4 flex items-center">
        <MagnifyingGlassCircleIcon className="h-6 w-6 mr-2 text-sky-400" />
        {UI_STRINGS.projectDetails}
      </h3>
      <div className="space-y-4">
        <div>
            <h4 className="text-sm font-bold text-sky-300 flex items-center">
                <ChatBubbleBottomCenterTextIcon className="h-5 w-5 mr-1.5"/>
                {UI_STRINGS.projectTitleLabel}
            </h4>
            <p className="text-slate-100 font-semibold text-lg mt-1">{projectTitle}</p>
        </div>
         <div>
            <h4 className="text-sm font-bold text-sky-300 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-1.5"/>
                {UI_STRINGS.projectDescriptionLabel}
            </h4>
            <div className="prose prose-sm prose-invert max-w-none text-slate-300 mt-1">
                <MarkdownRenderer>{projectDescription}</MarkdownRenderer>
            </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-sky-300 flex items-center">
            <TagIcon className="h-5 w-5 mr-1.5"/>{UI_STRINGS.projectType}:
          </h4>
          <p className="text-slate-200 capitalize">{details.projectType}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-sky-300 flex items-center">
           <LightBulbIcon className="h-5 w-5 mr-1.5"/>{UI_STRINGS.goals}:
          </h4>
          <ul className="list-disc list-inside text-slate-200 pl-1">
            {details.goals.map((goal, index) => (
              <li key={index}>{goal}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-medium text-sky-300 flex items-center">
            <WrenchScrewdriverIcon className="h-5 w-5 mr-1.5"/>{UI_STRINGS.expertiseNeeded}:
          </h4>
          <div className="flex flex-wrap gap-2 mt-1">
            {details.expertise.map((expert, index) => (
              <span key={index} className="bg-sky-700 text-sky-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {expert}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
