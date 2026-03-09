# การนำขึ้นใช้งานจริง (Deployment)

ขั้นตอนการนำโปรเจกต์ CASDU Far-Side API ขั้นทำงานจริง (Production) แบบรันอยู่บนเซิร์ฟเวอร์โดดๆ (Standalone Server Node.js)

## 1. การ Build โปรเจกต์ (Compile)
สคริปต์นี้เป็นการแปลงภาษา TypeScript (ในโค้ดดิ้ง) ให้เป็น JavaScript พื้นฐาน

```bash
npm run build
```
หลังจากพ่นคำสั่งนี้แล้ว โปรเจกต์จะถูกจัดเรียงและใส่ไว้ตระเตรียมความพร้อมในโฟลเดอร์ `dist/`

## 2. การเตรียมไฟล์ส่งต่อเข้าสู่ Server
ไฟล์ที่สำคัญและต้องโคลน/สำเนาขึ้นเครื่องเซิร์ฟเวอร์ปลายทาง ได้แก่:
1.  โฟลเดอร์ `dist/` (ที่เพิ่ง Build ไป)
2.  ไฟล์ `package.json`
3.  ไฟล์ `package-lock.json`
4.  ไฟล์ตั้งค่า `.env` **(สำคัญมาก อย่าลืมสำเนาขึ้นไป และตรวจสอบว่าเชื่อมกับ MySQL บน Server เรียบร้อยกำหนดข้อมูลถูกต้อง)**

## 3. การใช้งานด้วย PM2 (วิธีที่แนะนำและรวดเร็วสุด)
ฝั่งเซิร์ฟเวอร์ ให้ติดตั้ง Service คุม Worker ด้วยเครื่องมือ [PM2](https://pm2.keymetrics.io/) สำหรับรัน Node Process โดยเฉพาะ

```bash
# บนฝั่งเซิร์ฟเวอร์ Production
npm install --production

# ติดตั้ง pm2 ทั่วเครื่อง (หากยังไม่มี)
npm install -g pm2

# สั่งรัน Backend
pm2 start dist/index.js --name casdu-farside

# บันทึกเป็น State เริ่มต้น และตั้ง Auto Restart พร้อมเครื่องเซิร์ฟเวอร์ 
pm2 save
pm2 startup
```

## 4. การใช้งานด้วย Systemd Service (ทางเลือก)
หากผู้ดูแลระบบเชี่ยวชาญเครื่องเซิร์ฟเวอร์ Linux และต้องการรันเปรียบเสมือน Service พื้นฐานของ OS เลย สามารถสร้างไฟล์ `.service` ได้

โดยสร้างไฟล์นี้: `/etc/systemd/system/casdu-farside.service` 
```ini
[Unit]
Description=CASDU Far-Side API
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/app
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```
จากนั้นรีโหลดตัวควบคุม Systemd:
```bash
sudo systemctl daemon-reload
sudo systemctl enable casdu-farside
sudo systemctl start casdu-farside
```
