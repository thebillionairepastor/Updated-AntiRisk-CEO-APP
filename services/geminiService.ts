
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION_ADVISOR, SYSTEM_INSTRUCTION_TRAINER, SYSTEM_INSTRUCTION_WEEKLY_TIP } from "../constants";
import { ChatMessage, StoredReport, KnowledgeDocument } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- IN-MEMORY CACHE ---
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 Hour Cache
const responseCache = new Map<string, { text: string; sources?: any[]; timestamp: number }>();

// Simple string hash for cache keys to avoid storing huge keys
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

const getCacheKey = (prefix: string, ...args: any[]) => {
  try {
    const argString = JSON.stringify(args);
    // If the key is too long, hash it
    const uniquePart = argString.length > 100 ? simpleHash(argString) : argString;
    return `${prefix}::${uniquePart}`;
  } catch (e) {
    return `${prefix}::${Date.now()}`;
  }
};

const getFromCache = (key: string) => {
  const cached = responseCache.get(key);
  if (cached) {
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log(`[Cache Hit] ${key.substring(0, 50)}...`);
      return cached;
    } else {
      responseCache.delete(key);
    }
  }
  return null;
};

const setInCache = (key: string, text: string, sources?: any[]) => {
  // Simple LRU-like protection: delete oldest if too big
  if (responseCache.size > 50) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey) responseCache.delete(firstKey);
  }
  responseCache.set(key, { text, sources, timestamp: Date.now() });
};
// -----------------------

// Advisor Chat with History and Knowledge Base (Streaming Version)
export const streamAdvisorResponse = async (
  history: ChatMessage[], 
  currentMessage: string,
  knowledgeBase: KnowledgeDocument[] = [],
  onChunk: (text: string) => void,
  onSources: (sources: Array<{ title: string; url: string }>) => void
): Promise<void> => {
  // Generate a cache key based on the last few messages to effectively cache repeated contexts
  const historySignature = history.slice(-3).map(m => ({ r: m.role, t: m.text }));
  const kbSignature = knowledgeBase.map(d => d.id).sort().join(',');
  const cacheKey = getCacheKey('advisor_stream', historySignature, currentMessage, kbSignature);

  // Check Cache
  const cached = getFromCache(cacheKey);
  if (cached) {
    onChunk(cached.text);
    if (cached.sources) onSources(cached.sources);
    return;
  }

  try {
    let fullResponseText = "";
    let capturedSources: Array<{ title: string; url: string }> = [];

    // 1. Prepare System Instruction with Knowledge Base
    let systemInstruction = SYSTEM_INSTRUCTION_ADVISOR;
    if (knowledgeBase.length > 0) {
      const kbContent = knowledgeBase.map(doc => `--- DOCUMENT: ${doc.title} ---\n${doc.content}`).join('\n\n');
      systemInstruction += `\n\n[INTERNAL KNOWLEDGE BASE - PRIORITIZE THIS DATA]\n${kbContent}`;
    }

    // 2. Format History for Gemini API
    const apiContents = history
      .filter(msg => msg.text.trim() !== '')
      .map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

    // 3. Stream Response
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: apiContents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullResponseText += text;
        onChunk(text);
      }
      
      // Attempt to capture grounding sources if available in chunks
      const chunkSources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.filter((c: any) => c.web?.uri)
        .map((c: any) => ({ title: c.web.title, url: c.web.uri }));
        
      if (chunkSources && chunkSources.length > 0) {
         capturedSources = [...capturedSources, ...chunkSources];
         onSources(capturedSources);
      }
    }
    
    // Save to Cache on completion
    if (fullResponseText.trim()) {
      setInCache(cacheKey, fullResponseText, capturedSources.length > 0 ? capturedSources : undefined);
    }

  } catch (error: any) {
    console.error("Advisor Stream Error:", error);
    const errorMessage = error.message || "Unknown Network Error";
    onChunk(`\n\n*[Error: ${errorMessage}. Please check your internet connection or API Key.]*`);
  }
};

// Advisor Chat with History and Knowledge Base (Legacy/Fallback)
export const generateAdvisorResponse = async (
  history: ChatMessage[], 
  currentMessage: string,
  knowledgeBase: KnowledgeDocument[] = []
): Promise<{ text: string; sources?: Array<{ title: string; url: string }> }> => {
  // Use signature for legacy cache as well for better accuracy
  const historySignature = history.slice(-3).map(m => ({ r: m.role, t: m.text }));
  const cacheKey = getCacheKey('advisor_legacy', historySignature, currentMessage); 
  
  const cached = getFromCache(cacheKey);
  if (cached) return { text: cached.text, sources: cached.sources };

  try {
    let systemInstruction = SYSTEM_INSTRUCTION_ADVISOR;
    if (knowledgeBase.length > 0) {
      const kbContent = knowledgeBase.map(doc => `--- DOCUMENT: ${doc.title} ---\n${doc.content}`).join('\n\n');
      systemInstruction += `\n\n[INTERNAL KNOWLEDGE BASE]\n${kbContent}`;
    }

    const apiContents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));
    apiContents.push({
      role: 'user',
      parts: [{ text: currentMessage }]
    });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: apiContents,
      config: { systemInstruction: systemInstruction }
    });

    const text = response.text || "I couldn't generate a response.";
    setInCache(cacheKey, text);
    
    return { text, sources: [] };
  } catch (error) {
    console.error("Advisor Error:", error);
    return { text: "I am having trouble connecting. Please check your connection." };
  }
};

// Best Practices Grounding (Explicit Search)
export const fetchBestPractices = async (topic: string): Promise<{ text: string; sources?: any[] }> => {
  const cacheKey = getCacheKey('bp', topic.toLowerCase().trim());
  const cached = getFromCache(cacheKey);
  if (cached) return { text: cached.text, sources: cached.sources };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find the latest global security best practices regarding: "${topic}". 
      Summarize them into a high-level executive briefing for a Security Company CEO (AntiRisk Management).`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any) => ({
        title: chunk.web.title,
        url: chunk.web.uri
      })) || [];

    const text = response.text || "No best practices found.";
    setInCache(cacheKey, text, sources);

    return { text, sources };
  } catch (error) {
    console.error("Best Practices Error:", error);
    return { text: "Unable to fetch online best practices at this moment." };
  }
};

// Training Generator
export const generateTrainingModule = async (audience: string, topic: string, previousContext?: string): Promise<string> => {
  // Use hash of content for context
  const cacheKey = getCacheKey('training', audience, topic, previousContext ? simpleHash(previousContext) : 'none');
  const cached = getFromCache(cacheKey);
  if (cached) return cached.text;

  try {
    const prompt = `Create a professional security training module for ${audience} on the topic: "${topic}". Ensure it includes the AntiRisk Management signature.`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction: SYSTEM_INSTRUCTION_TRAINER }
    });

    const text = response.text || "Failed to generate training content.";
    setInCache(cacheKey, text);
    return text;
  } catch (error) {
    console.error("Training Gen Error:", error);
    return "Error generating training content.";
  }
};

// Refine Training Module
export const refineTrainingModule = async (currentContent: string, instruction: string): Promise<string> => {
  const cacheKey = getCacheKey('refine', simpleHash(currentContent), instruction);
  const cached = getFromCache(cacheKey);
  if (cached) return cached.text;

  try {
    const prompt = `
      You are the Security Training Architect.
      CURRENT CONTENT: ${currentContent}
      INSTRUCTION: "${instruction}"
      TASK: Rewrite the training module to incorporate the instruction. Maintain structure.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction: SYSTEM_INSTRUCTION_TRAINER }
    });
    
    const text = response.text || "Failed to refine content.";
    setInCache(cacheKey, text);
    return text;
  } catch (error) {
    console.error("Refine Training Error:", error);
    return "Error refining training content.";
  }
};

// Training Topic Suggestions
export const getTrainingSuggestions = async (recentReports: StoredReport[]): Promise<string[]> => {
  // Use date of last report to ensure freshness
  const lastReportId = recentReports.length > 0 ? recentReports[0].id : 'none';
  const cacheKey = getCacheKey('suggestions', recentReports.length, lastReportId); 
  
  const cached = getFromCache(cacheKey);
  if (cached) return JSON.parse(cached.text);

  try {
    const prompt = `Suggest 3 specific, high-value training topics for security guards based on modern trends.
      OUTPUT REQUIREMENT: Return ONLY a list of 3 topics separated by "|||". Example: Topic A|||Topic B|||Topic C`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || "";
    const suggestions = text.replace(/\n/g, '').replace(/\*\*/g, '').split('|||').map(t => t.trim()).filter(t => t.length > 0).slice(0, 3);
    
    setInCache(cacheKey, JSON.stringify(suggestions));
    return suggestions;
  } catch (error) {
    return ["Access Control Basics", "Report Writing 101", "Emergency Response"];
  }
};

// Weekly Tip Generator
export const generateWeeklyTip = async (topic?: string): Promise<string> => {
  const cacheKey = getCacheKey('weekly_tip', topic || 'random');
  const cached = getFromCache(cacheKey);
  if (cached) return cached.text;

  try {
    const userPrompt = topic 
      ? `Generate a weekly training tip specifically about: "${topic}".`
      : `Pick a highly relevant, modern security topic. Generate a complete weekly training module.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: { systemInstruction: SYSTEM_INSTRUCTION_WEEKLY_TIP }
    });

    const text = response.text || "Failed to generate weekly tip.";
    if (!text.startsWith("Failed")) {
      setInCache(cacheKey, text);
    }
    return text;
  } catch (error) {
    console.error("Weekly Tip Gen Error:", error);
    return "Error generating weekly training tip.";
  }
};

// Report Analyzer
export const analyzeReport = async (reportText: string, previousReports: StoredReport[] = []): Promise<string> => {
  // Use hash of report text to avoid collisions on simple length
  const cacheKey = getCacheKey('analyze', simpleHash(reportText), previousReports.length);
  const cached = getFromCache(cacheKey);
  if (cached) return cached.text;

  try {
    const prompt = `
      Analyze this security incident report. Act as a Senior Analyst.
      REPORT: ${reportText}
      
      OUTPUT:
      1. Executive Summary
      2. Root Cause Analysis
      3. Preventative Measures
      4. Guard Instructions (Short)
    `;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const text = response.text || "Analysis failed.";
    setInCache(cacheKey, text);
    return text;
  } catch (error) {
    console.error("Analysis Error:", error);
    return "Error analyzing report.";
  }
};

// Weekly Insights Generator
export const generateWeeklyInsights = async (reports: StoredReport[]): Promise<string> => {
  const cacheKey = getCacheKey('weekly_insights', reports.length, reports[0]?.id || 'none');
  const cached = getFromCache(cacheKey);
  if (cached) return cached.text;

  try {
    const combinedReports = reports.map(r => `[${r.dateStr}] ${r.content}`).join('\n');
    const prompt = `
      Synthesize these security reports into a Weekly CEO Briefing.
      DATA: ${combinedReports}
      OUTPUT: Weekly Overview, Recurring Patterns, Root Cause, Broadcast Message.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || "Failed to generate weekly insights.";
    setInCache(cacheKey, text);
    return text;
  } catch (error) {
    console.error("Weekly Insights Error:", error);
    return "Error generating weekly report.";
  }
};
