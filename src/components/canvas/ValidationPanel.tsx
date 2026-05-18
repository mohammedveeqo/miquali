'use client';

/**
 * ValidationPanel — Bottom panel displaying real-time validation violations.
 * Errors shown in red (block submission), warnings in amber (allow submission).
 *
 * Validates: Requirements 6.3, 6.4, 6.5
 */

import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import type { ValidationResult } from '@/types';

interface ValidationPanelProps {
  /** Error-level violations (block submission) */
  errors: ValidationResult[];
  /** Warning-level violations (allow submission) */
  warnings: ValidationResult[];
}

export function ValidationPanel({ errors, warnings }: ValidationPanelProps) {
  const totalViolations = errors.length + warnings.length;

  if (totalViolations === 0) {
    return (
      <div
        className="border-t border-border bg-card px-4 py-2"
        aria-label="Validation panel"
      >
        <p className="text-sm text-muted-foreground">
          No validation issues. Your diagram is ready to submit.
        </p>
      </div>
    );
  }

  return (
    <div
      className="max-h-[160px] overflow-y-auto border-t border-border bg-card px-4 py-2"
      aria-label="Validation panel"
      role="log"
      aria-live="polite"
    >
      <div className="mb-1 flex items-center gap-3 text-xs text-muted-foreground">
        {errors.length > 0 && (
          <span className="flex items-center gap-1 text-red-500">
            <AlertCircle className="h-3 w-3" />
            {errors.length} error{errors.length !== 1 ? 's' : ''}
          </span>
        )}
        {warnings.length > 0 && (
          <span className="flex items-center gap-1 text-amber-500">
            <AlertTriangle className="h-3 w-3" />
            {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <ul className="flex flex-col gap-1">
        {errors.map((err, idx) => (
          <li
            key={`error-${err.ruleId}-${idx}`}
            className="flex items-start gap-2 rounded px-2 py-1 text-sm text-red-400"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{err.message}</span>
          </li>
        ))}
        {warnings.map((warn, idx) => (
          <li
            key={`warning-${warn.ruleId}-${idx}`}
            className="flex items-start gap-2 rounded px-2 py-1 text-sm text-amber-400"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{warn.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
