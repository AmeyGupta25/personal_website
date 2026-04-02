import { motion, AnimatePresence } from "framer-motion";

interface MenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const links = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Contact", href: "#contact" },
];

const MenuOverlay = ({ isOpen, onClose }: MenuOverlayProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center"
          initial={{ clipPath: "circle(0% at calc(100% - 3rem) 2rem)" }}
          animate={{ clipPath: "circle(150% at calc(100% - 3rem) 2rem)" }}
          exit={{ clipPath: "circle(0% at calc(100% - 3rem) 2rem)" }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          style={{ backgroundColor: "hsl(40, 10%, 92%)" }}
        >
          <button
            onClick={onClose}
            className="absolute top-8 right-8 font-body text-sm tracking-widest uppercase text-foreground/70 hover:text-accent transition-colors"
          >
            Close
          </button>

          <nav className="flex flex-col items-center gap-4">
            {links.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                onClick={onClose}
                className="font-display text-5xl md:text-7xl font-light text-foreground hover:text-accent transition-colors tracking-wide"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  delay: 0.3 + i * 0.08,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {link.label}
              </motion.a>
            ))}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MenuOverlay;
