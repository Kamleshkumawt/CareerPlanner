import axios from 'axios';

interface LLMInput {
  origin: string;
  destination: string;
  target_role: string;
  salary_expectation: number;
  timeline_months: number;
  feasibility_label: string;
  conflicts: string[];
  eligible_routes: any[];
  salary_analysis: any;
  destinationData: any;
}

interface LLMOutput {
  narrative: string;
  action_steps: string[];
}

// Build a clear prompt — LLM only narrates, never decides
function buildPrompt(input: LLMInput): string {
  return `You are a career relocation advisor. Generate a personalised, honest, actionable plan.

USER PROFILE:
- From: ${input.origin}
- Moving to: ${input.destination}
- Target role: ${input.target_role}
- Salary expectation: ${input.salary_analysis.currency_code} ${input.salary_expectation.toLocaleString()}
- Timeline: ${input.timeline_months} months
- Feasibility: ${input.feasibility_label}

DETERMINISTIC ANALYSIS (already computed — do NOT change these findings):
- Conflicts found: ${input.conflicts.length > 0 ? input.conflicts.join(' | ') : 'None'}
- Eligible visa routes: ${input.eligible_routes.map((r: any) => r.name).join(', ') || 'None found within salary/timeline constraints'}
- Market median salary: ${input.salary_analysis.currency_code} ${input.salary_analysis.market_median.toLocaleString()}

YOUR JOB:
1. Write a 2-3 sentence honest narrative summary. If there are conflicts, acknowledge them directly.
2. Write 5-7 concrete action steps the user should take, in order.

Respond ONLY in this JSON format (no markdown, no extra text):
{
  "narrative": "...",
  "action_steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
}`;
}

export async function generateLLMNarrative(input: LLMInput): Promise<LLMOutput> {
  const prompt = buildPrompt(input);

  if (process.env.GEMINI_API_KEY) {
    try {
      return await callGemini(prompt);
    } catch (err) {
      console.warn('Gemini failed, using fallback narrative:', err);
    }
  }

  // Fallback: rule-based narrative (no LLM needed)
  return buildFallbackNarrative(input);
}

async function callGemini(prompt: string): Promise<LLMOutput> {
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
    },
    { timeout: 15000 }  // 15s timeout
  );

  let text = response.data.candidates[0].content.parts[0].text as string;

  // console.log('Raw Gemini response:', text);
  
  // Strip any markdown fences if present
  text = text.replace(/```json|```/g, '').trim();
  
  // Check if response is empty or obviously malformed
  if (!text || text === '}' || !text.includes('"narrative"')) {
    throw new Error('Gemini response is empty or missing required fields');
  }
  
  let clean = text;
  
  // Fix unterminated strings by finding the last quote and checking if it's closed
  const quotePositions: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    if (clean[i] === '"' && (i === 0 || clean[i - 1] !== '\\')) {
      quotePositions.push(i);
    }
  }
  
  // If odd number of quotes, the last string is unterminated
  if (quotePositions.length % 2 === 1) {
    const lastClosingBracket = Math.max(clean.lastIndexOf(']'), clean.lastIndexOf('}'));
    if (lastClosingBracket > -1) {
      clean = clean.substring(0, lastClosingBracket) + '"}]' + clean.substring(lastClosingBracket).replace(/^\]|\}/, '');
    }
  }
  
  // Repair incomplete JSON by finding the last valid structure and closing it
  if (!clean.endsWith('}')) {
    const lastArrayClose = clean.lastIndexOf(']');
    if (lastArrayClose > -1) {
      clean = clean.substring(0, lastArrayClose + 1) + '}';
    } else {
      clean = clean + ']}';
    }
  }
  
  let parsed: any;
  try {
    parsed = JSON.parse(clean);
  } catch (parseErr) {
    throw new Error(`Failed to parse Gemini response: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
  }

  // Validate required fields exist
  if (!parsed.narrative || !Array.isArray(parsed.action_steps)) {
    throw new Error('Gemini response missing required fields (narrative or action_steps)');
  }

  return {
    narrative: parsed.narrative,
    action_steps: parsed.action_steps
  };
}

// Fallback when LLM is unavailable — never leaves user with an error
function buildFallbackNarrative(input: LLMInput): LLMOutput {
  const hasConflicts = input.conflicts.length > 0;

  const narrative = hasConflicts
    ? `Your plan to move from ${input.origin} to ${input.destination} as a ${input.target_role} has ${input.conflicts.length} conflict(s) that need resolving before proceeding. Review the conflicts section carefully and adjust your timeline or salary expectations accordingly.`
    : `Moving from ${input.origin} to ${input.destination} as a ${input.target_role} appears feasible within your ${input.timeline_months}-month timeline. Focus on securing a job offer first, as it unlocks the visa process.`;

  const action_steps = [
    `Step 1: Research ${input.destination} companies hiring ${input.target_role}s on LinkedIn and local job boards`,
    `Step 2: Tailor your CV to ${input.destination} market standards`,
    `Step 3: Begin applying to roles with ${input.eligible_routes.length > 0 ? input.eligible_routes[0].name + ' sponsorship' : 'visa sponsorship'}`,
    `Step 4: Once you have an offer, initiate the visa application process`,
    `Step 5: Arrange document legalisation and degree recognition`,
    `Step 6: Secure accommodation before arrival`,
    `Step 7: Register with local authorities upon arrival`
  ];

  return { narrative, action_steps };
}