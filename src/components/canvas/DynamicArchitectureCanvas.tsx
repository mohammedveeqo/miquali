'use client';

/**
 * DynamicArchitectureCanvas — Lazy-loaded wrapper for the ArchitectureCanvas.
 * Uses next/dynamic to code-split the heavy React Flow bundle, ensuring
 * page loads stay under 2 seconds (Requirement 16.1).
 *
 * The ArchitectureCanvas and its React Flow dependency are only loaded
 * when the user navigates to a diagram or capstone page.
 */

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

/**
 * Loading skeleton displayed while the ArchitectureCanvas chunk is being fetched.
 */
function CanvasLoadingSkeleton() {
  return (
    <div
      className="flex h-full min-h-[500px] w-full flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card"
      role="status"
      aria-label="Loading architecture canvas"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">Loading architecture canvas...</p>
    </div>
  );
}

/**
 * Dynamically imported ArchitectureCanvas with SSR disabled.
 * React Flow requires browser APIs (DOM measurements, ResizeObserver) so
 * it cannot render on the server.
 */
const DynamicArchitectureCanvas = dynamic(
  () => import('./ArchitectureCanvas').then((mod) => ({ default: mod.ArchitectureCanvas })),
  {
    ssr: false,
    loading: () => <CanvasLoadingSkeleton />,
  }
);

export { DynamicArchitectureCanvas };
