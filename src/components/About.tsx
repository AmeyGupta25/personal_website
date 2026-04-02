import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const About = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="py-32 px-8 md:px-12 max-w-4xl mx-auto" ref={ref}>
      <motion.p
        className="font-body text-sm tracking-[0.3em] uppercase text-accent mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}>
        
        About
      </motion.p>
      <motion.h2
        className="font-display text-4xl md:text-5xl font-light text-foreground leading-tight mb-8"
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.1 }}>
        
        ​Hi, I'm Amey.    
      </motion.h2>
      <motion.p
        className="font-body text-base md:text-lg text-muted-foreground leading-relaxed mb-6"
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.2 }}>
        
        I'm a Data Science student at UC San Diego with hands-on experience in data engineering, 
        product management, and full-stack development. I build ETL pipelines, analytics dashboards, 
        and proof-of-concept prototypes — always focused on turning messy, real-world data into 
        structured, actionable insight.
      </motion.p>
    </section>);

};

export default About;