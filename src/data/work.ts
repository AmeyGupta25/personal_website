// Every fact here comes from PRODUCT.md (Amey's résumé). Do not add metrics that aren't there.

export type WorkType = "Internship" | "Research" | "Project";
export type YearMonth = [number, number];

export interface WorkRow {
  id: string;
  /** The organisation or project: the table's `name` column. */
  name: string;
  role: string;
  type: WorkType;
  /** null for undated projects */
  from: YearMonth | null;
  /** null while ongoing */
  to: YearMonth | null;
  /** The one number in the impact column. */
  impact: string;
  /** Orders "biggest impact"; higher first. */
  impactRank: number;
  /** A sentence a non-technical reader understands. */
  plain: string;
  metrics: string[];
  bullets: string[];
  skills: string[];
  areas: string[];
  location?: string;
  links?: { label: string; href: string }[];
}

export const person = {
  name: "Amey Gupta",
  line: "Data Engineering Intern @ Quantum Design · UC San Diego, B.S. Data Science ’28",
  email: "ameygupta25@gmail.com",
  linkedin: "https://linkedin.com/in/amey-gupta",
  github: "https://github.com/AmeyGupta25",
};

/** The opening intro's one-row answer to SELECT * FROM amey.profile. */
export const profile: [string, string][] = [
  ["name", "Amey Gupta"],
  ["role", "Data Engineering Intern @ Quantum Design"],
  ["school", "UC San Diego · B.S. Data Science ’28"],
  ["about", "I build the pipelines that turn messy, scattered data into systems people rely on — from SEC filings and cancer-research datasets to the dashboards and models built on top of them."],
  ["off_the_clock", "Weightlifting, guitar (alt/indie & classic rock), and trying new foods."],
];

export const rows: WorkRow[] = [
  {
    id: "quantum",
    name: "Quantum Design",
    role: "Data Engineering Intern",
    type: "Internship",
    from: [2026, 8],
    to: null,
    location: "San Diego, CA",
    impact: "$2M+ sales",
    impactRank: 7,
    plain: "Built a system that finds new business relationships, feeding a dashboard behind more than $2 million in closed sales.",
    metrics: ["$2M+ closed sales", "58 data sources", "7 automated connectors", "≥0.85 auto-accept confidence"],
    bullets: [
      "Architected a data extraction pipeline with 7 automated connectors, aggregating quantum-workforce data from 58 sources into a PostgreSQL staging layer, with fallback enrichment from SEC EDGAR and ROR registry APIs.",
      "Engineered an extraction layer on a locally hosted 20B-parameter LLM (gpt-oss-20b), auto-accepting results at ≥0.85 confidence to minimize manual review while routing structured data across 7 core PostgreSQL tables.",
      "Matched internal records against a production Salesforce instance, sending net-new relationships to a live Power BI dashboard that generated over $2 million in closed sales.",
    ],
    skills: ["Python", "SQL", "PostgreSQL", "LLMs", "Salesforce", "Power BI", "SEC EDGAR API", "ROR API", "REST APIs", "JavaScript", "MySQL", "Tableau", "BeautifulSoup", "AI"],
    areas: ["Data pipelines & ETL", "Databases & warehousing", "Data quality", "AI & LLMs", "Backend & APIs", "Analytics & dashboards"],
  },
  {
    id: "orchid-swe",
    name: "App Orchid",
    role: "Software Engineering Intern (Data & Backend)",
    type: "Internship",
    from: [2026, 7],
    to: [2026, 9],
    location: "San Ramon, CA",
    impact: "0 downtime",
    impactRank: 3,
    plain: "Came back to App Orchid to build the backend and database behind an enterprise developer portal.",
    metrics: ["Serverless REST API", "Zero-downtime migrations", "Outage-proof content sync"],
    bullets: [
      "Architected a serverless REST API backend using Hono and OpenAPI, deployed on Cloudflare Workers, serving an enterprise developer portal for external engineering teams.",
      "Designed the database schema and executed zero-downtime PostgreSQL migrations with Drizzle ORM, managing connections at the edge via Cloudflare Hyperdrive.",
      "Built an upsert-only content sync pipeline that ingests and classifies external RSS feeds, with prune-guarded caching to keep data available during upstream outages.",
    ],
    skills: ["PostgreSQL", "SQL", "Hono", "OpenAPI", "REST APIs", "Cloudflare Workers", "Cloudflare Hyperdrive", "Drizzle ORM"],
    areas: ["Backend & APIs", "Databases & warehousing", "Data pipelines & ETL"],
  },
  {
    id: "health",
    name: "UC San Diego Health",
    role: "Data Engineering Research Assistant",
    type: "Research",
    from: [2026, 3],
    to: null,
    location: "San Diego, CA",
    impact: "7–18× faster",
    impactRank: 6,
    plain: "Made cancer-research computations 7–18× faster and built the models behind a published research preprint.",
    metrics: ["7–18× speedups", "20,000+ gene pairs", "500+ cancer cell lines", "93% predictive accuracy"],
    bullets: [
      "Built a high-performance compute pipeline by migrating legacy R dependencies to optimized Cython, achieving 7–18× speedups across 20,000+ gene pairs.",
      "Architected an ETL pipeline integrating multi-omics datasets (transcriptional signatures, PRISM drug screens) across 500+ cancer cell lines into a centralized PostgreSQL database.",
      "Built the clustering and Bayesian nomogram models for a cancer analytics manuscript (public on BioRxiv, submitted to PLOS Computational Biology), reaching 93% predictive accuracy across 590 tumor cell lines.",
    ],
    skills: ["Python", "Cython", "R", "SQL", "PostgreSQL", "Bayesian modelling", "Clustering", "Bash", "Pandas", "NumPy", "scikit-learn", "PyTorch"],
    areas: ["Data pipelines & ETL", "Machine learning", "Performance tuning", "Databases & warehousing", "Research"],
  },
  {
    id: "profai",
    name: "UCSD ProfAI",
    role: "AI chatbot (RAG)",
    type: "Project",
    from: [2026, 3],
    to: [2026, 3],
    impact: "200+ students",
    impactRank: 4,
    plain: "Built an AI chatbot that answers students’ questions about UCSD professors, used by 200+ students.",
    metrics: ["8,000+ reviews", "500 faculty", "200+ active students"],
    bullets: [
      "Engineered a document ingestion and embedding pipeline processing 8,000+ Rate My Professor reviews across 500 faculty, stored as vectors in Pinecone for low-latency retrieval.",
      "Built a serverless FastAPI backend and React frontend on Vercel, integrating Groq LLMs into a production retrieval-augmented generation app used by 200+ students.",
    ],
    skills: ["Python", "FastAPI", "React", "Pinecone", "Groq", "LLMs", "Embeddings", "Vercel"],
    areas: ["AI & LLMs", "Data pipelines & ETL", "Backend & APIs"],
    links: [
      { label: "Live site", href: "https://rmp-rag-ten.vercel.app" },
      { label: "Source code", href: "https://github.com/AmeyGupta25/rmp-rag" },
    ],
  },
  {
    id: "peale",
    name: "Peale Davies",
    role: "Data Engineering Intern",
    type: "Internship",
    from: [2025, 10],
    to: [2026, 2],
    location: "Ridgewood, NJ",
    impact: "10,000+ records",
    impactRank: 5,
    plain: "Built automated pipelines that collected 10,000+ financial records from 70+ sources to power a fintech AI tool.",
    metrics: ["10,000+ records", "70+ sources", "15+ APIs integrated", "95%+ data integrity"],
    bullets: [
      "Containerized Python scraping pipelines (BeautifulSoup, Selenium) with Docker to extract and normalize 10,000+ financial records from 70+ SEC and registry sources.",
      "Orchestrated scheduled ingestion with Apache Airflow into a centralized PostgreSQL warehouse powering a proprietary fintech AI tool.",
      "Integrated 15+ external APIs with strict SQLAlchemy validation across 50+ fields, keeping data integrity above 95%.",
    ],
    skills: ["Python", "SQL", "PostgreSQL", "BeautifulSoup", "Selenium", "Docker", "Airflow", "SQLAlchemy", "REST APIs", "Flask", "Databricks", "dbt", "Kubernetes", "Linux", "CI/CD", "JSON"],
    areas: ["Data pipelines & ETL", "Databases & warehousing", "Data quality", "Backend & APIs"],
  },
  {
    id: "orchid-tpm",
    name: "App Orchid",
    role: "Technical Product Management Intern",
    type: "Internship",
    from: [2025, 6],
    to: [2025, 9],
    location: "San Ramon, CA",
    impact: "−15% latency",
    impactRank: 2,
    plain: "Built two working prototypes and gave the CEO the analysis behind key product decisions.",
    metrics: ["2 data integration POCs", "−20% review cycles", "−15% response latency", "8+ enterprise APIs"],
    bullets: [
      "Engineered 2 data integration proof-of-concepts merging semantic AI and knowledge graph APIs into a centralized data architecture on AWS EC2.",
      "Delivered technical evaluations and gap analyses directly to the CEO and leadership, shaping product decisions and cutting review cycles by 20%.",
      "Resolved query bottlenecks across 8+ enterprise APIs by benchmarking load times and restructuring indexes, improving response latency by 15%.",
    ],
    skills: ["SQL", "AWS", "Database indexing", "Product management", "OpenAPI", "Cloudflare"],
    areas: ["Product & strategy", "Performance tuning", "Backend & APIs", "Databases & warehousing", "AI & LLMs"],
  },
  {
    id: "stockpulse",
    name: "StockPulse",
    role: "Stock sentiment + ML dashboard",
    type: "Project",
    from: [2025, 6],
    to: [2025, 6],
    impact: "Live API + dashboard",
    impactRank: 1,
    plain: "Tracks real-time stock prices, scores news sentiment and predicts next-day price direction, served through a live API and dashboard.",
    metrics: ["Real-time prices", "VADER news sentiment", "XGBoost next-day direction"],
    bullets: [
      "Tracks real-time stock prices and scores news sentiment with VADER.",
      "Predicts next-day price direction with XGBoost.",
      "Serves everything through a REST API and an interactive dashboard.",
    ],
    skills: ["Python", "FastAPI", "PostgreSQL", "XGBoost", "VADER", "Plotly.js"],
    areas: ["Machine learning", "Data pipelines & ETL", "Backend & APIs", "Analytics & dashboards"],
    links: [
      { label: "Live site", href: "https://ameygupta25.github.io/stockpulse/index.html" },
      { label: "Source code", href: "https://github.com/AmeyGupta25/stockpulse" },
    ],
  },
];

// ---------- dates ----------
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const monthIndex = ([y, m]: YearMonth) => y * 12 + m - 1;
export const label = (ym: YearMonth) => `${MONTHS[ym[1] - 1]} ${ym[0]}`;

export const period = (r: WorkRow) => {
  if (!r.from) return "—";
  if (r.to && monthIndex(r.to) === monthIndex(r.from)) return label(r.from);
  return `${label(r.from)} – ${r.to ? label(r.to) : "now"}`;
};

/** Dated work with no end yet is current. */
export const status = (r: WorkRow) => (r.from && !r.to ? "Current" : "Past");

export const yearsActive = (r: WorkRow) => {
  if (!r.from) return [];
  const end = r.to ? r.to[0] : new Date().getFullYear();
  return Array.from({ length: end - r.from[0] + 1 }, (_, k) => String(r.from![0] + k));
};
