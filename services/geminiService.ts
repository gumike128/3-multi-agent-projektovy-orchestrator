import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_TEXT, UI_STRINGS } from '@/constants'; 
import { getSettings } from '@/services/settingsService';
import type { InterpretedProjectDetails, GenerateContentResponseWithGrounding, MiniAppIdea } from '@/types';
import { AgentRole } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const POPULAR_TASKS_FOR_ROLE: Record<AgentRole, string[]> = {
    [AgentRole.ProjectManager]: ["Vytvoriť časový harmonogram projektu", "Identifikovať potenciálne riziká", "Alokovať zdroje na úlohy"],
    [AgentRole.TechnicalArchitect]: ["Navrhnúť architektúru systému", "Vybrať technologický stack", "Definovať integračné body"],
    [AgentRole.Developer]: ["Implementovať kľúčovú funkcionalitu", "Napísať unit testy pre modul X", "Refaktorovať komponent Y"],
    [AgentRole.BusinessAnalyst]: ["Zozbierať a spresniť požiadavky", "Vytvoriť user stories pre backlog", "Analyzovať biznis procesy"],
    [AgentRole.DataAnalyst]: ["Vyčistiť a pripraviť relevantné dáta", "Vykonať exploratívnu analýzu dát", "Vytvoriť dashboard s kľúčovými metrikami"],
    [AgentRole.DocumentationSpecialist]: ["Napísať úvodnú časť používateľskej príručky", "Vytvoriť návrh API dokumentácie", "Aktualizovať znalostnú bázu o nové funkcie"],
    [AgentRole.QATesting]: ["Vytvoriť testovací plán pre hlavné funkcie", "Napísať automatizované integračné testy", "Reportovať nájdené kritické chyby"],
    [AgentRole.CreativeContent]: ["Navrhnúť UI/UX koncept pre hlavnú obrazovku", "Vytvoriť návrh marketingových materiálov", "Pripraviť grafiku pre úvodnú prezentáciu"]
};

const getApiKey = (): string | null => {
  const settings = getSettings();
  if (typeof settings.ai.apiKey === 'string' && settings.ai.apiKey.trim() !== '') {
    return settings.ai.apiKey.trim();
  }

  const apiKey = process.env.API_KEY;
  if (typeof apiKey === 'string' && apiKey.trim() !== '') {
    return apiKey;
  }
  console.warn("API key not found in environment or settings. AI features will be disabled.");
  // Notify user through UI if possible
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('apiKeyMissing', { detail: { message: "API key is missing. AI features are disabled. Please provide a valid API key in settings." } }));
  }
  // TODO: Future Improvement - Research and implement secure storage or obfuscation for API keys
  // to mitigate risks beyond using environment variables or settings. Consider encryption or secure vault integration.
  return null;
};

/**
 * Wraps a Gemini API call with an exponential backoff retry mechanism.
 * @param params The parameters for the generateContent call.
 * @param maxRetries Maximum number of retries.
 * @param baseDelay The base delay in ms for the first retry.
 * @returns The successful GenerateContentResponse.
 * @throws The last error if all retries fail.
 */
const callGeminiWithRetry = async (
    params: { model: string; contents: any; config?: any; tools?: any[] },
    maxRetries: number = 3,
    baseDelay: number = 2000
): Promise<GenerateContentResponse> => {
    const ai = new GoogleGenAI({ apiKey: getApiKeyOrThrow() });
    const settings = getSettings();
    let lastError: any = null;
    let adaptiveDelay = baseDelay; // Start with base delay, will adjust based on rate limit feedback

    // Apply the initial "politeness" delay from settings before the first attempt
    await delay(settings.ai.apiCallDelay);

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await ai.models.generateContent(params);
            if (response.text?.includes('429') || response.text?.includes('RESOURCE_EXHAUSTED')) {
                throw new Error(UI_STRINGS.rateLimitError);
            }
            // If successful, reduce the delay slightly for next time (minimum 500ms to avoid being too aggressive)
            adaptiveDelay = Math.max(500, adaptiveDelay - 500);
            console.debug(`API call successful. Adjusted adaptive delay to ${adaptiveDelay}ms for future calls.`);
            return response;
        } catch (error: any) {
            lastError = error;
            const errorMessage = (error?.message || error.toString()).toLowerCase();
            const isRateLimitError = errorMessage.includes('429') || errorMessage.includes('resource_exhausted') || errorMessage.includes('rate limit');
            const isInvalidApiKeyError = errorMessage.includes('api key not valid') || errorMessage.includes('invalid_argument');
            const isNetworkError = errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout');
            const isInputError = errorMessage.includes('invalid input') || errorMessage.includes('malformed') || errorMessage.includes('validation failed');

            if (isInvalidApiKeyError) {
                throw new Error('API key is invalid. Please provide a valid API key.');
            } else if (isRateLimitError && i < maxRetries - 1) {
                // Increase delay more aggressively on rate limit to back off further
                adaptiveDelay = adaptiveDelay * 2;
                const waitTime = adaptiveDelay + Math.random() * 1000;
                console.warn(`Rate limit hit. Retrying in ${Math.round(waitTime / 1000)}s with increased delay of ${adaptiveDelay}ms... (Attempt ${i + 2}/${maxRetries})`);
                await delay(waitTime);
            } else if (isNetworkError) {
                throw new Error('Network issue occurred while connecting to Gemini API. Please check your internet connection and try again.');
            } else if (isInputError) {
                throw new Error('Invalid input provided to Gemini API. Please review the request parameters.');
            } else if (i === maxRetries - 1) {
                // Notify user through UI if retries are exhausted
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('apiError', { detail: { message: "Persistent error with Gemini API after multiple retries. Please try again later or contact support." } }));
                }
                throw new Error('Maximum retries reached for Gemini API call. Please try again later.');
            } else {
                throw error; // Other errors, or not the last retry, so fail with original error.
            }
        }
    }
    throw lastError; // Should not be reached, but for safety
};


const getApiKeyOrThrow = (): string => {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.warn("API key not configured. AI features will be disabled.");
        // Notify user through UI if possible
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('apiKeyMissing', { detail: { message: "API key is missing. AI features are disabled. Please provide a valid API key in settings." } }));
        }
        throw new Error(UI_STRINGS.apiKeyNotConfigured);
    }
    return apiKey;
}

const parseJsonSafe = <T,>(jsonString: string, fallbackPrompt?: string): T => {
  let cleanJsonString = jsonString.trim();
  
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleanJsonString.match(fenceRegex);
  if (match && match[2]) {
    cleanJsonString = match[2].trim();
  }
  
  // Sanitize string to remove CJK characters which sometimes appear as artifacts and break JSON.parse
  // This is a heuristic for this specific app context where CJK characters are not expected.
  cleanJsonString = cleanJsonString.replace(/[\u4e00-\u9faf\u3000-\u303f]/g, '');

  const firstBracket = cleanJsonString.indexOf('[');
  const firstBrace = cleanJsonString.indexOf('{');
  
  let start = -1;

  if (firstBracket === -1 && firstBrace === -1) {
    // No JSON object/array found
  } else if (firstBracket === -1) {
      start = firstBrace;
  } else if (firstBrace === -1) {
      start = firstBracket;
  } else {
      start = Math.min(firstBracket, firstBrace);
  }

  if (start !== -1) {
    const lastBracket = cleanJsonString.lastIndexOf(']');
    const lastBrace = cleanJsonString.lastIndexOf('}');
    const end = Math.max(lastBracket, lastBrace);
    if (end > start) {
      cleanJsonString = cleanJsonString.substring(start, end + 1);
    }
  }

  // Additional sanitization for common issues in AI-generated JSON
  // Remove trailing commas before closing brackets or braces
  cleanJsonString = cleanJsonString.replace(/,\s*([\]}])/g, '$1');
  // Replace single quotes with double quotes for valid JSON
  cleanJsonString = cleanJsonString.replace(/'/g, '"');
  // Attempt to fix unbalanced quotes or brackets by ensuring closure (basic heuristic)
  let openBraces = (cleanJsonString.match(/\{/g) || []).length;
  let closeBraces = (cleanJsonString.match(/\}/g) || []).length;
  while (openBraces > closeBraces && cleanJsonString.length > 0) {
    cleanJsonString += '}';
    closeBraces++;
  }
  let openBrackets = (cleanJsonString.match(/\[/g) || []).length;
  let closeBrackets = (cleanJsonString.match(/\]/g) || []).length;
  while (openBrackets > closeBrackets && cleanJsonString.length > 0) {
    cleanJsonString += ']';
    closeBrackets++;
  }

  try {
    return JSON.parse(cleanJsonString) as T;
  } catch (error) {
    console.error("Failed to parse JSON response:", cleanJsonString, error);
    
    // Attempt a secondary parse with a more aggressive cleanup if first attempt fails
    try {
      // Recalculate boundaries for the secondary attempt
      const firstBracketSecondary = cleanJsonString.indexOf('[');
      const firstBraceSecondary = cleanJsonString.indexOf('{');
      const lastBracketSecondary = cleanJsonString.lastIndexOf(']');
      const lastBraceSecondary = cleanJsonString.lastIndexOf('}');
      
      // Remove any non-JSON content before or after the main structure
      const jsonStart = Math.min(firstBracketSecondary !== -1 ? firstBracketSecondary : Infinity, firstBraceSecondary !== -1 ? firstBraceSecondary : Infinity);
      const jsonEnd = Math.max(lastBracketSecondary !== -1 ? lastBracketSecondary : -Infinity, lastBraceSecondary !== -1 ? lastBraceSecondary : -Infinity);
      if (jsonStart !== Infinity && jsonEnd !== -Infinity && jsonEnd > jsonStart) {
        cleanJsonString = cleanJsonString.substring(jsonStart, jsonEnd + 1);
        // Retry parsing with the cleaned-up string
        return JSON.parse(cleanJsonString) as T;
      }
    } catch (secondaryError) {
      console.error("Secondary JSON parse attempt failed:", cleanJsonString, secondaryError);
    }
    
    let errorMessage = UI_STRINGS.aiResponseParseError;
    if (fallbackPrompt) {
       console.warn("Original prompt for failed JSON parse:", fallbackPrompt);
    }
    if (jsonString.includes("error") && jsonString.includes("message")) {
        try {
            const errorObj = JSON.parse(jsonString); 
            if (errorObj.error && errorObj.error.message) {
                if (errorObj.error.code === 429 || errorObj.error.status === "RESOURCE_EXHAUSTED") {
                    errorMessage = UI_STRINGS.rateLimitError;
                } else {
                    errorMessage = `AI Error: ${errorObj.error.message}`;
                }
            }
        } catch (e) { /* ignore */ }
    } else if (jsonString.toLowerCase().includes("blocked") || jsonString.toLowerCase().includes("safety")) {
        errorMessage = UI_STRINGS.aiSafetyBlockedError;
    }

    throw new Error(errorMessage);
  }
};

export const handleGeminiError = (error: any, functionName: string, specificContext?: string): string => {
    console.error(`Gemini API error in ${functionName}${specificContext ? ` (${specificContext})` : ''}:`, error);
    let errorMessage = UI_STRINGS.defaultError;

    if (error instanceof Error) {
        const lowerCaseMessage = error.message.toLowerCase();
        if (lowerCaseMessage.includes('429') || lowerCaseMessage.includes('resource_exhausted') || lowerCaseMessage.includes('rate limit')) {
            errorMessage = UI_STRINGS.rateLimitError;
        } else if (error.message.startsWith('{') && error.message.includes('"error"')) {
            try {
                const parsed = JSON.parse(error.message);
                if (parsed.error && parsed.error.message) {
                    if (parsed.error.code === 429 || parsed.error.status === "RESOURCE_EXHAUSTED") {
                        errorMessage = UI_STRINGS.rateLimitError;
                    } else {
                       errorMessage = `AI Error: ${parsed.error.message}`;
                    }
                } else {
                    errorMessage = error.message; 
                }
            } catch (parseErr) {
                errorMessage = error.message; 
            }
        } else {
            errorMessage = error.message; 
        }
    } else if (typeof error === 'string') {
        const lowerCaseError = error.toLowerCase();
         if (lowerCaseError.includes('429') || lowerCaseError.includes('resource_exhausted') || lowerCaseError.includes('rate limit')) {
            errorMessage = UI_STRINGS.rateLimitError;
        } else {
            errorMessage = error;
        }
    }
    
    if (errorMessage === UI_STRINGS.defaultError && error?.error?.message) {
        const lowerCaseErrorMessage = error.error.message.toLowerCase();
         if (error.error.code === 429 || error.error.status === "RESOURCE_EXHAUSTED" || lowerCaseErrorMessage.includes('rate limit')) {
            errorMessage = UI_STRINGS.rateLimitError;
        } else {
            errorMessage = `AI Error: ${error.error.message}`;
        }
    }
    return errorMessage;
};

/**
 * Programmatically fixes common Mermaid syntax errors from AI generation.
 * This version is context-aware for different diagram types and more robust.
 * @param markdownText The raw markdown text from the AI.
 * @returns Text with fixed Mermaid blocks.
 */
const fixMermaidSyntax = (markdownText: string): string => {
    const mermaidBlockRegex = /(```mermaid\s*\n)([\s\S]*?)(\n```)/g;

    return markdownText.replace(mermaidBlockRegex, (_match, opening, content, closing) => {
        // First, universally clean comments: remove any trailing semicolons from the comments themselves.
        let fixedContent = content.replace(/(%%.*);(\s*)$/gm, '$1$2');

        // Determine the intended diagram type by checking the content for specific keywords.
        let diagramType = 'graph TD';
        if (content.toLowerCase().includes('sequencediagram') || content.toLowerCase().includes('participant') || content.toLowerCase().includes('->>')) {
            diagramType = 'sequenceDiagram';
        } else if (content.toLowerCase().includes('stateDiagram') || content.toLowerCase().includes('[*]') || content.toLowerCase().includes('state ')) {
            diagramType = 'stateDiagram-v2';
        } else if (content.toLowerCase().includes('classdiagram') || content.toLowerCase().includes('class ')) {
            diagramType = 'classDiagram';
        } else if (content.toLowerCase().includes('mindmap') || content.toLowerCase().includes('root((')) {
            diagramType = 'mindmap';
        }

        // If the content doesn't start with the correct diagram type, prepend it.
        if (!content.trim().toLowerCase().startsWith(diagramType.toLowerCase())) {
            fixedContent = `${diagramType}\n${fixedContent}`;
            console.debug(`Mermaid syntax fix: Prepended diagram type '${diagramType}' to content.`);
        }

        // Remove any conflicting or duplicate diagram type declarations to prevent syntax errors.
        fixedContent = fixedContent.replace(/graph\s+(TD|LR|RL|BT|TB);?/gi, (match: string) => {
            if (!match.toLowerCase().startsWith(diagramType.toLowerCase())) {
                console.debug(`Mermaid syntax fix: Removed conflicting diagram type declaration '${match}'.`);
                return '';
            }
            return match;
        });
        fixedContent = fixedContent.replace(/sequenceDiagram/gi, (match: string) => {
            if (!match.toLowerCase().startsWith(diagramType.toLowerCase())) {
                console.debug(`Mermaid syntax fix: Removed conflicting diagram type declaration '${match}'.`);
                return '';
            }
            return match;
        });
        fixedContent = fixedContent.replace(/stateDiagram-v2/gi, (match: string) => {
            if (!match.toLowerCase().startsWith(diagramType.toLowerCase())) {
                console.debug(`Mermaid syntax fix: Removed conflicting diagram type declaration '${match}'.`);
                return '';
            }
            return match;
        });
        fixedContent = fixedContent.replace(/classDiagram/gi, (match: string) => {
            if (!match.toLowerCase().startsWith(diagramType.toLowerCase())) {
                console.debug(`Mermaid syntax fix: Removed conflicting diagram type declaration '${match}'.`);
                return '';
            }
            return match;
        });
        fixedContent = fixedContent.replace(/mindmap/gi, (match: string) => {
            if (!match.toLowerCase().startsWith(diagramType.toLowerCase())) {
                console.debug(`Mermaid syntax fix: Removed conflicting diagram type declaration '${match}'.`);
                return '';
            }
            return match;
        });

        // Rule 1: For node definition lines, ensure a semicolon and move comments to a new line.
        // A node definition is one that defines a node's shape/text, e.g., A["Text"], B(Round), C{DB}
        // It does NOT contain a link arrow like -->, ---, etc.
        const nodeCommentRegex = /^(\s*\w+(?:\[.*?\]|\(.*?\)|{.*?})(?:\s*;)?)\s*(%%.*)$/gm;
        fixedContent = fixedContent.replace(nodeCommentRegex, (match: string, nodeDef: string, comment: string) => {
            // Ensure the node definition ends with a semicolon and move the comment to a new line with an extra newline.
            const result = nodeDef.trim().endsWith(';') ? `${nodeDef.trim()}\n${comment.trim()}\n` : `${nodeDef.trim()};\n${comment.trim()}\n`;
            console.debug(`Mermaid syntax fix: Applied Rule 1 - Moved comment to new line for node definition '${nodeDef.trim()}'.`);
            return result;
        });

        // Rule 2: For link definition lines, ensure a semicolon and move comments to a new line.
        // Matches lines with arrows like -->, ---, ==> etc. that are missing a semicolon before a comment.
        const linkCommentRegex = /^(\s*.+?\s*(?:-->|---|==>).+?(?:\s*;)?)\s*(%%.*)$/gm;
        fixedContent = fixedContent.replace(linkCommentRegex, (match: string, linkDef: string, comment: string) => {
            // Ensure the link definition ends with a semicolon and move the comment to a new line with an extra newline.
            const result = linkDef.trim().endsWith(';') ? `${linkDef.trim()}\n${comment.trim()}\n` : `${linkDef.trim()};\n${comment.trim()}\n`;
            console.debug(`Mermaid syntax fix: Applied Rule 2 - Moved comment to new line for link definition '${linkDef.trim()}'.`);
            return result;
        });

        // Rule 3: Ensure every line with a node or link definition ends with a semicolon if it doesn't already.
        // This targets lines that define nodes or links but might be missing a semicolon.
        const definitionRegex = /^(\s*(?:\w+(?:\[.*?\]|\(.*?\)|{.*?})|\w+\s*(?:-->|---|==>)\s*[\w\[\(\{]))(?:\s*%%.*)?$/gm;
        fixedContent = fixedContent.replace(definitionRegex, (lineMatch: string) => {
            // If the line doesn't end with a semicolon, add one.
            const trimmedLine = lineMatch.trim();
            if (trimmedLine.endsWith(';') || trimmedLine.endsWith('%%')) {
                return lineMatch;
            }
            console.debug(`Mermaid syntax fix: Applied Rule 3 - Added semicolon to definition line '${trimmedLine}'.`);
            return `${trimmedLine};`;
        });

        // Rule 4: Handle comments immediately after the diagram type declaration.
        // Move any comment on the same line as the diagram type to a new line.
        const diagramTypeCommentRegex = /^(\s*(?:graph\s+(?:TD|LR|RL|BT|TB)|sequenceDiagram|stateDiagram-v2|classDiagram|mindmap)\s*;?\s*)(%%.*)$/gm;
        fixedContent = fixedContent.replace(diagramTypeCommentRegex, (match: string, typeDef: string, comment: string) => {
            console.debug(`Mermaid syntax fix: Applied Rule 4 - Moved comment after diagram type '${typeDef.trim()}' to new line.`);
            return `${typeDef.trim()}\n${comment.trim()}\n`;
        });

        // Rule 5: Replace any invalid characters or problematic syntax in node labels.
        // Ensure node labels with special characters are properly quoted.
        const nodeLabelRegex = /(\w+)\[([^"]*?)\]/g;
        fixedContent = fixedContent.replace(nodeLabelRegex, (match: string, nodeId: string, label: string) => {
            if (label.includes('(') || label.includes(')') || label.includes('/') || label.includes('[') || label.includes(']')) {
                console.debug(`Mermaid syntax fix: Applied Rule 5 - Added quotes to node label '${label}' for node '${nodeId}'.`);
                return `${nodeId}["${label}"]`;
            }
            return match;
        });

        // Rule 6: For mindmap, ensure proper structure by removing indentation that might confuse the parser.
        if (diagramType === 'mindmap') {
            fixedContent = fixedContent.replace(/^\s{2,}/gm, '');
            console.debug(`Mermaid syntax fix: Applied Rule 6 - Removed indentation for mindmap diagram.`);
        }

        // Check if the fixed content is significantly different from the original to log potential issues
        if (fixedContent !== content) {
            console.debug(`Mermaid syntax fix: Applied fixes to Mermaid diagram content. Diagram type determined as '${diagramType}'.`);
        } else {
            console.debug(`Mermaid syntax fix: No fixes were necessary for Mermaid diagram content. Diagram type determined as '${diagramType}'.`);
        }

        return `${opening}${fixedContent}${closing}`;
    });
};


export const interpretRequest = async (description: string): Promise<InterpretedProjectDetails> => {
  const settings = getSettings();
  
  const prompt = `Analyzuj nasledujúcu požiadavku na projekt: "${description}".
Identifikuj typ projektu (napr. vývoj softvéru, marketingová kampaň, dátová analýza, tvorba obsahu), hlavné ciele (3-5) a kľúčové oblasti expertízy (3-5) potrebné na jeho realizáciu.
Odpovedz VÝHRADNE vo formáte JSON s nasledujúcou štruktúrou:
{
  "projectType": "string",
  "goals": ["string"],
  "expertise": ["string"]
}
CRITICAL: Celá tvoja odpoveď MUSÍ byť IBA platný JSON objekt.`;

  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn("No API key configured for Gemini API. Returning fallback response for interpretRequest.");
      return {
        projectType: "Generic Project",
        goals: ["Define project scope", "Plan resources", "Execute tasks", "Monitor progress", "Deliver results"],
        expertise: ["Project Management", "Technical Skills", "Communication"]
      };
    }
    const response: GenerateContentResponse = await callGeminiWithRetry({
        model: GEMINI_MODEL_TEXT,
        contents: prompt,
        config: { 
            responseMimeType: "application/json",
            ...settings.ai.modelParams
        }
    });
    return parseJsonSafe<InterpretedProjectDetails>(response.text || '', prompt);
  } catch (error) {
    const errorMessage = handleGeminiError(error, "interpretRequest");
    console.error(`Error in interpretRequest: ${errorMessage}`);
    return {
      projectType: "Generic Project",
      goals: ["Define project scope", "Plan resources", "Execute tasks", "Monitor progress", "Deliver results"],
      expertise: ["Project Management", "Technical Skills", "Communication"]
    };
  }
};

export interface AgentOutputForPlanGen {
    agentRole: AgentRole;
    assignedTask: string;
    taskOutput: string | null | undefined;
}

export interface RawSubTask {
    title: string;
    elaborationPrompt: string;
    agentRoleHint?: AgentRole;
}
export interface RawExecutionPhase {
    phaseTitle: string;
    phaseObjective: string;
    subTasks: RawSubTask[];
}

export const generateNewExecutionPlan = async (
    projectTitle: string,
    projectDescription: string,
    agentOutputs: AgentOutputForPlanGen[]
): Promise<RawExecutionPhase[]> => {
    const settings = getSettings();

    const formattedAgentOutputs = agentOutputs.map(ao => 
        `Agent ${ao.agentRole}:\n  - Priradená úloha: ${ao.assignedTask}\n  - Výstup úlohy: ${ao.taskOutput || "Nebol poskytnutý žiadny výstup."}`
    ).join("\n\n");

    const prompt = `Na základe nasledujúcich detailov projektu a výstupov od agentov, vytvor štruktúrovaný exekučný plán.
Projekt: "${projectTitle}"
Popis: "${projectDescription}"

Výstupy od agentov:
${formattedAgentOutputs}

Plán by mal pozostávať z 3-5 hlavných fáz. Každá fáza by mala mať jasný cieľ a 2-4 pod-úlohy.
Pre každú pod-úlohu navrhni:
1.  "title": Krátky, výstižný názov pod-úlohy (max 5-7 slov).
2.  "elaborationPrompt": Detailnejší prompt (2-3 vety), ktorý neskôr poslúži ako inštrukcia pre AI na vygenerovanie konkrétneho obsahu/výstupu pre túto pod-úlohu. Tento prompt by mal špecifikovať, čo presne má AI vygenerovať.
3.  "agentRoleHint" (voliteľné): Navrhni rolu agenta (z: ${Object.values(AgentRole).join(", ")}) najvhodnejšiu na vypracovanie tejto pod-úlohy. Ak nie je jasné, ponechaj prázdne.

Odpovedz VÝHRADNE vo formáte JSON s nasledujúcou štruktúrou (pole objektov fáz):
[
  {
    "phaseTitle": "string",
    "phaseObjective": "string",
    "subTasks": [
      {
        "title": "string",
        "elaborationPrompt": "string",
        "agentRoleHint": "string (AgentRole enum value or empty)" 
      }
    ]
  }
]
CRITICAL: Celá tvoja odpoveď MUSÍ byť IBA platný JSON objekt.`;

    try {
        const response = await callGeminiWithRetry({
            model: GEMINI_MODEL_TEXT,
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                ...settings.ai.modelParams
            }
        });
        return parseJsonSafe<RawExecutionPhase[]>(response.text || '', prompt);
    } catch (error) {
        const errorMessage = handleGeminiError(error, "generateNewExecutionPlan");
        throw new Error(`${UI_STRINGS.errorGeneratingNewPlan}: ${errorMessage}`);
    }
};


export const generateAgentTask = async (agentRole: AgentRole, projectContext: string): Promise<string> => {
    const fallbackTasks = POPULAR_TASKS_FOR_ROLE[agentRole] || ["Vykonávať špecifické úlohy pre rolu."];
    const fallbackTask = fallbackTasks[Math.floor(Math.random() * fallbackTasks.length)];

    if (!getApiKey()) {
        console.warn(`API_KEY not set for generateAgentTask. Using fallback for ${agentRole}.`);
        return fallbackTask;
    }
    
    const settings = getSettings();
    const prompt = `Si ${agentRole}. Kontext projektu je: "${projectContext}". Navrhni jednu konkrétnu, stručnú (max 10-12 slov) počiatočnú úlohu. Odpovedz IBA textom úlohy.`;

    try {
      const response = await callGeminiWithRetry({
        model: GEMINI_MODEL_TEXT,
        contents: prompt,
        config: settings.ai.modelParams
      });
      let taskText = response.text ? response.text.trim() : '';
      if (taskText && ((taskText.startsWith('"') && taskText.endsWith('"')) || (taskText.startsWith("'") && taskText.endsWith("'")))) {
        taskText = taskText.substring(1, taskText.length - 1);
      }
      return taskText || fallbackTask;
    } catch (error) {
      const errorMessage = handleGeminiError(error, "generateAgentTask", agentRole.toString());
      console.error(`Error generating task for ${agentRole} (using fallback). Error: ${errorMessage}`);
      return fallbackTask;
    }
};

export const executeAgentTask = async (agentRole: AgentRole, assignedTask: string, projectDescription: string): Promise<string> => {
  const settings = getSettings();

  const prompt = `Ako expert v role "${agentRole}", vašou úlohou je: "${assignedTask}". Kontext projektu: "${projectDescription}". Vygenerujte stručný výstup (2-5 viet/odrážok) vo formáte Markdown.
Špecifické inštrukcie pre formátovanie:
- Pre bloky kódu použi štandardné ohraničenie s určením jazyka (napr. \`\`\`javascript).
- Pre diagramy použi ohraničenie \`\`\`mermaid.
- DÔLEŽITÉ pre Mermaid:
  - Vždy začni s definíciou grafu, napr. \`graph TD;\`.
  - Ak text v uzle obsahuje špeciálne znaky (zátvorky, lomky, atď.), MUSÍ byť celý text uzavretý v dvojitých úvodovkách. Príklad: \`A["Text so (zátvorkami) a /lomkou"]\`.
  - ULTRA-KRITICKÉ PRAVIDLO PRE KOMENTÁRE: Každý príkaz (definícia uzla ALEBO spojenie) MUSÍ končiť bodkočiarkou (;), ak za ním na tom istom riadku nasleduje komentár začínajúci s \`%%\`. Komentár musí byť posledná vec na riadku.
    - NESPRÁVNE: \`A["Text uzla"] %% Toto je komentár\`
    - SPRÁVNE:   \`A["Text uzla"]; %% Toto je komentár\`
    - NESPRÁVNE: \`A --> B %% Ďalší komentár\`
    - SPRÁVNE:   \`A --> B; %% Ďalší komentár\`
Nedodržanie tohto pravidla o bodkočiarke pred komentárom spôsobí chybu!

Odpovedzte priamo textom výstupu.`;

  try {
    const response = await callGeminiWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: settings.ai.modelParams
    });
    const rawText = response.text ? response.text.trim() : '';
    return fixMermaidSyntax(rawText);
  } catch (error) {
    const errorMessage = handleGeminiError(error, "executeAgentTask", agentRole.toString());
    throw new Error(`${UI_STRINGS.errorExecutingAgentTask} (${agentRole}): ${errorMessage}`);
  }
};

export const elaborateSubTaskContent = async (
    subTaskTitle: string,
    elaborationPrompt: string,
    phaseObjective: string,
    projectContext: string, 
    agentRoleHint?: AgentRole | null
): Promise<string> => {
    const settings = getSettings();

    let roleContext = "";
    if (agentRoleHint) {
        roleContext = `Predpokladaj, že si expert v role "${agentRoleHint}".`;
    }

    const prompt = `${roleContext}
Máš za úlohu vypracovať obsah pre pod-úlohu s názvom: "${subTaskTitle}".
Cieľ fázy, v ktorej sa táto pod-úloha nachádza, je: "${phaseObjective}".
Celkový kontext projektu: "${projectContext}".

Tvojou hlavnou inštrukciou pre vypracovanie tejto pod-úlohy je nasledujúci prompt:
"${elaborationPrompt}"

Na základe vyššie uvedeného vygeneruj konkrétny a použiteľný textový výstup.
Výstup by mal byť vo formáte Markdown.
Špecifické inštrukcie pre formátovanie:
- Pre bloky kódu použi štandardné ohraničenie s určením jazyka (napr. \`\`\`javascript).
- Pre diagramy použi ohraničenie \`\`\`mermaid.
- DÔLEŽITÉ pre Mermaid:
  - Vždy začni s definíciou grafu, napr. \`graph TD;\`.
  - Ak text v uzle obsahuje špeciálne znaky (zátvorky, lomky, atď.), MUSÍ byť celý text uzavretý v dvojitých úvodovkách. Príklad: \`A["Text so (zátvorkami) a /lomkou"]\`.
  - ULTRA-KRITICKÉ PRAVIDLO PRE KOMENTÁRE: Každý príkaz (definícia uzla ALEBO spojenie) MUSÍ končiť bodkočiarkou (;), ak za ním na tom istom riadku nasleduje komentár začínajúci s \`%%\`. Komentár musí byť posledná vec na riadku.
    - NESPRÁVNE: \`A["Text uzla"] %% Toto je komentár\`
    - SPRÁVNE:   \`A["Text uzla"]; %% Toto je komentár\`
    - NESPRÁVNE: \`A --> B %% Ďalší komentár\`
    - SPRÁVNE:   \`A --> B; %% Ďalší komentár\`
Nedodržanie tohto pravidla o bodkočiarke pred komentárom spôsobí chybu!

Odpovedz priamo vygenerovaným obsahom. Neuvádzaj žiadne úvodné frázy ako "Tu je vypracovanie:" alebo podobne.`;

    try {
        const response = await callGeminiWithRetry({
            model: GEMINI_MODEL_TEXT,
            contents: prompt,
            config: settings.ai.modelParams
        });
        const rawText = response.text ? response.text.trim() : '';
        return fixMermaidSyntax(rawText);
    } catch (error) {
        const errorMessage = handleGeminiError(error, "elaborateSubTaskContent", subTaskTitle);
        throw new Error(`${UI_STRINGS.errorElaboratingSubTask}: ${errorMessage}`);
    }
};

export const continueElaboration = async (
    existingContent: string,
    instruction: string
): Promise<string> => {
    const settings = getSettings();

    const prompt = `Pokračuj v nasledujúcom texte na základe inštrukcie. Zachovaj pôvodný formát a plynule nadviaž na existujúci obsah.

Existujúci obsah (Markdown):
---
${existingContent}
---

Inštrukcia pre pokračovanie: "${instruction}"

Odpovedz IBA kompletným textom, ktorý obsahuje pôvodný obsah a tvoje doplnenie. Neuvádzaj žiadne sprievodné vety.`;
    
    try {
        const response = await callGeminiWithRetry({
            model: GEMINI_MODEL_TEXT,
            contents: prompt,
            config: settings.ai.modelParams
        });
        return response.text ? response.text.trim() : '';
    } catch (error) {
        const errorMessage = handleGeminiError(error, "continueElaboration");
        throw new Error(`${UI_STRINGS.errorElaboratingSubTask}: ${errorMessage}`);
    }
};


export const generateDocumentationOutline = async (projectType: string): Promise<string> => {
  const settings = getSettings();

  const prompt = `Pre projekt typu "${projectType}", navrhni stručnú osnovu kľúčových dokumentov (4-6). Odpovedz ako jednoduchý textový zoznam (použi odrážky).`;

  try {
    const response: GenerateContentResponse = await callGeminiWithRetry({
        model: GEMINI_MODEL_TEXT,
        contents: prompt,
        config: settings.ai.modelParams
    });
    return response.text ? response.text.trim() : '';
  } catch (error) {
    const errorMessage = handleGeminiError(error, "generateDocumentationOutline", projectType);
    throw new Error(`${UI_STRINGS.errorGeneratingDocOutline}: ${errorMessage}`);
  }
};

export const searchRelatedInformation = async (query: string): Promise<GenerateContentResponseWithGrounding> => {
    const settings = getSettings();
    try {
        const response = await callGeminiWithRetry({
            model: GEMINI_MODEL_TEXT,
            contents: query,
            tools: [{ googleSearch: {} }],
            config: {
                ...settings.ai.modelParams
            },
        }, 2); // Less retries for search as it might be a different kind of quota
        return response as GenerateContentResponseWithGrounding; 
    } catch (error) {
        const errorMessage = handleGeminiError(error, "searchRelatedInformation", query);
        throw new Error(`${UI_STRINGS.errorDuringSearch}: ${errorMessage}`);
    }
};

export const generateMiniAppIdeas = async (projectContext: string, existingIdeas: string[] = []): Promise<MiniAppIdea[]> => {
    const settings = getSettings();
    const existingIdeasPrompt = existingIdeas.length > 0 
        ? `Nasledujúce nápady už boli navrhnuté, prosím, vygeneruj iné: ${existingIdeas.join(', ')}.`
        : '';

    const prompt = `Analyzuj nasledujúci kontext projektu a navrhni presne 3 užitočné, samostatné "miniaplikácie", ktoré by mohli pomôcť pri práci na projekte.
Tieto miniaplikácie by mali byť malé, jednoúčelové nástroje.
${existingIdeasPrompt}

Projektový kontext:
---
${projectContext}
---

Pre každý nápad na miniaplikáciu definuj:
1.  **title**: Krátky a výstižný názov (napr. "Generátor Testovacích Dát", "Kalkulačka Rentability").
2.  **description**: Jedna veta popisujúca, čo miniaplikácia robí.
3.  **creationPrompt**: Toto je najdôležitejšia časť. Vytvor detailný, "inžiniersky" prompt pre AI model, ktorý pošleme neskôr, aby vygeneroval KÓD pre túto miniaplikáciu. Tento prompt musí obsahovať jasné inštrukcie na vygenerovanie **jedného, kompletného, sebestačného HTML súboru**.
    - Prompt musí explicitne žiadať, aby všetok CSS a JavaScript bol inline (vo "style" a "script" tagoch vnútri HTML).
    - Nesmie používať žiadne externé knižnice ani obrázky (všetko musí byť čisté HTML/CSS/JS alebo SVG ikony).
    - Musí byť navrhnutý tak, aby fungoval v \`iframe\` bez narušenia hostiteľskej stránky.

Odpovedz VÝHRADNE vo formáte JSON poľa presne 3 objektov s nasledujúcou štruktúrou:
[
  {
    "title": "string",
    "description": "string",
    "creationPrompt": "string"
  }
]
CRITICAL: Celá tvoja odpoveď MUSÍ byť IBA platný JSON objekt.`;

    try {
        const response = await callGeminiWithRetry({
            model: GEMINI_MODEL_TEXT,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                ...settings.ai.modelParams,
            },
        });
        return parseJsonSafe<MiniAppIdea[]>(response.text || '', prompt);
    } catch (error) {
        const errorMessage = handleGeminiError(error, "generateMiniAppIdeas");
        throw new Error(`${UI_STRINGS.errorGeneratingMiniAppIdeas}: ${errorMessage}`);
    }
};

export const optimizeMiniAppPrompt = async (userDescription: string, projectContext: string): Promise<MiniAppIdea> => {
    const settings = getSettings();
    const prompt = `Si expert na prompt engineering. Tvojou úlohou je pretransformovať jednoduchý nápad od používateľa na profesionálny, detailný prompt na generovanie kódu miniaplikácie.
Nápad od používateľa: "${userDescription}"
Kontext hlavného projektu: "${projectContext}"

Vytvor jeden JSON objekt, ktorý bude obsahovať:
1.  **title**: Vymysli krátky, výstižný názov pre miniaplikáciu na základe popisu.
2.  **description**: Napíš jednu vetu, ktorá jasne popisuje, čo miniaplikácia robí.
3.  **creationPrompt**: Toto je kľúčová časť. Vytvor detailný, "inžiniersky" prompt, ktorý bude použitý na vygenerovanie kódu miniaplikácie. Tento prompt musí obsahovať:
    - Požiadavku na vygenerovanie **jedného, kompletného, sebestačného HTML súboru**.
    - Požiadavku, aby všetok CSS a JavaScript bol inline (v \`<style>\` a \`<script>\` tagoch).
    - Nesmú byť použité žiadne externé knižnice (napr. React, Vue, jQuery) ani externé obrázky/fonty. Povolené sú iba inline SVG ikony.
    - Presnú definíciu funkcionality, vstupných polí, tlačidiel a očakávaného výstupu.
    - Inštrukcie pre pekný, moderný a responzívny dizajn (napr. použitie flexbox/grid, tmavý režim ako predvolený s možnosťou prepnutia na svetlý). Dizajn by mal byť profesionálny a čistý.
    - Kód musí byť navrhnutý tak, aby fungoval bezchybne v \`<iframe>\` bez narušenia hostiteľskej stránky.

Odpovedz VÝHRADNE jedným JSON objektom s nasledujúcou štruktúrou:
{
  "title": "string",
  "description": "string",
  "creationPrompt": "string"
}
CRITICAL: Celá tvoja odpoveď MUSÍ byť IBA platný JSON objekt, nie pole.`;

     try {
        const response = await callGeminiWithRetry({
            model: GEMINI_MODEL_TEXT,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                ...settings.ai.modelParams,
            },
        });
        return parseJsonSafe<MiniAppIdea>(response.text || '', prompt);
    } catch (error) {
        const errorMessage = handleGeminiError(error, "optimizeMiniAppPrompt");
        throw new Error(`${UI_STRINGS.errorOptimizingPrompt}: ${errorMessage}`);
    }
}

export const generateMiniAppCode = async (creationPrompt: string): Promise<string> => {
    const settings = getSettings();
    try {
        const response = await callGeminiWithRetry({
            model: GEMINI_MODEL_TEXT,
            contents: creationPrompt, // The prompt to generate the code is passed directly
            config: {
                 ...settings.ai.modelParams,
                 temperature: 0.3, // Lower temperature for more predictable code generation
            }
        });

        // Clean up the response to get only the HTML code
        let htmlCode = response.text ? response.text.trim() : '';
        
        if (htmlCode) {
            // 1. Try to extract from a markdown code fence first
            const htmlFenceRegex = /```(?:html)?\s*\n?(.*?)\n?```/s;
            const match = htmlCode.match(htmlFenceRegex);
            
            if (match && match[1]) {
                htmlCode = match[1].trim();
            } else {
                // 2. If no fence, find the start of the HTML document
                const doctypeIndex = htmlCode.toLowerCase().indexOf('<!doctype html>');
                if (doctypeIndex !== -1) {
                    htmlCode = htmlCode.substring(doctypeIndex);
                }
            }
        }
        
        return htmlCode;
    } catch (error) {
        const errorMessage = handleGeminiError(error, "generateMiniAppCode");
        throw new Error(`${UI_STRINGS.errorCreatingMiniApp}: ${errorMessage}`);
    }
};
