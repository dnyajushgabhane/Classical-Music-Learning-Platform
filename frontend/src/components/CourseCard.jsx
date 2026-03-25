import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Star } from 'lucide-react';
import clsx from 'clsx';

function Rating({ value = 4.8 }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={clsx(
            'w-3.5 h-3.5',
            i <= Math.round(value) ? 'text-gold fill-gold/85' : 'text-ivory/15'
          )}
        />
      ))}
      <span className="ml-1.5 text-xs text-ivory/50 tabular-nums">{value.toFixed(1)}</span>
    </div>
  );
}

function LevelBadge({ level }) {
  const advanced = /advanced|intermediate/i.test(level || '');
  return (
    <span
      className={clsx(
        'text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border',
        advanced
          ? 'border-saffron/40 bg-saffron/10 text-saffron'
          : 'border-gold/35 bg-gold/10 text-gold-light'
      )}
    >
      {level}
    </span>
  );
}

/** Decorative “strings” that subtly vibrate on hover */
function StringDecor({ className }) {
  return (
    <div
      className={clsx('flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300', className)}
      aria-hidden
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-px h-8 bg-gradient-to-b from-gold/50 to-transparent animate-string-vibrate"
          style={{ animationDelay: `${i * 0.05}s` }}
        />
      ))}
    </div>
  );
}

export default function CourseCard({ course, index = 0 }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 280, damping: 28 });
  const springY = useSpring(y, { stiffness: 280, damping: 28 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-7, 7]);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    x.set(px);
    y.set(py);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const rating = course.rating ?? 4.8;
  const thumb = course.thumbnail || 'https://images.unsplash.com/photo-1514320291840-2e0fef7de6c6?w=640&q=80';

  return (
    <div className="perspective-dramatic h-full">
      <motion.article
        ref={ref}
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="group h-full"
      >
      <div className="relative rounded-2xl bg-background-card border border-gold/20 shadow-card transition-[box-shadow,transform] duration-500 group-hover:shadow-card-hover group-hover:border-gold/35 overflow-hidden h-full">
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20"
          style={{
            background:
              'linear-gradient(105deg, transparent 40%, rgba(248,241,233,0.12) 48%, rgba(248,241,233,0.05) 52%, transparent 60%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2.2s ease-in-out infinite',
          }}
        />
        <div className="relative h-48 overflow-hidden">
          <motion.img
            src={thumb}
            alt={course.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.6 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-gold/30 bg-ink/70 text-gold backdrop-blur-sm">
            {course.instrument || course.category}
          </span>
          <StringDecor className="absolute bottom-3 left-4" />
        </div>
        <div className="relative p-6 z-10" style={{ transform: 'translateZ(24px)' }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <LevelBadge level={course.level} />
            <Rating value={rating} />
          </div>
          <h3 className="text-xl font-display font-semibold text-ivory leading-snug mb-3 min-h-[3.5rem] line-clamp-2">
            {course.title}
          </h3>
          <p className="text-sm text-ivory/50 mb-5">{course.instructor?.name}</p>
          <div className="flex items-end justify-between border-t border-gold/10 pt-4">
            <span className="text-xs uppercase tracking-widest text-ivory/40">Enrollment</span>
            <span className="text-2xl font-display font-semibold text-gradient-gold">₹{course.price}</span>
          </div>
        </div>
      </div>
      </motion.article>
    </div>
  );
}
