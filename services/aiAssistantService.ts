import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { GEMINI_MODEL_TEXT, UI_STRINGS } from '@/constants';
import { getSettings } from '@/services/settingsService';
import type { ProjectStateForAssistant, Suggestion, ChatMessage } from '@/types';
import { nanoid } from 'nanoid';
import { handleGeminiError } from '@/services/geminiService';

// Helper to get API key or throw error
const getApiKeyOrThrow = (): string => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error(UI_STRINGS.apiKeyNotConfigured);
    return apiKey;
};

// Helper for parsing JSON safely
const parseJsonSafe = <T,>(jsonString: string): T | null => {
  let cleanJsonString = jsonString.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleanJsonString.match(fenceRegex);
  if (match && match[2]) {
    cleanJsonString = match[2].trim();
  }
  try {
    return JSON.parse(cleanJsonString) as T;
  } catch (error) {
    console.error("Failed to parse JSON from assistant:", cleanJsonString, error);
    return null;
  }
};


export const refineProjectDescription = async (description: string): Promise<string> => {
    const apiKey = getApiKeyOrThrow();
    const settings = getSettings();
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Si expert na projektový manažment a technický konzultant. Tvojou úlohou je preformulovať a vylepšiť nasledujúci popis projektu od používateľa.
Zober základnú myšlienku a rozšír ju do sofistikovaného, profesionálneho a detailného popisu.
- Identifikuj a jasne sformuluj potenciálne ciele.
- Navrhni možné kľúčové funkcie alebo oblasti záujmu.
- Štrukturuj text pre maximálnu zrozumiteľnosť (použi odrážky, ak je to vhodné).
- Zachovaj pôvodný zámer, ale obohať ho o odbornú terminológiu a strategický pohľad.

Pôvodný popis od používateľa:
"${description}"

Odpovedz VÝHRADNE finálnym, vylepšeným textom popisu projektu. Neuvádzaj žiadne sprievodné vety ani vysvetlenia.`;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL_TEXT,
            contents: prompt,
            config: settings.ai.modelParams
        });
        return response.text.trim();
    } catch (error) {
        const errorMessage = handleGeminiError(error, "refineProjectDescription");
        throw new Error(errorMessage);
    }
};

export const getInitialSuggestions = async (projectState: ProjectStateForAssistant): Promise<Suggestion[]> => {
    if (!projectState.currentProjectId) return [];

    const apiKey = getApiKeyOrThrow();
    const settings = getSettings();
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Si proaktívny AI projektový asistent. Analyzuj aktuálny stav projektu a navrhni 3 kreatívne, "out-of-the-box" návrhy na jeho vylepšenie alebo ďalší postup.
Zameraj sa na to, čo v projekte chýba, aké sú potenciálne riziká alebo príležitosti.

Stav projektu:
- Názov: ${projectState.projectTitle}
- Popis: ${projectState.projectDescription}
- Typ projektu: ${projectState.interpretedDetails?.projectType || 'N/A'}
- Tím: ${projectState.team?.map(a => a.role).join(', ') || 'N/A'}
- Aktuálna karta: ${projectState.activeTab}
- Má exekučný plán: ${projectState.newExecutionPlan ? 'Áno' : 'Nie'}
- Počet dokumentov: ${projectState.phaseDocuments?.length || 0}

Príklady dobrých návrhov:
- Ak je projekt veľmi technický, navrhni marketingovú stratégiu.
- Ak v pláne chýba testovanie, navrhni pridať fázu pre QA.
- Navrhni konkrétnu novú technológiu, ktorá by sa mohla hodiť.
- Identifikuj potenciálne riziko a navrhni, ako ho analyzovať.

Odpovedz VÝHRADNE vo formáte JSON s nasledujúcou štruktúrou (pole 3 objektov):
[
  {
    "title": "Krátky názov pre tlačidlo (max 5 slov)",
    "prompt": "Celá otázka/príkaz, ktorý sa pošle do chatu po kliknutí"
  }
]
CRITICAL: Celá tvoja odpoveď MUSÍ byť IBA platný JSON objekt.`;
    
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL_TEXT,
            contents: prompt,
            config: {
                ...settings.ai.modelParams,
                responseMimeType: "application/json",
            }
        });
        return parseJsonSafe<Suggestion[]>(response.text) ?? [];
    } catch (error) {
        const errorMessage = handleGeminiError(error, "getInitialSuggestions");
        throw new Error(errorMessage);
    }
};

export const startChatSession = (history: ChatMessage[]): Chat => {
    const apiKey = getApiKeyOrThrow();
    const settings = getSettings();
    const ai = new GoogleGenAI({ apiKey });

    const formattedHistory = history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    })).filter(msg => msg.role === 'user' || msg.role === 'model'); // System messages are handled differently

    return ai.chats.create({
        model: GEMINI_MODEL_TEXT,
        config: {
            ...settings.ai.modelParams,
            systemInstruction: "Si nápomocný a bystrý AI asistent v rámci aplikácie pre projektový manažment. Odpovedaj stručne a k veci v slovenčine. Používaj Markdown pre formátovanie."
        },
        history: formattedHistory,
    });
};

export const sendMessageToAssistant = async (
    chat: Chat, 
    message: string, 
    projectState: ProjectStateForAssistant,
    isSuggestionFollowUp: boolean = false
): Promise<AsyncGenerator<GenerateContentResponse>> => {
    const projectContext = `
---
Aktuálny kontext projektu pre tvoju informáciu:
Názov: ${projectState.projectTitle}
Popis: ${projectState.projectDescription}
Stav: Nachádzam sa na karte "${projectState.activeTab}".
Plán: ${projectState.newExecutionPlan ? 'Exekučný plán bol vygenerovaný.' : 'Exekučný plán ešte neexistuje.'}
Dokumenty: Zoznam titulkov dokumentov: ${projectState.phaseDocuments?.map(d => `"${d.title}"`).join(', ') || 'Žiadne'}
---
    `;

    let fullMessage = `${message}\n\n${projectContext}`;

    if (isSuggestionFollowUp) {
        fullMessage += `\n\nKRITICKÁ INŠTRUKCIA: Po poskytnutí hlavnej odpovede pripoj na úplný koniec špeciálny blok v tomto PRESNOM formáte s relevantným názvom pre vygenerovaný obsah:
[ZAPRACOVAT_ACTION]
Názov pre záložku: "Krátky a výstižný názov pre tento obsah"
[/ZAPRACOVAT_ACTION]`;
    }
    
    return chat.sendMessageStream({ message: fullMessage });
};