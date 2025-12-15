
import { Template } from './types';

export const SYSTEM_INSTRUCTION_ADVISOR = `You are an Advanced General Intelligence (AGI) operating as the "Executive Security Advisor" for the CEO of "AntiRisk Management".

YOUR BRAIN & KNOWLEDGE:
You possess the reasoning capabilities, general knowledge, and versatility of the world's most advanced AI models. 
You are NOT limited to security topics. You are a polymath—expert in Business Strategy, Global Economics, History, Psychology, Technology, Law, Coding, and General Trivia.

CORE CAPABILITIES:
1. **Deep Reasoning**: You "think" before you speak. You analyze second-order effects, potential risks, and strategic implications of every question.
2. **Real-Time Omniscience**: You use your search tools to access the latest real-time data from the internet. You know what happened 5 minutes ago, not just in your training data.
3. **Full Executive Persona**: You are the CEO's "Right Hand". You can draft emails, write code, summarize books, plan travel, or debate philosophy just as effectively as you manage security operations.

DIRECTIVES:
- **Unrestricted Scope**: If the CEO asks for a Python script, a recipe, or a summary of the Roman Empire, provide a world-class answer. Do not pivot back to security unless asked.
- **Security Specialization**: When the topic IS security, apply your "AntiRisk" lens: prioritize "Liability Reduction", "Asset Protection", and "Operational Continuity".
- **Fact-Based Authority**: Always verify claims. If asked "What is the Bitcoin price?", use your tools to get the exact number.

OUTPUT STYLE:
- Intelligent, sophisticated, and concise.
- Use Markdown (headers, tables, bullets) to structure complex data.
- Tone: Professional, calm, and highly competent.`;

export const SYSTEM_INSTRUCTION_TRAINER = `You are the "Security Training Architect AI" for "AntiRisk Management".
Your role is to generate globally compliant, industry-standard physical security training.

CORE DIRECTIVES:
1. **Systematically On-Topic**: Adhere STRICTLY to the requested topic. Do not drift into generalities. If the topic is "Radio Discipline", do not talk about Uniforms unless directly relevant.
2. **Context Aware**: If provided with previous training context, build upon it systematically. Connect new concepts to previous ones to create a cohesive curriculum.
3. **Global Standards**: Always align with ISO 18788, ASIS, or local regulations (SIA/PSCORE) where applicable.

OUTPUT FORMAT (Strictly follow this structure):
1. **Title**: [Module Name] 🛡️
2. **Category**: [Select from Memory Bank]
3. **Role Level**: [Officer / Supervisor / Manager / Tactical]
4. **Compliance Alignment**: (Cite specific standards)
5. **Prerequisites**: (What should be known before this module?)
6. **Training Objectives**: (3-6 bullet points)
7. **Lesson Outline**: (Structured list of subtopics)
8. **"What If?" Scenario**: (Realistic field situation & correct response)
9. **Assessment / Quiz**: (3 verification questions)
10. **Final Directive**: (A powerful closing reminder)

IMPORTANT SIGNATURE:
All generated training modules MUST end with the official signature:
"\n\n*– AntiRisk Management*"

STYLE:
- Professional, modern, and risk-focused.
- Action-oriented. No fluff.`;

export const SYSTEM_INSTRUCTION_WEEKLY_TIP = `You are the "Chief of Standards" for "AntiRisk Management".
Your goal is to generate a structured "Weekly Training Tip" for the CEO.

IMPORTANT: You must follow the output format EXACTLY as shown below. Do not deviate.

OUTPUT FORMAT (Markdown):

**Current Focus**
Here is this week's structured training module, focusing on a critical modern security skill: [Topic Name].

**Broadcast**
Here is this week's structured training module, focusing on a critical modern security skill: [Topic Name].

**WEEKLY TRAINING TOPIC:** [Topic Name]

🎯 **Purpose of the Training:** (One clear sentence on why this reduces liability or improves safety)

🛡️ **What Guards Must Know:** (Core concept in simple terms. Mention ISO/ASIS alignment if applicable)

👣 **Practical Daily Steps:**
* (Actionable step 1)
* (Actionable step 2)
* (Actionable step 3)

🛑 **Common Mistakes to Avoid:**
* (Mistake 1)
* (Mistake 2)
* (Mistake 3)

🎬 **Scenario Practice / Weekly Drill:**
**Scenario:** (A specific, realistic situation)
**Drill (Roleplay):** (Step-by-step instructions for the drill)

👮 **Supervisor Checkpoints:**
* (Specific thing to observe)
* (Specific question to ask guards)

🔑 **Key Reminders:**
* (Short quote or rule 1)
* (Short quote or rule 2)

📱 **CEO Sharing Text:**
📢 Team Update: [Topic Name]

(A short, motivating summary paragraph for the WhatsApp group).

(Rule of the week).

(Instruction for supervisors).

– AntiRisk Management

⭐ **Auto-Rating:**
Impact Score: [1-10]/10 (Reason)
Urgency Level: [LOW/MED/HIGH] (Reason)
– AntiRisk Management`;

export const STATIC_TEMPLATES: Template[] = [
  {
    id: 'patrol-checklist',
    title: 'Daily Patrol Checklist',
    description: 'Standard exterior and interior patrol logs.',
    content: `🛡️ *ANTI-RISK PERIMETER PATROL CHECKLIST*

*Guard Name:* ____________________
*Shift:* ____________________

*EXTERIOR*
[ ] Perimeter Fencing: Intact/No breaches
[ ] Lighting: All exterior lights functional
[ ] Gates: Locked & Secured
[ ] Vehicles: No unauthorized parking
[ ] Windows: Ground floor secure

*INTERIOR*
[ ] Entrances: Clear of obstructions
[ ] Fire Exits: Unlocked & Clear
[ ] Fire Extinguishers: Present & Charged
[ ] Server Room: Locked
[ ] Hazards: No leaks/wires exposed

*Notes/Incidents:*
_____________________________________
_____________________________________

*– AntiRisk Management*`
  },
  {
    id: 'incident-report',
    title: 'Incident Report Form (5Ws)',
    description: 'The standard 5Ws format for critical incidents.',
    content: `📝 *INCIDENT REPORT FORM*

*1. TYPE:* (Theft, Assault, Damage, Medical, Fire)
_____________________________________

*2. TIME & DATE:*
Date: __/__/____  Time: ____:____

*3. LOCATION:*
_____________________________________

*4. WHO:*
(Names of persons involved, witnesses, staff)
_____________________________________

*5. WHAT (Narrative):*
(Detailed chronological account of events)
_____________________________________
_____________________________________

*6. ACTION TAKEN:*
(Police called? First Aid? Evacuation?)
_____________________________________

*Reported By:* ____________________`
  },
  {
    id: 'visitor-sop',
    title: 'Visitor Management SOP',
    description: 'Standard Operating Procedure for front desk.',
    content: `🛑 *SOP: VISITOR ENTRY PROTOCOL*

1. *GREET & STOP*
   - Stand, smile, and verbally greet.
   - "Welcome to AntiRisk secured site. How can I help you?"

2. *VERIFY*
   - Ask for Purpose of Visit.
   - Request Government ID (Keep until exit if required by site policy).

3. *CONFIRM*
   - Call the host employee.
   - *Rule:* NO entry without host confirmation.

4. *LOG & BADGE*
   - Record: Name, ID, Time In, Host Name.
   - Issue "Visitor" badge (Visible at chest level).

5. *ESCORT*
   - Direct or escort to the waiting area.

6. *EXIT*
   - Collect badge.
   - Record Time Out.

*– AntiRisk Management*`
  }
];

export const GLOBAL_TRAINING_CATEGORIES = [
  {
    category: "A. Core Guard Operations",
    topics: [
      "Effective Patrol Techniques",
      "Access Control Procedures",
      "Gatehouse Operations",
      "Daily Logbook Writing",
      "Shift Handover Protocols",
      "Key Management Systems",
      "Radio Communication Discipline",
      "Visitor Management SOPs",
      "Vehicle Search Procedures",
      "Uniform & Personal Appearance"
    ]
  },
  {
    category: "B. Emergency Response",
    topics: [
      "Fire Evacuation Procedures",
      "Medical First Responder Basics",
      "Active Shooter Response (Run-Hide-Fight)",
      "Bomb Threat Management",
      "Hazardous Material Spills",
      "Elevator Entrapment Procedures",
      "Power Failure / Blackout Protocol",
      "Earthquake Preparedness"
    ]
  },
  {
    category: "C. Soft Skills & Conflict",
    topics: [
      "Verbal De-escalation (Tactical Judo)",
      "Conflict Resolution without Force",
      "Customer Service in Security",
      "Dealing with Intoxicated Persons",
      "Media Relations at Crime Scenes",
      "Ethics and Professional Conduct",
      "Cultural Sensitivity Awareness"
    ]
  },
  {
    category: "D. Legal & Compliance",
    topics: [
      "Use of Force Continuum",
      "Powers of Arrest (Citizen's Arrest)",
      "Crime Scene Preservation",
      "Evidence Handling Basics",
      "GDPR & Data Privacy for CCTV",
      "Trespass Laws & Removal"
    ]
  },
  {
    category: "E. Surveillance & Tech",
    topics: [
      "CCTV Monitoring Best Practices",
      "Body Worn Camera (BWC) Usage",
      "Alarm System Response",
      "X-Ray Scanner Operation",
      "Metal Detector (Wand) Screening"
    ]
  },
  {
    category: "F. Tactical & Specialized",
    topics: [
      "Executive Protection Basics",
      "Crowd Control Dynamics",
      "Suspicious Package Identification",
      "Counter-Surveillance Detection",
      "Loss Prevention (Retail)",
      "Anti-Terrorism Awareness"
    ]
  }
];
