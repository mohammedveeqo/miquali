'use client';

/**
 * LearnTab — Compact reference card for a topic.
 * Shows a short explanation, analogy, key points, exam keywords, common mistakes,
 * and related topic links. No diagram (that's in the Draw tab).
 */

import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import type { TopicContent, KeywordReference } from '@/types';

/** Props for the LearnTab component */
export interface LearnTabProps {
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
 * LearnTab — Compact reference card that fills the viewport.
 * Designed to be scannable, not scrollable.
 */
export function LearnTab({ topic }: LearnTabProps) {
  const shortExplanation = getShortExplanation(topic.explanation);

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto px-6 py-5">
      {/* Short explanation */}
      <section aria-labelledby="learn-explanation">
        <h3 id="learn-explanation" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Overview
        </h3>
        <p className="text-sm text-foreground/90 leading-relaxed">
          {shortExplanation}
        </p>
      </section>

      {/* Analogy */}
      <section aria-labelledby="learn-analogy">
        <h3 id="learn-analogy" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          💡 Analogy
        </h3>
        <p className="text-sm text-foreground/80 leading-relaxed italic">
          {topic.analogy.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ')}
        </p>
      </section>

      {/* Key Points */}
      <section aria-labelledby="learn-keypoints">
        <h3 id="learn-keypoints" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Key Points
        </h3>
        <ul className="space-y-1.5" role="list" aria-label="Key points">
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
      <section aria-labelledby="learn-keywords">
        <h3 id="learn-keywords" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Exam Keywords
        </h3>
        <div className="flex flex-wrap gap-2" role="list" aria-label="Exam keywords">
          {topic.examKeywords.map((keyword) => (
            <KeywordBadge key={keyword.term} keyword={keyword} />
          ))}
        </div>
      </section>

      {/* Common Mistakes */}
      <section aria-labelledby="learn-mistakes">
        <h3 id="learn-mistakes" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          ⚠ Common Mistakes
        </h3>
        <ul className="space-y-1.5" role="list" aria-label="Common mistakes">
          {topic.commonMistakes.map((mistake, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm text-foreground/80"
            >
              <span className="mt-0.5 text-destructive shrink-0" aria-hidden="true">•</span>
              <span>{mistake}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Related Topics */}
      {topic.relatedTopics.length > 0 && (
        <section aria-labelledby="learn-related">
          <h3 id="learn-related" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Related Topics
          </h3>
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
  );
}
