'use client';

/**
 * Homepage — Qualification picker for MiQuali.
 * New users see a search-first landing page.
 * Returning users see their enrolled qualifications with progress.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight } from 'lucide-react';

import { QualCard } from '@/components/home/QualCard';
import { useProgressStore } from '@/stores/progress-store';
import type { ProgressionConfig } from '@/types';
import progressionData from '@/content/progression.json';

const progression: ProgressionConfig = progressionData as ProgressionConfig;

/** Available qualifications (MVP: only SAP-C02 is active) */
const QUALIFICATIONS = [
  { id: 'aws-sap-c02', name: 'AWS SAP-C02', category: 'cloud', active: true },
  { id: 'az-104', name: 'AZ-104', category: 'cloud', active: false },
  { id: 'cka', name: 'CKA', category: 'devops', active: false },
  { id: 'cissp', name: 'CISSP', category: 'security', active: false },
] as const;

/** Popular tags for quick selection */
const POPULAR_TAGS = ['AWS SAP-C02', 'AZ-104', 'CKA', 'CISSP'] as const;

/** Category filters */
const CATEGORIES = [
  { id: 'cloud', label: '☁️ Cloud' },
  { id: 'devops', label: '⚙️ DevOps' },
  { id: 'security', label: '🔒 Security' },
] as const;

/**
 * Homepage — Main landing page with qualification picker.
 */
export function Homepage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasProgress, setHasProgress] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const topicProgress = useProgressStore((s) => s.topicProgress);

  /** Check if user has any progress (returning user) */
  useEffect(() => {
    setMounted(true);
    const hasAnyProgress = Object.keys(topicProgress).length > 0;
    setHasProgress(hasAnyProgress);
  }, [topicProgress]);

  /** Calculate overall progress for the active qualification */
  const getQualProgress = useCallback(() => {
    const allTopicIds = progression.sections.flatMap((s) =>
      s.clusters.flatMap((c) => c.topicIds)
    );
    const completedCount = allTopicIds.filter(
      (id) => topicProgress[id]?.miniQuizPassed
    ).length;
    return { completed: completedCount, total: allTopicIds.length };
  }, [topicProgress]);

  /** Handle clicking a qualification */
  const handleQualClick = useCallback(
    (qualId: string, active: boolean) => {
      if (active) {
        // Navigate to first topic or continue where left off
        const allTopicIds = progression.sections.flatMap((s) =>
          s.clusters.flatMap((c) => c.topicIds)
        );
        const firstIncomplete = allTopicIds.find(
          (id) => !topicProgress[id]?.miniQuizPassed
        );
        router.push(`/topics/${firstIncomplete ?? allTopicIds[0]}`);
      }
    },
    [router, topicProgress]
  );

  /** Handle tag click */
  const handleTagClick = useCallback(
    (tag: string) => {
      const qual = QUALIFICATIONS.find((q) => q.name === tag);
      if (qual) {
        handleQualClick(qual.id, qual.active);
      }
    },
    [handleQualClick]
  );

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Returning user view
  if (hasProgress) {
    const progress = getQualProgress();
    return (
      <div className="flex flex-col items-center px-6 py-12 min-h-screen">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Qualifications</h1>
        <p className="text-muted-foreground mb-8">Pick up where you left off</p>

        {/* Active qualification card */}
        <div className="w-full max-w-lg mb-8">
          <QualCard
            name="AWS SAP-C02"
            subtitle="Solutions Architect Professional"
            completed={progress.completed}
            total={progress.total}
            active={true}
            onClick={() => handleQualClick('aws-sap-c02', true)}
          />
        </div>

        {/* Search for more */}
        <div className="w-full max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search another certification..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="Search certifications"
            />
          </div>
        </div>
      </div>
    );
  }

  // New user view
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 min-h-screen">
      {/* Title */}
      <h1 className="text-4xl font-bold text-foreground mb-2">MiQuali</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Speed-run any qualification with AI
      </p>

      {/* Search bar */}
      <div className="w-full max-w-md mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search a certification..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Search certifications"
            autoFocus
          />
        </div>
      </div>

      {/* Popular tags */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {POPULAR_TAGS.map((tag) => {
          const qual = QUALIFICATIONS.find((q) => q.name === tag);
          const isActive = qual?.active ?? false;
          return (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? 'border-primary/50 text-primary hover:bg-primary/10 cursor-pointer'
                  : 'border-zinc-700 text-zinc-500 cursor-default'
              }`}
              type="button"
              title={isActive ? `Start ${tag}` : 'Coming soon'}
              aria-label={isActive ? `Start ${tag}` : `${tag} — coming soon`}
            >
              {tag}
              {!isActive && <span className="ml-1 text-xs text-zinc-600">(soon)</span>}
            </button>
          );
        })}
      </div>

      {/* Browse by category */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-3 text-center">Browse by category</p>
        <div className="flex gap-3 justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-foreground/80 hover:bg-muted hover:border-zinc-600 transition-colors"
              type="button"
              aria-label={`Browse ${cat.label} certifications`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Create your own */}
      <p className="text-sm text-muted-foreground">
        Can&apos;t find yours?{' '}
        <button
          className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
          type="button"
          aria-label="Create your own qualification"
        >
          + Create your own
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </button>
      </p>
    </div>
  );
}
