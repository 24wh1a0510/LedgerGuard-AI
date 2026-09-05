const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export interface DashboardSummary {
  total_transactions: number;
  amount_processed: number;
  reconciliation_rate: number;
  money_at_risk: number;
  critical_exceptions: number;
  auto_resolved_cases: number;
  ai_confidence_score: number;
  match_rate: number;
  exceptions_detected: number;
  false_positives: number;
  processing_time_ms: number;
}

export interface Transaction {
  id: number;
  transaction_id: string;
  customer_name: string;
  processor: string;
  currency: string;
  category: string;
  payment_amount: number;
  refund_amount: number;
  fee_amount: number;
  tax_amount: number;
  expected_settlement: number;
  actual_settlement: number;
  bank_credit: number;
  payment_status: string;
  refund_status: string;
  fee_status: string;
  tax_status: string;
  settlement_status: string;
  bank_credit_status: string;
  discrepancy_amount: number;
  is_exception: boolean;
  anomaly_score: number;
  payment_date: string;
  settlement_date: string | null;
  expected_settlement_date: string | null;
}

export interface Investigation {
  id: number;
  transaction_id: string;
  customer_name: string | null;
  processor: string | null;
  risk_level: "critical" | "high" | "medium" | "low";
  confidence_score: number;
  root_cause: string;
  root_cause_detail: string;
  evidence: string[];
  reasoning_steps: { step: number; title: string; detail: string }[];
  financial_impact: number;
  recommended_action: string;
  decision: "AUTO_RESOLVE" | "RECOMMEND" | "ESCALATE";
  source_references: string[];
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export interface ChainOfCustodyNode {
  key: string;
  label: string;
  amount: number;
  expected_amount?: number;
  status: string;
  date: string | null;
}

export interface ChainOfCustody {
  transaction_id: string;
  customer_name: string;
  processor: string;
  category: string;
  has_discrepancy: boolean;
  discrepancy_amount: number;
  nodes: ChainOfCustodyNode[];
  investigation: {
    root_cause: string;
    confidence_score: number;
    decision: string;
    risk_level: string;
  } | null;
}

export const api = {
  dashboard: {
    summary: () => request<DashboardSummary>("/api/dashboard/summary"),
    trends: () =>
      request<{ days: string[]; volume: number[]; transaction_count: number[]; exceptions: number[] }>(
        "/api/dashboard/trends"
      ),
    riskHeatmap: () =>
      request<{ risk_levels: string[]; processors: string[]; cells: { risk_level: string; processor: string; value: number }[] }>(
        "/api/dashboard/risk-heatmap"
      ),
    healthScore: () => request<{ score: number; band: string }>("/api/dashboard/financial-health-score"),
    recentInvestigations: (limit = 8) =>
      request<
        { id: number; transaction_id: string; root_cause: string; risk_level: string; decision: string; confidence_score: number; financial_impact: number; created_at: string }[]
      >(`/api/dashboard/recent-investigations?limit=${limit}`),
  },
  transactions: {
    list: (params: Record<string, string | number | boolean | undefined> = {}) => {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => v !== undefined && v !== "" && q.set(k, String(v)));
      return request<Transaction[]>(`/api/transactions?${q.toString()}`);
    },
    get: (id: string) => request<Transaction>(`/api/transactions/${id}`),
    chainOfCustody: (id: string) => request<ChainOfCustody>(`/api/transactions/${id}/chain-of-custody`),
    filters: () => request<{ processors: string[]; categories: string[] }>("/api/transactions/meta/filters"),
  },
  investigations: {
    list: (params: Record<string, string | boolean | undefined> = {}) => {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => v !== undefined && v !== "" && q.set(k, String(v)));
      return request<Investigation[]>(`/api/investigations?${q.toString()}`);
    },
    get: (id: number) => request<Investigation>(`/api/investigations/${id}`),
    action: (id: number, action: string, actor = "Analyst", note?: string) =>
      post<Investigation>(`/api/investigations/${id}/action`, { action, actor, note }),
    exceptionCounts: () =>
      request<{ critical: number; high: number; medium: number; low: number }>(
        "/api/investigations/summary/exception-counts"
      ),
  },
  analytics: {
    leakageByCategory: () => request<{ category: string; amount_at_risk: number }[]>("/api/analytics/leakage-by-category"),
    feeAnomalies: () => request<any[]>("/api/analytics/fee-anomalies"),
    settlementDelays: () => request<any[]>("/api/analytics/settlement-delays"),
    duplicates: () => request<any[]>("/api/analytics/duplicate-transactions"),
    recoveryOpportunities: () =>
      request<{ total_recoverable: number; opportunities: any[] }>("/api/analytics/recovery-opportunities"),
    processorBreakdown: () => request<any[]>("/api/analytics/processor-breakdown"),
  },
  audit: {
    list: (params: Record<string, string | undefined> = {}) => {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => v && q.set(k, v));
      return request<any[]>(`/api/audit?${q.toString()}`);
    },
  },
};
