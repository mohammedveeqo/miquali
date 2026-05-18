'use client';

/**
 * TopicTabs — Three-tab container for the topic page.
 * Tabs: Learn (📖), Q&A (💬), Draw (🗺️)
 * Q&A is the default tab on first visit.
 * Draw tab is only visible at cluster gates.
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { LearnTab } from '@/components/topic/LearnTab';
import { QATab } from '@/components/topic/QATab';
import { DrawTab } from '@/components/topic/DrawTab';
import type { TopicContent, QAQuestion, ProgressionConfig } from '@/types';

/** Props for the TopicTabs component */
export interface TopicTabsProps {
  /** The full topic content */
  topic: TopicContent;
  /** Q&A questions for this topic */
  qaQuestions: QAQuestion[];
  /** The progression config for navigation */
  progression: ProgressionConfig;
}

type TabId = 'learn' | 'qa' | 'draw';

interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
  visible: boolean;
}

/**
 * TopicTabs — Main topic page layout with three tabs.
 */
export function TopicTabs({ topic, qaQuestions, progression }: TopicTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('qa');

  /** Compute navigation: prev/next topic and position */
  const navigation = useMemo(() => {
    const allTopicIds: string[] = progression.sections.flatMap((section) =>
      section.clusters.flatMap((cluster) => cluster.topicIds)
    );
    const currentIndex = allTopicIds.indexOf(topic.id);
    const total = allTopicIds.length;
    const position = currentIndex + 1;
    const prevId = currentIndex > 0 ? allTopicIds[currentIndex - 1] : null;
    const nextId = currentIndex < total - 1 ? allTopicIds[currentIndex + 1] : null;
    return { prevId, nextId, position, total };
  }, [topic.id, progression]);

  /** Determine if this topic is a cluster gate (last topic in its cluster) */
  const isClusterGate = useMemo(() => {
    for (const section of progression.sections) {
      for (const cluster of section.clusters) {
        const topicIds = cluster.topicIds;
        if (topicIds.includes(topic.id) && topicIds[topicIds.length - 1] === topic.id) {
          return true;
        }
      }
    }
    return false;
  }, [topic.id, progression]);

  /** Tab configuration */
  const tabs: TabConfig[] = useMemo(() => [
    { id: 'learn', label: '📖 Learn', icon: '📖', visible: true },
    { id: 'qa', label: '💬 Q&A', icon: '💬', visible: true },
    { id: 'draw', label: '🗺️ Draw', icon: '🗺️', visible: isClusterGate },
  ], [isClusterGate]);

  const visibleTabs = tabs.filter((t) => t.visible);

  return (
    <div className="flex flex-col h-[calc(100vh-0px)]">
      {/* Header: Topic title + navigation arrows */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
        <h1 className="text-xl font-bold text-foreground truncate">
          {topic.title}
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          {navigation.prevId ? (
            <Link
              href={`/topics/${navigation.prevId}`}
              className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Previous topic"
              title="Previous topic"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          ) : (
            <span className="rounded p-1 text-zinc-700 cursor-not-allowed" aria-hidden="true">
              <ChevronLeft className="h-5 w-5" />
            </span>
          )}
          <span className="text-sm text-muted-foreground tabular-nums">
            {navigation.position}/{navigation.total}
          </span>
          {navigation.nextId ? (
            <Link
              href={`/topics/${navigation.nextId}`}
              className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Next topic"
              title="Next topic"
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          ) : (
            <span className="rounded p-1 text-zinc-700 cursor-not-allowed" aria-hidden="true">
              <ChevronRight className="h-5 w-5" />
            </span>
          )}
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex border-b border-border shrink-0" role="tablist" aria-label="Topic tabs">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            }`}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content — fills remaining viewport */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'learn' && (
          <div
            role="tabpanel"
            id="tabpanel-learn"
            aria-labelledby="tab-learn"
            className="h-full"
          >
            <LearnTab topic={topic} />
          </div>
        )}
        {activeTab === 'qa' && (
          <div
            role="tabpanel"
            id="tabpanel-qa"
            aria-labelledby="tab-qa"
            className="h-full"
          >
            <QATab
              topicId={topic.id}
              topicTitle={topic.title}
              questions={qaQuestions}
            />
          </div>
        )}
        {activeTab === 'draw' && (
          <div
            role="tabpanel"
            id="tabpanel-draw"
            aria-labelledby="tab-draw"
            className="h-full"
          >
            <DrawTab isClusterGate={isClusterGate} clusterId={topic.clusterId} />
          </div>
        )}
      </div>
    </div>
  );
}
