import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { activeCount, groups, optionCount, type Filters, type GroupKey, type MatchMode } from "@/lib/warehouse";

interface Props {
  filters: Filters;
  open: boolean;
  onToggle: (key: GroupKey, value: string) => void;
  onMode: (key: GroupKey, mode: MatchMode) => void;
  onClear: () => void;
  /** A typed query the filters can't express is running. */
  paused: boolean;
  onResume: () => void;
}

const FilterPanel = ({ filters, open, paused, onResume, onToggle, onMode, onClear }: Props) => {
  const active = activeCount(filters);
  // every group starts folded; visitors open the ones they care about
  const [expanded, setExpanded] = useState<Set<GroupKey>>(() => new Set());
  const flip = (k: GroupKey) =>
    setExpanded((cur) => {
      const next = new Set(cur);
      if (!next.delete(k)) next.add(k);
      return next;
    });
  return (
    <section
      id="filters"
      aria-label="Filters"
      className={`${open ? "block" : "hidden"} ${paused ? "[&_fieldset]:opacity-60" : ""} rounded-xl border-2 border-wh-ink px-4 pb-2 pt-3.5 md:sticky md:top-4 md:block md:max-h-[calc(100vh-2rem)] md:overflow-auto`}
    >
      <div className="flex items-center justify-between border-b border-wh-line pb-2.5">
        <h2 className="text-[15px] font-bold">Filters{active ? ` · ${active} on` : ""}</h2>
        <button type="button" onClick={onClear} disabled={!active} className="text-[13px] font-semibold underline underline-offset-[3px] disabled:text-wh-faint disabled:no-underline">
          Clear all
        </button>
      </div>
      {paused && (
        <div className="mt-3 rounded-lg border-[1.5px] border-wh-ink bg-wh-hl px-3 py-2.5 text-[13px] leading-snug">
          Your query is running, so the filters are paused. Picking any filter goes back to them.
          <button type="button" onClick={onResume} className="mt-1.5 block font-bold underline underline-offset-4">
            Back to filters
          </button>
        </div>
      )}
      {groups.map((g) => {
        const chosen = filters.selected[g.key];
        const mode = filters.modes[g.key] ?? "any";
        const isOpen = expanded.has(g.key);
        return (
          <div key={g.key} className="border-b border-wh-line last:border-0">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`fg-${g.key}`}
                onClick={() => flip(g.key)}
                className="flex flex-1 items-center gap-2 py-3 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-wh-mute hover:text-wh-ink"
              >
                <ChevronDown className={`h-4 w-4 flex-none transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`} aria-hidden />
                {g.label}
                {chosen.length > 0 && (
                  <span className="rounded-full border-[1.5px] border-wh-ink bg-wh-hl px-1.5 font-mono text-[11px] normal-case tracking-normal text-wh-ink">{chosen.length}</span>
                )}
              </button>
              {g.matchable && isOpen && (
                <span className="inline-flex overflow-hidden rounded-full border-[1.5px] border-wh-ink text-[11px]" role="group" aria-label={`Match ${g.label}`}>
                  {(["any", "all"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={mode === m}
                      onClick={() => onMode(g.key, m)}
                      className={`px-2 py-px font-bold ${mode === m ? "bg-wh-ink text-wh-paper" : "bg-wh-paper text-wh-ink"}`}
                      title={m === "any" ? "Rows with any selected value" : "Rows with every selected value"}
                    >
                      {m}
                    </button>
                  ))}
                </span>
              )}
            </div>
            {isOpen && (
            <fieldset id={`fg-${g.key}`} className="pb-3">
              <legend className="sr-only">{g.label}</legend>
            <div className="clear-both space-y-2.5">
              {(g.sections ?? [{ label: "", options: g.options }]).map((sec) => (
                <div key={sec.label || g.key}>
                  {sec.label && <p className="mb-1.5 text-[11.5px] font-semibold text-wh-mute">{sec.label}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {sec.options.map((o) => {
                      const on = chosen.includes(o);
                      const n = optionCount(filters, g, o);
                      return (
                        <button
                          key={o}
                          type="button"
                          aria-pressed={on}
                          disabled={!on && n === 0}
                          onClick={() => onToggle(g.key, o)}
                          className={`inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-2.5 py-1 text-[13px] font-semibold transition-colors ${
                            on ? "border-wh-ink bg-wh-hl" : "border-wh-chip bg-wh-paper hover:border-wh-ink"
                          } disabled:cursor-default disabled:opacity-40 disabled:hover:border-wh-chip`}
                        >
                          {o}
                          <span className="font-mono text-[11px] font-semibold tabular-nums text-wh-mute" aria-label={`${n} rows`}>
                            {n}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            </fieldset>
            )}
          </div>
        );
      })}
    </section>
  );
};

export default FilterPanel;
