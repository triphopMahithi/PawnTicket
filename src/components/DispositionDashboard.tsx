import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Pencil,
  Trash2,
  RefreshCw,
  PlusCircle,
  Search,
  TrendingUp,
  DollarSign,
  Package,
  Filter,
  X,
  Clock,
  Lock,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type SaleMethod = "AUCTION" | "DIRECT_SALE" | "ONLINE" | "SCRAP";

type Disposition = {
  disposition_ID: number;
  item_ID: number;
  sale_date: string | null;
  sale_method: SaleMethod;
  sale_price: number;
};

type ItemSummary = {
  item: {
    item_ID: number;
    item_type: string;
    description: string | null;
    item_status: string;
  };
  latestTicket: {
    ticket_ID: number;
    contract_status: string;
    contract_date: string;
  } | null;
};

const SALE_METHOD_CONFIG: Record<
  SaleMethod,
  { label: string; color: string; icon: string }
> = {
  AUCTION: {
    label: "ประมูล",
    color: "bg-primary/10 text-primary border-primary/20",
    icon: "🔨",
  },
  DIRECT_SALE: {
    label: "ขายตรง",
    color: "bg-success/10 text-success border-success/20",
    icon: "🏪",
  },
  ONLINE: {
    label: "ออนไลน์",
    color: "bg-accent/10 text-accent border-accent/20",
    icon: "💻",
  },
  SCRAP: {
    label: "ขายเศษ",
    color: "bg-warning/10 text-warning border-warning/20",
    icon: "♻️",
  },
};

const API_BASE = "http://localhost:3001";

// Helper สำหรับแปลงเวลาปัจจุบันเป็น ISO String เพื่อส่ง API
function getCurrentISO(): string {
  return new Date().toISOString();
}

// Helper แปลง Input Value กลับเป็น ISO
function inputValueToISO(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

interface DispositionDashboardProps {
  itemId?: number;
  className?: string;
}

export default function DispositionDashboard({
  itemId,
  className,
}: DispositionDashboardProps) {
  const [items, setItems] = useState<Disposition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMethod, setFilterMethod] = useState<SaleMethod | "ALL">("ALL");

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Disposition | null>(null);
  const [editSaleDate, setEditSaleDate] = useState(""); 
  const [editSaleMethod, setEditSaleMethod] = useState<SaleMethod>("DIRECT_SALE");
  const [editSalePrice, setEditSalePrice] = useState("");

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Create state
  const [createOpen, setCreateOpen] = useState(false);
  const [createItemIdInput, setCreateItemIdInput] = useState("");
  
  // Real-time Date State
  const [currentDate, setCurrentDate] = useState(new Date());

  const [createSaleMethod, setCreateSaleMethod] =
    useState<SaleMethod>("DIRECT_SALE");
  const [createSalePrice, setCreateSalePrice] = useState("");

  // Item summary preview
  const [itemSummary, setItemSummary] = useState<ItemSummary | null>(null);
  const [itemSummaryLoading, setItemSummaryLoading] = useState(false);
  const [itemSummaryError, setItemSummaryError] = useState<string | null>(null);

  // --- Real-time Clock Effect ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // อัปเดตเวลาทันทีที่เปิด
    if (createOpen) {
      setCurrentDate(new Date());
      
      // และเริ่มนับเวลาทุก 1 วินาที
      timer = setInterval(() => {
        setCurrentDate(new Date());
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [createOpen]);

  // --- Price Formatting Handlers ---
  const handlePriceChange = (
    value: string,
    setter: (val: string) => void
  ) => {
    // 1. ลบทุกอย่างที่ไม่ใช่ตัวเลขและจุด
    let cleanValue = value.replace(/[^0-9.]/g, "");

    // 2. ป้องกันไม่ให้มีจุดมากกว่า 1 จุด
    const parts = cleanValue.split(".");
    if (parts.length > 2) {
      cleanValue = parts[0] + "." + parts.slice(1).join("");
    }

    // 3. จัดรูปแบบลูกน้ำ (Commas) เฉพาะส่วนจำนวนเต็ม
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    // 4. รวมร่างกลับ
    let formattedValue = integerPart;
    if (parts.length > 1) {
      formattedValue += "." + parts[1];
    } else if (value.endsWith(".")) {
      // กรณีผู้ใช้พิมพ์จุดต่อท้าย
      formattedValue += ".";
    }

    setter(formattedValue);
  };

  const handlePriceBlur = (
    value: string,
    setter: (val: string) => void
  ) => {
    if (!value) return;

    // ลบลูกน้ำออกก่อนแปลงเป็นตัวเลข
    const rawValue = value.replace(/,/g, "");
    const number = parseFloat(rawValue);

    if (!isNaN(number)) {
      // จัดรูปแบบ: มีลูกน้ำ และทศนิยม 2 ตำแหน่งเสมอ
      const formatted = number.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setter(formatted);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (itemId) params.set("itemId", String(itemId));
      params.set("limit", "100");

      const res = await fetch(
        `${API_BASE}/api/dispositions?${params.toString()}`
      );

      if (!res.ok) {
        throw new Error("โหลดข้อมูลไม่สำเร็จ");
      }

      const data = await res.json();
      setItems(data.items ?? []);
    } catch (err: any) {
      // ใช้ console.warn แทน error เพื่อไม่ให้แดงเถือกใน Console เวลาเชื่อมต่อไม่ได้ใน Preview
      console.warn("fetch dispositions warning (connect to localhost failed):", err);
      setError("ไม่สามารถเชื่อมต่อกับ Server ได้ (Failed to fetch)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  // Filtered items based on search and filter
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.item_ID.toString().includes(searchQuery) ||
        item.disposition_ID.toString().includes(searchQuery);

      const matchesFilter =
        filterMethod === "ALL" || item.sale_method === filterMethod;

      return matchesSearch && matchesFilter;
    });
  }, [items, searchQuery, filterMethod]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = items.length;
    const totalRevenue = items.reduce((sum, item) => sum + item.sale_price, 0);
    const avgPrice = total > 0 ? totalRevenue / total : 0;

    const methodCounts = items.reduce((acc, item) => {
      acc[item.sale_method] = (acc[item.sale_method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostPopularMethod = Object.entries(methodCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0] as SaleMethod | undefined;

    return { total, totalRevenue, avgPrice, mostPopularMethod };
  }, [items]);

  const fetchItemSummary = async (id: number) => {
    try {
      setItemSummaryLoading(true);
      setItemSummaryError(null);
      setItemSummary(null);

      const res = await fetch(`${API_BASE}/api/items/${id}/summary`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.error === "item_not_found") {
          setItemSummaryError("ไม่พบทรัพย์สำหรับ Item ID นี้");
        } else {
          setItemSummaryError("ดึงข้อมูลทรัพย์ไม่สำเร็จ");
        }
        return;
      }

      const data: ItemSummary = await res.json();
      setItemSummary(data);
    } catch (err) {
      console.warn("GET /api/items/:id/summary warning (connect failed):", err);
      setItemSummaryError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setItemSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (!createOpen) {
      setItemSummary(null);
      setItemSummaryError(null);
      setItemSummaryLoading(false);
      return;
    }

    const rawId =
      itemId ??
      Number(String(createItemIdInput).replace(/[^\d]/g, "") || "0");

    if (!Number.isInteger(rawId) || rawId <= 0) {
      setItemSummary(null);
      setItemSummaryError(null);
      return;
    }

    fetchItemSummary(rawId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOpen, itemId, createItemIdInput]);

  // Edit handlers
  const openEdit = (row: Disposition) => {
    setEditing(row);
    // เก็บค่าวันที่เดิมไว้ (ใน Edit เราจะไม่ให้แก้ เพื่อไม่ให้เลือก Past/Future)
    setEditSaleDate(row.sale_date || "");
    setEditSaleMethod(row.sale_method);
    
    // Format initial price for edit
    const price = row.sale_price;
    const formattedPrice = price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    setEditSalePrice(formattedPrice);
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;

    // สำหรับ Edit: ใช้วันที่เดิม (ไม่ได้แก้) แต่ต้องแปลง format ให้ถูกต้องถ้าจำเป็น
    // หรือถ้า API รองรับการไม่ส่ง saleDate เพื่อไม่ update ก็ทำได้
    // แต่ที่นี่เราส่งค่าเดิมกลับไปเพื่อความชัวร์
    let iso = null;
    if (editSaleDate) {
        // editSaleDate จาก DB มักจะเป็น "YYYY-MM-DD HH:mm:ss" หรือ ISO อยู่แล้ว
        // ลองแปลงเป็น ISO
        try {
            const d = new Date(editSaleDate.replace(" ", "T")); // simple fix for SQL date
            if (!isNaN(d.getTime())) {
                iso = d.toISOString();
            } else {
                iso = editSaleDate; // ส่งค่าเดิมถ้าแปลงไม่ได้
            }
        } catch {
            iso = editSaleDate;
        }
    }

    // Clean comma before sending
    const priceNum = Number(String(editSalePrice).replace(/,/g, ""));
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast.error("กรุณากรอกราคาขายที่ถูกต้อง (มากกว่า 0)");
      return;
    }

    try {
      const payload: any = {
        saleMethod: editSaleMethod,
        salePrice: priceNum,
      };
      if (iso) payload.saleDate = iso;

      const res = await fetch(
        `${API_BASE}/api/dispositions/${editing.disposition_ID}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.warn("update error response:", data);
        toast.error("บันทึกการแก้ไขไม่สำเร็จ");
        return;
      }

      const data = await res.json();
      const updated: Disposition = data.disposition;

      setItems((prev) =>
        prev.map((it) =>
          it.disposition_ID === updated.disposition_ID ? updated : it
        )
      );

      toast.success("✅ บันทึกการแก้ไขเรียบร้อยแล้ว");
      setEditOpen(false);
      setEditing(null);
    } catch (err) {
      console.warn("PUT /api/dispositions error (connect failed):", err);
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  // Create handlers
  const openCreate = () => {
    // รีเซ็ตเวลาเป็นปัจจุบันทันทีที่กดปุ่ม
    setCurrentDate(new Date()); 
    setCreateSaleMethod("DIRECT_SALE");
    setCreateSalePrice("");
    setCreateItemIdInput("");
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    const effectiveItemId =
      itemId ?? Number(String(createItemIdInput).replace(/[^\d]/g, ""));

    if (!Number.isInteger(effectiveItemId) || effectiveItemId <= 0) {
      toast.error("กรุณาระบุ Item ID ที่ถูกต้อง");
      return;
    }

    // ใช้เวลาปัจจุบันเสมอสำหรับการสร้างใหม่ (Real-time ณ วินาทีที่กดบันทึก)
    // แต่เนื่องจากเราแสดงเวลา Real-time บนหน้าจอ User คาดหวังเวลานั้น
    // เราใช้ currentDate ล่าสุดที่ state เก็บไว้
    const iso = currentDate.toISOString();

    // Clean comma before sending
    const priceNum = Number(String(createSalePrice).replace(/,/g, ""));
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast.error("กรุณากรอกราคาขายที่ถูกต้อง (มากกว่า 0)");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/dispositions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: effectiveItemId,
          saleDate: iso,
          saleMethod: createSaleMethod,
          salePrice: priceNum,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.warn("create error response:", data);
        if (data?.error === "item_not_found") {
          toast.error("ไม่พบ Item ID นี้ในระบบ");
        } else {
          toast.error("สร้างรายการใหม่ไม่สำเร็จ");
        }
        return;
      }

      const data = await res.json();
      const newDisposition: Disposition = data.disposition;

      setItems((prev) => [newDisposition, ...prev]);
      toast.success("✅ สร้างรายการขายใหม่สำเร็จ");
      setCreateOpen(false);
    } catch (err) {
      console.warn("POST /api/dispositions error (connect failed):", err);
      toast.error("เกิดข้อผิดพลาดในการสร้างรายการ");
    }
  };

  // Delete handlers
  const confirmDelete = (id: number) => {
    setDeletingId(id);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const res = await fetch(`${API_BASE}/api/dispositions/${deletingId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.warn("delete error response:", data);
        toast.error("ลบรายการไม่สำเร็จ");
        return;
      }

      setItems((prev) =>
        prev.filter((it) => it.disposition_ID !== deletingId)
      );
      toast.success("✅ ลบรายการเรียบร้อยแล้ว");
    } catch (err) {
      console.warn("DELETE /api/dispositions error (connect failed):", err);
      toast.error("เกิดข้อผิดพลาดในการลบรายการ");
    } finally {
      setDeleteOpen(false);
      setDeletingId(null);
    }
  };

  // Utility functions
  const formatDateTime = (value: string | null) => {
    if (!value) return "-";
    try {
      const iso = value.replace(" ", "T");
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return value;
      return format(d, "dd MMM yyyy • HH:mm", { locale: th });
    } catch {
      return value;
    }
  };

  const formatMoney = (num: number) =>
    Number(num).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            จัดการการขายทรัพย์
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {itemId
              ? `แสดงรายการสำหรับทรัพย์ ID: ${itemId}`
              : "ระบบบริหารจัดการรายการขายทรัพย์ทั้งหมด"}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 shadow-soft">
          <PlusCircle className="h-4 w-4" />
          เพิ่มรายการขาย
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ทรัพย์ทั้งหมด
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">รายการ</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ยอดรวมทั้งหมด
            </CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              ฿{formatMoney(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">บาท</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ราคาเฉลี่ย
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿{formatMoney(stats.avgPrice)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">ต่อรายการ</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              วิธีการยอดนิยม
            </CardTitle>
            <Filter className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            {stats.mostPopularMethod ? (
              <>
                <div className="text-xl font-bold">
                  {SALE_METHOD_CONFIG[stats.mostPopularMethod].icon}{" "}
                  {SALE_METHOD_CONFIG[stats.mostPopularMethod].label}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ใช้มากที่สุด
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">ไม่มีข้อมูล</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหาด้วย Disposition ID หรือ Item ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Select
              value={filterMethod}
              onValueChange={(v) => setFilterMethod(v as SaleMethod | "ALL")}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="กรองตามวิธีการ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                <SelectItem value="AUCTION">ประมูล</SelectItem>
                <SelectItem value="DIRECT_SALE">ขายตรง</SelectItem>
                <SelectItem value="ONLINE">ออนไลน์</SelectItem>
                <SelectItem value="SCRAP">ขายเศษ</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={fetchData}
              disabled={loading}
              className="shrink-0"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>

          {(searchQuery || filterMethod !== "ALL") && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span>แสดง {filteredItems.length} รายการ</span>
              {filteredItems.length !== items.length && (
                <span>จากทั้งหมด {items.length} รายการ</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive bg-destructive/5 shadow-card">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[100px] font-semibold">
                  Disp. ID
                </TableHead>
                <TableHead className="w-[100px] font-semibold">
                  Item ID
                </TableHead>
                <TableHead className="font-semibold">วันที่ขาย</TableHead>
                <TableHead className="font-semibold">วิธีการขาย</TableHead>
                <TableHead className="text-right font-semibold">
                  ราคาขาย
                </TableHead>
                <TableHead className="w-[140px] text-right font-semibold">
                  การจัดการ
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">
                        กำลังโหลดข้อมูล...
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="h-12 w-12 text-muted-foreground/50" />
                      <div>
                        <p className="font-medium">ไม่พบรายการ</p>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery || filterMethod !== "ALL"
                            ? "ลองเปลี่ยนเงื่อนไขการค้นหาหรือกรอง"
                            : "คลิกปุ่ม 'เพิ่มรายการขาย' เพื่อเริ่มต้น"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((row) => (
                  <TableRow
                    key={row.disposition_ID}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      #{row.disposition_ID}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      #{row.item_ID}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(row.sale_date)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-medium",
                          SALE_METHOD_CONFIG[row.sale_method].color
                        )}
                      >
                        {SALE_METHOD_CONFIG[row.sale_method].icon}{" "}
                        {SALE_METHOD_CONFIG[row.sale_method].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      ฿{formatMoney(row.sale_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => openEdit(row)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => confirmDelete(row.disposition_ID)}
                          className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>แก้ไขรายการขายทรัพย์</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลการขายทรัพย์ตามที่ต้องการ
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Disposition ID
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                        <Lock className="h-3 w-3" />
                    </div>
                    <Input
                        value={editing.disposition_ID}
                        disabled
                        className="font-mono text-sm bg-muted pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Item ID
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                        <Lock className="h-3 w-3" />
                    </div>
                    <Input
                        value={editing.item_ID}
                        disabled
                        className="font-mono text-sm bg-muted pl-8"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-saleDate">
                  วันที่ขาย <span className="text-muted-foreground text-xs"></span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <Clock className="h-4 w-4" />
                  </div>
                  <Input
                    id="edit-saleDate"
                    value={formatDateTime(editSaleDate)}
                    disabled
                    className="pl-9 bg-muted font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  วิธีการขาย <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={editSaleMethod}
                  onValueChange={(v) => setEditSaleMethod(v as SaleMethod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUCTION">
                      🔨 ประมูล
                    </SelectItem>
                    <SelectItem value="DIRECT_SALE">
                      🏪 ขายตรง/หน้าร้าน
                    </SelectItem>
                    <SelectItem value="ONLINE">
                      💻 ขายออนไลน์
                    </SelectItem>
                    <SelectItem value="SCRAP">
                      ♻️ ขายเป็นเศษ/หลอม
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-salePrice">
                  ราคาขาย (บาท) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-salePrice"
                  type="text"
                  inputMode="decimal"
                  value={editSalePrice}
                  onChange={(e) => handlePriceChange(e.target.value, setEditSalePrice)}
                  onBlur={(e) => handlePriceBlur(e.target.value, setEditSalePrice)}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditOpen(false);
                setEditing(null);
              }}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleSaveEdit}>บันทึกการแก้ไข</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>เพิ่มรายการขายทรัพย์ใหม่</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลรายการขายทรัพย์ที่ต้องการเพิ่ม
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!itemId && (
              <div className="space-y-2">
                <Label htmlFor="create-itemId">
                  Item ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="create-itemId"
                  type="number"
                  inputMode="numeric"
                  placeholder="ระบุ item_ID ของทรัพย์"
                  value={createItemIdInput}
                  onChange={(e) => setCreateItemIdInput(e.target.value)}
                />
              </div>
            )}

            {itemId && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Item ID
                </Label>
                <Input
                  value={itemId}
                  disabled
                  className="font-mono text-sm bg-muted"
                />
              </div>
            )}

            {/* Item Summary Preview */}
            {itemSummaryLoading && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>กำลังตรวจสอบข้อมูลทรัพย์...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {itemSummaryError && (
              <Card className="border-destructive bg-destructive/5">
                <CardContent className="pt-4 pb-4">
                  <p className="text-sm text-destructive">{itemSummaryError}</p>
                </CardContent>
              </Card>
            )}

            {!itemSummaryLoading && !itemSummaryError && itemSummary && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4 pb-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start justify-between">
                      <span className="text-muted-foreground">ประเภททรัพย์:</span>
                      <span className="font-semibold">
                        {itemSummary.item.item_type}
                      </span>
                    </div>
                    {itemSummary.item.description && (
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-muted-foreground shrink-0">
                          รายละเอียด:
                        </span>
                        <span className="text-right line-clamp-2">
                          {itemSummary.item.description}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-primary/20">
                      {itemSummary.latestTicket ? (
                        <p className="text-xs">
                          📋 item id{" "}
                          <span className="font-mono font-semibold">
                            #{itemSummary.latestTicket.ticket_ID}
                          </span>
                          <br />
                          วันที่ทำสัญญา:{" "}
                          {formatDateTime(itemSummary.latestTicket.contract_date)}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          ยังไม่มีสัญญาจำนำที่เชื่อมโยงกับทรัพย์นี้
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="create-saleDate">
                วันที่ขาย (เวลาที่กำลังดำเนินการ) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-primary animate-pulse">
                    <Clock className="h-4 w-4" />
                </div>
                <Input
                  id="create-saleDate"
                  type="text"
                  // แสดงวินาทีด้วย (ss) เพื่อให้เห็นการเปลี่ยนแปลงแบบ Real-time
                  value={format(currentDate, "dd MMM yyyy • HH:mm:ss", { locale: th })}
                  disabled
                  className="pl-9 bg-muted font-mono font-semibold text-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                วิธีการขาย <span className="text-destructive">*</span>
              </Label>
              <Select
                value={createSaleMethod}
                onValueChange={(v) => setCreateSaleMethod(v as SaleMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUCTION">
                    🔨 ประมูล
                  </SelectItem>
                  <SelectItem value="DIRECT_SALE">
                    🏪 ขายตรง/หน้าร้าน
                  </SelectItem>
                  <SelectItem value="ONLINE">
                    💻 ขายออนไลน์
                  </SelectItem>
                  <SelectItem value="SCRAP">
                    ♻️ ขายเป็นเศษ/หลอม
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-salePrice">
                ราคาขาย (บาท) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-salePrice"
                type="text"
                inputMode="decimal"
                value={createSalePrice}
                onChange={(e) => handlePriceChange(e.target.value, setCreateSalePrice)}
                onBlur={(e) => handlePriceBlur(e.target.value, setCreateSalePrice)}
                placeholder=" "
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreate}>เพิ่มรายการ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบรายการ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?
              <br />
              <span className="font-semibold text-destructive">
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              ลบรายการ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}