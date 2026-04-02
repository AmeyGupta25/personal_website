import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const projects = [
  {
    title: "StockPulse Analytics",
    category: "Python · SQL · D3.js · FastAPI",
    color: "hsl(207 28% 88%)",
    description: "End-to-end pipeline ingesting real-time stock and Reddit sentiment data with an interactive D3.js dashboard.",
  },
  {
    title: "Project Two",
    category: "Category · Tech · Stack",
    color: "hsl(40 20% 88%)",
    description: "Brief description of this project — what it does and why it matters.",
  },
  {
    title: "Project Three",
    category: "Category · Tech · Stack",
    color: "hsl(30 15% 88%)",
    description: "Brief description of this project — what it does and why it matters.",
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
      <div
        className="overflow-hidden rounded-sm mb-4 aspect-[4/3] group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300"
        data-cursor-hover
      >
        <div
          className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-500 p-8"
          style={{ backgroundColor: project.color }}
        >
          <span className="font-display text-3xl text-foreground/20 text-center">
            {project.title}
          </span>
        </div>
      </div>
      <h3 className="font-display text-lg md:text-xl font-medium text-foreground">
        {project.title}
      </h3>
      <p className="font-body text-xs tracking-[0.15em] uppercase text-accent mt-1">
        {project.category}
      </p>
      <p className="font-body text-sm text-muted-foreground mt-2 leading-relaxed">
        {project.description}
      </p>
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
