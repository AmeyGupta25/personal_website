import { SCHEMA, type Column, type CountRow } from "@/lib/sql";

const th = "border-b-4 border-wh-ink px-3 py-2.5 text-left text-[12px] font-bold uppercase tracking-[0.1em]";
const td = "border-b border-wh-line px-3 py-3 align-middle";

/** A grouped query's result: one line per value, with a bar sized by its count. */
export const CountTable = ({ rows, group, onPick }: { rows: CountRow[]; group: Column | null; onPick?: (value: string) => void }) => {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (!group) {
    // a plain COUNT(*): one number, shown big
    return (
      <div className="border-t-4 border-wh-ink px-3 py-6">
        <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-wh-mute">count</p>
        <p className="mt-1 text-[clamp(40px,6vw,72px)] font-extrabold leading-none tracking-[-0.03em] tabular-nums">{rows[0]?.count ?? 0}</p>
      </div>
    );
  }
  return (
    <table className="w-full border-collapse">
      <caption className="sr-only">How many of Amey’s roles and projects have each {group} value.</caption>
      <thead>
        <tr>
          <th className={th}>{group}</th>
          <th className={`${th} w-[55%]`}>count</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.key} className="wh-row" style={{ animationDelay: `${i * 30}ms` }}>
            <td className={`${td} text-[15px] font-bold`}>
              {onPick && r.key !== "NULL" ? (
                <button type="button" onClick={() => onPick(r.key!)} className="text-left underline decoration-wh-chip underline-offset-4 hover:decoration-wh-ink" title={`Show the rows with ${r.key}`}>
                  {r.key}
                </button>
              ) : (
                r.key
              )}
            </td>
            <td className={td}>
              <div className="flex items-center gap-2.5">
                <div className="h-3.5 rounded-sm bg-wh-ink" style={{ width: `${(r.count / max) * 100}%`, minWidth: "4px" }} aria-hidden />
                <span className="font-mono text-[13.5px] font-semibold tabular-nums">{r.count}</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/** DESCRIBE amey.work: every column with its type and what it holds. */
export const SchemaTable = () => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse">
      <caption className="sr-only">The columns of the amey.work table.</caption>
      <thead>
        <tr>
          <th className={th}>column</th>
          <th className={th}>type</th>
          <th className={th}>holds</th>
        </tr>
      </thead>
      <tbody>
        {SCHEMA.map((c) => (
          <tr key={c.column}>
            <td className={`${td} font-mono text-[14px] font-semibold`}>{c.column}</td>
            <td className={`${td} whitespace-nowrap font-mono text-[13.5px] text-wh-kw`}>{c.type}</td>
            <td className={`${td} text-[14.5px] text-wh-body`}>{c.note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
