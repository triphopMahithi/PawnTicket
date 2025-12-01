# PawnTicket

**PawnTicket** เป็นระบบเว็บไซต์สำหรับโรงรับจำนำที่ออกแบบโดยใช้ **SQL** สำหรับฐานข้อมูลและ **Lovable.ai** สำหรับการออกแบบดีไซน์ เว็บไซต์มีฟังก์ชันหลักดังนี้:

### ฟังก์ชันหลัก:
1. **กรอกข้อมูลลูกค้า**: สำหรับการเก็บข้อมูลของลูกค้าที่มาใช้บริการ
2. **ประเมินสินทรัพย์**: สามารถประเมินสินทรัพย์ที่นำมาจำนำได้ พร้อมเก็บข้อมูลผู้ประเมินและสินทรัพย์ที่ประเมิน
3. **สร้างสัญญาการกู้ยืม**: สร้างรายละเอียดสัญญาการกู้ยืม เช่น จำนวนเงินกู้ วันครบกำหนด วันแจ้งเตือน เป็นต้น

### ฟังก์ชันสำหรับหลังบ้าน (พนักงาน):
1. **แก้ไขข้อมูลบนฐานข้อมูล**: ผ่านหน้าเว็บไซต์
2. **ปรับเปลี่ยนสถานะสินทรัพย์**: เช่น สถานะหลุดจำนำ หรือขายทอดตลาด

ระบบใช้ **JavaScript** (.js) สำหรับการออกแบบดีไซน์และการทำงานของหลังบ้านผ่าน **API** โดยใช้โครงสร้างแบบ **routing** เพื่อให้ง่ายต่อการจัดการในอนาคตเมื่อโปรเจ็กต์ขยายขนาดขึ้น

---

## Installation

### 1. Clone the repository
เริ่มต้นโดยการ clone โปรเจ็กต์ไปยังเครื่องของคุณ:
```bash
git clone https://github.com/triphopMahithi/PawnTicket.git
cd PawnTicket
```
### 2. Frontend Setup (Development)
ทำการติดตั้ง dependencies ที่จำเป็นสำหรับ frontend:
```
# ติดตั้ง dependencies ที่จำเป็น
npm install

# รันเซิร์ฟเวอร์ frontend สำหรับการพัฒนา
npm run dev
```

### 3. Backend Setup
```bash
cd PawnTicket/backend
```
แก้ไขไฟล์ .env ให้สอดคล้องกับ MySQL 
```.env
MYSQL_HOST='<your-database-host>'
MYSQL_USER='<your-database-user>'
MYSQL_PASSWORD='<your-database-password>'
MYSQL_DATABASE='<your-database-name>'
HOST_DOMAIN='<your-domain>'
PORT='3001'
```
สุดท้ายเราจึงจะทำการรันส่วนของหลังบ้าน
```bash
node server.js
```
---

## Credit

- ขอบคุณ **Lovable.ai** สำหรับการช่วยพัฒนาและออกแบบส่วนต่าง ๆ ของโปรเจ็กต์
- เว็บไซต์ของ Lovable.ai: [https://www.lovable.ai](https://www.lovable.ai)


