# เอกสารโครงสร้างฐานข้อมูล (Database Schema)

สร้างจาก `migrations/casdu_internalis.sql`

## 1. ระบบหลักและการยืนยันตัวตน (Core System & Authentication)

### `common_users`
เก็บข้อมูลบัญชีผู้ใช้งานในระบบ
| คอลัมน์ | ประเภทข้อมูล | คำอธิบาย |
| :--- | :--- | :--- |
| `id` | `int(11)` | รหัสระบุ (PK), Auto Increment |
| `username` | `varchar(50)` | ชื่อผู้ใช้ (รหัสพนักงาน) |
| `password` | `varchar(255)` | รหัสผ่าน (เข้ารหัสด้วย BCrypt) |
| `displayname` | `varchar(100)` | ชื่อที่ใช้แสดงผล |
| `firstname` | `varchar(100)` | ชื่อจริง |
| `lastname` | `varchar(100)` | นามสกุล |
| `email` | `varchar(255)` | อีเมล |
| `jobtitle` | `varchar(100)` | ตำแหน่งงาน |
| `role` | `varchar(50)` | สิทธิ์การใช้งาน ('admin', 'user') |
| `status` | `varchar(50)` | สถานะบัญชี ('active', 'inactive') |
| `isadmin` | `tinyint(1)` | **(Legacy)** 1 = ผู้ดูแลระบบ, 0 = ผู้ใช้ทั่วไป |
| `created_at` | `datetime` | วันที่สร้าง |
| `updated_at` | `datetime` | วันที่แก้ไขล่าสุด |

### `employees`
ข้อมูลพนักงานจาก HR (Source of Truth) ใช้สำหรับตรวจสอบสิทธิ์ตอน Login ผ่าน ThaID
| คอลัมน์ | ประเภทข้อมูล | คำอธิบาย |
| :--- | :--- | :--- |
| `id` | `int(11)` | รหัสระบุ (PK), Auto Increment |
| `cid` | `varchar(20)` | เลขบัตรประชาชน (Unique) |
| `firstname` | `varchar(255)` | ชื่อจริง |
| `lastname` | `varchar(255)` | นามสกุล |
| `email` | `varchar(255)` | อีเมล |
| `position` | `varchar(255)` | ตำแหน่งงาน |
| `isactive` | `tinyint(1)` | 1 = พนักงานปัจจุบัน, 0 = ลาออก/ไม่ใช้งาน |
| `created_at` | `datetime` | วันที่สร้าง |
| `updated_at` | `datetime` | วันที่แก้ไขล่าสุด |

---

## 2. ระบบจัดการเอกสาร (Document Management System - DMS)

### `dl_folders`
โฟลเดอร์สำหรับจัดเก็บไฟล์ (รองรับ Sub-folder แบบไม่จำกัดชั้น)
| คอลัมน์ | ประเภทข้อมูล | คำอธิบาย |
| :--- | :--- | :--- |
| `id` | `int(11)` | รหัสระบุ (PK), Auto Increment |
| `name` | `varchar(255)` | ชื่อโฟลเดอร์ |
| `abbr` | `varchar(50)` | ตัวย่อ / รหัสโฟลเดอร์ |
| `parent` | `int(11)` | รหัสโฟลเดอร์แม่ (FK to `dl_folders.id`) |
| `description`| `text` | รายละเอียดเพิ่มเติม |
| `mui_icon` | `varchar(50)` | ชื่อไอคอน (Material UI) |
| `mui_colour` | `varchar(50)` | รหัสสี (Hex Code) |
| `isactive` | `tinyint(1)` | สถานะการใช้งาน |
| `created_by` | `int(11)` | รหัสผู้สร้าง |
| `updated_by` | `int(11)` | รหัสผู้แก้ไข |

### `dl_files`
ไฟล์เอกสารที่อัปโหลดเข้าสู่ระบบ
| คอลัมน์ | ประเภทข้อมูล | คำอธิบาย |
| :--- | :--- | :--- |
| `id` | `int(11)` | รหัสระบุ (PK), Auto Increment |
| `parent` | `int(11)` | รหัสโฟลเดอร์ที่ไฟล์อยู่ (FK to `dl_folders.id`) |
| `name` | `varchar(255)` | ชื่อไฟล์สำหรับแสดงผล |
| `filename` | `varchar(255)` | ชื่อไฟล์ต้นฉบับพร้อมนามสกุล |
| `sysname` | `varchar(255)` | ชื่อไฟล์ในระบบจัดเก็บ (UUID) |
| `downloads` | `int(11)` | จำนวนครั้งที่ดาวน์โหลด |
| `isactive` | `tinyint(1)` | สถานะการใช้งาน |
| `mui_icon` | `varchar(50)` | ชื่อไอคอน (Material UI) |
| `mui_colour` | `varchar(50)` | รหัสสี (Hex Code) |
| `created_by` | `int(11)` | รหัสผู้สร้าง |
| `updated_by` | `int(11)` | รหัสผู้แก้ไข |

---

## 3. ข่าวสารและประชาสัมพันธ์ (News & Announcements)

### `common_news`
ข่าวประกาศที่แสดงหน้า Dashboard หรือหน้าแรก
| คอลัมน์ | ประเภทข้อมูล | คำอธิบาย |
| :--- | :--- | :--- |
| `id` | `int(11)` | รหัสระบุ (PK) |
| `title` | `varchar(255)` | หัวข้อข่าว |
| `content` | `text` | เนื้อหาข่าว (HTML) |
| `category` | `varchar(50)` | หมวดหมู่ (เช่น 'ประชาสัมพันธ์', 'กิจกรรม') |
| `status` | `varchar(20)` | สถานะ ('published', 'draft') |
| `view_count` | `int(11)` | จำนวนผู้เข้าชม |
| `cover_image`| `varchar(255)` | UUID ของรูปภาพปก |
| `publish_date`| `datetime` | วันที่เผยแพร่ |
| `created_by` | `varchar(50)` | ชื่อผู้สร้าง |
| `updated_by` | `varchar(50)` | ชื่อผู้แก้ไข |

---

## 4. บันทึกการใช้งาน (Logs & Tracking)

### `common_activity_logs`
Audit Log สำหรับบันทึกการกระทำต่างๆ ในระบบ (ใคร ทำอะไร ที่ไหน เมื่อไหร่)
| คอลัมน์ | ประเภทข้อมูล | คำอธิบาย |
| :--- | :--- | :--- |
| `id` | `int(11)` | รหัสระบุ (PK) |
| `user_id` | `int(11)` | รหัสผู้กระทำ |
| `action` | `varchar(50)` | การกระทำ (เช่น 'LOGIN', 'CREATE_FILE') |
| `resource_type`| `varchar(50)` | ประเภททรัพยากร (เช่น 'AUTH', 'FILE') |
| `resource_id`| `varchar(100)` | รหัสของทรัพยากรที่ถูกกระทำ |
| `details` | `text` | รายละเอียดเพิ่มเติม (JSON) |
| `ip_address` | `varchar(50)` | IP Address ผู้ใช้งาน |
| `created_at` | `datetime` | เวลาที่บันทึก |

### `search_logs`
บันทึกคำค้นหาของผู้ใช้เพื่อเก็บสถิติ
| คอลัมน์ | ประเภทข้อมูล | คำอธิบาย |
| :--- | :--- | :--- |
| `id` | `int(11)` | รหัสระบุ (PK) |
| `keyword` | `varchar(255)` | คำค้นหา |
| `user_id` | `int(11)` | รหัสผู้ค้นหา (ถ้ามี) |
| `results_count`| `int(11)` | จำนวนผลลัพธ์ที่เจอ |
| `created_at` | `timestamp` | เวลาที่ค้นหา |
