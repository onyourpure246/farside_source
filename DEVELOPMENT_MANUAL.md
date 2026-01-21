# คู่มือมาตรฐานการพัฒนา Web Application (Development Manual)

เอกสารฉบับนี้จัดทำขึ้นเพื่อเป็น **Technical Specification & Development Guideline** สำหรับการพัฒนาและดูแลรักษา Web Application "Resource Center" ของกลุ่มพัฒนาระบบตรวจสอบบัญชีคอมพิวเตอร์ เนื้อหาครอบคลุมตั้งแต่แนวคิดการออกแบบ สถาปัตยกรรมระบบ จนถึงมาตรฐานในการ Deployment และ Maintenance

---

## 1. ภาพรวมโครงการ (Project Overview)
**Resource Center** คือศูนย์รวมข้อมูล เอกสาร และเครื่องมือสำหรับเจ้าหน้าที่กลุ่มพัฒนาระบบตรวจสอบบัญชีคอมพิวเตอร์ (CAD) มุ่งเน้นการใช้งานที่ง่าย สะอาดตา และมีความทันสมัย
- **Target Audience**: เจ้าหน้าที่ภายในองค์กร (Intranet/Internal Use)
- **Key Features**:
  - **Document Repository**: ระบบจัดเก็บและดาวน์โหลดไฟล์เอกสารคู่มือต่างๆ
  - **Announcements**: ระบบแจ้งข่าวสารประชาสัมพันธ์
  - **Authentication**: ยืนยันตัวตนผ่าน **ThaID** (Digital ID) และตรวจสอบสิทธิ์พนักงานผ่าน Internal API

---

## 2. สถาปัตยกรรมและข้อตกลง (Architecture & Conventions)

### 2.1 Architecture Pattern
โครงการใช้สถาปัตยกรรมแบบ **Modular Monolith** บน **Next.js App Router** โดยเน้นการแยกส่วนตาม Feature (Feature-based) และมีการเชื่อมต่อกับ External Systems

-   **Frontend as a Gateway**: Next.js ทำหน้าที่เป็น Frontend และ API Gateway (BFF - Backend for Frontend) ในตัว
-   **Helper Services (`lib/`)**: แยก Logic การติดต่อกับ External Services ออกเป็น Modules ชัดเจน
    -   `thaid-service.ts`: จัดการ OAuth/OIDC Flow กับ ThaID
    -   `backend-api-mock.ts`: ตัวจำลอง (และ Interface จริงในอนาคต) สำหรับตรวจสอบสถานะพนักงาน
-   **Server Actions**: ใช้สำหรับ Logic การจัดการข้อมูล (Mutations) และ Proxy Requests ไปยัง Backend API หลัก เพื่อความปลอดภัย (Hide API Tokens server-side)

### 2.2 Authentication Flow (Custom Provider)
ระบบใช้ **Auth.js (NextAuth v5)** ในรูปแบบ **Custom Credentials Provider** เพื่อรองรับ Flow พิเศษ:
1.  **Frontend**: รับ `code` จากการ Redirect ของ ThaID
2.  **NextAuth (Authorize)**: นำ `code` ไปแลก Token และดึงข้อมูลบัตรประชาชน (PID) ผ่าน `thaid-service`
3.  **Verification**: นำ PID ที่ได้ ไปตรวจสอบกับ Internal DB ผ่าน `backend-api-mock` (หรือ Real API) ว่าเป็นพนักงานปัจจุบันหรือไม่
4.  **Session Creation**: สร้าง Session โดยผูกข้อมูล `PID`, `Role`, `Name` เข้ากับ User Session

### 2.3 Styling & UI Pattern
-   **Framework**: Tailwind CSS v4 (Engine ใหม่ เร็วกว่าเดิม)
-   **Animation**: `framer-motion` สำหรับ Interaction ที่ซับซ้อน และ `tw-animate-css` สำหรับ CSS Keyframes พื้นฐาน
-   **Design System**: ใช้ OKLCH Color Space เพื่อความสดใสและรองรับ Dark Mode อย่างสมบูรณ์

---

## 3. เทคโนโลยีที่ใช้ (Technology Stack)

### Core Framework
-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Language**: TypeScript (Strict Mode)
-   **Runtime**: Node.js (Latest LTS recommended)

### UI & UX
-   **Library**: [React 19](https://react.dev/)
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
-   **Components**: 
    -   [Radix UI](https://www.radix-ui.com/) (Headless Primitives)
    -   [Shadcn UI](https://ui.shadcn.com/) (Component Base)
    -   [Sonner](https://sonner.emilkowal.ski/) (Toast Notifications)
    -   [Vaul](https://vaul.emilkowal.ski/) (Drawer)
-   **Icons**: [Lucide React](https://lucide.dev/) (Primary), [@mui/icons-material](https://mui.com/) (Secondary/Dynamic)

### Backend Integration & State
-   **Auth**: [Auth.js (NextAuth v5)](https://authjs.dev/)
-   **Validation**: [Zod](https://zod.dev/)
-   **Data Fetching**: Native `fetch` with Server Actions

---

## 4. โครงสร้างไฟล์ (Project Structure)
```
.
├── actions/                  # Server Actions (Backend Proxy Logic)
│   ├── folder-actions.ts     # Manage Folders (Proxies to External API)
│   ├── file-actions.ts       # Manage Files
│   └── ...
├── app/                      # Next.js App Router
│   ├── admin/                # Admin Routes (Protected)
│   ├── api/                  # API Routes (Auth Handlers)
│   ├── auth/                 # Auth Callback Pages
│   ├── downloads/            # Public/User Routes
│   ├── login/                # Login Page
│   └── ...
├── components/               # React Components
│   ├── Admin/                # Admin-specific Components
│   ├── DownloadsPage/        # User-facing Components
│   └── ...
├── lib/                      # Business Logic & Service Integrations
│   ├── thaid-service.ts      # ThaID API Integration
│   ├── backend-api-mock.ts   # Internal Employee API Interface
│   └── utils.ts              # Helper Functions
├── types/                    # TypeScript Entities
├── auth.config.ts            # Auth.js Configuration
├── middleware.ts             # Route Protection Middleware
├── next.config.ts            # Next.js Config
└── package.json
```

---

## 5. การตั้งค่า Environment Variables (.env.local)

โปรเจคนี้ต้องการ Environment Variables จำนวนมากสำหรับการเชื่อมต่อ External Services **ห้าม** Commit ไฟล์ `.env.local` ขึ้น Git

### General Config
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000   # URL ของหน้าเว็บ
AUTH_SECRET=...                             # Generate using: npx auth secret
```

### External API (Resource Backend : casdu-farside)
```env
# URL ของ Backend ที่รันในเครื่อง Local (Port 64197)
API_URL=http://localhost:64197/api/fy2569

# Service Token (ต้องตรงกับ AUTH_SECRET ใน .env ของ Backend)
API_TOKEN=dev-secret-key-change-in-production
```

### ThaID Service (Identity Provider)
```env
THAID_TOKEN_URL=https://...                 # URL สำหรับแลก Access Token
THAID_USERINFO_URL=https://...              # URL สำหรับดึงข้อมูลผู้ใช้
THAID_BASIC_TOKEN=...                       # Basic Auth Token สำหรับ Client Credentials
THAID_API_KEY=...                           # (Optional) API Key ถ้ามี require
```

### Internal Employee Verification
```env
# ถ้าใช้ Real Mode ใน backend-api-mock.ts
EMPLOYEE_API_URL=https://...
EMPLOYEE_API_KEY=...
```

---

## 6. การ Run และ Deploy (Operations)

### 6.1 Development Mode
รันโปรเจคในเครื่อง Local:
```bash
npm run dev
# หรือ next dev --turbo (ถ้าต้องการใช้ Turbopack)
```
**Mock Mode**:
-   ใน `dev` mode: สามารถกรอก Code `TEST_ADMIN` ในหน้า Login เพื่อข้ามการเชื่อมต่อ ThaID ของจริงและ Login เป็น Admin ได้ทันที (ตั้งค่าใน `lib/thaid-service.ts`)

### 6.2 Building for Production
โปรเจคนี้ Generate เป็น Standalone Application:
```bash
npm run build
npm start
```
*Note: ตรวจสอบให้แน่ใจว่า `next.config.ts` เปิด `output: 'standalone'` หากต้องการนำไป Deploy บน Docker/Container*

### 6.3 Security Checklist ก่อน Deploy
-   [ ] ตรวจสอบ `API_TOKEN` ว่าไม่ใช่ของ Dev Environment
-   [ ] ปิด Mock Logic ใน `lib/thaid-service.ts` หรือ `backend-api-mock.ts` (หากมีการ Hardcode ไว้)
-   [ ] ตั้งค่า `AUTH_TRUST_HOST=true` หาก Deploy หลัง Reverse Proxy

---

## 7. Data Model Concept (Frontend View)

เนื่องจาก Frontend ต่อกับ API ภายนอก Data Model จึงอิงตาม Response ของ API เป็นหลัก:

-   **Folder (Virtual Folder)**:
    *   **Concept**: เป็นเพียง Metadata ใน Database เพื่อจัดหมวดหมู่ ไม่มีการสร้าง Folder จริงบน Disk
    *   **Structure**: Recursive (มี `parent_id` ชี้หา Folder แม่)
    *   **UI Properties**: มี `mui_colour` และ `mui_icon` สำหรับการแสดงผล Custom Icon
    *   **Note**: การย้าย Folder/File เพียงแค่แก้ ID ใน Database ไม่ต้องย้ายไฟล์จริง
-   **File**:
    -   เก็บ Physical Path หรือ Link จริงไว้ที่ Backend
    -   Frontend รับรู้เพียง Metadata (Name, Size, Type) และ ID สำหรับสั่ง Download
-   **User (Session)**:
    -   `id`: PID (เลขบัตรประชาชน)
    -   `role`: 'admin' | 'user' (ได้จากการ Verify Role ผ่าน API)

---

## 8. Development Guidelines พัฒนาเพิ่มเติม

### การเพิ่มหน้าใหม่ (New Page)
1.  สร้าง Folder ใน `app/` โดยใช้ชื่อ `kebab-case`
2.  สร้าง `page.tsx`
3.  หากต้องการ Client Interactivity ให้ใส่ `'use client'` บรรทัดแรก
4.  หากต้องการดึงข้อมูล ให้สร้าง Function ใน `actions/` และเรียกใช้แบบ Async ใน Server Component (`page.tsx`)

### การเพิ่ม Action (Mutation)
1.  สร้าง Function ใน `actions/` พร้อมระบุ `'use server'`
2.  ใช้ `zod` validate input เสมอ
3.  ใช้ `try/catch` และ Return format `{ success: boolean, message: string }`
4.  ใช้ `useActionState` (React Hook) ในการเชื่อมต่อกับ Form ใน Client Component

---
*Updated: 19 มกราคม 2026 (Migrated to Auth.js & ThaID Integration)*

---

## 9. ข้อตกลงการแก้ไขและอัปเดต (Maintenance Protocol)

เอกสารนี้ถือเป็น **"สัญญา" (Contract)** ระหว่าง Frontend และ Backend หากมีการแก้ไขต้องทำตามขั้นตอนดังนี้:

1.  **Backend เปลี่ยน Logic/Structure**:
    *   ต้องมาอัปเดตเอกสารนี้ **ก่อน** หรือ **พร้อมกับ** การแก้โค้ดเสมอ
    *   เช่น ถ้าเปลี่ยน URL API, เปลี่ยนชื่อ Field, หรือเปลี่ยนวิธีคำนวณ ต้องแก้หัวข้อที่เกี่ยวข้อง (เช่น ข้อ 5 หรือ 7) ทันที

2.  **Frontend ต้องการ Field เพิ่ม**:
    *   ให้แจ้ง Backend Developer เพื่อเพิ่ม Field ใน Database และ API
    *   Backend Developer อัปเดตเอกสารนี้ แล้วแจ้ง Frontend ให้ทราบ

3.  **การ Sync ข้อมูลข้าม Project**:
    *   ให้ยึดไฟล์ `DEVELOPMENT_MANUAL.md` ในโปรเจค **Backend** เป็น Master Copy
    *   หากมีการแก้ไขสำคัญ ควร Copy ไฟล์นี้ไปทับในโปรเจค Frontend ด้วย (เพื่อให้ทีม Frontend เห็นภาพล่าสุดเสมอ)
