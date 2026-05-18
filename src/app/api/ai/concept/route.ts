/**
 * POST /api/ai/concept — Concept understanding assessment endpoint.
 *
 * Uses the Nova API (OpenAI-compatible) with nova-2-lite-v1 for streaming
 * concept assessment. The response includes conversational feedback and
 * ends with an assessment JSON marker.
 *
 * Validates: Requirements 2.2, 2.6, 16.2
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
const RATE_LIMIT_MAX_REQUESTS = 18;

interface ConceptRequestBody {
  topicId: string;
  message: string;
  sessionMessages: Array<{
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

  let body: ConceptRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { topicId, message, sessionMessages } = body;

  if (!topicId || !message) {
    return NextResponse.json(
      { error: 'topicId and message are required' },
      { status: 400 }
    );
  }

  const exchangeCount = sessionMessages.filter((m) => m.role === 'user').length;
  const systemPrompt = buildConceptSystemPrompt(topicId, exchangeCount);

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...sessionMessages
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
      temperature: 0.5,
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
    console.error('[AI Concept] Nova API error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown AI service error';
    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }
}

function buildConceptSystemPrompt(topicId: string, exchangeCount: number): string {
  const isLastExchange = exchangeCount >= 3;

  return `You are an expert AWS Solutions Architect assessor evaluating a learner's understanding of the topic: "${topicId}" for the SAP-C02 certification.

Your role:
- Assess whether the learner demonstrates genuine understanding of the concept.
- Ask probing follow-up questions if their explanation is vague or incomplete.
- Be encouraging but honest about gaps in understanding.
- Focus on conceptual understanding, not memorization of facts.

${
  isLastExchange
    ? `This is the learner's final response (exchange 4 of 4). You MUST provide your final assessment.

After your conversational response, you MUST end your message with exactly this JSON block on a new line:
<!--ASSESSMENT:{"passed": true}-->
or
<!--ASSESSMENT:{"passed": false}-->

Use "passed": true if the learner has demonstrated sufficient understanding of the core concepts.
Use "passed": false if the learner has significant gaps in understanding.`
    : `This is exchange ${exchangeCount + 1} of 4. Continue assessing the learner's understanding. Ask follow-up questions if needed to probe deeper understanding.

If the learner has already clearly demonstrated strong understanding, you may end early by including this JSON block on a new line:
<!--ASSESSMENT:{"passed": true}-->

Otherwise, continue the conversation to gather more evidence of understanding.`
}

Keep your responses concise (under 200 words) and focused on assessment.`;
}
