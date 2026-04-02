import { motion, useAnimation } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";

const firstName = ["A", "M", "E", "Y"];
const lastName = ["G", "U", "P", "T", "A"];
const subtitles = ["Data Engineer", "Product Thinker", "Full-Stack Builder", "Problem Solver"];

const Hero = () => {
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const nameRef = useRef<HTMLDivElement>(null);
  const firstControls = useAnimation();
  const lastControls = useAnimation();

  const animateLetters = useCallback(() => {
    firstControls.set({ opacity: 0, y: 80 });
    lastControls.set({ opacity: 0, y: 80 });
    firstName.forEach((_, i) => {
      firstControls.start((j) => {
        if (j !== i) return {};
        return { opacity: 1, y: 0, transition: { delay: 0.3 + i * 0.07, duration: 0.7, ease: [0.22, 1, 0.36, 1] } };
      });
    });
    lastName.forEach((_, i) => {
      lastControls.start((j) => {
        if (j !== i) return {};
        return { opacity: 1, y: 0, transition: { delay: 0.6 + i * 0.07, duration: 0.7, ease: [0.22, 1, 0.36, 1] } };
      });
    });
  }, [firstControls, lastControls]);

  useEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) animateLetters();
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animateLetters]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % subtitles.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-8">
      <motion.span
        className="absolute font-display text-[20vw] md:text-[18vw] font-light text-foreground/[0.03] select-none tracking-widest uppercase whitespace-nowrap"
        animate={{ x: [0, -30, 0], y: [0, 15, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        Data
      </motion.span>

      <div className="relative z-10 text-center" ref={nameRef}>
        {/* First name */}
        <div className="flex items-center justify-center gap-1 md:gap-2">
          {firstName.map((letter, i) => (
            <div key={`first-${i}`} className="overflow-hidden">
              <motion.span
                custom={i}
                animate={firstControls}
                initial={{ opacity: 0, y: 80 }}
                className="font-display text-7xl md:text-9xl lg:text-[10rem] font-semibold tracking-tight text-foreground leading-none block"
              >
                {letter}
              </motion.span>
            </div>
          ))}
        </div>

        {/* Last name */}
        <div className="flex items-center justify-center gap-1 md:gap-2 -mt-2 md:-mt-4">
          {lastName.map((letter, i) => (
            <div key={`last-${i}`} className="overflow-hidden">
              <motion.span
                custom={i}
                animate={lastControls}
                initial={{ opacity: 0, y: 80 }}
                className="font-display text-7xl md:text-9xl lg:text-[10rem] font-light tracking-[0.05em] text-foreground/80 leading-none block"
              >
                {letter}
              </motion.span>
            </div>
          ))}
        </div>

        {/* Subtitle */}
        <motion.div
          className="mt-8 h-8 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <motion.p
            key={subtitleIndex}
            className="font-body text-base md:text-lg tracking-[0.3em] uppercase text-muted-foreground"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {subtitles[subtitleIndex]}
          </motion.p>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        <span className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Scroll</span>
        <motion.div
          className="w-[1px] h-8 bg-foreground/20"
          animate={{ scaleY: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ originY: 0 }}
        />
      </motion.div>
    </section>
  );
};

export default Hero;
