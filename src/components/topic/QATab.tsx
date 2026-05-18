'use client';

/**
 * QATab — Q&A assessment tab for a topic.
 * Shows one question at a time from the topic's qaQuestions bank.
 * User types a free-text answer (or uses voice input).
 * AI assesses reasoning, gives pass/fail + brief feedback.
 * Need 3 satisfactory answers to unlock Next Topic.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, RotateCcw, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

import { VoiceInput } from '@/components/input/VoiceInput';
import { announceToScreenReader } from '@/lib/accessibility';
import { streamTutorResponse, AIServiceError } from '@/services/ai-service';
import { useProgressStore } from '@/stores/progress-store';
import type { QAQuestion, ChatMessage } from '@/types';

/** Props for the QATab component */
export interface QATabProps {
  /** The current topic ID */
  topicId: string;
  /** The topic title for display */
  topicTitle: string;
  /** Array of Q&A questions for this topic */
  questions: QAQuestion[];
}

/** Result of an AI assessment */
interface AssessmentResult {
  passed: boolean;
  feedback: string;
}

/**
 * QATab — Shows one question at a time, assesses free-text answers via AI.
 * Tracks passes and requires 3 to mark the topic as complete.
 */
export function QATab({ topicId, topicTitle, questions }: QATabProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [passCount, setPassCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [answeredIndices, setAnsweredIndices] = useState<Set<number>>(new Set());

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const completeMiniQuiz = useProgressStore((s) => s.completeMiniQuiz);

  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const isComplete = passCount >= 3;

  /** Focus textarea when question changes */
  useEffect(() => {
    if (!isComplete && !isAssessing) {
      textareaRef.current?.focus();
    }
  }, [currentQuestionIndex, isComplete, isAssessing]);

  /** Mark topic complete when 3 passes achieved */
  useEffect(() => {
    if (isComplete) {
      completeMiniQuiz(topicId);
      announceToScreenReader('Congratulations! You have passed this topic.', 'assertive');
    }
  }, [isComplete, completeMiniQuiz, topicId]);

  /**
   * Submit the answer for AI assessment.
   */
  const handleSubmit = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isAssessing || !currentQuestion) return;

    setError(null);
    setAssessment(null);
    setIsAssessing(true);

    try {
      const assessmentPrompt = `You are assessing a learner's understanding of "${topicTitle}".

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
        topicId,
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

      setAssessment({ passed, feedback });

      if (passed) {
        setPassCount((prev) => prev + 1);
      }

      setAnsweredIndices((prev) => new Set(prev).add(currentQuestionIndex));
    } catch (err) {
      if (err instanceof AIServiceError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsAssessing(false);
    }
  }, [inputValue, isAssessing, currentQuestion, topicId, topicTitle, currentQuestionIndex]);

  /**
   * Move to the next unanswered question.
   */
  const handleNextQuestion = useCallback(() => {
    setAssessment(null);
    setInputValue('');
    setError(null);

    // Find next unanswered question
    let nextIndex = (currentQuestionIndex + 1) % questions.length;
    let attempts = 0;
    while (answeredIndices.has(nextIndex) && attempts < questions.length) {
      nextIndex = (nextIndex + 1) % questions.length;
      attempts++;
    }

    // If all answered, just cycle
    if (attempts >= questions.length) {
      nextIndex = (currentQuestionIndex + 1) % questions.length;
    }

    setCurrentQuestionIndex(nextIndex);
  }, [currentQuestionIndex, questions.length, answeredIndices]);

  /**
   * Skip current question without answering.
   */
  const handleSkip = useCallback(() => {
    setAssessment(null);
    setInputValue('');
    setError(null);
    const nextIndex = (currentQuestionIndex + 1) % questions.length;
    setCurrentQuestionIndex(nextIndex);
  }, [currentQuestionIndex, questions.length]);

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
  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No questions available for this topic yet.</p>
      </div>
    );
  }

  // Topic complete state
  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <CheckCircle2 className="h-12 w-12 text-green-500" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-foreground">Topic Complete!</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          You&apos;ve demonstrated solid understanding of {topicTitle}. Move on to the next topic.
        </p>
        <div className="flex items-center gap-2 text-sm text-green-400">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          <span>✓ {passCount}/{passCount} passed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-6 py-5">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>✓ {passCount}/3 passed</span>
          <span className="text-zinc-600">•</span>
          <span>Q{currentQuestionIndex + 1}/{questions.length}</span>
        </div>
        <button
          onClick={handleSkip}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          type="button"
          aria-label="Skip to next question"
          disabled={isAssessing}
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          Next Q
        </button>
      </div>

      {/* Question */}
      <div className="mb-4 shrink-0">
        <div className="flex items-start gap-2 mb-2">
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/40">
            {currentQuestion?.type ?? 'conceptual'}
          </span>
        </div>
        <p className="text-base text-foreground leading-relaxed">
          {currentQuestion?.question ?? ''}
        </p>
      </div>

      {/* Assessment result */}
      {assessment && (
        <div
          className={`mb-4 shrink-0 rounded-lg border p-3 ${
            assessment.passed
              ? 'border-green-500/40 bg-green-500/10'
              : 'border-red-500/40 bg-red-500/10'
          }`}
          role="alert"
        >
          <div className="flex items-start gap-2">
            {assessment.passed ? (
              <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" aria-hidden="true" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
            )}
            <div>
              <span className={`text-sm font-medium ${assessment.passed ? 'text-green-400' : 'text-red-400'}`}>
                {assessment.passed ? 'Pass' : 'Not quite'}
              </span>
              <p className="text-sm text-foreground/80 mt-1">{assessment.feedback}</p>
            </div>
          </div>
          {assessment && (
            <button
              onClick={handleNextQuestion}
              className="mt-3 flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
              type="button"
            >
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              Next Question
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Input area — pushed to bottom */}
      <div className="mt-auto shrink-0">
        <div className="flex items-end gap-2">
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
            disabled={isAssessing}
            placeholder="Type your answer... (Enter to submit, Shift+Enter for newline)"
            className="flex-1 resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            rows={3}
            aria-label="Type your answer"
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
              <span className="inline-flex items-center gap-0.5">
                <span className="animate-pulse">●</span>
              </span>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Hold ⌘ and click the mic to speak. Need 3 passes to complete this topic.
        </p>
      </div>
    </div>
  );
}
