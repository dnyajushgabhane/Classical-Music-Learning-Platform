import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import useThemeStore from '../../store/themeStore';

export function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative p-2 rounded-full border border-gold/25 text-ivory/60
        hover:text-gold hover:border-gold/50 hover:bg-gold/5
        transition-colors focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-gold/40 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="sun"
            initial={{ rotate: -30, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 30, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="block"
          >
            <Sun className="w-4 h-4" />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate: 30, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -30, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="block"
          >
            <Moon className="w-4 h-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
