import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Brain, FileText, TrendingDown, CheckCircle2, ArrowUpRight, XCircle } from "lucide-react";
import { api } from "../lib/api";
import type { Investigation } from "../lib/api";
import { PageHeader, Skeleton, EmptyState } from "../components/Shared";
import { formatCurrency, formatDateTime, DECISION_STYLE, RISK_COLORS } from "../lib/format";

export default function InvestigationCenter() {
  const [searchParams] = useSearchParams();
  const [investigations, setInvestigations] = useState<Investigation[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.investigations.list({}).then((list) => {
      setInvestigations(list);
      const txParam = searchParams.get("tx");
      if (txParam) {
        const match = list.find((i) => i.transaction_id === txParam);
        if (match) setSelectedId(match.id);
      } else if (list.length && selectedId === null) {
        setSelectedId(list[0].id);
      }
    });
  };

  useEffect(() => { load(); }, []);

  const selected = investigations?.find((i) => i.id === selectedId) || null;

  async function handleAction(action: "resolve" | "escalate" | "dismiss") {
    if (!selected) return;
    setBusy(true);
    try {
      await api.investigations.action(selected.id, action, "Analyst");
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="AI Investigation Center" subtitle="Root cause analysis, evidence, and confidence-scored recommendations" />

      <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Case list */}
        <div className="glass-card p-3 max-h-[75vh] overflow-y-auto space-y-1.5">
          {investigations === null ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)
          ) : investigations.length === 0 ? (
            <EmptyState title="No investigations" />
          ) : (
            investigations.map((inv) => (
              <button
                key={inv.id}
                onClick={() => setSelectedId(inv.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedId === inv.id ? "border-primary/50 bg-primary/5" : "border-transparent hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-slate-300">{inv.transaction_id}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${RISK_COLORS[inv.risk_level]?.dot}`} />
                </div>
                <p className="text-xs text-slate-400 truncate">{inv.root_cause}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`pill text-[9px] px-1.5 py-0.5 ${DECISION_STYLE[inv.decision]?.bg} ${DECISION_STYLE[inv.decision]?.text}`}>
                    {inv.decision.replace("_", " ")}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{formatCurrency(inv.financial_impact)}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Header */}
              <div className="glass-card p-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="font-mono text-sm font-semibold">{selected.transaction_id}</span>
                    <span className={`pill text-[10px] ${RISK_COLORS[selected.risk_level]?.bg} ${RISK_COLORS[selected.risk_level]?.text}`}>
                      {selected.risk_level} risk
                    </span>
                  </div>
                  <h2 className="font-display font-semibold text-lg text-white">{selected.root_cause}</h2>
                  <p className="text-sm text-slate-400 mt-1 max-w-xl">{selected.root_cause_detail}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-display font-bold text-danger">{formatCurrency(selected.financial_impact)}</div>
                  <div className="text-[11px] text-slate-500">financial impact</div>
                </div>
              </div>

              {/* Confidence + decision */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="glass-card p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">AI Confidence Score</span>
                    <span className="text-sm font-bold">{selected.confidence_score}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${selected.confidence_score}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-grad-primary"
                    />
                  </div>
                </div>
                <div className="glass-card p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Decision</div>
                    <span className={`pill ${DECISION_STYLE[selected.decision]?.bg} ${DECISION_STYLE[selected.decision]?.text}`}>
                      {selected.decision.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {selected.status === "open" && (
                      <>
                        <button disabled={busy} onClick={() => handleAction("resolve")} className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                        </button>
                        <button disabled={busy} onClick={() => handleAction("escalate")} className="btn-ghost !py-1.5 !px-3 text-xs flex items-center gap-1">
                          <ArrowUpRight className="w-3.5 h-3.5" /> Escalate
                        </button>
                      </>
                    )}
                    {selected.status !== "open" && (
                      <span className="text-xs text-slate-500 capitalize flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> {selected.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reasoning timeline */}
              <div className="glass-card p-5">
                <h3 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-secondary" /> Agent Reasoning
                </h3>
                <div className="space-y-0">
                  {selected.reasoning_steps.map((step, i) => (
                    <motion.div
                      key={step.step}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex gap-3 pb-4 last:pb-0 relative"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-grad-primary flex items-center justify-center text-[10px] font-bold text-white shrink-0 z-10">
                          {step.step}
                        </div>
                        {i < selected.reasoning_steps.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="pb-1">
                        <div className="text-sm font-medium text-slate-200">{step.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{step.detail}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Evidence + sources */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="glass-card p-5">
                  <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-accent" /> Evidence
                  </h3>
                  <ul className="space-y-2">
                    {selected.evidence.map((e, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-accent mt-1.5 shrink-0" /> {e}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="glass-card p-5">
                  <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-secondary" /> Recommended Action
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{selected.recommended_action}</p>
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">Source references</div>
                    {selected.source_references.map((s, i) => (
                      <div key={i} className="text-[11px] text-slate-500 font-mono">· {s}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 text-right">
                Investigated {formatDateTime(selected.created_at)}
                {selected.resolved_at && ` · Resolved ${formatDateTime(selected.resolved_at)}`}
              </div>
            </motion.div>
          ) : (
            <EmptyState title="Select an investigation" subtitle="Choose a case from the list to view the AI's full reasoning." />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
