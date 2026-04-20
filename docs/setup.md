# การติดตั้งและตั้งค่า (Setup Guide)

เอกสารนี้จะอธิบายขั้นตอนการนำ CASDU Far-Side API (Backend) มาตั้งค่าและรันในเครื่องคอมพิวเตอร์ของคุณ

## สิ่งที่ต้องมี (Prerequisites)

ก่อนเริ่มการติดตั้ง กรุณาตรวจสอบว่าเครื่องของคุณมีซอฟต์แวร์เหล่านี้หรือไม่:
*   **Node.js**: เวอร์ชั่น 18 ขึ้นไป
*   **MySQL**: เวอร์ชั่น 8.0 ขึ้นไป
*   **npm** หรือ **yarn** สำหรับจัดการ dependencies

## ขั้นตอนการติดตั้ง (Installation Steps)

### 1. โคลนและติดตั้ง Dependencies (Clone & Install)

เปิด Terminal แล้วเข้าไปยังโฟลเดอร์ของโปรเจกต์ จากนั้นรัน:
```bash
cd casdu_farside
npm install
```

### 2. การตั้งค่า Environment Variables

สคริปต์และ API ทั้งหมดต้องการค่าติดตั้งจากไฟล์ `.env`
ให้ทำการคัดลอกไฟล์ตัวอย่างไปสร้างเป็นไฟล์ `.env` สำหรับเครื่องของคุณ:

```bash
cp .env.example .env
```

จากนั้นใช้ Code Editor แก้ไขไฟล์ `.env` โดยระบุข้อมูลให้ถูกต้อง:
```env
# ตั้งค่า Database (ตัวอย่าง)
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=casdu_cdm

# ตั้งค่าเส้นทางพาธสำหรับเก็บไฟล์ที่อัพโหลดเข้ามาในระบบ
FILE_UPLOAD_PATH=/path/to/upload/directory

# ตั้งค่ารหัสลับสำหรับ Authentication (ต้องแก้ไขตอนนำขึ้น Production)
AUTH_SECRET=your-auth-secret-key-change-in-production
JWT_SECRET=your-jwt-secret-key-must-be-long-and-random-change-in-production

# ตั้งค่า Server Port รูปแบบการทำงาน
PORT=24991
NODE_ENV=development
```

### 3. เตรียมฐานข้อมูลและพื้นที่อัพโหลด (Database & Storage)

*   **สร้างฐานข้อมูล (Database)**: สร้างฐานข้อมูลใน MySQL ตามชื่อที่คุณกำหนดใน `DB_NAME` รันคำสั่ง SQL ภายในโฟลเดอร์ `migrations/` เพื่อเตรียมโครงสร้างตารางข้อมูล
*   **สร้างพื้นที่เก็บไฟล์ (Storage)**: สร้าง Directory เปล่าบนเครื่องเซิร์ฟเวอร์เพื่อให้ระบบเขียนไฟล์ลงไปได้:
```bash
mkdir -p /path/to/upload/directory
chmod 755 /path/to/upload/directory
```

### 4. การรันโปรเจกต์แบบนักพัฒนา (Development)

เมื่อตั้งค่าทุกอย่างเสร็จสิ้นแล้ว สามารถรันโปรเจกต์ในโหมด Development (ระบบจะรีเฟรชเองหากมีการแก้ไขโค้ด) ด้วยคำสั่ง:
```bash
npm run dev
```

ตรวจสอบการทำงานเบื้องต้นโดยเปิดเบราว์เซอร์ไปที่:
`http://localhost:24991/casdu_cdm_backend/health`
