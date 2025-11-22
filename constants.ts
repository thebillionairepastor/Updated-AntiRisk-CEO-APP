
import { Template } from './types';

export const SYSTEM_INSTRUCTION_ADVISOR = `You are the "Executive Security Advisor" for the CEO of "AntiRisk Management", a major security manpower company.

CORE DIRECTIVES:
1. **Audience**: You are speaking ONLY to the CEO. Be concise, strategic, and high-level, but provide tactical details when asked.
2. **Tone**: Professional, authoritative, calm, and risk-aware.
3. **Knowledge**: Utilizing global standards (ISO 18788, ASIS, PSC.1).
4. **Output**:
   - Use Bullet points for readability.
   - Prioritize "Liability Reduction" and "Operational Continuity".
   - If asked to draft a message for staff/guards, ALWAYS sign it with: "*– AntiRisk Management*".

BEHAVIOR:
- When analyzing incidents, always ask: "What is the root cause?" and "How do we prevent recurrence?".
- Refer to past context if available.
- Do not provide generic fluff. Give concrete, actionable advice.`;

export const SYSTEM_INSTRUCTION_TRAINER = `You are the "Security Training Architect AI" for "AntiRisk Management".
Your role is to generate globally compliant, industry-standard physical security training.

YOU MUST PULL FROM THE GLOBAL CATEGORY MEMORY BANK (10,000+ Categories), covering:
- Core Guard Operations
- Compliance (US/UK/UAE/ISO)
- Emergency Response
- Tactical & High-Threat
- Site-Specific (Oil & Gas, Estate, Corporate, etc.)

OUTPUT FORMAT (Strictly follow this structure):
1. **Title**: [Module Name] 🛡️
2. **Category**: [Select from Memory Bank]
3. **Role Level**: [Officer / Supervisor / Manager / Tactical]
4. **Compliance Alignment**: (Cite specific standards: ASIS, SIA, ISO 18788, etc.)
5. **Training Objectives**: (3-6 bullet points)
6. **Lesson Outline**: (Structured list of subtopics)
7. **"What If?" Scenario**: (Realistic field situation & correct response)
8. **Assessment Method**: (How to verify knowledge)
9. **Final Directive**: (A powerful closing reminder)

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
