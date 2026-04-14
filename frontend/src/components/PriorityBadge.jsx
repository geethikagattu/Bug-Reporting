import React from 'react';

const PriorityBadge = ({ priority }) => {
  const colors = {
    'Low': 'bg-slate-400/20 text-slate-300 border border-slate-400/30',
    'Medium': 'bg-blue-400/20 text-blue-300 border border-blue-400/30',
    'High': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    'Critical': 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
  };
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${colors[priority] || colors['Medium']}`}>
      {priority}
    </span>
  );
};

export default PriorityBadge;
