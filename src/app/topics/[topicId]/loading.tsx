import { Loader2 } from 'lucide-react';

/**
 * Loading state for the topic page route segment.
 * Displayed while the page and its react-markdown dependency load.
 * Ensures perceived performance stays under 2 seconds (Requirement 16.1).
 */
export default function TopicLoading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Loader2
        className="h-6 w-6 animate-spin text-primary"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground">
        Loading topic content...
      </p>
    </main>
  );
}
