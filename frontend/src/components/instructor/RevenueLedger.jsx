import React from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';

const RevenueLedger = ({ entries, total, pages, currentPage, onPageChange, isLoading, compact = false }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 bg-gold/5 rounded-xl border border-gold/10 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="py-12 text-center border-2 border-dashed border-gold/5 rounded-2xl bg-gold/[0.02]">
        <DollarSign className="w-10 h-10 text-gold/20 mx-auto mb-4" />
        <p className="text-[10px] text-ivory/30 italic uppercase font-bold tracking-widest px-8 leading-relaxed">No revenue records found</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {entries.slice(0, 5).map((entry, idx) => (
          <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: idx * 0.05 }}
             key={entry._id} 
             className="p-4 bg-ink/40 border border-gold/5 rounded-xl flex items-center justify-between hover:border-gold/20 transition-all group"
          >
             <div className="flex items-center gap-4 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-green-500/5 border border-green-500/10 flex items-center justify-center shrink-0">
                   <DollarSign className="w-4 h-4 text-green-400" />
                </div>
                <div className="min-w-0">
                   <p className="text-[11px] font-bold text-ivory truncate">{entry.studentName}</p>
                   <p className="text-[10px] text-ivory/40 truncate leading-tight">{entry.courseTitle}</p>
                   <p className="text-[9px] text-ivory/30 mt-1 uppercase tracking-tighter">{new Date(entry.date).toLocaleDateString()}</p>
                </div>
             </div>
             <div className="text-right shrink-0">
                <p className="text-xs font-bold text-gradient-gold">₹{entry.amount.toLocaleString()}</p>
                <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">{entry.status}</span>
             </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gold/10">
              <th className="px-4 py-3 text-[10px] uppercase font-bold text-gold tracking-widest">Student</th>
              <th className="px-4 py-3 text-[10px] uppercase font-bold text-gold tracking-widest">Course / Session</th>
              <th className="px-4 py-3 text-[10px] uppercase font-bold text-gold tracking-widest">Date</th>
              <th className="px-4 py-3 text-[10px] uppercase font-bold text-gold tracking-widest text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold/5">
            {entries.map((entry, idx) => (
              <motion.tr 
                key={entry._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="hover:bg-gold/5 transition-colors group"
              >
                <td className="px-4 py-4 min-w-[150px]">
                  <p className="text-sm font-semibold text-ivory group-hover:text-gold transition-colors">{entry.studentName}</p>
                  <p className="text-[10px] text-ivory/40 lowercase tracking-tighter">{entry.studentEmail}</p>
                </td>
                <td className="px-4 py-4 min-w-[200px]">
                  <p className="text-sm text-ivory/70 font-display line-clamp-1">{entry.courseTitle}</p>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                   <p className="text-xs text-ivory/50">{new Date(entry.date).toLocaleDateString()}</p>
                   <p className="text-[10px] text-ivory/30">{new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </td>
                <td className="px-4 py-4 text-right">
                   <p className="text-sm font-bold text-gradient-gold">₹{entry.amount.toLocaleString()}</p>
                   <span className="text-[8px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded uppercase tracking-widest">{entry.status}</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-gold/10">
          <p className="text-[10px] text-ivory/30 uppercase tracking-widest">Showing page {currentPage} of {pages}</p>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="p-2 rounded-lg bg-gold/5 border border-gold/10 text-gold/60 hover:text-gold disabled:opacity-30 disabled:hover:text-gold/60 transition-colors focus:ring-1 focus:ring-gold"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              disabled={currentPage === pages}
              onClick={() => onPageChange(currentPage + 1)}
              className="p-2 rounded-lg bg-gold/5 border border-gold/10 text-gold/60 hover:text-gold disabled:opacity-30 disabled:hover:text-gold/60 transition-colors focus:ring-1 focus:ring-gold"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueLedger;
