'use client';

/**
 * ProgressionGate — Client-side component that enforces progression gating.
 *
 * Wraps page content and checks if the learner has unlocked the requested content.
 * If locked, displays a "locked" message with a link to what needs to be done first.
 * If unlocked, renders the children.
 *
 * Since progress is stored in localStorage (client-side via Zustand persist),
 * gating must happen client-side after hydration.
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4
 */

import React, { type ReactNode } from 'react';
import Link from 'next/link';
import { useProgressStore } from '@/stores/progress-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ProgressState } from '@/types';

/** Gate type determines which check function to use */
export type GateType =
  | 'topic'
  | 'quiz'
  | 'diagram'
  | 'section-quiz'
  | 'capstone';

interface ProgressionGateProps {
  /** The type of content being gated */
  gateType: GateType;
  /** The content ID (topicId, taskId, challengeId) — not needed for section-quiz */
  contentId?: string;
  /** The check function that determines if content is unlocked */
  checkUnlocked: (state: ProgressState) => boolean;
  /** The path to redirect to when content is locked */
  redirectPath: string;
  /** Human-readable label for what needs to be done first */
  lockMessage: string;
  /** The children to render when content is unlocked */
  children: ReactNode;
}

/**
 * ProgressionGate component.
 * Checks unlock status on the client after Zustand hydration.
 * Shows a loading state during hydration, then either renders children or a lock message.
 */
export function ProgressionGate({
  checkUnlocked,
  redirectPath,
  lockMessage,
  children,
}: ProgressionGateProps) {
  const topicProgress = useProgressStore((s) => s.topicProgress);
  const diagramTaskProgress = useProgressStore((s) => s.diagramTaskProgress);
  const sectionQuizAttempts = useProgressStore((s) => s.sectionQuizAttempts);
  const capstoneProgress = useProgressStore((s) => s.capstoneProgress);
  const flashcardProgress = useProgressStore((s) => s.flashcardProgress);
  const studyStreak = useProgressStore((s) => s.studyStreak);
  const lastActivityDate = useProgressStore((s) => s.lastActivityDate);

  // Reconstruct the ProgressState for the check function
  const progressState: ProgressState = {
    topicProgress,
    diagramTaskProgress,
    sectionQuizAttempts,
    capstoneProgress,
    flashcardProgress,
    studyStreak,
    lastActivityDate,
  };

  const isUnlocked = checkUnlocked(progressState);

  if (!isUnlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <Card className="w-full max-w-md border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-col items-center gap-6 py-10">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-500"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">
                Content Locked
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {lockMessage}
              </p>
            </div>
            <Button asChild>
              <Link href={redirectPath}>Go to Required Content</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return <>{children}</>;
}
