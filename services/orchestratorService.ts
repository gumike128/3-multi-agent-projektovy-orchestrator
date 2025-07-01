
import { Agent, AgentRole, InterpretedProjectDetails } from '@/types';
import { ALL_AGENT_ROLES_ORDERED, MAX_AGENTS_PER_ROLE } from '@/constants';

let agentIdCounter = 0;

const createAgentInstance = (role: AgentRole, projectContext?: string): Agent => {
  agentIdCounter += 1;
  return {
    id: `agent-${role.replace(/\s+/g, '-').toLowerCase()}-${agentIdCounter}`,
    role,
    name: `${role} Agent ${agentIdCounter}`, // Generic name, can be enhanced
    status: "Idle", // Initial status
    assignedTask: "", // Will be populated by App.tsx after generation
    taskOutput: null,
    isWorking: false,
  };
};


export const composeTeam = (projectType: string, expertise: string[]): Agent[] => {
  const team: Agent[] = [];
  const requiredRoles = new Set<AgentRole>();
  agentIdCounter = 0; // Reset counter for each new team

  const lowerProjectType = projectType.toLowerCase();
  const lowerExpertise = expertise.map(e => e.toLowerCase());

  requiredRoles.add(AgentRole.ProjectManager);

  if (lowerProjectType.includes('vývoj') || lowerProjectType.includes('develop') || lowerProjectType.includes('softvér') || lowerProjectType.includes('aplikácia') || lowerProjectType.includes('kód') || lowerExpertise.some(e => ['javascript', 'python', 'java', 'c#', 'react', 'angular', 'vue', 'backend', 'frontend', 'mobile'].includes(e))) {
    requiredRoles.add(AgentRole.TechnicalArchitect);
    requiredRoles.add(AgentRole.Developer);
    requiredRoles.add(AgentRole.QATesting);
  }
  if (lowerProjectType.includes('analýza') || lowerProjectType.includes('analysis') || lowerProjectType.includes('dáta') || lowerProjectType.includes('report') || lowerExpertise.some(e => ['sql', 'štatistika', 'strojové učenie', 'business intelligence', 'data science'].includes(e))) {
    requiredRoles.add(AgentRole.BusinessAnalyst); // BA often helps frame analysis
    requiredRoles.add(AgentRole.DataAnalyst);
  }
  if (lowerProjectType.includes('dokumentácia') || lowerProjectType.includes('documentation') || lowerProjectType.includes('manuál') || lowerExpertise.some(e => ['technické písanie', 'návody', 'user guide'].includes(e))) {
    requiredRoles.add(AgentRole.DocumentationSpecialist);
  }
  if (lowerProjectType.includes('kreatíva') || lowerProjectType.includes('creative') || lowerProjectType.includes('dizajn') || lowerProjectType.includes('marketing') || lowerExpertise.some(e => ['ui/ux', 'grafický dizajn', 'obsahový marketing', 'branding'].includes(e))) {
    requiredRoles.add(AgentRole.CreativeContent);
  }
  
  if (requiredRoles.size <= 1) { // Only PM
    if (lowerExpertise.some(e => ['softvér', 'kód', 'api'].includes(e)) || lowerProjectType.includes('vývoj')) {
         requiredRoles.add(AgentRole.Developer);
    } else if (lowerExpertise.some(e => ['analýza', 'report'].includes(e)) || lowerProjectType.includes('analýza')) {
        requiredRoles.add(AgentRole.DataAnalyst);
    }
    else {
        requiredRoles.add(AgentRole.BusinessAnalyst); // General purpose
    }
  }


  ALL_AGENT_ROLES_ORDERED.forEach(role => {
    if (requiredRoles.has(role)) {
      const maxInstances = MAX_AGENTS_PER_ROLE[role] || 1;
      let instancesToAdd = 1;
      // Add more developers if complex tech project
      if (role === AgentRole.Developer && lowerExpertise.filter(e => ['javascript', 'python', 'java', 'c#', 'react', 'angular', 'vue', 'backend', 'frontend', 'ios', 'android', 'swift', 'kotlin'].includes(e)).length > 1 && expertise.length > 2) {
         instancesToAdd = Math.min(maxInstances, 2); // Add up to 2 developers
      }
      
      for(let i = 0; i < instancesToAdd; i++) {
        if(team.filter(a => a.role === role).length < maxInstances) {
            team.push(createAgentInstance(role));
        }
      }
    }
  });

  const MIN_TEAM_SIZE = 2;
  const MAX_TEAM_SIZE = 5; // Max team size for this demo

  while (team.length < MIN_TEAM_SIZE && ALL_AGENT_ROLES_ORDERED.length > team.length) {
    const availableRoles = ALL_AGENT_ROLES_ORDERED.filter(r => !team.some(agent => agent.role === r));
    if (availableRoles.length > 0) {
        // Add a role that complements existing ones, e.g. if dev heavy, add BA or QA
        let roleToAdd = availableRoles[0]; // Default
        if(team.some(a => a.role === AgentRole.Developer) && availableRoles.includes(AgentRole.QATesting)) roleToAdd = AgentRole.QATesting;
        else if(team.some(a => a.role === AgentRole.Developer) && availableRoles.includes(AgentRole.BusinessAnalyst)) roleToAdd = AgentRole.BusinessAnalyst;
        else if(team.some(a => a.role === AgentRole.DataAnalyst) && availableRoles.includes(AgentRole.BusinessAnalyst)) roleToAdd = AgentRole.BusinessAnalyst;
        
        team.push(createAgentInstance(roleToAdd));
    } else {
        break; 
    }
  }
  
  if (team.length > MAX_TEAM_SIZE) {
    const priorityRoles = [
        AgentRole.ProjectManager, 
        AgentRole.Developer, 
        AgentRole.TechnicalArchitect, 
        AgentRole.DataAnalyst,
        AgentRole.BusinessAnalyst,
        AgentRole.QATesting,
        AgentRole.CreativeContent,
        AgentRole.DocumentationSpecialist
    ];
    const prioritizedTeam = team.sort((a, b) => {
        const aPriority = priorityRoles.indexOf(a.role);
        const bPriority = priorityRoles.indexOf(b.role);
        return aPriority - bPriority; // Lower index = higher priority
    });
    return prioritizedTeam.slice(0, MAX_TEAM_SIZE);
  }

  return team;
};

// Funkcie findBestAgentForSubTask a assignTasksToTeam boli odstránené,
// pretože boli naviazané na starú štruktúru exekučného plánu.
// Nové mechanizmy priraďovania agentov k pod-úlohám (ak budú potrebné)
// budú implementované v rámci nového systému exekučného plánu.
