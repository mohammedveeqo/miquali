/**
 * POST /api/ai/chat — AI Tutor streaming chat endpoint.
 *
 * Uses the Nova API (OpenAI-compatible) with nova-2-lite-v1 for fast
 * conversational responses. Streams tokens back to the client.
 *
 * Validates: Requirements 7.2, 7.3, 7.5, 16.2
 */

import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const nova = new OpenAI({
  apiKey: process.env.NOVA_API_KEY,
  baseURL: 'https://api.nova.amazon.com/v1',
});

/** Nova 2 Lite for fast conversational responses */
const MODEL_ID = 'nova-2-lite-v1';

/** Rate limiting: simple in-memory tracker */
const requestTimestamps: number[] = [];
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 18; // Stay under 20 RPM limit

interface ChatRequestBody {
  topicId: string;
  message: string;
  chatHistory: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
}

export async function POST(request: Request): Promise<Response> {
  // Rate limiting check
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recentRequests = requestTimestamps.filter((t) => t > windowStart);
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': '30' },
    });
  }
  requestTimestamps.push(now);
  while (requestTimestamps.length > 0 && requestTimestamps[0] <= windowStart) {
    requestTimestamps.shift();
  }

  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { topicId, message, chatHistory } = body;

  if (!topicId || !message) {
    return NextResponse.json(
      { error: 'topicId and message are required' },
      { status: 400 }
    );
  }

  const systemPrompt = buildTutorSystemPrompt(topicId);
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...chatHistory
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    { role: 'user', content: message },
  ];

  try {
    const stream = await nova.chat.completions.create({
      model: MODEL_ID,
      messages,
      max_tokens: 1024,
      temperature: 0.7,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: unknown) {
    console.error('[AI Chat] Nova API error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown AI service error';
    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }
}

function buildTutorSystemPrompt(topicId: string): string {
  return `You are an expert AWS Solutions Architect tutor helping a learner study for the SAP-C02 certification exam. You are currently assisting with the topic: "${topicId}".

Your guidelines:
- Provide clear, concise explanations focused on the current networking topic.
- Use real-world analogies when helpful.
- Reference AWS best practices and Well-Architected Framework principles.
- If the learner asks about something outside the current topic, briefly acknowledge it but guide them back to the current topic.
- Keep responses focused and under 300 words unless a detailed explanation is needed.
- Use markdown formatting for code snippets, lists, and emphasis.
- Never provide direct exam answers; instead guide the learner to understand the underlying concepts.`;
}
