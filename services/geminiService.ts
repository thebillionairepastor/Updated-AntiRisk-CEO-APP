
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

/**
 * RAG RETRIEVAL ENGINE
 * Performs a client-side keyword-based retrieval to find relevant context.
 * Titles are weighted 5x more than content for relevance.
 */
const findRelevantDocs = (query: string, docs: KnowledgeDocument[], limit = 3): KnowledgeDocument[] => {
  if (docs.length === 0) return [];
  
  // Tokenize query, remove common short words
  const terms = query.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 2);

  if (terms.length === 0) return docs.slice(0, limit);

  const scoredDocs = docs.map(doc => {
    let score = 0;
    const title = doc.title.toLowerCase();
    const content = doc.content.toLowerCase();
    
    terms.forEach(term => {
      // Title match (High Weight)
      if (title.includes(term)) score += 10;
      // Content match (Lower Weight)
      const contentOccurrences = (content.match(new RegExp(term, 'g')) || []).length;
      score += contentOccurrences * 2;
    });
    
    return { doc, score };
  });

  return scoredDocs
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.doc)
    .slice(0, limit);
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
    
    // Perform Dynamic Retrieval (RAG)
    const relevantDocs = findRelevantDocs(currentMessage, knowledgeBase);
    
    if (relevantDocs.length > 0) {
      const kbContent = relevantDocs.map(doc => `--- RELEVANT DOCUMENT: ${doc.title} ---\n${doc.content}`).join('\n\n');
      systemInstruction += `\n\n[CONTEXT FROM EXECUTIVE MEMORY]\nUse the following internal documents to inform your response if relevant. Prioritize this information over general knowledge for site-specific queries:\n${kbContent}`;
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
      model: 'gemini-3-flash-preview',
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
    const prompt = `Generate a high-impact security training for ${audience}: "${topic}". Be concise and professional. Use industry standards like ASIS or ISO where applicable.`;
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION_TRAINER,
        temperature: 0.5
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
      model: 'gemini-3-flash-preview',
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
      model: 'gemini-3-flash-preview',
      contents: `Quickly review this security draft. Suggest 3 one-line expert improvements for a CEO.
      Draft excerpt: ${draftContent.substring(0, 1500)}
      Format: S1|||S2|||S3`,
      config: { temperature: 0.1 }
    });
    const text = response.text || "";
    return text.split('|||').map(t => t.trim()).filter(t => t.length > 0).slice(0, 3);
  } catch (error) {
    return ["Add compliance details", "Include emergency scenarios", "Simplify for entry-level guards"];
  }
};

/**
 * DEEP INTELLIGENCE TOPIC SEARCH
 * Simulates a massive data bank by querying the LLM for specialized topics.
 */
export const searchTrainingTopics = async (query: string): Promise<string[]> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Access the 1 million security knowledge bank. Find 10 niche, high-impact industrial security training topics related to: "${query}".
      Focus on global best practices for security guards and supervisors.
      Format: T1|||T2|||T3...`,
      config: { temperature: 0.7 }
    });
    const text = response.text || "";
    return text.split('|||').map(t => t.trim()).filter(t => t.length > 0).slice(0, 10);
  } catch (error) {
    return ["Standard Operating Procedures", "Crowd Control", "Incident Reporting"];
  }
};

// High-Speed Topic Suggestions
export const getTrainingSuggestions = async (recentReports: StoredReport[]): Promise<string[]> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest 8 high-priority security training topics for 2025 across core, emergency, and tactical categories. Format: T1|||T2|||T3...`,
    });
    const text = response.text || "";
    return text.split('|||').map(t => t.trim()).filter(t => t.length > 0).slice(0, 8);
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
      model: 'gemini-3-pro-preview',
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
