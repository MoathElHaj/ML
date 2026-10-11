# موقع بريق · Bariq Digital Agency

موقع وكالة بريق الرقمية مع لوحة تحكم متصلة بـ Supabase.

- **الموقع:** الرئيسية، خدماتنا، أعمالنا، من نحن، المدونة، تواصل معنا، احجز استشارة مجانية، وزر واتساب عائم.
- **لوحة التحكم (`/dashboard`):** إدارة الخدمات والأعمال والمقالات (مع رفع الصور)، جدول الاستشارات المحجوزة (تأكيد، تغيير الموعد، ملاحظات، مراسلة العميل على واتساب)، وصندوق رسائل التواصل.
- **التقنيات:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Supabase (Postgres + Auth + Storage) · الخط IBM Plex Sans Arabic · واجهة RTL.

## 1. إعداد Supabase

1. أنشئ مشروعاً في [supabase.com](https://supabase.com).
2. من **SQL Editor** شغّل الملف `supabase/migrations/0001_init.sql` (الجداول، الصلاحيات RLS، ومخزن الصور `media`).
3. شغّل `supabase/seed.sql` لإضافة الخدمات الأربع.
4. أنشئ حساب المدير: **Authentication → Users → Add user** (بريد وكلمة مرور)، ثم امنحه صلاحية لوحة التحكم:

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

> الزوار يستطيعون فقط إرسال الحجوزات والرسائل وقراءة المحتوى المنشور. كل التعديلات والقراءة الخاصة محصورة بالمستخدمين الموجودين في جدول `admins`.

## 2. متغيرات البيئة

انسخ `.env.example` إلى `.env.local` واملأ القيم:

| المتغير | الوصف |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | رابط المشروع (Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | المفتاح العام anon / publishable |
| `NEXT_PUBLIC_SITE_URL` | رابط الموقع النهائي (للـ SEO وخريطة الموقع) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | رقم واتساب بالصيغة الدولية، أرقام فقط (مثل `9689XXXXXXX`). بدونه يختفي زر واتساب |
| `NEXT_PUBLIC_BUSINESS_TIMEZONE` | المنطقة الزمنية لمواعيد الاستشارات (الافتراضي `Asia/Muscat`) |
| `NEXT_PUBLIC_CONTACT_EMAIL` / `PHONE` / `ADDRESS` | بيانات التواصل (اختيارية) |
| `NEXT_PUBLIC_INSTAGRAM_URL` / `X_URL` / `LINKEDIN_URL` / `TIKTOK_URL` | حسابات التواصل (اختيارية) |

## 3. التشغيل محلياً

```bash
pnpm install
pnpm dev
```

ثم افتح `http://localhost:3000` ولوحة التحكم على `/login`.

**Supabase محلي (اختياري، يحتاج Docker):** `npx supabase start` يشغّل قاعدة بيانات محلية على المنافذ `553xx` ويطبّق الملفات تلقائياً.

## 4. النشر

انشر على Vercel (أو أي استضافة تدعم Next.js)، وأضف متغيرات البيئة نفسها في إعدادات المشروع.

## تخصيص سريع

- **أيام وأوقات الاستشارات:** `src/lib/site.ts` → `booking` (أيام العمل، الأوقات، عدد الأيام المتاحة، مدة الجلسة).
- **الألوان والخط:** `src/app/globals.css` (ألوان الهوية: `#230b4b` `#3a1673` `#612aae` `#cda9ff`).
- **صور الموقع:** `public/images/`.

### كتابة المقالات

محرر المقالات يدعم تنسيقاً بسيطاً:

```
سطر فارغ بين الفقرات
## عنوان رئيسي
### عنوان فرعي
- عنصر في قائمة
> اقتباس
**نص عريض**
```
