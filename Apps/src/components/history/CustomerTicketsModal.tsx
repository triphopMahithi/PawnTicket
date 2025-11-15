// src/components/history/CustomerTicketsModal.tsx
import { CustomerListItem } from "@/pages/History";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export type ContractStatus = "ACTIVE" | "ROLLED_OVER" | "CANCELLED" | "EXPIRED";

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
//  customer: CustomerListItem | null;
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
  if (!isOpen) return null;

    // ฟังก์ชันลบตั๋วทั้งหมด
const handleDeleteAllTickets = async () => {
  if (!customer) return;

  try {
    // ส่งคำขอลบทุกตั๋วของลูกค้าคนนี้ไปยัง API
    const res = await fetch(`http://localhost:3001/api/customers/${customer.id}/tickets`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      console.error("ลบทุกตั๋วไม่สำเร็จ:", "status =", res.status, "body =", data);
      alert("ลบทุกตั๋วของลูกค้าคนนี้ไม่สำเร็จ กรุณาลองอีกครั้ง");
      return;
    }

    const data = await res.json().catch(() => null);
    console.log("ลบทุกตั๋วสำเร็จ:", data);

    // ลบตั๋วทั้งหมดจาก state
    onClose();  // ปิด modal หลังลบเสร็จ
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
          <p className="text-sm text-gray-600 mb-4">
            {customer.name}{" "}
            <span className="text-xs text-gray-400"> (ID: {customer.id})</span>
          </p>
        )}

        {loading && <p className="text-gray-500 text-sm mb-4">กำลังโหลดข้อมูลตั๋ว...</p>}

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        {!loading && !error && tickets.length === 0 && (
          <p className="text-gray-500 text-sm mb-4">ยังไม่มีตั๋วสำหรับลูกค้าคนนี้</p>
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
                <p className="text-sm text-gray-700">Interest: {t.interest_rate}%</p>
                <p className="text-sm text-gray-700">
                  Due: {t.due_date ? new Date(t.due_date).toLocaleDateString("th-TH") : "-"}
                </p>
                <p className="text-sm mt-1">
                  Status:{" "}
                  <span className={getStatusColor(t.contract_status)}>
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
              ของลูกค้าคนนี้หรือไม่?<br />
              การลบนี้จะลบข้อมูลการชำระเงิน (Payment) ของตั๋วเหล่านี้ทั้งหมดด้วย
              และไม่สามารถกู้คืนได้
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