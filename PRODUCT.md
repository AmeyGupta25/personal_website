# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Delegated: the user left the stack to the designer. Default is the existing React 18 + TypeScript + Vite + Tailwind CSS app, because it already deploys to Vercel at ameygupta.com from `main`. The chosen direction may justify a different web stack, provided it still deploys on Vercel.

## Users
- **First: recruiters.** HR and university recruiters, often non-technical, screen many candidates quickly. They usually click through from a résumé, an application or LinkedIn.
- **Second: technical reviewers.** Data engineering leads and engineers may dig in later to check depth: how Amey builds, which tools, and whether the code is real.
- The site has to work for both, in that order.

## Product Purpose
ameygupta.com is Amey Gupta's personal portfolio. It is pitched at **data engineering** internships and roles.

Success means a visitor:
- remembers Amey
- can check that the work is real (live projects, GitHub)
- takes whatever next step they would normally take: email, a LinkedIn connection, or passing Amey along to a hiring manager

## Positioning
Amey is a UC San Diego Data Science student (B.S., Aug 2024 – Jun 2028). He has already shipped data engineering in four settings:
- production pipelines at a quantum-hardware company
- a backend at an enterprise AI startup, which hired him back after a TPM internship
- a computational cancer research lab, whose work is now a public preprint
- a fintech startup

His record pairs pipeline engineering with measurable business and research outcomes.

## Operating Context
- Visitors arrive from a résumé link, an application portal, LinkedIn (`linkedin.com/in/amey-gupta`) or GitHub (`github.com/AmeyGupta25`).
- Recruiters skim in seconds, often on a laptop between other candidates and sometimes on a phone.
- Technical reviewers open live demos and repositories.
- The site is deployed on Vercel. `main` is live, so work happens on branches.

## Capabilities and Constraints
- **Public contact:** the email address `ameygupta25@gmail.com`, LinkedIn and GitHub only.
- **Not public:**
  - No résumé PDF download or link.
  - No phone number anywhere.
- **Content:** hard-coded in the repo; there is no CMS.

## Brand Commitments
- Name: Amey Gupta. Domain: ameygupta.com. GitHub: AmeyGupta25.

## Evidence on Hand
All metrics come from Amey's current résumé (`~/Downloads/Amey_Gupta_Resume.pdf`). Use them verbatim and do not invent new ones.

- **Quantum Design**, San Diego. Data Engineering Intern, Aug 2026 – present.
  - Built an extraction pipeline with 7 automated connectors across 58 sources into PostgreSQL staging, with SEC EDGAR and ROR enrichment.
  - Built a locally hosted 20B LLM (gpt-oss-20b) extraction layer that auto-accepts at ≥0.85 confidence, writing to 7 core tables.
  - Matched records against Salesforce, feeding a live Power BI dashboard that generated over $2M in closed sales.
- **App Orchid**, San Ramon.
  - Software Engineering Intern (Data & Backend), Jul – Sep 2026:
    - Serverless REST API built with Hono and OpenAPI on Cloudflare Workers.
    - Zero-downtime PostgreSQL migrations with Drizzle ORM and Cloudflare Hyperdrive.
    - Upsert-only RSS sync with prune-guarded caching.
  - Technical Product Management Intern, Jun – Sep 2025:
    - 2 data integration POCs on AWS EC2.
    - Evaluations for the CEO and leadership that cut review cycles 20%.
    - 15% lower response latency across 8+ enterprise APIs.
  - He returned to the company for the second role.
- **UC San Diego Health, Computational Cancer Analytics Lab.** Data Engineering Research Assistant, Mar 2026 – present.
  - Migrated R to Cython for 7–18x speedups across 20,000+ gene pairs.
  - Built a multi-omics ETL into PostgreSQL covering 500+ cancer cell lines.
  - Clustering and Bayesian nomogram models reached 93% predictive accuracy across 590 tumour cell lines. The manuscript is public on BioRxiv and submitted to PLOS Computational Biology. The preprint URL has not been provided yet.
- **Peale Davies**, Ridgewood NJ, fintech. Data Engineering Intern, Oct 2025 – Feb 2026.
  - Dockerised scrapers normalising 10,000+ records from 70+ SEC and registry sources.
  - Airflow plus a PostgreSQL warehouse powering a fintech AI tool.
  - Integrated 15+ APIs, with SQLAlchemy validation across 50+ fields for 95%+ data integrity.
- **UCSD ProfAI** (project), Mar 2026.
  - A RAG app over 8,000+ Rate My Professor reviews for 500 faculty, using Pinecone, a FastAPI backend, a React frontend, Groq LLMs and Vercel.
  - 200+ active students.
  - Live at https://rmp-rag-ten.vercel.app, with code at https://github.com/AmeyGupta25/rmp-rag. Screenshot: `public/rmp-rag.png`.
- **StockPulse** (project).
  - Tracks real-time stock prices, scores news sentiment with VADER and predicts next-day direction with XGBoost.
  - Served through a REST API and a dashboard, built with Python, FastAPI, PostgreSQL and Plotly.js.
  - Live at https://ameygupta25.github.io/stockpulse/index.html, with code at https://github.com/AmeyGupta25/stockpulse. Screenshot: `public/stockpulse.png`.
  - No usage metrics exist; do not invent any.
- **Education:** UC San Diego, B.S. Data Science, Aug 2024 – Jun 2028. Relevant coursework: Data Structures & Algorithms, Data Visualization, Discrete Math, Computer Systems & Assembly, Linear Algebra, Probability & Statistics, Computer Architecture, Database Systems.
- **Skills** (from the résumé, updated 2026-11-04):
  - Languages: Python, SQL (PostgreSQL, MySQL, SQLite), Cython, JavaScript, Java, C/C++, Bash.
  - Data & ML: Pandas, NumPy, scikit-learn, PyTorch, Apache Spark, Kafka, Snowflake, ETL, BeautifulSoup, LLMs, Airflow, dbt.
  - Cloud & infra: AWS (S3, EC2), Cloudflare (Workers, Hyperdrive), Databricks, Docker, Terraform, CI/CD, Pinecone, Vercel.
  - Tools & frameworks: FastAPI, Flask, React, SQLAlchemy, Drizzle ORM, Hono, OpenAPI, Power BI, Tableau.
  - The source is `~/Downloads/Amey_Gupta_Resume.pdf`. LinkedIn's skills page also credits some skills to specific roles (for example Flask, Databricks, dbt and CI/CD to Peale Davies; Tableau and Salesforce to Quantum Design; Pandas, NumPy, scikit-learn and PyTorch to UCSD Health).
- **Personal** (kept light): weightlifting, guitar (alt/indie and classic rock), trying new foods.
- **Absent, so never fabricate:**
  - testimonials, references or quotes
  - company logos
  - a headshot
  - press
  - the BioRxiv URL
  - usage numbers for StockPulse

## Product Principles
1. **Recruiter-first, depth on demand.** Role, company, dates and impact are readable in seconds by a non-technical recruiter. Technical depth and code sit one step further in for the reviewer.
2. **Data engineering is the headline.** Every role is framed by the pipelines and data systems Amey built. Product and research work support that story; they don't compete with it.
3. **Proof over claims.** Lead with real outcomes, live demos and source code. Every number comes from the résumé.
4. **Memorable, not gimmicky.** The visit should leave a distinct impression of Amey. The impression must never cost a recruiter the ability to find the basics fast.
5. **A person, lightly.** A touch of personality makes Amey memorable; the work leads.
