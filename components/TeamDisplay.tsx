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
    <section className="glass-panel h-full p-4 sm:p-6">
      <h3 className="mb-4 flex items-center text-xl font-semibold text-sky-200">
        <UsersIcon className="mr-2 h-6 w-6 text-sky-300" />
        {UI_STRINGS.teamComposition}
      </h3>
      <div className="space-y-4">
        {team.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </section>
  );
};
