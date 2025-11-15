import { useState, useRef, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Position = "staff" | "supervisor" | "manager";

const POSITION_LABEL: Record<Position, string> = {
  staff: "พนักงาน",
  supervisor: "หัวหน้าชุด",
  manager: "ผู้จัดการ",
};

export interface Employee {
  id: string;            // Staff_ID
  name: string;          // full name (first + last)
  first_name: string;
  last_name: string;
  phone_number: string;  // digits-only
  position: Position;
}

// ตัวอย่างข้อมูลเริ่มต้น (mock) — ใส่ name ให้ครบเพื่อให้ shape เท่ากัน
const mockEmployees: Employee[] = [
  { id: "E001", first_name: "สมชาย", last_name: "ประเมินดี", name: "สมชาย ประเมินดี", phone_number: "0812345678", position: "staff" },
  { id: "E002", first_name: "สมหญิง", last_name: "เชี่ยวชาญ", name: "สมหญิง เชี่ยวชาญ", phone_number: "0898765432", position: "supervisor" },
  { id: "E003", first_name: "วิชัย",   last_name: "มั่นใจ",   name: "วิชัย มั่นใจ",     phone_number: "0856789012", position: "manager" },
];

interface EmployeeSearchProps {
  onSelect: (employee: Employee) => void;        
  selectedEmployee: Employee | null;
  allowedPositions?: Position[];                  
}

export function EmployeeSearch({
  onSelect,
  selectedEmployee,
  allowedPositions,
}: EmployeeSearchProps) {
  // local list (mock) เผื่อค้นหาแบบออฟไลน์ + ใช้ตอนสร้างใหม่
  const [employees, setEmployees] = useState<Employee[]>(
    mockEmployees.map(e => ({ ...e, name: e.name ?? `${e.first_name} ${e.last_name}`.trim() }))
  );

  // server search
  const [serverEmployees, setServerEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isOpenRef = useRef<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);

  // form สร้างใหม่
  const [isOpen, setIsOpen] = useState(false);
  const [newEmp, setNewEmp] = useState<{
    first_name: string;
    last_name: string;
    phone_number: string; // digits-only
    position: Position;
  }>({
    first_name: "",
    last_name: "",
    phone_number: "",
    position: "staff",
  });

  // ---------- utils ----------
  const onlyDigits = (s: string) => s.replace(/\D/g, "");

  const formatPhone = (phone: string) => {
    const d = onlyDigits(phone);
    if (d.startsWith("66")) {
      const body = d.slice(2);
      const p1 = body.slice(0, 1);
      const p2 = body.slice(1, 5);
      const p3 = body.slice(5, 9);
      return `+66 ${p1}${p2 ? ` ${p2}` : ""}${p3 ? ` ${p3}` : ""}`.trim();
    }
    const p1 = d.slice(0, 3);
    const p2 = d.slice(3, 6);
    const p3 = d.slice(6, 10);
    return [p1, p2, p3].filter(Boolean).join("-");
  };

  const isValidThaiMobile = (phone: string) => {
    const d = onlyDigits(phone);
    if (/^0[689]\d{8}$/.test(d)) return true;
    if (/^66[689]\d{7}$/.test(d)) return true;
    return false;
  };

  const toE164 = (phone: string) => {
    const d = onlyDigits(phone);
    if (d.startsWith("66") && d.length === 11) return `+${d}`;
    if (d.startsWith("0") && d.length === 10) return `+66${d.slice(1)}`;
    return null;
  };

  const fullName = (e: Employee) => (e.name?.trim() || `${e.first_name} ${e.last_name}`.trim());
  const matchAllowed = (e: Employee) =>
    !allowedPositions || allowedPositions.includes(e.position);

  // ---------- server search with debounce ----------
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setServerEmployees([]);
      setLoading(false);
      setErrorMsg(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const base = (import.meta as any).env?.VITE_API_ORIGIN || "http://localhost:3001";
        const params = new URLSearchParams({ q, limit: "20" });
        const resp = await fetch(`${base}/api/employees?${params}`, { signal: controller.signal });
        if (!resp.ok) throw new Error("fetch_failed");

        const data = await resp.json();
        const items: Employee[] = (data.items || []).map((c: any) => {
          const posRaw = String(c.position ?? "staff").toLowerCase();
          const position: Position =
            posRaw === "supervisor" ? "supervisor" :
            posRaw === "manager"   ? "manager"   : "staff";

          const first = String(c.first_name ?? "");
          const last  = String(c.last_name  ?? "");
          const name  = String(c.name ?? `${first} ${last}`.trim()); 

          return {
            id: String(c.id),
            name,                   
            first_name: first,
            last_name: last,
            phone_number: String(c.phone_number ?? c.phone ?? ""),
            position,
          };
        });

        const filtered = allowedPositions ? items.filter(e => allowedPositions.includes(e.position)) : items;
        setServerEmployees(filtered);
      } catch (e: any) {
        if (e.name !== "AbortError") setErrorMsg("ค้นหาจากฐานข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allowedPositions]);

  // ---------- local filter (optional helper) ----------
  const filteredEmployees = employees.filter((e) => {
    if (!matchAllowed(e)) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return false;
    const qDigits = onlyDigits(searchQuery);
    return (
      e.first_name.toLowerCase().includes(q) ||
      e.last_name.toLowerCase().includes(q) ||
      fullName(e).toLowerCase().includes(q) ||
      onlyDigits(e.phone_number).includes(qDigits) ||
      POSITION_LABEL[e.position].toLowerCase().includes(q)
    );
  });

  // ---------- create ----------
  const handleCreate = () => {
    const fn = newEmp.first_name.trim();
    const ln = newEmp.last_name.trim();
    const raw = onlyDigits(newEmp.phone_number);
    const phone = raw.startsWith("66") ? raw.slice(0, 11) : raw.slice(0, 10);
    const pos = newEmp.position;

    if (!fn || !ln || !phone) {
      toast.error("กรุณากรอกชื่อ-นามสกุล และเบอร์โทรให้ครบ");
      return;
    }
    if (!isValidThaiMobile(phone)) {
      toast.error("เบอร์โทรศัพท์ไม่ถูกต้อง (ขึ้นต้น 06/08/09 10 หลัก หรือ +66 ...)");
      return;
    }
    if (!pos) {
      toast.error("กรุณาเลือกตำแหน่ง");
      return;
    }

    const e164 = toE164(phone);
    const dup = employees.find(
      (e) =>
        (e164 && toE164(e.phone_number) === e164) ||
        (e.first_name.trim() === fn && e.last_name.trim() === ln)
    );
    if (dup) {
      toast.error("มีพนักงานคนนี้ในระบบแล้ว");
      return;
    }

    const employee: Employee = {
      id: `E${Date.now()}`,         // temp staff_ID
      first_name: fn,
      last_name: ln,
      name: `${fn} ${ln}`.trim(),   
      phone_number: phone,
      position: pos,
    };

    setEmployees((prev) => [employee, ...prev]);
    onSelect(employee);            
    setIsOpen(false);
    setNewEmp({ first_name: "", last_name: "", phone_number: "", position: "staff" });
    toast.success("เพิ่มข้อมูลพนักงานสำเร็จ");
  };

  return (
    <div className="space-y-4">
      {/* Search + Create */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาด้วยชื่อ, นามสกุล, เบอร์โทร หรือชื่อตำแหน่ง"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
        {/**
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              สร้างใหม่
            </Button>
        */}
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มข้อมูลพนักงาน</DialogTitle>
              <DialogDescription>กรอกข้อมูลให้ครบถ้วน</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div>
                <Label htmlFor="first_name">
                  ชื่อ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="first_name"
                  placeholder="สมชาย"
                  value={newEmp.first_name}
                  onChange={(e) => setNewEmp({ ...newEmp, first_name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="last_name">
                  นามสกุล <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="last_name"
                  placeholder="ประเมินดี"
                  value={newEmp.last_name}
                  onChange={(e) => setNewEmp({ ...newEmp, last_name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="phone">
                  เบอร์โทรศัพท์ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  inputMode="tel"
                  placeholder="081-234-5678 หรือ +66 8 1234 5678"
                  value={formatPhone(newEmp.phone_number)}
                  onChange={(e) => {
                    const d = onlyDigits(e.target.value);
                    const limited = d.startsWith("66") ? d.slice(0, 11) : d.slice(0, 10);
                    setNewEmp({ ...newEmp, phone_number: limited });
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  10 หลัก (ขึ้นต้น 06/08/09) หรือ +66 ตามมาตรฐาน
                </p>
              </div>

              <div>
                <Label htmlFor="position">
                  ตำแหน่ง <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={newEmp.position}
                  onValueChange={(v) => setNewEmp({ ...newEmp, position: v as Position })}
                >
                  <SelectTrigger id="position">
                    <SelectValue placeholder="เลือกตำแหน่ง" />
                  </SelectTrigger>
                  <SelectContent>
                    {(["staff", "supervisor", "manager"] as Position[])
                      .filter((p) => !allowedPositions || allowedPositions.includes(p))
                      .map((p) => (
                        <SelectItem key={p} value={p}>
                          {POSITION_LABEL[p]} ({p})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Button onClick={handleCreate} className="w-full">บันทึก</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Server search result */}
      {searchQuery && (
        <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">กำลังค้นหา...</div>
          ) : errorMsg ? (
            <div className="p-4 text-center text-destructive">{errorMsg}</div>
          ) : serverEmployees.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">ไม่พบข้อมูลพนักงาน</div>
          ) : (
            serverEmployees.map((e) => (
              <button
                key={e.id}
                onClick={() => {
                  const normalized: Employee = e.name
                    ? e
                    : { ...e, name: `${e.first_name} ${e.last_name}`.trim() };
                  onSelect(normalized); 
                  setSearchQuery("");
                  toast.success(`เลือกพนักงาน: ${fullName(normalized)}`);
                }}
                className="w-full p-3 text-left hover:bg-muted transition-colors"
              >
                <p className="font-medium">{fullName(e)}</p>
                <p className="text-sm text-muted-foreground">
                  {formatPhone(e.phone_number)} | {POSITION_LABEL[e.position]} ({e.position})
                </p>
              </button>
            ))
          )}
        </div>
      )}

      {/* Selected */}
      {selectedEmployee && (
        <div className="p-4 bg-card rounded-lg border space-y-1">
          <p className="text-sm text-muted-foreground">พนักงานที่เลือก</p>
          <p className="font-semibold">{selectedEmployee.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatPhone(selectedEmployee.phone_number)}
          </p>
          <p className="text-sm text-muted-foreground">
            ตำแหน่ง: {POSITION_LABEL[selectedEmployee.position]} ({selectedEmployee.position})
          </p>
        </div>
      )}
    </div>
  );
}
