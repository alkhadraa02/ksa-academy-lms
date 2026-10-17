import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadEnrolledCourse } from "@/lib/portal";
import { parseOptions } from "@/lib/format";
import { QuizRunner } from "@/components/QuizRunner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "اختبار", robots: { index: false } };

type Params = Promise<{ slug: string; quizId: string }>;

export default async function QuizPage({ params }: { params: Params }) {
  const { slug, quizId } = await params;
  const { course } = await loadEnrolledCourse(slug);
  const quiz = course.quizzes.find((q) => q.id === quizId);
  if (!quiz) notFound();

  // correctIndex is deliberately not sent to the browser before submission.
  const questions = quiz.questions.map((q) => ({ id: q.id, text: q.text, options: parseOptions(q.options) }));

  return (
    <div className="container-page max-w-3xl py-8">
      <nav aria-label="مسار التنقّل" className="mb-3 text-sm">
        <Link href={`/portal/courses/${course.slug}`} className="text-brand-strong underline">
          {course.title}
        </Link>
      </nav>
      <h1 className="text-2xl font-bold">{quiz.title}</h1>
      <p className="mb-5 mt-1 text-muted">
        {questions.length} سؤال · درجة النجاح {quiz.passPercent}%
      </p>
      {questions.length === 0 ? (
        <p className="card text-muted">لا تحتوي هذه الاختبار أسئلة بعد.</p>
      ) : (
        <QuizRunner quizId={quiz.id} questions={questions} passPercent={quiz.passPercent} />
      )}
    </div>
  );
}
