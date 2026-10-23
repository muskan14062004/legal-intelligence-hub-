import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RiskBadgeProps {
  level: 'Low' | 'Medium' | 'High' | string;
  size?: 'sm' | 'md';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md' }) => {
  const normLevel = level.toLowerCase();
  
  if (normLevel === 'high') {
    return (
      <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}>
        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
        High Risk
      </span>
    );
  }

  if (normLevel === 'medium') {
    return (
      <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}>
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        Medium Risk
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
    }`}>
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      Low Risk
    </span>
  );
};
