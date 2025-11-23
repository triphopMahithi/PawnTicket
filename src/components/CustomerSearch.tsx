import { useState } from "react";
import { useRef, useEffect } from "react";
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

const API_BASE_URL = "http://localhost:3001"; // ถ้าจะย้ายเป็น env ค่อยเปลี่ยนทีหลังได้

interface Address {
  houseNo?: string;
  street?: string;
  tambon: string;
  amphoe: string;
  province: string;
  postalCode: string; // 5 digits
  note?: string;
  raw?: string;
}

interface Customer {
  id: string;
  name: string;
  nationalId: string; // digits only
  phone: string;      // digits only
  dateOfBirthISO?: string; // YYYY-MM-DD
  address?: Address;
}

interface CustomerSearchProps {
  onSelect: (customer: Customer) => void;
  selectedCustomer: Customer | null;
}

export function CustomerSearch({ onSelect, selectedCustomer }: CustomerSearchProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<{
    name: string;
    nationalId: string; // digits only
    phone: string;      // digits only
    address: Address;
  }>({
    name: "",
    nationalId: "",
    phone: "",
    address: {
      houseNo: "",
      street: "",
      tambon: "",
      amphoe: "",
      province: "",
      postalCode: "",
      note: "",
    },
  });

  // === Server-side search ===
  const [serverCustomers, setServerCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setServerCustomers([]);
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

        const params = new URLSearchParams({ q, limit: "20" });
        const resp = await fetch(`${API_BASE_URL}/api/customers?${params}`, {
          signal: controller.signal,
        });
        if (!resp.ok) throw new Error("fetch_failed");

        const data = await resp.json();
        const items: Customer[] = (data.items || []).map((c: any) => ({
          id: String(c.id),
          name: String(c.name ?? ""),
          nationalId: String(c.nationalId ?? ""),
          phone: String(c.phone ?? ""),
          dateOfBirthISO: c.dateOfBirthISO,
          address: c.address
            ? {
                houseNo: "",
                street: "",
                tambon: "",
                amphoe: "",
                province: "",
                postalCode: "",
                note: "",
                raw: String(c.address.raw ?? ""),
              }
            : undefined,
        }));

        setServerCustomers(items);
      } catch (e: any) {
        if (e.name !== "AbortError") setErrorMsg("ค้นหาจากฐานข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    }, 300); // debounce 300ms

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // วันเกิดแบบ native input date
  const [dobISO, setDobISO] = useState<string>("");
  const TODAY = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  // สำหรับปุ่มบันทึก (กันดับเบิลคลิก)
  const [creating, setCreating] = useState(false);

  // ---------- Utils ----------
  const onlyDigits = (s: string) => s.replace(/\D/g, "");

  const formatNationalId = (id: string) => {
    const d = onlyDigits(id).slice(0, 13);
    const segs = [1, 4, 5, 2, 1];
    let out: string[] = [];
    let i = 0;
    for (const len of segs) {
      const part = d.slice(i, i + len);
      if (!part) break;
      out.push(part);
      i += len;
    }
    return out.join("-");
  };

  const isValidThaiID = (id: string | number) => {
    const s = String(id);
    const d = s.replace(/\D/g, "");
    if (d.length !== 13) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += Number(d[i]) * (13 - i);
    const check = (11 - (sum % 11)) % 10;
    return check === Number(d[12]);
  };

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

  const isValidPostalCode = (pc: string) => /^\d{5}$/.test(onlyDigits(pc));

  const formatAddressLine = (a?: Address) => {
    if (!a) return "-";
    if (a.raw && a.raw.trim()) return a.raw.trim(); // ใช้ raw ถ้ามี
    const parts = [
      a.houseNo && `เลขที่ ${a.houseNo}`,
      a.street && `ถ.${a.street}`,
      a.tambon && `ต.${a.tambon}`,
      a.amphoe && `อ.${a.amphoe}`,
      a.province && `จ.${a.province}`,
      a.postalCode,
    ].filter(Boolean);
    return parts.length ? parts.join(" ") : "-";
  };

  // ---------- Search (local cache สำหรับกันซ้ำ) ----------
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return false;
    const qDigits = onlyDigits(searchQuery);

    const addrHit =
      c.address &&
      (
        (c.address.tambon || "").toLowerCase().includes(q) ||
        (c.address.amphoe || "").toLowerCase().includes(q) ||
        (c.address.province || "").toLowerCase().includes(q) ||
        (c.address.street || "").toLowerCase().includes(q) ||
        (c.address.houseNo || "").toLowerCase().includes(q) ||
        onlyDigits(c.address.postalCode || "").includes(qDigits)
      );

    return (
      c.name.toLowerCase().includes(q) ||
      onlyDigits(c.nationalId).includes(qDigits) ||
      onlyDigits(c.phone).includes(qDigits) ||
      !!addrHit
    );
  });

  // ---------- Create (เชื่อมกับ backend) ----------
  const handleCreateCustomer = async () => {
    if (creating) return;

    const name = newCustomer.name.trim();
    const nat = onlyDigits(newCustomer.nationalId).slice(0, 13);
    const rawPhone = onlyDigits(newCustomer.phone);
    const phone = rawPhone.startsWith("66") ? rawPhone.slice(0, 11) : rawPhone.slice(0, 10);
    const addr = newCustomer.address;

    if (!name || !nat || !phone) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ-บัตรประชาชน-เบอร์โทร)");
      return;
    }
    // ถ้าจะใช้ตรวจ checksum จริง ให้ใช้ isValidThaiID(nat) เพิ่มได้
    if (nat.length !== 13 /* || !isValidThaiID(nat) */) {
      toast.error("เลขบัตรประชาชนไม่ถูกต้อง");
      return;
    }
    if (!isValidThaiMobile(phone)) {
      toast.error("เบอร์โทรศัพท์ไม่ถูกต้อง");
      return;
    }

    // เช็กวันเกิดจาก dobISO
    if (!dobISO) {
      toast.error("กรุณาเลือกวันเกิด");
      return;
    }
    const dobDate = new Date(dobISO);
    const today = new Date(TODAY);
    if (isNaN(dobDate.getTime()) || dobDate > today) {
      toast.error("วันเกิดต้องไม่เป็นวันที่ในอนาคต");
      return;
    }

    // ที่อยู่จำเป็น
    if (!addr.tambon || !addr.amphoe || !addr.province || !addr.postalCode) {
      toast.error("กรุณากรอก ตำบล/อำเภอ/จังหวัด/รหัสไปรษณีย์ ให้ครบ");
      return;
    }
    if (!isValidPostalCode(addr.postalCode)) {
      toast.error("รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก");
      return;
    }

    // กันซ้ำฝั่ง frontend ก่อน (จาก cache ของ component)
    const e164 = toE164(phone);
    const dup = customers.find(
      (c) => onlyDigits(c.nationalId) === nat || toE164(c.phone) === e164
    );
    if (dup) {
      toast.error("ลูกค้าคนนี้มีอยู่แล้วในระบบ (ตรวจจากรายการในหน้านี้)");
      return;
    }

    // เตรียม payload ให้ตรงกับ backend
    const payload = {
      name,
      nationalId: nat,
      phone,
      dateOfBirthISO: dobISO,
      address: {
        houseNo: addr.houseNo?.trim() || undefined,
        street: addr.street?.trim() || undefined,
        tambon: addr.tambon.trim(),
        amphoe: addr.amphoe.trim(),
        province: addr.province.trim(),
        postalCode: onlyDigits(addr.postalCode).slice(0, 5),
        note: addr.note?.trim() || undefined,
      },
    };

    try {
      setCreating(true);

      const resp = await fetch(`${API_BASE_URL}/api/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json().catch(() => ({} as any));

      if (!resp.ok) {
        if (resp.status === 409) {
          toast.error("ลูกค้าคนนี้มีอยู่แล้วในฐานข้อมูล (ซ้ำจากบัตรประชาชนหรือเบอร์โทร)");
        } else if (resp.status === 400) {
          toast.error("ข้อมูลไม่ถูกต้อง โปรดตรวจสอบอีกครั้ง");
        } else {
          toast.error("บันทึกข้อมูลลูกค้าไม่สำเร็จ");
        }
        return;
      }

      // backend ส่ง { item: { id, name, nationalId, phone, dateOfBirthISO, address:{raw} } }
      const saved = data.item || {};

      const customer: Customer = {
        id: String(saved.id ?? ""),
        name: String(saved.name ?? name),
        nationalId: String(saved.nationalId ?? nat),
        phone: String(saved.phone ?? phone),
        dateOfBirthISO: saved.dateOfBirthISO ?? dobISO,
        address: {
          houseNo: addr.houseNo?.trim() || "",
          street: addr.street?.trim() || "",
          tambon: addr.tambon.trim(),
          amphoe: addr.amphoe.trim(),
          province: addr.province.trim(),
          postalCode: onlyDigits(addr.postalCode).slice(0, 5),
          note: addr.note?.trim() || "",
          raw: saved.address?.raw ?? undefined,
        },
      };

      // อัปเดต cache ฝั่ง frontend
      setCustomers((prev) => [customer, ...prev]);

      // เลือกลูกค้าคนนี้ส่งให้ parent
      onSelect(customer);
      setIsOpen(false);

      // reset form
      setNewCustomer({
        name: "",
        nationalId: "",
        phone: "",
        address: {
          houseNo: "",
          street: "",
          tambon: "",
          amphoe: "",
          province: "",
          postalCode: "",
          note: "",
        },
      });
      setDobISO("");

      toast.success("เพิ่มข้อมูลลูกค้าสำเร็จ");
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search + Create */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาด้วยชื่อ, เลขบัตร, เบอร์โทร, ที่อยู่ หรือรหัสไปรษณีย์"
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

          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>เพิ่มข้อมูลลูกค้าใหม่</DialogTitle>
              <DialogDescription>กรอกข้อมูลลูกค้าให้ครบถ้วน</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              {/* ชื่อ */}
              <div className="md:col-span-2">
                <Label htmlFor="name">
                  ชื่อ-นามสกุล <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="สมชาย ใจดี"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                />
              </div>

              {/* บัตร ปชช. */}
              <div>
                <Label htmlFor="nationalId">
                  เลขบัตรประชาชน <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nationalId"
                  inputMode="numeric"
                  placeholder="1-2345-67890-12-3"
                  value={formatNationalId(newCustomer.nationalId)}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      nationalId: onlyDigits(e.target.value),
                    })
                  }
                  maxLength={17}
                />
                <p className="text-xs text-muted-foreground mt-1">13 หลัก</p>
              </div>

              {/* เบอร์โทร */}
              <div>
                <Label htmlFor="phone">
                  เบอร์โทรศัพท์ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  inputMode="tel"
                  placeholder="081-234-5678 หรือ +66 8 1234 5678"
                  value={formatPhone(newCustomer.phone)}
                  onChange={(e) => {
                    const d = onlyDigits(e.target.value);
                    const limited = d.startsWith("66") ? d.slice(0, 11) : d.slice(0, 10);
                    setNewCustomer({ ...newCustomer, phone: limited });
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  10 หลัก (ขึ้นต้น 06/08/09) หรือ +66 ตามมาตรฐาน
                </p>
              </div>

              {/* วันเกิด (native date input) */}
              <div>
                <Label htmlFor="dob">
                  วันเกิด <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={dobISO}
                  onChange={(e) => setDobISO(e.target.value)}
                  max={TODAY}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  สามารถพิมพ์เป็นปี-เดือน-วันได้โดยตรง เช่น 1998-07-15
                </p>
              </div>

              {/* ที่อยู่ */}
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="houseNo">บ้านเลขที่</Label>
                    <Input
                      id="houseNo"
                      placeholder="99/9"
                      value={newCustomer.address.houseNo}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          address: { ...newCustomer.address, houseNo: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="street">ถนน</Label>
                    <Input
                      id="street"
                      placeholder="พหลโยธิน"
                      value={newCustomer.address.street}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          address: { ...newCustomer.address, street: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="tambon">
                      ตำบล/แขวง <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="tambon"
                      placeholder="สุเทพ"
                      value={newCustomer.address.tambon}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          address: { ...newCustomer.address, tambon: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="amphoe">
                      อำเภอ/เขต <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="amphoe"
                      placeholder="เมืองเชียงใหม่"
                      value={newCustomer.address.amphoe}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          address: { ...newCustomer.address, amphoe: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="province">
                      จังหวัด <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="province"
                      placeholder="เชียงใหม่"
                      value={newCustomer.address.province}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          address: { ...newCustomer.address, province: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="postalCode">
                      รหัสไปรษณีย์ <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="postalCode"
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="50000"
                      value={newCustomer.address.postalCode}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          address: {
                            ...newCustomer.address,
                            postalCode: onlyDigits(e.target.value).slice(0, 5),
                          },
                        })
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="note">หมายเหตุ (ถ้ามี)</Label>
                    <Input
                      id="note"
                      placeholder="เช่น ใกล้ตลาด/วัด/ปากซอย ..."
                      value={newCustomer.address.note}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          address: { ...newCustomer.address, note: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* ปุ่มบันทึก */}
              <div className="md:col-span-2">
                <Button
                  onClick={handleCreateCustomer}
                  className="w-full"
                  disabled={creating}
                >
                  {creating ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Result (ใช้ผลจาก backend) */}
      {searchQuery && (
        <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">กำลังค้นหา...</div>
          ) : errorMsg ? (
            <div className="p-4 text-center text-destructive">{errorMsg}</div>
          ) : serverCustomers.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">ไม่พบข้อมูลลูกค้า</div>
          ) : (
            serverCustomers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => {
                  onSelect(customer);
                  setSearchQuery("");
                  toast.success(`เลือกลูกค้า: ${customer.name}`);
                }}
                className="w-full p-3 text-left hover:bg-muted transition-colors"
              >
                <p className="font-medium">{customer.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatNationalId(customer.nationalId)} | {formatPhone(customer.phone)}
                </p>
                {customer.address && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatAddressLine(customer.address)}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* Selected */}
      {selectedCustomer && (
        <div className="p-4 bg-card rounded-lg border space-y-1">
          <p className="text-sm text-muted-foreground">ลูกค้าที่เลือก</p>
          <p className="font-semibold">{selectedCustomer.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatNationalId(selectedCustomer.nationalId)}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatPhone(selectedCustomer.phone)}
          </p>
          {selectedCustomer.dateOfBirthISO && (
            <p className="text-sm text-muted-foreground">
              วันเกิด:{" "}
              {new Date(selectedCustomer.dateOfBirthISO).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
          {selectedCustomer.address && (
            <>
              <p className="text-sm text-muted-foreground">
                ที่อยู่: {formatAddressLine(selectedCustomer.address)}
              </p>
              {selectedCustomer.address.note && (
                <p className="text-xs text-muted-foreground">
                  หมายเหตุ: {selectedCustomer.address.note}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
