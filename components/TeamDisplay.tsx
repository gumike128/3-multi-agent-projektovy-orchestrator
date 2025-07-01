import React from 'react';
import { Agent } from '@/types';
import { AgentCard } from '@/components/AgentCard';
import { UI_STRINGS } from '@/constants';
import { UsersIcon } from '@heroicons/react/24/outline';

interface TeamDisplayProps {
  team: Agent[] | null;
}

export const TeamDisplay: React.FC<TeamDisplayProps> = ({ team }) => {
  if (!team || team.length === 0) {
    return null; 
  }

  return (
    <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-2xl h-full">
      <h3 className="text-xl font-semibold text-sky-400 mb-4 flex items-center">
        <UsersIcon className="h-6 w-6 mr-2 text-sky-400" />
        {UI_STRINGS.teamComposition}
      </h3>
      <div className="space-y-4">
        {team.map((agent) => (
          <AgentCard 
            key={agent.id} 
            agent={agent} 
          />
        ))}
      </div>
    </div>
  );
};