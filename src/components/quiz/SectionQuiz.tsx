'use client';

/**
 * SectionQuiz — Comprehensive 20-question assessment for the Networking section.
 * Requires 70% (14/20) to pass and unlock capstone challenges.
 * Identifies weak topic areas on failure and allows retake.
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useProgressStore } from '@/stores/progress-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { QuizQuestion } from '@/types';

/** Props for the SectionQuiz component */
export interface SectionQuizProps {
  /** 20 questions loaded server-side covering the entire Networking section */
  questions: QuizQuestion[];
}

/** Tracks a single answered question with its topic */
interface SectionQuizAnswer {
  questionId: string;
  topicId: string;
  selectedOptionId: string;
  isCorrect: boolean;
}

/** Weak topic identified from wrong answers */
interface WeakTopic {
  topicId: string;
  wrongCount: number;
}

/** Passing threshold: 14 out of 20 (70%) */
const PASSING_SCORE = 14;
/** Total questions in the section quiz */
const TOTAL_QUESTIONS = 20;

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
 * Identifies weak topics from wrong answers.
 * A topic is "weak" if the learner got 2 or more questions wrong for that topic.
 */
function identifyWeakTopics(answers: SectionQuizAnswer[]): WeakTopic[] {
  const wrongByTopic: Record<string, number> = {};

  for (const answer of answers) {
    if (!answer.isCorrect) {
      wrongByTopic[answer.topicId] = (wrongByTopic[answer.topicId] ?? 0) + 1;
    }
  }

  const weakTopics: WeakTopic[] = [];
  for (const [topicId, wrongCount] of Object.entries(wrongByTopic)) {
    if (wrongCount >= 2) {
      weakTopics.push({ topicId, wrongCount });
    }
  }

  // Sort by wrong count descending
  weakTopics.sort((a, b) => b.wrongCount - a.wrongCount);
  return weakTopics;
}

/**
 * Formats a topicId into a human-readable label.
 * Converts kebab-case to Title Case (e.g., "nat-gateway" → "NAT Gateway").
 */
function formatTopicLabel(topicId: string): string {
  return topicId
    .split('-')
    .map((word) => {
      // Keep common acronyms uppercase
      const acronyms = ['vpc', 'nat', 'igw', 'acl', 'dns', 'elb', 'alb', 'nlb', 'vpn', 'aws'];
      if (acronyms.includes(word.toLowerCase())) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * SectionQuiz component presenting 20 questions one at a time.
 * Shows progress bar, immediate feedback per question, and a final score card.
 */
export function SectionQuiz({ questions }: SectionQuizProps) {
  // Shuffled questions for this attempt
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>([]);
  // Current question index (0-based)
  const [currentIndex, setCurrentIndex] = useState(0);
  // All answers recorded
  const [answers, setAnswers] = useState<SectionQuizAnswer[]>([]);
  // Currently selected option for the active question
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  // Whether the current question has been submitted (showing feedback)
  const [showingFeedback, setShowingFeedback] = useState(false);
  // Whether the quiz is complete (all 20 answered)
  const [quizComplete, setQuizComplete] = useState(false);
  // Whether the component has initialized
  const [isInitialized, setIsInitialized] = useState(false);

  // Progress store
  const completeSectionQuiz = useProgressStore((s) => s.completeSectionQuiz);
  const sectionQuizAttempts = useProgressStore((s) => s.sectionQuizAttempts);

  // Check if already passed in a previous attempt
  const alreadyPassed = useMemo(
    () => sectionQuizAttempts.some((attempt) => attempt.passed),
    [sectionQuizAttempts]
  );

  // Initialize: shuffle questions on mount
  useEffect(() => {
    if (questions.length > 0) {
      const shuffled = shuffleArray(questions).slice(0, TOTAL_QUESTIONS);
      setShuffledQuestions(shuffled);
    }
    setIsInitialized(true);
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Computed values
  const score = useMemo(
    () => answers.filter((a) => a.isCorrect).length,
    [answers]
  );

  const passed = score >= PASSING_SCORE;

  const weakTopics = useMemo(
    () => (quizComplete ? identifyWeakTopics(answers) : []),
    [quizComplete, answers]
  );

  const currentQuestion = shuffledQuestions[currentIndex] ?? null;

  // Last answer for feedback display
  const lastAnswer = useMemo(() => {
    if (answers.length === 0) return null;
    return answers[answers.length - 1];
  }, [answers]);

  const lastAnsweredQuestion = useMemo(() => {
    if (!lastAnswer) return null;
    return shuffledQuestions.find((q) => q.id === lastAnswer.questionId) ?? null;
  }, [lastAnswer, shuffledQuestions]);

  /** Handle selecting an answer option */
  const handleOptionSelect = useCallback((optionId: string) => {
    setSelectedOptionId(optionId);
  }, []);

  /** Handle submitting the selected answer */
  const handleSubmit = useCallback(() => {
    if (!currentQuestion || !selectedOptionId) return;

    const isCorrect = selectedOptionId === currentQuestion.correctOptionId;

    const newAnswer: SectionQuizAnswer = {
      questionId: currentQuestion.id,
      topicId: currentQuestion.topicId,
      selectedOptionId,
      isCorrect,
    };

    setAnswers((prev) => [...prev, newAnswer]);
    setShowingFeedback(true);
  }, [currentQuestion, selectedOptionId]);

  /** Handle advancing to the next question or completing the quiz */
  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;

    if (nextIndex >= shuffledQuestions.length) {
      // Quiz complete — calculate final score and record
      const finalAnswers = [...answers];
      const finalScore = finalAnswers.filter((a) => a.isCorrect).length;
      const weakAreas = identifyWeakTopics(finalAnswers).map((w) => w.topicId);
      completeSectionQuiz(finalScore, weakAreas);
      setQuizComplete(true);
    } else {
      setCurrentIndex(nextIndex);
    }

    setSelectedOptionId(null);
    setShowingFeedback(false);
  }, [currentIndex, shuffledQuestions.length, answers, completeSectionQuiz]);

  /** Handle retaking the quiz after failure */
  const handleRetake = useCallback(() => {
    const shuffled = shuffleArray(questions).slice(0, TOTAL_QUESTIONS);
    setShuffledQuestions(shuffled);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedOptionId(null);
    setShowingFeedback(false);
    setQuizComplete(false);
  }, [questions]);

  /** Handle keyboard interactions */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        if (showingFeedback) {
          handleNext();
        } else if (selectedOptionId) {
          handleSubmit();
        }
      }
    },
    [showingFeedback, selectedOptionId, handleNext, handleSubmit]
  );

  // --- Render States ---

  // Loading state
  if (!isInitialized) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Loading section quiz...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state: no questions available
  if (questions.length === 0) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Section Quiz — Networking</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No section quiz questions available yet. Complete all topics and
            diagram tasks to unlock the section quiz.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Already passed state
  if (alreadyPassed && !quizComplete) {
    const bestAttempt = sectionQuizAttempts
      .filter((a) => a.passed)
      .sort((a, b) => b.score - a.score)[0];

    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Section Quiz — Networking</CardTitle>
            <Badge variant="default" className="bg-green-600 text-white">
              Passed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-4" role="img" aria-label="Trophy">
              🏆
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Section Complete!
            </h3>
            <p className="text-muted-foreground mb-2">
              You passed with a score of {bestAttempt?.score ?? 0}/
              {TOTAL_QUESTIONS}.
            </p>
            <p className="text-sm text-muted-foreground">
              Capstone architecture challenges are now unlocked.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Quiz complete — show score card
  if (quizComplete) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Section Quiz — Results</CardTitle>
            <Badge
              variant={passed ? 'default' : 'destructive'}
              className={passed ? 'bg-green-600 text-white' : ''}
            >
              {passed ? 'Passed' : 'Not Passed'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score display */}
          <div className="text-center py-4">
            <div
              className="text-4xl mb-4"
              role="img"
              aria-label={passed ? 'Celebration' : 'Study more'}
            >
              {passed ? '🎉' : '📚'}
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {score} / {TOTAL_QUESTIONS}
            </h3>
            <p className="text-muted-foreground">
              {passed
                ? 'Congratulations! You passed the section quiz.'
                : `You need ${PASSING_SCORE} correct answers to pass. Keep studying!`}
            </p>
          </div>

          {/* Progress bar showing score */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Score</span>
              <span>
                {Math.round((score / TOTAL_QUESTIONS) * 100)}% (need 70%)
              </span>
            </div>
            <Progress value={score} max={TOTAL_QUESTIONS} />
          </div>

          {/* Pass: capstone unlock message */}
          {passed && (
            <div className="rounded-md bg-green-500/10 border border-green-500/30 p-4">
              <p className="text-sm font-medium text-green-500">
                🔓 Capstone Challenges Unlocked
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                You can now access the capstone architecture challenges to
                demonstrate your mastery of the Networking section.
              </p>
            </div>
          )}

          {/* Fail: weak area identification */}
          {!passed && weakTopics.length > 0 && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-4 space-y-3">
              <p className="text-sm font-medium text-destructive">
                Weak Areas Identified
              </p>
              <p className="text-sm text-muted-foreground">
                Focus on these topics before retaking the quiz:
              </p>
              <div className="flex flex-wrap gap-2">
                {weakTopics.map((weak) => (
                  <Badge
                    key={weak.topicId}
                    variant="outline"
                    className="border-destructive/50 text-destructive"
                  >
                    {formatTopicLabel(weak.topicId)} ({weak.wrongCount} wrong)
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Fail: retake button */}
          {!passed && (
            <div className="flex justify-center pt-2">
              <Button onClick={handleRetake} size="lg" aria-label="Retake quiz">
                Retake Quiz
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Feedback state: show result of last answer
  if (showingFeedback && lastAnswer && lastAnsweredQuestion) {
    const isCorrect = lastAnswer.isCorrect;
    const correctOption = lastAnsweredQuestion.options.find(
      (o) => o.id === lastAnsweredQuestion.correctOptionId
    );

    return (
      <Card className="w-full max-w-3xl mx-auto" onKeyDown={handleKeyDown}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Question Feedback</CardTitle>
            <Badge variant="secondary">
              {score} / {answers.length} correct
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                Question {answers.length} of {TOTAL_QUESTIONS}
              </span>
              <span>
                {Math.round((answers.length / TOTAL_QUESTIONS) * 100)}%
              </span>
            </div>
            <Progress value={answers.length} max={TOTAL_QUESTIONS} />
          </div>

          {/* Question text */}
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
              aria-label={
                answers.length >= TOTAL_QUESTIONS
                  ? 'See results'
                  : 'Continue to next question'
              }
            >
              {answers.length >= TOTAL_QUESTIONS ? 'See Results' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active question state
  if (!currentQuestion) return null;

  return (
    <Card
      className="w-full max-w-3xl mx-auto"
      onKeyDown={handleKeyDown}
      role="form"
      aria-label="Section quiz question"
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Section Quiz — Networking</CardTitle>
          <Badge variant="secondary">
            {score} / {answers.length} correct
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Question {currentIndex + 1} of {TOTAL_QUESTIONS}
            </span>
            <span>
              {Math.round((currentIndex / TOTAL_QUESTIONS) * 100)}% complete
            </span>
          </div>
          <Progress value={currentIndex} max={TOTAL_QUESTIONS} />
        </div>

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
              htmlFor={`section-quiz-option-${option.id}`}
            >
              <input
                type="radio"
                id={`section-quiz-option-${option.id}`}
                name="section-quiz-option"
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

        {/* Submit button */}
        <div className="flex justify-end pt-2">
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
