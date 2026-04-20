# API และการใช้งาน (API Reference)

เอกสารหน้านี้รวบรวมรายละเอียดของ API Endpoints ทั้งหมดที่มีอยู่ใน CASDU Far-Side API
Base URL ของระบบตั้งต้นที่: `http://localhost:24991/casdu_cdm_backend`

## การเชื่อมต่อกับ API

ทุก Request ที่ถูกล็อกไว้และต้องการการป้องกัน จะต้องแนบ **Header** ดังนี้:

```json
{
  "Authorization": "Bearer <TOKEN>",
  "Content-Type": "application/json"
}
```
* `<TOKEN>` สามารถเป็น **JWT Token** ของหน้างานผู้ใช้ หรือเป็นค่า **AUTH_SECRET** กรณีเป็นการส่งรหัสระบบต่อระบบ (System-to-system)

---

## 1. Authentication Endpoints

เส้นทาง API สำหรับการจัดการระบบสมาชิก

*   `POST /api/fy2569/auth/login`: เข้าสู่ระบบและรับ JWT Token
*   `POST /api/fy2569/auth/register`: ลงทะเบียนผู้ใช้ใหม่สู่ระบบ
*   `GET /api/fy2569/auth/me`: ดึงข้อมูลโปรไฟล์ของบัญชีผู้ใช้ปัจจุบันที่กำลัง Login
*   `PUT /api/fy2569/auth/profile`: แก้ไขข้อมูลส่วนตัว
*   `PUT /api/fy2569/auth/password`: เปลี่ยนรหัสผ่านของผู้ใช้
*   `GET /api/fy2569/auth/users`: สำหรับผู้ดูแล เพื่อพิมพ์รายชื่อผู้ใช้ทั้งหมด
*   `DELETE /api/fy2569/auth/users/:id`: ปิดหรือลบบัญชีผู้ใช้เป้าหมาย

## 2. Commons Endpoints 

เส้นทางสำหรับข้อมูลพื้นฐานที่ใช้ร่วมกัน

### 2.1. ผู้ร่วมปฏิบัติงาน (Participants)
*   `GET /api/fy2569/commons/participants`
*   `GET /api/fy2569/commons/participants/:id`
*   `POST /api/fy2569/commons/participants`
*   `PUT /api/fy2569/commons/participants/:id`
*   `DELETE /api/fy2569/commons/participants/:id`

### 2.2. ป้ายกำกับ (Tags)
*   `GET, POST, PUT, DELETE /api/fy2569/commons/tags` และ `/tags/:id`

## 3. Planner Endpoints

ระบบแผนงาน สำหรับการจัดการหน้า Project และ Task ย่อย

*   `GET, POST, PUT, DELETE /api/fy2569/planner/projects` (และ `/:id`): จัดการข้อมูลโครงการใหญ่
*   `GET, POST, PUT, DELETE /api/fy2569/planner/tasks` (และ `/:id`): จัดการกิจกรรมย่อย
*   `GET, POST, DELETE /api/fy2569/planner/task-participants`: จัดการผูกบุคคลที่จะรับผิดชอบเข้ากับชื่อกิจกรรม

## 4. Download System Endpoints

ระบบบริหารจัดการไฟล์ (แนบไฟล์, โฟลเดอร์ต้นทาง, อัพโหลด)

### 4.1. โครงสร้างโฟลเดอร์ (Folders)
*   `GET /api/fy2569/dl/folder/:id`: ดึงข้อมูลโฟลเดอร์
*   `GET /api/fy2569/dl/folder/:id/contents`: ดึงข้อมูลไฟล์และโฟลเดอร์ย่อยข้างในทั้งหมด
*   `POST /api/fy2569/dl/folder`: สร้างโฟลเดอร์ใหม่
*   `PUT /api/fy2569/dl/folder/:id`: เปลี่ยนชื่อหรือแก้ไข Metadata โฟลเดอร์
*   `DELETE /api/fy2569/dl/folder/:id`: ลบโฟลเดอร์ออกจากระบบ

### 4.2. จัดการไฟล์ (Files)
*   `GET /api/fy2569/dl/file/:id`: ดึงสถานะและ Metadata ของไฟล์เป้าหมาย
*   `GET /api/fy2569/dl/file/:id/download`: รับ File Stream สำหรับให้ Browser โหลด
*   `POST /api/fy2569/dl/file/upload`: ใช้สำหรับสร้างและอัพโหลดไฟล์จากฐาน FormData ระบบจะเขียนไฟล์ซิงค์ไปที่ File System Storage บนเครื่องตั้งค่า `FILE_UPLOAD_PATH` ใน `.env`
*   `PUT /api/fy2569/dl/file/:id`: แก้ไข Metadata ของไฟล์ (เช่น แจ้งเปลี่ยนชื่อ หรือแจ้งอัพเดท Version)
*   `DELETE /api/fy2569/dl/file/:id`: ลบไฟล์ทิ้งทั้งทางฐานข้อมูลและลบจากพื้นที่บนดิสก์
