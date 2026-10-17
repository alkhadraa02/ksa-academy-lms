import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseOptions } from "@/lib/format";
import { ApiForm } from "@/components/ApiForm";
import { Field } from "@/components/Field";
import { MoveButtons } from "@/components/MoveButtons";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "منشئ الاختبار" };

const correctOptions = [0, 1, 2, 3, 4, 5].map((i) => ({ value: String(i), label: `الخيار ${i + 1}` }));

export default async function QuizBuilder({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { course: true, questions: { orderBy: { position: "asc" } } },
  });
  if (!quiz) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/admin/courses/${quiz.courseId}`} className="text-sm text-brand-strong underline">
          ← {quiz.course.title}
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{quiz.title}</h1>
      </div>

      <ApiForm action={`/api/admin/quizzes/${quiz.id}`} method="PATCH" submitLabel="حفظ الاختبار" successText="تم الحفظ" className="card space-y-3">
        <Field uid="qz" name="title" label="عنوان الاختبار" required defaultValue={quiz.title} />
        <Field uid="qz" name="passPercent" label="درجة النجاح %" type="number" min={1} max={100} required defaultValue={quiz.passPercent} />
      </ApiForm>

      <section aria-labelledby="qs" className="space-y-4">
        <h2 id="qs" className="text-2xl font-bold">
          الأسئلة ({quiz.questions.length})
        </h2>
        {quiz.questions.length === 0 && <p className="card text-muted">لا توجد أسئلة بعد.</p>}
        {quiz.questions.map((q, i) => (
          <details key={q.id} className="card">
            <summary className="flex min-h-11 cursor-pointer items-center font-semibold">
              {i + 1}. {q.text}
            </summary>
            <div className="mt-4 space-y-3">
              <ApiForm
                action={`/api/admin/questions/${q.id}`}
                method="PATCH"
                submitLabel="حفظ السؤال"
                successText="تم الحفظ"
                className="space-y-3"
              >
                <Field uid={`q-${q.id}`} name="text" label="نص السؤال" required defaultValue={q.text} />
                <Field
                  uid={`q-${q.id}`}
                  name="options"
                  label="الخيارات (خيار في كل سطر)"
                  textarea
                  rows={4}
                  dataType="lines"
                  required
                  defaultValue={parseOptions(q.options).join("\n")}
                />
                <Field uid={`q-${q.id}`} name="correctIndex" label="الإجابة الصحيحة" defaultValue={q.correctIndex} options={correctOptions} />
              </ApiForm>
              <div className="flex flex-wrap items-center gap-3">
                <MoveButtons kind="question" id={q.id} name={`السؤال ${i + 1}`} />
                <ApiForm
                  action={`/api/admin/questions/${q.id}`}
                  method="DELETE"
                  submitLabel="حذف السؤال"
                  ariaLabel={`حذف السؤال ${i + 1}`}
                  confirmText="حذف هذا السؤال؟"
                  buttonClassName="btn btn-danger btn-sm"
                />
              </div>
            </div>
          </details>
        ))}

        <ApiForm
          action={`/api/admin/quizzes/${quiz.id}/questions`}
          submitLabel="إضافة السؤال"
          successText="تمت إضافة السؤال"
          resetOnSuccess
          className="card space-y-3"
        >
          <h3 className="font-bold">سؤال جديد</h3>
          <Field uid="qn" name="text" label="نص السؤال" required />
          <Field uid="qn" name="options" label="الخيارات (خيار في كل سطر، من 2 إلى 6)" textarea rows={4} dataType="lines" required />
          <Field uid="qn" name="correctIndex" label="الإجابة الصحيحة" defaultValue={0} options={correctOptions} />
        </ApiForm>
      </section>
    </div>
  );
}
