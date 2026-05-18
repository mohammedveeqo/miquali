/**
 * AI Service — Client-side functions that call Next.js API routes for AI interactions.
 *
 * All Bedrock calls happen server-side in API routes. This module provides
 * typed async generators for streaming responses and a promise-based function
 * for architecture review.
 *
 * Validates: Requirements 2.2, 2.6, 4.3, 6.6, 7.3, 7.5, 16.2
 */

import type {
  ChatMessage,
  DiagramSubmissionComponent,
  DiagramSubmissionConnection,
  ArchitectureReview,
} from '@/types';

/** Error thrown when the AI service encounters a problem */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryAfter?: number
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

/**
 * Stream a tutor response from Nova Lite via the /api/ai/chat route.
 * Yields text chunks as they arrive from the server.
 *
 * @param params.topicId - Current topic identifier for context
 * @param params.message - The learner's message
 * @param params.chatHistory - Previous messages in the conversation
 * @yields Text chunks from the AI response
 * @throws AIServiceError on timeout, rate limiting, or server errors
 */
export async function* streamTutorResponse(params: {
  topicId: string;
  message: string;
  chatHistory: ChatMessage[];
}): AsyncGenerator<string> {
  const response = await fetchWithTimeout('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topicId: params.topicId,
      message: params.message,
      chatHistory: params.chatHistory,
    }),
  });

  handleErrorResponse(response);

  yield* readStreamResponse(response);
}

/**
 * Stream a concept understanding assessment from Nova Lite via /api/ai/concept.
 * Yields text chunks as they arrive. The final chunk may contain assessment JSON.
 *
 * @param params.topicId - Current topic identifier
 * @param params.message - The learner's explanation message
 * @param params.sessionMessages - All messages in the concept chat session
 * @yields Text chunks from the AI assessment response
 * @throws AIServiceError on timeout, rate limiting, or server errors
 */
export async function* assessConceptUnderstanding(params: {
  topicId: string;
  message: string;
  sessionMessages: ChatMessage[];
}): AsyncGenerator<string> {
  const response = await fetchWithTimeout('/api/ai/concept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topicId: params.topicId,
      message: params.message,
      sessionMessages: params.sessionMessages,
    }),
  });

  handleErrorResponse(response);

  yield* readStreamResponse(response);
}

/**
 * Submit an architecture diagram for AI review via Nova Pro.
 * Returns a structured rubric-scored review.
 *
 * @param params.taskId - The diagram task or capstone challenge ID
 * @param params.components - All components placed on the canvas
 * @param params.connections - All connections between components
 * @returns Structured architecture review with per-category scores
 * @throws AIServiceError on timeout, rate limiting, invalid response, or server errors
 */
export async function reviewArchitecture(params: {
  taskId: string;
  components: DiagramSubmissionComponent[];
  connections: DiagramSubmissionConnection[];
}): Promise<ArchitectureReview> {
  const response = await fetchWithTimeout('/api/ai/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taskId: params.taskId,
      components: params.components,
      connections: params.connections,
    }),
  });

  handleErrorResponse(response);

  const data: unknown = await response.json();

  if (!isValidArchitectureReview(data)) {
    throw new AIServiceError(
      'The AI returned an unexpected response format. Please try again.',
      500
    );
  }

  return data;
}

// --- Internal helpers ---

/** Timeout duration for fetch requests (10 seconds) */
const FETCH_TIMEOUT_MS = 10_000;

/**
 * Fetch with an AbortController timeout.
 * Throws AIServiceError if the request times out.
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AIServiceError(
        'The AI is taking too long to respond. Please try again in a moment.',
        408
      );
    }
    throw new AIServiceError(
      'Unable to reach the AI service. Please check your connection and try again.',
      503
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Handle non-OK HTTP responses by throwing appropriate AIServiceError.
 */
function handleErrorResponse(response: Response): void {
  if (response.ok) {
    return;
  }

  if (response.status === 429) {
    const retryAfter = parseInt(
      response.headers.get('retry-after') ?? '30',
      10
    );
    throw new AIServiceError(
      'Too many requests. Please wait a moment before trying again.',
      429,
      retryAfter
    );
  }

  if (response.status >= 500) {
    throw new AIServiceError(
      'The AI service encountered an error. Please try again.',
      response.status
    );
  }

  throw new AIServiceError(
    'An unexpected error occurred. Please try again.',
    response.status
  );
}

/**
 * Read a streaming response body and yield text chunks.
 * Handles ReadableStream from the fetch response.
 */
async function* readStreamResponse(
  response: Response
): AsyncGenerator<string> {
  const body = response.body;
  if (!body) {
    throw new AIServiceError('No response body received from AI service.', 500);
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const text = decoder.decode(value, { stream: true });
      if (text) {
        yield text;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Type guard to validate an ArchitectureReview response shape.
 */
function isValidArchitectureReview(data: unknown): data is ArchitectureReview {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const review = data as Record<string, unknown>;

  if (typeof review.overallScore !== 'number') return false;
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
    if (typeof cs.weight !== 'number') return false;
    if (typeof cs.feedback !== 'string') return false;
  }

  return true;
}
