import { Fragment } from "react";
import { ArrowUpDown, ArrowUpRight, ChevronDown } from "lucide-react";
import { period, yearsActive, type WorkRow } from "@/data/work";
import type { Column } from "@/lib/sql";
import type { SortKey } from "@/lib/warehouse";

interface Props {
  rows: WorkRow[];
  columns: Column[];
  /** The default four-column view (responsive hiding applies); false for a custom SELECT. */
  standard: boolean;
  /** Header sorting only drives the filters' own sorts. */
  sortable: boolean;
  emptyText: string;
  /** The opening query is still typing: show the header, no rows and no empty message yet. */
  pending?: boolean;
  sort: SortKey;
  /** Changes on every new query, so the rows stream in again. */
  runId: number;
  openId: string | null;
  onOpen: (id: string | null) => void;
  onSort: (col: "name" | "when" | "impact") => void;
  onReset: () => void;
}

const Sortable = ({ label, active, onClick, ariaSort, className = "" }: { label: string; active: boolean; onClick: () => void; ariaSort: "ascending" | "descending" | "none"; className?: string }) => (
  <th aria-sort={ariaSort} className={`border-b-4 border-wh-ink p-0 text-left ${className}`}>
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-1.5 px-3 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] hover:bg-wh-soft ${active ? "" : "text-wh-ink"}`}>
      {label}
      <ArrowUpDown className={`h-3.5 w-3.5 ${active ? "text-wh-ink" : "text-wh-mute"}`} aria-hidden />
    </button>
  </th>
);

const LABEL: Record<Column, string> = {
  name: "Name", role: "Role", type: "Type", status: "Status", period: "Period", impact: "Impact", location: "Location",
  started: "Started", ended: "Ended", skills: "Skills", areas: "What I did", years: "Years",
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthLabel = (ym: [number, number] | null, open: string) => (ym ? `${MONTHS[ym[1] - 1]} ${ym[0]}` : open);

const cell = (r: WorkRow, c: Column) => {
  switch (c) {
    case "role": return r.role;
    case "type": return r.type;
    case "status": return r.from && !r.to ? "Current" : "Past";
    case "period": return period(r);
    case "impact": return r.impact;
    case "location": return r.location ?? "—";
    case "started": return monthLabel(r.from, "—");
    case "ended": return r.from ? monthLabel(r.to, "now") : "—";
    case "skills": return r.skills.join(", ");
    case "areas": return r.areas.join(", ");
    case "years": return yearsActive(r).join(", ") || "—";
    default: return r.name;
  }
};

/** The default view hides its secondary columns on small screens; a custom SELECT shows everything it asked for. */
const responsive = (c: Column, standard: boolean) => (!standard ? "" : c === "role" ? "hidden lg:table-cell" : c === "period" ? "hidden md:table-cell" : "");
const tdStyle: Partial<Record<Column, string>> = {
  role: "text-[15px]",
  period: "whitespace-nowrap font-mono text-[13.5px] tabular-nums text-wh-mute",
  started: "whitespace-nowrap font-mono text-[13.5px] tabular-nums text-wh-mute",
  ended: "whitespace-nowrap font-mono text-[13.5px] tabular-nums text-wh-mute",
  impact: "text-[18px] font-extrabold tracking-[-0.02em] md:whitespace-nowrap md:pl-8 md:text-[22px]",
  skills: "min-w-[14rem] text-[13.5px] leading-relaxed text-wh-body",
  areas: "min-w-[14rem] text-[13.5px] leading-relaxed text-wh-body",
};

const ResultsTable = ({ rows, columns, standard, sortable, sort, runId, openId, onOpen, onSort, onReset, emptyText, pending = false }: Props) => (
  <div className={standard ? "" : "overflow-x-auto"}>
  <table className={`w-full border-collapse ${standard ? "table-fixed md:table-auto" : ""}`}>
    <caption className="sr-only">Amey Gupta’s work, one row per role or project. Open a row for details.</caption>
    <thead>
      <tr>
        {columns.map((c) => {
          const key = c === "period" ? "when" : c;
          const can = sortable && (c === "name" || c === "period" || c === "impact");
          const active = (c === "name" && sort === "name") || (c === "impact" && sort === "impact") || (c === "period" && (sort === "recent" || sort === "oldest"));
          const extra = `${responsive(c, standard)} ${c === "impact" ? "md:pl-5" : ""}`;
          return can ? (
            <Sortable
              key={c}
              label={LABEL[c]}
              active={active}
              onClick={() => onSort(key as "name" | "when" | "impact")}
              ariaSort={!active ? "none" : sort === "oldest" || sort === "name" ? "ascending" : "descending"}
              className={extra}
            />
          ) : (
            <th key={c} className={`border-b-4 border-wh-ink px-3 py-2.5 text-left text-[12px] font-bold uppercase tracking-[0.1em] ${extra}`}>
              {LABEL[c]}
            </th>
          );
        })}
      </tr>
    </thead>
    {/* rows keep their identity across queries: only rows that are new to the result animate in */}
    <tbody>
      {rows.length === 0 && !pending && (
        <tr>
          <td colSpan={columns.length} className="px-3 py-8 text-[19px] text-wh-mute">
            {emptyText}{" "}
            <button type="button" onClick={onReset} className="font-semibold text-wh-ink underline underline-offset-4">
              Start over
            </button>
          </td>
        </tr>
      )}
      {rows.map((r, i) => {
        const open = openId === r.id;
        const detailId = `row-${r.id}`;
        return (
          <Fragment key={r.id}>
            <tr
              className={`wh-row group cursor-pointer ${open ? "bg-wh-hl" : "hover:bg-wh-hover"}`}
              // the opening run cascades; later queries only fade in the rows they add
              style={{ animationDelay: runId === 0 ? `${i * 70}ms` : "0ms" }}
              onClick={() => onOpen(open ? null : r.id)}
            >
              {columns.map((c, k) =>
                k === 0 ? (
                  <td key={c} className={`border-b border-wh-line px-3 py-4 align-top ${responsive(c, standard)}`}>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={detailId}
                      aria-label={c === "name" ? undefined : `${r.name}: show details`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(open ? null : r.id);
                      }}
                      className={`flex items-start gap-2 text-left ${c === "name" ? "text-[18px] font-extrabold leading-tight tracking-[-0.01em] md:text-[23px]" : tdStyle[c] ?? "text-[15px]"}`}
                    >
                      <ChevronDown className={`mt-1.5 h-4 w-4 flex-none transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
                      <span>
                        {cell(r, c)}
                        {c === "name" && (
                          <span className="mt-1.5 block w-fit rounded-full border-[1.5px] border-wh-ink px-2 py-px text-[11px] font-bold uppercase tracking-[0.08em]">{r.type}</span>
                        )}
                      </span>
                    </button>
                  </td>
                ) : (
                  <td key={c} className={`border-b border-wh-line px-3 py-4 align-top ${c === "name" ? "text-[18px] font-extrabold md:text-[21px]" : tdStyle[c] ?? "text-[15px]"} ${responsive(c, standard)}`}>
                    {cell(r, c)}
                  </td>
                ),
              )}
            </tr>
            {open && (
              <tr id={detailId} className="bg-wh-join">
                <td colSpan={columns.length} className="border-b-[3px] border-wh-ink px-3 pb-6 pt-4">
                  <p className="mb-2 font-mono text-[12px] text-wh-mute">
                    JOIN amey.details USING (id) → {r.role} · {period(r)}
                    {r.location ? ` · ${r.location}` : ""}
                  </p>
                  <p className="max-w-[68ch] text-[18px] leading-relaxed">{r.plain}</p>
                  <ul className="mt-3 max-w-[78ch] list-disc space-y-1.5 pl-5 text-[14.5px] leading-relaxed text-wh-body">
                    {r.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {r.metrics.map((m) => (
                      <span key={m} className="rounded-full border-[1.5px] border-wh-ink bg-wh-paper px-2.5 py-0.5 text-[12.5px] font-bold">
                        {m}
                      </span>
                    ))}
                    {r.skills.map((s) => (
                      <span key={s} className="rounded-full border-[1.5px] border-wh-chip bg-wh-paper px-2.5 py-0.5 text-[12.5px] font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                  {r.links && (
                    <p className="mt-4 flex flex-wrap gap-5">
                      {r.links.map((l) => (
                        <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[15px] font-bold text-wh-link underline underline-offset-4">
                          {l.label}
                          <ArrowUpRight className="h-4 w-4" aria-hidden />
                        </a>
                      ))}
                    </p>
                  )}
                </td>
              </tr>
            )}
          </Fragment>
        );
      })}
    </tbody>
  </table>
  </div>
);

export default ResultsTable;
