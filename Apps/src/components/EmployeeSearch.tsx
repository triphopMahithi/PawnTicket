import { useState } from "react";
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

type Position = "staff" | "supervisor" | "manager";

const POSITION_LABEL: Record<Position, string> = {
  staff: "พนักงาน",
  supervisor: "หัวหน้าชุด",
  manager: "ผู้จัดการ",
};

export interface Employee {
  id: string;           // map -> staff_ID
  first_name: string;
  last_name: string;
  phone_number: string; // digits-only
  position: Position;
}

// ตัวอย่างข้อมูลเริ่มต้น
const mockEmployees: Employee[] = [
  { id: "E001", first_name: "สมชาย", last_name: "ประเมินดี", phone_number: "0812345678", position: "staff" },
  { id: "E002", first_name: "สมหญิง", last_name: "เชี่ยวชาญ", phone_number: "0898765432", position: "supervisor" },
  { id: "E003", first_name: "วิชัย",   last_name: "มั่นใจ",   phone_number: "0856789012", position: "manager" },
];

interface EmployeeSearchProps {
  onSelect: (employee: Employee) => void;
  selectedEmployee: Employee | null;
  allowedPositions?: Position[]; // ถ้าส่งมา จะฟิลเตอร์เฉพาะตำแหน่งที่อนุญาต
}

export function EmployeeSearch({
  onSelect,
  selectedEmployee,
  allowedPositions,
}: EmployeeSearchProps) {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // ฟอร์มสร้างใหม่
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

  // ---------- Utils ----------
  const onlyDigits = (s: string) => s.replace(/\D/g, "");

  const formatPhone = (phone: string) => {
    const d = onlyDigits(phone);
    if (d.startsWith("66")) {
      const body = d.slice(2); // 9 digits
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

  const fullName = (e: Employee) => `${e.first_name} ${e.last_name}`.trim();
  const matchAllowed = (e: Employee) =>
    !allowedPositions || allowedPositions.includes(e.position);

  // ---------- Search ----------
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

  // ---------- Create ----------
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

    // กันซ้ำด้วยเบอร์ (E.164) หรือชื่อ-นามสกุล
    const e164 = toE164(phone);
    const dup = employees.find(
      (e) =>
        (e164 && toE164(e.phone_number) === e164) || // guard ป้องกัน null
        (e.first_name.trim() === fn && e.last_name.trim() === ln)
    );
    if (dup) {
      toast.error("มีพนักงานคนนี้ในระบบแล้ว");
      return;
    }

    const employee: Employee = {
      id: `E${Date.now()}`, // Temp staff_ID
      first_name: fn,
      last_name: ln,
      phone_number: phone, // digits-only
      position: pos,
    };

    setEmployees((prev) => [employee, ...prev]);
    onSelect(employee);
    setIsOpen(false);

    // reset form
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
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              สร้างใหม่
            </Button>
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
                onChange={(e) =>
                  setNewEmp({ ...newEmp, first_name: e.target.value })
                }
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
                onChange={(e) =>
                  setNewEmp({ ...newEmp, last_name: e.target.value })
                }
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
                onValueChange={(v) =>
                  setNewEmp({ ...newEmp, position: v as Position })
                }
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
              <Button onClick={handleCreate} className="w-full">
                บันทึก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>

      {/* Search Result */}
      {searchQuery && (
        <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
          {filteredEmployees.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">ไม่พบข้อมูลพนักงาน</div>
          ) : (
            filteredEmployees.map((e) => (
              <button
                key={e.id}
                onClick={() => {
                  onSelect(e);
                  setSearchQuery("");
                  toast.success(`เลือกพนักงาน: ${fullName(e)}`);
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
          <p className="font-semibold">{fullName(selectedEmployee)}</p>
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