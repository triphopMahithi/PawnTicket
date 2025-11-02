import { Plus, FileText, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">ระบบจัดการโรงรับจำนำ</h1>
              <p className="text-xs text-muted-foreground">Pawn Shop Management</p>
            </div>
          </div>
          <Button onClick={() => navigate("/step-1")}>
            <Plus className="w-4 h-4 mr-2" />
            สร้างตั๋วจำนำใหม่
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            จัดการธุรกิจจำนำอย่างมืออาชีพ
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            ระบบครบวงจรสำหรับการจัดการโรงรับจำนำ ตั้งแต่การประเมินทรัพย์
            ออกตั๋วจำนำ จนถึงการบันทึกการชำระเงิน
          </p>
          <Button size="lg" onClick={() => navigate("/step-1")}>
            <Plus className="w-5 h-5 mr-2" />
            เริ่มต้นสร้างตั๋วจำนำ
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-1">3 ขั้นตอน</h3>
            <p className="text-sm text-muted-foreground">สร้างตั๋วจำนำง่าย ๆ</p>
          </div>
          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-success" />
            </div>
            <h3 className="text-2xl font-bold mb-1">จัดการลูกค้า</h3>
            <p className="text-sm text-muted-foreground">ค้นหาและสร้างข้อมูลลูกค้า</p>
          </div>
          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-2xl font-bold mb-1">ติดตามสถานะ</h3>
            <p className="text-sm text-muted-foreground">ดูสถานะและการชำระเงิน</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">ฟีเจอร์หลัก</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card rounded-lg border p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    ระบุตัวตนและประเมินทรัพย์
                  </h3>
                  <p className="text-muted-foreground">
                    ค้นหาหรือสร้างข้อมูลลูกค้า เลือกผู้ประเมิน กรอกรายละเอียดทรัพย์
                    และอัพโหลดหลักฐานรูปภาพ
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">ออกตั๋วจำนำ</h3>
                  <p className="text-muted-foreground">
                    กำหนดจำนวนเงินกู้ อัตราดอกเบี้ย วันทำสัญญา และวันครบกำหนด
                    พร้อมตัวอย่างตั๋วให้ดูก่อนสร้าง
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">บันทึกการชำระเงิน</h3>
                  <p className="text-muted-foreground">
                    บันทึกการรับชำระเงินครั้งแรก เลือกวิธีการชำระ
                    และสร้างใบเสร็จรับเงินอัตโนมัติ
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    ระบบอัตโนมัติและสะดวก
                  </h3>
                  <p className="text-muted-foreground">
                    ระบบบันทึกแบบร่างอัตโนมัติ Validation
                    ครบถ้วน และแสดงสรุปข้อมูลแบบ real-time
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-12 text-center text-primary-foreground">
          <h2 className="text-4xl font-bold mb-4">พร้อมเริ่มต้นใช้งานแล้วหรือยัง?</h2>
          <p className="text-lg mb-8 opacity-90">
            สร้างตั๋วจำนำแรกของคุณในเพียง 3 ขั้นตอนง่าย ๆ
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/step-1")}
          >
            <Plus className="w-5 h-5 mr-2" />
            สร้างตั๋วจำนำเลย
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 ระบบจัดการโรงรับจำนำ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
