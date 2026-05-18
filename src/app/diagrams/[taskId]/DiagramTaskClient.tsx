'use client';

/**
 * DiagramTaskClient — Client component for the Grouped Diagram Task page.
 * Renders the task prompt, progressive hints, and the ArchitectureCanvas.
 * On submission, marks the task as complete regardless of AI feedback score.
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, Lightbulb, CheckCircle2 } from 'lucide-react';

import { DynamicArchitectureCanvas as ArchitectureCanvas } from '@/components/canvas';
import { useProgressStore } from '@/stores/progress-store';
import type { DiagramTask, ArchitectureReview } from '@/types';

interface DiagramTaskClientProps {
  /** The diagram task data loaded from static JSON */
  task: DiagramTask;
}

export function DiagramTaskClient({ task }: DiagramTaskClientProps) {
  const [submitted, setSubmitted] = useState(false);
  const [reviewResult, setReviewResult] = useState<ArchitectureReview | null>(null);
  const [hintsRevealed, setHintsRevealed] = useState(0);

  const completeDiagramTask = useProgressStore((s) => s.completeDiagramTask);

  /**
   * Handle submission completion from the ArchitectureCanvas.
   * Marks the diagram task as complete regardless of the feedback result.
   */
  const handleSubmitComplete = useCallback(
    (result: ArchitectureReview | null) => {
      // Unlock next cluster regardless of feedback score (Requirement 4.4)
      completeDiagramTask(task.id);
      setSubmitted(true);
      if (result) {
        setReviewResult(result);
      }
    },
    [completeDiagramTask, task.id]
  );

  /**
   * Reveal the next hint in the progressive hint list.
   */
  const revealNextHint = useCallback(() => {
    setHintsRevealed((prev) => Math.min(prev + 1, task.hints.length));
  }, [task.hints.length]);

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header Section */}
      <header className="border-b border-border bg-card px-6 py-5">
        <h1 className="text-2xl font-bold text-foreground">{task.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {task.prompt}
        </p>

        {/* Required Components */}
        <div className="mt-4">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Required Components:
          </span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {task.requiredComponents.map((comp) => (
              <span
                key={comp}
                className="rounded-md border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground"
              >
                {comp}
              </span>
            ))}
          </div>
        </div>

        {/* Progressive Hints */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Hints ({hintsRevealed}/{task.hints.length})
            </span>
            {hintsRevealed < task.hints.length && (
              <button
                onClick={revealNextHint}
                className="ml-2 rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label={`Reveal hint ${hintsRevealed + 1} of ${task.hints.length}`}
              >
                Show next hint
              </button>
            )}
          </div>
          {hintsRevealed > 0 && (
            <ul className="mt-2 space-y-1.5 pl-6" aria-label="Revealed hints">
              {task.hints.slice(0, hintsRevealed).map((hint, index) => (
                <li
                  key={index}
                  className="text-sm text-muted-foreground list-disc"
                >
                  {hint}
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {/* Canvas Section */}
      {!submitted ? (
        <div className="flex-1" style={{ minHeight: '600px' }}>
          <ArchitectureCanvas
            mode="diagram"
            taskId={task.id}
            onSubmitComplete={handleSubmitComplete}
          />
        </div>
      ) : (
        /* Post-Submission Section */
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2
              className="h-12 w-12 text-green-500"
              aria-hidden="true"
            />
            <h2 className="text-xl font-semibold text-foreground">
              Diagram Submitted
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Your diagram has been reviewed. The next topic cluster is now
              unlocked regardless of your score.
            </p>
          </div>

          {/* AI Feedback Summary */}
          {reviewResult && (
            <div className="w-full max-w-lg rounded-lg border border-border bg-card p-5">
              <h3 className="text-sm font-medium text-foreground">
                AI Feedback
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {reviewResult.feedback}
              </p>
              {reviewResult.suggestions.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Suggestions:
                  </span>
                  <ul className="mt-1.5 space-y-1 pl-4">
                    {reviewResult.suggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        className="text-sm text-muted-foreground list-disc"
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Overall Score:
                </span>
                <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                  {reviewResult.overallScore}/100
                </span>
              </div>
            </div>
          )}

          {/* Continue Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            aria-label="Continue to next topics"
          >
            Continue to next topics
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </main>
  );
}
