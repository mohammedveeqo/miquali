'use client';

/**
 * ProgressDashboard — Landing page component displaying overall learner progress.
 *
 * Sections:
 * 1. Header with study streak badge
 * 2. Daily Review Queue (weak topics + review-again flashcards)
 * 3. Topic Progress grid (18 topics with read/chat/quiz checkmarks)
 * 4. Diagram Tasks (8 tasks with submitted/pending status)
 * 5. Section Quiz (pass/fail with best score)
 * 6. Capstone Challenges (5 challenges with submitted/pending status)
 *
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5
 */

import React from 'react';
import Link from 'next/link';
import { useProgressStore } from '@/stores/progress-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { ProgressionConfig } from '@/types';
import progressionData from '@/content/progression.json';

/** Static progression config loaded from JSON */
const config: ProgressionConfig = progressionData as ProgressionConfig;

/** All topic IDs in order from the progression config */
const ALL_TOPIC_IDS: string[] = config.sections.flatMap((section) =>
  section.clusters.flatMap((cluster) => cluster.topicIds)
);

/** All diagram task IDs in order */
const ALL_DIAGRAM_TASK_IDS: string[] = config.sections.flatMap((section) =>
  section.clusters.map((cluster) => cluster.diagramTaskId)
);

/** All capstone challenge IDs */
const ALL_CAPSTONE_IDS: string[] = config.sections.flatMap(
  (section) => section.capstoneIds
);

/** Format a topic ID into a readable title (e.g., "what-is-vpc" → "What Is Vpc") */
function formatTopicTitle(topicId: string): string {
  return topicId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * ProgressDashboard component — the main landing page for QualCheck.
 * Reads all progress data from the Zustand store and displays:
 * - Study streak
 * - Daily review queue
 * - Topic completion grid
 * - Diagram task status
 * - Section quiz status
 * - Capstone challenge status
 */
export function ProgressDashboard() {
  const topicProgress = useProgressStore((state) => state.topicProgress);
  const diagramTaskProgress = useProgressStore(
    (state) => state.diagramTaskProgress
  );
  const sectionQuizAttempts = useProgressStore(
    (state) => state.sectionQuizAttempts
  );
  const capstoneProgress = useProgressStore((state) => state.capstoneProgress);
  const studyStreak = useProgressStore((state) => state.studyStreak);
  const getWeakAreas = useProgressStore((state) => state.getWeakAreas);
  const getDailyReviewQueue = useProgressStore(
    (state) => state.getDailyReviewQueue
  );

  const flashcardProgress = useProgressStore((state) => state.flashcardProgress);
  const lastActivityDate = useProgressStore((state) => state.lastActivityDate);

  const weakAreas = getWeakAreas();
  const dailyReview = getDailyReviewQueue();

  // Calculate overall topic completion
  const completedTopics = ALL_TOPIC_IDS.filter(
    (id) => topicProgress[id]?.miniQuizPassed
  ).length;
  const totalTopics = ALL_TOPIC_IDS.length;
  const overallProgress = Math.round((completedTopics / totalTopics) * 100);

  // Diagram task completion
  const completedDiagrams = ALL_DIAGRAM_TASK_IDS.filter(
    (id) => diagramTaskProgress[id]?.submitted
  ).length;

  // Section quiz best score
  const bestQuizAttempt = sectionQuizAttempts.reduce<{
    score: number;
    passed: boolean;
  } | null>((best, attempt) => {
    if (!best || attempt.score > best.score) {
      return { score: attempt.score, passed: attempt.passed };
    }
    return best;
  }, null);

  // Capstone completion
  const completedCapstones = ALL_CAPSTONE_IDS.filter(
    (id) => capstoneProgress[id]?.submitted
  ).length;

  // Determine if user is brand new (no progress at all)
  const isNewUser =
    completedTopics === 0 &&
    completedDiagrams === 0 &&
    sectionQuizAttempts.length === 0 &&
    completedCapstones === 0;

  // Check if there are any review items
  const hasReviewItems =
    dailyReview.flashcardIds.length > 0 || dailyReview.topicIds.length > 0;

  return (
    <main className="min-h-screen p-6 md:p-8 lg:p-12">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            QualCheck
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AWS SAP-C02 — Networking Section
          </p>
        </div>
        <Badge
          variant="secondary"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
          aria-label={`Study streak: ${studyStreak.currentStreak} days`}
        >
          <span role="img" aria-hidden="true">
            🔥
          </span>
          <span>{studyStreak.currentStreak} day{studyStreak.currentStreak !== 1 ? 's' : ''}</span>
        </Badge>
      </header>

      {/* Empty state for new users */}
      {isNewUser && (
        <Card className="mb-8 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <p className="text-center text-lg text-muted-foreground">
              Welcome to QualCheck! Start your AWS networking journey.
            </p>
            <Button asChild>
              <Link href="/topics/what-is-vpc">Start with Networking →</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Overall Progress Bar */}
      {!isNewUser && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium text-foreground">
                {completedTopics}/{totalTopics} topics
              </span>
            </div>
            <Progress value={overallProgress} aria-label="Overall topic completion progress" />
          </CardContent>
        </Card>
      )}

      {/* Daily Review Queue */}
      {hasReviewItems && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Daily Review Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailyReview.topicIds.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    Weak Areas — Review These Topics
                  </p>
                  <ul className="space-y-2" aria-label="Weak area topics for review">
                    {dailyReview.topicIds.map((topicId) => (
                      <li key={topicId}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          asChild
                        >
                          <Link href={`/topics/${topicId}`}>
                            <span className="mr-2" role="img" aria-hidden="true">
                              📖
                            </span>
                            {formatTopicTitle(topicId)}
                            <Badge variant="destructive" className="ml-auto text-xs">
                              {topicProgress[topicId]?.miniQuizAttempts ?? 0} attempts
                            </Badge>
                          </Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {dailyReview.flashcardIds.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    Flashcards — Marked for Review
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/flashcards">
                      <span className="mr-2" role="img" aria-hidden="true">
                        🃏
                      </span>
                      Review {dailyReview.flashcardIds.length} flashcard
                      {dailyReview.flashcardIds.length !== 1 ? 's' : ''}
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topic Progress Grid */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Topic Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_TOPIC_IDS.map((topicId) => {
              const progress = topicProgress[topicId];
              const isComplete = progress?.miniQuizPassed === true;
              return (
                <div
                  key={topicId}
                  className={`flex items-center justify-between rounded-md border p-3 ${
                    isComplete
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-border'
                  }`}
                >
                  <Link
                    href={`/topics/${topicId}`}
                    className="truncate text-sm font-medium text-foreground hover:underline"
                    title={formatTopicTitle(topicId)}
                  >
                    {formatTopicTitle(topicId)}
                  </Link>
                  <div className="ml-2 flex shrink-0 items-center gap-1">
                    <span
                      title="Read"
                      aria-label={`Read: ${progress?.readComplete ? 'complete' : 'incomplete'}`}
                      className={`text-xs ${
                        progress?.readComplete
                          ? 'text-green-500'
                          : 'text-muted-foreground/40'
                      }`}
                    >
                      ✓R
                    </span>
                    <span
                      title="Concept Chat"
                      aria-label={`Concept chat: ${progress?.conceptChatPassed ? 'passed' : 'incomplete'}`}
                      className={`text-xs ${
                        progress?.conceptChatPassed
                          ? 'text-green-500'
                          : 'text-muted-foreground/40'
                      }`}
                    >
                      ✓C
                    </span>
                    <span
                      title="Mini Quiz"
                      aria-label={`Mini quiz: ${progress?.miniQuizPassed ? 'passed' : 'incomplete'}`}
                      className={`text-xs ${
                        progress?.miniQuizPassed
                          ? 'text-green-500'
                          : 'text-muted-foreground/40'
                      }`}
                    >
                      ✓Q
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Diagram Tasks */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Diagram Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ALL_DIAGRAM_TASK_IDS.map((taskId, index) => {
              const isSubmitted =
                diagramTaskProgress[taskId]?.submitted === true;
              return (
                <div
                  key={taskId}
                  className={`flex items-center justify-between rounded-md border p-3 ${
                    isSubmitted
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-border'
                  }`}
                >
                  <span className="text-sm font-medium text-foreground">
                    Task {index + 1}
                  </span>
                  <Badge
                    variant={isSubmitted ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {isSubmitted ? 'Submitted' : 'Pending'}
                  </Badge>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {completedDiagrams}/{ALL_DIAGRAM_TASK_IDS.length} completed
          </p>
        </CardContent>
      </Card>

      {/* Section Quiz */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Section Quiz</CardTitle>
        </CardHeader>
        <CardContent>
          {sectionQuizAttempts.length === 0 ? (
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">Ready</Badge>
              <Button asChild size="sm" variant="outline">
                <Link href="/section-quiz">Take Section Quiz</Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Badge
                variant={bestQuizAttempt?.passed ? 'default' : 'destructive'}
                className="text-sm"
              >
                {bestQuizAttempt?.passed ? 'Passed' : 'Not Passed'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Best score: {bestQuizAttempt?.score}/20 (
                {Math.round(((bestQuizAttempt?.score ?? 0) / 20) * 100)}%)
              </span>
              <span className="text-xs text-muted-foreground">
                {sectionQuizAttempts.length} attempt
                {sectionQuizAttempts.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Capstone Challenges */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Capstone Challenges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {ALL_CAPSTONE_IDS.map((challengeId, index) => {
              const isSubmitted =
                capstoneProgress[challengeId]?.submitted === true;
              const score = capstoneProgress[challengeId]?.score;
              return (
                <div
                  key={challengeId}
                  className={`flex flex-col items-center rounded-md border p-3 ${
                    isSubmitted
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-border'
                  }`}
                >
                  <span className="text-sm font-medium text-foreground">
                    Challenge {index + 1}
                  </span>
                  <Badge
                    variant={isSubmitted ? 'default' : 'outline'}
                    className="mt-2 text-xs"
                  >
                    {isSubmitted ? `Score: ${score}` : 'Pending'}
                  </Badge>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {completedCapstones}/{ALL_CAPSTONE_IDS.length} completed
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
