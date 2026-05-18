'use client';

/**
 * DrawTab — Canvas placeholder for diagram tasks.
 * Only visible at cluster gates (last topic in a cluster).
 * For non-gate topics, shows a message that it's not available.
 */

import { Map } from 'lucide-react';

/** Props for the DrawTab component */
export interface DrawTabProps {
  /** Whether this topic is a cluster gate (last topic in its cluster) */
  isClusterGate: boolean;
  /** The cluster ID this topic belongs to */
  clusterId: string;
}

/**
 * DrawTab — Shows a placeholder for the diagram canvas.
 * Full React Flow canvas will be implemented in a future iteration.
 */
export function DrawTab({ isClusterGate, clusterId }: DrawTabProps) {
  if (!isClusterGate) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
        <Map className="h-10 w-10 text-zinc-600" aria-hidden="true" />
        <h3 className="text-base font-medium text-muted-foreground">
          Draw tab available at cluster gates
        </h3>
        <p className="text-sm text-zinc-500 text-center max-w-md">
          Complete all topics in this cluster to unlock the architecture diagram challenge.
          The Draw tab will appear on the last topic of each cluster.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
      <Map className="h-10 w-10 text-blue-400" aria-hidden="true" />
      <h3 className="text-base font-medium text-foreground">
        Architecture Diagram Challenge
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        Draw the architecture for cluster <span className="font-mono text-foreground">{clusterId}</span>.
        Use the canvas below to place components and create connections.
      </p>
      <div
        className="w-full max-w-2xl h-64 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 flex items-center justify-center"
        role="img"
        aria-label="Diagram canvas placeholder"
      >
        <p className="text-sm text-zinc-600">
          React Flow canvas — coming soon
        </p>
      </div>
      <p className="text-xs text-zinc-500">
        Progressive hints will guide you through the challenge.
      </p>
    </div>
  );
}
