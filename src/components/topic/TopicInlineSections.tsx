'use client';

/**
 * TopicInlineSections — Client component that renders ConceptChat, MiniQuiz,
 * and AITutorChat as collapsible inline sections below the topic content.
 * No gating — user can expand any section freely.
 */

import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, MessageSquare, ClipboardCheck } from 'lucide-react';

import { ConceptChat } from '@/components/chat/ConceptChat';
import { MiniQuiz } from '@/components/quiz/MiniQuiz';
import { AITutorChat } from '@/components/chat/AITutorChat';
import type { QuizQuestion } from '@/types';

/** Props for the TopicInlineSections component */
export interface TopicInlineSectionsProps {
  /** The current topic ID */
  topicId: string;
  /** Pre-loaded quiz questions for this topic */
  questions: QuizQuestion[];
}

/**
 * CollapsibleSection — A generic collapsible wrapper with a header toggle.
 */
function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <section className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={toggle}
        className="flex items-center gap-3 w-full px-4 py-3 text-left bg-muted/30 hover:bg-muted/50 transition-colors"
        aria-expanded={isOpen}
        aria-controls={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
        type="button"
      >
        <span className="text-muted-foreground" aria-hidden="true">
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          {icon}
          {title}
        </span>
      </button>
      {isOpen && (
        <div
          id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
          className="p-4"
        >
          {children}
        </div>
      )}
    </section>
  );
}

/**
 * TopicInlineSections — Renders concept chat, mini-quiz, and AI tutor
 * as collapsible sections below the topic content. All start collapsed.
 */
export function TopicInlineSections({ topicId, questions }: TopicInlineSectionsProps) {
  return (
    <div className="px-4 sm:px-8 max-w-4xl mx-auto pb-24 space-y-4">
      {/* Concept Chat — collapsible */}
      <CollapsibleSection
        title="Concept Chat"
        icon={<MessageSquare className="h-4 w-4 text-blue-400" aria-hidden="true" />}
      >
        <ConceptChat topicId={topicId} />
      </CollapsibleSection>

      {/* Mini-Quiz — collapsible */}
      <CollapsibleSection
        title="Mini-Quiz"
        icon={<ClipboardCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />}
      >
        <MiniQuiz topicId={topicId} questions={questions} />
      </CollapsibleSection>

      {/* AI Tutor Chat — docked at bottom (already handles its own expand/collapse) */}
      <AITutorChat topicId={topicId} />
    </div>
  );
}
