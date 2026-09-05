import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { api } from "../lib/api";
import { PageHeader, Skeleton, EmptyState } from "../components/Shared";
import { formatCurrency, categoryLabel } from "../lib/format";

const COLORS = ["#4F8CFF", "#00D4FF", "#00C896", "#FF5B6E", "#F5A524", "#A78BFA", "#F472B6", "#34D399"];

export default function Analytics() {
  const [leakage, setLeakage] = useState<any[] | null>(null);
  const [feeAnomalies, setFeeAnomalies] = useState<any[] | null>(null);
  const [delays, setDelays] = useState<any[] | null>(null);
  const [duplicates, setDuplicates] = useState<any[] | null>(null);
  const [recovery, setRecovery] = useState<{ total_recoverable: number; opportunities: any[] } | null>(null);
  const [processors, setProcessors] = useState<any[] | null>(null);

  useEffect(() => {
    api.analytics.leakageByCategory().then(setLeakage);
    api.analytics.feeAnomalies().then(setFeeAnomalies);
    api.analytics.settlementDelays().then(setDelays);
    api.analytics.duplicates().then(setDuplicates);
    api.analytics.recoveryOpportunities().then(setRecovery);
    api.analytics.processorBreakdown().then(setProcessors);
  }, []);

  return (
    <div>
      <PageHeader title="Analytics & Insights" subtitle="Leakage trends, anomalies, and recovery opportunities" />

      <div className="p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leakage by category */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <h3 className="font-display font-semibold text-sm mb-4">Leakage by Category</h3>
            {leakage ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={leakage.map((l) => ({ ...l, category: categoryLabel(l.category) }))} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,214,0.08)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#7d89ad", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="category" tick={{ fill: "#9ca6c9", fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
                  <Tooltip contentStyle={{ background: "#111830", border: "1px solid rgba(148,163,214,0.14)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="amount_at_risk" radius={[0, 6, 6, 0]}>
                    {leakage.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-64" />}
          </motion.div>

          {/* Processor volume */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5">
            <h3 className="font-display font-semibold text-sm mb-4">Volume by Processor</h3>
            {processors ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={220}>
                  <PieChart>
                    <Pie data={processors} dataKey="volume" nameKey="processor" innerRadius={50} outerRadius={85} paddingAngle={3}>
                      {processors.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#111830", border: "1px solid rgba(148,163,214,0.14)", borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {processors.map((p, i) => (
                    <div key={p.processor} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        {p.processor}
                      </span>
                      <span className="font-mono text-slate-400">{formatCurrency(p.volume)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <Skeleton className="h-56" />}
          </motion.div>
        </div>

        {/* Recovery opportunities */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm">Recovery Opportunities</h3>
            {recovery && <span className="text-lg font-display font-bold text-accent">{formatCurrency(recovery.total_recoverable)}</span>}
          </div>
          {recovery ? (
            recovery.opportunities.length === 0 ? <EmptyState title="Nothing to recover — all clear" /> : (
              <div className="space-y-2">
                {recovery.opportunities.slice(0, 8).map((o) => (
                  <div key={o.transaction_id} className="flex items-center justify-between text-xs py-2 border-b border-border/60 last:border-0">
                    <div>
                      <span className="font-mono text-slate-300">{o.transaction_id}</span>
                      <span className="text-slate-500 ml-2">{o.root_cause}</span>
                    </div>
                    <span className="font-mono text-accent">{formatCurrency(o.financial_impact)}</span>
                  </div>
                ))}
              </div>
            )
          ) : <Skeleton className="h-40" />}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fee anomalies */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
            <h3 className="font-display font-semibold text-sm mb-4">Fee Anomalies</h3>
            {feeAnomalies ? (
              feeAnomalies.length === 0 ? <EmptyState title="No fee anomalies detected" /> : (
                <div className="space-y-2 text-xs">
                  {feeAnomalies.map((f) => (
                    <div key={f.transaction_id} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
                      <span className="font-mono text-slate-300">{f.transaction_id} · {f.processor}</span>
                      <span className="text-danger">{f.actual_fee_pct}% vs {f.expected_fee_pct}% expected</span>
                    </div>
                  ))}
                </div>
              )
            ) : <Skeleton className="h-32" />}
          </motion.div>

          {/* Settlement delays */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
            <h3 className="font-display font-semibold text-sm mb-4">Settlement Delays</h3>
            {delays ? (
              delays.length === 0 ? <EmptyState title="No delayed settlements" /> : (
                <div className="space-y-2 text-xs">
                  {delays.map((d) => (
                    <div key={d.transaction_id} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
                      <span className="font-mono text-slate-300">{d.transaction_id} · {d.processor}</span>
                      <span className="text-orange-400">{d.days_delayed} days late</span>
                    </div>
                  ))}
                </div>
              )
            ) : <Skeleton className="h-32" />}
          </motion.div>
        </div>

        {/* Duplicates */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
          <h3 className="font-display font-semibold text-sm mb-4">Duplicate Transactions</h3>
          {duplicates ? (
            duplicates.length === 0 ? <EmptyState title="No duplicates detected" /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {duplicates.map((d) => (
                  <div key={d.transaction_id} className="rounded-xl border border-danger/20 bg-danger/5 p-3 text-xs">
                    <div className="font-mono text-slate-300">{d.transaction_id}</div>
                    <div className="text-slate-500 mt-1">{d.customer_name} · {d.processor}</div>
                    <div className="text-danger font-medium mt-1">Overpaid {formatCurrency(d.overpaid_amount)}</div>
                  </div>
                ))}
              </div>
            )
          ) : <Skeleton className="h-24" />}
        </motion.div>
      </div>
    </div>
  );
}
