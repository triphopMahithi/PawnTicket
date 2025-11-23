import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useDebounce } from "@/hooks/use-debounce";
import { StatisticsCard } from "@/components/history/StatisticsCard";
import { TopCustomersCard } from "@/components/history/TopCustomersCard";
import { EmployeeManager } from "@/components/EmployeeManager";
import { DispositionDashboard } from "@/components/DispositionDashboard";

import CustomerTicketsModal, {
  TicketSummary,
} from "@/components/history/CustomerTicketsModal";
import TicketDetailModal, {
  TicketDetailResponse,
} from "@/components/history/TicketDetailModal";
import {
  Users,
  Ticket,
  CheckCircle,
  XCircle,
  Search,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

const API_BASE = "http://localhost:3001";

export interface CustomerListItem {
  id: string;                // รหัสลูกค้า
  name: string;              // ชื่อ-นามสกุล
  nationalId: string;        // รหัสประจำตัวประชาชน
  phone: string;             // เบอร์โทรศัพท์
  address?: { raw: string }; // ที่อยู่ (อาจจะไม่มี)
  dateOfBirth?: string;      // วันเกิด (อาจจะไม่มี)
  kycStatus?: 'PENDING' | 'PASSED' |'FAILED' | 'REJECTED'; // สถานะ KYC
}


interface Statistics {
  totalCustomers: number;
  totalTickets: number;
  activeTickets: number;
  expiredTickets: number;
}

interface TopCustomer {
  id: string;
  name: string;
  ticketCount: number;
  phone?: string;
}

export function HistoryPage() {
  const navigate = useNavigate();

  // Statistics
  const [statistics, setStatistics] = useState<Statistics>({
    totalCustomers: 0,
    totalTickets: 0,
    activeTickets: 0,
    expiredTickets: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Top Customers
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loadingTopCustomers, setLoadingTopCustomers] = useState(true);

  // Customer Search (Auto-search with debounce)
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);

  // Ticket Search by IDs
  const [ticketIdsInput, setTicketIdsInput] = useState("");
  const [ticketResults, setTicketResults] = useState<TicketDetailResponse[]>([]);
  const [loadingTicketResults, setLoadingTicketResults] = useState(false);
  const [ticketResultsError, setTicketResultsError] = useState<string | null>(null);

  // Modal states
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerListItem | null>(null);
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState<TicketSummary | null>(null);
  const [ticketDetail, setTicketDetail] = useState<TicketDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [editingCustomer, setEditingCustomer] = useState<CustomerListItem | null>(null);
  const [updatedCustomer, setUpdatedCustomer] = useState<CustomerListItem | null>(null);
  const handleEditCustomer = (customer: CustomerListItem) => {
    setEditingCustomer(customer);
    setUpdatedCustomer(customer);
  };


   useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoadingStats(true);
        const response = await fetch(`${API_BASE}/api/statistics`); // API ที่ Backend ให้บริการ
        if (response.ok) {
          const data = await response.json();
          setStatistics(data); // ตั้งค่าข้อมูลสถิติที่ดึงมา
        } else {
          console.error("Failed to fetch statistics");
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStatistics();
  }, []); 

  // Fetch statistics on mount
  useEffect(() => {
    fetchStatistics();
    fetchTopCustomers();
  }, []);

  // Auto-search customers when debounced search changes
  useEffect(() => {
    if (debouncedSearch.trim()) {
      handleSearchCustomers(debouncedSearch);
    } else {
      setCustomers([]);
      setCustomerError(null);
    }
  }, [debouncedSearch]);

  const fetchStatistics = async () => {
    try {
      setLoadingStats(true);
      // Mock API call - replace with real endpoint
      
      const res = await fetch(`${API_BASE}/api/statistics`);
      if (res.ok) {
        const data = await res.json();
        setStatistics(data);
      }
    } catch (err) {
      console.error("Error fetching statistics:", err);
      // Set mock data for demo
      setStatistics({
        totalCustomers: 0,
        totalTickets: 0,
        activeTickets: 0,
        expiredTickets: 0,
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchTopCustomers = async () => {
  try {
    setLoadingTopCustomers(true);
    const res = await fetch(`${API_BASE}/api/top-customers`);
    //console.log("API response:", res); 
    if (res.ok) {
      const data = await res.json();
      // console.log("Data received:", data); 
      setTopCustomers(data); 
    } else {
      console.error("Failed to fetch top customers");
    }
  } catch (err) {
    console.error("Error fetching top customers:", err);
    setTopCustomers([]);  // Set empty array if failed
  } finally {
    setLoadingTopCustomers(false);
  }
};

  const handleSearchCustomers = async (query: string) => {
    if (!query.trim()) {
      setCustomers([]);
      return;
    }

    try {
      setLoadingCustomers(true);
      setCustomerError(null);

      const url = `${API_BASE}/api/customers?q=${encodeURIComponent(query)}&limit=20`;
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

  const handleCustomerUpdate = (updatedCustomer: CustomerListItem) => {
  // อัปเดตข้อมูลลูกค้าใน HistoryPage
  setCustomers((prevCustomers) => {
    return prevCustomers.map((customer) =>
      customer.id === updatedCustomer.id ? updatedCustomer : customer
    );
  });

  // ถ้ามีข้อมูลใน Modal ต้องการให้รีเฟรชข้อมูลใน Modal ด้วย
  if (selectedCustomer?.id === updatedCustomer.id) {
    setSelectedCustomer(updatedCustomer);
  }
};

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

  const handleSelectTicket = async (ticket: TicketSummary) => {
    setSelectedTicket(ticket);
    setTicketDetail(null);
    setDetailError(null);
    setIsTicketsModalOpen(false);
    setIsDetailModalOpen(true);

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

  const parseTicketIdsFromInput = (input: string): string[] => {
    return input
      .split(/[\s,]+/)
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  };

  const handleSearchTicketsByIds = async () => {
    const ids = parseTicketIdsFromInput(ticketIdsInput);

    if (ids.length === 0) {
      toast.error("กรุณาใส่ Ticket ID อย่างน้อย 1 รายการ");
      return;
    }

    try {
      setLoadingTicketResults(true);
      setTicketResultsError(null);
      setTicketResults([]);

      const results: TicketDetailResponse[] = [];

      for (const id of ids) {
        try {
          const url = `${API_BASE}/api/pawn-tickets/${encodeURIComponent(id)}/detail`;
          const res = await fetch(url);

          if (!res.ok) {
            console.warn("ไม่พบ ticket", id, "status:", res.status);
            continue;
          }

          const data: TicketDetailResponse = await res.json();
          results.push(data);
        } catch (innerErr) {
          console.error("Error fetching ticket detail for", id, innerErr);
        }
      }

      if (results.length === 0) {
        setTicketResultsError("ไม่พบ Ticket ที่ตรงกับ ID ที่ระบุ");
        toast.error("ไม่พบ Ticket ที่ระบุ");
      } else {
        toast.success(`พบ ${results.length} Ticket`);
      }

      setTicketResults(results);
    } catch (err) {
      console.error("Error searching tickets by IDs:", err);
      setTicketResultsError("เกิดข้อผิดพลาดระหว่างค้นหา Ticket");
      toast.error("เกิดข้อผิดพลาดระหว่างค้นหา");
    } finally {
      setLoadingTicketResults(false);
    }
  };

  const openDetailFromResult = (detail: TicketDetailResponse) => {
    const anyDetail = detail as any;
    const ticketData = anyDetail.ticket ?? {};

    setSelectedTicket(ticketData as TicketSummary);
    setTicketDetail(detail);
    setDetailError(null);
    setIsDetailModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-accent font-semibold";
      case "ROLLED_OVER":
        return "text-yellow-600 font-semibold";
      case "CANCELLED":
        return "text-destructive font-semibold";
      case "EXPIRED":
        return "text-muted-foreground font-semibold";
      default:
        return "text-foreground";
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  ประวัติและสถิติ
                </h1>
                <p className="text-sm text-muted-foreground">
                  ข้อมูลลูกค้าและตั๋วทั้งหมด
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Statistics Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatisticsCard
            title="ลูกค้าทั้งหมด"
            value={statistics.totalCustomers}
            icon={Users}
            loading={loadingStats}
          />
          <StatisticsCard
            title="ตั๋วทั้งหมด"
            value={statistics.totalTickets}
            icon={Ticket}
            loading={loadingStats}
          />
          <StatisticsCard
            title="ตั๋วที่ใช้งานอยู่"
            value={statistics.activeTickets}
            icon={CheckCircle}
            colorClass="text-accent"
            loading={loadingStats}
          />
          <StatisticsCard
            title="ตั๋วที่หมดอายุ"
            value={statistics.expiredTickets}
            icon={XCircle}
            colorClass="text-destructive"
            loading={loadingStats}
          />
        </div>

        {/* Top Customers Section */}

    <TopCustomersCard
      customers={topCustomers}
      loading={loadingTopCustomers}
      onSelectCustomer={(customer) => {
      const fullCustomer: CustomerListItem = {
      id: customer.Customer_ID, // ใช้ Customer_ID
      name: `${customer.first_name} ${customer.last_name}`, // รวมชื่อ
      nationalId: "", // ถ้าจำเป็นให้ใส่ข้อมูลนี้
      phone: customer.phone || "", // ใช้ phone ถ้ามี
    };
    handleOpenTicketsModal(fullCustomer);
  }}
/>


        {/* Search Customers Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">ค้นหาลูกค้า</h3>
          </div>

          <div className="relative">
            <Input
              type="text"
              placeholder="พิมพ์ชื่อ, เบอร์โทร, หรือเลขบัตรประชาชน..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
            {loadingCustomers && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {customerError && (
            <p className="text-destructive text-sm mt-2">{customerError}</p>
          )}

          {!loadingCustomers && customers.length > 0 && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.map((c) => (
                <Card
                  key={c.id}
                  className="p-5 hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-primary"
                  onClick={() => handleOpenTicketsModal(c)}
                >
                  <div className="space-y-2">
                    <p className="font-semibold text-lg text-foreground">
                      {c.name}
                    </p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        เลขบัตร: <span className="font-mono">{c.nationalId || "-"}</span>
                      </p>
                      <p>
                        โทร: <span className="font-mono">{c.phone || "-"}</span>
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Search by Ticket IDs Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">ค้นหาตั๋วตาม Ticket ID</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-3">
            พิมพ์ Ticket ID คั่นด้วยเครื่องหมายจุลภาค (,), เว้นวรรค หรือขึ้นบรรทัดใหม่
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <textarea
              className="flex-1 p-3 rounded-lg border border-input bg-background min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              placeholder="เช่น 1001, 1005, 1010"
              value={ticketIdsInput}
              onChange={(e) => setTicketIdsInput(e.target.value)}
            />
            <Button
              onClick={handleSearchTicketsByIds}
              disabled={loadingTicketResults}
              className="shrink-0"
            >
              {loadingTicketResults ? "กำลังค้นหา..." : "ค้นหา"}
            </Button>
          </div>

          {ticketResults.length > 0 && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ticketResults.map((detail) => {
                const anyDetail = detail as any;
                const t = anyDetail.ticket ?? {};
                const c = anyDetail.customer ?? {};

                const customerName =
                  c.fullName ??
                  [c.first_name, c.last_name].filter(Boolean).join(" ") ??
                  "-";

                return (
                  <Card
                    key={t.ticket_ID}
                    className="p-4 hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={() => openDetailFromResult(detail)}
                  >
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Ticket ID</p>
                        <p className="text-xl font-mono font-bold">
                          {t.ticket_ID}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">{customerName}</p>
                        <p className={`text-sm ${getStatusColor(t.contract_status)}`}>
                          {t.contract_status}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      <CustomerTicketsModal
  isOpen={isTicketsModalOpen}
  onClose={() => setIsTicketsModalOpen(false)}
  customer={selectedCustomer}
  tickets={tickets}
  loading={loadingTickets}
  error={ticketsError}
  onSelectTicket={handleSelectTicket}
  getStatusColor={getStatusColor}
  onCustomerUpdate={handleCustomerUpdate}  // ส่งฟังก์ชันนี้ให้กับ Modal
/>


      <TicketDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        ticket={selectedTicket}
        detail={ticketDetail}
        loading={loadingDetail}
        error={detailError}
      />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <EmployeeManager />
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* ...ส่วนอื่นของ dashboard... */}
        <DispositionDashboard />
      </div>

    </div>
    
  );
}

export default HistoryPage;