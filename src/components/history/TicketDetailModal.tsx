// src/components/history/TicketDetailModal.tsx
import { useState, useEffect } from "react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// โครง response ตาม /api/pawn-tickets/:ticketId/detail
export interface TicketDetailResponse {
  ticket: {
    ticket_ID: number | string;
    contract_date: string;
    Loan_Amount: number;
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
  onRefresh?: () => void; // ใช้ให้ parent reload detail หลังอัปเดต
}

export default function TicketDetailModal({
  isOpen,
  onClose,
  ticket,
  detail,
  loading,
  error,
  onDeleted,
  onRefresh,
}: TicketDetailModalProps) {
  // ---- local state สำหรับเก็บรายละเอียดปัจจุบันใน modal ----
  const [localDetail, setLocalDetail] = useState<TicketDetailResponse | null>(
    detail
  );

  useEffect(() => {
    setLocalDetail(detail);
  }, [detail]);

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

  // ใช้เตรียมค่าใส่ใน input type="datetime-local" (รูป YYYY-MM-DDTHH:mm)
  const toLocalDateTimeInput = (value?: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // แปลงค่าจาก datetime-local (YYYY-MM-DDTHH:mm) → MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
  const toMySQLDateTime = (value: string) => {
    if (!value) return value;
    if (value.includes("T")) {
      const [datePart, timePartRaw] = value.split("T");
      const timePartClean = (timePartRaw || "").replace("Z", "");
      let t = timePartClean;
      if (t.length === 5) {
        // HH:mm → HH:mm:00
        t = `${t}:00`;
      } else if (t.length === 0) {
        t = "00:00:00";
      }
      return `${datePart} ${t}`;
    }
    return value;
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
        onDeleted?.(ticket.ticket_ID);
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

  // === Section 1: state + handler สำหรับแก้ไขรายละเอียดตั๋ว ===
  const [isTicketEditOpen, setIsTicketEditOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    Loan_Amount: "",
    interest_rate: "",
    due_date: "",
    notice_date: "",
    contract_status: "",
  });

  const openTicketEdit = () => {
    if (!localDetail) return;

    setTicketForm({
      Loan_Amount: String(localDetail.ticket.loan_amount ?? ""),
      interest_rate: String(localDetail.ticket.interest_rate ?? ""),
      due_date: toLocalDateTimeInput(localDetail.ticket.due_date),
      notice_date: toLocalDateTimeInput(localDetail.ticket.notice_date),
      contract_status: localDetail.ticket.contract_status ?? "",
    });

    setIsTicketEditOpen(true);
  };

  const handleSaveTicketEdit = async () => {
    if (!localDetail) return;

    if (
      ticketForm.Loan_Amount.trim() !== "" &&
      Number.isNaN(Number(ticketForm.Loan_Amount))
    ) {
      toast.error("วงเงินกู้ต้องเป็นตัวเลข");
      return;
    }

    if (
      ticketForm.interest_rate.trim() !== "" &&
      Number.isNaN(Number(ticketForm.interest_rate))
    ) {
      toast.error("ดอกเบี้ยต้องเป็นตัวเลข");
      return;
    }

    const payload: Record<string, unknown> = {};

    if (ticketForm.Loan_Amount.trim() !== "") {
      payload.Loan_Amount = Number(ticketForm.Loan_Amount);
    }
    if (ticketForm.interest_rate.trim() !== "") {
      payload.interest_rate = Number(ticketForm.interest_rate);
    }
    if (ticketForm.due_date.trim() !== "") {
      payload.due_date = toMySQLDateTime(ticketForm.due_date.trim());
    }
    if (ticketForm.notice_date.trim() !== "") {
      payload.notice_date = toMySQLDateTime(ticketForm.notice_date.trim());
    }
    if (ticketForm.contract_status.trim() !== "") {
      payload.contract_status = ticketForm.contract_status.trim();
    }

    if (Object.keys(payload).length === 0) {
      toast.error("ยังไม่มีข้อมูลที่เปลี่ยนแปลงสำหรับตั๋วจำนำ");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3001/api/pawn-tickets/${localDetail.ticket.ticket_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.error("อัปเดตตั๋วไม่สำเร็จ", res.status, data);
        toast.error("อัปเดตรายละเอียดตั๋วไม่สำเร็จ");
        return;
      }

      setLocalDetail((prev) => {
        if (!prev) return prev;
        const nextTicket = { ...prev.ticket };

        if (payload.loan_amount !== undefined) {
          nextTicket.Loan_Amount = payload.loan_amount as number;
        }
        if (payload.interest_rate !== undefined) {
          nextTicket.interest_rate = payload.interest_rate as number;
        }
        if (payload.due_date !== undefined) {
          nextTicket.due_date = payload.due_date as string;
        }
        if (payload.notice_date !== undefined) {
          nextTicket.notice_date = payload.notice_date as string;
        }
        if (payload.contract_status !== undefined) {
          nextTicket.contract_status = payload.contract_status as string;
        }

        return { ...prev, ticket: nextTicket };
      });

      toast.success("อัปเดตรายละเอียดตั๋วเรียบร้อยแล้ว");
      setIsTicketEditOpen(false);
      onRefresh?.();
    } catch (err) {
      console.error("error ระหว่างอัปเดตตั๋ว:", err);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  // === Section 2: แก้ไขทรัพย์จำนำ ===
  const [isItemEditOpen, setIsItemEditOpen] = useState(false);
  const [itemForm, setItemForm] = useState({
    item_Type: "",
    description: "",
    appraised_value: "",
    item_status: "",
  });

  const openItemEdit = () => {
    if (!localDetail) return;
    setItemForm({
      item_Type: localDetail.pawnItem.item_Type ?? "",
      description: localDetail.pawnItem.description ?? "",
      appraised_value: String(localDetail.pawnItem.appraised_value ?? ""),
      item_status: localDetail.pawnItem.item_status ?? "",
    });
    setIsItemEditOpen(true);
  };

  const handleSaveItemEdit = async () => {
    if (!localDetail) return;

    if (
      itemForm.appraised_value.trim() !== "" &&
      Number.isNaN(Number(itemForm.appraised_value))
    ) {
      toast.error("มูลค่าประเมินต้องเป็นตัวเลข");
      return;
    }

    const payload: Record<string, unknown> = {};

    if (itemForm.item_Type.trim() !== "") {
      payload.item_Type = itemForm.item_Type.trim();
    }
    if (itemForm.description.trim() !== "") {
      payload.description = itemForm.description.trim();
    }
    if (itemForm.appraised_value.trim() !== "") {
      payload.appraised_value = Number(itemForm.appraised_value);
    }
    if (itemForm.item_status.trim() !== "") {
      payload.item_status = itemForm.item_status.trim();
    }

    if (Object.keys(payload).length === 0) {
      toast.error("ยังไม่มีข้อมูลที่เปลี่ยนแปลงสำหรับทรัพย์");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3001/api/pawn-items/${localDetail.pawnItem.item_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.error("อัปเดตทรัพย์ไม่สำเร็จ", res.status, data);
        toast.error("อัปเดตรายละเอียดทรัพย์ไม่สำเร็จ");
        return;
      }

      setLocalDetail((prev) => {
        if (!prev) return prev;
        const nextItem = { ...prev.pawnItem };
        if (payload.item_Type !== undefined) {
          nextItem.item_Type = payload.item_Type as string;
        }
        if (payload.description !== undefined) {
          nextItem.description = payload.description as string;
        }
        if (payload.appraised_value !== undefined) {
          nextItem.appraised_value = payload.appraised_value as number;
        }
        if (payload.item_status !== undefined) {
          nextItem.item_status = payload.item_status as string;
        }
        return { ...prev, pawnItem: nextItem };
      });

      toast.success("อัปเดตรายละเอียดทรัพย์เรียบร้อยแล้ว");
      setIsItemEditOpen(false);
      onRefresh?.();
    } catch (err) {
      console.error("error ระหว่างอัปเดตทรัพย์:", err);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  // === Section 3: แก้ไขข้อมูลลูกค้า (ตอนนี้แก้เฉพาะฝั่งลูกค้า) ===
  const [isCustomerEditOpen, setIsCustomerEditOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    phone_number: "",
    address: "",
    kyc_status: "",
  });
    const [appraiserForm, setAppraiserForm] = useState({
    position: "",
    phone_number: "",
  });

    const openCustomerEdit = () => {
    if (!localDetail) return;

    setCustomerForm({
      phone_number: localDetail.customer.phone_number ?? "",
      address: localDetail.customer.address ?? "",
      kyc_status: localDetail.customer.kyc_status ?? "",
    });

    setAppraiserForm({
      position: localDetail.appraiser?.position ?? "",
      phone_number: localDetail.appraiser?.phone_number ?? "",
    });

    setIsCustomerEditOpen(true);
  };


    const handleSaveCustomerEdit = async () => {
    if (!localDetail) return;

    const customerPayload: Record<string, unknown> = {};
    const appraiserPayload: Record<string, unknown> = {};

    // --- ฝั่งลูกค้า ---
    if (customerForm.phone_number.trim() !== "") {
      customerPayload.phone_number = customerForm.phone_number.trim();
    }
    if (customerForm.address.trim() !== "") {
      customerPayload.address = customerForm.address.trim();
    }
    if (customerForm.kyc_status.trim() !== "") {
      customerPayload.kyc_status = customerForm.kyc_status.trim();
    }

    // --- ฝั่งผู้ประเมิน (ถ้ามี appraiser ใน detail) ---
    if (localDetail.appraiser) {
      if (appraiserForm.phone_number.trim() !== "") {
        appraiserPayload.phone_number = appraiserForm.phone_number.trim();
      }
      if (appraiserForm.position.trim() !== "") {
        appraiserPayload.position = appraiserForm.position.trim();
      }
    }

    if (
      Object.keys(customerPayload).length === 0 &&
      (!localDetail.appraiser || Object.keys(appraiserPayload).length === 0)
    ) {
      toast.error("ยังไม่มีข้อมูลที่เปลี่ยนแปลงสำหรับลูกค้า/ผู้ประเมิน");
      return;
    }

    try {
      // อัปเดตลูกค้า (ถ้ามีข้อมูลเปลี่ยน)
      if (Object.keys(customerPayload).length > 0) {
        const resCust = await fetch(
          `http://localhost:3001/api/customers/${localDetail.customer.customer_ID}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(customerPayload),
          }
        );

        if (!resCust.ok) {
          const data = await resCust.json().catch(() => null);
          console.error("อัปเดตลูกค้าไม่สำเร็จ", resCust.status, data);
          toast.error("อัปเดตข้อมูลลูกค้าไม่สำเร็จ");
          return;
        }
      }

      // อัปเดตผู้ประเมิน (ถ้ามี appraiser + มีข้อมูลเปลี่ยน)
      if (localDetail.appraiser && Object.keys(appraiserPayload).length > 0) {
        const resApp = await fetch(
          `http://localhost:3001/api/employees/${localDetail.appraiser.Staff_ID}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(appraiserPayload),
          }
        );

        if (!resApp.ok) {
          const data = await resApp.json().catch(() => null);
          console.error("อัปเดตผู้ประเมินไม่สำเร็จ", resApp.status, data);
          toast.error("อัปเดตข้อมูลผู้ประเมินไม่สำเร็จ");
          return;
        }
      }

      // อัปเดต state localDetail ทั้งลูกค้า + ผู้ประเมิน
      setLocalDetail((prev) => {
        if (!prev) return prev;

        const next = { ...prev };

        if (Object.keys(customerPayload).length > 0) {
          const nextCustomer = { ...next.customer };
          if (customerPayload.phone_number !== undefined) {
            nextCustomer.phone_number = customerPayload.phone_number as string;
          }
          if (customerPayload.address !== undefined) {
            nextCustomer.address = customerPayload.address as string;
          }
          if (customerPayload.kyc_status !== undefined) {
            nextCustomer.kyc_status = customerPayload.kyc_status as string;
          }
          next.customer = nextCustomer;
        }

        if (next.appraiser && Object.keys(appraiserPayload).length > 0) {
          const nextAppraiser = { ...next.appraiser };
          if (appraiserPayload.phone_number !== undefined) {
            nextAppraiser.phone_number = appraiserPayload.phone_number as string;
          }
          if (appraiserPayload.position !== undefined) {
            nextAppraiser.position = appraiserPayload.position as string;
          }
          next.appraiser = nextAppraiser;
        }

        return next;
      });

      toast.success("อัปเดตข้อมูลลูกค้า/ผู้ประเมินเรียบร้อยแล้ว");
      setIsCustomerEditOpen(false);
      onRefresh?.();
    } catch (err) {
      console.error("error ระหว่างอัปเดตลูกค้า/ผู้ประเมิน:", err);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };


  // === Section 4: แก้ไขข้อมูลการจ่ายเงิน ===
  const [isPaymentEditOpen, setIsPaymentEditOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payment_ID: "",
    payment_date: "",
    amount_paid: "",
    payment_type: "",
  });

  const openPaymentEdit = () => {
    if (!localDetail || localDetail.payments.length === 0) {
      toast.error("ยังไม่มีข้อมูลการจ่ายเงินให้แก้ไข");
      return;
    }
    const last = localDetail.payments[localDetail.payments.length - 1];
    setPaymentForm({
      payment_ID: String(last.payment_ID),
      payment_date: toLocalDateTimeInput(last.payment_date),
      amount_paid: String(last.amount_paid ?? ""),
      payment_type: last.payment_type ?? "",
    });
    setIsPaymentEditOpen(true);
  };

  const handleChangePaymentSelection = (paymentId: string) => {
    if (!localDetail) return;
    const found = localDetail.payments.find(
      (p) => String(p.payment_ID) === paymentId
    );
    if (!found) return;
    setPaymentForm({
      payment_ID: String(found.payment_ID),
      payment_date: toLocalDateTimeInput(found.payment_date),
      amount_paid: String(found.amount_paid ?? ""),
      payment_type: found.payment_type ?? "",
    });
  };

  const handleSavePaymentEdit = async () => {
    if (!localDetail) return;

    if (
      paymentForm.amount_paid.trim() !== "" &&
      Number.isNaN(Number(paymentForm.amount_paid))
    ) {
      toast.error("จำนวนเงินต้องเป็นตัวเลข");
      return;
    }

    const payload: Record<string, unknown> = {};

    if (paymentForm.payment_date.trim() !== "") {
      payload.payment_date = toMySQLDateTime(paymentForm.payment_date.trim());
    }
    if (paymentForm.amount_paid.trim() !== "") {
      payload.amount_paid = Number(paymentForm.amount_paid);
    }
    if (paymentForm.payment_type.trim() !== "") {
      payload.payment_type = paymentForm.payment_type.trim();
    }

    if (Object.keys(payload).length === 0) {
      toast.error("ยังไม่มีข้อมูลที่เปลี่ยนแปลงสำหรับการจ่ายเงิน");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3001/api/payments/${paymentForm.payment_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.error("อัปเดตการจ่ายเงินไม่สำเร็จ", res.status, data);
        toast.error("อัปเดตข้อมูลการจ่ายเงินไม่สำเร็จ");
        return;
      }

      setLocalDetail((prev) => {
        if (!prev) return prev;
        const nextPayments = prev.payments.map((p) => {
          if (String(p.payment_ID) !== paymentForm.payment_ID) return p;
          const next = { ...p };
          if (payload.payment_date !== undefined) {
            next.payment_date = payload.payment_date as string;
          }
          if (payload.amount_paid !== undefined) {
            next.amount_paid = payload.amount_paid as number;
          }
          if (payload.payment_type !== undefined) {
            next.payment_type = payload.payment_type as string;
          }
          return next;
        });
        return { ...prev, payments: nextPayments };
      });

      toast.success("อัปเดตข้อมูลการจ่ายเงินเรียบร้อยแล้ว");
      setIsPaymentEditOpen(false);
      onRefresh?.();
    } catch (err) {
      console.error("error ระหว่างอัปเดตการจ่ายเงิน:", err);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  // === Section 5: แก้ไขข้อมูลการหลุดจำนำ ===
  const [isDispositionEditOpen, setIsDispositionEditOpen] = useState(false);
  const [dispositionForm, setDispositionForm] = useState({
    sale_date: "",
    sale_method: "",
    sale_price: "",
  });

  const openDispositionEdit = () => {
    if (!localDetail || !localDetail.disposition) {
      toast.error("ยังไม่มีข้อมูลการหลุดจำนำให้แก้ไข");
      return;
    }
    setDispositionForm({
      sale_date: toLocalDateTimeInput(localDetail.disposition.sale_date),
      sale_method: localDetail.disposition.sale_method ?? "",
      sale_price: String(localDetail.disposition.sale_price ?? ""),
    });
    setIsDispositionEditOpen(true);
  };

  const handleSaveDispositionEdit = async () => {
    if (!localDetail || !localDetail.disposition) return;

    if (
      dispositionForm.sale_price.trim() !== "" &&
      Number.isNaN(Number(dispositionForm.sale_price))
    ) {
      toast.error("ราคาขายต้องเป็นตัวเลข");
      return;
    }

    const payload: Record<string, unknown> = {};

    if (dispositionForm.sale_date.trim() !== "") {
      payload.sale_date = toMySQLDateTime(dispositionForm.sale_date.trim());
    }
    if (dispositionForm.sale_method.trim() !== "") {
      payload.sale_method = dispositionForm.sale_method.trim();
    }
    if (dispositionForm.sale_price.trim() !== "") {
      payload.sale_price = Number(dispositionForm.sale_price);
    }

    if (Object.keys(payload).length === 0) {
      toast.error("ยังไม่มีข้อมูลที่เปลี่ยนแปลงสำหรับการหลุดจำนำ");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3001/api/dispositions/${localDetail.disposition.disposition_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.error("อัปเดตการหลุดจำนำไม่สำเร็จ", res.status, data);
        toast.error("อัปเดตข้อมูลการหลุดจำนำไม่สำเร็จ");
        return;
      }

      setLocalDetail((prev) => {
        if (!prev || !prev.disposition) return prev;
        const nextDisp = { ...prev.disposition };
        if (payload.sale_date !== undefined) {
          nextDisp.sale_date = payload.sale_date as string;
        }
        if (payload.sale_method !== undefined) {
          nextDisp.sale_method = payload.sale_method as string;
        }
        if (payload.sale_price !== undefined) {
          nextDisp.sale_price = payload.sale_price as number;
        }
        return { ...prev, disposition: nextDisp };
      });

      toast.success("อัปเดตข้อมูลการหลุดจำนำเรียบร้อยแล้ว");
      setIsDispositionEditOpen(false);
      onRefresh?.();
    } catch (err) {
      console.error("error ระหว่างอัปเดตการหลุดจำนำ:", err);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  // === ปุ่มแก้ไขแต่ละส่วน ===
  const handleEditTicketSection = () => {
    if (!localDetail) return;
    openTicketEdit();
  };

  const handleEditItemSection = () => {
    if (!localDetail) return;
    openItemEdit();
  };

  const handleEditCustomerAppraiserSection = () => {
    if (!localDetail) return;
    openCustomerEdit(); // ตอนนี้แก้เฉพาะข้อมูลลูกค้า
  };

  const handleEditPaymentsSection = () => {
    if (!localDetail) return;
    openPaymentEdit();
  };

  const handleEditDispositionSection = () => {
    if (!localDetail) return;
    openDispositionEdit();
  };

  // ห้าม early return ก่อน hooks ข้างบน ดังนั้นค่อยเช็ค isOpen ตรงนี้
  if (!isOpen) return null;

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
        {!loading && !error && localDetail && (
          <div className="space-y-6">
            {/* 1) รายละเอียดของตั๋ว */}
            <section className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-slate-800">
                  1. รายละเอียดของตั๋ว
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={handleEditTicketSection}
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  แก้ไข
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <p>
                  <span className="font-medium">Contract Date:</span>{" "}
                  {formatDateTime(localDetail.ticket.contract_date)}
                </p>
                <p>
                  <span className="font-medium">Loan Amount:</span>{" "}
                  ฿{localDetail.ticket.loan_amount.toLocaleString("th-TH")}
                </p>
                <p>
                  <span className="font-medium">Interest Rate:</span>{" "}
                  {localDetail.ticket.interest_rate}%
                </p>
                <p>
                  <span className="font-medium">Due Date:</span>{" "}
                  {formatDate(localDetail.ticket.due_date)}
                </p>
                <p>
                  <span className="font-medium">Notice Date:</span>{" "}
                  {formatDate(localDetail.ticket.notice_date)}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span className="font-semibold">
                    {localDetail.ticket.contract_status}
                  </span>
                </p>
              </div>
            </section>

            {/* 2) รายละเอียดทรัพย์ที่นำมาจำ */}
            <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-amber-900">
                  2. รายละเอียดทรัพย์ที่นำมาจำนำ
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={handleEditItemSection}
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  แก้ไข
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <p>
                  <span className="font-medium">Item ID:</span>{" "}
                  {localDetail.pawnItem.item_ID}
                </p>
                <p>
                  <span className="font-medium">ประเภททรัพย์:</span>{" "}
                  {localDetail.pawnItem.item_Type}
                </p>
                <p className="sm:col-span-2">
                  <span className="font-medium">รายละเอียด:</span>{" "}
                  {localDetail.pawnItem.description}
                </p>
                <p>
                  <span className="font-medium">ประเมินมูลค่า:</span>{" "}
                  ฿{localDetail.pawnItem.appraised_value.toLocaleString("th-TH")}
                </p>
                <p>
                  <span className="font-medium">สถานะทรัพย์:</span>{" "}
                  {localDetail.pawnItem.item_status}
                </p>
              </div>
            </section>

            {/* 3) ข้อมูลลูกค้า + ผู้ประเมิน / Appraisal */}
            <section className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-emerald-900">
                  3. ข้อมูลลูกค้าและผู้ประเมิน
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={handleEditCustomerAppraiserSection}
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  แก้ไข
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {/* ลูกค้า */}
                <div>
                  <h4 className="font-semibold mb-1 text-emerald-800">
                    ลูกค้า
                  </h4>
                  <p>
                    <span className="font-medium">ชื่อ:</span>{" "}
                    {localDetail.customer.first_name}{" "}
                    {localDetail.customer.last_name}
                  </p>
                  <p>
                    <span className="font-medium">เลขบัตร:</span>{" "}
                    {localDetail.customer.national_ID}
                  </p>
                  <p>
                    <span className="font-medium">วันเกิด:</span>{" "}
                    {formatDate(localDetail.customer.date_of_birth)}
                  </p>
                  <p>
                    <span className="font-medium">โทร:</span>{" "}
                    {localDetail.customer.phone_number || "-"}
                  </p>
                  <p>
                    <span className="font-medium">ที่อยู่:</span>{" "}
                    {localDetail.customer.address || "-"}
                  </p>
                  <p>
                    <span className="font-medium">KYC:</span>{" "}
                    {localDetail.customer.kyc_status}
                  </p>
                </div>

                {/* ผู้ประเมิน / Appraisal */}
                <div>
                  <h4 className="font-semibold mb-1 text-emerald-800">
                    ผู้ประเมิน / การประเมิน
                  </h4>
                  {localDetail.appraiser ? (
                    <>
                      <p>
                        <span className="font-medium">Staff ID:</span>{" "}
                        {localDetail.appraiser.Staff_ID}
                      </p>
                      <p>
                        <span className="font-medium">ชื่อ:</span>{" "}
                        {localDetail.appraiser.first_name}{" "}
                        {localDetail.appraiser.last_name}
                      </p>
                      <p>
                        <span className="font-medium">ตำแหน่ง:</span>{" "}
                        {localDetail.appraiser.position}
                      </p>
                      <p>
                        <span className="font-medium">โทร:</span>{" "}
                        {localDetail.appraiser.phone_number}
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
                    {localDetail.appraisal ? (
                      <>
                        <p>
                          <span className="font-medium">Appraisal ID:</span>{" "}
                          {localDetail.appraisal.appraisal_ID}
                        </p>
                          <span className="font-medium">
                            มูลค่าที่ประเมิน:
                          </span>{" "}
                          ฿
                          {localDetail.appraisal.appraised_value.toLocaleString(
                            "th-TH"
                          )}
                        <p>
                          <span className="font-medium">วันที่ประเมิน:</span>{" "}
                          {formatDateTime(localDetail.appraisal.appraisal_Date)}
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
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-sky-900">
                  4. ข้อมูลการจ่ายเงิน
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={handleEditPaymentsSection}
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  แก้ไข
                </Button>
              </div>
              {localDetail.payments.length === 0 ? (
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
                      {localDetail.payments.map((p) => (
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
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-rose-900">
                  5. ข้อมูลการหลุดจำนำ / จำหน่ายทรัพย์
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={handleEditDispositionSection}
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  แก้ไข
                </Button>
              </div>
              {localDetail.disposition ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <p>
                    <span className="font-medium">Disposition ID:</span>{" "}
                    {localDetail.disposition.disposition_ID}
                  </p>
                  <p>
                    <span className="font-medium">Item ID:</span>{" "}
                    {localDetail.disposition.item_ID}
                  </p>
                  <p>
                    <span className="font-medium">วันที่ขาย:</span>{" "}
                    {formatDate(localDetail.disposition.sale_date)}
                  </p>
                  <p>
                    <span className="font-medium">วิธีการขาย:</span>{" "}
                    {localDetail.disposition.sale_method}
                  </p>
                  <p>
                    <span className="font-medium">ราคาขาย:</span>{" "}
                    ฿
                    {localDetail.disposition.sale_price.toLocaleString(
                      "th-TH"
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  ยังไม่มีข้อมูลการหลุดจำนำหรือขายทรัพย์
                </p>
              )}
            </section>

            {/* Dialog แก้ไข Section 1: รายละเอียดตั๋ว */}
            <Dialog open={isTicketEditOpen} onOpenChange={setIsTicketEditOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>แก้ไขรายละเอียดตั๋วจำนำ</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  <div>
                    <Label htmlFor="loan_amount">วงเงินกู้ (บาท)</Label>
                    <Input
                      id="loan_amount"
                      type="number"
                      value={ticketForm.loan_amount}
                      onChange={(e) =>
                        setTicketForm((prev) => ({
                          ...prev,
                          Loan_Amount: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="interest_rate">
                      ดอกเบี้ยต่อเดือน (%)
                    </Label>
                    <Input
                      id="interest_rate"
                      type="number"
                      step="0.01"
                      value={ticketForm.interest_rate}
                      onChange={(e) =>
                        setTicketForm((prev) => ({
                          ...prev,
                          interest_rate: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="due_date">
                      วันครบกำหนด (Due Date)
                    </Label>
                    <Input
                      id="due_date"
                      type="datetime-local"
                      value={ticketForm.due_date}
                      onChange={(e) =>
                        setTicketForm((prev) => ({
                          ...prev,
                          due_date: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="notice_date">
                      วันแจ้งเตือน (Notice Date)
                    </Label>
                    <Input
                      id="notice_date"
                      type="datetime-local"
                      value={ticketForm.notice_date}
                      onChange={(e) =>
                        setTicketForm((prev) => ({
                          ...prev,
                          notice_date: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="contract_status">
                      สถานะสัญญา (Status)
                    </Label>
                    <Select
                      value={ticketForm.contract_status}
                      onValueChange={(value) =>
                        setTicketForm((prev) => ({
                          ...prev,
                          contract_status: value,
                        }))
                      }
                    >
                      <SelectTrigger id="contract_status">
                        <SelectValue placeholder="เลือกสถานะสัญญา" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">
                          ACTIVE - ใช้งานอยู่
                        </SelectItem>
                        <SelectItem value="ROLLED_OVER">
                          ROLLED_OVER - ต่อสัญญา
                        </SelectItem>
                        <SelectItem value="CANCELLED">
                          CANCELLED - ยกเลิก
                        </SelectItem>
                        <SelectItem value="EXPIRED">
                          EXPIRED - หมดอายุ
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsTicketEditOpen(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button onClick={handleSaveTicketEdit}>บันทึก</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Dialog แก้ไข Section 2: ทรัพย์จำนำ */}
            <Dialog open={isItemEditOpen} onOpenChange={setIsItemEditOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>แก้ไขรายละเอียดทรัพย์จำนำ</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  <div>
                    <Label htmlFor="item_Type">ประเภททรัพย์</Label>
                    <Select
                      value={itemForm.item_Type}
                      onValueChange={(value) =>
                        setItemForm((prev) => ({ ...prev, item_Type: value }))
                      }
                    >
                      <SelectTrigger id="item_Type">
                        <SelectValue placeholder="เลือกประเภททรัพย์" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GOLD">GOLD - ทอง</SelectItem>
                        <SelectItem value="JEWELRY">JEWELRY - เครื่องประดับ</SelectItem>
                        <SelectItem value="ELECTRONICS">
                          ELECTRONICS - อุปกรณ์อิเล็กทรอนิกส์
                        </SelectItem>
                        <SelectItem value="WATCH">WATCH - นาฬิกา</SelectItem>
                        <SelectItem value="OTHER">OTHER - อื่น ๆ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">รายละเอียด</Label>
                    <Input
                      id="description"
                      value={itemForm.description}
                      onChange={(e) =>
                        setItemForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="appraised_value">มูลค่าประเมิน (บาท)</Label>
                    <Input
                      id="appraised_value"
                      type="number"
                      value={itemForm.appraised_value}
                      onChange={(e) =>
                        setItemForm((prev) => ({
                          ...prev,
                          appraised_value: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="item_status">สถานะทรัพย์</Label>
                    <Select
                      value={itemForm.item_status}
                      onValueChange={(value) =>
                        setItemForm((prev) => ({
                          ...prev,
                          item_status: value,
                        }))
                      }
                    >
                      <SelectTrigger id="item_status">
                        <SelectValue placeholder="เลือกสถานะทรัพย์" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN_STORAGE">
                          IN_STORAGE - ภายในคลัง
                        </SelectItem>
                        <SelectItem value="RETURNED_TO_CUSTOMER">
                          RETURNED_TO_CUSTOMER - คืนลูกค้าแล้ว
                        </SelectItem>
                        <SelectItem value="FORFEITED_READY_FOR_SALE">
                          FORFEITED_READY_FOR_SALE - หลุดจำนำพร้อมขาย
                        </SelectItem>
                        <SelectItem value="SOLD">
                          SOLD - จำหน่ายแล้ว
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsItemEditOpen(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button onClick={handleSaveItemEdit}>บันทึก</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

                        {/* Dialog แก้ไข Section 3: ข้อมูลลูกค้าและผู้ประเมิน */}
            <Dialog
              open={isCustomerEditOpen}
              onOpenChange={setIsCustomerEditOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>แก้ไขข้อมูลลูกค้าและผู้ประเมิน</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-2">
                  {/* ส่วนที่ 1: ลูกค้า */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-emerald-800">
                      ข้อมูลลูกค้า
                    </h4>

                    <div>
                      <Label htmlFor="phone_number">เบอร์โทรศัพท์</Label>
                      <Input
                        id="phone_number"
                        value={customerForm.phone_number}
                        onChange={(e) =>
                          setCustomerForm((prev) => ({
                            ...prev,
                            phone_number: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="address">ที่อยู่</Label>
                      <Input
                        id="address"
                        value={customerForm.address}
                        onChange={(e) =>
                          setCustomerForm((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="kyc_status">สถานะ KYC</Label>
                      <Select
                        value={customerForm.kyc_status}
                        onValueChange={(value) =>
                          setCustomerForm((prev) => ({
                            ...prev,
                            kyc_status: value,
                          }))
                        }
                      >
                        <SelectTrigger id="kyc_status">
                          <SelectValue placeholder="เลือกสถานะ KYC" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">
                            PENDING - รอตรวจสอบ
                          </SelectItem>
                          <SelectItem value="PASSED">
                            PASSED - ผ่านแล้ว
                          </SelectItem>
                          <SelectItem value="FAILED">
                            FAILED - ไม่ผ่าน
                          </SelectItem>
                          <SelectItem value="REJECTED">
                            REJECTED - ถูกปฏิเสธ
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* ส่วนที่ 2: ผู้ประเมิน */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-semibold text-emerald-800">
                      ข้อมูลผู้ประเมิน
                    </h4>

                    {localDetail?.appraiser ? (
                      <>
                        <p className="text-xs text-muted-foreground">
                          Staff ID: {localDetail.appraiser.Staff_ID} • ชื่อ:{" "}
                          {localDetail.appraiser.first_name}{" "}
                          {localDetail.appraiser.last_name}
                        </p>

                        <div>
                          <Label htmlFor="appraiser_phone">
                            เบอร์โทรผู้ประเมิน
                          </Label>
                          <Input
                            id="appraiser_phone"
                            value={appraiserForm.phone_number}
                            onChange={(e) =>
                              setAppraiserForm((prev) => ({
                                ...prev,
                                phone_number: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor="appraiser_position">ตำแหน่ง</Label>
                          <Select
                            value={appraiserForm.position}
                            onValueChange={(value) =>
                              setAppraiserForm((prev) => ({
                                ...prev,
                                position: value,
                              }))
                            }
                          >
                            <SelectTrigger id="appraiser_position">
                              <SelectValue placeholder="เลือกตำแหน่ง" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="STAFF">
                                STAFF - พนักงาน
                              </SelectItem>
                              <SelectItem value="SUPERVISOR">
                                SUPERVISOR - หัวหน้าชั้น
                              </SelectItem>
                              <SelectItem value="MANAGER">
                                MANAGER - ผู้จัดการ
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        ตั๋วนี้ยังไม่มีข้อมูลผู้ประเมินในระบบ
                      </p>
                    )}
                  </div>
                </div>

                <DialogFooter className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCustomerEditOpen(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button onClick={handleSaveCustomerEdit}>บันทึก</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>


            {/* Dialog แก้ไข Section 4: ข้อมูลการจ่ายเงิน */}
            <Dialog
              open={isPaymentEditOpen}
              onOpenChange={setIsPaymentEditOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>แก้ไขข้อมูลการจ่ายเงิน</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  {localDetail && localDetail.payments.length > 0 && (
                    <div>
                      <Label htmlFor="payment_select">
                        เลือกงวดที่ต้องการแก้ไข
                      </Label>
                      <Select
                        value={paymentForm.payment_ID}
                        onValueChange={(value) =>
                          handleChangePaymentSelection(value)
                        }
                      >
                        <SelectTrigger id="payment_select">
                          <SelectValue placeholder="เลือกงวด" />
                        </SelectTrigger>
                        <SelectContent>
                          {localDetail.payments.map((p) => (
                            <SelectItem
                              key={p.payment_ID}
                              value={String(p.payment_ID)}
                            >
                              #{p.payment_ID} -{" "}
                              {formatDateTime(p.payment_date)} - ฿
                              {p.amount_paid.toLocaleString("th-TH")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="payment_date">วันที่จ่าย</Label>
                    <Input
                      id="payment_date"
                      type="datetime-local"
                      value={paymentForm.payment_date}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          payment_date: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="amount_paid">จำนวนเงิน (บาท)</Label>
                    <Input
                      id="amount_paid"
                      type="number"
                      value={paymentForm.amount_paid}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          amount_paid: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="payment_type">วิธีการจ่าย</Label>
                    <Select
                      value={paymentForm.payment_type}
                      onValueChange={(value) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          payment_type: value,
                        }))
                      }
                    >
                      <SelectTrigger id="payment_type">
                        <SelectValue placeholder="เลือกวิธีการจ่าย" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">CASH - เงินสด</SelectItem>
                        <SelectItem value="TRANSFER">
                          TRANSFER - โอนเงิน
                        </SelectItem>
                        <SelectItem value="CARD">CARD - บัตร</SelectItem>
                        <SelectItem value="ONLINE">
                          ONLINE - ชำระออนไลน์
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsPaymentEditOpen(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button onClick={handleSavePaymentEdit}>บันทึก</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Dialog แก้ไข Section 5: ข้อมูลการหลุดจำนำ */}
            <Dialog
              open={isDispositionEditOpen}
              onOpenChange={setIsDispositionEditOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>แก้ไขข้อมูลการหลุดจำนำ / จำหน่ายทรัพย์</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  <div>
                    <Label htmlFor="sale_date">วันที่ขาย</Label>
                    <Input
                      id="sale_date"
                      type="datetime-local"
                      value={dispositionForm.sale_date}
                      onChange={(e) =>
                        setDispositionForm((prev) => ({
                          ...prev,
                          sale_date: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="sale_method">วิธีการขาย</Label>
                    <Select
                      value={dispositionForm.sale_method}
                      onValueChange={(value) =>
                        setDispositionForm((prev) => ({
                          ...prev,
                          sale_method: value,
                        }))
                      }
                    >
                      <SelectTrigger id="sale_method">
                        <SelectValue placeholder="เลือกวิธีการขาย" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUCTION">
                          AUCTION - ประมูล
                        </SelectItem>
                        <SelectItem value="DIRECT_SALE">
                          DIRECT_SALE - ขายหน้าร้าน
                        </SelectItem>
                        <SelectItem value="ONLINE">
                          ONLINE - ขายออนไลน์
                        </SelectItem>
                        <SelectItem value="SCRAP">
                          SCRAP - ขายเศษทอง/ชั่งน้ำหนัก
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="sale_price">ราคาขาย (บาท)</Label>
                    <Input
                      id="sale_price"
                      type="number"
                      value={dispositionForm.sale_price}
                      onChange={(e) =>
                        setDispositionForm((prev) => ({
                          ...prev,
                          sale_price: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <DialogFooter className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDispositionEditOpen(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button onClick={handleSaveDispositionEdit}>บันทึก</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* ปุ่มลบตั๋ว */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="mt-4" variant="destructive">
                  ลบตั๋วจำนำ
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>ยืนยันการลบตั๋วจำนำ</AlertDialogTitle>
                </AlertDialogHeader>

                <p className="text-sm text-muted-foreground mt-2">
                  คุณแน่ใจหรือไม่ว่าต้องการลบตั๋วเลขที่{" "}
                  <span className="font-semibold">{ticket?.ticket_ID}</span>?
                  <br />
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