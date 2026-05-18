/**
 * Accessibility utilities for MiQuali.
 *
 * Provides helpers for:
 * - Screen reader announcements via live regions
 * - Focus trapping for modals and popups
 *
 * Validates: Requirements 15.2, 15.3, 15.4
 */

import { type RefObject } from 'react';

// ─── Screen Reader Announcements ─────────────────────────────────────────────

/**
 * Announces a message to screen readers by injecting a visually hidden
 * live region into the DOM. The element is automatically removed after
 * the announcement is processed.
 *
 * @param message - The text to announce
 * @param priority - 'polite' for non-urgent updates, 'assertive' for critical alerts
 *
 * @example
 * ```ts
 * announceToScreenReader('Quiz submitted successfully');
 * announceToScreenReader('Error: connection failed', 'assertive');
 * ```
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof document === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');

  // Visually hidden but accessible to screen readers
  Object.assign(announcement.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  });

  document.body.appendChild(announcement);

  // Delay setting text content so the live region is registered first
  requestAnimationFrame(() => {
    announcement.textContent = message;
  });

  // Remove after screen reader has time to process (1 second)
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// ─── Focus Trapping ──────────────────────────────────────────────────────────

/** Selector for all focusable elements within a container */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'details',
  'summary',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
].join(', ');

/**
 * Returns all focusable elements within a container, in DOM order.
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
  );
}

/**
 * Creates a focus trap within a container element. While active, Tab and
 * Shift+Tab cycle through focusable elements inside the container without
 * escaping to the rest of the page.
 *
 * Returns a cleanup function that removes the event listener.
 *
 * @param containerRef - React ref to the container element
 * @returns A cleanup function to deactivate the trap
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   const cleanup = trapFocus(modalRef);
 *   return cleanup;
 * }, []);
 * ```
 */
export function trapFocus(containerRef: RefObject<HTMLElement | null>): () => void {
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift+Tab: if focus is on first element, wrap to last
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab: if focus is on last element, wrap to first
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Moves focus to the first focusable element within a container.
 * Useful for modals and dialogs that need initial focus placement.
 *
 * @param containerRef - React ref to the container element
 */
export function focusFirstElement(containerRef: RefObject<HTMLElement | null>): void {
  const container = containerRef.current;
  if (!container) return;

  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
}

/**
 * Stores the currently focused element and returns a function to restore
 * focus back to it. Useful for modals that need to return focus on close.
 *
 * @returns A function that restores focus to the previously active element
 *
 * @example
 * ```tsx
 * const restoreFocus = saveFocus();
 * // ... open modal ...
 * // On close:
 * restoreFocus();
 * ```
 */
export function saveFocus(): () => void {
  const previouslyFocused = document.activeElement as HTMLElement | null;

  return () => {
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
  };
}
