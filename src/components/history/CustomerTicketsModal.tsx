import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerListItem } from "@/pages/History";
import { Ticket, Calendar, User, Edit } from "lucide-react";
import { CONTRACT_STATUS_TH, getContractStatusVariant, getStatusText } from "@/lib/status-translations";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
const API_BASE = "http://localhost:3001";

export default function CustomerTicketsModal({
  isOpen,
  onClose,
  customer,
  tickets,
  loading,
  error,
  onSelectTicket,
  getStatusColor,
  onEditCustomer,
  onCustomerUpdate
}: CustomerTicketsModalProps) {
  const [updatedCustomer, setUpdatedCustomer] = useState<CustomerListItem | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false); 
  const [customerData, setCustomerData] = useState<CustomerListItem | null>(null);

  const getKycStatusText = (status: string | undefined) => {
  switch (status) {
    case "PENDING":
      return "รอการตรวจสอบ";
    case "PASSED":
      return "อนุมัติ";
    case "FAILED":
      return "ไม่ผ่านการประเมิน";
    case "REJECTED":
      return "ปฏิเสธ";
    default:
      return "-";  // กรณีที่ไม่มีสถานะ
  }
};
const handleDeleteCustomer = async () => {
  if (!customerData || !customerData.id) {
    console.error("No customer data available for deletion");
    toast.error("ข้อมูลลูกค้าไม่ถูกต้อง");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/customers/${customerData.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("ลูกค้าถูกลบออกจากระบบแล้ว");
      setShowDeleteConfirmation(false);
      onClose();
      if (onCustomerUpdate) {
        onCustomerUpdate();
      }
    } else {
      throw new Error("ไม่สามารถลบข้อมูลลูกค้าได้");
    }
  } catch (error) {
    console.error("Error deleting customer:", error);
    toast.error("ไม่สามารถลบข้อมูลลูกค้าได้");
  }
};

  // คำนวณอายุจากวันเกิด
  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    if (isOpen && customer) {
      const fetchCustomer = async () => {
        try {
          const response = await fetch(`${API_BASE}/api/customers/${customer.id}`);
          const data = await response.json();
          console.log(data); // ตรวจสอบข้อมูลที่ได้รับจาก backend

          // ตั้งค่า customerData
          setCustomerData(data);
        } catch (error) {
          console.error("Error fetching customer:", error);
        }
      };

      fetchCustomer();
    }
  }, [isOpen, customer]); // ดึงข้อมูลเมื่อ modal เปิดและ customer เปลี่ยนแปลง
const handleSaveCustomer = async () => {
  if (!updatedCustomer) return;

  try {
    const res = await fetch(`${API_BASE}/api/customers/${updatedCustomer.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        first_name: updatedCustomer.name.split(" ")[0],
        last_name: updatedCustomer.name.split(" ")[1] || "",
        phone_number: updatedCustomer.phone,
        national_ID: updatedCustomer.nationalId,
        date_of_birth: updatedCustomer.dateOfBirth,
        address: updatedCustomer.address?.raw,
        kyc_status: updatedCustomer.kycStatus,
      }),
    });

    if (res.ok) {
      toast.success("ข้อมูลลูกค้าถูกแก้ไขแล้ว");

      // ดึงข้อมูลที่อัปเดตแล้วจาก API
      const updatedData = await res.json();
      setUpdatedCustomer({
        ...updatedCustomer,
        name: updatedData.first_name + " " + updatedData.last_name,
        phone: updatedData.phone_number,
        nationalId: updatedData.national_ID,
        dateOfBirth: updatedData.date_of_birth,
        address: { raw: updatedData.address },
        kycStatus: updatedData.kyc_status,
      });

      // ส่งข้อมูลที่อัปเดตกลับไปยัง HistoryPage
      if (onCustomerUpdate) {
        onCustomerUpdate(updatedData); // เรียก callback ที่รับข้อมูลไปอัปเดตใน HistoryPage
      }

      // ปิดฟอร์มแก้ไข
      setUpdatedCustomer(null);
    } else {
      throw new Error("Failed to save customer");
    }
  } catch (err) {
    console.error("Error updating customer:", err);
    toast.error("ไม่สามารถบันทึกข้อมูลลูกค้าได้");
  }
};

  const handleCancelEdit = () => {
    setUpdatedCustomer(null); // ปิดฟอร์มแก้ไขโดยไม่บันทึกข้อมูล
  };

  const handleEditClick = () => {
    if (customerData) {
      setUpdatedCustomer({
        id: customerData.id,
        name: customerData.first_name + " " + customerData.last_name,
        nationalId: customerData.national_ID,
        phone: customerData.phone_number,
        dateOfBirth: customerData.date_of_birth,
        address: { raw: customerData.address },
        kycStatus: customerData.kyc_status,
      });
    }
  };

  // useEffect to track real-time changes in updatedCustomer
  useEffect(() => {
    // Log the updated customer whenever it changes
    console.log(updatedCustomer);
  }, [updatedCustomer]);

  if (!customerData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">{customerData.first_name} {customerData.last_name}</DialogTitle>
                  <p className="text-xs text-muted-foreground">ข้อมูลลูกค้า</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-3 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">เลขบัตรประชาชน</p>
                  <p className="font-mono font-semibold">{customerData.national_ID || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">เบอร์โทรศัพท์</p>
                  <p className="font-mono font-semibold">{customerData.phone_number || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">อายุ</p>
                  <p className="font-mono font-semibold">{customerData.date_of_birth ? calculateAge(customerData.date_of_birth) : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">สถานะ KYC</p>
                  <p className="font-mono font-semibold">  {getKycStatusText(customerData.kyc_status) || "-"}</p>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleEditClick} // เมื่อคลิกปุ่มจะเปิดฟอร์มแก้ไข
              className="shrink-0"
            >
              <Edit className="h-4 w-4 mr-2" />
              แก้ไข
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowDeleteConfirmation(true)} // เมื่อคลิกจะเปิด Dialog ยืนยันการลบ
              className="shrink-0"
            >
              <Edit className="h-4 w-4 mr-2" />
              ลบข้อมูลลูกค้า
            </Button>
          {showDeleteConfirmation && (
  <Dialog open={showDeleteConfirmation} onOpenChange={() => setShowDeleteConfirmation(false)}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="text-xl">ยืนยันการลบข้อมูลลูกค้า</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          คุณแน่ใจหรือไม่ว่าจะลบข้อมูลของลูกค้าคนนี้? ข้อมูลทั้งหมดจะถูกลบออกจากระบบ
        </p>
        <div className="flex gap-2">
          <Button onClick={handleDeleteCustomer} variant="destructive">
            ลบข้อมูลลูกค้า
          </Button>
          <Button variant="ghost" onClick={() => setShowDeleteConfirmation(false)}>
            ยกเลิก
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)}

          </div>
        </DialogHeader>

        {/* ฟอร์มแก้ไขข้อมูลลูกค้าใน Modal */}
        {updatedCustomer && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold">แก้ไขข้อมูลลูกค้า</h3>
            <div className="space-y-4">
              <Input
                value={updatedCustomer.name}
                maxLength={225} // จำกัดจำนวนตัวอักษร
                onChange={(e) => setUpdatedCustomer({ ...updatedCustomer, name: e.target.value })}
                placeholder="ชื่อ-นามสกุล"
              />
              <Input
                value={updatedCustomer.phone}
                maxLength={20} // จำกัดจำนวนตัวอักษร
                onChange={(e) => setUpdatedCustomer({ ...updatedCustomer, phone: e.target.value })}
                placeholder="เบอร์โทรศัพท์"
              />
              <Input
                value={updatedCustomer.nationalId}
                maxLength={13} // จำกัดให้กรอกได้ 13 ตัว
                onChange={(e) => setUpdatedCustomer({ ...updatedCustomer, nationalId: e.target.value })}
                placeholder="รหัสประจำตัวประชาชน"
              />
              <Input
                type="date"
                value={updatedCustomer.dateOfBirth ? updatedCustomer.dateOfBirth.split('T')[0] : ""}  // แก้ไขให้แสดงวันที่โดยไม่ใช้ new Date()
                onChange={(e) => setUpdatedCustomer({ ...updatedCustomer, dateOfBirth: e.target.value })}
                placeholder="วันเกิด"
              />
              <Input
                value={updatedCustomer.address?.raw || ""}
                maxLength={500} // จำกัดจำนวนตัวอักษร
                onChange={(e) => setUpdatedCustomer({ ...updatedCustomer, address: { raw: e.target.value } })}
                placeholder="ที่อยู่"
              />
              <select
                value={updatedCustomer.kycStatus}
                onChange={(e) =>
                  setUpdatedCustomer({
                    ...updatedCustomer,
                    kycStatus: e.target.value as "PENDING" | "PASSED" | "FAILED" | "REJECTED",
                  })
                }
                className="w-full p-2 border rounded-md"
              >
                <option value="PENDING">รอการตรวจสอบ</option>
                <option value="PASSED">อนุมัติ</option>
                <option value="FAILED">ไม่ผ่านการประเมิน</option>
                <option value="REJECTED">ปฏิเสธ</option>
              </select>
              <div className="flex gap-2">
                <Button onClick={handleSaveCustomer}>บันทึกการแก้ไข</Button>
                <Button variant="ghost" onClick={handleCancelEdit}>ยกเลิก</Button>
              </div>
            </div>
          </div>
        )}


        {/* ตั๋วทั้งหมด */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Ticket className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">
              ตั๋วทั้งหมด ({tickets.length} ใบ)
            </h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <p className="text-destructive text-center py-8">{error}</p>
          ) : tickets.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              ไม่พบตั๋วของลูกค้าคนนี้
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.map((ticket) => {
                const contractDate =
                  ticket.contract_date ?? ticket.Contract_Date ?? ticket.contractDate;

                return (
                  <div
                    key={ticket.ticket_ID}
                    className="bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-xl p-5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                    onClick={() => onSelectTicket(ticket)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-md bg-primary/10">
                          <Ticket className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Ticket ID</p>
                          <p className="text-xl font-mono font-bold text-foreground">
                            {ticket.ticket_ID}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getContractStatusVariant(ticket.contract_status)}>
                        {getStatusText(ticket.contract_status, CONTRACT_STATUS_TH)}
                      </Badge>
                    </div>

                    <div className="space-y-3 text-sm bg-muted/20 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="text-xs">วันที่ทำสัญญา</span>
                        </div>
                        <span className="font-semibold text-foreground">
                          {contractDate
                            ? new Date(contractDate).toLocaleDateString("th-TH")
                            : "-"}
                        </span>
                      </div>
                      {ticket.principal_Amount && (
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <span className="text-xs text-muted-foreground">จำนวนเงินจำนำ</span>
                          <span className="text-lg font-bold text-primary">
                            {ticket.principal_Amount.toLocaleString()} ฿
                          </span>
                        </div>
                      )}
                    </div>

                    <Button variant="default" size="sm" className="w-full mt-4">
                      ดูรายละเอียดเพิ่มเติม
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
