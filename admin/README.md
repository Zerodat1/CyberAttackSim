# Code — Admin Dashboard

لوحة تحكم إدارية مبنية على React + TypeScript + Material UI (RTL) تتصل بواجهة `backend`.

## المرحلة المنجزة (Phase 1)

- تسجيل دخول Owner/Recharge Manager فقط.
- مراجعة طلبات فتح وكالات الشحن (قبول/رفض/طلب تعديل/تعليق).
- مراجعة طلبات تعبئة الرصيد وطلبات السحب.
- تعديل نسب العمولات والحدود اليومية دون الحاجة لتعديل الكود.

## التشغيل

```bash
npm install
npm run dev
```

الواجهة تتوقع أن يعمل الـ backend على `http://localhost:3000` (يتم توجيه `/api` عبر Vite proxy).
