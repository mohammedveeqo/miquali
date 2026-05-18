'use client';

/**
 * DynamicTopicPage — Lazy-loaded wrapper for the TopicPage component.
 * Uses next/dynamic to code-split the react-markdown bundle, ensuring
 * page loads stay under 2 seconds (Requirement 16.1).
 */

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

/**
 * Loading skeleton displayed while the TopicPage chunk is being fetched.
 */
function TopicLoadingSkeleton() {
  return (
    <div
      className="flex min-h-[400px] w-full flex-col items-center justify-center gap-4"
      role="status"
      aria-label="Loading topic content"
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">Loading topic content...</p>
    </div>
  );
}

/**
 * Dynamically imported TopicPage. This splits the react-markdown dependency
 * into a separate chunk that loads on demand.
 */
const DynamicTopicPage = dynamic(
  () => import('./TopicPage').then((mod) => ({ default: mod.TopicPage })),
  {
    ssr: false,
    loading: () => <TopicLoadingSkeleton />,
  }
);

export { DynamicTopicPage };
