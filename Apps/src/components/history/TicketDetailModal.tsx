// src/components/history/TicketDetailModal.tsx
import { Button } from "@/components/ui/button";
import type { TicketSummary } from "./CustomerTicketsModal";
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

// โครง response ตาม /api/pawn-tickets/:ticketId/detail
export interface TicketDetailResponse {
  ticket: {
    ticket_ID: number | string;
    contract_date: string;
    loan_amount: number;
    interest_rate: number;
    due_date: string | null;
    notice_date: string | null;
    contract_status: string;
    customer_ID: number | string;
    staff_ID: number | string;
    item_ID: number | string;
  };
  customer: {
    customer_ID: number | string;
    first_name: string;
    last_name: string;
    national_ID: string;
    date_of_birth: string | null;
    address: string | null;
    phone_number: string | null;
    kyc_status: string;
  };
  pawnItem: {
    item_ID: number | string;
    item_Type: string;
    description: string;
    appraised_value: number;
    item_status: string;
  };
  appraiser: {
    Staff_ID: number | string;
    first_name: string;
    last_name: string;
    phone_number: string;
    position: string;
  } | null;
  appraisal: {
    appraisal_ID: number | string;
    appraised_value: number;
    appraisal_Date: string;
    Staff_ID: number | string;
  } | null;
  payments: {
    payment_ID: number | string;
    ticket_ID: number | string;
    payment_date: string;
    amount_paid: number;
    payment_type: string;
  }[];
  disposition: {
    disposition_ID: number | string;
    item_ID: number | string;
    sale_date: string;
    sale_method: string;
    sale_price: number;
  } | null;
}

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: TicketSummary | null;
  detail: TicketDetailResponse | null;
  loading: boolean;
  error: string | null;
  onDeleted?: (ticketId: number | string) => void;

}

export default function TicketDetailModal({
  isOpen,
  onClose,
  ticket,
  detail,
  loading,
  error,
  onDeleted,
}: TicketDetailModalProps) {
  if (!isOpen) return null;

  const formatDateTime = (value?: string | null) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("th-TH");
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("th-TH");
  };
const handleDeleteTicket = async () => {
  if (!ticket) return;

  try {
    const res = await fetch(
      `http://localhost:3001/api/pawn-tickets/${ticket.ticket_ID}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      console.log("[LOG] ลบตั๋วสำเร็จ:ใบเดียว");
      // ถ้ามี onDeleted จาก parent ก็เรียกด้วย
      // onDeleted?.(ticket.ticket_ID);
      onClose();
    } else {
      const data = await res.json().catch(() => null);
      console.error(
        "ลบข้อมูลไม่สำเร็จ",
        "status =",
        res.status,
        "body =",
        data
      );
      alert("ลบตั๋วไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  } catch (err) {
    console.error("error ขณะลบตั๋ว:", err);
    alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
  }
};


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-xl font-bold"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-indigo-700 mb-2">
          รายละเอียดตั๋วจำนำ
        </h2>
        {ticket && (
          <p className="text-sm text-gray-600 mb-4">
            Ticket ID:{" "}
            <span className="font-semibold">{ticket.ticket_ID}</span>
          </p>
        )}

        {/* Loading / Error state */}
        {loading && (
          <p className="text-gray-500 text-sm mb-4">
            กำลังโหลดรายละเอียดตั๋ว...
          </p>
        )}

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        {/* แสดงรายละเอียดเมื่อโหลดเสร็จ */}
        {!loading && !error && detail && (
          <div className="space-y-6">
            {/* 1) รายละเอียดของตั๋ว */}
            <section className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                1. รายละเอียดของตั๋ว
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <p>
                  <span className="font-medium">Contract Date:</span>{" "}
                  {formatDateTime(detail.ticket.contract_date)}
                </p>
                <p>
                  <span className="font-medium">Loan Amount:</span>{" "}
                  ฿{detail.ticket.loan_amount.toLocaleString("th-TH")}
                </p>
                <p>
                  <span className="font-medium">Interest Rate:</span>{" "}
                  {detail.ticket.interest_rate}%
                </p>
                <p>
                  <span className="font-medium">Due Date:</span>{" "}
                  {formatDate(detail.ticket.due_date)}
                </p>
                <p>
                  <span className="font-medium">Notice Date:</span>{" "}
                  {formatDate(detail.ticket.notice_date)}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span className="font-semibold">
                    {detail.ticket.contract_status}
                  </span>
                </p>
              </div>
            </section>

            {/* 2) รายละเอียดทรัพย์ที่นำมาจำ */}
            <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-amber-900 mb-2">
                2. รายละเอียดทรัพย์ที่นำมาจำนำ
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <p>
                  <span className="font-medium">Item ID:</span>{" "}
                  {detail.pawnItem.item_ID}
                </p>
                <p>
                  <span className="font-medium">ประเภททรัพย์:</span>{" "}
                  {detail.pawnItem.item_Type}
                </p>
                <p className="sm:col-span-2">
                  <span className="font-medium">รายละเอียด:</span>{" "}
                  {detail.pawnItem.description}
                </p>
                <p>
                  <span className="font-medium">ประเมินมูลค่า:</span>{" "}
                  ฿{detail.pawnItem.appraised_value.toLocaleString("th-TH")}
                </p>
                <p>
                  <span className="font-medium">สถานะทรัพย์:</span>{" "}
                  {detail.pawnItem.item_status}
                </p>
              </div>
            </section>

            {/* 3) ข้อมูลลูกค้า + ผู้ประเมิน / Appraisal */}
            <section className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-emerald-900 mb-3">
                3. ข้อมูลลูกค้าและผู้ประเมิน
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {/* ลูกค้า */}
                <div>
                  <h4 className="font-semibold mb-1 text-emerald-800">
                    ลูกค้า
                  </h4>
                  <p>
                    <span className="font-medium">ชื่อ:</span>{" "}
                    {detail.customer.first_name} {detail.customer.last_name}
                  </p>
                  <p>
                    <span className="font-medium">เลขบัตร:</span>{" "}
                    {detail.customer.national_ID}
                  </p>
                  <p>
                    <span className="font-medium">วันเกิด:</span>{" "}
                    {formatDate(detail.customer.date_of_birth)}
                  </p>
                  <p>
                    <span className="font-medium">โทร:</span>{" "}
                    {detail.customer.phone_number || "-"}
                  </p>
                  <p>
                    <span className="font-medium">ที่อยู่:</span>{" "}
                    {detail.customer.address || "-"}
                  </p>
                  <p>
                    <span className="font-medium">KYC:</span>{" "}
                    {detail.customer.kyc_status}
                  </p>
                </div>

                {/* ผู้ประเมิน / Appraisal */}
                <div>
                  <h4 className="font-semibold mb-1 text-emerald-800">
                    ผู้ประเมิน / การประเมิน
                  </h4>
                  {detail.appraiser ? (
                    <>
                      <p>
                        <span className="font-medium">Staff ID:</span>{" "}
                        {detail.appraiser.Staff_ID}
                      </p>
                      <p>
                        <span className="font-medium">ชื่อ:</span>{" "}
                        {detail.appraiser.first_name}{" "}
                        {detail.appraiser.last_name}
                      </p>
                      <p>
                        <span className="font-medium">ตำแหน่ง:</span>{" "}
                        {detail.appraiser.position}
                      </p>
                      <p>
                        <span className="font-medium">โทร:</span>{" "}
                        {detail.appraiser.phone_number}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      ไม่มีข้อมูลผู้ประเมิน
                    </p>
                  )}

                  <div className="mt-2">
                    <h5 className="font-semibold text-emerald-800">
                      ข้อมูลการประเมิน
                    </h5>
                    {detail.appraisal ? (
                      <>
                        <p>
                          <span className="font-medium">Appraisal ID:</span>{" "}
                          {detail.appraisal.appraisal_ID}
                        </p>
                        <p>
                          <span className="font-medium">
                            มูลค่าที่ประเมิน:
                          </span>{" "}
                          ฿
                          {detail.appraisal.appraised_value.toLocaleString(
                            "th-TH"
                          )}
                        </p>
                        <p>
                          <span className="font-medium">วันที่ประเมิน:</span>{" "}
                          {formatDateTime(detail.appraisal.appraisal_Date)}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        ยังไม่มีข้อมูลการประเมิน
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 4) ข้อมูลการจ่ายเงิน */}
            <section className="bg-sky-50 border border-sky-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-sky-900 mb-2">
                4. ข้อมูลการจ่ายเงิน
              </h3>
              {detail.payments.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  ยังไม่มีประวัติการจ่ายเงิน
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-sky-100">
                        <th className="border px-2 py-1 text-left">วันที่</th>
                        <th className="border px-2 py-1 text-right">
                          จำนวนเงิน
                        </th>
                        <th className="border px-2 py-1 text-left">
                          วิธีการจ่าย
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.payments.map((p) => (
                        <tr key={p.payment_ID}>
                          <td className="border px-2 py-1">
                            {formatDateTime(p.payment_date)}
                          </td>
                          <td className="border px-2 py-1 text-right">
                            ฿{p.amount_paid.toLocaleString("th-TH")}
                          </td>
                          <td className="border px-2 py-1">
                            {p.payment_type}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* 5) ข้อมูลการหลุดจำนำ */}
            <section className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-rose-900 mb-2">
                5. ข้อมูลการหลุดจำนำ / จำหน่ายทรัพย์
              </h3>
              {detail.disposition ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <p>
                    <span className="font-medium">Disposition ID:</span>{" "}
                    {detail.disposition.disposition_ID}
                  </p>
                  <p>
                    <span className="font-medium">Item ID:</span>{" "}
                    {detail.disposition.item_ID}
                  </p>
                  <p>
                    <span className="font-medium">วันที่ขาย:</span>{" "}
                    {formatDate(detail.disposition.sale_date)}
                  </p>
                  <p>
                    <span className="font-medium">วิธีการขาย:</span>{" "}
                    {detail.disposition.sale_method}
                  </p>
                  <p>
                    <span className="font-medium">ราคาขาย:</span>{" "}
                    ฿
                    {detail.disposition.sale_price.toLocaleString("th-TH")}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  ยังไม่มีข้อมูลการหลุดจำนำหรือขายทรัพย์
                </p>
              )}
            </section>
            <AlertDialog>
  <AlertDialogTrigger asChild>
    <Button
      className="mt-4"
      variant="destructive"
    >
      ลบตั๋วจำนำ
    </Button>
  </AlertDialogTrigger>

  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>ยืนยันการลบตั๋วจำนำ</AlertDialogTitle>
    </AlertDialogHeader>

    <p className="text-sm text-muted-foreground mt-2">
      คุณแน่ใจหรือไม่ว่าต้องการลบตั๋วเลขที่{" "}
      <span className="font-semibold">{ticket?.ticket_ID}</span>?<br />
      การลบนี้จะลบข้อมูลการชำระเงิน (Payment) ที่เกี่ยวข้องทั้งหมดด้วย
      และไม่สามารถกู้คืนได้
    </p>

    <AlertDialogFooter className="mt-4">
      <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
      <AlertDialogAction
        className="bg-red-600 text-white hover:bg-red-700"
        onClick={handleDeleteTicket}
      >
        ยืนยันการลบ
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

          </div>
          
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            ปิด
          </Button>
        </div>
      </div>
    </div>
  );
}
