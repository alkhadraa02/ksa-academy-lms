import { prisma } from "./db";
import { generateCertificateCode, gradeQuiz, progressPercent, type GradeResult } from "./grading";

export class ServiceError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Free courses activate immediately; paid courses wait for the admin to verify a manual transfer. */
export async function enrollUser(userId: string, courseId: string, paymentRef?: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !course.published) throw new ServiceError(404, "الدورة غير موجودة");

  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing && existing.status !== "REJECTED") return { enrollment: existing, created: false };

  const free = course.price === 0;
  const ref = (paymentRef ?? "").trim();
  if (!free && ref.length < 3) {
    throw new ServiceError(400, "أدخل رقم الحوالة أو مرجع الدفع لإتمام التسجيل");
  }
  const data = {
    status: free ? ("ACTIVE" as const) : ("PENDING" as const),
    amount: course.price,
    paymentRef: free ? "" : ref,
    approvedAt: free ? new Date() : null,
  };
  const enrollment = existing
    ? await prisma.enrollment.update({ where: { id: existing.id }, data })
    : await prisma.enrollment.create({ data: { userId, courseId, ...data } });
  return { enrollment, created: true };
}

export async function decideEnrollment(enrollmentId: string, decision: "ACTIVE" | "REJECTED") {
  const e = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!e) throw new ServiceError(404, "التسجيل غير موجود");
  return prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status: decision, approvedAt: decision === "ACTIVE" ? new Date() : null },
  });
}

async function requireActiveEnrollment(userId: string, courseId: string) {
  const e = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (!e || e.status !== "ACTIVE") throw new ServiceError(403, "لا تملك تسجيلاً مفعّلاً في هذه الدورة");
  return e;
}

export async function courseProgress(userId: string, courseId: string) {
  const [totalLessons, doneLessons, quizzes, passed] = await Promise.all([
    prisma.lesson.count({ where: { section: { courseId } } }),
    prisma.lessonProgress.count({ where: { userId, lesson: { section: { courseId } } } }),
    prisma.quiz.findMany({ where: { courseId }, select: { id: true } }),
    prisma.quizAttempt.findMany({
      where: { userId, passed: true, quiz: { courseId } },
      select: { quizId: true },
      distinct: ["quizId"],
    }),
  ]);
  const totalItems = totalLessons + quizzes.length;
  const doneItems = doneLessons + passed.length;
  return {
    totalLessons,
    doneLessons,
    totalQuizzes: quizzes.length,
    passedQuizzes: passed.length,
    percent: progressPercent(doneItems, totalItems),
    complete: totalItems > 0 && doneItems >= totalItems,
  };
}

/** Issues the certificate the first time every lesson is done and every quiz is passed. */
export async function evaluateCompletion(userId: string, courseId: string) {
  const p = await courseProgress(userId, courseId);
  let certificateCode: string | null = null;
  if (p.complete) {
    const e = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
    if (e && !e.certificateCode) {
      const updated = await prisma.enrollment.update({
        where: { id: e.id },
        data: { certificateCode: generateCertificateCode(), completedAt: new Date() },
      });
      certificateCode = updated.certificateCode;
    } else {
      certificateCode = e?.certificateCode ?? null;
    }
  }
  return { ...p, certificateCode };
}

export async function completeLesson(userId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { section: { select: { courseId: true } } },
  });
  if (!lesson) throw new ServiceError(404, "الدرس غير موجود");
  const courseId = lesson.section.courseId;
  await requireActiveEnrollment(userId, courseId);
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: {},
    create: { userId, lessonId },
  });
  return evaluateCompletion(userId, courseId);
}

export async function submitQuiz(
  userId: string,
  quizId: string,
  answers: Record<string, number>,
): Promise<GradeResult & { progress: Awaited<ReturnType<typeof evaluateCompletion>> }> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { position: "asc" } } },
  });
  if (!quiz) throw new ServiceError(404, "الاختبار غير موجود");
  await requireActiveEnrollment(userId, quiz.courseId);
  if (quiz.questions.length === 0) throw new ServiceError(400, "الاختبار لا يحتوي أسئلة بعد");

  const grade = gradeQuiz(quiz.questions, answers, quiz.passPercent);
  await prisma.quizAttempt.create({
    data: {
      userId,
      quizId,
      percent: grade.percent,
      passed: grade.passed,
      answers: JSON.stringify(answers),
    },
  });
  const progress = await evaluateCompletion(userId, quiz.courseId);
  return { ...grade, progress };
}

export async function revenueReport() {
  const active = await prisma.enrollment.findMany({
    where: { status: "ACTIVE", amount: { gt: 0 } },
    include: { course: { select: { id: true, title: true } } },
    orderBy: { approvedAt: "asc" },
  });
  const byCourse = new Map<string, { title: string; count: number; total: number }>();
  const byMonth = new Map<string, number>();
  let total = 0;
  for (const e of active) {
    total += e.amount;
    const c = byCourse.get(e.course.id) ?? { title: e.course.title, count: 0, total: 0 };
    c.count += 1;
    c.total += e.amount;
    byCourse.set(e.course.id, c);
    const d = e.approvedAt ?? e.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + e.amount);
  }
  const pending = await prisma.enrollment.aggregate({
    where: { status: "PENDING" },
    _sum: { amount: true },
    _count: true,
  });
  return {
    total,
    paidEnrollments: active.length,
    pendingAmount: pending._sum.amount ?? 0,
    pendingCount: pending._count,
    byCourse: [...byCourse.values()].sort((a, b) => b.total - a.total),
    byMonth: [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, amount]) => ({ month, amount })),
  };
}
