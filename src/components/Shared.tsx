import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-6 lg:px-8 py-6 border-b border-border sticky top-0 z-20 bg-navy/70 backdrop-blur-xl"
    >
      <div>
        <h1 className="text-xl font-display font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </motion.div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-border flex items-center justify-center mb-4">
        <span className="text-2xl">◇</span>
      </div>
      <div className="font-medium text-slate-300">{title}</div>
      {subtitle && <div className="text-sm text-slate-500 mt-1 max-w-sm">{subtitle}</div>}
    </div>
  );
}
