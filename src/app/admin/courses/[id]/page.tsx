import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ApiForm } from "@/components/ApiForm";
import { CourseForm } from "@/components/CourseForm";
import { Field } from "@/components/Field";
import { LessonForm } from "@/components/LessonForm";
import { MoveButtons } from "@/components/MoveButtons";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "تحرير الدورة" };

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      sections: { orderBy: { position: "asc" }, include: { lessons: { orderBy: { position: "asc" } } } },
      quizzes: { orderBy: { position: "asc" }, include: { _count: { select: { questions: true } } } },
    },
  });
  if (!course) notFound();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-6 text-3xl font-bold">تحرير: {course.title}</h1>
        <CourseForm course={course} />
      </div>

      <section aria-labelledby="curriculum" className="space-y-4">
        <h2 id="curriculum" className="text-2xl font-bold">
          المنهج
        </h2>
        {course.sections.length === 0 && <p className="card text-muted">لا توجد أقسام بعد، أضف أول قسم.</p>}
        {course.sections.map((s) => (
          <div key={s.id} className="card space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1">
                <ApiForm
                  action={`/api/admin/sections/${s.id}`}
                  method="PATCH"
                  submitLabel="حفظ العنوان"
                  successText="تم الحفظ"
                  className="flex flex-wrap items-end gap-2"
                  buttonClassName="btn btn-secondary btn-sm"
                >
                  <div className="min-w-0 flex-1">
                    <Field uid={`s-${s.id}`} name="title" label="عنوان القسم" required defaultValue={s.title} />
                  </div>
                </ApiForm>
              </div>
              <MoveButtons kind="section" id={s.id} name={`القسم ${s.title}`} />
              <ApiForm
                action={`/api/admin/sections/${s.id}`}
                method="DELETE"
                submitLabel="حذف القسم"
                ariaLabel={`حذف القسم ${s.title}`}
                confirmText={`حذف القسم «${s.title}» وكل دروسه؟`}
                buttonClassName="btn btn-danger btn-sm"
              />
            </div>

            <ul className="space-y-2">
              {s.lessons.map((l) => (
                <li key={l.id} className="rounded-lg border border-line">
                  <details>
                    <summary className="flex min-h-11 cursor-pointer flex-wrap items-center justify-between gap-2 px-3 py-2">
                      <span className="min-w-0 truncate font-semibold">{l.title}</span>
                      <span className="badge">{l.type === "VIDEO" ? "فيديو" : "نص"}</span>
                    </summary>
                    <div className="space-y-3 border-t border-line p-3">
                      <LessonForm sectionId={s.id} lesson={l} />
                      <div className="flex flex-wrap items-center gap-3">
                        <MoveButtons kind="lesson" id={l.id} name={`الدرس ${l.title}`} />
                        <ApiForm
                          action={`/api/admin/lessons/${l.id}`}
                          method="DELETE"
                          submitLabel="حذف الدرس"
                          ariaLabel={`حذف الدرس ${l.title}`}
                          confirmText={`حذف الدرس «${l.title}»؟`}
                          buttonClassName="btn btn-danger btn-sm"
                        />
                      </div>
                    </div>
                  </details>
                </li>
              ))}
            </ul>

            <details className="rounded-lg border border-dashed border-line">
              <summary className="min-h-11 cursor-pointer px-3 py-2 font-semibold text-brand-strong">إضافة درس إلى هذا القسم</summary>
              <div className="border-t border-line p-3">
                <LessonForm sectionId={s.id} />
              </div>
            </details>
          </div>
        ))}

        <ApiForm
          action={`/api/admin/courses/${course.id}/sections`}
          submitLabel="إضافة قسم"
          successText="تمت إضافة القسم"
          resetOnSuccess
          className="card"
        >
          <Field uid="s-new" name="title" label="عنوان قسم جديد" required />
        </ApiForm>
      </section>

      <section aria-labelledby="quizzes" className="space-y-4">
        <h2 id="quizzes" className="text-2xl font-bold">
          الاختبارات
        </h2>
        {course.quizzes.length === 0 && <p className="card text-muted">لا توجد اختبارات بعد.</p>}
        <ul className="space-y-2">
          {course.quizzes.map((q) => (
            <li key={q.id} className="card flex flex-wrap items-center justify-between gap-3">
              <span className="min-w-0 truncate font-semibold">
                {q.title} <span className="text-sm font-normal text-muted">({q._count.questions} سؤال · نجاح {q.passPercent}%)</span>
              </span>
              <span className="flex flex-wrap items-center gap-2">
                <MoveButtons kind="quiz" id={q.id} name={`الاختبار ${q.title}`} />
                <Link href={`/admin/quizzes/${q.id}`} className="btn btn-secondary btn-sm">
                  إدارة الأسئلة
                </Link>
              </span>
            </li>
          ))}
        </ul>
        <ApiForm
          action={`/api/admin/courses/${course.id}/quizzes`}
          submitLabel="إنشاء اختبار"
          successText="تم إنشاء الاختبار"
          resetOnSuccess
          className="card space-y-3"
        >
          <Field uid="q-new" name="title" label="عنوان الاختبار" required />
          <Field uid="q-new" name="passPercent" label="درجة النجاح %" type="number" min={1} max={100} required defaultValue={60} />
        </ApiForm>
      </section>
    </div>
  );
}
