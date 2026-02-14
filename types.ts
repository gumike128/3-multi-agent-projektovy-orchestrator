export enum AgentRole {
  ProjectManager = "Project Manager",
  TechnicalArchitect = "Technical Architect",
  Developer = "Developer",
  BusinessAnalyst = "Business Analyst",
  DataAnalyst = "Data Analyst",
  DocumentationSpecialist = "Documentation Specialist",
  QATesting = "QA/Testing",
  CreativeContent = "Creative/Content"
}

export interface Agent {
  id: string;
  role: AgentRole;
  name: string;
  status: "Idle" | "Active" | "Completed" | "Error"; 
  assignedTask: string;
  taskOutput: string | null; 
  isWorking: boolean; 
}

export interface InterpretedProjectDetails {
  projectType: string;
  goals: string[];
  expertise: string[];
}

export type NewSubTaskStatus = 'Pending' | 'GeneratingSubTask' | 'SavedToDocument';

/**
 * Represents a sub-task within a new execution phase.
 */
export interface NewSubTask {
  id: string;
  title: string;
  elaborationPrompt: string; 
  status: NewSubTaskStatus;
  elaboratedContent?: string | null; 
  assignedAgentRoleHint?: AgentRole | null;
  /** Optional results from Google Search grounding. */
  searchResults?: {
    text: string;
    sources: GroundingChunkWeb[];
  } | null;
}

export type PhaseExecutionStatus = 'Idle' | 'ProcessingSubTasks' | 'CompletedAllSubTasks';

/**
 * Represents a phase in the new execution plan.
 */
export interface NewExecutionPhase {
  id: string;
  title: string; 
  objective: string; 
  subTasks: NewSubTask[];
  associatedDocumentId?: string | null; 
  phaseExecutionStatus?: PhaseExecutionStatus; 
}

/**
 * Represents a document associated with a project phase.
 */
export interface PhaseDocument {
    id: string;
    phaseId: string;
    title: string;
    content: string;
    lastModified: string;
    sourceTabId?: string;
    versionHistory?: { content: string; timestamp: string }[];
}

/**
 * Represents a message in the AI assistant's chat.
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Represents a clickable suggestion from the AI assistant.
 */
export interface Suggestion {
  title: string;
  prompt: string;
}

/**
 * Represents an AI-generated content tab created by the assistant.
 */
export interface AIGeneratedTab {
  id: string;
  title: string;
  content: string;
  type: 'ai-content';
}

/**
 * Represents an idea for a Mini-App.
 */
export interface MiniAppIdea {
  title: string;
  description: string;
  creationPrompt: string;
}

/**
 * Represents a generated Mini-App.
 */
export interface MiniApp {
  id: string;
  title: string;
  htmlContent: string;
  creationPrompt: string;
}

/**
 * Represents a tab containing a Mini-App.
 */
export interface MiniAppTab {
  id: string;
  title: string;
  miniAppId: string;
  type: 'miniapp';
}


/**
 * Represents an archived project state.
 */
export interface ArchivedProject {
  id: string;
  title: string;
  description: string;
  timestamp: string; 
  interpretedDetails: InterpretedProjectDetails;
  team: Agent[]; 
  documentationOutline: string | null;
  newExecutionPlan: NewExecutionPhase[] | null; 
  phaseDocuments: PhaseDocument[] | null;
  assistantChatHistory?: ChatMessage[];
  aiGeneratedTabs?: AIGeneratedTab[];
  miniApps?: MiniApp[];
  miniAppTabs?: MiniAppTab[];
}

/**
 * A convenience type to pass all relevant project state to the assistant.
 */
export interface ProjectStateForAssistant {
    currentProjectId: string | null;
    projectTitle: string;
    projectDescription: string;
    interpretedDetails: InterpretedProjectDetails | null;
    team: Agent[] | null;
    newExecutionPlan: NewExecutionPhase[] | null;
    phaseDocuments: PhaseDocument[] | null;
    activeTab: WorkspaceTab;
}

/**
 * Represents a web grounding chunk from Google Search.
 */
export interface GroundingChunkWeb {
  uri: string;
  title: string;
}
export interface GroundingChunk { web?: GroundingChunkWeb; } // Allow other types of chunks in future
export interface GroundingMetadata { groundingChunks?: GroundingChunk[]; }
export interface Candidate { groundingMetadata?: GroundingMetadata; }

/**
 * Extends GenerateContentResponse to include grounding metadata.
 */
export interface GenerateContentResponseWithGrounding { 
  text: string; 
  candidates?: Candidate[]; 
}

/**
 * Defines the possible tabs in the main workspace view.
 * Can be a static tab, 'ai-assistant', or a dynamic tab ID.
 */
export type WorkspaceTab = 'overview' | 'plan' | 'docs' | 'ai-assistant' | 'miniapps' | string;

// ===================================================================================
//  SETTINGS TYPES
// ===================================================================================

export interface AIModelParams {
    temperature: number;
    topP: number;
    topK: number;
}

export interface AISettings {
    modelParams: AIModelParams;
    apiCallDelay: number;
    apiKey: string;
}

export type AIAssistantDisplayMode = 'none' | 'fab' | 'tab' | 'sidebar-left' | 'sidebar-right';
export type HeaderButtonMode = 'icon-and-text';

export interface GeneralSettings {
    theme: 'dark' | 'light';
    aiAssistantDisplayMode: AIAssistantDisplayMode;
    headerButtonMode: HeaderButtonMode;
}

export interface AppSettings {
    general: GeneralSettings;
    ai: AISettings;
}

export type SettingsTab = 'general' | 'ai' | 'api';
