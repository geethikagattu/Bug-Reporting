import React from 'react';

const StatusBadge = ({ status }) => {
  const colors = {
    'Open': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    'In Progress': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    'Resolved': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    'Closed': 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
  };
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${colors[status] || colors['Open']}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
