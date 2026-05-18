'use client';

/**
 * ReviewResultsPanel — Displays AI architecture review results after submission.
 * Shows overall score, per-category scores, feedback, and suggestions.
 * Implements focus trapping for modal accessibility (WCAG 2.1 AA).
 *
 * Validates: Requirements 6.6, 6.7, 15.2, 15.3, 15.4
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { X, Star, CheckCircle2, AlertTriangle } from 'lucide-react';
import { trapFocus, announceToScreenReader } from '@/lib/accessibility';
import type { ArchitectureReview } from '@/types';

interface ReviewResultsPanelProps {
  /** The review result from Nova Pro */
  review: ArchitectureReview;
  /** Called when the panel is dismissed */
  onClose: () => void;
}

/** Score color based on value */
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

/** Score background based on value */
function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-500/10';
  if (score >= 60) return 'bg-amber-500/10';
  return 'bg-red-500/10';
}

export function ReviewResultsPanel({ review, onClose }: ReviewResultsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store the previously focused element and focus the close button on mount
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    // Activate focus trap
    const cleanup = trapFocus(panelRef);

    // Announce to screen readers
    announceToScreenReader(
      `Architecture review results: overall score ${review.overallScore} out of 100`,
      'assertive'
    );

    return () => {
      cleanup();
      // Return focus to the previously focused element on unmount
      previousFocusRef.current?.focus();
    };
  }, [review.overallScore]);

  // Trap focus within the modal
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
    },
    [onClose]
  );

  const categories = [
    { key: 'correctness', label: 'Correctness', data: review.categories.correctness },
    { key: 'connectivity', label: 'Connectivity', data: review.categories.connectivity },
    { key: 'security', label: 'Security', data: review.categories.security },
    { key: 'bestPractices', label: 'Best Practices', data: review.categories.bestPractices },
  ];

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-label="Architecture review results"
      aria-modal="true"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={panelRef}
        className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl"
      >
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Close review results"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Overall Score */}
        <div className="mb-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Star className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-foreground">Review Results</h2>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${getScoreBg(review.overallScore)}`}
          >
            <span className={`text-3xl font-bold ${getScoreColor(review.overallScore)}`}>
              {review.overallScore}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
        </div>

        {/* Category Scores */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.key}
              className="rounded-lg border border-border p-3"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {cat.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(cat.data.weight * 100)}%
                </span>
              </div>
              <p className={`text-xl font-bold ${getScoreColor(cat.data.score)}`}>
                {cat.data.score}
              </p>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {cat.data.feedback}
              </p>
            </div>
          ))}
        </div>

        {/* Feedback */}
        <div className="mb-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            Feedback
          </h3>
          <p className="text-sm text-muted-foreground">{review.feedback}</p>
        </div>

        {/* Suggestions */}
        {review.suggestions.length > 0 && (
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Suggestions
            </h3>
            <ul className="flex flex-col gap-1.5">
              {review.suggestions.map((suggestion, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
