import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  GitBranch,
  Brain,
  ShieldAlert,
  BarChart3,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import ParticleField from "./ParticleField";

const NAV = [
  { to: "/dashboard", label: "Executive Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transaction Explorer", icon: Search },
  { to: "/chain-of-custody", label: "Chain of Custody", icon: GitBranch },
  { to: "/investigations", label: "AI Investigation Center", icon: Brain },
  { to: "/exceptions", label: "Exception Command Center", icon: ShieldAlert },
  { to: "/analytics", label: "Analytics & Insights", icon: BarChart3 },
  { to: "/audit-trail", label: "Audit Trail", icon: ScrollText },
];

export default function AppShell() {
  return (
    <div className="min-h-screen relative">
      <ParticleField />
      <div className="relative z-10 flex">
        <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-border p-5">
          <div className="flex items-center gap-2 mb-8 px-1">
            <div className="w-9 h-9 rounded-xl bg-grad-primary flex items-center justify-center shadow-glow">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-sm leading-tight">LedgerGuard AI</div>
              <div className="text-[10px] text-slate-400 tracking-wide">TRACE · EXPLAIN · PROTECT</div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white/8 text-white border border-border shadow-glass"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pt-6">
            <div className="glass-card p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulseGlow" />
                <span className="text-xs font-medium text-slate-300">AI Agent Active</span>
              </div>
              <p className="text-[11px] text-slate-500">Monitoring live reconciliation feed</p>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
