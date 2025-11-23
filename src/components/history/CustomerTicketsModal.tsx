// src/components/history/CustomerTicketsModal.tsx
import { useEffect, useState, FormEvent } from "react";
import { CustomerListItem } from "@/pages/History";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const API_BASE = "http://localhost:3001";

export type ContractStatus = "ACTIVE" | "ROLLED_OVER" | "CANCELLED" | "EXPIRED";
export type KycStatus = "PENDING" | "PASSED" | "FAILED" | "REJECTED";

// structure ตาม /api/customers/:id/tickets
export interface TicketSummary {
  ticket_ID: number | string;
  first_name: string;
  last_name: string;
  customer_ID: number | string;
  contract_date: string;
  loan_amount: number;
  interest_rate: number;
  due_date: string | null;
  notice_date: string | null;
  contract_status: ContractStatus;
  staff_ID: number | string;
  item_ID: number | string;
}

interface CustomerTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerListItem | null;
  tickets: TicketSummary[];
  loading: boolean;
  error: string | null;
  onSelectTicket: (ticket: TicketSummary) => void;
  getStatusColor: (status: string) => string;
}

export default function CustomerTicketsModal({
  isOpen,
  onClose,
  customer,
  tickets,
  loading,
  error,
  onSelectTicket,
  getStatusColor,
}: CustomerTicketsModalProps) {
  // ----- state สำหรับฟอร์มแก้ไขลูกค้า -----
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<string>("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [kycStatus, setKycStatus] = useState<KycStatus>("PENDING");

  // โหลดข้อมูลลูกค้าเมื่อเปิดฟอร์มแก้ไข
  useEffect(() => {
    if (!isEditOpen || !customer) return;

    const controller = new AbortController();

    async function fetchCustomerDetail() {
      try {
        setEditLoading(true);
        setEditError(null);

        const res = await fetch(
          `${API_BASE}/api/customers/${customer.id}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          console.error(
            "โหลดข้อมูลลูกค้าไม่สำเร็จ:",
            "status =",
            res.status,
            "body =",
            data
          );
          setEditError("โหลดข้อมูลลูกค้าไม่สำเร็จ");
          return;
        }

        const data = await res.json();

        setFirstName(data.first_name ?? "");
        setLastName(data.last_name ?? "");
        setNationalId(String(data.national_ID ?? ""));
        setDateOfBirth(data.date_of_birth ?? "");
        setAddress(data.address ?? "");
        setPhoneNumber(String(data.phone_number ?? ""));
        setKycStatus((data.kyc_status as KycStatus) || "PENDING");
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Error fetching customer detail:", err);
        setEditError("เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า");
      } finally {
        setEditLoading(false);
      }
    }

    fetchCustomerDetail();

    return () => {
      controller.abort();
    };
  }, [isEditOpen, customer]);

  const handleSaveCustomer = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!customer) return;

    // ---- validation เบื้องต้น ----
    const fn = firstName.trim();
    const ln = lastName.trim();
    const natDigits = nationalId.replace(/\D/g, "");
    const phoneDigits = phoneNumber.replace(/\D/g, "");
    const addr = address.trim();
    const dob = dateOfBirth || null;

    if (!fn || !ln) {
      setEditError("กรุณากรอกชื่อและนามสกุล");
      return;
    }
    if (natDigits.length !== 13) {
      setEditError("เลขบัตรประชาชนต้องมี 13 หลัก");
      return;
    }
    if (!addr) {
      setEditError("กรุณากรอกที่อยู่");
      return;
    }
    if (!phoneDigits) {
      setEditError("กรุณากรอกเบอร์โทรศัพท์");
      return;
    }
    if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      setEditError("รูปแบบวันเกิดไม่ถูกต้อง (ควรเป็น YYYY-MM-DD)");
      return;
    }

    // ตรวจไม่ให้วันเกิดเกินวันนี้
    if (dob) {
      const today = new Date().toISOString().slice(0, 10);
      if (dob > today) {
        setEditError("วันเกิดต้องไม่เกินวันที่ปัจจุบัน");
        return;
      }
    }

    setEditSaving(true);
    setEditError(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/customers/${customer.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: fn,
            last_name: ln,
            national_ID: natDigits,
            date_of_birth: dob,
            address: addr,
            phone_number: phoneDigits,
            kyc_status: kycStatus,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.error(
          "อัปเดตข้อมูลลูกค้าไม่สำเร็จ:",
          "status =",
          res.status,
          "body =",
          data
        );
        setEditError("อัปเดตข้อมูลลูกค้าไม่สำเร็จ");
        return;
      }

      toast.success("อัปเดตข้อมูลลูกค้าสำเร็จ");
      setIsEditOpen(false);
    } catch (err) {
      console.error("Error updating customer:", err);
      setEditError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setEditSaving(false);
    }
  };

  if (!isOpen) return null;

  // ฟังก์ชันลบตั๋วทั้งหมด
  const handleDeleteAllTickets = async () => {
    if (!customer) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/customers/${customer.id}/tickets`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.error(
          "ลบทุกตั๋วไม่สำเร็จ:",
          "status =",
          res.status,
          "body =",
          data
        );
        alert("ลบทุกตั๋วของลูกค้าคนนี้ไม่สำเร็จ กรุณาลองอีกครั้ง");
        return;
      }

      const data = await res.json().catch(() => null);
      console.log("ลบทุกตั๋วสำเร็จ:", data);

      onClose(); // ปิด modal หลังลบเสร็จ
    } catch (err) {
      console.error("เกิดข้อผิดพลาดขณะลบทุกตั๋ว:", err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-xl font-bold"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-blue-700 mb-2">
          Tickets ของลูกค้า
        </h2>

        {customer && (
          <>
            <div className="flex items-center justify-between mb-4 gap-3">
              <p className="text-sm text-gray-600">
                {customer.name}{" "}
                <span className="text-xs text-gray-400">
                  (ID: {customer.id})
                </span>
              </p>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditError(null);
                  setIsEditOpen(true);
                }}
              >
                แก้ไขข้อมูลลูกค้า
              </Button>
            </div>

            {/* Dialog แก้ไขข้อมูลลูกค้า */}
            <Dialog
              open={isEditOpen}
              onOpenChange={(open) => {
                setIsEditOpen(open);
                if (!open) setEditError(null);
              }}
            >
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>แก้ไขข้อมูลลูกค้า</DialogTitle>
                </DialogHeader>

                {editLoading ? (
                  <p className="text-sm text-muted-foreground">
                    กำลังโหลดข้อมูลลูกค้า...
                  </p>
                ) : (
                  <form
                    onSubmit={handleSaveCustomer}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">ชื่อ</Label>
                        <Input
                          id="first_name"
                          value={firstName}
                          onChange={(e) =>
                            setFirstName(e.target.value)
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">นามสกุล</Label>
                        <Input
                          id="last_name"
                          value={lastName}
                          onChange={(e) =>
                            setLastName(e.target.value)
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="national_ID">
                          เลขบัตรประชาชน (13 หลัก)
                        </Label>
                        <Input
                          id="national_ID"
                          inputMode="numeric"
                          maxLength={13}
                          value={nationalId}
                          onChange={(e) =>
                            setNationalId(e.target.value)
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="date_of_birth">
                          วันเดือนปีเกิด
                        </Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={dateOfBirth || ""}
                          onChange={(e) =>
                            setDateOfBirth(e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">ที่อยู่</Label>
                      <Textarea
                        id="address"
                        rows={3}
                        value={address}
                        onChange={(e) =>
                          setAddress(e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone_number">
                          เบอร์โทรศัพท์
                        </Label>
                        <Input
                          id="phone_number"
                          inputMode="tel"
                          value={phoneNumber}
                          onChange={(e) =>
                            setPhoneNumber(e.target.value)
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="kyc_status">
                          สถานะ KYC
                        </Label>
                        <Select
                          value={kycStatus}
                          onValueChange={(v) =>
                            setKycStatus(v as KycStatus)
                          }
                        >
                          <SelectTrigger id="kyc_status">
                            <SelectValue placeholder="เลือกสถานะ KYC" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">
                              PENDING (รอตรวจสอบ)
                            </SelectItem>
                            <SelectItem value="PASSED">
                              PASSED (ผ่าน)
                            </SelectItem>
                            <SelectItem value="FAILED">
                              FAILED (ไม่ผ่าน)
                            </SelectItem>
                            <SelectItem value="REJECTED">
                              REJECTED (ถูกปฏิเสธ)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {editError && (
                      <p className="text-sm text-red-600">
                        {editError}
                      </p>
                    )}

                    <DialogFooter className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditOpen(false)}
                      >
                        ยกเลิก
                      </Button>
                      <Button type="submit" disabled={editSaving}>
                        {editSaving
                          ? "กำลังบันทึก..."
                          : "บันทึกการเปลี่ยนแปลง"}
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </>
        )}

        {loading && (
          <p className="text-gray-500 text-sm mb-4">
            กำลังโหลดข้อมูลตั๋ว...
          </p>
        )}

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        {!loading && !error && tickets.length === 0 && (
          <p className="text-gray-500 text-sm mb-4">
            ยังไม่มีตั๋วสำหรับลูกค้าคนนี้
          </p>
        )}

        {!loading && tickets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.map((t) => (
              <button
                key={t.ticket_ID}
                className="text-left p-4 border rounded-lg shadow hover:shadow-md cursor-pointer transition bg-white"
                onClick={() => onSelectTicket(t)}
              >
                <p className="text-blue-600 font-semibold mb-1">
                  Ticket ID: {t.ticket_ID}
                </p>
                <p className="text-sm text-gray-700">
                  Loan:{" "}
                  <span className="font-semibold">
                    ฿{t.loan_amount.toLocaleString("th-TH")}
                  </span>
                </p>
                <p className="text-sm text-gray-700">
                  Interest: {t.interest_rate}%
                </p>
                <p className="text-sm text-gray-700">
                  Due:{" "}
                  {t.due_date
                    ? new Date(
                        t.due_date
                      ).toLocaleDateString("th-TH")
                    : "-"}
                </p>
                <p className="text-sm mt-1">
                  Status:{" "}
                  <span
                    className={getStatusColor(t.contract_status)}
                  >
                    {t.contract_status}
                  </span>
                </p>
              </button>
            ))}
          </div>
        )}

        {/* ปุ่มลบทั้งหมด */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 mt-4">
              ลบตั๋วทั้งหมด
            </button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                ยืนยันการลบตั๋วจำนำทั้งหมดของลูกค้าคนนี้
              </AlertDialogTitle>
            </AlertDialogHeader>

            <p className="text-sm text-muted-foreground mt-2">
              คุณต้องการลบ{" "}
              <span className="font-semibold">
                ตั๋วจำนำทั้งหมด {tickets.length ?? 0} ใบ
              </span>{" "}
              ของลูกค้าคนนี้หรือไม่?
              <br />
              การลบนี้จะลบข้อมูลการชำระเงิน (Payment)
              ของตั๋วเหล่านี้ทั้งหมดด้วย และไม่สามารถกู้คืนได้
            </p>

            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={handleDeleteAllTickets}
              >
                ยืนยันการลบทั้งหมด
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="mt-5 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            ปิด
          </Button>
        </div>
      </div>
    </div>
  );
}
