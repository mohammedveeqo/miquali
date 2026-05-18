'use client';

/**
 * QualCard — Card component for an enrolled qualification.
 * Shows the qualification name, progress bar, and a continue button.
 */

import { ArrowRight } from 'lucide-react';

/** Props for the QualCard component */
export interface QualCardProps {
  /** Qualification display name */
  name: string;
  /** Subtitle (e.g., "Solutions Architect Professional") */
  subtitle: string;
  /** Number of completed topics */
  completed: number;
  /** Total number of topics */
  total: number;
  /** Whether this qualification is currently active */
  active: boolean;
  /** Click handler */
  onClick: () => void;
}

/**
 * QualCard — Displays an enrolled qualification with progress.
 */
export function QualCard({ name, subtitle, completed, total, active, onClick }: QualCardProps) {
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <button
      onClick={onClick}
      disabled={!active}
      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 p-5 text-left hover:border-zinc-600 hover:bg-zinc-800 transition-all disabled:cursor-not-allowed disabled:opacity-50 group"
      type="button"
      aria-label={`${name} — ${completed} of ${total} topics completed. ${active ? 'Click to continue.' : 'Coming soon.'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {active && (
          <span className="flex items-center gap-1 text-sm text-primary group-hover:translate-x-0.5 transition-transform">
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{completed}/{total} topics</span>
          <span>{progressPercent}%</span>
        </div>
        <div
          className="h-2 w-full rounded-full bg-zinc-700 overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${name} progress`}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </button>
  );
}
