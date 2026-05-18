'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground">
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
          <div className="max-w-md w-full text-center space-y-6">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-zinc-400 text-sm">
              {error.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={reset}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
