import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Search, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import type { ChainOfCustody as ChainOfCustodyT } from "../lib/api";
import { PageHeader, Skeleton } from "../components/Shared";
import { formatCurrency, DECISION_STYLE } from "../lib/format";

const STATUS_META: Record<string, { color: string; label: string }> = {
  matched: { color: "#00C896", label: "Matched" },
  mismatch: { color: "#FF5B6E", label: "Mismatch" },
  missing: { color: "#FF5B6E", label: "Missing" },
  delayed: { color: "#F5A524", label: "Delayed" },
  duplicate: { color: "#FF5B6E", label: "Duplicate" },
  AUTO_RESOLVE: { color: "#00C896", label: "Auto Resolved" },
  RECOMMEND: { color: "#00D4FF", label: "Recommended" },
  ESCALATE: { color: "#FF5B6E", label: "Escalated" },
};

export default function ChainOfCustody() {
  const [searchParams] = useSearchParams();
  const [txnId, setTxnId] = useState(searchParams.get("tx") || "");
  const [inputValue, setInputValue] = useState(searchParams.get("tx") || "");
  const [data, setData] = useState<ChainOfCustodyT | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [exceptionSample, setExceptionSample] = useState<string[]>([]);

  useEffect(() => {
    api.transactions.list({ is_exception: true, limit: 8 }).then((txns) => {
      setExceptionSample(txns.map((t) => t.transaction_id));
      if (!txnId && txns.length) {
        setTxnId(txns[0].transaction_id);
        setInputValue(txns[0].transaction_id);
      }
    });
  }, []);

  useEffect(() => {
    if (!txnId) return;
    setLoading(true);
    api.transactions
      .chainOfCustody(txnId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [txnId]);

  return (
    <div>
      <PageHeader
        title="Financial Chain of Custody"
        subtitle="Payment → Refunds → Fees → Taxes → Settlement → Bank Credit → AI Decision"
      />

      <div className="p-6 lg:p-8 space-y-6">
        <div className="glass-card p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setTxnId(inputValue.trim())}
              placeholder="Enter transaction ID (e.g. TXN-100002)"
              className="w-full bg-white/5 border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm font-mono placeholder:text-slate-500 focus:border-primary/50 outline-none"
            />
          </div>
          <button onClick={() => setTxnId(inputValue.trim())} className="btn-primary">
            Trace
          </button>
          <div className="flex flex-wrap gap-1.5">
            {exceptionSample.slice(0, 5).map((id) => (
              <button
                key={id}
                onClick={() => { setTxnId(id); setInputValue(id); }}
                className={`text-[11px] font-mono px-2.5 py-1.5 rounded-lg border transition-all ${
                  id === txnId ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-slate-500 hover:text-slate-300"
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {loading && <Skeleton className="h-96" />}

        {!loading && data && (
          <>
            {/* Header card */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-white">{data.transaction_id}</span>
                  <span className="pill bg-white/5 border border-border text-slate-400 text-[10px]">{data.processor}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{data.customer_name} · {data.category.replace(/_/g, " ")}</p>
              </div>
              {data.has_discrepancy ? (
                <div className="flex items-center gap-2 pill bg-danger/10 border border-danger/30 text-danger">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Discrepancy: {formatCurrency(data.discrepancy_amount)}
                </div>
              ) : (
                <div className="flex items-center gap-2 pill bg-accent/10 border border-accent/30 text-accent">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Fully reconciled
                </div>
              )}
            </motion.div>

            {/* Node flow graph */}
            <div className="glass-card p-6 lg:p-10 overflow-x-auto">
              <div className="flex items-stretch gap-1 min-w-max lg:min-w-0 lg:justify-between">
                {data.nodes.map((node, i) => {
                  const meta = STATUS_META[node.status] || STATUS_META.matched;
                  const isBad = node.status !== "matched";
                  const isLast = i === data.nodes.length - 1;
                  return (
                    <div key={node.key} className="flex items-stretch">
                      <motion.button
                        onClick={() => setSelectedNode(selectedNode === node.key ? null : node.key)}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 18 }}
                        whileHover={{ y: -4 }}
                        className="w-36 shrink-0 relative"
                      >
                        <div
                          className="gradient-border rounded-2xl p-4 text-center relative"
                          style={{
                            background: isBad ? "rgba(255,91,110,0.06)" : "rgba(255,255,255,0.03)",
                            boxShadow: selectedNode === node.key ? `0 0 0 2px ${meta.color}` : undefined,
                          }}
                        >
                          {isBad && (
                            <motion.div
                              className="absolute inset-0 rounded-2xl"
                              animate={{ boxShadow: [`0 0 0px ${meta.color}00`, `0 0 18px ${meta.color}55`, `0 0 0px ${meta.color}00`] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                          <div
                            className="w-2 h-2 rounded-full mx-auto mb-2"
                            style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }}
                          />
                          <div className="text-[11px] text-slate-400 mb-1">{node.label}</div>
                          <div className="font-mono text-sm font-semibold text-white tabular-nums">
                            {formatCurrency(node.amount)}
                          </div>
                          <div className="text-[10px] mt-1.5 font-medium" style={{ color: meta.color }}>
                            {meta.label}
                          </div>
                        </div>
                      </motion.button>

                      {!isLast && (
                        <div className="flex items-center px-1">
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: i * 0.08 + 0.15 }}
                            className="relative w-6 lg:w-full h-px origin-left"
                          >
                            <svg width="100%" height="16" className="overflow-visible">
                              <line
                                x1="0" y1="8" x2="100%" y2="8"
                                stroke={isBad || (data.nodes[i + 1] && data.nodes[i + 1].status !== "matched") ? "#FF5B6E" : "rgba(148,163,214,0.3)"}
                                strokeWidth="2"
                                strokeDasharray={isBad ? "4 4" : "0"}
                                className={isBad ? "animate-dash" : ""}
                              />
                              <ChevronRight className="w-3 h-3" />
                            </svg>
                          </motion.div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Evidence panel */}
            <AnimatePresence>
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {(() => {
                    const node = data.nodes.find((n) => n.key === selectedNode)!;
                    const meta = STATUS_META[node.status] || STATUS_META.matched;
                    return (
                      <div className="glass-card p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-display font-semibold text-sm">{node.label} — Evidence</h4>
                          <span className="pill text-[10px]" style={{ background: `${meta.color}1a`, color: meta.color, border: `1px solid ${meta.color}4d` }}>
                            {meta.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                          <div>
                            <div className="text-slate-500 mb-1">Recorded amount</div>
                            <div className="font-mono">{formatCurrency(node.amount)}</div>
                          </div>
                          {node.expected_amount !== undefined && (
                            <div>
                              <div className="text-slate-500 mb-1">Expected amount</div>
                              <div className="font-mono">{formatCurrency(node.expected_amount)}</div>
                            </div>
                          )}
                          <div>
                            <div className="text-slate-500 mb-1">Node status</div>
                            <div className="font-medium" style={{ color: meta.color }}>{meta.label}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Final AI decision */}
            {data.investigation && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-5">
                <h4 className="font-display font-semibold text-sm mb-3">Final AI Decision</h4>
                <div className="flex flex-wrap items-center gap-4">
                  <span className={`pill ${DECISION_STYLE[data.investigation.decision]?.bg} ${DECISION_STYLE[data.investigation.decision]?.text}`}>
                    {data.investigation.decision.replace("_", " ")}
                  </span>
                  <span className="text-sm text-slate-300">{data.investigation.root_cause}</span>
                  <span className="text-xs text-slate-500 ml-auto">
                    Confidence: <span className="text-white font-medium">{data.investigation.confidence_score}%</span>
                  </span>
                </div>
              </motion.div>
            )}
          </>
        )}

        {!loading && !data && txnId && (
          <div className="glass-card p-10 text-center text-sm text-slate-500">
            No transaction found for "{txnId}". Try one of the sample IDs above.
          </div>
        )}
      </div>
    </div>
  );
}
