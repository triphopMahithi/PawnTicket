// src/pages/History.tsx
import { HistoryPage } from "@/components/DashboardHistory";
import { EmployeeManager } from "@/components/EmployeeManager";
import { DispositionDashboard } from "@/components/DispositionDashboard";

export default function History() {
  return (
    <div className="space-y-6">
      <div className="p-4 md:p-6">
        <HistoryPage />
      </div>

      <div className="p-4 md:p-6">
        <EmployeeManager />
      </div>

      <div className="p-6 space-y-6">
        {/* ...ส่วนอื่นของ dashboard... */}
        <DispositionDashboard />
      </div>
    </div>
  );
}
