import { describe, expect, it } from "vitest";
import { rows } from "@/data/work";
import { parse, run, SqlError } from "@/lib/sql";
import { emptyFilters, filterRows, queryToFilters, sortRows, sqlText } from "@/lib/warehouse";

const names = (sql: string) => run(parse(sql), rows).map((r) => r.name);

describe("sql engine", () => {
  it("runs the default query", () => {
    expect(names("SELECT name, role, period, impact FROM amey.work ORDER BY started DESC;")).toHaveLength(rows.length);
  });
  it("filters by skill, case-insensitively", () => {
    expect(names("SELECT * FROM amey.work WHERE 'airflow' = ANY(skills)")).toEqual(["Peale Davies"]);
    expect(names("SELECT * FROM work WHERE skills @> ARRAY['Python', 'Airflow']")).toEqual(["Peale Davies"]);
  });
  it("handles AND / OR / NOT, LIKE and IS NULL", () => {
    expect(names("SELECT * FROM amey.work WHERE ended IS NULL ORDER BY name")).toEqual(["Quantum Design", "UC San Diego Health"]);
    expect(names("SELECT * FROM amey.work WHERE name ILIKE '%orchid%' AND NOT type = 'Research'")).toEqual(["App Orchid", "App Orchid"]);
    expect(names("SELECT * FROM amey.work WHERE type = 'Project' OR started >= 2026 ORDER BY name")).toHaveLength(5);
  });
  it("orders and limits", () => {
    expect(names("SELECT * FROM amey.work ORDER BY impact DESC LIMIT 2")).toEqual(["Quantum Design", "UC San Diego Health"]);
  });
  it("explains mistakes in plain words", () => {
    expect(() => parse("SELECT * FROM jobs")).toThrow(SqlError);
    expect(() => parse("SELECT salary FROM amey.work")).toThrow(/no column called/);
    expect(() => parse("SELECT * FROM amey.work WHERE name = 'Quantum")).toThrow(/closing quote/);
  });
  it("round-trips every filter query back into the same filters", () => {
    const f = emptyFilters();
    f.selected.type = ["Internship"];
    f.selected.skill = ["Python", "SQL"];
    f.modes.skill = "all";
    f.selected.year = ["2026"];
    const mapped = queryToFilters(parse(sqlText(f, "impact")))!;
    expect(mapped.filters.selected).toEqual(f.selected);
    expect(mapped.sort).toBe("impact");
    expect(sortRows(filterRows(mapped.filters), mapped.sort).map((r) => r.id)).toEqual(run(parse(sqlText(f, "impact")), rows).map((r) => r.id));
  });
  it("leaves queries the filters can't express as custom", () => {
    expect(queryToFilters(parse("SELECT name, skills FROM amey.work"))).toBeNull();
    expect(queryToFilters(parse("SELECT * FROM amey.work WHERE name LIKE 'A%'"))).toBeNull();
  });
});

describe("quick questions", () => {
  it("every question in the pool returns at least one row", async () => {
    const { QUICK_POOL } = await import("@/lib/warehouse");
    const { runGrouped } = await import("@/lib/sql");
    for (const q of QUICK_POOL) {
      if (q.sql) expect(runGrouped(parse(q.sql), rows).length, q.label).toBeGreaterThan(0);
      else expect(filterRows(q.apply().filters).length, q.label).toBeGreaterThan(0);
    }
  });
});

describe("counts and schema", () => {
  it("counts rows, and counts each value of a list column per group", async () => {
    const { runGrouped } = await import("@/lib/sql");
    expect(runGrouped(parse("SELECT COUNT(*) FROM amey.work WHERE type = 'Internship'"), rows)).toEqual([{ key: null, count: 4 }]);
    const skills = runGrouped(parse("SELECT skills, COUNT(*) FROM amey.work GROUP BY skills ORDER BY COUNT(*) DESC LIMIT 3"), rows);
    expect(skills).toHaveLength(3);
    const python = rows.filter((r) => r.skills.includes("Python")).length;
    expect(skills.find((s) => s.key === "Python")?.count ?? python).toBe(python);
    expect(skills[0].count).toBeGreaterThanOrEqual(skills[1].count);
    expect(runGrouped(parse("SELECT type, COUNT(*) FROM work GROUP BY type ORDER BY type"), rows).map((r) => r.key)).toEqual(["Education", "Internship", "Project", "Research"]);
  });
  it("explains grouping mistakes", () => {
    expect(() => parse("SELECT name, COUNT(*) FROM amey.work")).toThrow(/GROUP BY name/);
    expect(() => parse("SELECT name, role FROM amey.work GROUP BY name")).toThrow(/only select name/);
    expect(() => parse("SELECT * FROM amey.work ORDER BY COUNT(*)")).toThrow(/needs a GROUP BY/);
  });
  it("describes the table", () => {
    for (const q of ["DESCRIBE amey.work", "describe work;", "\\d amey.work", "\\d", "DESC amey.work"]) expect(parse(q).describe, q).toBe(true);
    expect(queryToFilters(parse("SELECT skills, COUNT(*) FROM amey.work GROUP BY skills"))).toBeNull();
  });
});

describe("completion", () => {
  it("completes keywords and columns outside quotes, and real values inside them", async () => {
    const { complete } = await import("@/lib/sql");
    expect(complete("SEL", 3, []).options).toContain("SELECT");
    expect(complete("SELECT na", 9, []).options).toContain("name");
    const inQuote = complete("WHERE 'pyth", 11, ["Python", "PyTorch", "SQL"]);
    expect(inQuote).toMatchObject({ from: 7, quoted: true });
    expect(inQuote.options).toEqual(["Python"]);
    expect(complete("SELECT n", 8, []).options).toEqual([]);
  });
});
