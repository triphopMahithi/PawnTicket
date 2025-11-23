import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { CustomerListItem } from "@/pages/History";
import { Edit, User } from "lucide-react";
import { toast } from "sonner";

const API_BASE = "http://localhost:3001";
interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerListItem | null;
  onSave: (updatedCustomer: CustomerListItem) => void;
}

export default function EditCustomerModal({
  isOpen,
  onClose,
  customer,
  onSave,
}: EditCustomerModalProps) {
  // State สำหรับเก็บข้อมูลที่แก้ไข
  const [updatedCustomer, setUpdatedCustomer] = useState<CustomerListItem | null>(customer);

  // ฟังก์ชันการบันทึกข้อมูล
  const handleSave = async () => {
    if (updatedCustomer) {
      try {
        // เรียก API สำหรับบันทึกข้อมูลลูกค้า
        const res = await fetch(`${API_BASE}/api/customers/${updatedCustomer.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            first_name: updatedCustomer.name.split(" ")[0],
            last_name: updatedCustomer.name.split(" ")[1] || "",
            national_ID: updatedCustomer.nationalId,
            date_of_birth: updatedCustomer.dateOfBirth,
            phone_number: updatedCustomer.phone,
            address: updatedCustomer.address?.raw,
            kyc_status: updatedCustomer.kycStatus,
          }),
        });

        if (res.ok) {
          toast.success("ข้อมูลลูกค้าถูกแก้ไขแล้ว");
          onSave(updatedCustomer); // บันทึกข้อมูลหลังจากการแก้ไข
          onClose(); // ปิด Modal
        } else {
          throw new Error("Failed to save customer");
        }
      } catch (err) {
        console.error("Error updating customer:", err);
        toast.error("ไม่สามารถบันทึกข้อมูลลูกค้าได้");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">แก้ไขข้อมูลลูกค้า</DialogTitle>
              <p className="text-xs text-muted-foreground">กรุณากรอกข้อมูลใหม่</p>
            </div>
          </div>
        </DialogHeader>

        {updatedCustomer && (
          <div className="space-y-4">
            <Input
              value={updatedCustomer.name}
              onChange={(e) => setUpdatedCustomer({ ...updatedCustomer, name: e.target.value })}
              placeholder="ชื่อ-นามสกุล"
            />
            <Input
              value={updatedCustomer.phone}
              onChange={(e) => setUpdatedCustomer({ ...updatedCustomer, phone: e.target.value })}
              placeholder="เบอร์โทรศัพท์"
            />
            <Input
              value={updatedCustomer.nationalId}
              onChange={(e) => setUpdatedCustomer({ ...updatedCustomer, nationalId: e.target.value })}
              placeholder="รหัสประจำตัวประชาชน"
            />
            <Input
              type="date"
              value={updatedCustomer.dateOfBirth || ""}
              onChange={(e) => setUpdatedCustomer({ ...updatedCustomer, dateOfBirth: e.target.value })}
              placeholder="วันเกิด"
            />
            <Input
              value={updatedCustomer.address?.raw || ""}
              onChange={(e) => setUpdatedCustomer({ ...updatedCustomer, address: { raw: e.target.value } })}
              placeholder="ที่อยู่"
            />
            <Select
              value={updatedCustomer.kycStatus}
              onChange={(e) => setUpdatedCustomer({ ...updatedCustomer, kycStatus: e.target.value })}
            >
              <SelectItem value="PENDING">รอการตรวจสอบ</SelectItem>
              <SelectItem value="APPROVED">อนุมัติ</SelectItem>
              <SelectItem value="REJECTED">ปฏิเสธ</SelectItem>
            </Select>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSave}>บันทึกการแก้ไข</Button>
              <Button variant="ghost" onClick={onClose}>ยกเลิก</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
