import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ScrollText, Search } from "lucide-react";
import { api } from "../lib/api";
import { PageHeader, Skeleton, EmptyState } from "../components/Shared";
import { formatDateTime, DECISION_STYLE } from "../lib/format";

export default function AuditTrail() {
  const [logs, setLogs] = useState<any[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.audit.list({ transaction_id: search || undefined }).then(setLogs);
  }, [search]);

  return (
    <div>
      <PageHeader title="Audit Trail" subtitle="Every AI decision, fully explainable — evidence, reasoning, confidence, timestamp" />

      <div className="p-6 lg:p-8 space-y-5">
        <div className="glass-card p-4 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-7 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by transaction ID..."
            className="w-full bg-white/5 border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm font-mono placeholder:text-slate-500 focus:border-primary/50 outline-none"
          />
        </div>

        <div className="relative pl-6">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
          {logs === null ? (
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : logs.length === 0 ? (
            <EmptyState title="No audit entries found" />
          ) : (
            logs.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                className="relative mb-4 last:mb-0"
              >
                <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-navy border-2 border-primary" />
                <div className="glass-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <ScrollText className="w-3.5 h-3.5 text-primary" />
                      <span className="font-mono text-xs text-slate-300">{log.transaction_id}</span>
                      <span
                        className={`pill text-[10px] ${DECISION_STYLE[log.action]?.bg ?? "bg-white/5 border border-border"} ${DECISION_STYLE[log.action]?.text ?? "text-slate-400"}`}
                      >
                        {log.action.replace("_", " ")}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">{formatDateTime(log.timestamp)}</span>
                  </div>
                  <p className="text-xs text-slate-400">{log.detail}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                    <span>Actor: <span className="text-slate-300">{log.actor}</span></span>
                    {log.confidence_score != null && <span>Confidence: <span className="text-slate-300">{log.confidence_score}%</span></span>}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
