import { prisma } from "./db";
import { slugify } from "./grading";
import { ServiceError } from "./services";
import type { z } from "zod";
import type { courseSchema, lessonSchema, questionSchema, quizSchema, sectionSchema } from "./validation";

type CourseInput = z.infer<typeof courseSchema>;
type LessonInput = z.infer<typeof lessonSchema>;
type QuestionInput = z.infer<typeof questionSchema>;
type QuizInput = z.infer<typeof quizSchema>;
type SectionInput = z.infer<typeof sectionSchema>;

async function uniqueSlug(base: string, ignoreId?: string) {
  let slug = slugify(base);
  for (let i = 2; ; i++) {
    const hit = await prisma.course.findUnique({ where: { slug } });
    if (!hit || hit.id === ignoreId) return slug;
    slug = `${slugify(base).slice(0, 50)}-${i}`;
  }
}

async function assertRefs(categoryId: string, instructorId: string) {
  const [c, i] = await Promise.all([
    prisma.category.findUnique({ where: { id: categoryId } }),
    prisma.instructor.findUnique({ where: { id: instructorId } }),
  ]);
  if (!c) throw new ServiceError(400, "التصنيف غير موجود");
  if (!i) throw new ServiceError(400, "المدرّب غير موجود");
}

export async function createCourse(input: CourseInput) {
  await assertRefs(input.categoryId, input.instructorId);
  const slug = await uniqueSlug(input.slug || input.title);
  const { slug: _ignored, ...rest } = input;
  void _ignored;
  const course = await prisma.course.create({ data: { ...rest, slug } });
  return { ok: true, id: course.id };
}

export async function updateCourse(id: string, input: CourseInput) {
  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) throw new ServiceError(404, "الدورة غير موجودة");
  await assertRefs(input.categoryId, input.instructorId);
  const slug = input.slug ? await uniqueSlug(input.slug, id) : existing.slug;
  const { slug: _ignored, ...rest } = input;
  void _ignored;
  await prisma.course.update({ where: { id }, data: { ...rest, slug } });
  return { ok: true, id };
}

export async function deleteCourse(id: string) {
  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) throw new ServiceError(404, "الدورة غير موجودة");
  await prisma.course.delete({ where: { id } });
  return { ok: true };
}

export async function createSection(courseId: string, input: SectionInput) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new ServiceError(404, "الدورة غير موجودة");
  const last = await prisma.section.aggregate({ where: { courseId }, _max: { position: true } });
  const s = await prisma.section.create({
    data: { courseId, title: input.title, position: (last._max.position ?? -1) + 1 },
  });
  return { ok: true, id: s.id };
}

export async function updateSection(id: string, input: SectionInput) {
  if (!(await prisma.section.findUnique({ where: { id } }))) throw new ServiceError(404, "القسم غير موجود");
  await prisma.section.update({ where: { id }, data: { title: input.title } });
  return { ok: true };
}

export async function deleteSection(id: string) {
  if (!(await prisma.section.findUnique({ where: { id } }))) throw new ServiceError(404, "القسم غير موجود");
  await prisma.section.delete({ where: { id } });
  return { ok: true };
}

export async function createLesson(sectionId: string, input: LessonInput) {
  if (!(await prisma.section.findUnique({ where: { id: sectionId } }))) throw new ServiceError(404, "القسم غير موجود");
  const last = await prisma.lesson.aggregate({ where: { sectionId }, _max: { position: true } });
  const l = await prisma.lesson.create({
    data: { sectionId, ...input, position: (last._max.position ?? -1) + 1 },
  });
  return { ok: true, id: l.id };
}

export async function updateLesson(id: string, input: LessonInput) {
  if (!(await prisma.lesson.findUnique({ where: { id } }))) throw new ServiceError(404, "الدرس غير موجود");
  await prisma.lesson.update({ where: { id }, data: input });
  return { ok: true };
}

export async function deleteLesson(id: string) {
  if (!(await prisma.lesson.findUnique({ where: { id } }))) throw new ServiceError(404, "الدرس غير موجود");
  await prisma.lesson.delete({ where: { id } });
  return { ok: true };
}

export async function createQuiz(courseId: string, input: QuizInput) {
  if (!(await prisma.course.findUnique({ where: { id: courseId } }))) throw new ServiceError(404, "الدورة غير موجودة");
  const last = await prisma.quiz.aggregate({ where: { courseId }, _max: { position: true } });
  const q = await prisma.quiz.create({
    data: { courseId, ...input, position: (last._max.position ?? -1) + 1 },
  });
  return { ok: true, id: q.id };
}

export async function updateQuiz(id: string, input: QuizInput) {
  if (!(await prisma.quiz.findUnique({ where: { id } }))) throw new ServiceError(404, "الاختبار غير موجود");
  await prisma.quiz.update({ where: { id }, data: input });
  return { ok: true };
}

export async function deleteQuiz(id: string) {
  if (!(await prisma.quiz.findUnique({ where: { id } }))) throw new ServiceError(404, "الاختبار غير موجود");
  await prisma.quiz.delete({ where: { id } });
  return { ok: true };
}

export async function createQuestion(quizId: string, input: QuestionInput) {
  if (!(await prisma.quiz.findUnique({ where: { id: quizId } }))) throw new ServiceError(404, "الاختبار غير موجود");
  const last = await prisma.question.aggregate({ where: { quizId }, _max: { position: true } });
  const q = await prisma.question.create({
    data: {
      quizId,
      text: input.text,
      options: JSON.stringify(input.options),
      correctIndex: input.correctIndex,
      position: (last._max.position ?? -1) + 1,
    },
  });
  return { ok: true, id: q.id };
}

export async function updateQuestion(id: string, input: QuestionInput) {
  if (!(await prisma.question.findUnique({ where: { id } }))) throw new ServiceError(404, "السؤال غير موجود");
  await prisma.question.update({
    where: { id },
    data: { text: input.text, options: JSON.stringify(input.options), correctIndex: input.correctIndex },
  });
  return { ok: true };
}

export async function deleteQuestion(id: string) {
  if (!(await prisma.question.findUnique({ where: { id } }))) throw new ServiceError(404, "السؤال غير موجود");
  await prisma.question.delete({ where: { id } });
  return { ok: true };
}

export type MoveKind = "section" | "lesson" | "question" | "quiz";

/** Swaps an item with its neighbour, then renumbers siblings 0..n so positions stay dense. */
export async function moveItem(kind: MoveKind, id: string, direction: "up" | "down") {
  let siblings: { id: string }[];
  if (kind === "section") {
    const it = await prisma.section.findUnique({ where: { id } });
    if (!it) throw new ServiceError(404, "العنصر غير موجود");
    siblings = await prisma.section.findMany({ where: { courseId: it.courseId }, orderBy: [{ position: "asc" }, { id: "asc" }], select: { id: true } });
  } else if (kind === "lesson") {
    const it = await prisma.lesson.findUnique({ where: { id } });
    if (!it) throw new ServiceError(404, "العنصر غير موجود");
    siblings = await prisma.lesson.findMany({ where: { sectionId: it.sectionId }, orderBy: [{ position: "asc" }, { id: "asc" }], select: { id: true } });
  } else if (kind === "quiz") {
    const it = await prisma.quiz.findUnique({ where: { id } });
    if (!it) throw new ServiceError(404, "العنصر غير موجود");
    siblings = await prisma.quiz.findMany({ where: { courseId: it.courseId }, orderBy: [{ position: "asc" }, { id: "asc" }], select: { id: true } });
  } else {
    const it = await prisma.question.findUnique({ where: { id } });
    if (!it) throw new ServiceError(404, "العنصر غير موجود");
    siblings = await prisma.question.findMany({ where: { quizId: it.quizId }, orderBy: [{ position: "asc" }, { id: "asc" }], select: { id: true } });
  }
  const order = siblings.map((s) => s.id);
  const from = order.indexOf(id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (to < 0 || to >= order.length) return { ok: true, moved: false };
  [order[from], order[to]] = [order[to], order[from]];
  await prisma.$transaction(
    order.map((itemId, position) => {
      if (kind === "section") return prisma.section.update({ where: { id: itemId }, data: { position } });
      if (kind === "lesson") return prisma.lesson.update({ where: { id: itemId }, data: { position } });
      if (kind === "quiz") return prisma.quiz.update({ where: { id: itemId }, data: { position } });
      return prisma.question.update({ where: { id: itemId }, data: { position } });
    }),
  );
  return { ok: true, moved: true };
}
