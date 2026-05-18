/**
 * POST /api/ai/review — Architecture diagram review endpoint.
 *
 * Uses the Nova API (OpenAI-compatible) with nova-pro-v1 for structured
 * rubric-based scoring. Returns an ArchitectureReview JSON response.
 *
 * Validates: Requirements 4.3, 6.6, 6.7, 16.2
 */

import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import type { ArchitectureReview } from '@/types';

const nova = new OpenAI({
  apiKey: process.env.NOVA_API_KEY,
  baseURL: 'https://api.nova.amazon.com/v1',
});

/** Nova Pro for strongest reasoning on rubric scoring */
const MODEL_ID = 'nova-pro-v1';

/** Rate limiting: stricter for Pro model (5 RPM limit) */
const requestTimestamps: number[] = [];
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 4; // Stay under 5 RPM limit

interface ReviewRequestBody {
  taskId: string;
  components: Array<{
    id: string;
    type: string;
    label: string;
    parentId: string | null;
  }>;
  connections: Array<{
    sourceId: string;
    targetId: string;
    connectionType: string;
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
      headers: { 'Retry-After': '60' },
    });
  }
  requestTimestamps.push(now);
  while (requestTimestamps.length > 0 && requestTimestamps[0] <= windowStart) {
    requestTimestamps.shift();
  }

  let body: ReviewRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { taskId, components, connections } = body;

  if (!taskId || !Array.isArray(components) || !Array.isArray(connections)) {
    return NextResponse.json(
      { error: 'taskId, components, and connections are required' },
      { status: 400 }
    );
  }

  const systemPrompt = buildReviewSystemPrompt();
  const userMessage = buildReviewUserMessage(taskId, components, connections);

  // Attempt the review with one retry on invalid JSON
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await nova.chat.completions.create({
        model: MODEL_ID,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 2048,
        temperature: 0.3,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No content in AI response');
      }

      const review = parseReviewResponse(responseText);
      return NextResponse.json(review);
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (lastError.message.includes('Invalid JSON') && attempt === 0) {
        continue;
      }
      break;
    }
  }

  console.error('[AI Review] Failed after retries:', lastError);
  return NextResponse.json(
    {
      error:
        'Unable to process the architecture review. Please try submitting again.',
    },
    { status: 502 }
  );
}

function parseReviewResponse(responseText: string): ArchitectureReview {
  const jsonMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    const objectMatch = responseText.match(/\{[\s\S]*\}/);
    if (!objectMatch) {
      throw new Error('Invalid JSON: No JSON object found in AI response');
    }
    try {
      parsed = JSON.parse(objectMatch[0]);
    } catch {
      throw new Error('Invalid JSON: Could not parse AI response as JSON');
    }
  }

  if (!isValidArchitectureReview(parsed)) {
    throw new Error(
      'Invalid JSON: AI response does not match expected review structure'
    );
  }

  return parsed;
}

function isValidArchitectureReview(data: unknown): data is ArchitectureReview {
  if (typeof data !== 'object' || data === null) return false;

  const review = data as Record<string, unknown>;

  if (typeof review.overallScore !== 'number') return false;
  if (review.overallScore < 0 || review.overallScore > 100) return false;
  if (typeof review.feedback !== 'string') return false;
  if (!Array.isArray(review.suggestions)) return false;

  const categories = review.categories;
  if (typeof categories !== 'object' || categories === null) return false;

  const cats = categories as Record<string, unknown>;
  const requiredCategories = [
    'correctness',
    'connectivity',
    'security',
    'bestPractices',
  ];

  for (const cat of requiredCategories) {
    const categoryScore = cats[cat];
    if (typeof categoryScore !== 'object' || categoryScore === null) return false;
    const cs = categoryScore as Record<string, unknown>;
    if (typeof cs.score !== 'number') return false;
    if (cs.score < 0 || cs.score > 100) return false;
    if (typeof cs.weight !== 'number') return false;
    if (typeof cs.feedback !== 'string') return false;
  }

  return true;
}

function buildReviewSystemPrompt(): string {
  return `You are an expert AWS Solutions Architect reviewing architecture diagrams for the SAP-C02 certification exam.

You MUST respond with ONLY a valid JSON object (no markdown, no explanation outside the JSON). The JSON must follow this exact structure:

{
  "overallScore": <number 0-100>,
  "categories": {
    "correctness": {
      "score": <number 0-100>,
      "weight": 0.4,
      "feedback": "<string: specific feedback on architectural correctness>"
    },
    "connectivity": {
      "score": <number 0-100>,
      "weight": 0.3,
      "feedback": "<string: specific feedback on component connectivity>"
    },
    "security": {
      "score": <number 0-100>,
      "weight": 0.2,
      "feedback": "<string: specific feedback on security best practices>"
    },
    "bestPractices": {
      "score": <number 0-100>,
      "weight": 0.1,
      "feedback": "<string: specific feedback on AWS best practices>"
    }
  },
  "feedback": "<string: overall summary feedback>",
  "suggestions": ["<string: improvement suggestion 1>", "<string: improvement suggestion 2>", ...]
}

Scoring guidelines:
- correctness (40%): Are the right components used? Are they in the right places?
- connectivity (30%): Are components properly connected? Do data flows make sense?
- security (20%): Are security groups, NACLs, and encryption properly applied?
- bestPractices (10%): Does the architecture follow AWS Well-Architected Framework principles?

The overallScore should be the weighted average: (correctness.score * 0.4) + (connectivity.score * 0.3) + (security.score * 0.2) + (bestPractices.score * 0.1)

Provide 2-5 specific, actionable suggestions for improvement.`;
}

function buildReviewUserMessage(
  taskId: string,
  components: ReviewRequestBody['components'],
  connections: ReviewRequestBody['connections']
): string {
  const componentList = components
    .map((c) => {
      const parent = c.parentId ? ` (inside ${c.parentId})` : '';
      return `- ${c.type}: "${c.label}"${parent}`;
    })
    .join('\n');

  const connectionList = connections
    .map((c) => `- ${c.sourceId} → ${c.targetId} (${c.connectionType})`)
    .join('\n');

  return `Please review this architecture diagram submission for task "${taskId}".

## Components (${components.length} total):
${componentList || '(none)'}

## Connections (${connections.length} total):
${connectionList || '(none)'}

Evaluate this architecture against the rubric and provide your structured JSON review.`;
}
