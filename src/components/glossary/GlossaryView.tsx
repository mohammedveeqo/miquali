'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

import type { GlossaryEntry } from '@/types/content';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/** Category filter options for the glossary */
type CategoryFilter = 'all' | 'exam-term' | 'service' | 'architecture-pattern';

/** Display labels for each category */
const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'All',
  'exam-term': 'Exam Terms',
  service: 'Services',
  'architecture-pattern': 'Architecture Patterns',
};

/** Badge color classes for each category */
const CATEGORY_BADGE_CLASSES: Record<GlossaryEntry['category'], string> = {
  'exam-term': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  service: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'architecture-pattern':
    'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

/** Props for the GlossaryView component */
interface GlossaryViewProps {
  /** Array of glossary entries loaded server-side */
  entries: GlossaryEntry[];
}

/**
 * GlossaryView renders a searchable, filterable list of glossary entries.
 * Supports real-time search filtering (case-insensitive match on term or definition)
 * and category filtering (exam-term, service, architecture-pattern).
 */
export function GlossaryView({ entries }: GlossaryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on mount for keyboard accessibility
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Filter entries based on search query and category
  const filteredEntries = entries.filter((entry) => {
    // Category filter
    if (categoryFilter !== 'all' && entry.category !== categoryFilter) {
      return false;
    }

    // Search filter: case-insensitive match on term or definition
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const termMatch = entry.term.toLowerCase().includes(query);
      const definitionMatch = entry.definition.toLowerCase().includes(query);
      if (!termMatch && !definitionMatch) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Search and filter controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search terms or definitions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            aria-label="Search glossary entries"
          />
        </div>

        {/* Category filter buttons */}
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter by category"
        >
          {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map(
            (category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${
                  categoryFilter === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
                aria-pressed={categoryFilter === category}
              >
                {CATEGORY_LABELS[category]}
              </button>
            )
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {filteredEntries.length}{' '}
        {filteredEntries.length === 1 ? 'entry' : 'entries'} found
      </p>

      {/* Empty state */}
      {filteredEntries.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border p-12 text-center">
          <p className="text-lg font-medium text-foreground">
            No entries found
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your search query or category filter.
          </p>
        </div>
      )}

      {/* Glossary entries grid */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredEntries.map((entry) => (
          <Card
            key={entry.id}
            className="flex flex-col transition-colors hover:border-primary/50"
            tabIndex={0}
            aria-label={`${entry.term}: ${entry.definition}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-bold leading-tight">
                  {entry.term}
                </CardTitle>
                <Badge
                  className={`shrink-0 ${CATEGORY_BADGE_CLASSES[entry.category]}`}
                >
                  {CATEGORY_LABELS[entry.category]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {entry.definition}
              </p>
              {entry.relatedTopics.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {entry.relatedTopics.map((topicId) => (
                    <Link
                      key={topicId}
                      href={`/topics/${topicId}`}
                      className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
                    >
                      {topicId}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
