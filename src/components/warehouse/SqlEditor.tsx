import { useEffect, useRef, useState } from "react";
import { useTypewriter } from "@/hooks/use-typewriter";
import { CircleHelp, Play, RotateCcw, TriangleAlert } from "lucide-react";
import { COLUMNS, tokenize } from "@/lib/sql";

interface Props {
  value: string;
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
  const { typed, done } = useTypewriter(typeIn && fontsReady ? value : "", {
    step: 1,
    tick: 15,
  });
  useEffect(() => {
    if (typeIn && fontsReady && done) onTyped?.();
    // fires once, when the opening query finishes typing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeIn, fontsReady, done]);
  const shown = typeIn ? typed : value;
  const area = useRef<HTMLTextAreaElement>(null);
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
              <Highlighted sql={shown} error={typeIn ? null : error} />
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
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  onRun();
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
        <div className="absolute bottom-1.5 right-1.5 md:bottom-2 md:right-2">
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
