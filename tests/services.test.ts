import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  completeLesson,
  courseProgress,
  decideEnrollment,
  enrollUser,
  revenueReport,
  ServiceError,
  submitQuiz,
} from "@/lib/services";
import { moveItem } from "@/lib/admin-services";
import { resetDb } from "./helpers";

let studentId: string;
let paidCourseId: string;
let freeCourseId: string;
let lessonIds: string[] = [];
let quizId: string;
let questionIds: string[] = [];
let sectionIds: string[] = [];

beforeAll(async () => {
  await resetDb();
  const user = await prisma.user.create({
    data: { name: "طالب تجريبي", email: "student@example.test", passwordHash: "x" },
  });
  studentId = user.id;
  const category = await prisma.category.create({ data: { name: "إدارة", slug: "management" } });
  const instructor = await prisma.instructor.create({ data: { name: "مدرب", title: "خبير" } });
  const base = { summary: "ملخص", description: "وصف", categoryId: category.id, instructorId: instructor.id, published: true };
  const paid = await prisma.course.create({ data: { ...base, title: "دورة مدفوعة", slug: "paid", price: 500 } });
  const free = await prisma.course.create({ data: { ...base, title: "دورة مجانية", slug: "free", price: 0 } });
  paidCourseId = paid.id;
  freeCourseId = free.id;

  const s1 = await prisma.section.create({ data: { courseId: paid.id, title: "القسم الأول", position: 0 } });
  const s2 = await prisma.section.create({ data: { courseId: paid.id, title: "القسم الثاني", position: 1 } });
  sectionIds = [s1.id, s2.id];
  const l1 = await prisma.lesson.create({ data: { sectionId: s1.id, title: "درس 1", position: 0 } });
  const l2 = await prisma.lesson.create({ data: { sectionId: s1.id, title: "درس 2", position: 1 } });
  lessonIds = [l1.id, l2.id];
  const quiz = await prisma.quiz.create({ data: { courseId: paid.id, title: "اختبار", passPercent: 50 } });
  quizId = quiz.id;
  for (const [i, correct] of [1, 0].entries()) {
    const q = await prisma.question.create({
      data: { quizId: quiz.id, text: `سؤال ${i + 1}`, options: JSON.stringify(["أ", "ب", "ج"]), correctIndex: correct, position: i },
    });
    questionIds.push(q.id);
  }
});

describe("enrollment", () => {
  it("activates free courses immediately", async () => {
    const { enrollment } = await enrollUser(studentId, freeCourseId);
    expect(enrollment.status).toBe("ACTIVE");
  });

  it("requires a payment reference for paid courses and keeps them pending", async () => {
    await expect(enrollUser(studentId, paidCourseId)).rejects.toBeInstanceOf(ServiceError);
    const { enrollment, created } = await enrollUser(studentId, paidCourseId, "TRX-1001");
    expect(created).toBe(true);
    expect(enrollment.status).toBe("PENDING");
    expect(enrollment.amount).toBe(500);
  });

  it("is idempotent for an existing enrollment", async () => {
    const again = await enrollUser(studentId, paidCourseId, "TRX-1001");
    expect(again.created).toBe(false);
    expect(await prisma.enrollment.count({ where: { userId: studentId, courseId: paidCourseId } })).toBe(1);
  });

  it("blocks learning until the admin approves", async () => {
    await expect(completeLesson(studentId, lessonIds[0])).rejects.toMatchObject({ status: 403 });
    await expect(submitQuiz(studentId, quizId, {})).rejects.toMatchObject({ status: 403 });
  });

  it("excludes pending payments from revenue until approved", async () => {
    const before = await revenueReport();
    expect(before.total).toBe(0);
    expect(before.pendingAmount).toBe(500);
    const e = await prisma.enrollment.findFirstOrThrow({ where: { userId: studentId, courseId: paidCourseId } });
    await decideEnrollment(e.id, "ACTIVE");
    const after = await revenueReport();
    expect(after.total).toBe(500);
    expect(after.byCourse[0]).toMatchObject({ title: "دورة مدفوعة", count: 1, total: 500 });
  });
});

describe("progress, quiz and certificate", () => {
  it("tracks lessons and only certifies after every lesson and quiz is done", async () => {
    const first = await completeLesson(studentId, lessonIds[0]);
    expect(first.complete).toBe(false);
    expect(first.certificateCode).toBeNull();
    // completing the same lesson twice does not double count
    await completeLesson(studentId, lessonIds[0]);
    expect((await courseProgress(studentId, paidCourseId)).doneLessons).toBe(1);

    const second = await completeLesson(studentId, lessonIds[1]);
    expect(second.percent).toBe(67);
    expect(second.certificateCode).toBeNull();
  });

  it("fails a bad attempt, then passes and issues the certificate", async () => {
    const bad = await submitQuiz(studentId, quizId, { [questionIds[0]]: 2, [questionIds[1]]: 2 });
    expect(bad.passed).toBe(false);
    expect(bad.progress.certificateCode).toBeNull();

    const good = await submitQuiz(studentId, quizId, { [questionIds[0]]: 1, [questionIds[1]]: 0 });
    expect(good.percent).toBe(100);
    expect(good.passed).toBe(true);
    expect(good.progress.complete).toBe(true);
    expect(good.progress.certificateCode).toMatch(/^ACD-[A-Z2-9]{5}-[A-Z2-9]{5}$/);

    const again = await submitQuiz(studentId, quizId, { [questionIds[0]]: 1, [questionIds[1]]: 0 });
    expect(again.progress.certificateCode).toBe(good.progress.certificateCode);
  });
});

describe("ordering", () => {
  it("moves sections up and down and keeps positions dense", async () => {
    await moveItem("section", sectionIds[1], "up");
    let rows = await prisma.section.findMany({ where: { courseId: paidCourseId }, orderBy: { position: "asc" } });
    expect(rows.map((r) => r.id)).toEqual([sectionIds[1], sectionIds[0]]);
    expect(rows.map((r) => r.position)).toEqual([0, 1]);

    const edge = await moveItem("section", sectionIds[1], "up");
    expect(edge.moved).toBe(false);

    await moveItem("section", sectionIds[1], "down");
    rows = await prisma.section.findMany({ where: { courseId: paidCourseId }, orderBy: { position: "asc" } });
    expect(rows.map((r) => r.id)).toEqual(sectionIds);
  });
});
