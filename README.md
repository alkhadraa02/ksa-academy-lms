# أكاديمية التدريب — Academy LMS

منصة تدريب إلكتروني عربية (RTL) مع بوابة للطلاب ولوحة تحكم للإدارة، مبنية بـ Next.js 16 وPrisma وSQLite.

Arabic-first online academy / LMS with a student portal and an admin dashboard, built with Next.js 16, Prisma and SQLite.

## المزايا — Features

**الموقع العام / Public**
- كتالوج الدورات مع التصنيفات والبحث، وصفحة الدورة (المنهج، المدرّب، السعر).
- التسجيل في الدورات: مجاناً فوراً، أو بحوالة يدوية تنتظر اعتماد الإدارة.
- صفحة تحقق وطباعة الشهادة برمز فريد.
- SEO: metadata وsitemap وrobots لكل الصفحات العامة.

**بوابة الطالب / Student portal**
- «دوراتي» مع نسبة التقدّم.
- مشغّل الدروس: فيديو عبر رابط (YouTube وVimeo وملفات مباشرة) أو درس نصي.
- تتبّع التقدّم، واختبارات بتصحيح تلقائي وحدّ نجاح، وإصدار الشهادة عند إتمام كل الدروس واجتياز كل الاختبارات.

**لوحة الإدارة / Admin dashboard**
- إدارة الدورات والأقسام والدروس (إضافة/تعديل/حذف/ترتيب).
- منشئ الاختبارات والأسئلة.
- اعتماد التسجيلات المعلّقة أو رفضها.
- قائمة الطلاب، وتقرير الإيرادات.

## لقطات الشاشة — Screenshots

أضف لقطاتك في مجلد `docs/screenshots/` ثم اربطها هنا. / Add your captures under `docs/screenshots/` and link them here.

## التقنيات — Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Prisma 6 + SQLite · zod · bcryptjs · Vitest · خط IBM Plex Sans Arabic.

## التشغيل في 5 أوامر — Setup in 5 commands

```bash
npm install
cp .env.example .env      # PowerShell: Copy-Item .env.example .env
npm run db:setup          # generate client, create the SQLite file, seed demo data
npm test
npm run dev               # http://localhost:3105
```

للإنتاج / Production: `npm run build && npm start`.

## حساب المدير الافتراضي — Default admin login

القيم من `.env` (انسخها من `.env.example`):

| الحقل | القيمة الافتراضية |
| --- | --- |
| البريد / Email | `admin@academy.example` |
| كلمة المرور / Password | `ChangeMe-Admin-2026` |

غيّر هذه القيم قبل أي نشر حقيقي. / Change these before any real deployment.
حسابات الطلاب التجريبية تستخدم `DEMO_STUDENT_PASSWORD` (أو كلمة مرور عشوائية تُطبع عند التهيئة).

## الأوامر — Scripts

| الأمر | الوظيفة |
| --- | --- |
| `npm run dev` | خادم التطوير على المنفذ 3105 |
| `npm run build` | بناء الإنتاج |
| `npm start` | تشغيل نسخة الإنتاج |
| `npm test` | اختبارات Vitest (منطق التصحيح والخدمات ومسارات API) |
| `npm run db:setup` | إنشاء القاعدة وتعبئتها |
| `npm run db:seed` | إعادة تعبئة البيانات التجريبية |

## هيكل المشروع — Project structure

```
prisma/            schema.prisma + seed.ts (Saudi Arabic demo data)
src/app/           pages and route handlers (App Router)
  admin/           dashboard: courses, quizzes, enrollments, students, revenue
  portal/          student portal: my courses, lesson player, quizzes
  courses/         public catalog and course page
  certificate/     printable certificate
  api/             auth, enroll, progress, quiz submit, admin mutations
src/components/    shared UI components
src/lib/           auth, validation (zod), grading, services, rate limit
tests/             Vitest suites
```

## الأمان — Security notes

كلمات المرور مُجزّأة بـ bcrypt، والجلسة في كوكي `httpOnly`، وتُخزَّن بصمة الرمز فقط في القاعدة. كل مسارات التعديل تتطلب مصادقة وتحقّق origin، وكل مدخلات API تمر عبر zod، وتُقيَّد محاولات الدخول.

## الترخيص — License

MIT © TechnologyKSA
