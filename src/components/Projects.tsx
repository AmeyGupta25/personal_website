import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const projects = [
  {
    title: "StockPulse Analytics",
    category: "Python · FastAPI · XGBoost · PostgreSQL · Plotly.js",
    image: "/stockpulse.png",
    description: "Full-stack data engineering and ML project that tracks real-time stock prices, analyzes news sentiment with VADER, and predicts next-day price direction using XGBoost — served through a live REST API and interactive dashboard.",
    link: "https://github.com/AmeyGupta25/stockpulse",
    live: "https://ameygupta25.github.io/stockpulse/index.html",
  },
  {
    title: "UCSD ProfAI",
    category: "Python · FastAPI · React · Pinecone · LLaMA 3.3",
    image: "/rmp-rag.png",
    description: "AI-powered chatbot for UCSD students to ask natural language questions about professors, grounded in 7,565 real Rate My Professor reviews using a RAG pipeline with Pinecone vector search and Groq's LLaMA 3.3 70B.",
    link: "https://github.com/AmeyGupta25/rmp-rag",
    live: "https://rmp-rag-ten.vercel.app",
  },
  {
    title: "Personal Website",
    category: "React · TypeScript · Tailwind CSS · Vite · shadcn/ui",
    image: "/portfolio.png",
    description: "Personal portfolio designed and built from scratch to showcase projects, skills, and experience — featuring smooth animations, a fully responsive layout, and deployment via Vercel with a custom domain.",
    link: "https://github.com/AmeyGupta25/personal_website",
    live: "https://ameygupta.com",
  },
];

const ProjectCard = ({
  project,
  index,
}: {
  project: (typeof projects)[0];
  index: number;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      className="group"
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        delay: (index % 3) * 0.1,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <a href={project.live} target="_blank" rel="noopener noreferrer">
        <div
          className="overflow-hidden rounded-sm mb-4 aspect-[4/3] group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300 border border-gray-200 shadow-sm"
          data-cursor-hover
        >
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </a>
      <h3 className="font-display text-lg md:text-xl font-medium text-foreground">
        {project.title}
      </h3>
      <p className="font-body text-xs tracking-[0.15em] uppercase text-accent mt-1">
        {project.category}
      </p>
      <p className="font-body text-sm text-muted-foreground mt-2 leading-relaxed">
        {project.description}
      </p>
      <div className="flex gap-4 mt-3">
        <a
          href={project.link}
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-xs tracking-[0.1em] uppercase text-foreground underline underline-offset-4 hover:text-accent transition-colors"
        >
          GitHub
        </a>
        <a
          href={project.live}
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-xs tracking-[0.1em] uppercase text-foreground underline underline-offset-4 hover:text-accent transition-colors"
        >
          Live Site
        </a>
      </div>
    </motion.div>
  );
};

const Projects = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="projects" className="py-32 px-8 md:px-12 max-w-6xl mx-auto" ref={ref}>
      <motion.p
        className="font-body text-sm tracking-[0.3em] uppercase text-accent mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        Projects
      </motion.p>
      <motion.h2
        className="font-display text-4xl md:text-5xl font-light text-foreground mb-16"
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        Selected Work
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project, i) => (
          <ProjectCard key={i} project={project} index={i} />
        ))}
      </div>
    </section>
  );
};

export default Projects;