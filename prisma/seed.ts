import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type LessonSpec = { t: string; kind: "VIDEO" | "TEXT"; min: number; body?: string };
type QuestionSpec = { q: string; o: string[]; c: number };
type CourseSpec = {
  title: string;
  slug: string;
  cat: string;
  instructor: number;
  price: number;
  level: string;
  hours: number;
  summary: string;
  description: string;
  sections: { title: string; lessons: LessonSpec[] }[];
  quiz: { title: string; pass: number; questions: QuestionSpec[] };
};

const VIDEO = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";

const text = (title: string, points: string[]) =>
  `${title}\n\n${points.map((p) => `• ${p}`).join("\n")}\n\nطبّق ما سبق على مثال من عملك، ثم انتقل إلى الدرس التالي.`;

const categories = [
  { name: "التسويق الرقمي", slug: "digital-marketing", description: "استراتيجيات الإعلانات والمحتوى وتحسين الظهور للأعمال في السوق السعودي." },
  { name: "البرمجة وتطوير الويب", slug: "programming", description: "من أساسيات الويب إلى بناء تطبيقات كاملة بأدوات حديثة." },
  { name: "الإدارة والأعمال", slug: "business", description: "إدارة المشاريع والقيادة وريادة الأعمال وفق أفضل الممارسات." },
  { name: "التصميم والإبداع", slug: "design", description: "تصميم الواجهات والهوية البصرية وتجربة المستخدم." },
];

const instructors = [
  { name: "د. فهد بن سعد العتيبي", title: "استشاري تسويق رقمي — الرياض", bio: "خبرة تتجاوز اثني عشر عاماً في إدارة الحملات الإعلانية لعلامات تجارية سعودية، ومحاضر في ورش ريادة الأعمال." },
  { name: "م. نورة بنت خالد الشمري", title: "مهندسة برمجيات أولى — جدة", bio: "تعمل على بناء منتجات رقمية منذ عشر سنوات، وتدرّب المبتدئين على تطوير الويب بأسلوب عملي مبسّط." },
  { name: "أ. سلطان بن ناصر الدوسري", title: "مدرب معتمد في إدارة المشاريع — الدمام", bio: "حاصل على شهادات احترافية في إدارة المشاريع، ويقود برامج تحوّل في قطاعي الطاقة والخدمات اللوجستية." },
  { name: "أ. ريم بنت عبدالله القحطاني", title: "مصممة تجربة مستخدم — الخبر", bio: "تصمّم واجهات عربية لتطبيقات مالية وتعليمية، وتشارك في مجتمعات التصميم المحلية." },
];

const courses: CourseSpec[] = [
  {
    title: "أساسيات التسويق الرقمي",
    slug: "digital-marketing-basics",
    cat: "digital-marketing",
    instructor: 0,
    price: 0,
    level: "مبتدئ",
    hours: 4,
    summary: "دورة مجانية تضع أساس التسويق الرقمي: الجمهور، القنوات، قياس النتائج.",
    description: "تبدأ هذه الدورة من الصفر وتشرح كيف تبني حضوراً رقمياً لنشاطك التجاري: تحديد الجمهور المستهدف، اختيار القنوات المناسبة، كتابة رسالة تسويقية واضحة، وقياس الأداء بمؤشرات بسيطة. مناسبة لأصحاب المشاريع الصغيرة والمتاجر الإلكترونية.",
    sections: [
      {
        title: "المدخل إلى التسويق الرقمي",
        lessons: [
          { t: "ما هو التسويق الرقمي ولماذا الآن؟", kind: "VIDEO", min: 12 },
          { t: "رحلة العميل من الاكتشاف إلى الشراء", kind: "TEXT", min: 8, body: text("مراحل رحلة العميل", ["الوعي: يتعرّف العميل على مشكلته وعلى علامتك", "الاعتبار: يقارن بين الخيارات المتاحة", "القرار: يشتري أو يحجز أو يتواصل", "الولاء: يكرّر الشراء ويرشّحك لغيره"]) },
        ],
      },
      {
        title: "القنوات والمحتوى",
        lessons: [
          { t: "اختيار المنصة المناسبة لنشاطك", kind: "TEXT", min: 10, body: text("كيف تختار المنصة", ["ابدأ من أين يتواجد جمهورك فعلاً لا من المنصة الأكثر شهرة", "ركّز على قناتين فقط في أول ثلاثة أشهر", "قِس النتائج أسبوعياً قبل إضافة قناة جديدة"]) },
          { t: "كتابة محتوى يبيع دون أن يبدو إعلاناً", kind: "VIDEO", min: 15 },
          { t: "قياس الأداء بمؤشرات بسيطة", kind: "TEXT", min: 9, body: text("المؤشرات الأهم", ["تكلفة الحصول على عميل", "معدل التحويل من الزيارة إلى الطلب", "العائد على الإنفاق الإعلاني"]) },
        ],
      },
    ],
    quiz: {
      title: "اختبار أساسيات التسويق الرقمي",
      pass: 60,
      questions: [
        { q: "ما أول خطوة في بناء أي خطة تسويقية؟", o: ["تحديد الجمهور المستهدف", "شراء الإعلانات", "تصميم الشعار", "فتح حسابات في كل المنصات"], c: 0 },
        { q: "أي مؤشر يقيس كلفة اكتساب العميل الواحد؟", o: ["معدل الارتداد", "CAC", "عدد المتابعين", "عدد الإعجابات"], c: 1 },
        { q: "كم قناة يُنصح بالتركيز عليها في البداية؟", o: ["جميع القنوات", "قناتان", "عشر قنوات", "لا شيء مما سبق"], c: 1 },
      ],
    },
  },
  {
    title: "إعلانات سناب شات وتيك توك للأعمال",
    slug: "social-ads-snapchat-tiktok",
    cat: "digital-marketing",
    instructor: 0,
    price: 450,
    level: "متوسط",
    hours: 8,
    summary: "أنشئ حملات مدفوعة ناجحة على أكثر المنصات استخداماً في المملكة.",
    description: "تتعلّم في هذه الدورة بناء حملة إعلانية كاملة: الاستهداف حسب المدينة والاهتمام، كتابة الإعلان، اختيار الهدف، تجربة النسخ المختلفة، وقراءة تقارير الأداء لاتخاذ قرارات الميزانية.",
    sections: [
      {
        title: "إعداد الحملة",
        lessons: [
          { t: "أهداف الحملات وكيف تختار بينها", kind: "VIDEO", min: 14 },
          { t: "الاستهداف الجغرافي والاهتمامات", kind: "TEXT", min: 10, body: text("الاستهداف الفعّال", ["ابدأ بجمهور واسع نسبياً ثم ضيّقه بالبيانات", "اختبر الرياض وجدة والدمام كل مدينة في مجموعة منفصلة", "استبعد العملاء الحاليين من حملات الاستحواذ"]) },
        ],
      },
      {
        title: "الإبداع والتحسين",
        lessons: [
          { t: "كتابة إعلان فيديو قصير في ثلاث ثوانٍ الأولى", kind: "VIDEO", min: 16 },
          { t: "اختبار A/B وتوزيع الميزانية", kind: "TEXT", min: 12, body: text("اختبار النسخ", ["غيّر عنصراً واحداً في كل اختبار", "انتظر عدداً كافياً من النتائج قبل الحكم", "انقل الميزانية تدريجياً إلى النسخة الأفضل"]) },
        ],
      },
    ],
    quiz: {
      title: "اختبار الحملات المدفوعة",
      pass: 66,
      questions: [
        { q: "ماذا نغيّر في اختبار A/B الواحد؟", o: ["عنصراً واحداً", "كل العناصر", "الميزانية فقط", "اسم الحملة"], c: 0 },
        { q: "أين تُحسم قيمة الإعلان غالباً في الفيديو القصير؟", o: ["في آخر ثانية", "في أول ثلاث ثوانٍ", "في الوصف", "في الشعار"], c: 1 },
        { q: "كيف نتعامل مع العملاء الحاليين في حملات الاستحواذ؟", o: ["نستبعدهم", "نضاعف الميزانية لهم", "نستهدفهم فقط", "لا فرق"], c: 0 },
      ],
    },
  },
  {
    title: "تطوير الويب من الصفر بـ HTML وCSS وJavaScript",
    slug: "web-development-from-scratch",
    cat: "programming",
    instructor: 1,
    price: 0,
    level: "مبتدئ",
    hours: 12,
    summary: "ابنِ أول موقع تفاعلي لك خطوة بخطوة دون أي خبرة سابقة.",
    description: "دورة عملية تبدأ بهيكلة الصفحة بـ HTML، ثم تنسيقها بـ CSS مع التركيز على التصميم المتجاوب واتجاه الكتابة من اليمين لليسار، ثم إضافة التفاعل بـ JavaScript. تنتهي الدورة بمشروع موقع شخصي كامل.",
    sections: [
      {
        title: "هيكلة الصفحة بـ HTML",
        lessons: [
          { t: "أول صفحة ويب لك", kind: "VIDEO", min: 15 },
          { t: "العناوين والفقرات والروابط والصور", kind: "TEXT", min: 12, body: text("وسوم أساسية", ["h1 للعنوان الرئيسي ومرة واحدة في الصفحة", "p للفقرات وa للروابط وimg للصور مع نص بديل", "ul وol للقوائم"]) },
        ],
      },
      {
        title: "التنسيق بـ CSS",
        lessons: [
          { t: "الألوان والخطوط والمسافات", kind: "TEXT", min: 14, body: text("أساسيات التنسيق", ["استخدم متغيرات CSS للألوان", "اجعل الخط العربي مقروءاً بحجم 16 بكسل فأكثر", "استخدم margin-inline وpadding-inline لدعم الاتجاهين"]) },
          { t: "التخطيط المتجاوب بـ Flexbox وGrid", kind: "VIDEO", min: 22 },
        ],
      },
      {
        title: "التفاعل بـ JavaScript",
        lessons: [
          { t: "المتغيرات والدوال والأحداث", kind: "TEXT", min: 18, body: text("مفاهيم JavaScript الأولى", ["const للقيم الثابتة وlet للمتغيرة", "الدوال تجمع خطوات تعيد استخدامها", "addEventListener يربط الصفحة بنقرات المستخدم"]) },
        ],
      },
    ],
    quiz: {
      title: "اختبار أساسيات الويب",
      pass: 60,
      questions: [
        { q: "أي وسم يمثل العنوان الرئيسي للصفحة؟", o: ["h1", "p", "div", "span"], c: 0 },
        { q: "أي خاصية تدعم الاتجاهين العربي والإنجليزي للمسافات؟", o: ["margin-left", "margin-inline", "float", "left"], c: 1 },
        { q: "أي كلمة تعرّف قيمة لا تتغير في JavaScript؟", o: ["var", "let", "const", "def"], c: 2 },
        { q: "ما وظيفة addEventListener؟", o: ["رسم صورة", "ربط حدث بدالة", "حذف عنصر", "تغيير الخط"], c: 1 },
      ],
    },
  },
  {
    title: "بناء تطبيقات الويب بـ React وNext.js",
    slug: "react-nextjs-apps",
    cat: "programming",
    instructor: 1,
    price: 650,
    level: "متقدم",
    hours: 16,
    summary: "من المكوّنات إلى تطبيق كامل بمصادقة وقاعدة بيانات وتحسين لمحركات البحث.",
    description: "تغطي الدورة مكوّنات React وإدارة الحالة، ثم توجيه Next.js وتحميل البيانات من الخادم، وبناء واجهات برمجية، وحماية المسارات، وصولاً إلى نشر تطبيق جاهز للإنتاج.",
    sections: [
      {
        title: "أساسيات React",
        lessons: [
          { t: "المكوّنات والخصائص", kind: "VIDEO", min: 20 },
          { t: "الحالة والتأثيرات الجانبية", kind: "TEXT", min: 16, body: text("إدارة الحالة", ["useState لحالة صغيرة داخل مكوّن", "ارفع الحالة إلى أقرب أب مشترك عند الحاجة", "تجنّب useEffect إن كان الحساب ممكناً أثناء الرسم"]) },
        ],
      },
      {
        title: "Next.js في الإنتاج",
        lessons: [
          { t: "التوجيه ومكوّنات الخادم", kind: "VIDEO", min: 24 },
          { t: "المصادقة وحماية المسارات", kind: "TEXT", min: 18, body: text("حماية التطبيق", ["خزّن الجلسة في كعكة httpOnly", "تحقق من الصلاحية في الخادم لا في الواجهة فقط", "تحقق من كل مدخل بمكتبة تحقق"]) },
        ],
      },
    ],
    quiz: {
      title: "اختبار React وNext.js",
      pass: 70,
      questions: [
        { q: "أين يجب التحقق من صلاحية المستخدم؟", o: ["في الواجهة فقط", "في الخادم", "في CSS", "لا حاجة"], c: 1 },
        { q: "أي خطّاف يحفظ حالة محلية في مكوّن؟", o: ["useState", "useRoute", "useFetch", "useStyle"], c: 0 },
        { q: "أين تُخزَّن جلسة المستخدم بأمان؟", o: ["localStorage", "كعكة httpOnly", "عنوان الصفحة", "ملف نصي عام"], c: 1 },
      ],
    },
  },
  {
    title: "إدارة المشاريع باحترافية",
    slug: "professional-project-management",
    cat: "business",
    instructor: 2,
    price: 800,
    level: "متوسط",
    hours: 10,
    summary: "خطط وتابع وسلّم مشاريعك في الوقت والميزانية باستخدام منهجيات معتمدة.",
    description: "تشرح الدورة دورة حياة المشروع، تحديد النطاق، تقدير الوقت والكلفة، إدارة المخاطر، والتواصل مع أصحاب المصلحة، مع قوالب جاهزة وأمثلة من مشاريع محلية.",
    sections: [
      {
        title: "التخطيط",
        lessons: [
          { t: "دورة حياة المشروع", kind: "VIDEO", min: 18 },
          { t: "تحديد النطاق وهيكل تجزئة العمل", kind: "TEXT", min: 14, body: text("النطاق", ["اكتب ما هو داخل المشروع وما هو خارجه", "قسّم العمل إلى حزم يمكن تقديرها", "اعتمد النطاق من صاحب المصلحة كتابةً"]) },
        ],
      },
      {
        title: "التنفيذ والمتابعة",
        lessons: [
          { t: "إدارة المخاطر", kind: "TEXT", min: 12, body: text("سجل المخاطر", ["حدّد الاحتمال والأثر لكل خطر", "عيّن مسؤولاً عن كل خطر", "راجع السجل في كل اجتماع متابعة"]) },
          { t: "التواصل مع أصحاب المصلحة", kind: "VIDEO", min: 16 },
        ],
      },
    ],
    quiz: {
      title: "اختبار إدارة المشاريع",
      pass: 60,
      questions: [
        { q: "ماذا يحدد النطاق؟", o: ["ما هو داخل المشروع وخارجه", "لون التقرير", "عدد الاجتماعات", "اسم الفريق"], c: 0 },
        { q: "ما عنصرا تقييم الخطر؟", o: ["الاحتمال والأثر", "الكلفة واللون", "الاسم والتاريخ", "السرعة والحجم"], c: 0 },
      ],
    },
  },
  {
    title: "مهارات القيادة وبناء الفرق",
    slug: "leadership-team-building",
    cat: "business",
    instructor: 2,
    price: 0,
    level: "مبتدئ",
    hours: 5,
    summary: "مهارات عملية لتحفيز فريقك وإدارة الأداء وحل الخلافات.",
    description: "دورة مجانية قصيرة عن الانتقال من موظف متميز إلى قائد: وضع التوقعات، التغذية الراجعة، التفويض، وبناء ثقافة فريق منتجة.",
    sections: [
      {
        title: "من الموظف إلى القائد",
        lessons: [
          { t: "ما الذي يتغير حين تصبح قائداً؟", kind: "VIDEO", min: 12 },
          { t: "التغذية الراجعة التي تُحسّن الأداء", kind: "TEXT", min: 10, body: text("نموذج التغذية الراجعة", ["صف الموقف بدقة دون أحكام", "اذكر الأثر على الفريق أو العميل", "اتفقا معاً على الخطوة التالية"]) },
          { t: "التفويض الفعّال", kind: "TEXT", min: 9, body: text("التفويض", ["فوّض النتيجة لا الخطوات", "حدّد معايير النجاح والموعد", "تابع بنقاط مراجعة قصيرة"]) },
        ],
      },
    ],
    quiz: {
      title: "اختبار القيادة",
      pass: 60,
      questions: [
        { q: "ماذا نفوّض في التفويض الفعّال؟", o: ["النتيجة", "كل الخطوات بالتفصيل", "المسؤولية كاملة دون متابعة", "لا شيء"], c: 0 },
        { q: "أي عنصر ليس من نموذج التغذية الراجعة؟", o: ["وصف الموقف", "الأثر", "الخطوة التالية", "اللوم الشخصي"], c: 3 },
      ],
    },
  },
  {
    title: "تصميم واجهات المستخدم العربية",
    slug: "arabic-ui-design",
    cat: "design",
    instructor: 3,
    price: 350,
    level: "متوسط",
    hours: 7,
    summary: "صمّم واجهات واضحة وجميلة تراعي القراءة من اليمين إلى اليسار.",
    description: "تتعلم اختيار الخطوط العربية، ضبط المسافات والتباين، تصميم الأيقونات والاتجاهات، وبناء نظام تصميم متّسق يسهل تسليمه للمطورين.",
    sections: [
      {
        title: "أسس التصميم العربي",
        lessons: [
          { t: "الخطوط العربية وقابلية القراءة", kind: "VIDEO", min: 14 },
          { t: "الاتجاه والأيقونات والمحاذاة", kind: "TEXT", min: 11, body: text("RTL في التصميم", ["اعكس الأيقونات الاتجاهية مثل الأسهم", "لا تعكس الأرقام ولا الشعارات", "اختبر الشاشات بنصوص عربية حقيقية"]) },
        ],
      },
      {
        title: "نظام التصميم",
        lessons: [
          { t: "الألوان والتباين", kind: "TEXT", min: 10, body: text("التباين", ["نسبة التباين للنص العادي 4.5 إلى 1 على الأقل", "لا تعتمد على اللون وحده لنقل المعنى", "عرّف الألوان كمتغيرات"]) },
          { t: "تسليم التصميم للمطورين", kind: "VIDEO", min: 13 },
        ],
      },
    ],
    quiz: {
      title: "اختبار تصميم الواجهات",
      pass: 60,
      questions: [
        { q: "ما الحد الأدنى للتباين للنص العادي؟", o: ["4.5:1", "1.5:1", "2:1", "لا حد"], c: 0 },
        { q: "أي عنصر لا يُعكس في واجهة RTL؟", o: ["أسهم التنقل", "الشعارات والأرقام", "اتجاه القوائم", "محاذاة النص"], c: 1 },
      ],
    },
  },
];

const students = [
  { name: "عبدالعزيز بن محمد الحربي", email: "abdulaziz@academy.example" },
  { name: "سارة بنت أحمد الزهراني", email: "sara@academy.example" },
  { name: "مشاعل بنت فيصل المطيري", email: "mishael@academy.example" },
  { name: "تركي بن عبدالرحمن السبيعي", email: "turki@academy.example" },
  { name: "لمى بنت يوسف الغامدي", email: "lama@academy.example" },
];

function certCode(i: number) {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let k = 0; k < 10; k++) s += a[(i * 7 + k * 5 + 3) % a.length];
  return `ACD-${s.slice(0, 5)}-${s.slice(5)}`;
}

function required(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`${name} is required in .env (see .env.example)`);
  }
  return v;
}

async function main() {
  const adminEmail = required("ADMIN_EMAIL").toLowerCase();
  const adminPassword = required("ADMIN_PASSWORD");

  // Demo students: a password from DEMO_STUDENT_PASSWORD if set, otherwise a random
  // one nobody knows (sign up through the app to try the student flows).
  const demoPassword = process.env.DEMO_STUDENT_PASSWORD;
  const studentSecret = demoPassword && demoPassword.length >= 8 ? demoPassword : randomBytes(18).toString("base64url");

  // Reset content so the seed is repeatable.
  await prisma.quizAttempt.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.section.deleteMany();
  await prisma.course.deleteMany();
  await prisma.instructor.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany({ where: { role: "STUDENT" } });

  const adminHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash, role: "ADMIN", name: "مدير الأكاديمية" },
    create: { email: adminEmail, name: "مدير الأكاديمية", role: "ADMIN", passwordHash: adminHash },
  });

  const catIds: Record<string, string> = {};
  for (const c of categories) catIds[c.slug] = (await prisma.category.create({ data: c })).id;
  const instIds: string[] = [];
  for (const i of instructors) instIds.push((await prisma.instructor.create({ data: i })).id);

  const courseIds: string[] = [];
  const lessonsByCourse: string[][] = [];
  const quizByCourse: { id: string; questions: { id: string; correctIndex: number }[] }[] = [];

  for (const c of courses) {
    const course = await prisma.course.create({
      data: {
        title: c.title,
        slug: c.slug,
        summary: c.summary,
        description: c.description,
        price: c.price,
        level: c.level,
        hours: c.hours,
        published: true,
        categoryId: catIds[c.cat],
        instructorId: instIds[c.instructor],
      },
    });
    courseIds.push(course.id);
    const lessonIds: string[] = [];
    for (const [si, s] of c.sections.entries()) {
      const section = await prisma.section.create({ data: { courseId: course.id, title: s.title, position: si } });
      for (const [li, l] of s.lessons.entries()) {
        const lesson = await prisma.lesson.create({
          data: {
            sectionId: section.id,
            title: l.t,
            type: l.kind,
            videoUrl: l.kind === "VIDEO" ? VIDEO : "",
            content: l.kind === "TEXT" ? (l.body ?? "") : "",
            minutes: l.min,
            position: li,
          },
        });
        lessonIds.push(lesson.id);
      }
    }
    lessonsByCourse.push(lessonIds);
    const quiz = await prisma.quiz.create({
      data: { courseId: course.id, title: c.quiz.title, passPercent: c.quiz.pass, position: 0 },
    });
    const qs: { id: string; correctIndex: number }[] = [];
    for (const [qi, q] of c.quiz.questions.entries()) {
      const created = await prisma.question.create({
        data: { quizId: quiz.id, text: q.q, options: JSON.stringify(q.o), correctIndex: q.c, position: qi },
      });
      qs.push({ id: created.id, correctIndex: created.correctIndex });
    }
    quizByCourse.push({ id: quiz.id, questions: qs });
  }

  const hash = await bcrypt.hash(studentSecret, 10);
  const users: Awaited<ReturnType<typeof prisma.user.create>>[] = [];
  for (const s of students) users.push(await prisma.user.create({ data: { ...s, passwordHash: hash } }));

  const day = 86_400_000;
  const daysAgo = (n: number) => new Date(Date.now() - n * day);
  let certIndex = 1;

  async function enroll(
    u: number,
    c: number,
    status: "ACTIVE" | "PENDING" | "REJECTED",
    ago: number,
    ref = "",
  ) {
    const price = courses[c].price;
    return prisma.enrollment.create({
      data: {
        userId: users[u].id,
        courseId: courseIds[c],
        status,
        amount: price,
        paymentRef: price > 0 ? ref : "",
        createdAt: daysAgo(ago),
        approvedAt: status === "ACTIVE" ? daysAgo(Math.max(ago - 1, 0)) : null,
      },
    });
  }

  async function finish(u: number, c: number, enrollmentId: string, ago: number) {
    for (const lessonId of lessonsByCourse[c]) {
      await prisma.lessonProgress.create({ data: { userId: users[u].id, lessonId, completedAt: daysAgo(ago) } });
    }
    const quiz = quizByCourse[c];
    await prisma.quizAttempt.create({
      data: {
        userId: users[u].id,
        quizId: quiz.id,
        percent: 100,
        passed: true,
        answers: JSON.stringify(Object.fromEntries(quiz.questions.map((q) => [q.id, q.correctIndex]))),
        createdAt: daysAgo(ago),
      },
    });
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { certificateCode: certCode(certIndex++), completedAt: daysAgo(ago) },
    });
  }

  async function partial(u: number, c: number, count: number, ago: number) {
    for (const lessonId of lessonsByCourse[c].slice(0, count)) {
      await prisma.lessonProgress.create({ data: { userId: users[u].id, lessonId, completedAt: daysAgo(ago) } });
    }
  }

  // Completed with certificates
  await finish(0, 0, (await enroll(0, 0, "ACTIVE", 40)).id, 30);
  await finish(1, 2, (await enroll(1, 2, "ACTIVE", 35)).id, 20);
  await finish(2, 5, (await enroll(2, 5, "ACTIVE", 25, "TRX-883201")).id, 10);
  // In progress
  await partial(0, 3, 2, 5);
  await enroll(0, 3, "ACTIVE", 12, "TRX-771904");
  await partial(3, 2, 3, 3);
  await enroll(3, 2, "ACTIVE", 8);
  await partial(4, 4, 1, 2);
  await enroll(4, 4, "ACTIVE", 6, "TRX-660377");
  // Revenue
  await enroll(1, 1, "ACTIVE", 18, "TRX-552018");
  await enroll(3, 1, "ACTIVE", 9, "TRX-552990");
  await enroll(4, 3, "ACTIVE", 4, "TRX-771955");
  // Pending and rejected for the approval queue
  await enroll(2, 3, "PENDING", 1, "TRX-901123");
  await enroll(1, 4, "PENDING", 2, "TRX-901377");
  await enroll(3, 5, "REJECTED", 7, "TRX-000001");

  console.log(`Seeded: ${courses.length} courses, ${users.length} students, admin ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
