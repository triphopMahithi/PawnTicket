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

export function HistoryPage() {
  const navigate = useNavigate();

  // --------- state: ค้นหาลูกค้า ----------
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);

  // --------- state: modal tickets ของลูกค้าคนเดียว ----------
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerListItem | null>(null);
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);

  // --------- state: modal ticket detail ----------
  const [selectedTicket, setSelectedTicket] = useState<TicketSummary | null>(
    null
  );
  const [ticketDetail, setTicketDetail] =
    useState<TicketDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // --------- NEW: state ค้นหาจากหลาย Ticket ID ----------
  const [ticketIdsInput, setTicketIdsInput] = useState("");
  const [ticketResults, setTicketResults] = useState<TicketDetailResponse[]>(
    []
  );
  const [loadingTicketResults, setLoadingTicketResults] = useState(false);
  const [ticketResultsError, setTicketResultsError] = useState<string | null>(
    null
  );

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

      const url = `${API_BASE}/api/customers?q=${encodeURIComponent(
        q
      )}&limit=20`;
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
      const data: TicketDetailResponse = await res.json();
      setTicketDetail(data);
    } catch (err: any) {
      console.error("Error fetching ticket detail:", err);
      setDetailError("ไม่สามารถดึงรายละเอียดตั๋วได้");
    } finally {
      setLoadingDetail(false);
    }
  };

  // ------- NEW: แยก Ticket ID ออกจาก input (คั่นด้วย , เว้นวรรค หรือขึ้นบรรทัดใหม่) -------
  const parseTicketIdsFromInput = (input: string): string[] => {
    return input
      .split(/[\s,]+/) // space, comma, newline
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  };

  // ------- NEW: ค้นหาด้วยหลาย Ticket_ID -------
  const handleSearchTicketsByIds = async () => {
    const ids = parseTicketIdsFromInput(ticketIdsInput);

    if (ids.length === 0) {
      setTicketResults([]);
      setTicketResultsError("กรุณาใส่ Ticket ID อย่างน้อย 1 รายการ");
      return;
    }

    try {
      setLoadingTicketResults(true);
      setTicketResultsError(null);
      setTicketResults([]);

      const results: TicketDetailResponse[] = [];

      for (const id of ids) {
        try {
          const url = `${API_BASE}/api/pawn-tickets/${encodeURIComponent(
            id
          )}/detail`;
          const res = await fetch(url);

          if (!res.ok) {
            console.warn("ไม่พบ ticket", id, "status:", res.status);
            continue; // ข้ามตัวที่หาไม่เจอ
          }

          const data: TicketDetailResponse = await res.json();
          results.push(data);
        } catch (innerErr) {
          console.error("Error fetching ticket detail for", id, innerErr);
          // ไม่ต้อง throw ต่อ เพื่อให้ ticket อื่นยังหาได้
        }
      }

      if (results.length === 0) {
        setTicketResultsError("ไม่พบ Ticket ที่ตรงกับ ID ที่ระบุ");
      }

      setTicketResults(results);
    } catch (err) {
      console.error("Error searching tickets by IDs:", err);
      setTicketResultsError("เกิดข้อผิดพลาดระหว่างค้นหา Ticket");
    } finally {
      setLoadingTicketResults(false);
    }
  };

  // ------- NEW: กดปุ่ม "ดูรายละเอียด" จากผลค้นหา Ticket IDs -------
  const openDetailFromResult = (detail: TicketDetailResponse) => {
    const anyDetail = detail as any;
    const ticketData = anyDetail.ticket ?? {};

    // ใช้ข้อมูล ticket จาก detail เป็น selectedTicket โดยตรง
    setSelectedTicket(ticketData as TicketSummary);
    setTicketDetail(detail);
    setDetailError(null);
    setIsDetailModalOpen(true);
  };

  // ------- render -------

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">History</h1>
        <Button onClick={() => navigate("/")}>Back</Button>
      </div>

      {/* Search box: ลูกค้า */}
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
          {loadingCustomers ? "กำลังค้นหา..." : "ค้นหาลูกค้า"}
        </Button>
      </div>

      {/* NEW: Search by multiple Ticket IDs */}
      <div className="mt-6 border-t pt-6">
        <h2 className="text-xl font-semibold mb-2">
          ค้นหาตาม Ticket ID (ได้หลายใบ)
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          พิมพ์ Ticket ID คั่นด้วยเครื่องหมายจุลภาค (,), เว้นวรรค หรือขึ้นบรรทัดใหม่
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-start">
          <textarea
            className="p-3 rounded-lg border border-gray-300 w-full min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            placeholder={`เช่น 1001, 1005 1010\nหรือพิมพ์ทีละบรรทัดก็ได้`}
            value={ticketIdsInput}
            onChange={(e) => setTicketIdsInput(e.target.value)}
          />
          <Button
            onClick={handleSearchTicketsByIds}
            disabled={loadingTicketResults}
            className="shrink-0"
          >
            {loadingTicketResults ? "กำลังค้นหา Ticket..." : "ค้นหา Ticket"}
          </Button>
        </div>

        {ticketResultsError && (
          <p className="text-red-600 text-sm mt-2">{ticketResultsError}</p>
        )}
      </div>

      {/* NEW: ผลการค้นหาจากหลาย Ticket ID */}
      {!loadingTicketResults && ticketResults.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3">
            ผลการค้นหาจาก Ticket ID ({ticketResults.length} ใบ)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ticketResults.map((detail) => {
              const anyDetail = detail as any;
              const t = anyDetail.ticket ?? {};
              const c = anyDetail.customer ?? {};

              const customerName =
                c.fullName ??
                [c.first_name, c.last_name].filter(Boolean).join(" ") ??
                "-";

              const contractDate =
                t.contract_date ??
                t.Contract_Date ??
                t.contractDate ??
                null;

              return (
                <div
                  key={t.ticket_ID}
                  className="bg-white rounded-xl shadow p-4 flex flex-col justify-between"
                >
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Ticket ID:{" "}
                      <span className="font-mono font-semibold">
                        {t.ticket_ID}
                      </span>
                    </p>
                    <p className="font-semibold text-gray-900">
                      {customerName || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      สถานะ:{" "}
                      <span className={getStatusColor(t.contract_status)}>
                        {t.contract_status}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      วันที่ทำสัญญา:{" "}
                      {contractDate
                        ? new Date(contractDate).toLocaleDateString("th-TH")
                        : "-"}
                    </p>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDetailFromResult(detail)}
                    >
                      ดูรายละเอียด
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error / Empty state / Result: ลูกค้า */}
      {customerError && (
        <p className="text-red-600 mb-4 text-sm">{customerError}</p>
      )}

      {!loadingCustomers && customers.length === 0 && !customerError && (
        <p className="text-gray-500 mt-4">
          ยังไม่มีผลลัพธ์ลูกค้า (ลองพิมพ์ชื่อหรือเบอร์โทร)
        </p>
      )}

      {customers.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
