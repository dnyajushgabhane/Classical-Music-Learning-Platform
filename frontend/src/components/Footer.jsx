import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function TanpuraSilhouette({ className }) {
  return (
    <svg
      viewBox="0 0 320 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="ftGold" x1="0" y1="0" x2="320" y2="0">
          <stop stopColor="#D4AF37" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#E8C85C" stopOpacity="0.35" />
          <stop offset="1" stopColor="#B87333" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      {/* Resonator */}
      <ellipse cx="52" cy="48" rx="38" ry="22" stroke="url(#ftGold)" strokeWidth="1.2" fill="rgba(212,175,55,0.04)" />
      {/* Neck */}
      <path
        d="M90 44 L165 28 L280 26"
        stroke="url(#ftGold)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Peg box */}
      <path d="M268 20 L298 12 L305 38 L275 44 Z" stroke="url(#ftGold)" strokeWidth="1" fill="rgba(212,175,55,0.03)" />
      {/* Strings — subtle vibration via motion group */}
      {[0, 1, 2, 3].map((i) => (
        <motion.g
          key={i}
          animate={{ x: [0, 0.35, -0.35, 0] }}
          transition={{ duration: 2.2 + i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
        >
          <line
            x1={96 + i * 3}
            y1={42}
            x2={270 + i * 2}
            y2={28 + i * 1.2}
            stroke="url(#ftGold)"
            strokeWidth="0.6"
            opacity="0.5"
          />
        </motion.g>
      ))}
      {/* Decorative arc (sitar-inspired) */}
      <path
        d="M170 60 Q230 48 285 52"
        stroke="url(#ftGold)"
        strokeWidth="0.8"
        strokeDasharray="4 6"
        opacity="0.4"
      />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-gold/15 bg-ink/90">
      <div className="absolute inset-0 bg-gradient-to-t from-maroon-deep/40 to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <TanpuraSilhouette className="w-full max-w-xl mx-auto mb-10 opacity-90" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-sm text-ivory/55">
          <p className="font-serif text-ivory/80 tracking-wide text-center md:text-left">
            RaagVidya — where <span className="text-gradient-gold">gharanas</span> meet the future of learning.
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            <Link to="/courses" className="link-underline-gold hover:text-gold transition-colors">
              Masterclasses
            </Link>
            <Link to="/events" className="link-underline-gold hover:text-gold transition-colors">
              Live mehfil
            </Link>
            <Link to="/pricing" className="link-underline-gold hover:text-gold transition-colors">
              Membership
            </Link>
          </div>
        </div>
        <p className="text-center text-xs text-ivory/35 mt-10 tracking-widest uppercase">
          © {new Date().getFullYear()} RaagVidya. Crafted for the serious student.
        </p>
      </div>
    </footer>
  );
}
