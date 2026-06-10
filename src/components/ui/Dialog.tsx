'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

/**
 * Shared dialog primitive (Session 5). Owns the BEHAVIOR — `role="dialog"`,
 * `aria-modal`, labelled/described-by, focus-move-on-open, Tab focus trap,
 * Escape to close, and focus-return to the trigger on close. It is
 * deliberately HEADLESS about styling: each consumer passes its own panel
 * `className` (CookieConsent keeps its bottom slide-in; the escape hatch is a
 * centred modal over a dim backdrop). Extracted from CookieConsent's pattern
 * per the build brief; CookieConsent is refactored to use it (no behaviour
 * change), and the escape-hatch panel is built on it.
 *
 * `useFocusTrap` is exported separately for any future surface that needs the
 * trap without the full Dialog wrapper.
 */

interface UseFocusTrapOptions {
  active: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
  onEscape?: () => void;
  /** Focused on open; falls back to the first focusable element. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** Focus returns here on close (usually the trigger). */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap({
  active,
  containerRef,
  onEscape,
  initialFocusRef,
  returnFocusRef,
}: UseFocusTrapOptions): void {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    const previouslyFocused = (returnFocusRef?.current ??
      (document.activeElement as HTMLElement | null)) as HTMLElement | null;

    // Move focus in.
    const initial =
      initialFocusRef?.current ?? container?.querySelector<HTMLElement>(FOCUSABLE);
    initial?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape?.();
        return;
      }
      if (e.key !== 'Tab' || !container) return;
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      // Restore focus to the trigger on close.
      previouslyFocused?.focus?.();
    };
  }, [active, containerRef, onEscape, initialFocusRef, returnFocusRef]);
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Accessible label — either an id of an existing heading, or a string. */
  ariaLabelledby?: string;
  ariaLabel?: string;
  ariaDescribedby?: string;
  /** Class for the dialog panel itself. */
  className?: string;
  /** When true, renders a dim backdrop; clicking it calls onClose. */
  backdrop?: boolean;
  /** Class for the backdrop wrapper (positioning). */
  backdropClassName?: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  children: ReactNode;
}

export function Dialog({
  open,
  onClose,
  ariaLabelledby,
  ariaLabel,
  ariaDescribedby,
  className,
  backdrop = false,
  backdropClassName,
  initialFocusRef,
  returnFocusRef,
  children,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const generatedLabelId = useId();

  useFocusTrap({
    active: open,
    containerRef: panelRef,
    onEscape: onClose,
    initialFocusRef,
    returnFocusRef,
  });

  if (!open) return null;

  const panel = (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      {...(ariaLabelledby ? { 'aria-labelledby': ariaLabelledby } : {})}
      {...(!ariaLabelledby && ariaLabel ? { 'aria-label': ariaLabel } : {})}
      {...(ariaDescribedby ? { 'aria-describedby': ariaDescribedby } : {})}
      id={ariaLabelledby ? undefined : generatedLabelId}
      className={className}
    >
      {children}
    </div>
  );

  if (!backdrop) return panel;

  return (
    <div
      className={backdropClassName}
      onMouseDown={(e) => {
        // Close only on a backdrop click, not a click that started in the panel.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {panel}
    </div>
  );
}
