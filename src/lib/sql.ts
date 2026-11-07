// A small SQL engine for the one table on the page. It speaks the dialect the filters write
// (Postgres-flavoured: &&, @>, = ANY(...), active_in(...)) plus everyday SELECT / WHERE / ORDER BY / LIMIT,
// COUNT(*) with GROUP BY (a list column counts each of its values, the way unnest would), and DESCRIBE.

import { monthIndex, status, yearsActive, type WorkRow } from "@/data/work";

// ---------- tokens ----------
export type TokKind = "kw" | "id" | "str" | "num" | "sym" | "ws" | "bad";
export interface Tok {
  kind: TokKind;
  text: string;
  start: number;
  /** Upper-cased keyword, or the identifier/string value. */
  value: string;
}

const KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "IS", "NULL", "LIKE", "ILIKE",
  "ORDER", "BY", "ASC", "DESC", "LIMIT", "ARRAY", "ANY", "GROUP", "COUNT", "DESCRIBE",
]);
const SYMBOLS = ["&&", "@>", "<=", ">=", "<>", "!=", "=", "<", ">", ",", "(", ")", "[", "]", ";", "*"];

export const tokenize = (src: string): Tok[] => {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      let j = i;
      while (j < src.length && /\s/.test(src[j])) j++;
      out.push({ kind: "ws", text: src.slice(i, j), start: i, value: "" });
      i = j;
    } else if (c === "'") {
      // '' inside a string is an escaped quote
      let j = i + 1;
      let v = "";
      while (j < src.length) {
        if (src[j] === "'" && src[j + 1] === "'") {
          v += "'";
          j += 2;
        } else if (src[j] === "'") break;
        else v += src[j++];
      }
      const closed = j < src.length;
      out.push({ kind: closed ? "str" : "bad", text: src.slice(i, closed ? j + 1 : j), start: i, value: v });
      i = closed ? j + 1 : j;
    } else if (/[0-9]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      out.push({ kind: "num", text: src.slice(i, j), start: i, value: src.slice(i, j) });
      i = j;
    } else if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_.]/.test(src[j])) j++;
      const text = src.slice(i, j);
      const up = text.toUpperCase();
      out.push(KEYWORDS.has(up) ? { kind: "kw", text, start: i, value: up } : { kind: "id", text, start: i, value: text.toLowerCase() });
      i = j;
    } else {
      const sym = SYMBOLS.find((s) => src.startsWith(s, i));
      if (sym) {
        out.push({ kind: "sym", text: sym, start: i, value: sym });
        i += sym.length;
      } else {
        out.push({ kind: "bad", text: c, start: i, value: c });
        i++;
      }
    }
  }
  return out;
};

// ---------- the table's columns ----------
export type Column = "name" | "summary" | "role" | "type" | "status" | "period" | "impact" | "location" | "started" | "ended" | "skills" | "areas" | "years";
export const COLUMNS: Column[] = ["name", "summary", "role", "type", "status", "period", "impact", "location", "started", "ended", "skills", "areas", "years"];
const ARRAY_COLUMNS = new Set<Column>(["skills", "areas", "years"]);
const ALIASES: Record<string, Column> = { company: "name", title: "name", skill: "skills", area: "areas", year: "years", start: "started", end: "ended" };
/** What `SELECT *` shows: the table's main columns. */
export const DEFAULT_COLUMNS: Column[] = ["name", "summary", "role", "period", "impact"];

/** What DESCRIBE amey.work prints: every column, its type and what it holds. */
export const SCHEMA: { column: Column; type: string; note: string }[] = [
  { column: "name", type: "text", note: "The organisation or project" },
  { column: "summary", type: "text", note: "One plain-English sentence on what I did" },
  { column: "role", type: "text", note: "My title, or what the project is" },
  { column: "type", type: "text", note: "Internship, Research or Project" },
  { column: "status", type: "text", note: "Current or Past" },
  { column: "period", type: "text", note: "When, shown as Mon YYYY – Mon YYYY" },
  { column: "impact", type: "text", note: "The headline number; sorts by size of impact" },
  { column: "location", type: "text", note: "City, or NULL for projects" },
  { column: "started", type: "date", note: "Compare with a year (2025) or 'YYYY-MM'" },
  { column: "ended", type: "date", note: "NULL while ongoing" },
  { column: "skills", type: "text[]", note: "Languages, tools and platforms used" },
  { column: "areas", type: "text[]", note: "What the work was: pipelines, ML, backend…" },
  { column: "years", type: "text[]", note: "Calendar years the work spans" },
];

const resolveColumn = (raw: string): Column | null => {
  const c = raw.toLowerCase();
  if ((COLUMNS as string[]).includes(c)) return c as Column;
  return ALIASES[c] ?? null;
};

// ---------- syntax tree ----------
type Lit = string | number;
export type Expr =
  | { op: "and" | "or"; l: Expr; r: Expr }
  | { op: "not"; e: Expr }
  | { op: "cmp"; col: Column; cmp: string; val: Lit }
  | { op: "in"; col: Column; vals: Lit[]; not: boolean }
  | { op: "like"; col: Column; pat: string; ci: boolean; not: boolean }
  | { op: "null"; col: Column; not: boolean }
  | { op: "overlap" | "contains"; col: Column; vals: string[] }
  | { op: "any"; col: Column; val: string; not: boolean }
  | { op: "active"; years: number[] };

/** "count" orders a grouped query by its COUNT(*). */
export type OrderCol = Column | "count";

export interface Query {
  columns: Column[];
  star: boolean;
  where: Expr | null;
  order: { col: OrderCol; dir: 1 | -1 }[];
  limit: number | null;
  /** SELECT COUNT(*): the result is counts, not rows. */
  count: boolean;
  /** GROUP BY this column; null when ungrouped. */
  group: Column | null;
  /** DESCRIBE amey.work (or \d): show the schema. */
  describe: boolean;
}

export class SqlError extends Error {
  constructor(message: string, public at: number) {
    super(message);
  }
}

// ---------- parser ----------
const DESCRIBE_RE = /^\s*(?:describe|desc|\\d\+?)\s*(?:amey\.work|work)?\s*;?\s*$/i;
const EMPTY = { star: false, where: null, order: [], limit: null, count: false, group: null } as const;

export const parse = (src: string): Query => {
  if (DESCRIBE_RE.test(src)) return { ...EMPTY, columns: [], order: [], describe: true };
  const toks = tokenize(src).filter((t) => t.kind !== "ws");
  let i = 0;
  const peek = () => toks[i];
  const at = () => (toks[i] ? toks[i].start : src.length);
  const isKw = (k: string) => toks[i]?.kind === "kw" && toks[i].value === k;
  const isSym = (s: string) => toks[i]?.kind === "sym" && toks[i].value === s;
  const eatKw = (k: string, msg?: string) => {
    if (!isKw(k)) throw new SqlError(msg ?? `Expected ${k} here.`, at());
    i++;
  };
  const eatSym = (s: string, msg?: string) => {
    if (!isSym(s)) throw new SqlError(msg ?? `Expected “${s}” here.`, at());
    i++;
  };
  const bad = toks.find((t) => t.kind === "bad");
  if (bad) throw new SqlError(bad.text.startsWith("'") ? "This text value is missing its closing quote ( ' )." : `“${bad.text}” isn't valid here.`, bad.start);

  const column = (): Column => {
    const t = peek();
    if (!t || t.kind !== "id") throw new SqlError("Expected a column name, like name, skills or impact.", at());
    const c = resolveColumn(t.value);
    if (!c) throw new SqlError(`There's no column called “${t.text}”. Columns: ${COLUMNS.join(", ")}.`, t.start);
    i++;
    return c;
  };
  const literal = (): Lit => {
    const t = peek();
    if (t?.kind === "str") return i++, t.value;
    if (t?.kind === "num") return i++, Number(t.value);
    throw new SqlError("Expected a value here, like 'Python' (in single quotes) or 2025.", at());
  };
  const text = (): string => {
    const t = peek();
    if (t?.kind === "str") return i++, t.value;
    throw new SqlError("Expected a text value in single quotes, like 'Python'.", at());
  };
  const list = <T,>(item: () => T, open: string, close: string): T[] => {
    eatSym(open);
    const out = [item()];
    while (isSym(",")) {
      i++;
      out.push(item());
    }
    eatSym(close, `Expected “${close}” to close the list.`);
    return out;
  };
  const arrayLit = () => {
    eatKw("ARRAY", "Expected ARRAY['…', …] here.");
    return list(text, "[", "]");
  };

  const primary = (): Expr => {
    if (isSym("(")) {
      i++;
      const e = orExpr();
      eatSym(")", "A “(” is missing its closing “)”.");
      return e;
    }
    if (isKw("NOT")) return i++, { op: "not", e: primary() };
    // active_in(2025, 2026)
    if (peek()?.kind === "id" && peek().value === "active_in") {
      i++;
      const ys = list(literal, "(", ")");
      return { op: "active", years: ys.map(Number) };
    }
    // 'Python' = ANY(skills)
    if (peek()?.kind === "str") {
      const val = text();
      const neg = isSym("!=") || isSym("<>");
      if (neg) i++;
      else eatSym("=", "After a value, expected = ANY(column).");
      eatKw("ANY", "Expected ANY(column) here, like 'Python' = ANY(skills).");
      eatSym("(");
      const col = column();
      eatSym(")");
      if (!ARRAY_COLUMNS.has(col)) throw new SqlError(`ANY(...) works on list columns: skills, areas, years.`, at());
      return { op: "any", col, val, not: neg };
    }
    const colAt = at();
    const col = column();
    const isArr = ARRAY_COLUMNS.has(col);
    if (isSym("&&") || isSym("@>")) {
      const op = peek().value === "&&" ? "overlap" : "contains";
      i++;
      if (!isArr) throw new SqlError(`${peek()?.value ?? "&&"} only works on list columns: skills, areas, years.`, colAt);
      return { op, col, vals: arrayLit() };
    }
    if (isKw("IS")) {
      i++;
      const not = isKw("NOT") ? (i++, true) : false;
      eatKw("NULL", "Expected NULL after IS.");
      return { op: "null", col, not };
    }
    const not = isKw("NOT") ? (i++, true) : false;
    if (isKw("IN")) {
      i++;
      if (isArr) throw new SqlError(`Use && ARRAY[...] or 'value' = ANY(${col}) for list columns.`, colAt);
      return { op: "in", col, vals: list(literal, "(", ")"), not };
    }
    if (isKw("LIKE") || isKw("ILIKE")) {
      const ci = peek().value === "ILIKE";
      i++;
      return { op: "like", col, pat: text(), ci, not };
    }
    if (not) throw new SqlError("Expected IN, LIKE or ILIKE after NOT.", at());
    const t = peek();
    if (t?.kind === "sym" && ["=", "!=", "<>", "<", ">", "<=", ">="].includes(t.value)) {
      i++;
      if (isArr) throw new SqlError(`${col} is a list. Try 'value' = ANY(${col}) or ${col} && ARRAY['value'].`, colAt);
      return { op: "cmp", col, cmp: t.value, val: literal() };
    }
    throw new SqlError(`Expected a comparison after “${col}”, like = 'value', IN (...), or LIKE '%text%'.`, at());
  };
  const andExpr = (): Expr => {
    let l = primary();
    while (isKw("AND")) {
      i++;
      l = { op: "and", l, r: primary() };
    }
    return l;
  };
  const orExpr = (): Expr => {
    let l = andExpr();
    while (isKw("OR")) {
      i++;
      l = { op: "or", l, r: andExpr() };
    }
    return l;
  };

  // COUNT(*)
  const countStar = () => {
    eatKw("COUNT");
    eatSym("(", "Expected COUNT(*).");
    eatSym("*", "Only COUNT(*) is supported.");
    eatSym(")", "Expected COUNT(*).");
  };

  if (!toks.length) throw new SqlError("Type a query, starting with SELECT, or DESCRIBE amey.work.", 0);
  if (isKw("DESCRIBE")) throw new SqlError("Try DESCRIBE amey.work on its own.", at());
  eatKw("SELECT", "Queries start with SELECT (or try DESCRIBE amey.work).");
  let star = false;
  let count = false;
  const columns: Column[] = [];
  const selectItem = () => {
    if (isKw("COUNT")) {
      countStar();
      count = true;
    } else columns.push(column());
  };
  if (isSym("*")) {
    i++;
    star = true;
    columns.push(...DEFAULT_COLUMNS);
  } else {
    selectItem();
    while (isSym(",")) {
      i++;
      selectItem();
    }
  }
  eatKw("FROM", "Expected FROM after the column list.");
  const table = peek();
  if (!table || table.kind !== "id") throw new SqlError("Expected the table name: amey.work.", at());
  if (!["amey.work", "work"].includes(table.value)) throw new SqlError(`There's no table “${table.text}”. The table is amey.work.`, table.start);
  i++;
  let where: Expr | null = null;
  if (isKw("WHERE")) {
    i++;
    where = orExpr();
  }
  let group: Column | null = null;
  if (isKw("GROUP")) {
    i++;
    eatKw("BY", "Expected BY after GROUP.");
    const gAt = at();
    group = column();
    if (star) throw new SqlError(`With GROUP BY, select the column and COUNT(*), like SELECT ${group}, COUNT(*).`, 0);
    const extra = columns.find((c) => c !== group);
    if (extra) throw new SqlError(`With GROUP BY ${group}, you can only select ${group} and COUNT(*).`, gAt);
  } else if (count && columns.length) {
    throw new SqlError(`To count per ${columns[0]}, add GROUP BY ${columns[0]}.`, at());
  }
  const grouped = count || !!group;
  const order: Query["order"] = [];
  if (isKw("ORDER")) {
    i++;
    eatKw("BY", "Expected BY after ORDER.");
    do {
      if (isSym(",")) i++;
      let col: OrderCol;
      if (isKw("COUNT") || (peek()?.kind === "id" && peek().value === "count")) {
        if (!grouped) throw new SqlError("ORDER BY COUNT(*) needs a GROUP BY.", at());
        if (isKw("COUNT")) countStar();
        else i++;
        col = "count";
      } else {
        const cAt = at();
        col = column();
        if (grouped && col !== group) throw new SqlError(`A grouped query can only be ordered by ${group ?? "its count"} or COUNT(*).`, cAt);
      }
      let dir: 1 | -1 = 1;
      if (isKw("ASC")) i++;
      else if (isKw("DESC")) {
        i++;
        dir = -1;
      }
      order.push({ col, dir });
    } while (isSym(","));
  }
  let limit: number | null = null;
  if (isKw("LIMIT")) {
    i++;
    const n = peek();
    if (n?.kind !== "num") throw new SqlError("Expected a number after LIMIT.", at());
    limit = Number(n.value);
    i++;
  }
  if (isSym(";")) i++;
  if (i < toks.length) throw new SqlError(`Didn't expect “${toks[i].text}” here.`, toks[i].start);
  return { columns, star, where, order, limit, count, group, describe: false };
};

// ---------- evaluation ----------
type Val = string | number | null | string[];
const valueOf = (r: WorkRow, c: Column): Val => {
  switch (c) {
    case "status": return status(r);
    case "summary": return r.plain;
    case "period": return r.from ? `${r.from[0]}-${String(r.from[1]).padStart(2, "0")}` : null;
    case "location": return r.location ?? null;
    case "started": return r.from ? monthIndex(r.from) : null;
    // undated projects have an unknown end, not an open one: only dated, ongoing work is NULL here
    case "ended": return r.to ? monthIndex(r.to) : r.from ? null : NaN;
    case "years": return yearsActive(r);
    case "skills": return r.skills;
    case "areas": return r.areas;
    default: return r[c];
  }
};
const lower = (v: unknown) => String(v).toLowerCase();
const has = (arr: string[], v: string) => arr.some((x) => lower(x) === lower(v));

/** Dates compare as years when the value is a year (2025), as months when it's 'YYYY-MM'. */
const dateOperand = (v: number | null, lit: Lit) => {
  if (v == null) return null;
  if (typeof lit === "number" && lit > 1900 && lit < 3000) return [Math.floor(v / 12), lit] as const;
  if (typeof lit === "string" && /^\d{4}-\d{1,2}$/.test(lit)) {
    const [y, m] = lit.split("-").map(Number);
    return [v, y * 12 + m - 1] as const;
  }
  return [v, Number(lit)] as const;
};

const test = (r: WorkRow, e: Expr): boolean => {
  switch (e.op) {
    case "and": return test(r, e.l) && test(r, e.r);
    case "or": return test(r, e.l) || test(r, e.r);
    case "not": return !test(r, e.e);
    case "active": return e.years.some((y) => yearsActive(r).includes(String(y)));
    case "any": return has(valueOf(r, e.col) as string[], e.val) !== e.not;
    case "overlap": return e.vals.some((v) => has(valueOf(r, e.col) as string[], v));
    case "contains": return e.vals.every((v) => has(valueOf(r, e.col) as string[], v));
    case "null": return (valueOf(r, e.col) == null) !== e.not;
    case "in": {
      const v = valueOf(r, e.col);
      return e.vals.some((x) => lower(x) === lower(v)) !== e.not;
    }
    case "like": {
      const v = valueOf(r, e.col);
      if (v == null) return false;
      const re = new RegExp("^" + e.pat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".") + "$", e.ci ? "is" : "s");
      return re.test(String(v)) !== e.not;
    }
    case "cmp": {
      const raw = valueOf(r, e.col);
      if (raw == null) return false;
      let a: string | number = raw as string | number;
      let b: string | number = e.val;
      if (e.col === "started" || e.col === "ended") {
        const pair = dateOperand(raw as number, e.val);
        if (!pair) return false;
        [a, b] = pair;
      } else if (typeof a === "string") {
        // text compares without case, so 'python' finds Python
        a = a.toLowerCase();
        b = String(b).toLowerCase();
      }
      switch (e.cmp) {
        case "=": return a === b;
        case "!=": case "<>": return a !== b;
        case "<": return a < b;
        case ">": return a > b;
        case "<=": return a <= b;
        default: return a >= b;
      }
    }
  }
};

const sortKey = (r: WorkRow, c: OrderCol): string | number => {
  // the parser only allows ORDER BY COUNT(*) in a grouped query, so this narrows the type
  if (c === "count") return 0;
  if (c === "impact") return r.impactRank;
  if (c === "started" || c === "period") return r.from ? monthIndex(r.from) : -Infinity;
  if (c === "ended") return r.to ? monthIndex(r.to) : r.from ? Infinity : -Infinity;
  const v = valueOf(r, c);
  return Array.isArray(v) ? v.length : v == null ? "" : typeof v === "number" ? v : v.toLowerCase();
};

/** One line of a grouped result: the group's value (null for a plain COUNT(*)) and how many rows hold it. */
export interface CountRow {
  key: string | null;
  count: number;
}

/** A display value for grouping and ordering; list columns give each of their values. */
const groupValues = (r: WorkRow, c: Column): string[] => {
  if (c === "started" || c === "ended") {
    const ym = c === "started" ? r.from : r.to;
    return [ym ? `${ym[0]}-${String(ym[1]).padStart(2, "0")}` : "NULL"];
  }
  if (c === "impact") return [r.impact];
  const v = valueOf(r, c);
  if (Array.isArray(v)) return v;
  return [v == null ? "NULL" : String(v)];
};

export const runGrouped = (q: Query, rows: WorkRow[]): CountRow[] => {
  const hit = rows.filter((r) => !q.where || test(r, q.where));
  if (!q.group) return [{ key: null, count: hit.length }];
  const n = new Map<string, number>();
  for (const r of hit) for (const v of new Set(groupValues(r, q.group))) n.set(v, (n.get(v) ?? 0) + 1);
  let out = [...n.entries()].map(([key, count]) => ({ key, count }));
  // with no ORDER BY, the biggest groups come first, then alphabetical
  const order = q.order.length ? q.order : [{ col: "count" as OrderCol, dir: -1 as const }];
  out.sort((a, b) => {
    for (const { col, dir } of order) {
      const x = col === "count" ? a.count : a.key!.toLowerCase();
      const y = col === "count" ? b.count : b.key!.toLowerCase();
      if (x < y) return -dir;
      if (x > y) return dir;
    }
    return a.key!.localeCompare(b.key!);
  });
  if (q.limit != null) out = out.slice(0, q.limit);
  return out;
};

export const run = (q: Query, rows: WorkRow[]): WorkRow[] => {
  let out = rows.filter((r) => !q.where || test(r, q.where));
  if (q.order.length) {
    out = out.slice().sort((a, b) => {
      for (const { col, dir } of q.order) {
        const x = sortKey(a, col), y = sortKey(b, col);
        if (x < y) return -dir;
        if (x > y) return dir;
      }
      return 0;
    });
  }
  return q.limit != null ? out.slice(0, q.limit) : out;
};

// ---------- completion ----------
// in the order they should win: the first match is the one suggested, so the two-word forms come
// before their first word, and DESCRIBE (only valid on its own) comes after DESC
const COMPLETE_WORDS = [
  "ORDER BY", "GROUP BY", "COUNT(*)", "IS NULL",
  ...[...KEYWORDS].filter((k) => !["ORDER", "BY", "GROUP", "COUNT", "DESCRIBE"].includes(k)),
  ...COLUMNS,
  "amey.work",
  "active_in(",
  "DESCRIBE",
];

/** What the text before the caret could complete to: a keyword, column or table outside quotes,
    or (inside an open quote) one of the table's real values. `from` is where the replaced word starts.
    With `prefixOnly`, only options that begin with what's typed (so the rest can be shown after the caret). */
export const complete = (
  src: string,
  at: number,
  values: string[],
  { prefixOnly = false } = {},
): { from: number; options: string[]; quoted: boolean } => {
  const before = src.slice(0, at);
  const quotes = (before.match(/'/g) ?? []).length;
  if (quotes % 2 === 1) {
    const from = before.lastIndexOf("'") + 1;
    const prefix = before.slice(from).toLowerCase();
    if (!prefix) return { from, options: [], quoted: true };
    const starts = values.filter((v) => v.toLowerCase().startsWith(prefix));
    const inside = prefixOnly ? [] : values.filter((v) => !starts.includes(v) && v.toLowerCase().includes(prefix));
    return { from, options: [...starts, ...inside].filter((v) => v.toLowerCase() !== prefix).slice(0, 6), quoted: true };
  }
  const word = before.match(/[A-Za-z_][A-Za-z0-9_.]*$/)?.[0] ?? "";
  // nothing to suggest mid-word, or for a single letter
  if (word.length < 2 || /[A-Za-z0-9_]/.test(src[at] ?? "")) return { from: at, options: [], quoted: false };
  const w = word.toLowerCase();
  const options = COMPLETE_WORDS.filter((c) => c.toLowerCase().startsWith(w) && c.toLowerCase() !== w);
  return { from: at - word.length, options: [...new Set(options)].slice(0, 6), quoted: false };
};
