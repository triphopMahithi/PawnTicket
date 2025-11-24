import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, ArrowRight } from "lucide-react";
import { Stepper } from "@/components/Stepper";
import { CustomerSearch } from "@/components/CustomerSearch";
import { EmployeeSearch } from "@/components/EmployeeSearch";
import { FileUploader } from "@/components/FileUploader";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  nationalId: string;
  phone: string;
}

const steps = [
  { number: 1, title: "ระบุตัวตนและประเมิน", description: "ข้อมูลลูกค้าและทรัพย์" },
  { number: 2, title: "ออกตั๋วจำนำ", description: "รายละเอียดสัญญา" },
  { number: 3, title: "บันทึกการชำระ", description: "ชำระเงินครั้งแรก" },
];

const appraisers = [];

const itemTypes = [
  "ทองรูปพรรณ",
  "ทองคำแท่ง",
  "เครื่องประดับเพชร",
  "นาฬิกา",
  "อิเล็กทรอนิกส์",
  "อื่นๆ",
];

type ItemStatus =
  | "IN_STORAGE"
  | "RETURNED_TO_CUSTOMER"
  | "FORFEITED_READY_FOR_SALE"
  | "SOLD";

const ITEM_STATUS_LABEL: Record<ItemStatus, string> = {
  IN_STORAGE: "ภายในคลัง",
  RETURNED_TO_CUSTOMER: "ส่งคืนลูกค้าแล้ว",
  FORFEITED_READY_FOR_SALE: "หลุดจำนำ/พร้อมขาย",
  SOLD: "ขายแล้ว",
};

const ITEM_STATUS_OPTIONS: ItemStatus[] = [
  "IN_STORAGE",
  "RETURNED_TO_CUSTOMER",
  "FORFEITED_READY_FOR_SALE",
  "SOLD",
];


export default function Step1Appraise() {
  const navigate = useNavigate();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [appraiser, setAppraiser] = useState("");
  const [itemType, setItemType] = useState("");
  const [description, setDescription] = useState("");
  const [appraisedValue, setAppraisedValue] = useState("");
  const [appraisalDate, setAppraisalDate] = useState<Date>();
  const [files, setFiles] = useState<File[]>([]);
  const appraisedValueNumber = Number((appraisedValue || "").replace(/[^\d.-]/g, "")) || 0;
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [otherItemType, setOtherItemType] = useState("");
  const [itemStatus, setItemStatus] = useState<ItemStatus>("IN_STORAGE");


const handleNext = async () => {
  const finalItemType = itemType === "อื่นๆ" ? otherItemType.trim() : itemType;

  // ตรวจสอบความครบถ้วนของข้อมูลก่อน
  if (!selectedCustomer) {
    toast.error("กรุณาเลือกหรือสร้างข้อมูลลูกค้า");
    return;
  }
  if (!appraiser) {
    toast.error("กรุณาเลือกผู้ประเมิน");
    return;
  }
  if (!itemType) {
    toast.error("กรุณาเลือกประเภททรัพย์");
    return;
  }
  if (!description.trim()) {
    toast.error("กรุณากรอกรายละเอียดทรัพย์");
    return;
  }
  if (!appraisedValueNumber || appraisedValueNumber <= 0) {
    toast.error("กรุณากรอกมูลค่าประเมินที่ถูกต้อง");
    return;
  }
  if (!appraisalDate) {
    toast.error("กรุณาเลือกวันที่ประเมิน");
    return;
  }
  if (files.length === 0) {
    toast.error("กรุณาอัพโหลดหลักฐานอย่างน้อย 1 ไฟล์");
    return;
  }
  if (!finalItemType) {
    toast.error("กรุณาระบุประเภททรัพย์");
    return;
  }

  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);  
    });

    const uploadRes = await fetch("http://localhost:3001/api/upload/upload", {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      const uploadData = await uploadRes.json();
      toast.error("การอัปโหลดไฟล์ไม่สำเร็จ");
      return;
    }

    const uploadData = await uploadRes.json();
    if (!uploadData.filePaths) {
      toast.error("เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
      return;
    }

    const finalItemType = itemType === "อื่นๆ" ? otherItemType.trim() : itemType;
    const pawnItemRes = await fetch("http://localhost:3001/api/pawn-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemType: finalItemType,
        description,
        appraisedValue: appraisedValueNumber,
        itemStatus,
        staffId: selectedEmployee?.id,
        appraisalDate: appraisalDate?.toISOString(),
        customerId: selectedCustomer?.id,
        filePaths: uploadData.filePaths, 
      }),
    });

    if (!pawnItemRes.ok) {
      const pawnItemData = await pawnItemRes.json();
      console.error("pawn-items error:", pawnItemData);
      toast.error("บันทึกทรัพย์ลงฐานข้อมูลไม่สำเร็จ");
      return;
    }

    const pawnItemData = await pawnItemRes.json();
    const pawnItem = pawnItemData.item;

    sessionStorage.setItem(
      "appraisalData",
      JSON.stringify({
        customer: selectedCustomer,
        appraiser: selectedEmployee?.id || appraiser,
        appraiserObj: selectedEmployee || null,
        appraiserName:
          (selectedEmployee as any)?.name ||
          (appraisers.find((a) => a.id === appraiser)?.name) ||
          appraiser,
        itemId: pawnItem?.id ? String(pawnItem.id) : Date.now().toString(),
        itemType: finalItemType,
        description,
        appraisedValue: appraisedValueNumber,
        appraisalDate,
        filesCount: files.length,
        itemStatus,
      })
    );

    toast.success("บันทึกข้อมูลสำเร็จ");
    navigate("/step-2");
  } catch (err) {
    console.error(err);
    toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
  }
};



  const formatMoney = (value: string) => {
    const num = value.replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <Stepper steps={steps} currentStep={1} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">ระบุตัวตนและประเมินทรัพย์</h1>
            <p className="text-muted-foreground mt-1">
              กรอกข้อมูลลูกค้าและรายละเอียดทรัพย์ที่นำมาจำนำ
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">ข้อมูลลูกค้า</h2>
              <CustomerSearch
                onSelect={setSelectedCustomer}
                selectedCustomer={selectedCustomer}
              />
            </div>

            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">ผู้ประเมิน</h2>
              <EmployeeSearch
                onSelect={(emp) => {
                  setSelectedEmployee(emp);
                  setAppraiser(emp.id); // หากยังคงเก็บเป็น id สำหรับ sessionStorage
                }}
                selectedEmployee={selectedEmployee}
                allowedPositions={["staff","supervisor","manager"]}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">รายละเอียดทรัพย์</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="itemType">
                    ประเภททรัพย์ <span className="text-destructive">*</span>
                  </Label>
                  <Select value={itemType} onValueChange={setItemType}>
                  <SelectTrigger id="itemType">
                    <SelectValue placeholder="เลือกประเภททรัพย์" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {itemType === "อื่นๆ" && (
                  <div className="mt-2 space-y-1">
                    <Label htmlFor="otherItemType">
                      ระบุประเภททรัพย์ (อื่นๆ) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="otherItemType"
                      placeholder="เช่น เครื่องดนตรี, อุปกรณ์กีฬา, ฯลฯ"
                      value={otherItemType}
                      onChange={(e) => setOtherItemType(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      ค่านี้จะถูกบันทึกเป็นประเภททรัพย์เหมือนรายการอื่น ๆ
                    </p>
                  </div>
                )}

                </div>

                <div>
                  <Label htmlFor="description">
                    รายละเอียด <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="ระบุรายละเอียดทรัพย์ เช่น น้ำหนัก สี ลักษณะพิเศษ..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    maxLength={500} 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {description.length} / 500 ตัวอักษร
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">การประเมินราคา</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="appraisedValue">
                    มูลค่าประเมิน (บาท) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="appraisedValue"
                    placeholder="0.00"
                    value={formatMoney(appraisedValue)}
                    onChange={(e) => setAppraisedValue(e.target.value)}
                  />
                </div>

                <div>
                  <Label>
                    วันที่ประเมิน <span className="text-destructive">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !appraisalDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {appraisalDate ? (
                          format(appraisalDate, "PPP", { locale: th })
                        ) : (
                          <span>เลือกวันที่</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={appraisalDate}
                        onSelect={setAppraisalDate}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">
                หลักฐาน <span className="text-destructive">*</span>
              </h2>
              <FileUploader files={files} onFilesChange={setFiles} />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate("/")}>
            ยกเลิก
          </Button>
          <Button onClick={handleNext}>
            ถัดไป
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
