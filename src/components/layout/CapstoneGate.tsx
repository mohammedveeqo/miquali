'use client';

/**
 * CapstoneGate — Progression gate wrapper for capstone challenge pages.
 * Checks if capstone challenges are unlocked (section quiz passed).
 * Redirects to section quiz page if locked.
 *
 * Validates: Requirements 5.3, 8.4
 */

import React, { type ReactNode } from 'react';
import { ProgressionGate } from './ProgressionGate';
import {
  checkCapstoneUnlocked,
  getCapstoneRedirectPath,
} from '@/lib/check-progression';
import type { ProgressState } from '@/types';

interface CapstoneGateProps {
  /** The capstone challenge ID */
  challengeId: string;
  /** The children to render when unlocked */
  children: ReactNode;
}

export function CapstoneGate({ challengeId, children }: CapstoneGateProps) {
  const checkUnlocked = (state: ProgressState) =>
    checkCapstoneUnlocked(state);

  return (
    <ProgressionGate
      gateType="capstone"
      contentId={challengeId}
      checkUnlocked={checkUnlocked}
      redirectPath={getCapstoneRedirectPath()}
      lockMessage="Capstone challenges are locked. Pass the section quiz (70% or higher) first."
    >
      {children}
    </ProgressionGate>
  );
}
