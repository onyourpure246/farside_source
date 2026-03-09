# สถาปัตยกรรมระบบ (System Architecture)

ระบบ **CASDU Far-Side API** เป็น Backend Server แบบ Standalone ที่มุ่งเน้นความเร็วและใช้ทรัพยากรที่เหมาะสม

## ภาพรวม (Overview)

1. **Backend Framework**: ทำงานบน **Hono Framework** ร่วมกับรันไทม์ Node.js (`@hono/node-server`) เพื่อสร้าง RESTful API
2. **Database**: ใช้ **MySQL** แบบ Relational Database สำหรับจัดการข้อมูล User, งานโครงการ และไฟล์
3. **Storage Mechanism**: ใช้ **File System Storage** สำหรับจัดเก็บไฟล์ที่อัพโหลดเอาไว้บนเครื่องเซิร์ฟเวอร์โดยตรง (ไม่ใช้บริการ External Storage เช่น AWS S3 หรือ Cloudflare R2)

## โครงสร้างโปรเจกต์ (Project Structure)

```
casdu_farside/
├── src/
│   ├── index.ts              # จุดเริ่มต้นการทำงานของแอปพลิเคชัน (Main entry point)
│   ├── types.ts              # ไฟล์กำหนดชนิดข้อมูล TypeScript
│   ├── middleware/           # ฟังก์ชันสำหรับการจัดการข้อมูลก้อนกลาง (Middlewares)
│   │   ├── auth.middleware.ts      # ตรวจสอบสิทธิ์และ JWT 
│   │   ├── cors.middleware.ts      # การอนุญาต Cross-Origin Resource Sharing
│   │   └── dual-auth.middleware.ts # บริหารจัดการ Token สองรูปแบบ (User / System)
│   ├── routes/               # เส้นทางการเรียก API (Controller)
│   │   ├── auth.routes.ts
│   │   ├── commons.routes.ts
│   │   ├── planner.routes.ts
│   │   └── download.routes.ts
│   └── services/             # โลจิกฝั่ง Business logic และการเชื่อมต่อฐานข้อมูล
│       ├── database.service.ts
│       ├── file-storage.service.ts # ควบคุมการเขียน/อ่านไฟล์จาก Disk
│       ├── auth.service.ts
│       └── ...
```

## เทคโนโลยีที่ใช้ (Tech Stack)

*   **Framework**: [Hono](https://hono.dev/)
*   **Language**: TypeScript
*   **Database**: MySQL v8.0 หรือสูงกว่า
*   **Authentication**: [JWT (JSON Web Tokens)](https://jwt.io/) และการเข้ารหัสรหัสผ่านด้วย `bcrypt`

## กระบวนการยืนยันตัวตน (Authentication Flow)

ระบบออกแบบมาให้รองรับการเข้าถึงจาก 2 ส่วนคือผู้ใช้ และระหว่างระบบ (Dual Authentication):

1. **User JWT Token (สำหรับผู้ใช้งานเข้าสู่ระบบ)**
   * ผู้ใช้ส่งคำขอเข้าสู่ระบบ (ผ่าน Username/Password) ไปยังแอปพลิเคชัน
   * หากรหัสผ่านถูกต้อง Backend จะออก JWT คืนไปให้
   * นำ JWT มาแนบเป็น `Authorization: Bearer <JWT_TOKEN>` ในคำขอรอบอื่นๆ

2. **Technical Bearer Token (สำหรับ Machine-to-Machine)**
   * ใช้สำหรับการเข้าถึงโดยระบบภายนอก หรือ Server อื่น
   * ส่งค่าที่ระบุใน `.env` ยืนยันเป็น `Authorization: Bearer <AUTH_SECRET>`
