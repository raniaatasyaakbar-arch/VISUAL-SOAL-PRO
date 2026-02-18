import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title, icon }) => {
  return (
    <div className={`bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl shadow-slate-200/50 p-6 ${className}`}>
      {(title || icon) && (
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          {icon && <div className="text-red-500">{icon}</div>}
          {title && <h3 className="text-lg font-bold text-slate-800">{title}</h3>}
        </div>
      )}
      {children}
    </div>
  );
};