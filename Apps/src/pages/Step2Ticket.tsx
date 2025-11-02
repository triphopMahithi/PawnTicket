import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye } from "lucide-react";
import { Stepper } from "@/components/Stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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

export default function Step2Ticket() {
  const navigate = useNavigate();
  const [appraisalData, setAppraisalData] = useState<any>(null);
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("3.00");
  const [contractDate, setContractDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [noticeDate, setNoticeDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const data = sessionStorage.getItem("appraisalData");
    if (!data) {
      toast.error("ไม่พบข้อมูลจากขั้นตอนที่ 1");
      navigate("/");
      return;
    }
    setAppraisalData(JSON.parse(data));
  }, [navigate]);

  const formatMoney = (value: string) => {
    const num = value.replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleNext = () => {
    if (!loanAmount || parseFloat(loanAmount.replace(/,/g, "")) <= 0) {
      toast.error("กรุณากรอกจำนวนเงินกู้");
      return;
    }
    if (!interestRate || parseFloat(interestRate) < 0 || parseFloat(interestRate) > 100) {
      toast.error("กรุณากรอกอัตราดอกเบี้ย 0-100%");
      return;
    }
    if (!dueDate) {
      toast.error("กรุณาเลือกวันครบกำหนด");
      return;
    }
    if (dueDate <= contractDate) {
      toast.error("วันครบกำหนดต้องหลังจากวันทำสัญญา");
      return;
    }

    const appraisedValue = parseFloat(appraisalData.appraisedValue.replace(/,/g, ""));
    const loanValue = parseFloat(loanAmount.replace(/,/g, ""));
    
    if (loanValue > appraisedValue * 0.9) {
      toast.warning("จำนวนเงินกู้สูงกว่า 90% ของมูลค่าประเมิน");
    }

    sessionStorage.setItem(
      "ticketData",
      JSON.stringify({
        loanAmount,
        interestRate,
        contractDate,
        dueDate,
        noticeDate,
        notes,
      })
    );

    toast.success("บันทึกข้อมูลตั๋วสำเร็จ");
    navigate("/step-3");
  };

  if (!appraisalData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <Stepper steps={steps} currentStep={2} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">ออกตั๋วจำนำ</h1>
            <p className="text-muted-foreground mt-1">
              กำหนดเงื่อนไขสัญญาและรายละเอียดการจำนำ
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                ดูตัวอย่างตั๋ว
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>ตัวอย่างตั๋วจำนำ</DialogTitle>
              </DialogHeader>
              <div className="bg-background border rounded-lg p-6 space-y-4">
                <div className="text-center border-b pb-4">
                  <h2 className="text-2xl font-bold">ตั๋วจำนำ</h2>
                  <p className="text-sm text-muted-foreground">
                    เลขที่ #{Math.floor(Math.random() * 100000)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">ชื่อลูกค้า</p>
                    <p className="font-medium">{appraisalData.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">เลขบัตรประชาชน</p>
                    <p className="font-medium">{appraisalData.customer.nationalId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ประเภททรัพย์</p>
                    <p className="font-medium">{appraisalData.itemType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">มูลค่าประเมิน</p>
                    <p className="font-medium">{appraisalData.appraisedValue} บาท</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">จำนวนเงินกู้</p>
                    <p className="font-medium text-primary text-lg">{loanAmount || "0"} บาท</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">อัตราดอกเบี้ย</p>
                    <p className="font-medium">{interestRate}% ต่อเดือน</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">วันทำสัญญา</p>
                    <p className="font-medium">
                      {format(contractDate, "dd/MM/yyyy", { locale: th })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">วันครบกำหนด</p>
                    <p className="font-medium">
                      {dueDate ? format(dueDate, "dd/MM/yyyy", { locale: th }) : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">รายละเอียดสัญญา</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="loanAmount">
                    จำนวนเงินกู้ (บาท) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="loanAmount"
                    placeholder="0.00"
                    value={formatMoney(loanAmount)}
                    onChange={(e) => setLoanAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    มูลค่าประเมิน: {appraisalData.appraisedValue} บาท
                  </p>
                </div>

                <div>
                  <Label htmlFor="interestRate">
                    อัตราดอกเบี้ย (% ต่อเดือน) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="3.00"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                  />
                </div>

                <div>
                  <Label>
                    วันทำสัญญา <span className="text-destructive">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(contractDate, "PPP", { locale: th })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={contractDate}
                        onSelect={(date) => date && setContractDate(date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>
                    วันครบกำหนด <span className="text-destructive">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? (
                          format(dueDate, "PPP", { locale: th })
                        ) : (
                          <span>เลือกวันที่</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        disabled={(date) => date <= contractDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground mt-1">
                    ต้องหลังจากวันทำสัญญา
                  </p>
                </div>

                <div>
                  <Label>วันแจ้งเตือน (ไม่บังคับ)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !noticeDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {noticeDate ? (
                          format(noticeDate, "PPP", { locale: th })
                        ) : (
                          <span>เลือกวันที่</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={noticeDate}
                        onSelect={setNoticeDate}
                        disabled={(date) =>
                          date <= contractDate || (dueDate && date >= dueDate)
                        }
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="notes">หมายเหตุ</Label>
                  <Textarea
                    id="notes"
                    placeholder="ระบุข้อมูลเพิ่มเติม..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg border p-6 sticky top-32">
              <h2 className="text-xl font-semibold mb-4">สรุปข้อมูล</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">สถานะ</span>
                  <Badge>กำลังดำเนินการ</Badge>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">ข้อมูลลูกค้า</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ชื่อ</span>
                      <span className="font-medium">{appraisalData.customer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">เบอร์</span>
                      <span className="font-medium">{appraisalData.customer.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">ข้อมูลทรัพย์</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ประเภท</span>
                      <span className="font-medium">{appraisalData.itemType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">มูลค่าประเมิน</span>
                      <span className="font-medium">{appraisalData.appraisedValue} บาท</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">หลักฐาน</span>
                      <span className="font-medium">{appraisalData.filesCount} ไฟล์</span>
                    </div>
                  </div>
                </div>

                {loanAmount && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-2">การคำนวณ</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">เงินกู้</span>
                        <span className="font-medium">{loanAmount} บาท</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">อัตราดอกเบี้ย</span>
                        <span className="font-medium">{interestRate}% / เดือน</span>
                      </div>
                      {dueDate && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">ระยะเวลา</span>
                            <span className="font-medium">
                              {Math.ceil(
                                (dueDate.getTime() - contractDate.getTime()) /
                                  (1000 * 60 * 60 * 24 * 30)
                              )}{" "}
                              เดือน
                            </span>
                          </div>
                          <div className="flex justify-between text-primary font-semibold">
                            <span>ดอกเบี้ยโดยประมาณ</span>
                            <span>
                              {(
                                (parseFloat(loanAmount.replace(/,/g, "")) *
                                  parseFloat(interestRate) *
                                  Math.ceil(
                                    (dueDate.getTime() - contractDate.getTime()) /
                                      (1000 * 60 * 60 * 24 * 30)
                                  )) /
                                100
                              ).toLocaleString()}{" "}
                              บาท
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex justify-between">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับ
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
