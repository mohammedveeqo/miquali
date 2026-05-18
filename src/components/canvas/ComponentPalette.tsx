'use client';

/**
 * ComponentPalette — Left sidebar showing draggable AWS components grouped by category.
 * Non-MVP components are shown greyed out with a "Coming soon" tooltip.
 *
 * Validates: Requirements 6.1, 16.3
 */

import React, { useCallback } from 'react';
import {
  Server,
  Network,
  Globe,
  Lock,
  Wifi,
  ArrowRightLeft,
  Shield,
  Cloud,
  HardDrive,
  Database,
  Cpu,
  Users,
  Zap,
  Split,
  Table,
  Pin,
  Folder,
  Container,
  Scaling,
  Globe2,
  GitBranch,
  Cable,
  Key,
  Rocket,
  type LucideIcon,
} from 'lucide-react';
import { CANVAS_COMPONENTS, PALETTE_GROUPS } from './canvas-data';
import type { CanvasComponentDefinition } from '@/types';

/** Map component icon strings to Lucide icon components */
const ICON_MAP: Record<string, LucideIcon> = {
  network: Network,
  globe: Globe,
  lock: Lock,
  server: Server,
  container: Container,
  zap: Zap,
  scaling: Scaling,
  split: Split,
  wifi: Wifi,
  'arrow-right-left': ArrowRightLeft,
  table: Table,
  shield: Shield,
  pin: Pin,
  cloud: Cloud,
  'globe-2': Globe2,
  'hard-drive': HardDrive,
  folder: Folder,
  database: Database,
  cpu: Cpu,
  users: Users,
  'git-branch': GitBranch,
  cable: Cable,
  key: Key,
  rocket: Rocket,
};

/** Props for the ComponentPalette */
interface ComponentPaletteProps {
  /** Callback when a drag starts from the palette */
  onDragStart: (event: React.DragEvent, definition: CanvasComponentDefinition) => void;
}

export function ComponentPalette({ onDragStart }: ComponentPaletteProps) {
  const handleDragStart = useCallback(
    (event: React.DragEvent, def: CanvasComponentDefinition) => {
      if (!def.mvpEnabled) {
        event.preventDefault();
        return;
      }
      onDragStart(event, def);
    },
    [onDragStart]
  );

  return (
    <aside
      className="flex h-full w-[220px] flex-col overflow-y-auto border-r border-border bg-card p-3"
      aria-label="Component palette"
    >
      <h2 className="mb-3 text-sm font-semibold text-foreground">Components</h2>
      {PALETTE_GROUPS.map((group) => (
        <div key={group.label} className="mb-4">
          <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {group.label}
          </h3>
          <div className="flex flex-col gap-1">
            {group.componentIds.map((compId) => {
              const def = CANVAS_COMPONENTS.find((c) => c.id === compId);
              if (!def) return null;
              return (
                <PaletteItem
                  key={def.id}
                  definition={def}
                  onDragStart={handleDragStart}
                />
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}

/** Individual draggable palette item */
function PaletteItem({
  definition,
  onDragStart,
}: {
  definition: CanvasComponentDefinition;
  onDragStart: (event: React.DragEvent, def: CanvasComponentDefinition) => void;
}) {
  const IconComponent = ICON_MAP[definition.icon] || Server;
  const isDisabled = !definition.mvpEnabled;

  return (
    <div
      draggable={!isDisabled}
      onDragStart={(e) => onDragStart(e, definition)}
      className={`group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
        isDisabled
          ? 'cursor-not-allowed opacity-40'
          : 'cursor-grab hover:bg-accent active:cursor-grabbing'
      }`}
      title={isDisabled ? 'Coming soon' : definition.name}
      aria-label={`${definition.name}${isDisabled ? ' (coming soon)' : ''}`}
      tabIndex={isDisabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
        }
      }}
    >
      <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className={isDisabled ? 'text-muted-foreground' : 'text-foreground'}>
        {definition.name}
      </span>
      {isDisabled && (
        <span className="pointer-events-none absolute -top-8 left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block">
          Coming soon
        </span>
      )}
    </div>
  );
}
