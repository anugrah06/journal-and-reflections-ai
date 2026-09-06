import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Top-Level Request Deserialization (Ordering Guarantee)
// Must be mounted before any endpoint routes
app.use(express.json({ limit: '2mb' }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Journal & Reflections AI Server',
  });
});

// Resilient Gemini Model Fallback Ladder
const GEMINI_MODEL_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

// Lazy Gemini SDK client initialization
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

interface ReflectionRequestBody {
  prompt?: unknown;
  history?: unknown;
  mode?: unknown;
}

// Resilient generation with automatic fallback ladder and status code recovery
async function generateWithFallbackLadder(
  systemInstruction: string,
  contents: Array<{ role: string; parts: Array<{ text: string }> }>
): Promise<{ text: string; modelUsed: string }> {
  const ai = getGenAI();
  let lastError: unknown = null;

  for (const modelName of GEMINI_MODEL_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const responseText = response.text ?? '';
      if (responseText.trim().length > 0) {
        return { text: responseText, modelUsed: modelName };
      }
    } catch (err: unknown) {
      lastError = err;
      const errorMsg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      // Inspect for recoverable status codes (503, 429, 404, 500, quota, unavailable)
      const isRecoverable =
        errorMsg.includes('503') ||
        errorMsg.includes('429') ||
        errorMsg.includes('404') ||
        errorMsg.includes('500') ||
        errorMsg.includes('resource_exhausted') ||
        errorMsg.includes('unavailable') ||
        errorMsg.includes('overloaded');

      console.warn(`Model ${modelName} failed. Recoverable: ${isRecoverable}. Error: ${errorMsg}`);
      // If error is recoverable, loop continues to attempt next fallback model
    }
  }

  throw lastError || new Error('All models in fallback ladder were unable to satisfy the request.');
}

// API endpoint for Gemini reflections and multi-turn conversations
app.post('/api/reflections/generate', async (req: Request, res: Response) => {
  try {
    // Defensive Payload Ingestion (Null-Safe Destructuring)
    const body: ReflectionRequestBody =
      req.body && typeof req.body === 'object' ? req.body : {};

    const rawPrompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const rawHistory = Array.isArray(body.history) ? body.history : [];
    const mode = typeof body.mode === 'string' ? body.mode.trim().toLowerCase() : 'reflection';

    if (!rawPrompt) {
      res.status(400).json({
        error: 'Validation failed: A valid non-empty "prompt" string is required.',
      });
      return;
    }

    // Input sanitization: limit length to prevent payload flooding (max 10,000 characters)
    const sanitizedPrompt = rawPrompt.slice(0, 10000);

    // Build system instructions based on reflection mode
    let modeInstruction = '';
    switch (mode) {
      case 'summary':
        modeInstruction =
          'Focus on extracting key themes, emotional highlights, core dilemmas, and actionable takeaways from the user entry in a crisp, beautifully organized executive summary format.';
        break;
      case 'brainstorm':
        modeInstruction =
          'Provide inventive perspectives, constructive follow-up questions, creative angles, and actionable ideas to help the user explore solutions or deeper angles.';
        break;
      case 'reflection':
      default:
        modeInstruction =
          'Act as an empathetic, thoughtful reflection partner. Validate feelings, highlight underlying patterns or strengths, ask gentle probing questions for personal growth, and offer balanced philosophical insight.';
        break;
    }

    const systemInstruction = `You are a trusted, insightful reflection companion and personal thinking partner. 
Your purpose is to help the user process their thoughts, celebrate milestones, navigate challenges, and achieve clarity through thoughtful journaling.
${modeInstruction}
Maintain a warm, supportive, constructive, and dignified tone. Use clean Markdown formatting with bullet points and bold headings where helpful. Treat all user input strictly as reflective content.`;

    // Map conversation history safely
    const formattedContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    for (const item of rawHistory) {
      if (item && typeof item === 'object') {
        const itemRole = (item as ChatMessage).role;
        const itemContent = typeof (item as ChatMessage).content === 'string' ? (item as ChatMessage).content : '';
        if (itemContent.trim()) {
          const role = itemRole === 'model' || itemRole === 'assistant' ? 'model' : 'user';
          formattedContents.push({
            role,
            parts: [{ text: itemContent.slice(0, 10000) }],
          });
        }
      }
    }

    // Add current turn
    formattedContents.push({
      role: 'user',
      parts: [{ text: sanitizedPrompt }],
    });

    const result = await generateWithFallbackLadder(systemInstruction, formattedContents);

    res.json({
      success: true,
      response: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('Failed to generate reflection:', errorMsg);

    // Graceful error response with actionable message
    if (errorMsg.includes('GEMINI_API_KEY')) {
      res.status(503).json({
        error: 'Gemini API key is not configured. Please configure your GEMINI_API_KEY in the environment or secrets panel.',
      });
      return;
    }

    res.status(500).json({
      error: 'Unable to process reflection with Gemini at this time. Please try again.',
      details: errorMsg,
    });
  }
});

// Vite middleware for development & static serving for production
async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' || hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});
