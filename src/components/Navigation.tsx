import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MenuOverlay from "./MenuOverlay";

const Navigation = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolledPast(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Top header — visible at top of page */}
      <AnimatePresence>
        {!scrolledPast && (
          <motion.header
            className="fixed top-0 left-0 right-0 z-[80] flex items-center justify-between px-8 md:px-12 py-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <a
              href="#"
              className="font-display text-lg tracking-[0.15em] text-[#3A3A3A] hover:text-accent transition-colors"
            >
              Amey Gupta
            </a>

            <nav className="flex items-center gap-8 font-body text-sm tracking-widest uppercase">
              <a href="#about" className="text-[#3A3A3A] hover:text-accent transition-colors">About</a>
              <a href="#projects" className="text-[#3A3A3A] hover:text-accent transition-colors">Projects</a>
              <a href="https://linkedin.com/in/amey-gupta" target="_blank" rel="noopener noreferrer" className="text-[#3A3A3A] hover:text-accent transition-colors">LinkedIn</a>
              <a href="https://github.com/AmeyGupta25" target="_blank" rel="noopener noreferrer" className="text-[#3A3A3A] hover:text-accent transition-colors">GitHub</a>
            </nav>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Floating menu pill — visible when scrolled past header */}
      <AnimatePresence>
        {scrolledPast && !menuOpen && (
          <motion.button
            onClick={() => setMenuOpen(true)}
            className="fixed top-6 right-8 md:right-12 z-[85] px-6 py-2 rounded-full border border-foreground/20 bg-[#FAFAF8] font-body text-sm tracking-widest uppercase text-foreground/80 hover:text-accent hover:border-accent transition-colors cursor-pointer shadow-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            Menu
          </motion.button>
        )}
      </AnimatePresence>

      <MenuOverlay isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
};

export default Navigation;
