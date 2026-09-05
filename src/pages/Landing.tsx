import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShieldCheck, GitBranch, Brain, ArrowRight, Zap, Lock, Activity } from "lucide-react";
import ParticleField from "../components/ParticleField";

const FEATURES = [
  {
    icon: GitBranch,
    title: "Financial Chain of Custody",
    desc: "Trace every dollar from payment to bank credit through an animated, evidence-backed flow graph.",
  },
  {
    icon: Brain,
    title: "Autonomous Investigation",
    desc: "The AI agent explains discrepancies, calculates impact, and cites the evidence behind every decision.",
  },
  {
    icon: ShieldCheck,
    title: "Confidence-Scored Decisions",
    desc: "Every exception is auto-resolved, recommended, or escalated — never a black box.",
  },
];

const STATS = [
  { label: "Transactions monitored", value: "150+" },
  { label: "Avg. investigation time", value: "< 2s" },
  { label: "Money-at-risk surfaced", value: "$27.9K" },
  { label: "Decisions explained", value: "100%" },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticleField />
      <div className="relative z-10">
        {/* Nav */}
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-grad-primary flex items-center justify-center shadow-glow">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-sm">LedgerGuard AI</span>
          </div>
          <Link to="/dashboard" className="btn-primary text-sm">Launch Console</Link>
        </nav>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 pill bg-white/5 border border-border text-slate-400 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulseGlow" />
            Autonomous AI Finance Controller
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="bg-clip-text text-transparent bg-grad-primary">Trace.</span>{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-secondary to-accent">Explain.</span>{" "}
            <span className="text-white">Protect.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto mb-10"
          >
            LedgerGuard AI reconciles every payment, refund, fee, and settlement — then investigates
            what doesn't match, with evidence-backed reasoning behind every decision.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-3"
          >
            <Link to="/dashboard" className="btn-primary flex items-center gap-2">
              Explore the Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/chain-of-custody" className="btn-ghost">See a Live Trace</Link>
          </motion.div>

          {/* Floating chain preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="mt-20 glass-card p-6 max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
              <span className="font-mono">TXN-100002 · Adyen</span>
              <span className="pill bg-danger/10 border border-danger/30 text-danger text-[10px]">Discrepancy Found</span>
            </div>
            <div className="flex items-center justify-between">
              {["Payment", "Refund", "Fee", "Tax", "Settlement", "Bank Credit"].map((label, i) => (
                <div key={label} className="flex items-center flex-1">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, delay: i * 0.2, repeat: Infinity }}
                    className="flex flex-col items-center gap-1.5 flex-1"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${i === 4 || i === 5 ? "bg-danger shadow-glow-danger" : "bg-accent"}`} />
                    <span className="text-[10px] text-slate-500 hidden sm:block">{label}</span>
                  </motion.div>
                  {i < 5 && <div className="h-px flex-1 bg-border" />}
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card p-5 text-center"
              >
                <div className="text-2xl font-display font-bold bg-clip-text text-transparent bg-grad-primary">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 pb-28">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-2xl font-bold text-center mb-3"
          >
            Built for finance teams who need answers, not just alerts
          </motion.h2>
          <p className="text-center text-slate-400 text-sm mb-12 max-w-xl mx-auto">
            Every exception comes with a full chain of reasoning — so you can trust the decision, not just the dashboard.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6"
              >
                <div className="w-11 h-11 rounded-xl bg-grad-primary flex items-center justify-center shadow-glow mb-4">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="gradient-border glass-card p-10"
          >
            <Zap className="w-8 h-8 text-primary mx-auto mb-4" />
            <h3 className="font-display text-2xl font-bold mb-2">Every dollar, accounted for.</h3>
            <p className="text-slate-400 text-sm mb-6">Open the console and trace a live discrepancy end to end.</p>
            <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
              Launch Console <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </section>

        <footer className="border-t border-border py-8 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5" /> LedgerGuard AI · Trace. Explain. Protect.
          <span className="opacity-40">·</span>
          <Activity className="w-3.5 h-3.5" /> AI Agent monitoring live
        </footer>
      </div>
    </div>
  );
}
