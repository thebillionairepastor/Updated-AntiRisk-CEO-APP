
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION_ADVISOR, SYSTEM_INSTRUCTION_TRAINER, SYSTEM_INSTRUCTION_WEEKLY_TIP } from "../constants";
import { ChatMessage, StoredReport, KnowledgeDocument } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- IN-MEMORY CACHE ---
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 Hour Cache
const responseCache = new Map<string, { text: string; sources?: any[]; timestamp: number }>();

const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString();
};

const getCacheKey = (prefix: string, ...args: any[]) => {
  try {
    const argString = JSON.stringify(args);
    const uniquePart = argString.length > 100 ? simpleHash(argString) : argString;
    return `${prefix}::${uniquePart}`;
  } catch (e) {
    return `${prefix}::${Date.now()}`;
  }
};

const getFromCache = (key: string) => {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) return cached;
  if (cached) responseCache.delete(key);
  return null;
};

const setInCache = (key: string, text: string, sources?: any[]) => {
  if (responseCache.size > 50) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey) responseCache.delete(firstKey);
  }
  responseCache.set(key, { text, sources, timestamp: Date.now() });
};

// Advisor Chat with History (Pro for deep reasoning)
export const streamAdvisorResponse = async (
  history: ChatMessage[], 
  currentMessage: string,
  knowledgeBase: KnowledgeDocument[] = [],
  onChunk: (text: string) => void,
  onSources: (sources: Array<{ title: string; url: string }>) => void
): Promise<void> => {
  try {
    let fullResponseText = "";
    let capturedSources: Array<{ title: string; url: string }> = [];
    let systemInstruction = SYSTEM_INSTRUCTION_ADVISOR;
    
    if (knowledgeBase.length > 0) {
      const kbContent = knowledgeBase.map(doc => `--- DOCUMENT: ${doc.title} ---\n${doc.content}`).join('\n\n');
      systemInstruction += `\n\n[INTERNAL KNOWLEDGE BASE]\n${kbContent}`;
    }

    const apiContents = history
      .filter(msg => msg.text.trim() !== '')
      .map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

    const response = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: apiContents,
      config: {
        systemInstruction,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullResponseText += text;
        onChunk(text);
      }
      
      const chunkSources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.filter((c: any) => c.web?.uri)
        .map((c: any) => ({ title: c.web.title, url: c.web.uri }));
        
      if (chunkSources && chunkSources.length > 0) {
         capturedSources = [...capturedSources, ...chunkSources];
         onSources(capturedSources);
      }
    }
  } catch (error: any) {
    console.error("Advisor Stream Error:", error);
    onChunk(`\n\n*[Error: ${error.message || "Network Error"}.]*`);
  }
};

// High-Speed Best Practices
export const fetchBestPractices = async (topic: string): Promise<{ text: string; sources?: any[] }> => {
  const cacheKey = getCacheKey('bp', topic.toLowerCase().trim());
  const cached = getFromCache(cacheKey);
  if (cached) return { text: cached.text, sources: cached.sources };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Switched to Flash for speed
      contents: `Global security best practices: "${topic}". CEO Executive Summary.`,
      config: { tools: [{ googleSearch: {} }] },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any) => ({ title: chunk.web.title, url: chunk.web.uri })) || [];

    const text = response.text || "No intelligence found.";
    setInCache(cacheKey, text, sources);
    return { text, sources };
  } catch (error) {
    return { text: "Search service unavailable." };
  }
};

// High-Speed Training Generator
export const generateTrainingModule = async (audience: string, topic: string): Promise<string> => {
  try {
    const prompt = `Generate a high-impact security training for ${audience}: "${topic}". Be concise and professional.`;
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Speed priority
      contents: prompt,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION_TRAINER,
        temperature: 0.5 // Lower temperature for faster, more focused generation
      }
    });
    return response.text || "Module generation failed.";
  } catch (error) {
    return "Error generating training.";
  }
};

// Super Fast Refinement
export const refineTrainingModule = async (currentContent: string, instruction: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Speed priority
      contents: `ACT: Security Architect. MODIFY THIS: ${currentContent}\n\nREASON: ${instruction}\n\nREWRITE NOW.`,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION_TRAINER,
        temperature: 0.4
      }
    });
    return response.text || currentContent;
  } catch (error) {
    return currentContent;
  }
};

// High-Speed Training Co-Pilot Suggestions
export const getTrainingCoPilotSuggestions = async (draftContent: string): Promise<string[]> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Flash for instant results
      contents: `Quickly review this security draft. Suggest 3 one-line expert improvements for a CEO.
      Draft excerpt: ${draftContent.substring(0, 1500)}
      Format: S1|||S2|||S3`,
      config: { temperature: 0.1 } // High speed/consistency
    });
    const text = response.text || "";
    return text.split('|||').map(t => t.trim()).filter(t => t.length > 0).slice(0, 3);
  } catch (error) {
    return ["Add compliance details", "Include emergency scenarios", "Simplify for entry-level guards"];
  }
};

// High-Speed Topic Suggestions
export const getTrainingSuggestions = async (recentReports: StoredReport[]): Promise<string[]> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest 3 viral security training topics for 2025. Format: T1|||T2|||T3`,
    });
    const text = response.text || "";
    return text.split('|||').map(t => t.trim()).filter(t => t.length > 0).slice(0, 3);
  } catch (error) {
    return ["Advanced De-escalation", "AI in Surveillance", "Crowd Control Strategy"];
  }
};

// Weekly Tip Generator (High Speed)
export const generateWeeklyTip = async (topic?: string): Promise<string> => {
  try {
    const userPrompt = topic 
      ? `Generate CEO Weekly Tip: "${topic}".`
      : `Generate a random high-priority security tip.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: { systemInstruction: SYSTEM_INSTRUCTION_WEEKLY_TIP, temperature: 0.6 }
    });
    return response.text || "";
  } catch (error) {
    return "Error generating tip.";
  }
};

// Report Analyzer (Pro for Liability)
export const analyzeReport = async (reportText: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Pro for legal/liability analysis
      contents: `Analyze: ${reportText}\nProvide Liability Assessment and Root Cause.`,
    });
    return response.text || "";
  } catch (error) {
    return "Analysis failed.";
  }
};

// Executive Weekly Briefing (Pro for synthesis)
export const generateWeeklyInsights = async (reports: StoredReport[]): Promise<string> => {
  try {
    const combined = reports.map(r => `[${r.dateStr}] ${r.content}`).join('\n');
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `CEO Briefing for reports: ${combined}`,
    });
    return response.text || "";
  } catch (error) {
    return "Intelligence synthesis failed.";
  }
};
