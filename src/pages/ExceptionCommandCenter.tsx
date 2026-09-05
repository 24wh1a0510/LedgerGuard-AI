import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Investigation } from "../lib/api";
import { PageHeader, Skeleton, EmptyState } from "../components/Shared";
import { formatCurrency, DECISION_STYLE, RISK_COLORS } from "../lib/format";

const RISK_ORDER = ["critical", "high", "medium", "low"] as const;

export default function ExceptionCommandCenter() {
  const [investigations, setInvestigations] = useState<Investigation[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    api.investigations.list({ sort_by_risk: "true" as any }).then(setInvestigations);
    api.investigations.exceptionCounts().then(setCounts);
  }, []);

  const filtered = investigations?.filter((i) => !activeFilter || i.risk_level === activeFilter);

  return (
    <div>
      <PageHeader title="Exception Command Center" subtitle="Every open case, prioritized by risk" />

      <div className="p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {RISK_ORDER.map((risk, i) => (
            <motion.button
              key={risk}
              onClick={() => setActiveFilter(activeFilter === risk ? null : risk)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-card p-5 text-left transition-all ${activeFilter === risk ? "border-primary/50" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${RISK_COLORS[risk].dot}`} />
                <span className="text-[10px] uppercase tracking-wide text-slate-500">{risk}</span>
              </div>
              <div className="text-2xl font-display font-bold">{counts ? counts[risk] ?? 0 : "—"}</div>
              <div className="text-xs text-slate-500">open cases</div>
            </motion.button>
          ))}
        </div>

        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-[0.7fr_1.4fr_0.7fr_0.7fr_0.9fr_0.9fr] gap-2 px-5 py-3 text-[11px] uppercase tracking-wide text-slate-500 border-b border-border">
            <span>Risk</span>
            <span>Transaction / Root Cause</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Confidence</span>
            <span>Suggested Action</span>
            <span></span>
          </div>

          {filtered === null || filtered === undefined ? (
            <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No exceptions in this bucket" />
          ) : (
            filtered.map((inv, i) => (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                className="grid grid-cols-[0.7fr_1.4fr_0.7fr_0.7fr_0.9fr_0.9fr] gap-2 px-5 py-3 text-sm items-center border-b border-border/60 hover:bg-white/5"
              >
                <span className={`pill w-fit text-[10px] ${RISK_COLORS[inv.risk_level].bg} ${RISK_COLORS[inv.risk_level].text}`}>
                  {inv.risk_level}
                </span>
                <div className="min-w-0">
                  <div className="font-mono text-xs text-slate-300">{inv.transaction_id}</div>
                  <div className="text-xs text-slate-500 truncate">{inv.root_cause}</div>
                </div>
                <span className="text-right font-mono tabular-nums text-danger">{formatCurrency(inv.financial_impact)}</span>
                <span className="text-right font-mono tabular-nums text-slate-300">{inv.confidence_score}%</span>
                <span className={`pill w-fit text-[10px] ${DECISION_STYLE[inv.decision].bg} ${DECISION_STYLE[inv.decision].text}`}>
                  {inv.decision.replace("_", " ")}
                </span>
                <Link to={`/investigations?tx=${inv.transaction_id}`} className="text-xs text-primary hover:underline justify-self-end">
                  Investigate →
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
