import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Calendar, ArrowRight, UserPlus, Video } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ActivityFeed = ({ activities, isLoading }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'enrollment': return <UserPlus className="w-4 h-4 text-copper" />;
      case 'review': return <Star className="w-4 h-4 text-saffron fill-saffron" />;
      case 'session': return <Video className="w-4 h-4 text-gold" />;
      default: return <ShoppingCart className="w-4 h-4 text-gold" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 bg-gold/5 rounded-xl animate-pulse border border-gold/10" />
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="py-12 text-center border-2 border-dashed border-gold/5 rounded-2xl">
        <p className="text-sm text-ivory/30 italic">No recent activity found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, idx) => (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          key={activity.id}
          className="p-3 bg-ink/30 border border-gold/5 rounded-xl flex items-center justify-between group hover:border-gold/20 transition-all cursor-default"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gold/5 border border-gold/10 flex items-center justify-center shrink-0 group-hover:bg-gold/10 transition-colors">
              {getIcon(activity.type)}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-ivory truncate">{activity.title}</h4>
              <p className="text-xs text-ivory/45 line-clamp-1">{activity.description}</p>
              <p className="text-[9px] text-gold/40 mt-1 uppercase tracking-tighter">
                {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gold/0 group-hover:text-gold/40 group-hover:translate-x-1 transition-all" />
        </motion.div>
      ))}
    </div>
  );
};

export default ActivityFeed;
