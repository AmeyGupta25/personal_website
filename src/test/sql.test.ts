import { describe, expect, it } from "vitest";
import { rows } from "@/data/work";
import { parse, run, SqlError } from "@/lib/sql";
import { emptyFilters, filterRows, queryToFilters, sortRows, sqlText } from "@/lib/warehouse";

const names = (sql: string) => run(parse(sql), rows).map((r) => r.name);

describe("sql engine", () => {
  it("runs the default query", () => {
    expect(names("SELECT name, role, period, impact FROM amey.work ORDER BY started DESC;")).toHaveLength(7);
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
    for (const q of QUICK_POOL) {
      const { filters } = q.apply();
      expect(filterRows(filters).length, q.label).toBeGreaterThan(0);
    }
  });
});
