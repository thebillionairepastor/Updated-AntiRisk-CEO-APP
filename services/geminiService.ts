
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION_ADVISOR, SYSTEM_INSTRUCTION_TRAINER, SYSTEM_INSTRUCTION_WEEKLY_TIP } from "../constants";
import { ChatMessage, StoredReport, KnowledgeDocument } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Advisor Chat with History and Knowledge Base
export const generateAdvisorResponse = async (
  history: ChatMessage[], 
  currentMessage: string,
  knowledgeBase: KnowledgeDocument[] = []
): Promise<{ text: string; sources?: Array<{ title: string; url: string }> }> => {
  try {
    // Format Knowledge Base for the prompt
    const kbContext = knowledgeBase.length > 0 
      ? `INTERNAL KNOWLEDGE BASE (PRIORITIZE THIS INFORMATION):
         ${knowledgeBase.map(doc => `--- DOCUMENT: ${doc.title} ---\n${doc.content}`).join('\n\n')}
         -----------------------------------`
      : "NO INTERNAL KNOWLEDGE BASE AVAILABLE.";

    const conversationContext = history.map(h => `${h.role.toUpperCase()}: ${h.text}`).join('\n');
    
    const fullPrompt = `
      ${kbContext}

      PREVIOUS CONVERSATION HISTORY:
      ${conversationContext}

      CURRENT USER QUESTION:
      ${currentMessage}
    `;

    // Using gemini-3-pro-preview for deep reasoning as an Advisor
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: fullPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_ADVISOR,
      }
    });

    return { text: response.text || "I couldn't generate a response." };
  } catch (error) {
    console.error("Advisor Error:", error);
    return { text: "I am having trouble connecting to my secure knowledge base. Please check your internet connection." };
  }
};

// Best Practices Grounding (Using Search)
export const fetchBestPractices = async (topic: string): Promise<{ text: string; sources?: any[] }> => {
  try {
    // Using flash for faster retrieval with tools, formatted strictly for the CEO
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find the latest global security best practices regarding: "${topic}". 
      Summarize them into a high-level executive briefing for a Security Company CEO (AntiRisk Management). 
      Key Requirements:
      1. Focus on actionable steps.
      2. Cite authoritative sources (ISO, ASIS, etc.) where possible.
      3. Format clearly with headers and bullet points.`,
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

    return { text: response.text || "No best practices found on this topic.", sources };
  } catch (error) {
    console.error("Best Practices Error:", error);
    return { text: "Unable to fetch online best practices at this moment." };
  }
};

// Training Generator
export const generateTrainingModule = async (audience: string, topic: string): Promise<string> => {
  try {
    const prompt = `Create a professional security training module for ${audience} on the topic: "${topic}". Ensure it includes the AntiRisk Management signature.`;
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_TRAINER
      }
    });
    return response.text || "Failed to generate training content.";
  } catch (error) {
    console.error("Training Gen Error:", error);
    return "Error generating training content.";
  }
};

// Training Topic Suggestions
export const getTrainingSuggestions = async (recentReports: StoredReport[]): Promise<string[]> => {
  try {
    const context = recentReports.length > 0 
      ? `RECENT INTERNAL INCIDENTS:\n${recentReports.slice(0, 5).map(r => `- ${r.content.substring(0, 100)}...`).join('\n')}`
      : "NO RECENT INTERNAL INCIDENTS.";

    const prompt = `
      Based on the following context, suggest 3 specific, high-value training topics for security guards.
      
      1. ${context}
      2. CURRENT GLOBAL SECURITY TRENDS (e.g., De-escalation, Access Control, Cyber-Physical hygiene).

      OUTPUT REQUIREMENT:
      Return ONLY a list of 3 topics separated by "|||". Do not add numbering or extra text.
      Example: Radio Discipline|||Vehicle Search Procedures|||Conflict De-escalation
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || "";
    return text.split('|||').map(t => t.trim()).filter(t => t.length > 0);
  } catch (error) {
    console.error("Suggestion Error:", error);
    return ["Access Control Basics", "Report Writing 101", "Emergency Response"]; // Fallbacks
  }
};

// Weekly Tip Generator
export const generateWeeklyTip = async (topic?: string): Promise<string> => {
  try {
    const userPrompt = topic 
      ? `Generate a weekly training tip specifically about: "${topic}".`
      : `Pick a highly relevant, modern security topic (e.g., Access Control, De-escalation, Observation, Report Writing, Cyber-Physical security). 
         Generate a complete weekly training module for this week.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using Pro for structured, high-quality curriculum generation
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_WEEKLY_TIP,
      }
    });

    return response.text || "Failed to generate weekly tip.";
  } catch (error) {
    console.error("Weekly Tip Gen Error:", error);
    return "Error generating weekly training tip.";
  }
};

// Report Analyzer
export const analyzeReport = async (reportText: string, previousReports: StoredReport[] = []): Promise<string> => {
  try {
    // Summarize recent history for context
    const contextSummary = previousReports.length > 0
      ? previousReports.slice(0, 5).map(r => `- [${r.dateStr}] ${r.content.substring(0, 60)}...`).join('\n')
      : "No recent reports.";

    const prompt = `
      Analyze the following security incident or daily report for "AntiRisk Management".
      
      CONTEXT (Last 5 Incident Reports):
      ${contextSummary}

      YOUR ROLE:
      Act as a Senior Security Analyst.
      
      OUTPUT FORMAT:
      1. 🚨 **Executive Summary** (One sentence overview)
      2. ⚠️ **Critical Risks & Recurring Patterns**:
         - Highlight major incidents.
         - **CHECK CONTEXT**: Explicitly state if this incident type has happened recently based on the context provided above.
         - If recurring, bold the warning: **"RECURRING INCIDENT DETECTED"**.
      3. 🧠 **Root Cause Analysis**:
         - Specifically identify WHY these incidents happened.
         - Is it a Training gap? Supervision failure? Process flaw?
         - Dig deeper than just the symptoms.
      4. 🛡️ **Targeted Preventative Measures**:
         - Suggest specific, actionable steps to prevent this exact type of incident from recurring.
         - Not generic advice; provide a fix.
      5. 👮 **Guard Force Instructions**:
         - A direct, short briefing message for the team.
         - MUST end with signature: *– AntiRisk Management*

      CURRENT REPORT TEXT:
      ${reportText}
    `;
    // Using Pro model for better pattern detection and reasoning
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text || "Analysis failed to generate valid text.";
  } catch (error) {
    console.error("Analysis Error:", error);
    return "Error analyzing report. Please try again.";
  }
};

// Weekly Insights Generator
export const generateWeeklyInsights = async (reports: StoredReport[]): Promise<string> => {
  try {
    const combinedReports = reports.map(r => `[DATE: ${r.dateStr}] REPORT CONTENT: ${r.content}`).join('\n---\n');
    
    const prompt = `
      Act as the Chief Security Officer of "AntiRisk Management".
      Review the following incident reports collected over the LAST 7 DAYS.
      
      YOUR TASK:
      Synthesize these daily reports into a high-level Weekly Intelligence Briefing for the CEO.
      
      DATA (Last 7 Days):
      ${combinedReports}
      
      OUTPUT FORMAT:
      1. 📅 **Weekly Overview**: A 2-sentence summary of the week's security posture.
      2. 🔥 **Recurring Incidents & Pattern Detection**:
         - Identify specific types of incidents that happened multiple times this week.
         - Highlight locations or shifts with high incident frequency.
      3. 🧠 **Deep Root Cause Analysis**: 
         - Look across all reports to find the "Why".
         - Connect the dots: Is this a systemic culture issue or a specific skill gap?
         - Identify the primary driver of risk this week.
      4. 🛡️ **Targeted Preventative Strategy**: 
         - Define specific operational changes to eliminate the root cause.
         - Example: "Revise night shift roster", "Purchase new handheld detectors".
      5. 📢 **Broadcast Message**: 
         - A short, motivating or corrective message to send to all staff via WhatsApp.
         - MUST end with signature: *– AntiRisk Management*
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    return response.text || "Failed to generate weekly insights.";
  } catch (error) {
    console.error("Weekly Insights Error:", error);
    return "Error generating weekly strategy report.";
  }
};
