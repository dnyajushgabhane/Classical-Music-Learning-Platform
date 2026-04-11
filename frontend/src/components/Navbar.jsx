import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import { PremiumButton } from './PremiumButton';
import { LogOut, User, Zap, Menu, X, Sun, Moon } from 'lucide-react';
import API from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import LogoMark from './LogoMark';

const navLinkClass = ({ isActive }) =>
  `link-underline-gold text-sm font-medium tracking-wide transition-colors ${
    isActive ? 'text-gold' : 'text-ivory/70 hover:text-ivory'
  }`;

function NavBarLink(props) {
  return <NavLink {...props} className={navLinkClass} />;
}

function ThemeToggle({ className = '' }) {
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

const Navbar = () => {
  const { userInfo, logout } = useAuthStore();
  const [isPremium, setIsPremium] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const checkSub = async () => {
      if (userInfo) {
        try {
          const { data } = await API.get('/subscriptions');
          setIsPremium(data.tier === 'Premium' && data.status === 'Active');
        } catch {
          /* optional subscription */
        }
      }
    };
    checkSub();
  }, [userInfo]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const links = (
    <>
      <NavBarLink to="/courses" onClick={() => setOpen(false)}>
        Masterclasses
      </NavBarLink>
      <NavLink
        to="/events"
        onClick={() => setOpen(false)}
        className={({ isActive }) =>
          `flex items-center gap-2 text-sm font-medium tracking-wide transition-colors link-underline-gold ${
            isActive ? 'text-gold' : 'text-ivory/70 hover:text-ivory'
          }`
        }
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron opacity-40" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-saffron" />
        </span>
        Live mehfil
      </NavLink>
      <NavBarLink to="/practice" onClick={() => setOpen(false)}>
        Practice
      </NavBarLink>
      {!isPremium && (
        <NavLink
          to="/pricing"
          onClick={() => setOpen(false)}
          className="flex items-center gap-1.5 text-sm font-semibold text-gold hover:text-gold-light transition-colors link-underline-gold"
        >
          <Zap className="w-4 h-4 fill-gold/40" /> Premium
        </NavLink>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3 group shrink-0" onClick={() => setOpen(false)}>
            <motion.div whileHover={{ rotate: [0, -6, 6, 0] }} transition={{ duration: 0.6 }}>
              <LogoMark className="w-9 h-9" />
            </motion.div>
            <span className="font-display text-2xl font-semibold tracking-tight text-ivory">
              Raag<span className="text-gradient-gold">Vidya</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-10">{links}</div>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />

            {userInfo ? (
              <>
                {userInfo.role === 'Instructor' ? (
                  <Link
                    to="/instructor-dashboard"
                    className="text-sm font-semibold text-gold hover:text-gold-light transition-colors link-underline-gold"
                  >
                    Teacher panel
                  </Link>
                ) : (
                  <NavBarLink to="/dashboard">Dashboard</NavBarLink>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-2 text-sm text-ivory/65 hover:text-gold transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </>
            ) : (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-light via-gold to-gold-dark px-6 py-2.5 text-sm font-semibold text-ink shadow-glow-sm hover:shadow-glow transition-shadow"
                >
                  <User className="h-4 w-4" /> Sign in
                </Link>
              </motion.div>
            )}
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              className="p-2 rounded-lg border border-gold/20 text-ivory hover:bg-gold/10 transition-colors"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-gold/15 bg-ink/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-6 flex flex-col gap-5">{links}</div>
            {userInfo ? (
              <div className="px-4 pb-6 flex flex-col gap-3 border-t border-gold/10 pt-5">
                {userInfo.role === 'Instructor' ? (
                  <Link
                    to="/instructor-dashboard"
                    className="text-gold font-semibold"
                    onClick={() => setOpen(false)}
                  >
                    Teacher panel
                  </Link>
                ) : (
                  <Link to="/dashboard" className="text-ivory/90" onClick={() => setOpen(false)}>
                    Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="text-left text-ivory/65"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="px-4 pb-8">
                <Link
                  to="/login"
                  className="block text-center rounded-full bg-gradient-to-r from-gold to-gold-dark py-3 font-semibold text-ink"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
