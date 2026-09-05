# 🔥 Firebase Setup Guide สำหรับ OmniVerse Academy

## ขั้นตอนที่ 1️⃣: สมัครสมาชิก Firebase (ฟรี!)

1. ไปที่ https://firebase.google.com
2. กด **"Get Started"** หรือ **"Go to console"**
3. ล็อกอินด้วย Google Account
4. กด **"Create a project"**
5. ตั้งชื่อ: **"OmniVerse Academy"**
6. ยอมรับ Terms แล้วกด **"Create"**
7. รอสักครู่แล้วกด **"Continue"**

---

## ขั้นตอนที่ 2️⃣: สร้าง Realtime Database

1. ในหน้า Firebase Console ที่เปิด
2. ไปที่ **Build > Realtime Database**
3. กด **"Create Database"**
4. เลือก Region: **asia-southeast1** (ใกล้ไทยที่สุด)
5. เลือก Mode: **Start in test mode** (ทำให้ใคร ๆ อ่านเขียนได้ก่อน)
6. กด **"Enable"**

---

## ขั้นตอนที่ 3️⃣: ได้ Firebase Config

1. กลับไปหน้า Firebase Console
2. ไปที่ **Project Settings** (⚙️ ในมุมขวาบน)
3. ไปแท็บ **"Your apps"**
4. กด ไอคอน `</>`  (Web)
5. ตั้งชื่อ App: **"OmniVerse Web"**
6. กด **"Register app"**
7. **คัดลอก Config ที่แสดง** (มีลักษณะดังนี้):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "omniverseacademy.firebaseapp.com",
  databaseURL: "https://omniverseacademy.firebaseio.com",
  projectId: "omniverseacademy",
  storageBucket: "omniverseacademy.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

---

## ขั้นตอนที่ 4️⃣: เพิ่ม Firebase Library เข้า HTML

ในไฟล์ `index12.html` ของคุณ ให้เพิ่มบรรทัดนี้ **ก่อน** `<script>` tag ของคุณ:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js"></script>
```

---

## ขั้นตอนที่ 5️⃣: ตั้งค่า Realtime Database Rules

เพื่อให้ทำงานเป็นทีมได้ปลอดภัย:

1. ใน Firebase Console ไปที่ **Realtime Database**
2. ไปแท็บ **Rules**
3. แทนที่ code ด้วยสิ่งนี้:

```json
{
  "rules": {
    "users": {
      ".indexOn": ["username", "xp"],
      "$uid": {
        ".validate": "newData.hasChildren(['username', 'xp', 'level', 'avatar'])",
        "username": {
          ".validate": "newData.isString() && newData.val().length > 0"
        },
        "xp": {
          ".validate": "newData.isNumber()"
        },
        "level": {
          ".validate": "newData.isNumber()"
        },
        "avatar": {
          ".validate": "newData.isString()"
        },
        "$other": {
          ".validate": true
        }
      }
    },
    "tickets": {
      "$tid": {
        ".validate": "newData.hasChildren(['user', 'subject'])"
      }
    }
  }
}
```

4. กด **"Publish"**

---

## ขั้นตอนที่ 6️⃣: ใช้ Firebase ในโปรแกรม

เพิ่มโค้ดในไฟล์ `index12.html`:

```html
<script>
  // 1. ใส่ Firebase Config ของคุณที่นี่
  const firebaseConfig = {
    // คัดลอกจากขั้นตอนที่ 3
  };

  // 2. Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();

  // 3. ใช้ cloudAuthManager แทน auth ตัวเก่า
  // const auth = new CloudAuthManager();
</script>
```

---

## 🔑 Key Points:

| ส่วน | คำอธิบาย |
|------|----------|
| **API Key** | ใช้เพื่อให้ App เข้าถึง Firebase |
| **Project ID** | ชื่อโปรเจกต์ของคุณ |
| **Database URL** | ที่เก็บข้อมูล Real-time |
| **Test Mode** | ทุกคนเข้าถึงได้ (เปลี่ยนได้ภายหลัง) |

---

## ⚠️ Security Tips:

❌ **อย่า** ใช้ Test Mode ไปถาวร
✅ **ต้อง** เปลี่ยนเป็น Rules ที่เหมาะสมใน Production
✅ **ต้อง** ใช้ Firebase Authentication ภายหลัง

---

## 📱 ทดสอบบนหลายเครื่อง:

1. เปิด App บนเบราว์เซอร์ 1
2. เปิด App บนเบราว์เซอร์ 2 (หรือ Incognito / ที่อื่น)
3. สมัครสมาชิกบนเครื่องที่ 1
4. เบราว์เซอร์ที่ 2 จะเห็นผู้ใช้ใหม่ใน Leaderboard ทันที! 🎉

---

## 🆘 ปัญหาที่พบบ่อย:

| ปัญหา | วิธีแก้ |
|------|--------|
| Error: "Cannot read property 'database'" | ตรวจสอบว่า Firebase library ถูกโหลดครบหรือไม่ |
| Data ไม่แสดง | ตรวจ Console > Realtime Database ว่ามีข้อมูลไหม |
| Permission denied | เปลี่ยน Rules เป็น test mode หรือกำหนด rules ให้ถูกต้อง |
| Lag / Slow sync | ปกติ Firebase ใช้ websocket ควร instant (ตรวจ internet) |

---

## 💡 Next Steps:

1. ✅ ทำตามขั้นตอนข้างต้น
2. 🔌 เพิ่ม Firebase Config ลงในไฟล์ HTML
3. ⚙️ ใช้ `firebase-sync.js` ไฟล์ใหม่
4. 🧪 ทดสอบบนหลาย browser/device
5. 🚀 Deploy ไป GitHub Pages หรือเซิร์ฟเวอร์
