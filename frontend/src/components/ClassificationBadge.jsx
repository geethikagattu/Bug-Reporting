import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const ClassificationBadge = ({ isValid, confidence }) => {
  const isBug = isValid;
  const colorClass = isBug ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20';
  const Icon = isBug ? CheckCircle : XCircle;
  const label = isBug ? 'Valid Bug' : 'Invalid Bug';
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${colorClass}`}>
      <Icon className="w-3.5 h-3.5" />
      <span className="text-xs font-medium">{label}</span>
      {confidence && <span className="text-[10px] opacity-75 ml-1 border-l pl-1.5 border-current">{Math.round(confidence * 100)}% conf.</span>}
    </div>
  );
};

export default ClassificationBadge;
