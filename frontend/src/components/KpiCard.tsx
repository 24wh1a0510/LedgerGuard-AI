import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let raf: number;
    function step(ts: number) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export default function KpiCard({
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  icon: Icon,
  accent = "primary",
  trend,
  delay = 0,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: LucideIcon;
  accent?: "primary" | "cyan" | "emerald" | "danger";
  trend?: string;
  delay?: number;
}) {
  const animated = useCountUp(value);
  const accentMap = {
    primary: { grad: "from-primary to-secondary", glow: "shadow-glow", text: "text-primary" },
    cyan: { grad: "from-secondary to-primary", glow: "shadow-glow-cyan", text: "text-secondary" },
    emerald: { grad: "from-accent to-secondary", glow: "shadow-glow-emerald", text: "text-accent" },
    danger: { grad: "from-danger to-orange-400", glow: "shadow-glow-danger", text: "text-danger" },
  }[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card p-5 relative overflow-hidden group"
    >
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${accentMap.grad} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accentMap.grad} flex items-center justify-center ${accentMap.glow}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && <span className="text-xs font-medium text-slate-400">{trend}</span>}
      </div>
      <div className="text-2xl font-display font-bold tabular-nums">
        {prefix}
        {animated.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
        {suffix}
      </div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </motion.div>
  );
}
