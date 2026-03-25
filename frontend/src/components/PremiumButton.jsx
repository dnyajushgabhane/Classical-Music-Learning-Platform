import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

const base =
  'relative inline-flex items-center justify-center overflow-hidden rounded-full px-8 py-3.5 text-sm font-semibold tracking-wide transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink';

const variants = {
  primary:
    'bg-gradient-to-br from-gold-light via-gold to-gold-dark text-ink shadow-glow-sm hover:shadow-glow active:brightness-95',
  outline:
    'border border-gold/40 bg-ink/50 text-ivory backdrop-blur-md hover:border-gold/75 hover:shadow-glow-sm',
  ghost: 'text-ivory/90 hover:text-gold border border-gold/20 bg-transparent hover:bg-gold/5',
};

export function PremiumButton({ children, variant = 'primary', className, to, type = 'button', ...rest }) {
  const classes = clsx(base, variants[variant], className);
  const label = <span className="relative z-10">{children}</span>;

  if (to) {
    return (
      <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
        <Link to={to} className={classes} {...rest}>
          {label}
        </Link>
      </motion.span>
    );
  }

  return (
    <motion.button type={type} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={classes} {...rest}>
      {label}
    </motion.button>
  );
}
