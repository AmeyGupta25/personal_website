import { useEffect, useMemo, useRef, useState } from "react";
import { useTypewriter } from "@/hooks/use-typewriter";
import {
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Play,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import { COLUMNS, complete, tokenize } from "@/lib/sql";
import { completionValues } from "@/lib/warehouse";

interface Props {
  value: string;
  /** Queries that ran, oldest first: ↑ and ↓ step through them. */
  history?: string[];
  /** Type `value` out once on load (read-only while it types), then hand over to editing. */
  typeIn?: boolean;
  onTyped?: () => void;
  error: { message: string; at: number } | null;
  custom: boolean;
  onChange: (sql: string) => void;
  onRun: () => void;
  onReset: () => void;
}

type SqlError = { message: string; at: number } | null;

/** The token a parse error points at: the one under its position, else the next, else the last. */
const errorToken = (toks: ReturnType<typeof tokenize>, at: number) => {
  const solid = toks
    .map((t, i) => [t, i] as const)
    .filter(([t]) => t.kind !== "ws");
  const hit =
    solid.find(([t]) => at >= t.start && at < t.start + t.text.length) ??
    solid.find(([t]) => t.start >= at) ??
    solid[solid.length - 1];
  return hit ? hit[1] : -1;
};

/** The same text the textarea holds, coloured; it sits underneath and the textarea is transparent.
    The token an error points at turns red and explains itself on hover. */
const Highlighted = ({ sql, error }: { sql: string; error: SqlError }) => {
  const toks = tokenize(sql);
  const bad = error ? errorToken(toks, error.at) : -1;
  return (
    <>
      {toks.map((t, i) =>
        i === bad ? (
          // positioned above the transparent textarea so it can take the hover
          <span
            key={i}
            className="group/err pointer-events-auto relative z-10 cursor-help rounded-sm bg-wh-err/10 text-wh-err underline decoration-wh-err decoration-wavy underline-offset-4"
          >
            {t.text}
            <span
              role="tooltip"
              className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-max max-w-[min(28rem,75vw)] whitespace-normal rounded-lg bg-wh-ink px-3 py-2 font-sans text-[13px] font-semibold leading-snug text-wh-paper shadow-[0_8px_20px_-8px_rgb(0_0_0/0.5)] group-hover/err:block"
            >
              {error!.message}
            </span>
          </span>
        ) : (
          <span
            key={i}
            className={
              t.kind === "kw"
                ? "text-wh-kw"
                : t.kind === "str"
                  ? "text-wh-str"
                  : undefined
            }
          >
            {t.text}
          </span>
        ),
      )}
    </>
  );
};

const SqlEditor = ({
  value,
  history = [],
  typeIn = false,
  onTyped,
  error,
  custom,
  onChange,
  onRun,
  onReset,
}: Props) => {
  const [help, setHelp] = useState(false);
  const [fontsReady, setFontsReady] = useState(
    () => !document.fonts || document.fonts.status === "loaded",
  );
  useEffect(() => {
    if (fontsReady) return;
    let live = true;
    document.fonts.ready.then(() => live && setFontsReady(true));
    return () => {
      live = false;
    };
  }, [fontsReady]);
  const { typed, done, finish } = useTypewriter(
    typeIn && fontsReady ? value : "",
    { step: 1, tick: 15 },
  );
  // no one has to wait for the opening query: any click or key press finishes it at once
  const typing = typeIn && !done;
  useEffect(() => {
    if (!typing) return;
    const skip = () => finish();
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });
    return () => {
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, [typing, finish]);
  useEffect(() => {
    if (typeIn && fontsReady && done) onTyped?.();
    // fires once, when the opening query finishes typing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeIn, fontsReady, done]);
  const shown = typeIn ? typed : value;
  const area = useRef<HTMLTextAreaElement>(null);

  // completion, the way Google Docs does it: the rest of the likeliest word shows faded after
  // the caret; Tab (or a tap on it) takes it, Esc hides it until the next keystroke
  const [caret, setCaret] = useState<number | null>(null);
  const [hidden, setHidden] = useState(false);
  const suggest = useMemo(() => {
    // only at the end of a line: the faded text would otherwise push the rest of the line out of
    // step with the invisible textarea the visitor is actually typing in
    if (typeIn || caret == null || hidden) return null;
    const rest = shown.slice(caret);
    if (rest && !rest.startsWith("\n")) return null;
    const c = complete(shown, caret, completionValues, { prefixOnly: true });
    return c.options.length ? c : null;
  }, [typeIn, caret, hidden, shown]);
  const best = suggest?.options[0] ?? null;
  const ghost =
    suggest && best && caret != null
      ? best.slice(caret - suggest.from) +
        (suggest.quoted && shown[caret] !== "'" ? "'" : "")
      : "";
  const placeCaret = (pos: number) =>
    requestAnimationFrame(() => {
      area.current?.setSelectionRange(pos, pos);
      setCaret(pos);
    });
  const accept = (opt: string) => {
    if (!suggest || caret == null) return;
    const close = suggest.quoted && shown[caret] !== "'" ? "'" : "";
    const space = !suggest.quoted && !opt.endsWith("(") && shown[caret] !== " " ? " " : "";
    const insert = opt + close + space;
    onChange(shown.slice(0, suggest.from) + insert + shown.slice(caret));
    placeCaret(suggest.from + insert.length);
  };
  const trackCaret = (e: { currentTarget: HTMLTextAreaElement }) => {
    const t = e.currentTarget;
    setCaret(t.selectionStart === t.selectionEnd ? t.selectionStart : null);
  };

  // history: ↑ on the first line (or the ▲ button) goes back, ↓ on the last line (or ▼) comes forward
  const [step, setStep] = useState<number | null>(null);
  useEffect(() => setStep(null), [history.length]);
  const last = history.length - 1;
  // the query on screen is usually the newest one run, so going back starts from the one before it
  const prev =
    step == null ? (history[last] === shown.trim() ? last - 1 : last) : step - 1;
  const next = step != null && step < last ? step + 1 : null;
  const recall = (to: number | null) => {
    if (to == null || to < 0 || to > last) return;
    setStep(to);
    const text = history[to];
    onChange(text);
    placeCaret(text.length);
  };
  const shared =
    "col-start-1 row-start-1 m-0 whitespace-pre-wrap break-words [font-variant-ligatures:none] px-4 py-3.5 font-mono text-[13.5px] font-semibold leading-[1.5] md:px-5 md:py-4 md:text-[18px]";
  return (
    <div>
      <div
        className={`relative rounded-xl border-[3px] transition-colors ${error ? "border-wh-err" : "border-wh-ink"} focus-within:shadow-[0_0_0_4px_rgb(var(--wh-hl))]`}
      >
        {/* a fixed base height with the query centred in it (equal space above and below);
            longer queries grow the box from there */}
        <div
          className="flex min-h-[96px] cursor-text items-center pr-[8.5rem] md:min-h-[120px] md:pr-[11rem]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              area.current?.focus();
            }
          }}
        >
          <div className="grid w-full">
            <pre
              aria-hidden
              className={`${shared} pointer-events-none text-wh-ink`}
            >
              {ghost && caret != null ? (
                <>
                  <Highlighted sql={shown.slice(0, caret)} error={error && error.at < caret ? error : null} />
                  {/* above the transparent textarea, so a tap can take it on touch screens */}
                  <span
                    className="pointer-events-auto relative z-10 cursor-pointer text-wh-mute/60"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      accept(best!);
                    }}
                  >
                    {ghost}
                    <span className="ml-2 inline-block rounded border border-wh-mute/40 px-1 align-[0.15em] font-sans text-[0.6em] font-bold uppercase leading-[1.4] tracking-[0.06em] text-wh-mute/70">
                      tab
                    </span>
                  </span>
                  <Highlighted sql={shown.slice(caret)} error={error && error.at >= caret ? { ...error, at: error.at - caret } : null} />
                </>
              ) : (
                <Highlighted sql={shown} error={typeIn ? null : error} />
              )}
              {typeIn && !done && (
                <>
                  <span className="wh-caret" />
                  {/* the rest of the query, laid out but invisible, so the box is its final
                      size from the first frame and nothing re-centres as lines are typed */}
                  <span className="invisible">{value.slice(shown.length)}</span>
                </>
              )}
              {/* keeps a trailing newline's height */}
              {"\n"}
            </pre>
            <textarea
              ref={area}
              // one row minimum, so the visible query (not a default two-row box) sets the height
              rows={1}
              value={shown}
              readOnly={typeIn}
              onChange={(e) => {
                setHidden(false);
                trackCaret(e);
                onChange(e.target.value);
              }}
              onSelect={trackCaret}
              onFocus={trackCaret}
              onBlur={() => setCaret(null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  onRun();
                  return;
                }
                if (best && e.key === "Tab" && !e.shiftKey) {
                  e.preventDefault();
                  accept(best);
                  return;
                }
                if (best && e.key === "Escape") {
                  e.preventDefault();
                  setHidden(true);
                  return;
                }
                const t = e.currentTarget;
                const flat = t.selectionStart === t.selectionEnd;
                if (flat && prev >= 0 && e.key === "ArrowUp" && !t.value.slice(0, t.selectionStart).includes("\n")) {
                  e.preventDefault();
                  recall(prev);
                } else if (flat && next != null && e.key === "ArrowDown" && !t.value.slice(t.selectionEnd).includes("\n")) {
                  e.preventDefault();
                  recall(next);
                }
              }}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              aria-label="SQL query. Edit it and press Command or Control plus Enter to run."
              aria-invalid={!!error}
              aria-describedby="sql-status"
              className={`${shared} resize-none overflow-hidden bg-transparent text-transparent caret-wh-ink outline-none selection:bg-wh-hl/70`}
            />
          </div>
        </div>
        <div className="absolute right-2.5 top-2.5 flex flex-col items-end gap-1.5 md:right-3 md:top-3">
          {/* the toolbar: revert beside run, the way code editors pair them */}
          <div className="flex items-center gap-1.5">
            {custom && (
              <button
                type="button"
                onClick={onReset}
                aria-label="Reset query"
                title="Reset to the filters' query"
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-wh-ink bg-wh-paper px-2 py-[4px] text-[13px] font-bold hover:bg-wh-soft md:px-2.5 md:text-[14px]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden md:inline">Reset</span>
              </button>
            )}
            <button
              type="button"
              onClick={onRun}
              title="Run · ⌘/Ctrl + Enter"
              aria-keyshortcuts="Meta+Enter Control+Enter"
              className="inline-flex items-center gap-1.5 rounded-lg bg-wh-ink px-3 py-1.5 text-[13px] font-bold text-wh-paper hover:bg-wh-body md:text-[14px]"
            >
              <Play className="h-3.5 w-3.5" aria-hidden />
              Run
            </button>
          </div>
        </div>
        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 md:bottom-2 md:right-2">
          {/* history, beside help: the queries you've run, newest last */}
          {[
            { to: prev >= 0 ? prev : null, label: "Previous query", key: "↑", Icon: ChevronUp },
            { to: next, label: "Next query", key: "↓", Icon: ChevronDown },
          ].map(({ to, label, key, Icon }) => (
            <button
              key={label}
              type="button"
              disabled={typeIn || to == null}
              onClick={() => recall(to)}
              aria-label={label}
              title={`${label} · ${key} in the editor`}
              className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-wh-soft disabled:cursor-default disabled:text-wh-faint disabled:hover:bg-transparent"
            >
              <Icon className="h-5 w-5" aria-hidden />
            </button>
          ))}
          <button
            type="button"
            aria-expanded={help}
            aria-controls="sql-help"
            onClick={() => setHelp((h) => !h)}
            aria-label="How to query"
            title="How to query"
            className={`grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-wh-soft ${help ? "bg-wh-soft" : ""}`}
          >
            <CircleHelp className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      {help && (
        <div
          id="sql-help"
          className="mt-3.5 rounded-xl border-2 border-wh-line bg-wh-soft px-4 py-3.5 text-[14px] leading-relaxed"
        >
          <p>
            <b>Table:</b> <code className="font-mono">amey.work</code> ·{" "}
            <b>Columns:</b>{" "}
            <span className="font-mono text-[13px]">{COLUMNS.join(", ")}</span>
          </p>
          <p className="mt-1 text-wh-body">
            Text in <code className="font-mono">'single quotes'</code> matches
            without caring about capitals. Lists (skills, areas, years) use{" "}
            <code className="font-mono">'Python' = ANY(skills)</code> or{" "}
            <code className="font-mono">skills && ARRAY['Python', 'SQL']</code>.
            Also: AND, OR, NOT, IN, LIKE / ILIKE with %, IS NULL, ORDER BY,
            LIMIT.
          </p>
          <p className="mt-1 text-wh-body">
            Count things with{" "}
            <code className="font-mono">SELECT skills, COUNT(*) FROM amey.work GROUP BY skills</code>
            , and see every column with{" "}
            <code className="font-mono">DESCRIBE amey.work</code>. Tab completes
            names and values as you type; ▲ / ▼ (or ↑ / ↓) step through queries you've run.
          </p>
        </div>
      )}

      <p id="sql-status" role="status" className="sr-only">
        {error ? `Error: ${error.message}` : ""}
      </p>
      {error && (
        <p className="mt-2 hidden items-center gap-1.5 text-[13px] font-semibold text-wh-err [@media(hover:none)]:flex">
          <TriangleAlert className="h-4 w-4 flex-none" aria-hidden />
          {error.message}
        </p>
      )}
    </div>
  );
};

export default SqlEditor;
