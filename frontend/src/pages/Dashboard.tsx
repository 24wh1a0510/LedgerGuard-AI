import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet, ShieldCheck, AlertTriangle, CheckCircle2, Gauge, Activity,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { api } from "../lib/api";
import type { DashboardSummary } from "../lib/api";
import { PageHeader, Skeleton } from "../components/Shared";
import KpiCard from "../components/KpiCard";
import { formatCurrency, formatDate, DECISION_STYLE, RISK_COLORS } from "../lib/format";

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<{ days: string[]; volume: number[]; exceptions: number[] } | null>(null);
  const [heatmap, setHeatmap] = useState<{ risk_levels: string[]; processors: string[]; cells: any[] } | null>(null);
  const [health, setHealth] = useState<{ score: number; band: string } | null>(null);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    api.dashboard.summary().then(setSummary).catch(console.error);
    api.dashboard.trends().then(setTrends).catch(console.error);
    api.dashboard.riskHeatmap().then(setHeatmap).catch(console.error);
    api.dashboard.healthScore().then(setHealth).catch(console.error);
    api.dashboard.recentInvestigations(6).then(setRecent).catch(console.error);
  }, []);

  const chartData = trends?.days.map((d, i) => ({
    day: formatDate(d),
    volume: trends.volume[i],
    exceptions: trends.exceptions[i],
  }));

  return (
    <div>
      <PageHeader title="Executive Dashboard" subtitle="Real-time financial reconciliation overview" />

      <div className="p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {summary ? (
            <>
              <KpiCard label="Total Transactions" value={summary.total_transactions} icon={Activity} accent="primary" delay={0} />
              <KpiCard label="Reconciliation Rate" value={summary.reconciliation_rate} suffix="%" decimals={1} icon={ShieldCheck} accent="emerald" delay={0.05} />
              <KpiCard label="Money At Risk" value={summary.money_at_risk} prefix="$" decimals={0} icon={AlertTriangle} accent="danger" delay={0.1} />
              <KpiCard label="Critical Exceptions" value={summary.critical_exceptions} icon={AlertTriangle} accent="danger" delay={0.15} />
              <KpiCard label="Auto Resolved" value={summary.auto_resolved_cases} icon={CheckCircle2} accent="emerald" delay={0.2} />
              <KpiCard label="AI Confidence" value={summary.ai_confidence_score} suffix="%" decimals={1} icon={Gauge} accent="cyan" delay={0.25} />
            </>
          ) : (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-5 lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-sm">Volume & Exception Trend</h3>
                <p className="text-xs text-slate-500">Last 60 days</p>
              </div>
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            {chartData ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F8CFF" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#4F8CFF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="excGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF5B6E" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#FF5B6E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,214,0.08)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "#7d89ad", fontSize: 11 }} axisLine={false} tickLine={false} interval={6} />
                  <YAxis tick={{ fill: "#7d89ad", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#111830", border: "1px solid rgba(148,163,214,0.14)", borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Area type="monotone" dataKey="volume" stroke="#4F8CFF" fill="url(#volGrad)" strokeWidth={2} name="Volume ($)" />
                  <Area type="monotone" dataKey="exceptions" stroke="#FF5B6E" fill="url(#excGrad)" strokeWidth={2} name="Exceptions" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-64" />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card p-5 flex flex-col items-center justify-center text-center"
          >
            <h3 className="font-display font-semibold text-sm self-start mb-6">Financial Health Score</h3>
            {health ? (
              <>
                <div className="relative w-36 h-36 mb-4">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(148,163,214,0.1)" strokeWidth="10" />
                    <motion.circle
                      cx="60" cy="60" r="52" fill="none" stroke="url(#healthGrad)" strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 52}
                      initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - health.score / 100) }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                    <defs>
                      <linearGradient id="healthGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#00C896" />
                        <stop offset="100%" stopColor="#00D4FF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-display font-bold">{health.score}</span>
                    <span className="text-[10px] text-slate-500">/ 100</span>
                  </div>
                </div>
                <span className="pill bg-accent/10 border border-accent/30 text-accent">{health.band}</span>
              </>
            ) : (
              <Skeleton className="w-36 h-36 rounded-full" />
            )}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-5 lg:col-span-2 overflow-x-auto"
          >
            <h3 className="font-display font-semibold text-sm mb-4">Risk Heatmap — Impact by Processor</h3>
            {heatmap ? (
              <table className="w-full text-xs min-w-[520px]">
                <thead>
                  <tr>
                    <th className="text-left text-slate-500 font-medium pb-2"></th>
                    {heatmap.processors.map((p) => (
                      <th key={p} className="text-slate-500 font-medium pb-2">{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmap.risk_levels.map((risk) => {
                    const maxVal = Math.max(...heatmap.cells.map((c) => c.value), 1);
                    return (
                      <tr key={risk}>
                        <td className={`py-1.5 pr-3 font-medium capitalize ${RISK_COLORS[risk]?.text}`}>{risk}</td>
                        {heatmap.processors.map((p) => {
                          const cell = heatmap.cells.find((c) => c.risk_level === risk && c.processor === p);
                          const val = cell?.value ?? 0;
                          const intensity = val / maxVal;
                          return (
                            <td key={p} className="py-1.5 px-1">
                              <div
                                className="rounded-lg h-9 flex items-center justify-center font-mono text-[10px]"
                                style={{
                                  background: val > 0 ? `rgba(255,91,110,${0.08 + intensity * 0.45})` : "rgba(148,163,214,0.04)",
                                  color: val > 0 ? "#fff" : "#5b6588",
                                }}
                                title={`${risk} / ${p}: $${val.toLocaleString()}`}
                              >
                                {val > 0 ? `$${(val / 1000).toFixed(1)}k` : "—"}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <Skeleton className="h-40" />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="glass-card p-5"
          >
            <h3 className="font-display font-semibold text-sm mb-4">Recent Investigations</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {recent.length ? (
                recent.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    className="flex items-start gap-2.5 pb-3 border-b border-border last:border-0 last:pb-0"
                  >
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${RISK_COLORS[r.risk_level]?.dot}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-200 truncate">{r.transaction_id} · {r.root_cause}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`pill text-[10px] px-1.5 py-0.5 ${DECISION_STYLE[r.decision]?.bg} ${DECISION_STYLE[r.decision]?.text}`}>
                          {r.decision.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-slate-500">{formatCurrency(r.financial_impact)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <Skeleton className="h-40" />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
