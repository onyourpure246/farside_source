# Backend Specification for Dashboard

โปรดส่งมอบเอกสารนี้ให้กับทีม Backend เพื่อดำเนินการ Implement API สำหรับหน้า Dashboard

## Overview
Frontend ต้องการ 3 Endpoints ใหม่ เพื่อนำข้อมูลไปแสดงผลในหน้า Dashboard (User Activity, File Management, Security).

---

## 1. Statistics API
**Endpoint:** `GET /api/fy2569/dashboard/stats`
**Description:** ดึงตัวเลขสรุปผลสำหรับ Card ต่างๆ
**Response Format:**
```json
{
  "success": true,
  "data": {
    "total_logins": 150,
    "active_users": 45,
    "total_files": 320,
    "system_crashes": 0
  }
}
```
**SQL Queries Reference:**
1.  **Total Logins:**
    ```sql
    SELECT COUNT(*) FROM common_activity_logs WHERE action = 'VERIFY_EMPLOYEE';
    ```
2.  **Active Users (All Time or Monthly - can be adjusted):**
    ```sql
    SELECT COUNT(DISTINCT user_id) FROM common_activity_logs;
    ```
3.  **Total Files (Active only):**
    ```sql
    SELECT COUNT(*) FROM dl_files WHERE isactive = 1;
    ```
4.  **System Health (Crashes in last 24h):**
    ```sql
    SELECT COUNT(*) FROM common_activity_logs 
    WHERE action = 'SYSTEM_CRASH' 
    AND created_at >= NOW() - INTERVAL 1 DAY;
    ```
    *(Note: Adjust syntax for MariaDB/MySQL if needed: `DATE_SUB(NOW(), INTERVAL 24 HOUR)`)*

---

## 2. Charts Data API
**Endpoint:** `GET /api/fy2569/dashboard/chart-data`
**Description:** ดึงข้อมูลสำหรับพลอตกราฟ (Login Trends) และตารางจัดอันดับ (Top Downloads)
**Response Format:**
```json
{
  "success": true,
  "data": {
    "login_trends": [
      { "date": "2023-10-01", "count": 12 },
      { "date": "2023-10-02", "count": 15 }
    ],
    "top_downloads": [
      { "file_id": 10, "filename": "manual.pdf", "download_count": 50 },
      { "file_id": 12, "filename": "policy.pdf", "download_count": 35 }
    ]
  }
}
```
**SQL Queries Reference:**
1.  **Login Trends (Last 7 Days):**
    ```sql
    SELECT DATE(created_at) as date, COUNT(*) as count 
    FROM common_activity_logs 
    WHERE action = 'VERIFY_EMPLOYEE' 
    AND created_at >= DATE(NOW()) - INTERVAL 7 DAY
    GROUP BY DATE(created_at)
    ORDER BY date ASC;
    ```
2.  **Top Downloads (Top 5):**
    *Note: `common_activity_logs.resource_id` stores the `sysname` (UUID) of the file for `DOWNLOAD_UUID` action.*
    ```sql
    SELECT 
        f.id as file_id,
        f.name as filename,
        COUNT(l.id) as download_count
    FROM common_activity_logs l
    JOIN dl_files f ON l.resource_id = f.sysname
    WHERE l.action IN ('DOWNLOAD', 'DOWNLOAD_UUID') 
    GROUP BY f.id, f.name
    ORDER BY download_count DESC
    LIMIT 5;
    ```

---

## 3. Audit Logs API
**Endpoint:** `GET /api/fy2569/dashboard/audit-logs`
**Description:** ดึงรายการแจ้งเตือนความปลอดภัยหรือการลบข้อมูล (Latest 10 items)
**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 55,
      "action": "DELETE_FILE",
      "details": "Deleted manual.pdf",
      "user_id": 1,
      "created_at": "2023-10-05 10:00:00"
    }
  ]
}
```
**SQL Query Reference:**
```sql
SELECT id, action, details, user_id, created_at 
FROM common_activity_logs 
WHERE action IN ('DELETE_USER', 'DELETE_FILE', 'DELETE_FOLDER', 'DELETE_NEWS', 'SYSTEM_CRASH') 
ORDER BY created_at DESC 
LIMIT 10;
```
