'use client';

/**
 * QuickReference — Collapsible reference panel for a topic.
 * Collapsed by default. Shows short explanation, analogy, key points,
 * exam keywords, and related topics when expanded.
 * Sits above the conversation and pushes chat down when open.
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import type { TopicContent, KeywordReference } from '@/types';

/** Props for the QuickReference component */
export interface QuickReferenceProps {
  /** The full topic content */
  topic: TopicContent;
}

/**
 * Renders a keyword badge with type-based styling.
 */
function KeywordBadge({ keyword }: { keyword: KeywordReference }) {
  const styleMap: Record<KeywordReference['type'], string> = {
    'exam-signal': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    'service-reference': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    'architecture-term': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  };

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border ${styleMap[keyword.type]}`}
      title={keyword.definition}
      role="term"
      aria-label={`${keyword.term}: ${keyword.definition}`}
    >
      {keyword.term}
    </span>
  );
}

/**
 * Truncates the explanation to approximately 3-4 sentences.
 */
function getShortExplanation(explanation: string): string {
  const sentences = explanation.split(/(?<=[.!?])\s+/);
  return sentences.slice(0, 4).join(' ');
}

/**
 * QuickReference — Collapsible panel above the conversation.
 * Collapsed by default, shows a compact bar. Expands to show reference content.
 */
export function QuickReference({ topic }: QuickReferenceProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const shortExplanation = getShortExplanation(topic.explanation);

  if (!isExpanded) {
    return (
      <div className="border-b border-border shrink-0">
        <button
          onClick={toggle}
          className="flex items-center justify-between w-full px-6 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          type="button"
          aria-expanded={false}
          aria-controls="quick-reference-panel"
        >
          <span>📖 Quick Reference</span>
          <span className="text-xs">[▼ show]</span>
        </button>
      </div>
    );
  }

  return (
    <div
      id="quick-reference-panel"
      className="border-b border-border shrink-0 max-h-[50vh] overflow-y-auto"
    >
      {/* Header with hide button */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-border/50 sticky top-0 bg-background z-10">
        <span className="text-sm font-medium text-foreground">📖 Quick Reference</span>
        <button
          onClick={toggle}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          type="button"
          aria-expanded={true}
          aria-controls="quick-reference-panel"
        >
          [▲ hide]
        </button>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-4">
        {/* Short explanation */}
        <section>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Overview
          </h4>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {shortExplanation}
          </p>
        </section>

        {/* Analogy */}
        <section>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            💡 Analogy
          </h4>
          <p className="text-sm text-foreground/80 leading-relaxed italic">
            {topic.analogy.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ')}
          </p>
        </section>

        {/* Key Points */}
        <section>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Key Points
          </h4>
          <ul className="space-y-1" role="list" aria-label="Key points">
            {topic.keyPoints.map((point, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-foreground/90"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Exam Keywords */}
        <section>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Exam Keywords
          </h4>
          <div className="flex flex-wrap gap-2" role="list" aria-label="Exam keywords">
            {topic.examKeywords.map((keyword) => (
              <KeywordBadge key={keyword.term} keyword={keyword} />
            ))}
          </div>
        </section>

        {/* Related Topics */}
        {topic.relatedTopics.length > 0 && (
          <section>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Related Topics
            </h4>
            <div className="flex flex-wrap gap-2" role="list" aria-label="Related topics">
              {topic.relatedTopics.map((relatedId) => (
                <Link key={relatedId} href={`/topics/${relatedId}`} role="listitem">
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/60 transition-colors capitalize"
                  >
                    {relatedId.replace(/-/g, ' ')}
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
