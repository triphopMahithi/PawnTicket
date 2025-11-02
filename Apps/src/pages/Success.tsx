import { CheckCircle, Home, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Success() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-success/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>
        
        <h1 className="text-3xl font-bold mb-3">สร้างตั๋วจำนำสำเร็จ!</h1>
        <p className="text-muted-foreground mb-8">
          ข้อมูลทั้งหมดได้รับการบันทึกเรียบร้อยแล้ว
          คุณสามารถดูรายละเอียดหรือสร้างตั๋วใหม่ได้
        </p>

        <div className="bg-card rounded-lg border p-6 mb-6 text-left">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold">สรุปรายการ</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">สถานะ</span>
              <span className="font-medium text-success">สำเร็จ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">เลขที่ตั๋ว</span>
              <span className="font-medium">#{Math.floor(Math.random() * 100000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">วันที่สร้าง</span>
              <span className="font-medium">
                {new Date().toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate("/")} className="w-full">
            <Home className="w-4 h-4 mr-2" />
            กลับหน้าหลัก
          </Button>
          <Button variant="outline" onClick={() => navigate("/")} className="w-full">
            สร้างตั๋วจำนำใหม่
          </Button>
        </div>
      </div>
    </div>
  );
}
