import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '25mb' }));

// Initialize Google GenAI client (server-side only)
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Primary endpoint: Analyze meeting notes into verified action items
app.post('/api/analyze-notes', async (req: Request, res: Response) => {
  try {
    const {
      rawNotes,
      title = 'Meeting',
      currentDate = new Date().toISOString().split('T')[0],
      userName = 'Me',
      userRole = '',
      attendees = [],
    } = req.body;

    if (!rawNotes || typeof rawNotes !== 'string' || !rawNotes.trim()) {
      return res.status(400).json({ error: 'Meeting notes text is required' });
    }

    const ai = getGenAI();
    if (!ai) {
      // Intelligent mock/heuristic fallback if API key is not yet configured
      return res.json(generateFallbackAnalysis(rawNotes, title, userName, currentDate));
    }

    const systemInstruction = `You are an elite Chief of Staff and Executive Meeting Analyst.
Your core mission is to convert messy, informal, unstructured meeting notes, transcripts, or bullet points into an airtight, verified, and prioritized action item checklist.
The user is '${userName}'${userRole ? ` (Role: ${userRole})` : ''}.
Key Requirements:
1. UNAMBIGUOUS PERSONAL TO-DO LIST:
   - Identify every single commitment, task, follow-up, or deliverable where '${userName}' (or 'I', 'me', or their role) is responsible.
   - For '${userName}', set assignee to '${userName}' and isPersonal to true.
2. TEAM ACTION MATRIX:
   - Identify all tasks assigned to colleagues or other attendees.
   - Explicitly detect and preserve who is supposed to do what.
   - If someone is mentioned like "Marcus will ping design", assignee is "Marcus".
3. AMBIGUITY DETECTION & VERIFICATION:
   - Scrutinize every task for vague ownership (e.g., "someone should look into...", "we should probably...", "need to figure out..."), vague deadlines, or underspecified deliverables.
   - Flag them with isAmbiguous: true, provide a clear ambiguityReason and a concrete suggestedClarification.
   - Also populate the top-level ambiguities array with distinct verification flags so the user can resolve them immediately.
4. DEADLINE CALCULATION:
   - Today's date is: ${currentDate}.
   - Resolve relative dates (e.g. "by Friday", "by EOD tomorrow", "next Tuesday", "in 2 weeks", "by end of sprint") to an actual ISO date (YYYY-MM-DD) whenever possible, and keep the deadlineLabel (e.g. "Friday 5pm").
5. PRIORITIZATION:
   - Assign 'high', 'medium', or 'low' priority based on urgency, blockers, dependencies, and business impact.
   - Provide a 1-sentence priorityReason (e.g. "Blocks frontend integration on Thursday").
6. EFFORT:
   - 'quick' (<30 mins), 'medium' (1-2 hours), or 'deep' (half-day or multi-day focus).
7. EXECUTIVE SUMMARY:
   - Concise executive tl;dr, key concrete decisions made, and unresolved questions.`;

    const prompt = `Current Date: ${currentDate}
Meeting Title: ${title}
User Identity: ${userName} (${userRole || 'Team Member'})
Attendees: ${attendees.length > 0 ? attendees.join(', ') : 'Not specified'}

Raw Meeting Notes:
"""
${rawNotes}
"""

Analyze these notes and return the structured JSON data strictly conforming to the requested schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.OBJECT,
              properties: {
                executiveSummary: {
                  type: Type.STRING,
                  description: 'Concise 2-3 sentence overview of the meeting outcomes.',
                },
                keyOutcomes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Bulleted list of key takeaways and conclusions.',
                },
                unresolvedQuestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Open questions or debates that were left unanswered.',
                },
              },
              required: ['executiveSummary', 'keyOutcomes', 'unresolvedQuestions'],
            },
            actionItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: 'Clear, imperative task starting with a strong action verb.',
                  },
                  originalQuote: {
                    type: Type.STRING,
                    description: 'Exact or near-exact excerpt from the notes.',
                  },
                  assignee: {
                    type: Type.STRING,
                    description: `Name of the assignee, '${userName}' if for the user, or 'Unassigned'.`,
                  },
                  isPersonal: {
                    type: Type.BOOLEAN,
                    description: `True if explicitly or implicitly assigned to ${userName}.`,
                  },
                  priority: {
                    type: Type.STRING,
                    description: "'high', 'medium', or 'low'",
                  },
                  priorityReason: {
                    type: Type.STRING,
                    description: 'Brief justification for the priority score.',
                  },
                  dueDate: {
                    type: Type.STRING,
                    description: 'ISO date YYYY-MM-DD or empty string if unknown.',
                  },
                  deadlineLabel: {
                    type: Type.STRING,
                    description: "Human phrase like 'Thursday EOD' or 'Before Sprint Planning'.",
                  },
                  effort: {
                    type: Type.STRING,
                    description: "'quick', 'medium', or 'deep'",
                  },
                  category: {
                    type: Type.STRING,
                    description: 'Category like Engineering, Product, Design, Sales, Operations.',
                  },
                  isAmbiguous: {
                    type: Type.BOOLEAN,
                    description: 'True if ownership, scope, or deadline is uncertain.',
                  },
                  ambiguityReason: {
                    type: Type.STRING,
                    description: 'Why this item is ambiguous.',
                  },
                  suggestedClarification: {
                    type: Type.STRING,
                    description: 'Proposed question or clarification to confirm.',
                  },
                  tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['title', 'assignee', 'isPersonal', 'priority'],
              },
            },
            decisions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  decision: { type: Type.STRING },
                  context: { type: Type.STRING },
                  stakeholders: { type: Type.STRING },
                },
                required: ['decision'],
              },
            },
            ambiguities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  issue: { type: Type.STRING },
                  snippet: { type: Type.STRING },
                  suggestedAction: { type: Type.STRING },
                },
                required: ['issue', 'snippet', 'suggestedAction'],
              },
            },
          },
          required: ['summary', 'actionItems', 'decisions', 'ambiguities'],
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Gemini returned an empty response');
    }

    const cleanedJson = textOutput
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const parsed = JSON.parse(cleanedJson);

    // Format and sanitize items
    const actionItemsWithIds = (parsed.actionItems || []).map((item: any, idx: number) => ({
      id: `ai-${Date.now()}-${idx}`,
      title: item.title || 'Untitled Action Item',
      originalQuote: item.originalQuote || '',
      assignee: item.assignee || (item.isPersonal ? userName : 'Unassigned'),
      isPersonal: Boolean(item.isPersonal),
      priority: ['high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium',
      priorityReason: item.priorityReason || '',
      dueDate: item.dueDate || '',
      deadlineLabel: item.deadlineLabel || '',
      status: 'todo',
      effort: ['quick', 'medium', 'deep'].includes(item.effort) ? item.effort : 'medium',
      category: item.category || 'General',
      isAmbiguous: Boolean(item.isAmbiguous),
      ambiguityReason: item.ambiguityReason || '',
      suggestedClarification: item.suggestedClarification || '',
      tags: Array.isArray(item.tags) ? item.tags : [],
    }));

    const decisionsWithIds = (parsed.decisions || []).map((dec: any, idx: number) => ({
      id: `dec-${Date.now()}-${idx}`,
      decision: dec.decision,
      context: dec.context || '',
      stakeholders: dec.stakeholders || '',
    }));

    const ambiguitiesWithIds = (parsed.ambiguities || []).map((amb: any, idx: number) => ({
      id: `amb-${Date.now()}-${idx}`,
      issue: amb.issue,
      snippet: amb.snippet || '',
      suggestedAction: amb.suggestedAction || '',
      resolved: false,
    }));

    return res.json({
      summary: parsed.summary || {
        executiveSummary: 'Meeting summary parsed.',
        keyOutcomes: [],
        unresolvedQuestions: [],
      },
      actionItems: actionItemsWithIds,
      decisions: decisionsWithIds,
      ambiguities: ambiguitiesWithIds,
    });
  } catch (err: any) {
    console.error('Error analyzing notes with Gemini:', err);
    // Return gracefully with fallback if there's an API error
    const fallback = generateFallbackAnalysis(
      req.body.rawNotes || '',
      req.body.title || 'Meeting',
      req.body.userName || 'Me',
      req.body.currentDate || new Date().toISOString().split('T')[0]
    );
    return res.json({
      ...fallback,
      warning: `AI analysis had a hiccup (${err?.message || 'Check connection'}). Rendered intelligent heuristic breakdown.`,
    });
  }
});

// Endpoint: AI drafted Slack/Email clarification message
app.post('/api/suggest-clarification', async (req: Request, res: Response) => {
  try {
    const { taskTitle, ambiguityReason, meetingTitle, recipientName = 'the team' } = req.body;

    const ai = getGenAI();
    if (!ai) {
      return res.json({
        message: `Hi ${recipientName}! Following up on ${meetingTitle || 'our meeting'}: for "${taskTitle}", could we clarify ownership and next steps? Thanks!`,
      });
    }

    const prompt = `Draft a polite, concise, and professional message (suitable for Slack or quick email) to clarify an ambiguous action item from a meeting.
Meeting: ${meetingTitle || 'Recent Sync'}
Task: ${taskTitle}
Ambiguity issue: ${ambiguityReason || 'Unclear ownership or scope'}
Target recipient: ${recipientName}

Return ONLY the ready-to-copy message text. Keep it friendly, clear, and under 3 sentences.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({
      message: response.text?.trim() || `Hey team, regarding "${taskTitle}", could we clarify who is driving this and what the timeline is?`,
    });
  } catch (err) {
    console.error('Error suggesting clarification:', err);
    return res.json({
      message: `Hi there, just wanted to check on "${req.body.taskTitle}" from our sync. Could we confirm who has ownership and target date?`,
    });
  }
});

// Endpoint: Real-time audio chunk transcription via Gemini with quota-resilient model cascade
app.post('/api/transcribe', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({ transcript: '' });
    }

    const cleanMime = mimeType.split(';')[0].trim() || 'audio/webm';
    const audioPart = {
      inlineData: {
        mimeType: cleanMime,
        data: audioBase64,
      },
    };

    const promptText =
      'Transcribe this spoken meeting note accurately into plain text. Return ONLY the exact spoken words without quotes, prefixes, or commentary. If the audio contains only silence, breathing, or background noise with no speech, return an empty string.';

    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.5-transcribe',
    ];

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [audioPart, { text: promptText }],
          },
        });
        const transcript = (response.text || '').trim();
        return res.json({ transcript });
      } catch (modelErr: any) {
        const msg = String(modelErr?.message || modelErr || '');
        const isQuotaOrRateLimit =
          modelErr?.status === 429 ||
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('Quota exceeded');
        if (isQuotaOrRateLimit) {
          // Try next model in cascade
          continue;
        }
        break;
      }
    }

    return res.json({ transcript: '', rateLimited: true, retryAfterMs: 15000 });
  } catch {
    return res.json({ transcript: '' });
  }
});

// Heuristic fallback for offline/no-key mode
function generateFallbackAnalysis(notes: string, title: string, userName: string, date: string) {
  const lines = notes.split('\n').map(l => l.trim()).filter(Boolean);
  const actionItems: any[] = [];
  const ambiguities: any[] = [];
  const decisions: any[] = [];
  const keyOutcomes: string[] = [];

  let idx = 0;
  for (const line of lines) {
    idx++;
    const lower = line.toLowerCase();

    // Check for decision
    if (lower.startsWith('decision:') || lower.includes('decided to') || lower.includes('agreed on')) {
      decisions.push({
        id: `dec-fb-${idx}`,
        decision: line.replace(/^(decision:|\*|-)\s*/i, ''),
        context: 'Agreed in meeting',
      });
      continue;
    }

    // Check for ambiguity
    const isVague = lower.includes('someone') || lower.includes('maybe') || lower.includes('we should') || lower.includes('figure out') || lower.includes('tbd');
    const isMe = lower.includes(userName.toLowerCase()) || lower.includes(' i ') || lower.startsWith('i ') || lower.includes('my todo') || lower.includes('me:');
    
    // Assignee detection
    let assignee = 'Unassigned';
    if (isMe) {
      assignee = userName;
    } else {
      const match = line.match(/^([A-Z][a-z]+):/);
      if (match) {
        assignee = match[1];
      } else if (lower.includes('sarah')) assignee = 'Sarah';
      else if (lower.includes('marcus')) assignee = 'Marcus';
      else if (lower.includes('alex')) assignee = 'Alex';
      else if (lower.includes('david')) assignee = 'David';
      else if (lower.includes('emily')) assignee = 'Emily';
    }

    const hasDue = lower.includes('by ') || lower.includes('before ') || lower.includes('deadline');
    let deadlineLabel = '';
    let dueDate = '';
    if (hasDue) {
      deadlineLabel = line.match(/(by\s+[^,.]+)/i)?.[1] || 'End of week';
      dueDate = date;
    }

    // Determine priority
    let priority: 'high' | 'medium' | 'low' = 'medium';
    if (lower.includes('urgent') || lower.includes('asap') || lower.includes('critical') || lower.includes('p0') || lower.includes('p1')) {
      priority = 'high';
    } else if (lower.includes('nice to have') || lower.includes('later') || lower.includes('backlog')) {
      priority = 'low';
    }

    if (line.length > 5 && (line.includes('-') || line.includes('*') || line.includes(':') || hasDue || isMe || isVague)) {
      const cleanTitle = line.replace(/^[-*•\d.]+\s*/, '').replace(/^(todo|action item):\s*/i, '');
      const isPersonal = assignee.toLowerCase() === userName.toLowerCase() || isMe;
      
      actionItems.push({
        id: `ai-fb-${idx}`,
        title: cleanTitle,
        originalQuote: line,
        assignee: isPersonal ? userName : assignee,
        isPersonal,
        priority,
        priorityReason: priority === 'high' ? 'Flagged as urgent during meeting' : 'Standard priority action item',
        dueDate,
        deadlineLabel,
        status: 'todo',
        effort: 'medium',
        category: 'Action Item',
        isAmbiguous: isVague,
        ambiguityReason: isVague ? 'Unassigned or tentative phrasing used in notes' : '',
        suggestedClarification: isVague ? `Confirm explicit owner and timeline for: "${cleanTitle.slice(0, 40)}..."` : '',
        tags: [isPersonal ? 'Personal' : 'Team'],
      });

      if (isVague) {
        ambiguities.push({
          id: `amb-fb-${idx}`,
          issue: `Unclear owner or timeline in: "${cleanTitle.slice(0, 50)}"`,
          snippet: line,
          suggestedAction: 'Assign a single owner and set a firm deadline.',
          resolved: false,
        });
      }
    } else {
      keyOutcomes.push(line);
    }
  }

  return {
    summary: {
      executiveSummary: `Meeting notes processed for "${title}". Extracted ${actionItems.length} action items across personal to-dos and team deliverables.`,
      keyOutcomes: keyOutcomes.length > 0 ? keyOutcomes.slice(0, 4) : ['Key goals and progress reviewed.', 'Dependencies aligned across workstreams.'],
      unresolvedQuestions: ambiguities.length > 0 ? ambiguities.map(a => a.issue) : ['Clarify open dependencies during next check-in.'],
    },
    actionItems,
    decisions: decisions.length > 0 ? decisions : [
      { id: 'dec-fb-1', decision: 'Proceed with prioritized milestones as agreed.', context: 'General consensus' },
    ],
    ambiguities,
  };
}

// Dev & Production serving setup
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`ActionDraft server running on http://0.0.0.0:${port} [${isProd ? 'production' : 'development'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
