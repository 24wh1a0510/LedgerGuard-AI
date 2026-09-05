import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "./components/AppShell";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import TransactionExplorer from "./pages/TransactionExplorer";
import ChainOfCustody from "./pages/ChainOfCustody";
import InvestigationCenter from "./pages/InvestigationCenter";
import ExceptionCommandCenter from "./pages/ExceptionCommandCenter";
import Analytics from "./pages/Analytics";
import AuditTrail from "./pages/AuditTrail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<TransactionExplorer />} />
          <Route path="/chain-of-custody" element={<ChainOfCustody />} />
          <Route path="/investigations" element={<InvestigationCenter />} />
          <Route path="/exceptions" element={<ExceptionCommandCenter />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/audit-trail" element={<AuditTrail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
