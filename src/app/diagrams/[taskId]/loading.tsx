import { Loader2 } from 'lucide-react';

/**
 * Loading state for the diagram task route segment.
 * Displayed while the page and its heavy React Flow dependencies load.
 * Ensures perceived performance stays under 2 seconds (Requirement 16.1).
 */
export default function DiagramTaskLoading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Loader2
        className="h-8 w-8 animate-spin text-primary"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground">
        Loading diagram task...
      </p>
    </main>
  );
}
