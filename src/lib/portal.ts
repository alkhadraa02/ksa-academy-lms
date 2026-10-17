import { notFound, redirect } from "next/navigation";
import { prisma } from "./db";
import { requireUser } from "./auth";

/** Loads a course for an enrolled student; redirects to the public page when not actively enrolled. */
export async function loadEnrolledCourse(slug: string) {
  const user = await requireUser();
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      instructor: true,
      sections: { orderBy: { position: "asc" }, include: { lessons: { orderBy: { position: "asc" } } } },
      quizzes: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" } } } },
    },
  });
  if (!course) notFound();
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
  });
  if (!enrollment || enrollment.status !== "ACTIVE") redirect(`/courses/${course.slug}`);

  const [done, attempts] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId: user.id, lesson: { section: { courseId: course.id } } },
      select: { lessonId: true },
    }),
    prisma.quizAttempt.findMany({
      where: { userId: user.id, quiz: { courseId: course.id } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const doneIds = new Set(done.map((d) => d.lessonId));
  const bestByQuiz = new Map<string, { percent: number; passed: boolean }>();
  for (const a of attempts) {
    const cur = bestByQuiz.get(a.quizId);
    if (!cur || a.percent > cur.percent || (a.passed && !cur.passed)) {
      bestByQuiz.set(a.quizId, { percent: a.percent, passed: a.passed || Boolean(cur?.passed) });
    }
  }
  return { user, course, enrollment, doneIds, bestByQuiz };
}
