'use client';

/**
 * ProgressDashboard — Simple welcome page with progress summary.
 * Shows title, subtitle, study streak, progress count, and a start button.
 * The sidebar handles all navigation — this page is just a landing view.
 */

import React from 'react';
import Link from 'next/link';
import { useProgressStore } from '@/stores/progress-store';
import { Button } from '@/components/ui/button';
import type { ProgressionConfig } from '@/types';
import progressionData from '@/content/progression.json';

/** Static progression config loaded from JSON */
const config: ProgressionConfig = progressionData as ProgressionConfig;

/** All topic IDs in order from the progression config */
const ALL_TOPIC_IDS: string[] = config.sections.flatMap((section) =>
  section.clusters.flatMap((cluster) => cluster.topicIds)
);

/**
 * ProgressDashboard — Landing page for MiQuali.
 * Minimal: title, streak, progress summary, and a start button.
 */
export function ProgressDashboard() {
  const topicProgress = useProgressStore((state) => state.topicProgress);
  const studyStreak = useProgressStore((state) => state.studyStreak);

  const completedTopics = ALL_TOPIC_IDS.filter(
    (id) => topicProgress[id]?.miniQuizPassed
  ).length;
  const totalTopics = ALL_TOPIC_IDS.length;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-4xl font-bold text-foreground">MiQuali</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            AWS SAP-C02 — Networking
          </p>
        </div>

        {/* Study streak */}
        {studyStreak.currentStreak > 0 && (
          <p
            className="text-sm text-muted-foreground"
            aria-label={`Study streak: ${studyStreak.currentStreak} days`}
          >
            <span role="img" aria-hidden="true">🔥</span>{' '}
            {studyStreak.currentStreak} day streak
          </p>
        )}

        {/* Progress summary */}
        <p className="text-muted-foreground">
          {completedTopics}/{totalTopics} topics studied
        </p>

        {/* Start Learning button */}
        <Button asChild size="lg" className="w-full">
          <Link href="/topics/what-is-vpc">Start Learning →</Link>
        </Button>
      </div>
    </div>
  );
}
