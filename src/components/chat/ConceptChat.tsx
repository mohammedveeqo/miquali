'use client';

/**
 * ConceptChat — Streaming chat interface for AI-assessed concept understanding.
 * The learner explains a topic in their own words and receives AI feedback.
 * After a maximum of 4 exchanges, the session terminates with pass/fail.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VoiceInput } from '@/components/input/VoiceInput';
import { announceToScreenReader } from '@/lib/accessibility';
import { assessConceptUnderstanding } from '@/services/ai-service';
import { useAIChatStore } from '@/stores/ai-chat-store';
import { useProgressStore } from '@/stores/progress-store';
import type { ChatMessage } from '@/types';

/** Maximum number of learner messages allowed in a concept chat session */
const MAX_EXCHANGES = 4;

/** Props for the ConceptChat component */
export interface ConceptChatProps {
  /** The topic identifier for this concept chat session */
  topicId: string;
}

/**
 * Parse the assessment marker from an AI response.
 * The marker format is: `<!--ASSESSMENT:{"passed": true/false}-->`
 * Returns the passed boolean or null if no marker found.
 */
function parseAssessmentMarker(text: string): boolean | null {
  const regex = /<!--ASSESSMENT:\s*(\{[^}]*\})\s*-->/;
  const match = text.match(regex);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]) as { passed?: boolean };
    if (typeof parsed.passed === 'boolean') {
      return parsed.passed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Strip the assessment marker from visible text so the user doesn't see it.
 */
function stripAssessmentMarker(text: string): string {
  return text.replace(/<!--ASSESSMENT:\s*\{[^}]*\}\s*-->/, '').trim();
}

/**
 * Generate a unique message ID.
 */
function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * ConceptChat component — streaming chat interface for concept understanding assessment.
 * Tracks exchange count (max 4 learner messages), determines pass/fail based on
 * AI assessment response, unlocks Mini-Quiz on pass, and allows retry on fail.
 */
export function ConceptChat({ topicId }: ConceptChatProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [sessionEnded, setSessionEnded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // AI Chat Store
  const messages = useAIChatStore((s) => s.messages);
  const isStreaming = useAIChatStore((s) => s.isStreaming);
  const exchangeCount = useAIChatStore((s) => s.exchangeCount);
  const assessmentResult = useAIChatStore((s) => s.assessmentResult);
  const addMessage = useAIChatStore((s) => s.addMessage);
  const setStreaming = useAIChatStore((s) => s.setStreaming);
  const incrementExchangeCount = useAIChatStore((s) => s.incrementExchangeCount);
  const setAssessmentResult = useAIChatStore((s) => s.setAssessmentResult);
  const resetChat = useAIChatStore((s) => s.resetChat);

  // Progress Store
  const topicProgress = useProgressStore((s) => s.topicProgress);
  const completeConceptChat = useProgressStore((s) => s.completeConceptChat);

  const alreadyPassed = topicProgress[topicId]?.conceptChatPassed ?? false;

  // Format topic name for display
  const topicDisplayName = topicId.replace(/-/g, ' ');

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Reset chat state when component mounts (new session)
  useEffect(() => {
    resetChat();
    setSessionEnded(false);
    setError(null);
    setStreamingContent('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  /**
   * Submit the learner's message and stream the AI response.
   */
  const handleSubmit = useCallback(async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isStreaming || sessionEnded) return;

    // Check exchange limit before submitting
    if (exchangeCount >= MAX_EXCHANGES) {
      setSessionEnded(true);
      return;
    }

    setError(null);
    setInputValue('');

    // Add user message
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);
    incrementExchangeCount();

    const newExchangeCount = exchangeCount + 1;

    // Start streaming
    setStreaming(true);
    setStreamingContent('');

    try {
      const sessionMessages = [...messages, userMessage];
      let fullResponse = '';

      const generator = assessConceptUnderstanding({
        topicId,
        message: trimmedInput,
        sessionMessages,
      });

      for await (const chunk of generator) {
        fullResponse += chunk;
        setStreamingContent(stripAssessmentMarker(fullResponse));
      }

      // Parse assessment from the full response
      const passed = parseAssessmentMarker(fullResponse);
      const visibleContent = stripAssessmentMarker(fullResponse);

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: visibleContent,
        timestamp: new Date().toISOString(),
      };
      addMessage(assistantMessage);
      setStreamingContent('');

      // Handle assessment result
      if (passed === true) {
        setAssessmentResult('pass');
        completeConceptChat(topicId);
        setSessionEnded(true);
        announceToScreenReader('Great job! You demonstrated understanding. The Mini-Quiz is now unlocked.', 'assertive');
      } else if (passed === false) {
        if (newExchangeCount >= MAX_EXCHANGES) {
          setAssessmentResult('fail');
          setSessionEnded(true);
          announceToScreenReader('Session ended. Review the topic and try again.', 'assertive');
        }
        // If not at limit, continue conversation
      } else {
        // No assessment marker — check if at limit
        if (newExchangeCount >= MAX_EXCHANGES) {
          setAssessmentResult('fail');
          setSessionEnded(true);
          announceToScreenReader('Session ended. Review the topic and try again.', 'assertive');
        }
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      setStreamingContent('');
    } finally {
      setStreaming(false);
    }
  }, [
    inputValue,
    isStreaming,
    sessionEnded,
    exchangeCount,
    messages,
    topicId,
    addMessage,
    incrementExchangeCount,
    setStreaming,
    setAssessmentResult,
    completeConceptChat,
  ]);

  /**
   * Handle keyboard events in the textarea.
   * Enter sends the message; Shift+Enter inserts a newline.
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  /**
   * Retry the concept chat session — resets all state.
   */
  const handleRetry = useCallback(() => {
    resetChat();
    setSessionEnded(false);
    setError(null);
    setStreamingContent('');
    setInputValue('');
  }, [resetChat]);

  // If already passed, show passed badge
  if (alreadyPassed) {
    return (
      <Card className="border-green-500/40 bg-green-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-3">
            <span aria-hidden="true">💬</span>
            Concept Chat
            <Badge className="bg-green-600 text-white hover:bg-green-600">
              Passed
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You have demonstrated understanding of{' '}
            <span className="capitalize font-medium text-foreground">
              {topicDisplayName}
            </span>
            . The Mini-Quiz is now unlocked.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span aria-hidden="true">💬</span>
            Concept Chat
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            Exchange {exchangeCount}/{MAX_EXCHANGES}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Chat messages area */}
        <div
          className="flex flex-col gap-3 max-h-96 overflow-y-auto p-3 rounded-lg bg-muted/30"
          role="log"
          aria-label="Concept chat messages"
          aria-live="polite"
        >
          {/* Opening prompt */}
          {messages.length === 0 && !isStreaming && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-3 bg-secondary text-secondary-foreground text-sm">
                <p>
                  Explain{' '}
                  <span className="font-semibold capitalize">
                    {topicDisplayName}
                  </span>{' '}
                  in your own words. What is it, and why is it important in AWS
                  networking?
                </p>
              </div>
            </div>
          )}

          {/* Message history */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Streaming response */}
          {isStreaming && streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-3 bg-secondary text-secondary-foreground text-sm whitespace-pre-wrap">
                {streamingContent}
                <span className="inline-block w-1.5 h-4 bg-foreground/60 animate-pulse ml-0.5 align-text-bottom" />
              </div>
            </div>
          )}

          {/* Loading indicator (streaming started but no content yet) */}
          {isStreaming && !streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-3 bg-secondary text-secondary-foreground text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  />
                </span>
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Assessment result messages */}
        {assessmentResult === 'pass' && (
          <div
            className="rounded-lg border border-green-500/40 bg-green-500/10 p-4"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-sm font-medium text-green-400">
              ✓ Great job! You have demonstrated understanding of this concept.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              The Mini-Quiz is now unlocked.
            </p>
          </div>
        )}

        {assessmentResult === 'fail' && sessionEnded && (
          <div
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-4"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-sm font-medium text-destructive">
              Review the topic and try again.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You have used all {MAX_EXCHANGES} exchanges. Take another look at
              the topic content, then retry.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleRetry}
              aria-label="Retry concept chat"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-4"
            role="alert"
          >
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Input area */}
        {!sessionEnded && (
          <div className="flex gap-2 items-end">
            <VoiceInput
              onTranscript={(text) =>
                setInputValue((prev) => (prev ? prev + ' ' + text : text))
              }
            />
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Explain the concept in your own words..."
              disabled={isStreaming}
              rows={2}
              className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Your message"
            />
            <Button
              onClick={handleSubmit}
              disabled={isStreaming || !inputValue.trim()}
              size="sm"
              className="h-10 px-4"
              aria-label="Send message"
            >
              {isStreaming ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  Sending
                </span>
              ) : (
                'Send'
              )}
            </Button>
          </div>
        )}

        {/* Keyboard hint */}
        {!sessionEnded && !isStreaming && (
          <p className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for a new line.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
