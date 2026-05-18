'use client';

/**
 * TopicConversation — Pure conversation-based topic page.
 * No tabs. AI opens with the first question immediately on load.
 * Messages: AI questions (left-aligned, grey), user answers (right-aligned, blue).
 * After AI assesses: shows ✅ or ❌ with 1-2 sentence feedback inline.
 * Progress counter: ✓ X / 3 always visible above the input.
 * After 3 passes: [→ Next Topic] button replaces [↻ Next question].
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Send, RotateCcw, ArrowRight } from 'lucide-react';

import { QuickReference } from '@/components/topic/QuickReference';
import { VoiceInput } from '@/components/input/VoiceInput';
import { announceToScreenReader } from '@/lib/accessibility';
import { streamTutorResponse, AIServiceError } from '@/services/ai-service';
import { useProgressStore } from '@/stores/progress-store';
import type { TopicContent, QAQuestion, ProgressionConfig, ChatMessage } from '@/types';

/** Props for the TopicConversation component */
export interface TopicConversationProps {
  /** The full topic content */
  topic: TopicContent;
  /** Q&A questions for this topic */
  qaQuestions: QAQuestion[];
  /** The progression config for navigation */
  progression: ProgressionConfig;
}

/** A single message in the conversation */
interface ConversationMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  /** For AI assessment messages */
  assessment?: {
    passed: boolean;
    feedback: string;
  };
}

/**
 * TopicConversation — Main topic page component.
 * Full-height conversation view that fills the right panel.
 */
export function TopicConversation({ topic, qaQuestions, progression }: TopicConversationProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAssessing, setIsAssessing] = useState(false);
  const [passCount, setPassCount] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const completeMiniQuiz = useProgressStore((s) => s.completeMiniQuiz);

  const isComplete = passCount >= 3;
  const currentQuestion = qaQuestions[currentQuestionIndex] ?? null;

  /** Compute navigation: prev/next topic and position */
  const navigation = useMemo(() => {
    const allTopicIds: string[] = progression.sections.flatMap((section) =>
      section.clusters.flatMap((cluster) => cluster.topicIds)
    );
    const currentIndex = allTopicIds.indexOf(topic.id);
    const total = allTopicIds.length;
    const position = currentIndex + 1;
    const prevId = currentIndex > 0 ? allTopicIds[currentIndex - 1] : null;
    const nextId = currentIndex < total - 1 ? allTopicIds[currentIndex + 1] : null;
    return { prevId, nextId, position, total };
  }, [topic.id, progression]);

  /** Initialize conversation with first question on mount */
  useEffect(() => {
    if (!initialized && qaQuestions.length > 0) {
      const firstQuestion = qaQuestions[0];
      setMessages([
        {
          id: `ai-q-${firstQuestion.id}`,
          role: 'ai',
          content: firstQuestion.question,
        },
      ]);
      setInitialized(true);
    }
  }, [initialized, qaQuestions]);

  /** Autofocus input on load and after assessment */
  useEffect(() => {
    if (!isComplete && !isAssessing) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isComplete, isAssessing, messages.length]);

  /** Scroll to bottom when messages change */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /** Mark topic complete when 3 passes achieved */
  useEffect(() => {
    if (isComplete) {
      completeMiniQuiz(topic.id);
      announceToScreenReader('Congratulations! You have passed this topic.', 'assertive');
    }
  }, [isComplete, completeMiniQuiz, topic.id]);

  /**
   * Submit the answer for AI assessment.
   */
  const handleSubmit = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isAssessing || !currentQuestion) return;

    setError(null);
    setIsAssessing(true);

    // Add user message to conversation
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: trimmed },
    ]);
    setInputValue('');

    try {
      const assessmentPrompt = `You are assessing a learner's understanding of "${topic.title}".

Question: "${currentQuestion.question}"
Type: ${currentQuestion.type}
Key concepts that should be covered: ${currentQuestion.keyConcepts.join(', ')}
Pass criteria: ${currentQuestion.passCriteria}

Learner's answer: "${trimmed}"

Assess whether the learner demonstrates sufficient understanding. Respond in EXACTLY this format:
VERDICT: PASS or FAIL
FEEDBACK: 1-2 sentences explaining why they passed or what they missed.

Be fair but rigorous. The learner must demonstrate understanding of the key concepts, not just repeat keywords.`;

      const chatHistory: ChatMessage[] = [];
      let fullResponse = '';

      const stream = streamTutorResponse({
        topicId: topic.id,
        message: assessmentPrompt,
        chatHistory,
      });

      for await (const chunk of stream) {
        fullResponse += chunk;
      }

      // Parse the AI response
      const verdictMatch = fullResponse.match(/VERDICT:\s*(PASS|FAIL)/i);
      const feedbackMatch = fullResponse.match(/FEEDBACK:\s*([\s\S]+)/i);

      const passed = verdictMatch ? verdictMatch[1].toUpperCase() === 'PASS' : false;
      const feedback = feedbackMatch
        ? feedbackMatch[1].trim()
        : passed
          ? 'Good understanding demonstrated.'
          : 'Your answer needs more detail on the key concepts.';

      if (passed) {
        setPassCount((prev) => prev + 1);
      }

      // Add AI assessment message
      const assessMsgId = `ai-assess-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assessMsgId,
          role: 'ai',
          content: feedback,
          assessment: { passed, feedback },
        },
      ]);

      announceToScreenReader(
        passed ? `Pass. ${feedback}` : `Not quite. ${feedback}`,
        'polite'
      );
    } catch (err) {
      if (err instanceof AIServiceError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsAssessing(false);
    }
  }, [inputValue, isAssessing, currentQuestion, topic.id, topic.title]);

  /**
   * Move to the next question and add it to the conversation.
   */
  const handleNextQuestion = useCallback(() => {
    if (qaQuestions.length === 0) return;

    const nextIndex = (currentQuestionIndex + 1) % qaQuestions.length;
    setCurrentQuestionIndex(nextIndex);
    setError(null);

    const nextQuestion = qaQuestions[nextIndex];
    setMessages((prev) => [
      ...prev,
      {
        id: `ai-q-${nextQuestion.id}-${Date.now()}`,
        role: 'ai',
        content: nextQuestion.question,
      },
    ]);
  }, [currentQuestionIndex, qaQuestions]);

  /**
   * Handle keyboard: Enter to submit (without shift).
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // No questions available
  if (qaQuestions.length === 0) {
    return (
      <div className="flex flex-col h-[100vh]">
        <TopicHeader topic={topic} navigation={navigation} />
        <div className="flex items-center justify-center flex-1">
          <p className="text-sm text-muted-foreground">No questions available for this topic yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100vh]">
      {/* Header: Topic title + navigation arrows */}
      <TopicHeader topic={topic} navigation={navigation} />

      {/* Quick Reference — collapsed by default */}
      <QuickReference topic={topic} />

      {/* Conversation area — fills remaining space */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Loading indicator while assessing */}
          {isAssessing && (
            <div className="flex items-start gap-3">
              <span className="text-lg shrink-0" aria-hidden="true">🤖</span>
              <div className="rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2.5">
                <span className="text-sm text-muted-foreground animate-pulse">
                  Assessing your answer...
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom bar: progress + action + input */}
      <div className="border-t border-border px-6 py-3 shrink-0">
        <div className="max-w-2xl mx-auto">
          {/* Progress counter + action button */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              ✓ {passCount} / 3
            </span>

            {isComplete ? (
              navigation.nextId ? (
                <Link
                  href={`/topics/${navigation.nextId}`}
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  Next Topic
                </Link>
              ) : (
                <span className="text-sm text-green-400 font-medium">All topics complete!</span>
              )
            ) : (
              <button
                onClick={handleNextQuestion}
                disabled={isAssessing}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                type="button"
                aria-label="Skip to next question"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Next question
              </button>
            )}
          </div>

          {/* Input area */}
          {!isComplete && (
            <div className="flex items-end gap-2">
              <VoiceInput
                onTranscript={(text) =>
                  setInputValue((prev) => (prev ? prev + ' ' + text : text))
                }
              />
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isAssessing}
                placeholder="Type or hold ⌘ to speak..."
                className="flex-1 resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                rows={2}
                aria-label="Type your answer"
                autoFocus
              />
              <button
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isAssessing}
                className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                aria-label="Submit answer"
                title="Submit answer"
                type="button"
              >
                {isAssessing ? (
                  <span className="inline-flex items-center">
                    <span className="animate-pulse">●</span>
                  </span>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          )}

          {/* Completion state */}
          {isComplete && (
            <div className="flex items-center gap-2 text-sm text-green-400 py-2">
              <span>✅</span>
              <span>Topic complete! You demonstrated solid understanding of {topic.title}.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Navigation info for the header */
interface NavigationInfo {
  prevId: string | null;
  nextId: string | null;
  position: number;
  total: number;
}

/** Topic header with title and navigation arrows */
function TopicHeader({ topic, navigation }: { topic: TopicContent; navigation: NavigationInfo }) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
      <h1 className="text-xl font-bold text-foreground truncate">
        {topic.title}
      </h1>
      <div className="flex items-center gap-2 shrink-0">
        {navigation.prevId ? (
          <Link
            href={`/topics/${navigation.prevId}`}
            className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Previous topic"
            title="Previous topic"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        ) : (
          <span className="rounded p-1 text-zinc-700 cursor-not-allowed" aria-hidden="true">
            <ChevronLeft className="h-5 w-5" />
          </span>
        )}
        <span className="text-sm text-muted-foreground tabular-nums">
          {navigation.position} / {navigation.total}
        </span>
        {navigation.nextId ? (
          <Link
            href={`/topics/${navigation.nextId}`}
            className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Next topic"
            title="Next topic"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        ) : (
          <span className="rounded p-1 text-zinc-700 cursor-not-allowed" aria-hidden="true">
            <ChevronRight className="h-5 w-5" />
          </span>
        )}
      </div>
    </header>
  );
}

/** A single message bubble in the conversation */
function MessageBubble({ message }: { message: ConversationMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-lg bg-blue-600 px-4 py-2.5">
          <p className="text-sm text-white whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // AI message
  if (message.assessment) {
    const { passed, feedback } = message.assessment;
    return (
      <div className="flex items-start gap-3">
        <span className="text-lg shrink-0" aria-hidden="true">🤖</span>
        <div
          className={`rounded-lg border px-4 py-2.5 ${
            passed
              ? 'border-green-500/40 bg-green-500/10'
              : 'border-red-500/40 bg-red-500/10'
          }`}
          role="alert"
        >
          <p className="text-sm text-foreground">
            <span className="font-medium">
              {passed ? '✅' : '❌'}
            </span>{' '}
            {feedback}
          </p>
        </div>
      </div>
    );
  }

  // Regular AI question
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg shrink-0" aria-hidden="true">🤖</span>
      <div className="max-w-[85%] rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2.5">
        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
