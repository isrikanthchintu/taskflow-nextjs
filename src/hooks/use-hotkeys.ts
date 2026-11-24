"use client";

import { useEffect, useRef } from "react";

export type HotkeyHandlers = Partial<
  Record<"n" | "l" | "/" | "b" | "?" | "mod+k", () => void>
>;

const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return TYPING_TAGS.has(target.tagName) || target.isContentEditable;
}

export function isOverlayOpen(): boolean {
  return (
    document.querySelector(
      '[role="dialog"], [role="menu"], [role="alertdialog"]'
    ) !== null
  );
}

export function useHotkeys(handlers: HotkeyHandlers, enabled = true): void {
  const latest = useRef(handlers);

  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      const key = event.key.toLowerCase();

      if ((event.ctrlKey || event.metaKey) && !event.altKey && key === "k") {
        const open = latest.current["mod+k"];
        if (!open || isOverlayOpen()) return;
        event.preventDefault();
        open();
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target) || isOverlayOpen()) return;

      const handler =
        key === "n" || key === "l" || key === "b"
          ? latest.current[key]
          : key === "/" || key === "?"
            ? latest.current[key]
            : undefined;
      if (!handler) return;
      event.preventDefault();
      handler();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
