import { useEffect, useState } from "react";

/** Reveals `text` a few characters per tick; `done` turns true once it's all shown. */
export function useTypewriter(text: string, { step = 2, tick = 16 } = {}) {
  const [shown, setShown] = useState(0);
  const done = shown >= text.length;

  useEffect(() => {
    if (done) return;
    const id = window.setTimeout(() => setShown((n) => Math.min(text.length, n + step)), tick);
    return () => clearTimeout(id);
  }, [shown, done, text.length, step, tick]);

  return { typed: text.slice(0, shown), done };
}
