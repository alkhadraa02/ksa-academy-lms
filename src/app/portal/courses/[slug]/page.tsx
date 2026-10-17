import type { Metadata } from "next";
import Link from "next/link";
import { courseProgress } from "@/lib/services";
import { loadEnrolledCourse } from "@/lib/portal";
import { formatHours } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "محتوى الدورة", robots: { index: false } };

export default async function PortalCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, course, enrollment, doneIds, bestByQuiz } = await loadEnrolledCourse(slug);
  const progress = await courseProgress(user.id, course.id);
  const firstOpen = course.sections.flatMap((s) => s.lessons).find((l) => !doneIds.has(l.id));

  return (
    <div className="container-page py-10">
      <nav aria-label="مسار التنقّل" className="mb-3 text-sm">
        <Link href="/portal" className="text-brand-strong underline">
          دوراتي
        </Link>
      </nav>
      <h1 className="text-3xl font-bold">{course.title}</h1>
      <p className="mt-1 text-muted">المدرّب: {course.instructor.name}</p>

      <div className="card mt-6 space-y-3">
        <div className="flex justify-between text-sm text-muted">
          <span>
            {progress.doneLessons}/{progress.totalLessons} درس · {progress.passedQuizzes}/{progress.totalQuizzes} اختبار
          </span>
          <span>{progress.percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="تقدّمك في الدورة"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percent}
          className="h-2.5 overflow-hidden rounded-full bg-brand-soft"
        >
          <div className="h-full bg-brand" style={{ width: `${progress.percent}%` }} />
        </div>
        <div className="flex flex-wrap gap-3">
          {firstOpen && (
            <Link href={`/portal/courses/${course.slug}/lessons/${firstOpen.id}`} className="btn btn-sm">
              {progress.doneLessons > 0 ? "تابع من حيث توقفت" : "ابدأ أول درس"}
            </Link>
          )}
          {enrollment.certificateCode && (
            <Link href={`/certificate/${enrollment.certificateCode}`} className="btn btn-secondary btn-sm">
              عرض الشهادة
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {course.sections.length === 0 && <p className="card text-muted">لم يُضَف محتوى لهذه الدورة بعد.</p>}
        {course.sections.map((s, i) => (
          <section key={s.id} className="card p-0" aria-labelledby={`s-${s.id}`}>
            <h2 id={`s-${s.id}`} className="border-b border-line px-5 py-3 font-bold">
              {i + 1}. {s.title}
            </h2>
            <ul className="divide-y divide-line">
              {s.lessons.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/portal/courses/${course.slug}/lessons/${l.id}`}
                    className="flex min-h-11 items-center justify-between gap-3 px-5 py-2.5 hover:bg-brand-soft"
                  >
                    <span className="min-w-0 truncate">
                      <span aria-hidden="true">{doneIds.has(l.id) ? "✅ " : "⚪ "}</span>
                      {l.title}
                      <span className="sr-only">{doneIds.has(l.id) ? " (مكتمل)" : " (غير مكتمل)"}</span>
                    </span>
                    <span className="shrink-0 text-sm text-muted">
                      {l.type === "VIDEO" ? "فيديو" : "نص"} · {formatHours(l.minutes)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {course.quizzes.length > 0 && (
          <section className="card p-0" aria-labelledby="quizzes">
            <h2 id="quizzes" className="border-b border-line px-5 py-3 font-bold">
              الاختبارات
            </h2>
            <ul className="divide-y divide-line">
              {course.quizzes.map((q) => {
                const best = bestByQuiz.get(q.id);
                return (
                  <li key={q.id}>
                    <Link
                      href={`/portal/courses/${course.slug}/quizzes/${q.id}`}
                      className="flex min-h-11 items-center justify-between gap-3 px-5 py-2.5 hover:bg-brand-soft"
                    >
                      <span className="min-w-0 truncate">{q.title}</span>
                      <span className="shrink-0 text-sm">
                        {best ? (
                          <span className={best.passed ? "font-semibold text-ok" : "font-semibold text-danger"}>
                            {best.passed ? "ناجح" : "لم تنجح"} · {best.percent}%
                          </span>
                        ) : (
                          <span className="text-muted">{q.questions.length} سؤال</span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
