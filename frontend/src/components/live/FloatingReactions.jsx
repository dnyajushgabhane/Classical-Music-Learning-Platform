import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingReactions({ reactions, onRemove }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {reactions.map((r) => (
          <ReactionItem key={r.id} reaction={r} onRemove={() => onRemove(r.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ReactionItem({ reaction, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, 3000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, y: '80vh', x: reaction.x, scale: 0.5 }}
      animate={{ 
        opacity: [0, 1, 1, 0], 
        y: '-10vh', 
        x: reaction.x + (Math.random() * 100 - 50),
        scale: [0.5, 1.2, 1, 1.5]
      }}
      transition={{ duration: 3, ease: 'easeOut' }}
      className="absolute text-5xl"
    >
      {reaction.type}
      <div className="text-[10px] bg-black/40 px-1 rounded absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-white">
        {reaction.name}
      </div>
    </motion.div>
  );
}
