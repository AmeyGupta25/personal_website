---
version: 1
slug: "src-pages-index-tsx"
primary_target: "src/pages/Index.tsx"
related_targets: []
---

# Home page (ameygupta.com)

**Mode:** Experience. A single-surface portfolio where the work itself leads from the first viewport.

**Audience and job:**
- Recruiters come first and are often non-technical. Technical data engineering reviewers come second.
- Visitors should remember Amey, see that the work is real, and follow up by email, LinkedIn or GitHub.
- Proof is the résumé's real metrics, live demos and repositories (see PRODUCT.md).
- No résumé PDF and no phone number.

**User direction (2026-11-03/04):**
- Pitch data engineering.
- The first view is a striking moment; the site is interactive.
- It must not look like a template, read like a résumé, or confuse a recruiter.
- Reached after four rounds and hands-on demos of Job Scheduler, Run the Pipeline and Warehouse Table (`.impeccable/mocks/demos/`).
- The user chose **Warehouse Table** and asked for layout variations.
- Layout round (seed:989f466b1489f874): the dealt variations were Schema Browser, Sentence Query and Query Console, plus a Schema Browser + Console combo. The user locked **Query Console** (the single results table) and asked for an **extensive filters list**.

**Memorable moment:** a query types itself and the rows of Amey's career stream in. One click asks a new question of his work.

**Unresolved:**
- The filter set: a demo is in progress at `.impeccable/mocks/demos/v-filters.html`.
- Typefaces.
- Where StockPulse, education, skills and the light personality line live (as tables or rows).
- Phone layout.

## Direction contract

THESIS: Amey's work is a table in a data warehouse that the visitor queries. One click runs a real query, and the rows of his career stream in, ready to sort, filter and join. It refuses the hero over a card grid, and it refuses the static résumé list.

OWN-WORLD:
- Colour: white ground, near-black ink #111, and muted #5F656B. Highlighter yellow #FFE066 marks the selected row and nothing else. SQL syntax colours (keywords #7B5CD6, strings #0F8A5F) appear only inside the query.
- Type: cell values are set in a heavy grotesk at display size. SQL, dates and query metadata are set in monospace.
- Structure: a 4px header rule and hairline row rules. Queries are pill chips.
- No glass and no cards.

STORY:
- The recruiter sees Amey's name while a query types itself, and the rows stream in with impact at display size.
- They click "Where I used Python" or "Biggest impact" and the table answers.
- Opening a row joins its plain-English summary, proof and links inline.
- They email or open GitHub.

FIRST VIEWPORT: Name and role top-left; Email, LinkedIn and GitHub top-right. A full-width query bar types itself, with preset query chips beneath. The result rows show company and impact at display size, and the first rows are visible without scrolling.

**Signature interaction:** the query types itself and the rows stream in. Clicking a row JOINs its details inline, and clicking a header re-sorts.

**Motion grammar:** typing, a staggered row stream-in, and the join expanding. Reduced motion shows the final state.

FORM: Warehouse Table (grounded direction), chosen after a hands-on demo over the dealt Job Scheduler and Run the Pipeline. seed:5411e8cdf8eb347b

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
