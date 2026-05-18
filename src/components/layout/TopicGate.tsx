'use client';

/**
 * TopicGate — Progression gate wrapper for topic pages.
 * Checks if the topic is unlocked before rendering children.
 * Redirects to dashboard if locked.
 *
 * Validates: Requirements 8.1, 8.2
 */

import React, { type ReactNode } from 'react';
import { ProgressionGate } from './ProgressionGate';
import { checkTopicUnlocked, getTopicRedirectPath } from '@/lib/check-progression';
import type { ProgressState } from '@/types';

interface TopicGateProps {
  /** The topic ID to check */
  topicId: string;
  /** The children to render when unlocked */
  children: ReactNode;
}

export function TopicGate({ topicId, children }: TopicGateProps) {
  const checkUnlocked = (state: ProgressState) =>
    checkTopicUnlocked(topicId, state);

  return (
    <ProgressionGate
      gateType="topic"
      contentId={topicId}
      checkUnlocked={checkUnlocked}
      redirectPath={getTopicRedirectPath()}
      lockMessage="This topic is locked. Complete the previous topic's mini-quiz first, or submit the required diagram task."
    >
      {children}
    </ProgressionGate>
  );
}
