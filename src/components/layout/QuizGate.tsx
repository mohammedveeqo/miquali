'use client';

/**
 * QuizGate — Progression gate wrapper for mini-quiz pages.
 * Checks if the quiz is unlocked (concept chat passed) before rendering children.
 * Redirects to the topic page if locked.
 *
 * Validates: Requirements 3.1, 8.2
 */

import React, { type ReactNode } from 'react';
import { ProgressionGate } from './ProgressionGate';
import {
  checkTopicUnlocked,
  checkQuizUnlocked,
  getQuizRedirectPath,
} from '@/lib/check-progression';
import type { ProgressState } from '@/types';

interface QuizGateProps {
  /** The topic ID whose quiz to check */
  topicId: string;
  /** The children to render when unlocked */
  children: ReactNode;
}

export function QuizGate({ topicId, children }: QuizGateProps) {
  const checkUnlocked = (state: ProgressState) => {
    // Topic must be unlocked AND concept chat must be passed
    return checkTopicUnlocked(topicId, state) && checkQuizUnlocked(topicId, state);
  };

  return (
    <ProgressionGate
      gateType="quiz"
      contentId={topicId}
      checkUnlocked={checkUnlocked}
      redirectPath={getQuizRedirectPath(topicId)}
      lockMessage="The mini-quiz is locked. Complete the Concept Chat for this topic first to demonstrate your understanding."
    >
      {children}
    </ProgressionGate>
  );
}
