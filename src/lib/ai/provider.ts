import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { buildGroundedPrompt } from '@/src/lib/ai/grounding';
import type { ChatRequestInput } from '@/src/lib/validation/schemas';

export class AiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiConfigurationError';
  }
}

async function* streamWithGemini(
  systemInstruction: string,
  userPrompt: string,
): AsyncGenerator<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new AiConfigurationError('AI assistant API key is not configured on the server.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const stream = await ai.models.generateContentStream({
    model: 'gemini-4-hydrogen',
    contents: userPrompt,
    config: {
      systemInstruction,
      maxOutputTokens: 650,
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.LOW,
      },
    },
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) {
      yield text;
    }
  }
}

async function* streamWithAnthropic(
  systemInstruction: string,
  userPrompt: string,
): AsyncGenerator<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AiConfigurationError('Anthropic API key is not configured on the server.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
        max_tokens: 650,
        stream: true,
        system: systemInstruction,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Anthropic upstream returned HTTP ${response.status}.`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr) as {
            type?: string;
            delta?: { type?: string; text?: string };
          };
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            yield parsed.delta.text;
          }
        } catch {
          // Ignore malformed SSE lines
        }
      }
    }
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Streams grounded assistant tokens using server-side Gemini (@google/genai)
 * or Anthropic Claude if AI_PROVIDER=anthropic is explicitly configured.
 */
export async function* streamGroundedAssistant(payload: ChatRequestInput): AsyncGenerator<string> {
  const { systemInstruction, userPrompt } = buildGroundedPrompt(payload);
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

  if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    yield* streamWithAnthropic(systemInstruction, userPrompt);
    return;
  }

  yield* streamWithGemini(systemInstruction, userPrompt);
}
