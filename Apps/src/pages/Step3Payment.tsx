import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Printer, Download } from "lucide-react";
import { Stepper } from "@/components/Stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const steps = [
  { number: 1, title: "ระบุตัวตนและประเมิน", description: "ข้อมูลลูกค้าและทรัพย์" },
  { number: 2, title: "ออกตั๋วจำนำ", description: "รายละเอียดสัญญา" },
  { number: 3, title: "บันทึกการชำระ", description: "ชำระเงินครั้งแรก" },
];

const paymentMethods = [
  { value: "cash", label: "เงินสด" },
  { value: "transfer", label: "โอนเงิน" },
  { value: "card", label: "บัตรเครดิต/เดบิต" },
  { value: "online", label: "ชำระออนไลน์" },
];

export default function Step3Payment() {
  const navigate = useNavigate();
  const [appraisalData, setAppraisalData] = useState<any>(null);
  const [ticketData, setTicketData] = useState<any>(null);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const appraisal = sessionStorage.getItem("appraisalData");
    const ticket = sessionStorage.getItem("ticketData");
            
            {/* Additional ticket details from Step1/Step2 to show when completed */}
    if (!appraisal || !ticket) {
      toast.error("ไม่พบข้อมูลจากขั้นตอนก่อนหน้า");
      navigate("/");
      return;
    }
    
    setAppraisalData(JSON.parse(appraisal));
    setTicketData(JSON.parse(ticket));
  }, [navigate]);

  const formatMoney = (value: string) => {
    const num = value.replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleSavePayment = () => {
    if (!paymentAmount || parseFloat(paymentAmount.replace(/,/g, "")) <= 0) {
      toast.error("กรุณากรอกจำนวนเงินที่ชำระ");
      return;
    }
    if (!paymentMethod) {
      toast.error("กรุณาเลือกวิธีชำระเงิน");
      return;
    }

    sessionStorage.setItem(
      "paymentData",
      JSON.stringify({
        paymentDate,
        paymentAmount,
        paymentMethod,
      })
    );

    toast.success("บันทึกการชำระเงินสำเร็จ");
    setIsCompleted(true);
  };

  const handleFinish = () => {
    toast.success("สร้างตั๋วจำนำสำเร็จ!", {
      description: "ข้อมูลทั้งหมดได้รับการบันทึกแล้ว",
    });
    sessionStorage.clear();
    navigate("/success");
  };

  const handleSkipAndFinish = () => {
    toast.success("สร้างตั๋วจำนำสำเร็จ!", {
      description: "ข้ามการบันทึกชำระเงินครั้งแรก",
    });
    sessionStorage.clear();
    navigate("/success");
  };

  if (!appraisalData || !ticketData) {
    return null;
  }

  const loanAmount = parseFloat(ticketData.loanAmount.replace(/,/g, ""));
  const paidAmount = paymentAmount
    ? parseFloat(paymentAmount.replace(/,/g, ""))
    : 0;
  const remainingAmount = loanAmount - paidAmount;

  const displayMoney = (v: unknown, fallback = "-") => {
    if (v == null) return fallback;
    const n = Number(String(v).replace(/[^\d.-]/g, "")); // ล้างคอมมา/สัญลักษณ์
    return Number.isFinite(n) ? n.toLocaleString("th-TH") : fallback;
};
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <Stepper steps={steps} currentStep={3} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">บันทึกการชำระเงินครั้งแรก</h1>
          <p className="text-muted-foreground mt-1">
            บันทึกการรับชำระเงินครั้งแรกหรือข้ามไปยังขั้นตอนสุดท้าย
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left - Payment Form */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">รายละเอียดการชำระ</h2>
              <div className="space-y-4">
                <div>
                  <Label>วันที่/เวลา</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(paymentDate, "PPP", { locale: th })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={paymentDate}
                        onSelect={(date) => date && setPaymentDate(date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="paymentAmount">
                    จำนวนเงิน (บาท) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="paymentAmount"
                    placeholder="0.00"
                    value={formatMoney(paymentAmount)}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    disabled={isCompleted}
                  />
                </div>

                <div>
                  <Label htmlFor="paymentMethod">
                    วิธีชำระเงิน <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    disabled={isCompleted}
                  >
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="เลือกวิธีชำระเงิน" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!isCompleted && (
                  <Button onClick={handleSavePayment} className="w-full">
                    บันทึกการชำระเงิน
                  </Button>
                )}

                {isCompleted && (
                  <div className="p-4 bg-success/10 border border-success rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-success">
                        บันทึกการชำระเงินสำเร็จ
                      </p>
                      <p className="text-sm text-muted-foreground">
                        คุณสามารถพิมพ์ใบเสร็จหรือดำเนินการต่อได้
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isCompleted && (
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">ใบเสร็จ</h2>
                <div className="bg-background border rounded-lg p-6 space-y-3">
                  <div className="text-center border-b pb-3">
                    <h3 className="font-bold text-lg">ใบเสร็จรับเงิน</h3>
                    <p className="text-sm text-muted-foreground">
                      #{Math.floor(Math.random() * 100000)}
                    </p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">วันที่</span>
                      <span className="font-medium">
                        {format(paymentDate, "dd/MM/yyyy", { locale: th })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ผู้ชำระ</span>
                      <span className="font-medium">{appraisalData.customer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">อัตราดอกเบี้ย</span>
                      <span className="font-medium">{(ticketData.interestRate)}% / เดือน</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">จำนวนเงิน</span>
                      <span className="font-medium">{displayMoney(paymentAmount)} บาท</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">วิธีชำระ</span>
                      <span className="font-medium">
                        {paymentMethods.find((m) => m.value === paymentMethod)?.label}
                      </span>
                    </div>
                      <div className="flex justify-between">
                      <span className="text-muted-foreground">วันครบกำหนด</span>
                      <span className="font-medium">
                        {format(new Date(ticketData.dueDate), "dd/MM/yyyy")}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Printer className="w-4 h-4 mr-2" />
                      พิมพ์
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      ดาวน์โหลด
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right - Balance Summary */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg border p-6 sticky top-32">
              <h2 className="text-xl font-semibold mb-4">สรุปยอด</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ยอดเงินกู้</p>
                  <p className="text-2xl font-bold">{displayMoney(ticketData?.loanAmount)} บาท</p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-1">ยอดชำระรวม</p>
                  <p className="text-xl font-semibold text-success">
                    {displayMoney(paymentAmount, "0")} บาท
                  </p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-1">คงเหลือ</p>
                  <p className="text-2xl font-bold text-primary">
                    {remainingAmount.toLocaleString()} บาท
                  </p>
                </div>

                <div className="border-t pt-4 text-sm text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>อัตราดอกเบี้ย</span>
                    <span>{ticketData.interestRate}% / เดือน</span>
                  </div>
                  <div className="flex justify-between">
                    <span>วันครบกำหนด</span>
                    <span>
                      {format(new Date(ticketData.dueDate), "dd/MM/yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex justify-between">
          <Button variant="outline" onClick={() => navigate("/step-2")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับ
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSkipAndFinish}>
              ข้ามและเสร็จสิ้น
            </Button>
            <Button onClick={handleFinish} disabled={!isCompleted}>
              <CheckCircle className="w-4 h-4 mr-2" />
              เสร็จสิ้น
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
