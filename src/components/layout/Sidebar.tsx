'use client';

/**
 * Sidebar — Fixed left navigation panel for the docs-site layout.
 * Lists all 18 topics from progression.json with completion status indicators.
 * All topics are freely navigable (no gating).
 * Collapsible on mobile via hamburger menu.
 *
 * Status indicators:
 * ● completed (miniQuizPassed)
 * ◐ in progress (readComplete or conceptChatPassed but not miniQuizPassed)
 * ○ not started
 */

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, BookOpen, Search, Brain } from 'lucide-react';

import { useProgressStore } from '@/stores/progress-store';
import type { ProgressionConfig } from '@/types';
import progressionData from '@/content/progression.json';

/** Static progression config */
const config: ProgressionConfig = progressionData as ProgressionConfig;

/** All topic IDs in order from the progression config */
const ALL_TOPICS: { id: string; sectionName: string }[] = config.sections.flatMap(
  (section) =>
    section.clusters.flatMap((cluster) =>
      cluster.topicIds.map((id) => ({ id, sectionName: section.name }))
    )
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

  /**
   * Determine the status indicator for a topic.
   */
  function getStatusIndicator(topicId: string): { symbol: string; label: string; className: string } {
    const progress = topicProgress[topicId];
    if (progress?.miniQuizPassed) {
      return { symbol: '●', label: 'completed', className: 'text-green-500' };
    }
    if (progress?.readComplete || progress?.conceptChatPassed) {
      return { symbol: '◐', label: 'in progress', className: 'text-amber-400' };
    }
    return { symbol: '○', label: 'not started', className: 'text-zinc-500' };
  }

  /** Check if a topic is currently active */
  function isActive(topicId: string): boolean {
    return pathname === `/topics/${topicId}`;
  }

  const sidebarContent = (
    <nav aria-label="Topic navigation" className="flex flex-col h-full">
      {/* Logo / Title */}
      <div className="px-4 py-5 border-b border-border shrink-0">
        <Link
          href="/"
          className="text-lg font-bold text-foreground hover:text-primary transition-colors"
          onClick={closeMobile}
        >
          QualCheck
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5">
          AWS SAP-C02 · Networking
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

      {/* Bottom links */}
      <div className="border-t border-border px-3 py-4 shrink-0 space-y-1">
        <Link
          href="/flashcards"
          onClick={closeMobile}
          className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
            pathname === '/flashcards'
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-foreground/80 hover:bg-muted hover:text-foreground'
          }`}
          aria-current={pathname === '/flashcards' ? 'page' : undefined}
        >
          <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Flashcards
        </Link>
        <Link
          href="/glossary"
          onClick={closeMobile}
          className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
            pathname === '/glossary'
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-foreground/80 hover:bg-muted hover:text-foreground'
          }`}
          aria-current={pathname === '/glossary' ? 'page' : undefined}
        >
          <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Glossary
        </Link>
        <Link
          href="/section-quiz"
          onClick={closeMobile}
          className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
            pathname === '/section-quiz'
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-foreground/80 hover:bg-muted hover:text-foreground'
          }`}
          aria-current={pathname === '/section-quiz' ? 'page' : undefined}
        >
          <Brain className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Section Quiz
        </Link>
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
