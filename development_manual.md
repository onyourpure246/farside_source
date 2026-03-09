# คู่มือการพัฒนาระบบ CASDU Far-Side API (Development Manual)

ยินดีต้อนรับสู่เอกสารคู่มือการพัฒนาระบบ **CASDU Far-Side API (Backend)**
เอกสารชุดนี้ได้ถูกรวบรวมและจัดพิมพ์เพื่อให้ทีมพัฒนาเข้าใจโครงสร้างและสามารถทำงานกับระบบ Backend ได้อย่างมีประสิทธิภาพ

## สารบัญ (Table of Contents)

กรุณาเลือกหัวข้อที่ต้องการศึกษา:

### 1. [สถาปัตยกรรมระบบ (Architecture)](docs/architecture.md)
เรียนรู้โครงสร้างภาพรวมของโปรเจกต์ การจัดการโฟลเดอร์ Tech Stack ที่ใช้ (Hono, Node.js, MySQL) และกระบวนการ Authentication

### 2. [การติดตั้งและตั้งค่า (Setup Guide)](docs/setup.md)
ขั้นตอนการติดตั้งโปรเจกต์ลงในเครื่อง (Local Machine) การตั้งค่า Environment Variables (`.env`) การตั้งค่าฐานข้อมูล และวิธีรันโปรเจกต์

### 3. [API และการใช้งาน (API Reference)](docs/backend-api.md)
รายละเอียดเกี่ยวกับ API Endpoints ฝั่ง Backend ทั้งหมดที่ระบบรองรับ (เช่น Auth, Commons, Planner, Download) รวมถึงวิธีการแนบ Header ป้องกันการใช้งาน

### 4. [โครงสร้างฐานข้อมูล (Database Schema)](docs/database.md)
รายละเอียดตาราง (Tables) ต่างๆ ใน MySQL ความสัมพันธ์ของการเก็บข้อมูล Commons, ระบบ Planner และระบบไฟล์

### 5. [การนำขึ้นใช้งานจริง (Deployment)](docs/deployment.md)
ขั้นตอนการ Build และ Deploy ระบบขึ้นบน Standalone Server ด้วย Node.js พร้อมแนะนำบริการอย่าง PM2 และ Systemd

---

## หมายเหตุสำหรับผู้พัฒนา
*   โปรเจกต์นี้เริ่มต้นใช้งาน **Hono Framework** บนสภาพแวดล้อม Node.js โดยย้ายมาจากระบบเดิมที่เคยทำงานอยู่บน Cloudflare Workers
*   การเก็บไฟล์เปลี่ยนจาก Cloudflare R2 มาใช้งานบน File System Storage ภายในตัวเครื่องเซิร์ฟเวอร์โดยตรง
*   หากมีการแก้ไข Database หรือแก้ไขเส้นทาง API ของระบบ รบกวนอัพเดตเอกสารในโฟลเดอร์ `docs/` ให้เป็นปัจจุบันด้วย
