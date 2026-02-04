# คำถามสำหรับทีมดูแล HR SOAP API (กรมตรวจบัญชีสหกรณ์)

ทางทีมพัฒนาระบบ Resource Center ต้องการเชื่อมต่อกับระบบ HR เพื่อตรวจสอบสถานะบุคลากร (Authentication & Auto-Provisioning) โดยรบกวนขอข้อมูลทางเทคนิคเพื่อนำมาพัฒนาดังนี้ครับ:

## 1. การเชื่อมต่อ (Connection)
- **Endpoint / WSDL URL**: ขอ URL สำหรับเรียกใช้งาน Service (เช่น `https://hr.cad.go.th/service.asmx?wsdl`)
- **Authentication**: ระบบต้องใช้ Username/Password หรือ Token ในการเรียกหรือไม่? (ถ้ามี รบกวนขอ Account สำหรับทดสอบ)
- **Network Access**: ต้องมีการ Whitelist IP Address ของเครื่อง Server หรือไม่?

## 2. การเรียกใช้งาน (Request)
- **Input**: ในการตรวจสอบข้อมูลบุคคล ต้องส่ง Parameter อะไรไปบ้าง?
  - ใช้ **เลขบัตรประชาชน (PID)** 13 หลัก เป็น Key หลักถูกต้องหรือไม่?
  - ชื่อ Field ใน XML คืออะไร? (เช่น `<PersonID>...</PersonID>` หรือ `<CitizenID>...</CitizenID>`)

## 3. ผลลัพธ์ (Response)
- **Output Fields**: ใน XML Response ที่ส่งกลับมา มี Field ใดบ้าง? รบกวนขอชื่อ Tag XML ที่แม่นยำ เพื่อนำมา Map ลงฐานข้อมูล:
  - ชื่อจริง (First Name)
  - นามสกุล (Last Name)
  - ตำแหน่งงาน (Job Title / Position)
  - หน่วยงาน / สังกัด (Department / Organization)
  - สถานะการทำงาน (Active Status - เช่น ทำงานอยู่, ลาออก, เกษียณ)

## 4. ตัวอย่าง (Sample)
- หากมีไฟล์ **Postman Collection** หรือตัวอย่าง **XML Request/Response** จะเป็นประโยชน์มากครับ

---
*ขอบคุณครับ - ทีมพัฒนาระบบ Resource Center*
