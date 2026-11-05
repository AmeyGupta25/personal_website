import { useEffect, useMemo, useRef, useState } from "react";
import { Github, Linkedin, Shuffle, SlidersHorizontal, X } from "lucide-react";
import { person, rows as allRows } from "@/data/work";
import {
  activeCount,
  emptyFilters,
  filterRows,
  GROUP_OF,
  pickQuick,
  sortRows,
  queryToFilters,
  sqlText,
  type Filters,
  type GroupKey,
  type MatchMode,
  type QuickQuestion,
  type SortKey,
} from "@/lib/warehouse";
import {
  DEFAULT_COLUMNS,
  parse,
  run,
  runGrouped,
  SqlError,
  type Query,
} from "@/lib/sql";
import SqlEditor from "@/components/warehouse/SqlEditor";
import FilterPanel from "@/components/warehouse/FilterPanel";
import ResultsTable from "@/components/warehouse/ResultsTable";
import { CountTable, SchemaTable } from "@/components/warehouse/AggregateViews";
import EmailMenu from "@/components/warehouse/EmailMenu";

// a shared link carries its query (?q=) and open row (?row=); the opening query needs neither
const params = new URLSearchParams(location.search);
const sharedQuery = params.get("q");
const sharedRow = params.get("row");
const DEFAULT_SQL = sqlText(emptyFilters(), "recent", 1);

const contacts = [
  { href: person.linkedin, label: "LinkedIn", Icon: Linkedin },
  { href: person.github, label: "GitHub", Icon: Github },
];

const Index = () => {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState<SortKey>("recent");
  const [dir, setDir] = useState<1 | -1>(1);
  const [openId, setOpenId] = useState<string | null>(sharedRow);
  const [typed, setTyped] = useState(false);
  const [runId, setRunId] = useState(0);
  const [quick, setQuick] = useState<number | null>(null);
  // a different six every visit, and on demand
  const [questions, setQuestions] = useState<QuickQuestion[]>(() =>
    pickQuick(6),
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  // what the visitor has typed; null while the editor shows the filters' own query
  const [draft, setDraft] = useState<string | null>(sharedQuery);
  const [debounced, setDebounced] = useState<string | null>(sharedQuery);
  // queries that ran, newest last, for ↑ / ↓ in the editor
  const [history, setHistory] = useState<string[]>([]);
  // a shared link's row stays open through its own query's first run
  const keepRow = useRef(!!sharedRow);
  const [custom, setCustom] = useState<{ q: Query; mapped: boolean } | null>(
    null,
  );
  const [sqlError, setSqlError] = useState<{
    message: string;
    at: number;
  } | null>(null);

  const active = activeCount(filters);

  // typing runs the query after a short pause; Run (or ⌘/Ctrl + Enter) runs it at once
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(draft), 350);
    return () => clearTimeout(id);
  }, [draft]);
  useEffect(() => {
    if (debounced == null) return;
    try {
      const q = parse(debounced);
      const mapped = queryToFilters(q);
      setSqlError(null);
      setCustom({ q, mapped: !!mapped });
      if (keepRow.current) keepRow.current = false;
      else setOpenId(null);
      const text = debounced.trim();
      setHistory((h) =>
        h[h.length - 1] === text ? h : [...h, text].slice(-50),
      );
      // a query the filters can express moves the filters to match
      if (mapped) {
        setFilters(mapped.filters);
        setSort(mapped.sort);
        setDir(mapped.dir);
      } else {
        // a query the filters can't express: leave them clean rather than showing a stale selection
        setFilters(emptyFilters());
      }
    } catch (e) {
      // keep showing the last good result while the visitor is mid-edit
      if (e instanceof SqlError) setSqlError({ message: e.message, at: e.at });
    }
  }, [debounced]);

  const view: "rows" | "counts" | "schema" = !custom
    ? "rows"
    : custom.q.describe
      ? "schema"
      : custom.q.count || custom.q.group
        ? "counts"
        : "rows";
  const results = useMemo(
    () =>
      custom
        ? view === "rows"
          ? run(custom.q, allRows)
          : []
        : sortRows(filterRows(filters), sort, dir),
    [custom, view, filters, sort, dir],
  );
  const counts = useMemo(
    () => (custom && view === "counts" ? runGrouped(custom.q, allRows) : []),
    [custom, view],
  );
  const sql = draft ?? sqlText(filters, sort, dir);

  // the address bar always holds a link to what's on screen
  useEffect(() => {
    if (!typed) return;
    const next = new URLSearchParams(location.search);
    next.delete("q");
    next.delete("row");
    if (sql.trim() !== DEFAULT_SQL) next.set("q", sql.trim());
    if (openId) next.set("row", openId);
    const qs = next.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
  }, [typed, sql, openId]);

  // a shared row is scrolled into view once the opening query has run
  useEffect(() => {
    if (typed && sharedRow)
      document
        .getElementById(`row-${sharedRow}`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [typed]);
  const columns = custom ? custom.q.columns : DEFAULT_COLUMNS;
  const standard =
    !custom ||
    custom.q.star ||
    custom.q.columns.join() === DEFAULT_COLUMNS.join();
  const paused = !!custom && !custom.mapped;

  // every change is a new query: rows stream in again and any open row closes
  const rerun = (next: Filters, nextSort = sort, nextDir = dir) => {
    setDraft(null);
    setDebounced(null);
    setCustom(null);
    setSqlError(null);
    setFilters(next);
    setSort(nextSort);
    setDir(nextDir);
    setOpenId(null);
    setRunId((n) => n + 1);
  };
  const runSql = (text: string) => {
    setDraft(text);
    setDebounced(text);
    setRunId((n) => n + 1);
  };
  // a count's value opens the rows that hold it
  const pickGroup = (value: string) => {
    const key = custom?.q.group && GROUP_OF[custom.q.group];
    if (!key) return;
    setQuick(null);
    const next = emptyFilters();
    next.selected[key] = [value];
    rerun(next, "impact", 1);
  };
  const toggle = (key: GroupKey, value: string) => {
    const cur = filters.selected[key];
    setQuick(null);
    rerun({
      ...filters,
      selected: {
        ...filters.selected,
        [key]: cur.includes(value)
          ? cur.filter((v) => v !== value)
          : [...cur, value],
      },
    });
  };
  const setMode = (key: GroupKey, mode: MatchMode) =>
    rerun({ ...filters, modes: { ...filters.modes, [key]: mode } });
  const clear = () => {
    setQuick(null);
    rerun(emptyFilters(), "recent", 1);
  };
  const onSort = (col: "name" | "when" | "impact") => {
    setQuick(null);
    if (col === "when")
      return rerun(filters, sort === "recent" ? "oldest" : "recent");
    if (col === "name")
      return rerun(filters, "name", sort === "name" ? (dir === 1 ? -1 : 1) : 1);
    rerun(filters, "impact");
  };
  const chips = (
    Object.entries(filters.selected) as [GroupKey, string[]][]
  ).flatMap(([k, vs]) => vs.map((v) => ({ k, v })));

  return (
    <div className="min-h-screen bg-wh-paper text-wh-ink">
      <a
        href="#results"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-wh-ink focus:px-4 focus:py-2 focus:font-bold focus:text-wh-paper"
      >
        Skip to results
      </a>
      <header className="flex flex-wrap items-end justify-between gap-5 px-4 pb-5 pt-7 md:px-12">
        <div>
          <h1 className="text-[clamp(36px,4.4vw,56px)] font-extrabold uppercase leading-[0.95] tracking-[-0.03em]">
            Amey <span className="font-light">Gupta</span>
          </h1>
          <p className="mt-2 text-[15px] text-wh-mute">{person.line}</p>
        </div>
        <nav aria-label="Contact" className="flex flex-wrap gap-2">
          <EmailMenu email={person.email} />
          {contacts.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-wh-ink bg-wh-paper px-3.5 py-2 text-[14px] font-bold transition-colors hover:bg-wh-soft"
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main>
        <div className="px-4 md:px-12">
          {/* one editor throughout: it types the opening query itself, then becomes editable in place */}
          <SqlEditor
            value={sql}
            typeIn={!typed}
            history={history}
            onTyped={() => setTyped(true)}
            error={sqlError}
            custom={draft !== null}
            onChange={(text) => {
              setDraft(text);
              setQuick(null);
            }}
            onRun={() => runSql(sql)}
            onReset={() => rerun(filters)}
          />
        </div>

        <div
          className="flex flex-wrap items-center gap-2 px-4 pt-3.5 md:px-12"
          role="group"
          aria-label="Quick questions"
        >
          <span className="mr-1 text-[12px] font-bold uppercase tracking-[0.1em] text-wh-mute">
            Quick questions
          </span>
          {questions.map((q, i) => (
            <button
              key={q.label}
              type="button"
              aria-pressed={quick === i}
              onClick={() => {
                setQuick(i);
                if (q.sql) return runSql(q.sql);
                const { filters: f, sort: s } = q.apply();
                rerun(f, s, 1);
              }}
              className={`rounded-full border-2 border-wh-ink px-3.5 py-1.5 text-[14px] font-bold transition-colors ${quick === i ? "bg-wh-ink text-wh-paper" : "bg-wh-paper hover:bg-wh-soft"}`}
            >
              {q.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setQuestions((cur) => pickQuick(6, cur));
              setQuick(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] font-bold text-wh-ink underline underline-offset-4 hover:bg-wh-soft"
          >
            <Shuffle className="h-4 w-4" aria-hidden />
            Shuffle
          </button>
        </div>

        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-controls="filters"
          onClick={() => setFiltersOpen((o) => !o)}
          className="mx-4 mt-3.5 flex w-[calc(100%-2rem)] items-center justify-between rounded-lg border-2 border-wh-ink px-3.5 py-3 text-[16px] font-extrabold md:hidden"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            Filters
          </span>
          <span className="font-mono text-[13px] font-semibold text-wh-mute">
            {active ? `${active} on` : "none"}
          </span>
        </button>

        <div className="grid grid-cols-1 items-start gap-3 px-4 pb-14 pt-3.5 md:grid-cols-[260px_minmax(0,1fr)] md:gap-6 md:px-12 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-7">
          <FilterPanel
            filters={filters}
            open={filtersOpen}
            paused={paused}
            onResume={() => rerun(filters)}
            onToggle={toggle}
            onMode={setMode}
            onClear={clear}
          />
          <section id="results" aria-label="Results" className="min-w-0">
            <div className="flex min-h-[28px] flex-wrap items-center gap-2 pb-1 font-mono text-[13px] text-wh-mute">
              <span aria-live="polite">
                {view === "schema"
                  ? "amey.work · 12 columns"
                  : view === "counts"
                    ? `${counts.length} ${counts.length === 1 ? "row" : "rows"} · counted over ${allRows.length} rows${custom?.q.group && GROUP_OF[custom.q.group] ? " · pick a value to see its rows" : ""}`
                    : `${results.length} of ${allRows.length} rows${results.length ? " · open a row for details" : ""}${paused ? " · your query" : ""}`}
              </span>
              {!paused &&
                chips.map(({ k, v }) => (
                  <button
                    key={`${k}:${v}`}
                    type="button"
                    onClick={() => toggle(k, v)}
                    className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-wh-ink bg-wh-hl px-2.5 py-0.5 font-sans text-[12.5px] font-bold text-wh-ink"
                    aria-label={`Remove filter ${v}`}
                  >
                    {v}
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                ))}
            </div>
            {typed && view === "schema" && <SchemaTable />}
            {typed && view === "counts" && (
              <CountTable
                rows={counts}
                group={custom!.q.group}
                onPick={
                  custom?.q.group && GROUP_OF[custom.q.group]
                    ? pickGroup
                    : undefined
                }
              />
            )}
            {view === "rows" && (
              <ResultsTable
                rows={typed ? results : []}
                pending={!typed}
                columns={columns}
                standard={standard}
                sortable={!paused}
                emptyText={
                  paused
                    ? "Your query returned no rows."
                    : "No rows match every filter."
                }
                sort={sort}
                runId={runId}
                openId={openId}
                onOpen={setOpenId}
                onSort={onSort}
                onReset={clear}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;
