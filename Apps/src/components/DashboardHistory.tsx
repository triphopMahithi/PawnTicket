// src/pages/History.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CustomerTicketsModal, {
  TicketSummary,
} from "@/components/history/CustomerTicketsModal";
import TicketDetailModal, {
  TicketDetailResponse,
} from "@/components/history/TicketDetailModal";

const API_BASE = "http://localhost:3001"; // ถ้ามี VITE_API_URL ค่อยเปลี่ยนทีหลัง

// ลูกค้าที่ดึงจาก /api/customers
export interface CustomerListItem {
  id: string;
  name: string;
  nationalId: string;
  phone: string;
  address?: { raw: string };
}

export  function HistoryPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);

  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerListItem | null>(null);
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState<TicketSummary | null>(
    null
  );
  const [ticketDetail, setTicketDetail] =
    useState<TicketDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // ------- helper: status → สีตัวอักษร -------
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-green-600 font-semibold";
      case "ROLLED_OVER":
        return "text-yellow-600 font-semibold";
      case "CANCELLED":
        return "text-red-600 font-semibold";
      case "EXPIRED":
        return "text-gray-500 font-semibold";
      default:
        return "text-gray-700";
    }
  };

  // ------- 1) ค้นหาลูกค้า (GET /api/customers?q=...) -------
  const handleSearchCustomers = async () => {
    const q = search.trim();
    if (!q) {
      setCustomers([]);
      setCustomerError(null);
      return;
    }

    try {
      setLoadingCustomers(true);
      setCustomerError(null);

      const url = `${API_BASE}/api/customers?q=${encodeURIComponent(q)}&limit=20`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();

      setCustomers(data.items || []);
    } catch (err: any) {
      console.error("Error fetching customers:", err);
      setCustomerError("ไม่สามารถดึงข้อมูลลูกค้าได้");
    } finally {
      setLoadingCustomers(false);
    }
  };

  // ------- 2) เวลา user กดปุ่ม Ticket บนการ์ดลูกค้า -------
  const handleOpenTicketsModal = async (customer: CustomerListItem) => {
    setSelectedCustomer(customer);
    setTickets([]);
    setTicketsError(null);
    setIsTicketsModalOpen(true);

    try {
      setLoadingTickets(true);
      const url = `${API_BASE}/api/customers/${customer.id}/tickets`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setTickets(data.items || []);
    } catch (err: any) {
      console.error("Error fetching tickets:", err);
      setTicketsError("ไม่สามารถดึงข้อมูลตั๋วของลูกค้าคนนี้ได้");
    } finally {
      setLoadingTickets(false);
    }
  };

  // ------- 3) เวลา user เลือก Ticket 1 ใบใน modal Tickets -------
  const handleSelectTicket = async (ticket: TicketSummary) => {
    setSelectedTicket(ticket);
    setTicketDetail(null);
    setDetailError(null);
    setIsTicketsModalOpen(false); // ปิด modal แรก
    setIsDetailModalOpen(true); // เปิด modal Detail

    try {
      setLoadingDetail(true);
      const url = `${API_BASE}/api/pawn-tickets/${ticket.ticket_ID}/detail`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setTicketDetail(data);
    } catch (err: any) {
      console.error("Error fetching ticket detail:", err);
      setDetailError("ไม่สามารถดึงรายละเอียดตั๋วได้");
    } finally {
      setLoadingDetail(false);
    }
  };

  // ------- render -------

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">History</h1>
        <Button onClick={() => navigate("/")}>Back</Button>
      </div>

      {/* Search box */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6">
        <input
          type="text"
          placeholder="ค้นหาลูกค้า (ชื่อ, เบอร์, เลขบัตร ฯลฯ)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearchCustomers();
            }
          }}
          className="p-3 rounded-lg border border-gray-300 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <Button
          onClick={handleSearchCustomers}
          disabled={loadingCustomers}
          className="shrink-0"
        >
          {loadingCustomers ? "กำลังค้นหา..." : "ค้นหา"}
        </Button>
      </div>

      {/* Error / Empty state / Result */}
      {customerError && (
        <p className="text-red-600 mb-4 text-sm">{customerError}</p>
      )}

      {!loadingCustomers && customers.length === 0 && !customerError && (
        <p className="text-gray-500">ยังไม่มีผลลัพธ์ (ลองพิมพ์ชื่อหรือเบอร์โทร)</p>
      )}

      {customers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {customers.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <p className="text-gray-900 font-semibold text-lg mb-1">
                  {c.name}
                </p>
                <p className="text-gray-600 text-sm">
                  เลขบัตร:{" "}
                  <span className="font-mono">
                    {c.nationalId || "-"}
                  </span>
                </p>
                <p className="text-gray-600 text-sm">
                  โทร: <span className="font-mono">{c.phone || "-"}</span>
                </p>
                {c.address?.raw && (
                  <p className="text-gray-500 text-xs mt-2 line-clamp-2">
                    {c.address.raw}
                  </p>
                )}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenTicketsModal(c)}
                >
                  Ticket
                </Button>
                <span className="text-xs text-gray-400">
                  Customer ID: {c.id}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Tickets of this customer */}
      <CustomerTicketsModal
        isOpen={isTicketsModalOpen}
        onClose={() => setIsTicketsModalOpen(false)}
        customer={selectedCustomer}
        tickets={tickets}
        loading={loadingTickets}
        error={ticketsError}
        onSelectTicket={handleSelectTicket}
        getStatusColor={getStatusColor}
      />

      {/* Modal: Detail of selected ticket */}
      <TicketDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        ticket={selectedTicket}
        detail={ticketDetail}
        loading={loadingDetail}
        error={detailError}
      />
    </div>
  );
}
