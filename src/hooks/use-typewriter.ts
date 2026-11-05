import { useCallback, useEffect, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Reveals `text` a few characters per tick; `done` turns true once it's all shown.
    `finish` shows the rest at once. With reduced motion the text appears whole. */
export function useTypewriter(text: string, { step = 2, tick = 16 } = {}) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? Infinity : 0));
  const done = shown >= text.length;

  useEffect(() => {
    if (done) return;
    const id = window.setTimeout(() => setShown((n) => Math.min(text.length, n + step)), tick);
    return () => clearTimeout(id);
  }, [shown, done, text.length, step, tick]);

  const finish = useCallback(() => setShown(Infinity), []);
  return { typed: text.slice(0, shown), done, finish };
}
