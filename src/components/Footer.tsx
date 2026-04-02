import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const Footer = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <footer id="contact" className="py-32 px-8 md:px-12 max-w-4xl mx-auto text-center" ref={ref}>
      <motion.p
        className="font-body text-sm tracking-[0.3em] uppercase text-accent mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}>
        
        Want to get in Touch?
      </motion.p>
      <motion.h2
        className="font-display text-4xl md:text-6xl font-light text-foreground mb-8"
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.1 }}>
        
        Let's connect. 
      </motion.h2>
      <motion.div
        className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.3 }}>
        <a
          href="mailto:Ameygupta25@gmail.com"
          className="inline-block font-body text-sm tracking-[0.2em] uppercase text-accent border-b border-accent pb-1 hover:text-foreground hover:border-foreground transition-colors">
          Ameygupta25@gmail.com
        </a>
        <a
          href="tel:+18053046649"
          className="inline-block font-body text-sm tracking-[0.2em] uppercase text-accent border-b border-accent pb-1 hover:text-foreground hover:border-foreground transition-colors">
          (805)-304-6649
        </a>
      </motion.div>

      <div className="mt-24 pt-8 border-t border-border">
        <p className="font-body text-xs text-muted-foreground tracking-wider">
          © {new Date().getFullYear()} Amey Gupta. All rights reserved.
        </p>
      </div>
    </footer>);

};

export default Footer;