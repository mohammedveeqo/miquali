'use client';

/**
 * TopicNextStep — Displays the next action for the learner on a topic page.
 * Wires the flow: Concept Chat → Mini-Quiz → next topic/diagram/section-quiz.
 *
 * Validates: Requirements 8.1, 8.2, 8.3
 */

import React from 'react';
import Link from 'next/link';
import { useProgressStore } from '@/stores/progress-store';
import { getTopicNextStep } from '@/lib/check-progression';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { ProgressState } from '@/types';

interface TopicNextStepProps {
  /** The current topic ID */
  topicId: string;
}

/** Icons for each action type */
const ACTION_ICONS: Record<string, string> = {
  chat: '💬',
  quiz: '📝',
  'next-topic': '➡️',
  diagram: '🏗️',
  'section-quiz': '🎯',
  complete: '🎉',
};

export function TopicNextStep({ topicId }: TopicNextStepProps) {
  const topicProgress = useProgressStore((s) => s.topicProgress);
  const diagramTaskProgress = useProgressStore((s) => s.diagramTaskProgress);
  const sectionQuizAttempts = useProgressStore((s) => s.sectionQuizAttempts);
  const capstoneProgress = useProgressStore((s) => s.capstoneProgress);
  const flashcardProgress = useProgressStore((s) => s.flashcardProgress);
  const studyStreak = useProgressStore((s) => s.studyStreak);
  const lastActivityDate = useProgressStore((s) => s.lastActivityDate);

  const progressState: ProgressState = {
    topicProgress,
    diagramTaskProgress,
    sectionQuizAttempts,
    capstoneProgress,
    flashcardProgress,
    studyStreak,
    lastActivityDate,
  };

  const nextStep = getTopicNextStep(topicId, progressState);
  const icon = ACTION_ICONS[nextStep.action] ?? '→';

  return (
    <Card className="mx-auto mt-6 w-full max-w-3xl border-primary/20 bg-primary/5">
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <span role="img" aria-hidden="true" className="text-xl">
            {icon}
          </span>
          <span className="text-sm font-medium text-foreground">
            {nextStep.action === 'complete'
              ? 'All topics complete!'
              : 'Next Step:'}
          </span>
        </div>
        <Button asChild size="sm">
          <Link href={nextStep.path}>{nextStep.label}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
