'use client';

/**
 * Sidebar — Fixed left navigation panel for the docs-site layout.
 * Lists all 18 topics from progression.json with completion status indicators.
 * All topics are freely navigable (no hard gating).
 * Collapsible on mobile via hamburger menu.
 *
 * Status indicators:
 * ✅ = completed (3 Q&A passes / miniQuizPassed)
 * ← = current (active topic being viewed)
 * 🔒 = locked (previous not complete) — still clickable
 * ○ = not started
 */

import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

import { useProgressStore } from '@/stores/progress-store';
import type { ProgressionConfig } from '@/types';
import progressionData from '@/content/progression.json';

/** Static progression config */
const config: ProgressionConfig = progressionData as ProgressionConfig;

/** All topic IDs in order from the progression config */
const ALL_TOPIC_IDS: string[] = config.sections.flatMap((section) =>
  section.clusters.flatMap((cluster) => cluster.topicIds)
);

/** Format a topic ID into a readable title */
function formatTopicTitle(topicId: string): string {
  return topicId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Sidebar component for the docs-site layout.
 * Fixed on desktop, collapsible drawer on mobile.
 */
export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const topicProgress = useProgressStore((s) => s.topicProgress);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  /** Calculate overall progress */
  const overallProgress = useMemo(() => {
    const completed = ALL_TOPIC_IDS.filter(
      (id) => topicProgress[id]?.miniQuizPassed
    ).length;
    return { completed, total: ALL_TOPIC_IDS.length };
  }, [topicProgress]);

  /**
   * Determine the status indicator for a topic.
   * ✅ = completed, ← = current, 🔒 = locked (prev not done), ○ = not started
   */
  function getStatusIndicator(topicId: string): { symbol: string; label: string; className: string } {
    const isActive = pathname === `/topics/${topicId}`;

    if (isActive) {
      return { symbol: '←', label: 'current', className: 'text-blue-400' };
    }

    const progress = topicProgress[topicId];
    if (progress?.miniQuizPassed) {
      return { symbol: '✅', label: 'completed', className: '' };
    }

    // Check if previous topic is completed (for locked indicator)
    const topicIndex = ALL_TOPIC_IDS.indexOf(topicId);
    if (topicIndex > 0) {
      const prevTopicId = ALL_TOPIC_IDS[topicIndex - 1];
      const prevProgress = topicProgress[prevTopicId];
      if (!prevProgress?.miniQuizPassed) {
        return { symbol: '🔒', label: 'locked', className: '' };
      }
    }

    return { symbol: '○', label: 'not started', className: 'text-zinc-500' };
  }

  /** Check if a topic is currently active */
  function isActive(topicId: string): boolean {
    return pathname === `/topics/${topicId}`;
  }

  const progressPercent = overallProgress.total > 0
    ? Math.round((overallProgress.completed / overallProgress.total) * 100)
    : 0;

  const sidebarContent = (
    <nav aria-label="Topic navigation" className="flex flex-col h-full">
      {/* Logo / Title */}
      <div className="px-4 py-5 border-b border-border shrink-0">
        <Link
          href="/"
          className="text-lg font-bold text-foreground hover:text-primary transition-colors"
          onClick={closeMobile}
        >
          MiQuali
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5">
          AWS SAP-C02
        </p>
      </div>

      {/* Topic list */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {config.sections.map((section) => (
          <div key={section.id} className="mb-4">
            <h2 className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.name}
            </h2>
            <ul className="space-y-0.5" role="list" aria-label={`${section.name} topics`}>
              {section.clusters.flatMap((cluster) =>
                cluster.topicIds.map((topicId) => {
                  const status = getStatusIndicator(topicId);
                  const active = isActive(topicId);
                  return (
                    <li key={topicId}>
                      <Link
                        href={`/topics/${topicId}`}
                        onClick={closeMobile}
                        className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
                          active
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                        }`}
                        aria-current={active ? 'page' : undefined}
                        aria-label={`${formatTopicTitle(topicId)} — ${status.label}`}
                      >
                        <span
                          className={`text-xs shrink-0 ${status.className}`}
                          aria-hidden="true"
                        >
                          {status.symbol}
                        </span>
                        <span className="truncate">
                          {formatTopicTitle(topicId)}
                        </span>
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        ))}
      </div>

      {/* Progress bar at bottom */}
      <div className="border-t border-border px-4 py-4 shrink-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Progress</span>
          <span>{overallProgress.completed}/{overallProgress.total}</span>
        </div>
        <div
          className="h-2 w-full rounded-full bg-zinc-700 overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall progress"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={toggleMobile}
        className="fixed top-4 left-4 z-50 rounded-md bg-zinc-800 border border-zinc-700 p-2 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors shadow-lg md:hidden"
        aria-label={isMobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMobileOpen}
        type="button"
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5" aria-hidden="true" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[250px] bg-background border-r border-border transform transition-transform duration-200 ease-in-out md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigation sidebar"
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar (always visible) */}
      <aside
        className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-[250px] md:border-r md:border-border md:bg-background md:z-30"
        aria-label="Navigation sidebar"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
