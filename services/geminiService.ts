
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

// Advisor Chat with History and Knowledge Base (Streaming Version)
export const streamAdvisorResponse = async (
  history: ChatMessage[], 
  currentMessage: string,
  knowledgeBase: KnowledgeDocument[] = [],
  onChunk: (text: string) => void,
  onSources: (sources: Array<{ title: string; url: string }>) => void
): Promise<void> => {
  const historySignature = history.slice(-3).map(m => ({ r: m.role, t: m.text }));
  const kbSignature = knowledgeBase.map(d => d.id).sort().join(',');
  const cacheKey = getCacheKey('advisor_stream', historySignature, currentMessage, kbSignature);

  const cached = getFromCache(cacheKey);
  if (cached) {
    onChunk(cached.text);
    if (cached.sources) onSources(cached.sources);
    return;
  }

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
      model: 'gemini-3-pro-preview', // Pro for advisor reasoning
      contents: apiContents,
      config: {
        systemInstruction,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 4000 } // Enable thinking for deeper strategy
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
    
    if (fullResponseText.trim()) {
      setInCache(cacheKey, fullResponseText, capturedSources.length > 0 ? capturedSources : undefined);
    }
  } catch (error: any) {
    console.error("Advisor Stream Error:", error);
    onChunk(`\n\n*[Error: ${error.message || "Network Error"}.]*`);
  }
};

// Best Practices Grounding (Explicit Search)
export const fetchBestPractices = async (topic: string): Promise<{ text: string; sources?: any[] }> => {
  const cacheKey = getCacheKey('bp', topic.toLowerCase().trim());
  const cached = getFromCache(cacheKey);
  if (cached) return { text: cached.text, sources: cached.sources };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Find the latest global security best practices regarding: "${topic}". Summarize for a Security CEO.`,
      config: { tools: [{ googleSearch: {} }] },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any) => ({ title: chunk.web.title, url: chunk.web.uri })) || [];

    const text = response.text || "No best practices found.";
    setInCache(cacheKey, text, sources);
    return { text, sources };
  } catch (error) {
    return { text: "Unable to fetch online best practices." };
  }
};

// Training Generator
export const generateTrainingModule = async (audience: string, topic: string, previousContext?: string): Promise<string> => {
  const cacheKey = getCacheKey('training', audience, topic, previousContext ? simpleHash(previousContext) : 'none');
  const cached = getFromCache(cacheKey);
  if (cached) return cached.text;

  try {
    const prompt = `Create a professional security training module for ${audience} on the topic: "${topic}". Include AntiRisk signature.`;
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { systemInstruction: SYSTEM_INSTRUCTION_TRAINER }
    });
    const text = response.text || "";
    setInCache(cacheKey, text);
    return text;
  } catch (error) {
    return "Error generating training content.";
  }
};

// Refine Training Module
export const refineTrainingModule = async (currentContent: string, instruction: string): Promise<string> => {
  const cacheKey = getCacheKey('refine', simpleHash(currentContent), instruction);
  const cached = getFromCache(cacheKey);
  if (cached) return cached.text;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `CURRENT: ${currentContent}\nINSTRUCTION: ${instruction}\nRewrite training module.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION_TRAINER }
    });
    const text = response.text || "";
    setInCache(cacheKey, text);
    return text;
  } catch (error) {
    return "Error refining content.";
  }
};

// Training Topic Suggestions
export const getTrainingSuggestions = async (recentReports: StoredReport[]): Promise<string[]> => {
  const lastReportId = recentReports.length > 0 ? recentReports[0].id : 'none';
  const cacheKey = getCacheKey('suggestions', recentReports.length, lastReportId); 
  const cached = getFromCache(cacheKey);
  if (cached) return JSON.parse(cached.text);

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest 3 security training topics based on modern trends. Return ONLY as "Topic A|||Topic B|||Topic C"`,
    });
    const text = response.text || "";
    const suggestions = text.split('|||').map(t => t.trim()).filter(t => t.length > 0).slice(0, 3);
    setInCache(cacheKey, JSON.stringify(suggestions));
    return suggestions;
  } catch (error) {
    return ["Access Control", "Report Writing", "Emergency Response"];
  }
};

// Weekly Tip Generator
export const generateWeeklyTip = async (topic?: string): Promise<string> => {
  const cacheKey = getCacheKey('weekly_tip', topic || 'random');
  const cached = getFromCache(cacheKey);
  if (cached) return cached.text;

  try {
    const userPrompt = topic 
      ? `Generate a weekly training tip about: "${topic}".`
      : `Pick a relevant modern security topic. Generate a weekly training module.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: { systemInstruction: SYSTEM_INSTRUCTION_WEEKLY_TIP }
    });
    const text = response.text || "";
    if (text) setInCache(cacheKey, text);
    return text;
  } catch (error) {
    return "Error generating tip.";
  }
};

// Report Analyzer
export const analyzeReport = async (reportText: string, previousReports: StoredReport[] = []): Promise<string> => {
  const cacheKey = getCacheKey('analyze', simpleHash(reportText), previousReports.length);
  const cached = getFromCache(cacheKey);
  if (cached) return cached.text;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze report: ${reportText}\nProvide: Summary, Root Cause, Preventative measures.`,
    });
    const text = response.text || "";
    setInCache(cacheKey, text);
    return text;
  } catch (error) {
    return "Error analyzing report.";
  }
};

// Weekly Insights Generator
export const generateWeeklyInsights = async (reports: StoredReport[]): Promise<string> => {
  const cacheKey = getCacheKey('weekly_insights', reports.length, reports[0]?.id || 'none');
  const cached = getFromCache(cacheKey);
  if (cached) return cached.text;

  try {
    const combined = reports.map(r => `[${r.dateStr}] ${r.content}`).join('\n');
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Synthesize reports: ${combined}\nProvide CEO Briefing.`,
    });
    const text = response.text || "";
    setInCache(cacheKey, text);
    return text;
  } catch (error) {
    return "Error generating insights.";
  }
};
