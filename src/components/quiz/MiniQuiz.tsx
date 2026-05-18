'use client';

/**
 * MiniQuiz — Interactive pool-based quiz component for topic assessment.
 * Draws questions from a topic's question pool, tracks correct answers,
 * and marks the topic as complete when 3 correct answers are accumulated.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuizStore } from '@/stores/quiz-store';
import { useProgressStore } from '@/stores/progress-store';
import { announceToScreenReader } from '@/lib/accessibility';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { QuizQuestion } from '@/types';

/** Props for the MiniQuiz component */
export interface MiniQuizProps {
  /** The topic ID this quiz belongs to */
  topicId: string;
  /** Pre-loaded quiz questions for this topic (loaded server-side) */
  questions: QuizQuestion[];
}

/** Shuffles an array using Fisher-Yates algorithm */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * MiniQuiz component for topic-level assessment.
 * Displays one question at a time with 4 radio options.
 * Requires 3 correct answers to pass and mark the topic complete.
 */
export function MiniQuiz({ topicId, questions }: MiniQuizProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Quiz store state and actions
  const currentQuestions = useQuizStore((s) => s.currentQuestions);
  const answeredQuestions = useQuizStore((s) => s.answeredQuestions);
  const correctCount = useQuizStore((s) => s.correctCount);
  const currentQuestionIndex = useQuizStore((s) => s.currentQuestionIndex);
  const setQuestions = useQuizStore((s) => s.setQuestions);
  const answerQuestion = useQuizStore((s) => s.answerQuestion);
  const skipQuestion = useQuizStore((s) => s.skipQuestion);
  const resetQuiz = useQuizStore((s) => s.resetQuiz);
  const getCurrentQuestion = useQuizStore((s) => s.getCurrentQuestion);
  const isQuizPassed = useQuizStore((s) => s.isQuizPassed);

  // Progress store
  const topicProgress = useProgressStore((s) => s.topicProgress);
  const completeMiniQuiz = useProgressStore((s) => s.completeMiniQuiz);

  const alreadyCompleted = topicProgress[topicId]?.miniQuizPassed ?? false;

  // Initialize quiz on mount: shuffle questions and load into store
  useEffect(() => {
    if (questions.length > 0 && !alreadyCompleted) {
      const shuffled = shuffleArray(questions);
      setQuestions(shuffled);
      setIsInitialized(true);
    } else {
      setIsInitialized(true);
    }
    return () => {
      resetQuiz();
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentQuestion = getCurrentQuestion();
  const passed = isQuizPassed();

  // Mark topic complete when quiz is passed
  useEffect(() => {
    if (passed && !alreadyCompleted) {
      completeMiniQuiz(topicId);
      announceToScreenReader('Congratulations! You passed the quiz. The next topic is now unlocked.', 'assertive');
    }
  }, [passed, alreadyCompleted, completeMiniQuiz, topicId]);

  // Determine if the last answer was correct/incorrect for feedback
  const lastAnswer = useMemo(() => {
    if (answeredQuestions.length === 0) return null;
    return answeredQuestions[answeredQuestions.length - 1];
  }, [answeredQuestions]);

  // Find the question object for the last answered question (for explanation)
  const lastAnsweredQuestion = useMemo(() => {
    if (!lastAnswer) return null;
    return questions.find((q) => q.id === lastAnswer.questionId) ?? null;
  }, [lastAnswer, questions]);

  /** Handle selecting an option */
  const handleOptionSelect = useCallback((optionId: string) => {
    setSelectedOptionId(optionId);
  }, []);

  /** Handle submitting the selected answer */
  const handleSubmit = useCallback(() => {
    if (!currentQuestion || !selectedOptionId) return;
    answerQuestion(currentQuestion.id, selectedOptionId);
    setHasSubmitted(true);
  }, [currentQuestion, selectedOptionId, answerQuestion]);

  /** Handle advancing to the next question after viewing feedback */
  const handleNext = useCallback(() => {
    setSelectedOptionId(null);
    setHasSubmitted(false);
  }, []);

  /** Handle skipping the current question */
  const handleSkip = useCallback(() => {
    skipQuestion();
    setSelectedOptionId(null);
    setHasSubmitted(false);
  }, [skipQuestion]);

  /** Handle refreshing the quiz with a new random selection */
  const handleRefresh = useCallback(() => {
    const shuffled = shuffleArray(questions);
    setQuestions(shuffled);
    setSelectedOptionId(null);
    setHasSubmitted(false);
  }, [questions, setQuestions]);

  /** Handle keyboard submission with Enter key */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        if (hasSubmitted) {
          handleNext();
        } else if (selectedOptionId) {
          handleSubmit();
        }
      }
    },
    [hasSubmitted, selectedOptionId, handleNext, handleSubmit]
  );

  // --- Render States ---

  // Loading state
  if (!isInitialized) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Loading quiz...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state: no questions available
  if (questions.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Mini-Quiz</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No questions available for this topic yet. Check back later.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Already completed state
  if (alreadyCompleted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mini-Quiz</CardTitle>
            <Badge variant="default" className="bg-green-600 text-white">
              Passed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div
              className="text-4xl mb-4"
              role="img"
              aria-label="Celebration"
            >
              🎉
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Topic Complete!
            </h3>
            <p className="text-muted-foreground">
              You&apos;ve already passed this quiz. The next topic is unlocked.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Quiz passed state (just passed in this session)
  if (passed) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mini-Quiz</CardTitle>
            <Badge variant="default" className="bg-green-600 text-white">
              Passed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div
              className="text-4xl mb-4"
              role="img"
              aria-label="Success"
            >
              ✅
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Congratulations!
            </h3>
            <p className="text-muted-foreground mb-2">
              You answered {correctCount} questions correctly and passed the
              quiz.
            </p>
            <p className="text-sm text-muted-foreground">
              The next topic is now unlocked.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No more questions available (exhausted pool without passing)
  if (!currentQuestion && !hasSubmitted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mini-Quiz</CardTitle>
            <Badge variant="secondary">
              {correctCount} / 3 correct
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              You&apos;ve gone through all available questions. You need{' '}
              {3 - correctCount} more correct answer
              {3 - correctCount !== 1 ? 's' : ''} to pass.
            </p>
            <Button onClick={handleRefresh} aria-label="Restart quiz">
              Try Again with New Selection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Feedback state: show result of last answer before advancing
  if (hasSubmitted && lastAnswer && lastAnsweredQuestion) {
    const isCorrect = lastAnswer.isCorrect;
    const correctOption = lastAnsweredQuestion.options.find(
      (o) => o.id === lastAnsweredQuestion.correctOptionId
    );

    return (
      <Card className="w-full max-w-2xl mx-auto" onKeyDown={handleKeyDown}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Question Feedback</CardTitle>
            <Badge variant="secondary">{correctCount} / 3 correct</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground font-medium">
            {lastAnsweredQuestion.question}
          </p>

          {/* Result indicator */}
          <div
            className={`rounded-md p-4 ${
              isCorrect
                ? 'bg-green-500/10 border border-green-500/30'
                : 'bg-destructive/10 border border-destructive/30'
            }`}
            role="alert"
            aria-live="polite"
          >
            <p
              className={`font-semibold ${
                isCorrect ? 'text-green-500' : 'text-destructive'
              }`}
            >
              {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </p>
            {!isCorrect && correctOption && (
              <p className="text-sm text-muted-foreground mt-1">
                Correct answer: {correctOption.text}
              </p>
            )}
          </div>

          {/* Explanation */}
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm font-medium text-foreground mb-1">
              Explanation
            </p>
            <p className="text-sm text-muted-foreground">
              {lastAnsweredQuestion.explanation}
            </p>
          </div>

          {/* Next button */}
          <div className="flex justify-end">
            <Button
              onClick={handleNext}
              aria-label="Continue to next question"
            >
              {correctCount >= 3 ? 'See Results' : 'Next Question'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active question state
  if (!currentQuestion) return null;

  const questionsRemaining =
    currentQuestions.length - currentQuestionIndex;

  return (
    <Card
      className="w-full max-w-2xl mx-auto"
      onKeyDown={handleKeyDown}
      role="form"
      aria-label="Mini-quiz question"
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Mini-Quiz</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{correctCount} / 3 correct</Badge>
            <Badge variant="outline">
              {questionsRemaining} remaining
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question text */}
        <p className="text-foreground font-medium text-base">
          {currentQuestion.question}
        </p>

        {/* Options */}
        <fieldset className="space-y-3" aria-label="Answer options">
          <legend className="sr-only">Select your answer</legend>
          {currentQuestion.options.map((option) => (
            <label
              key={option.id}
              className={`flex items-center gap-3 rounded-md border p-4 cursor-pointer transition-colors ${
                selectedOptionId === option.id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
              }`}
              htmlFor={`option-${option.id}`}
            >
              <input
                type="radio"
                id={`option-${option.id}`}
                name="quiz-option"
                value={option.id}
                checked={selectedOptionId === option.id}
                onChange={() => handleOptionSelect(option.id)}
                className="h-4 w-4 text-primary focus:ring-primary border-border"
                aria-label={option.text}
              />
              <span className="text-sm text-foreground">{option.text}</span>
            </label>
          ))}
        </fieldset>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkip}
              aria-label="Skip this question"
            >
              Skip
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              aria-label="Restart quiz with new questions"
            >
              Refresh
            </Button>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!selectedOptionId}
            aria-label="Submit answer"
          >
            Submit Answer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
