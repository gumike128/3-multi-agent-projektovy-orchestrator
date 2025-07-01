import React from 'react';
import { Agent } from '@/types';
import { AGENT_ROLE_DETAILS, UI_STRINGS } from '@/constants';
import { CogIcon } from '@heroicons/react/24/outline'; 
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface AgentCardProps {
  agent: Agent;
}

export const AgentCard: React.FC<AgentCardProps> = React.memo(({ agent }) => {
  const roleDetails = AGENT_ROLE_DETAILS[agent.role];
  const IconComponent = roleDetails.icon;

  const getStatusLabelAndColor = () => {
    if (agent.isWorking) return { label: UI_STRINGS.agentStatusActive, color: "text-yellow-400" };
    if (agent.status === "Completed") return { label: UI_STRINGS.agentStatusCompleted, color: "text-green-400" };
    return { label: UI_STRINGS.agentStatusIdle, color: "text-slate-400" };
  };

  const { label: statusLabel, color: statusColor } = getStatusLabelAndColor();

  return (
    <div className={`bg-slate-700/70 p-4 rounded-lg shadow-lg border-l-4 ${roleDetails.borderColor} transition-shadow duration-300`}>
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-full ${roleDetails.base}`}>
           <IconComponent className={`h-6 w-6 ${roleDetails.textColor}`} />
        </div>
        <div className="flex-1">
          <h4 className="text-md font-semibold text-slate-100">{agent.name} <span className="text-sm font-normal text-slate-400">({agent.role})</span></h4>
          <p className="text-xs text-slate-400">{roleDetails.description}</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-600/50 space-y-2">
        <div className="text-sm text-slate-300">
            <strong className={`${roleDetails.textColor}`}>Priradená Úloha: </strong> 
            {agent.assignedTask || <span className="italic text-slate-400">N/A</span>}
        </div>
        
        <div className="flex items-center space-x-2">
            <p className={`text-xs font-semibold ${statusColor}`}>
              Status: {statusLabel}
            </p>
            {agent.isWorking && <CogIcon className="animate-spin h-4 w-4 text-yellow-400" />}
        </div>


        {agent.taskOutput && (
          <div>
            <p className={`text-sm font-semibold ${roleDetails.textColor} mb-1`}>{UI_STRINGS.agentTaskOutputLabel}:</p>
            <div className="prose prose-sm prose-invert max-w-none bg-slate-800/60 p-2.5 rounded-md border border-slate-600">
              <MarkdownRenderer>{agent.taskOutput}</MarkdownRenderer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});