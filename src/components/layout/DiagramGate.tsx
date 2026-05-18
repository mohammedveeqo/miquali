'use client';

/**
 * DiagramGate — Progression gate wrapper for diagram task pages.
 * Checks if the diagram task is pending (all cluster topics complete, not yet submitted).
 * Redirects to dashboard if not accessible.
 *
 * Validates: Requirements 4.1, 4.5, 8.3
 */

import React, { type ReactNode } from 'react';
import { ProgressionGate } from './ProgressionGate';
import {
  checkDiagramTaskAccessible,
  getDiagramRedirectPath,
} from '@/lib/check-progression';
import type { ProgressState } from '@/types';

interface DiagramGateProps {
  /** The diagram task ID to check */
  taskId: string;
  /** The children to render when accessible */
  children: ReactNode;
}

export function DiagramGate({ taskId, children }: DiagramGateProps) {
  const checkUnlocked = (state: ProgressState) =>
    checkDiagramTaskAccessible(taskId, state);

  return (
    <ProgressionGate
      gateType="diagram"
      contentId={taskId}
      checkUnlocked={checkUnlocked}
      redirectPath={getDiagramRedirectPath()}
      lockMessage="This diagram task is not available. Complete all topics in the cluster first, or this task has already been submitted."
    >
      {children}
    </ProgressionGate>
  );
}
