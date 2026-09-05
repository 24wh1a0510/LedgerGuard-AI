import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Filter } from "lucide-react";
import { api } from "../lib/api";
import type { Transaction } from "../lib/api";
import { PageHeader, Skeleton, EmptyState } from "../components/Shared";
import { formatCurrency, formatDate, categoryLabel, STATUS_COLORS } from "../lib/format";
import { Link } from "react-router-dom";

export default function TransactionExplorer() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [processor, setProcessor] = useState("");
  const [exceptionOnly, setExceptionOnly] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [filters, setFilters] = useState<{ processors: string[]; categories: string[] }>({ processors: [], categories: [] });
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.transactions.filters().then(setFilters).catch(console.error);
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      api.transactions
        .list({ search, category, processor, is_exception: exceptionOnly || undefined, limit: 100 })
        .then(setTransactions)
        .catch(console.error);
    }, 250);
    return () => clearTimeout(handle);
  }, [search, category, processor, exceptionOnly]);

  return (
    <div>
      <PageHeader title="Transaction Explorer" subtitle="Search and inspect every transaction with AI-generated explanations" />

      <div className="p-6 lg:p-8 space-y-5">
        <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transaction ID or customer..."
              className="w-full bg-white/5 border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm placeholder:text-slate-500 focus:border-primary/50 outline-none"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-white/5 border border-border rounded-xl px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-primary/50"
          >
            <option value="">All categories</option>
            {filters.categories.map((c) => (
              <option key={c} value={c}>{categoryLabel(c)}</option>
            ))}
          </select>
          <select
            value={processor}
            onChange={(e) => setProcessor(e.target.value)}
            className="bg-white/5 border border-border rounded-xl px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-primary/50"
          >
            <option value="">All processors</option>
            {filters.processors.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button
            onClick={() => setExceptionOnly((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              exceptionOnly ? "bg-danger/10 border-danger/40 text-danger" : "border-border text-slate-400 hover:text-slate-200"
            }`}
          >
            <Filter className="w-3.5 h-3.5" /> Exceptions only
          </button>
          <span className="text-xs text-slate-500 ml-auto">{transactions?.length ?? "—"} results</span>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.9fr_0.9fr_0.9fr_0.6fr] gap-2 px-5 py-3 text-[11px] uppercase tracking-wide text-slate-500 border-b border-border">
            <span>Transaction</span>
            <span>Customer</span>
            <span>Processor</span>
            <span>Category</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Discrepancy</span>
            <span></span>
          </div>

          {transactions === null ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState title="No transactions match" subtitle="Try adjusting your search or filters." />
          ) : (
            transactions.map((t, i) => (
              <div key={t.transaction_id}>
                <motion.button
                  onClick={() => setExpanded(expanded === t.transaction_id ? null : t.transaction_id)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.01, 0.3) }}
                  className="w-full grid grid-cols-[1.2fr_1fr_0.8fr_0.9fr_0.9fr_0.9fr_0.6fr] gap-2 px-5 py-3 text-sm items-center border-b border-border/60 hover:bg-white/5 transition-colors text-left"
                >
                  <span className="font-mono text-xs text-slate-300">{t.transaction_id}</span>
                  <span className="truncate text-slate-300">{t.customer_name}</span>
                  <span className="text-slate-400">{t.processor}</span>
                  <span className="text-slate-400">{categoryLabel(t.category)}</span>
                  <span className="text-right font-mono tabular-nums">{formatCurrency(t.payment_amount)}</span>
                  <span className={`text-right font-mono tabular-nums ${t.discrepancy_amount > 0 ? "text-danger" : "text-slate-600"}`}>
                    {t.discrepancy_amount > 0 ? formatCurrency(t.discrepancy_amount) : "—"}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 justify-self-end transition-transform ${expanded === t.transaction_id ? "rotate-180" : ""}`} />
                </motion.button>

                <AnimatePresence>
                  {expanded === t.transaction_id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-white/[0.02] border-b border-border/60"
                    >
                      <div className="px-5 py-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        {[
                          ["Payment", t.payment_amount, t.payment_status],
                          ["Refund", t.refund_amount, t.refund_status],
                          ["Fee", t.fee_amount, t.fee_status],
                          ["Tax", t.tax_amount, t.tax_status],
                          ["Expected Settlement", t.expected_settlement, t.settlement_status],
                          ["Actual Settlement", t.actual_settlement, t.settlement_status],
                          ["Bank Credit", t.bank_credit, t.bank_credit_status],
                          ["Anomaly Score", `${t.anomaly_score}/100`, ""],
                        ].map(([label, val, status]) => (
                          <div key={label as string}>
                            <div className="text-slate-500 mb-1">{label}</div>
                            <div className="font-mono flex items-center gap-1.5">
                              {typeof val === "number" ? formatCurrency(val) : val}
                              {status ? <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[status as string]?.dot}`} /> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="px-5 pb-4 flex items-center justify-between">
                        <p className="text-xs text-slate-400 max-w-xl">
                          {t.is_exception
                            ? "AI flagged this transaction for reconciliation discrepancy. View full investigation for root cause and evidence."
                            : "This transaction reconciled cleanly across the full chain of custody — no AI action needed."}
                        </p>
                        <div className="flex gap-2 shrink-0 ml-4">
                          <Link to={`/chain-of-custody?tx=${t.transaction_id}`} className="btn-ghost !py-1.5 !px-3 text-xs">
                            View Chain
                          </Link>
                          {t.is_exception && (
                            <Link to={`/investigations?tx=${t.transaction_id}`} className="btn-primary !py-1.5 !px-3 text-xs">
                              Investigation
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="px-5 pb-3 text-[11px] text-slate-500">
                        Payment date {formatDate(t.payment_date)} · Settlement {formatDate(t.settlement_date)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
