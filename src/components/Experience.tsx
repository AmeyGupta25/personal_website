import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const experiences = [
{
  role: "Data Engineering Intern",
  company: "Peale Davies",
  companyNote: "Fin-Tech Startup",
  url: "#",
  period: "Oct 2025 — Feb 2026",
  location: "Ridgewood, NJ",
  bullets: [
  "Scraped and normalized 10,000+ financial records from 70+ sources (SEC filings, business registries) into structured CSV/JSON using Python, BeautifulSoup, and Selenium, cutting retrieval errors by 20%",
  "Built ETL pipelines integrating 15+ APIs and government portals into a centralized PostgreSQL repository, cutting manual data collection time by 30% to power a custom AI tool for debt-focused closed-end funds",
  "Validated 50+ data fields via SQLAlchemy ORM, maintaining 95%+ data integrity across diverse financial feeds"]
},
{
  role: "Lead Data Analyst",
  company: "Lumnus Consulting",
  companyNote: "Student Organization",
  url: "#",
  period: "Apr 2025 — Dec 2025",
  location: "San Diego, CA",
  bullets: [
  "Built a SQL analytics pipeline tracking recruiting metrics across 30+ member cycles, visualized through 5 Power BI dashboards to monitor application-to-interview conversion rates and hiring funnel performance",
  "Defined 8 KPIs with leadership including time-to-fill, candidate quality, and acceptance rate, improving recruiting efficiency and member retention across 3 consecutive recruitment cycles",
  "Delivered 10+ recruiting reports to a 15-person executive board, reducing time-to-fill by 20% and improving candidate acceptance rates across the organization"]
},
{
  role: "Technical Product Management Intern",
  company: "App Orchid Inc.",
  companyNote: "Enterprise AI Startup",
  url: "#",
  period: "Jun 2025 — Sep 2025",
  location: "San Ramon, CA",
  bullets: [
  "Engineered 2 proof-of-concept prototypes using Flask microservices, collaborating with a 5-person engineering team on technical documentation and release support, reducing leadership review cycles by 20%",
  "Identified performance gaps across 8+ APIs and frameworks through technical evaluation and gap analysis, contributing to a 15% improvement in website performance and guiding strategic product direction",
  "Delivered competitive analysis across 10+ competitors to C-suite leadership, surfacing data-driven recommendations that influenced 3 key product roadmap decisions and strengthened market positioning"]
}];

const ExperienceCard = ({
  exp,
  index,
}: {
  exp: (typeof experiences)[0];
  index: number;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const isLeft = index % 2 === 0;

  return (
    <div
      ref={ref}
      className={`relative flex items-start ${isLeft ? "md:flex-row-reverse" : ""} gap-0 md:gap-8`}
    >
      <motion.div
        className="w-full md:w-[calc(50%-2rem)]"
        initial={{ opacity: 0, x: isLeft ? 60 : -60 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="group p-6 rounded-sm bg-secondary/50 border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left">
          <h3 className="font-display text-xl md:text-2xl font-semibold text-foreground">
            {exp.role}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            
              href={exp.url}
              className="font-body text-sm text-accent hover:underline">
              {exp.company}
            </a>
          </div>
          <p className="font-body text-xs tracking-wider uppercase text-muted-foreground mt-1">
            {exp.period}
          </p>
          <div className="w-8 h-[1px] bg-border my-4 group-hover:w-12 transition-all" />
          <ul className="space-y-2">
            {exp.bullets.map((b, bi) => (
              <li key={bi} className="font-body text-sm text-muted-foreground leading-relaxed">
                {b}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-8">
        <motion.div
          className="w-3 h-3 rounded-full border-2 border-accent bg-background"
          initial={{ scale: 0 }}
          animate={inView ? { scale: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.3 }}
        />
      </div>

      <div className="hidden md:block w-[calc(50%-2rem)]" />
    </div>
  );
};

const Experience = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="experience" className="py-32 px-8 md:px-12 max-w-6xl mx-auto" ref={ref}>
      <motion.p
        className="font-body text-sm tracking-[0.3em] uppercase text-accent mb-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        Experience
      </motion.p>
      <motion.h2
        className="font-display text-4xl md:text-5xl font-light text-foreground text-center mb-20"
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        Where I've Worked
      </motion.h2>

      <div className="relative">
        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1px] bg-border" />
        <div className="space-y-12">
          {experiences.map((exp, i) => (
            <ExperienceCard key={i} exp={exp} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;