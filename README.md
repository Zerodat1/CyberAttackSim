# Code

منصة الدردشة الصوتية "Code" — تطبيق إنتاجي كامل يتكون من ثلاثة مشاريع مستقلة:

- **backend/** — واجهة برمجية خلفية مبنية على NestJS + TypeScript + PostgreSQL (Prisma) + Redis + Socket.IO.
- **admin/** — لوحة تحكم إدارية مبنية على React + TypeScript + Material UI.
- **mobile/** — تطبيق الجوال مبني على React Native + TypeScript.

## حالة البناء (Phases)

| المرحلة | الوصف | الحالة |
|---|---|---|
| 1 | تأسيس المشروع (Backend/Admin/Mobile) + المصادقة (Auth) + نظام وكالات الشحن (Recharge Agency System) كاملاً | ✅ منجزة |
| 2 | الغرف الصوتية (Rooms) + الرسائل الخاصة (Realtime via Socket.IO) | لم تبدأ |
| 3 | الهدايا والعملات والاقتصاد الداخلي (Gifts / Gold / Diamond) | لم تبدأ |
| 4 | VIP، الألعاب، الوكالات الاجتماعية (Content Agencies) | لم تبدأ |
| 5 | الإشعارات الفورية (Push)، الاختبارات الشاملة، مراقبة الأداء | لم تبدأ |

## التشغيل محليًا

```bash
docker compose up -d postgres redis
cd backend && cp .env.example .env && npm install
npx prisma migrate dev
npm run start:dev
```

راجع `backend/README.md`, `admin/README.md`, `mobile/README.md` لتفاصيل كل مشروع.
