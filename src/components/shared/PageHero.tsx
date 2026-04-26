import React from 'react';

import { ArrowLeft } from "lucide-react";

interface PageHeroProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'primary' | 'sky' | 'emerald' | 'amber' | 'violet' | 'rose' | 'pink' | 'indigo' | 'zinc';
  breadcrumb?: string;
  onBack?: () => void;
}

export function PageHero({ 
  title, 
  description, 
  icon, 
  actions, 
  variant = 'sky',
  breadcrumb,
  onBack
}: PageHeroProps) {
  const variants = {
    primary: 'bg-primary/15 border-primary/25 text-primary shadow-primary/5',
    sky: 'bg-sky-500/15 border-sky-500/25 text-sky-400 shadow-sky-500/5',
    emerald: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400 shadow-emerald-500/5',
    amber: 'bg-amber-500/15 border-amber-500/25 text-amber-400 shadow-amber-500/5',
    violet: 'bg-violet-500/15 border-violet-500/25 text-violet-400 shadow-violet-500/5',
    rose: 'bg-rose-500/15 border-rose-500/25 text-rose-400 shadow-rose-500/5',
    pink: 'bg-pink-500/15 border-pink-500/25 text-pink-400 shadow-pink-500/5',
    indigo: 'bg-indigo-500/15 border-indigo-500/25 text-indigo-400 shadow-indigo-500/5',
    zinc: 'bg-zinc-500/15 border-zinc-500/25 text-zinc-400 shadow-zinc-500/5',
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="space-y-1">
        {breadcrumb && (
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-13 md:ml-0">
            {breadcrumb}
          </div>
        )}
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight flex items-center gap-3 uppercase">
          {onBack && (
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors mr-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-lg shrink-0 ${variants[variant]}`}>
            {icon}
          </div>
          <span className="truncate">{title}</span>
        </h1>
        <p className="text-sm text-muted-foreground font-medium italic pl-13 md:pl-0">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actions}
      </div>
    </div>
  );
}
