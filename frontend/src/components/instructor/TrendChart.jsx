import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const CustomTooltip = ({ active, payload, label, dataKey }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-ink border border-gold/20 p-2 rounded-lg shadow-glow-sm">
        <p className="text-[10px] text-ivory/40 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-bold text-gold">
          {dataKey === 'revenue' ? `₹${payload[0].value.toLocaleString()}` : `${payload[0].value} Students`}
        </p>
      </div>
    );
  }
  return null;
};

const TrendChart = ({ data, dataKey, color = "#d4af37", isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-64 w-full flex items-center justify-center border border-gold/5 rounded-2xl bg-gold/5 animate-pulse">
        <p className="text-xs text-gold/30 italic">Decrypting analytics...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex flex-col items-center justify-center border-2 border-dashed border-gold/5 rounded-2xl">
        <p className="text-xs text-ivory/30 italic">More data points required</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(212, 175, 55, 0.05)" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255, 255, 240, 0.3)', fontSize: 10 }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255, 255, 240, 0.3)', fontSize: 10 }} 
          />
          <Tooltip content={<CustomTooltip dataKey={dataKey} />} />
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1} 
            fill={`url(#gradient-${dataKey})`} 
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;
