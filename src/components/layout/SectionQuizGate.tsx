'use client';

/**
 * SectionQuizGate — Progression gate wrapper for the section quiz page.
 * Checks if the section quiz is unlocked (all topics + diagrams complete).
 * Redirects to dashboard if locked.
 *
 * Validates: Requirements 5.1, 8.3
 */

import React, { type ReactNode } from 'react';
import { ProgressionGate } from './ProgressionGate';
import {
  checkSectionQuizUnlocked,
  getSectionQuizRedirectPath,
} from '@/lib/check-progression';
import type { ProgressState } from '@/types';

interface SectionQuizGateProps {
  /** The children to render when unlocked */
  children: ReactNode;
}

export function SectionQuizGate({ children }: SectionQuizGateProps) {
  const checkUnlocked = (state: ProgressState) =>
    checkSectionQuizUnlocked(state);

  return (
    <ProgressionGate
      gateType="section-quiz"
      checkUnlocked={checkUnlocked}
      redirectPath={getSectionQuizRedirectPath()}
      lockMessage="The section quiz is locked. Complete all 18 topics and all diagram tasks first."
    >
      {children}
    </ProgressionGate>
  );
}
