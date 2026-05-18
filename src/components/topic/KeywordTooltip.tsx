'use client';

import * as React from 'react';
import Image from 'next/image';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { KeywordReference } from '@/types';

/** Props for the KeywordTooltip component */
export interface KeywordTooltipProps {
  /** The keyword reference containing term, type, definition, and optional SVG diagram */
  keyword: KeywordReference;
}

/**
 * Style configuration for each keyword type.
 * Maps keyword type to trigger styles and tooltip accent color.
 */
const KEYWORD_STYLES: Record<
  KeywordReference['type'],
  {
    trigger: string;
    underline: string;
    tooltipBorder: string;
    label: string;
  }
> = {
  'exam-signal': {
    trigger:
      'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 focus-visible:bg-amber-500/20',
    underline: 'decoration-amber-500',
    tooltipBorder: 'border-amber-500/50',
    label: 'Exam Signal',
  },
  'service-reference': {
    trigger:
      'bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 focus-visible:bg-blue-500/20',
    underline: 'decoration-blue-500',
    tooltipBorder: 'border-blue-500/50',
    label: 'AWS Service',
  },
  'architecture-term': {
    trigger:
      'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 focus-visible:bg-purple-500/20',
    underline: 'decoration-purple-500',
    tooltipBorder: 'border-purple-500/50',
    label: 'Architecture Term',
  },
};

/**
 * SVG icon displayed alongside service-reference keywords in the trigger.
 * Represents an AWS-style service icon indicator.
 */
function ServiceIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="inline-block h-3.5 w-3.5 mr-0.5 shrink-0"
      aria-hidden="true"
    >
      <path d="M8 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 1ZM10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM12.95 4.11a.75.75 0 1 0-1.06-1.06l-1.062 1.06a.75.75 0 0 0 1.061 1.062l1.06-1.061ZM15 8a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 15 8ZM11.888 12.95a.75.75 0 0 0 1.06-1.06l-1.06-1.062a.75.75 0 0 0-1.062 1.061l1.061 1.06ZM8 12a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 12ZM5.172 11.888a.75.75 0 0 0-1.06 1.06l1.06 1.062a.75.75 0 0 0 1.062-1.061l-1.061-1.06ZM4 8a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 4 8ZM4.11 5.172A.75.75 0 0 0 5.173 4.11L4.11 3.05a.75.75 0 1 0-1.06 1.06l1.06 1.062Z" />
    </svg>
  );
}

/**
 * KeywordTooltip — Client component that renders an inline keyword with a
 * styled tooltip. Supports three visual styles based on keyword type:
 *
 * - **exam-signal**: Gold underline/highlight, tooltip shows definition + exam context
 * - **service-reference**: Blue underline/highlight with SVG icon, tooltip shows definition + optional diagram
 * - **architecture-term**: Purple underline/highlight, tooltip shows definition
 *
 * Activation:
 * - Desktop: hover to show tooltip
 * - Mobile: tap to toggle tooltip visibility
 * - Keyboard: focusable with Tab, tooltip shows on focus
 *
 * Accessibility:
 * - role="term" on the trigger element
 * - aria-describedby pointing to tooltip content
 * - Keyboard accessible via Radix Tooltip (focus triggers tooltip)
 *
 * Validates: Requirements 1.2, 1.3, 15.4
 */
export function KeywordTooltip({ keyword }: KeywordTooltipProps) {
  const [open, setOpen] = React.useState(false);
  const tooltipId = React.useId();
  const style = KEYWORD_STYLES[keyword.type];

  /**
   * Handle tap/click on mobile to toggle tooltip.
   * On touch devices, we toggle the open state manually.
   */
  const handleTouchEnd = React.useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      setOpen((prev) => !prev);
    },
    []
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <span
            role="term"
            aria-describedby={open ? tooltipId : undefined}
            tabIndex={0}
            onTouchEnd={handleTouchEnd}
            className={cn(
              'inline-flex items-center cursor-pointer rounded px-1 py-0.5 text-sm font-medium underline underline-offset-2 decoration-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              style.trigger,
              style.underline
            )}
          >
            {keyword.type === 'service-reference' && <ServiceIcon />}
            {keyword.term}
          </span>
        </TooltipTrigger>
        <TooltipContent
          id={tooltipId}
          side="top"
          align="center"
          sideOffset={6}
          className={cn(
            'max-w-xs p-3 space-y-2',
            style.tooltipBorder,
            'border-2'
          )}
        >
          {/* Type label */}
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'inline-block h-2 w-2 rounded-full',
                keyword.type === 'exam-signal' && 'bg-amber-500',
                keyword.type === 'service-reference' && 'bg-blue-500',
                keyword.type === 'architecture-term' && 'bg-purple-500'
              )}
              aria-hidden="true"
            />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {style.label}
            </span>
          </div>

          {/* Term */}
          <p className="text-sm font-semibold text-foreground">
            {keyword.term}
          </p>

          {/* Definition */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {keyword.definition}
          </p>

          {/* Optional mini-diagram SVG */}
          {keyword.svgDiagram && (
            <div className="mt-2 rounded border border-border bg-background/50 p-2">
              <Image
                src={keyword.svgDiagram}
                alt={`Diagram illustrating ${keyword.term}`}
                width={240}
                height={120}
                className="w-full h-auto"
                unoptimized
              />
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
