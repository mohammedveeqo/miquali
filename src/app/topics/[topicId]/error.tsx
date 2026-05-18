'use client';

export default function TopicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <h2 className="text-xl font-bold text-foreground">Failed to load topic</h2>
        <p className="text-muted-foreground text-sm">
          {error.message || 'An unexpected error occurred loading this topic.'}
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
