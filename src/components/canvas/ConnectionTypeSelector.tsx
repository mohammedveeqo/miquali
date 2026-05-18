'use client';

/**
 * ConnectionTypeSelector — Popup shown when a new edge is drawn between nodes.
 * Allows the user to select one of 8 connection types.
 *
 * Validates: Requirements 6.2
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { CONNECTION_TYPES } from './canvas-data';
import { trapFocus } from '@/lib/accessibility';
import type { ConnectionType } from '@/types';

interface ConnectionTypeSelectorProps {
  /** Screen position to render the popup */
  position: { x: number; y: number };
  /** Called when a connection type is selected */
  onSelect: (connectionType: ConnectionType) => void;
  /** Called when the popup is dismissed without selection */
  onCancel: () => void;
}

export function ConnectionTypeSelector({
  position,
  onSelect,
  onCancel,
}: ConnectionTypeSelectorProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onCancel();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    // Activate focus trap
    const cleanupTrap = trapFocus(panelRef);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      cleanupTrap();
    };
  }, [onCancel]);

  useEffect(() => {
    if (panelRef.current) {
      const firstButton = panelRef.current.querySelector('button');
      firstButton?.focus();
    }
  }, []);

  const handleSelect = useCallback(
    (ct: ConnectionType) => {
      onSelect(ct);
    },
    [onSelect]
  );

  return (
    <div
      ref={panelRef}
      className="absolute z-50 w-52 rounded-lg border border-border bg-popover p-2 shadow-lg"
      style={{ left: position.x, top: position.y }}
      role="menu"
      aria-label="Select connection type"
    >
      <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
        Connection Type
      </p>
      {CONNECTION_TYPES.map((ct) => (
        <button
          key={ct.id}
          onClick={() => handleSelect(ct)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelect(ct);
            }
          }}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent focus:bg-accent focus:outline-none"
          role="menuitem"
          aria-label={ct.name}
        >
          <span
            className="inline-block h-3 w-6 rounded-sm"
            style={{
              backgroundColor: ct.style.strokeColor,
              opacity: ct.style.strokeDasharray.length > 0 ? 0.7 : 1,
            }}
          />
          <span>{ct.name}</span>
        </button>
      ))}
    </div>
  );
}
