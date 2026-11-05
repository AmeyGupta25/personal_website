import { monthIndex, rows, status, yearsActive, type WorkRow } from "@/data/work";
import { DEFAULT_COLUMNS, type Column, type Expr, type Query } from "@/lib/sql";

export type GroupKey = "type" | "status" | "year" | "name" | "area" | "skill";
export type MatchMode = "any" | "all";
export type SortKey = "recent" | "oldest" | "impact" | "name";

export interface FilterGroup {
  key: GroupKey;
  label: string;
  values: (r: WorkRow) => string[];
  options: string[];
  /** Groups with many tags can require every selected value instead of any. */
  matchable?: boolean;
  /** Optional headed sub-lists inside the group; options keep their order within each. */
  sections?: { label: string; options: string[] }[];
}

export interface Filters {
  selected: Record<GroupKey, string[]>;
  modes: Partial<Record<GroupKey, MatchMode>>;
}

/** Options ordered by how many rows carry them, then alphabetically. */
const byFrequency = (values: string[]) => {
  const n = new Map<string, number>();
  values.forEach((v) => n.set(v, (n.get(v) ?? 0) + 1));
  return [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([v]) => v);
};

// skills sorted into the résumé's own categories; anything uncategorised lands in the last section
const SKILL_SECTIONS: [string, string[]][] = [
  ["Languages", ["Python", "SQL", "JavaScript", "Cython", "R", "Bash"]],
  ["Data & ML", ["LLMs", "Embeddings", "Pandas", "NumPy", "scikit-learn", "PyTorch", "XGBoost", "VADER", "Bayesian modelling", "Clustering", "Airflow", "dbt", "Databricks", "BeautifulSoup", "Selenium"]],
  ["Databases", ["PostgreSQL", "MySQL", "Pinecone", "SQLAlchemy", "Drizzle ORM", "Database indexing"]],
  ["Cloud & infra", ["AWS", "Cloudflare", "Cloudflare Workers", "Cloudflare Hyperdrive", "Docker", "Kubernetes", "Linux", "CI/CD", "Vercel"]],
  ["Frameworks & APIs", ["FastAPI", "Flask", "React", "Hono", "OpenAPI", "REST APIs", "Groq", "SEC EDGAR API", "ROR API"]],
  ["Analytics & business", ["Power BI", "Tableau", "Plotly.js", "Salesforce", "Product management"]],
];
const allSkills = byFrequency(rows.flatMap((r) => r.skills));
const skillSections = (() => {
  const placed = new Set(SKILL_SECTIONS.flatMap(([, o]) => o));
  const sections = SKILL_SECTIONS.map(([label, list]) => ({
    label,
    options: allSkills.filter((s) => list.includes(s)),
  }));
  const rest = allSkills.filter((s) => !placed.has(s));
  if (rest.length) sections[sections.length - 1].options.push(...rest);
  return sections.filter((s) => s.options.length);
})();

export const groups: FilterGroup[] = [
  { key: "type", label: "Type", values: (r) => [r.type], options: ["Internship", "Research", "Project", "Education"] },
  { key: "status", label: "Status", values: (r) => [status(r)], options: ["Current", "Past"] },
  { key: "year", label: "Year active", values: yearsActive, options: byFrequency(rows.flatMap(yearsActive)).sort() },
  { key: "name", label: "Name", values: (r) => [r.name], options: [...new Set(rows.map((r) => r.name))] },
  { key: "area", label: "What I did", values: (r) => r.areas, options: byFrequency(rows.flatMap((r) => r.areas)), matchable: true },
  { key: "skill", label: "Skills & tools", values: (r) => r.skills, options: allSkills, matchable: true, sections: skillSections },
];

export const emptyFilters = (): Filters => ({
  selected: { type: [], status: [], year: [], name: [], area: [], skill: [] },
  modes: { area: "any", skill: "any" },
});

export const activeCount = (f: Filters) => Object.values(f.selected).reduce((n, v) => n + v.length, 0);

const passes = (r: WorkRow, g: FilterGroup, f: Filters) => {
  const chosen = f.selected[g.key];
  if (!chosen.length) return true;
  const have = g.values(r);
  return f.modes[g.key] === "all" ? chosen.every((v) => have.includes(v)) : chosen.some((v) => have.includes(v));
};

/** Rows that pass every group, optionally ignoring one (for that group's own option counts). */
export const filterRows = (f: Filters, except?: GroupKey) =>
  rows.filter((r) => groups.every((g) => g.key === except || passes(r, g, f)));

/** How many rows would remain if this option were toggled into its group's selection. */
export const optionCount = (f: Filters, g: FilterGroup, option: string) => {
  const base = filterRows(f, g.key);
  if (f.modes[g.key] === "all") {
    const need = [...new Set([...f.selected[g.key], option])];
    return base.filter((r) => need.every((v) => g.values(r).includes(v))).length;
  }
  return base.filter((r) => g.values(r).includes(option)).length;
};

const startOf = (r: WorkRow) => (r.from ? monthIndex(r.from) : -1);
export const sortRows = (list: WorkRow[], key: SortKey, dir: 1 | -1 = 1) => {
  const s = list.slice();
  if (key === "recent") s.sort((a, b) => startOf(b) - startOf(a));
  if (key === "oldest") s.sort((a, b) => (a.from ? startOf(a) : Infinity) - (b.from ? startOf(b) : Infinity));
  if (key === "impact") s.sort((a, b) => b.impactRank - a.impactRank);
  if (key === "name") s.sort((a, b) => a.name.localeCompare(b.name) * dir);
  return s;
};

// ---------- the SQL the page shows, as tokens so it can be highlighted without HTML strings ----------
export type Token = { t: string; k?: "kw" | "str" };
const kw = (t: string): Token => ({ t, k: "kw" });
const str = (t: string): Token => ({ t: `'${t}'`, k: "str" });
const txt = (t: string): Token => ({ t });
const list = (vals: string[]) => vals.flatMap((v, i) => (i ? [txt(", "), str(v)] : [str(v)]));

const COLUMN: Record<GroupKey, string> = { type: "type", status: "status", year: "year", name: "name", area: "areas", skill: "skills" };

export const sqlTokens = (f: Filters, sort: SortKey, dir: 1 | -1 = 1): Token[] => {
  const where: Token[][] = groups
    .filter((g) => f.selected[g.key].length)
    .map((g) => {
      const v = f.selected[g.key];
      if (g.matchable) return [txt(`${COLUMN[g.key]} ${f.modes[g.key] === "all" ? "@>" : "&&"} ARRAY[`), ...list(v), txt("]")];
      if (g.key === "year") return [txt("active_in("), txt(v.join(", ")), txt(")")];
      return [txt(`${COLUMN[g.key]} `), kw("IN"), txt(" ("), ...list(v), txt(")")];
    });
  const order = { recent: "started DESC", oldest: "started ASC", impact: "impact DESC", name: dir === 1 ? "name ASC" : "name DESC" }[sort];
  return [
    kw("SELECT"), txt(" name, role, period, impact\n"),
    kw("FROM"), txt(" amey.work"),
    ...where.flatMap((w, i) => [txt("\n"), ...(i ? [txt("  "), kw("AND")] : [kw("WHERE")]), txt(" "), ...w]),
    txt("\n"), kw("ORDER BY"), txt(` ${order};`),
  ];
};

// ---------- one-click questions: a pool, shown six at a time and shuffled ----------
/** A one-click question: either a filter setting, or a query the filters can't express (counts). */
export type QuickQuestion =
  | { label: string; apply: () => { filters: Filters; sort: SortKey }; sql?: never }
  | { label: string; sql: string; apply?: never };
const withFilter = (pairs: [GroupKey, string[]][], sort: SortKey = "impact") => () => {
  const filters = emptyFilters();
  pairs.forEach(([k, v]) => (filters.selected[k] = v));
  return { filters, sort };
};
export const QUICK_POOL: QuickQuestion[] = [
  { label: "Biggest impact", apply: withFilter([]) },
  { label: "Most recent", apply: withFilter([], "recent") },
  { label: "Data pipelines", apply: withFilter([["area", ["Data pipelines & ETL"]]]) },
  { label: "Where I used Python", apply: withFilter([["skill", ["Python"]]]) },
  { label: "Where I used SQL", apply: withFilter([["skill", ["SQL"]]]) },
  { label: "Where I used Airflow", apply: withFilter([["skill", ["Airflow"]]]) },
  { label: "AI & LLM work", apply: withFilter([["area", ["AI & LLMs"]]], "recent") },
  { label: "Research work", apply: withFilter([["type", ["Research"]]]) },
  { label: "Side projects", apply: withFilter([["type", ["Project"]]]) },
  { label: "Education", apply: withFilter([["type", ["Education"]]]) },
  { label: "What I’m doing now", apply: withFilter([["status", ["Current"]]]) },
  { label: "Backend & APIs", apply: withFilter([["area", ["Backend & APIs"]]]) },
  { label: "Machine learning", apply: withFilter([["area", ["Machine learning"]]]) },
  { label: "Work from 2025", apply: withFilter([["year", ["2025"]]], "oldest") },
  { label: "Databases & warehousing", apply: withFilter([["area", ["Databases & warehousing"]]]) },
  { label: "Cloud work", apply: withFilter([["skill", ["AWS", "Cloudflare", "Cloudflare Workers", "Cloudflare Hyperdrive", "Vercel"]]]) },
  { label: "Web scraping", apply: withFilter([["skill", ["BeautifulSoup", "Selenium"]]]) },
  { label: "Performance wins", apply: withFilter([["area", ["Performance tuning"]]]) },
  { label: "Product & strategy", apply: withFilter([["area", ["Product & strategy"]]]) },
  { label: "Data quality", apply: withFilter([["area", ["Data quality"]]]) },
  { label: "PostgreSQL work", apply: withFilter([["skill", ["PostgreSQL"]]]) },
  { label: "Skills I use most", sql: "SELECT skills, COUNT(*)\nFROM amey.work\nGROUP BY skills\nORDER BY COUNT(*) DESC\nLIMIT 12;" },
  { label: "What I do most", sql: "SELECT areas, COUNT(*)\nFROM amey.work\nGROUP BY areas\nORDER BY COUNT(*) DESC;" },
];

/** The filter group a grouped column's values belong to, so a count can open its rows. */
export const GROUP_OF: Partial<Record<Column, GroupKey>> = { type: "type", status: "status", name: "name", skills: "skill", areas: "area", years: "year" };

/** Every value a quoted string in the editor can complete to. */
export const completionValues = [...new Set(groups.flatMap((g) => g.options))];

/** A fresh draw of n questions, avoiding the current set when the pool allows. */
export const pickQuick = (n: number, current: QuickQuestion[] = []) => {
  const fresh = QUICK_POOL.filter((q) => !current.includes(q));
  const source = fresh.length >= n ? fresh : QUICK_POOL.slice();
  for (let i = source.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [source[i], source[j]] = [source[j], source[i]];
  }
  return source.slice(0, n);
};

// ---------- typed SQL → filters, when the query is one the filters can express ----------

const FILTER_COLUMN: Partial<Record<Column, GroupKey>> = { type: "type", status: "status", name: "name", skills: "skill", areas: "area", years: "year" };

/** Match a typed value to the option's real spelling ('python' → 'Python'); null if no such option. */
const canonical = (key: GroupKey, v: string) => groups.find((g) => g.key === key)!.options.find((o) => o.toLowerCase() === v.toLowerCase()) ?? null;

export const queryToFilters = (q: Query): { filters: Filters; sort: SortKey; dir: 1 | -1 } | null => {
  if (q.describe || q.count || q.group) return null;
  const sameCols = q.star || (q.columns.length === DEFAULT_COLUMNS.length && q.columns.every((c, i) => c === DEFAULT_COLUMNS[i]));
  if (!sameCols || q.limit != null) return null;

  // the order must be one of the table's own sorts
  let sort: SortKey = "recent";
  let dir: 1 | -1 = 1;
  if (q.order.length > 1) return null;
  if (q.order.length === 1) {
    const { col, dir: d } = q.order[0];
    if (col === "started" || col === "period") sort = d === -1 ? "recent" : "oldest";
    else if (col === "impact" && d === -1) sort = "impact";
    else if (col === "name") {
      sort = "name";
      dir = d;
    }
    else return null;
  }

  const filters = emptyFilters();
  const conj: Expr[] = [];
  const flatten = (e: Expr | null) => {
    if (!e) return;
    if (e.op === "and") {
      flatten(e.l);
      flatten(e.r);
    } else conj.push(e);
  };
  flatten(q.where);

  const put = (key: GroupKey, vals: string[], mode?: MatchMode) => {
    if (filters.selected[key].length) return false; // one clause per group
    const canon = vals.map((v) => canonical(key, v));
    if (canon.some((c) => c == null)) return false;
    filters.selected[key] = canon as string[];
    if (mode) filters.modes[key] = mode;
    return true;
  };
  for (const e of conj) {
    let ok = false;
    if (e.op === "in" && !e.not) ok = !!FILTER_COLUMN[e.col] && put(FILTER_COLUMN[e.col]!, e.vals.map(String));
    else if (e.op === "cmp" && e.cmp === "=") ok = !!FILTER_COLUMN[e.col] && put(FILTER_COLUMN[e.col]!, [String(e.val)]);
    else if ((e.op === "overlap" || e.op === "contains") && FILTER_COLUMN[e.col]) ok = put(FILTER_COLUMN[e.col]!, e.vals, e.op === "contains" ? "all" : "any");
    else if (e.op === "any" && !e.not && FILTER_COLUMN[e.col]) ok = put(FILTER_COLUMN[e.col]!, [e.val]);
    else if (e.op === "active") ok = put("year", e.years.map(String));
    if (!ok) return null;
  }
  return { filters, sort, dir };
};

export const sqlText = (f: Filters, sort: SortKey, dir: 1 | -1 = 1) => sqlTokens(f, sort, dir).map((t) => t.t).join("");
