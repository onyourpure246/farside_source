# แผนการพัฒนา - การเชื่อมต่อ HR SOAP API (Auto-Provisioning)

## Goal Description
เชื่อมต่อกับระบบ HR Service (SOAP API) ของกรมตรวจบัญชีสหกรณ์ เพื่อตรวจสอบสถานะความเป็นเจ้าหน้าที่ในกรณีที่ยังไม่มีข้อมูลในฐานข้อมูล Local (Database ของระบบ) หากพบว่าบุคคลดังกล่าว (เช็คจากเลขบัตรประชาชน PID) เป็นเจ้าหน้าที่ที่มีสถานะปฏิบัติงานอยู่และดำรงตำแหน่งที่กำหนด (เช่น "นักวิชาการตรวจสอบบัญชี") ระบบจะทำการสร้างบัญชีผู้ใช้ให้อัตโนมัติ (Auto Create) เพื่อให้สามารถเข้าใช้งานผ่าน ThaID ได้ทันทีโดยไม่ต้องรอลงทะเบียน

## User Review Required
> [!IMPORTANT]
> **ข้อมูลทางเทคนิคของ SOAP API**: เพื่อให้การเชื่อมต่อสมบูรณ์ เราจำเป็นต้องทราบข้อมูลเหล่านี้ (ถ้ายังไม่มีตอนนี้ ผมจะทำ Mock Code ไว้ให้ก่อน):
> - **WSDL URL หรือ Endpoint URL ของ Service**
> - **โครงสร้าง Request Body** (ชื่อ Field ต่างๆ ใน XML)
> - **Authentication** (ต้องใช้ Username/Password หรือ Token ในการเรียก API หรือไม่)
> - **Field Mapping** (ชื่อ Field ใน XML Response ที่จะดึงมา map ใส่ firstname, lastname, jobtitle)

## Proposed Changes

### Backend (c:\farside_source)

#### [NEW] [hr.service.ts](file:///c:/farside_source/src/services/hr.service.ts)
สร้าง Class `HRService` สำหรับจัดการการคุยกับ SOAP API
- ฟังก์ชัน `checkEmployee(pid: string)`:
  - สร้าง XML Envelope สำหรับส่ง Request
  - ส่ง HTTP POST ไปยัง HR API
  - แปลงผลลัพธ์จาก XML เป็น JSON
  - ตรวจสอบชื่อตำแหน่ง (jobtitle) ว่าอยู่ในลิสต์ที่อนุญาตหรือไม่
  - Return ข้อมูล User หรือ `null`

#### [MODIFY] [employee.routes.ts](file:///c:/farside_source/src/routes/employee.routes.ts)
ปรับปรุง Logic ที่ Endpoint `POST /verify`:
- **Step 1**: เช็คใน Database Local ก่อน -> ถ้ามี ให้ Return ข้อมูล User (จบ)
- **Step 2** (ถ้าไม่มีใน DB):
  - ส่ง PID ไปเช็คกับ `HRService.checkEmployee(pid)`
  - **ถ้าเจอและตำแหน่งถูกต้อง**:
    - เรียก `AuthService.createUser(...)` เพื่อบันทึกลง Database เราทันที
    - Return ข้อมูล User ที่เพิ่งสร้างใหม่
  - **ถ้าไม่เจอ หรือ ตำแหน่งไม่ถูกต้อง**: Return 404/403 (เข้าใช้งานไม่ได้)

#### [MODIFY] [.env](file:///c:/farside_source/.env)
เพิ่ม Config สำหรับ HR API:
```env
HR_API_URL=https://...
HR_API_USER=...
HR_API_PASS=...
# ตำแหน่งที่อนุญาต (คั่นด้วย comma)
ALLOWED_JOB_TITLES="นักวิชาการตรวจสอบบัญชี,เจ้าพนักงานตรวจสอบบัญชี"
```

#### [MODIFY] [DEVELOPMENT_MANUAL.md](file:///c:/farside_source/DEVELOPMENT_MANUAL.md)
อัปเดตผังการ Authentication (Flow Chart) ในคู่มือ เพื่อให้สะท้อน Logic ใหม่นี้

## Verification Plan

### Automated Tests
- สร้างสคริปต์ `test-hr-integration.ts`:
  - จำลอง (Mock) การตอบกลับของ SOAP API ว่าเจอ user
  - จำลองการตอบกลับว่าไม่เจอ หรือตำแหน่งผิด
  - ทดสอบรันและดูว่า Database มีการ Insert ข้อมูลใหม่อย่างถูกต้องหรือไม่

### Manual Verification
- ทดสอบด้วยการนำ PID ของคนที่มีใน HR แต่ไม่มีในระบบเรา มาลอง Login ผ่านหน้าเว็บ
- ทดสอบด้วยการนำ PID ของคนที่ดำรงตำแหน่งอื่น (ที่ไม่อนุญาต) มาลอง Login (ต้องเข้าไม่ได้)

---

# แผนการพัฒนา - ระบบบันทึกประวัติการใช้งานและข้อผิดพลาด (Universal Audit & Error Log)

## Goal Description
ขยายขอบเขตจากการเก็บแค่ Log การดาวน์โหลด เป็นการเก็บ **"Audit Log"** ของทุกกิจกรรมสำคัญในระบบ (CRUD & Auth) และรวมถึง **"System Error Logs"** (การทำงานผิดพลาด, ระบบล่ม, API ภายนอก Time out) เพื่อให้ทีมพัฒนาและผู้ดูแลระบบสามารถตรวจสอบสาเหตุปัญหาได้ทันที

## Proposed Changes

### Database (schema.sql)
#### [MODIFY] [schema.sql](file:///c:/farside_source/schema.sql)
สร้างตาราง `common_activity_logs` ที่รองรับทั้ง Activity และ Error:
```sql
CREATE TABLE IF NOT EXISTS `common_activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,           -- NULL = Guest/System
  `level` varchar(20) DEFAULT 'INFO',       -- INFO, WARN, ERROR, CRITICAL
  `action` varchar(50) NOT NULL,            -- e.g. LOGIN, DOWNLOAD, SYSTEM_ERROR
  `resource_type` varchar(50) NOT NULL,     -- e.g. FILE, USER, SYSTEM
  `resource_id` varchar(100) DEFAULT NULL,
  `details` text DEFAULT NULL,              -- JSON String or Stack Trace
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `level_idx` (`level`),
  KEY `action_idx` (`action`),
  KEY `created_at_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Backend (c:\farside_source)

#### [NEW] [log.service.ts](file:///c:/farside_source/src/services/log.service.ts)
สร้าง Centralized Log Service:
- Method `logInfo(userId, action, resourceType, resourceId, details, request?)`
- Method `logError(userId, action, error, request?)` -> บันทึก Stack Trace ลง `details`

#### [MODIFY] [Middleware & Global Handlers]
1.  **Global Error Handler (index.ts / app entry point)**:
    - ใช้ `app.onError((err, c) => ...)` ดักจับ Uncaught Exception ทั้งหมด
    - เรียก `LogService.logError` โดยอัตโนมัติ (Level: CRITICAL/ERROR)
2.  **External Service Wrapper**:
    - ใน `hr.service.ts`, `thaid-service.ts`: ใส่ Try-Catch ครอบการยิง API
    - ถ้า Connection Failed / Timeout -> `LogService.logError` (Level: WARN/ERROR)

#### [MODIFY] [Service Integration Points]
- **Previous scope**: Auth, Download, User Mgmt (ใช้ `logInfo`)
- **New scope**: System crashes, DB Connection errors (ใช้ `logError` ผ่าน Global Handler)

## Verification Plan

### Automated Tests
- **Test Error Logging**: สร้าง Route ที่ `throw new Error('Test Crash')` แล้วยิงเข้าไป
- ตรวจสอบ DB ว่ามี Record `level='ERROR'` และ `details` มี Stack Trace ของ 'Test Crash'

### Manual Verification
- ทดสอบตัดเน็ต แล้วกด Verify HR (เพื่อจำลอง External API Error)
- ตรวจสอบ DB ว่าเก็บ Log Error Connection Failed หรือไม่



