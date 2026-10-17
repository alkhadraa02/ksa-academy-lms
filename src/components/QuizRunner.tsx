"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Q = { id: string; text: string; options: string[] };

type Result = {
  correct: number;
  total: number;
  percent: number;
  passed: boolean;
  results: { questionId: string; chosen: number | null; correctIndex: number; isCorrect: boolean }[];
  progress?: { certificateCode: string | null };
};

export function QuizRunner({ quizId, questions, passPercent }: { quizId: string; questions: Q[]; passPercent: number }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (Object.keys(answers).length < questions.length) {
      setError("أجب عن جميع الأسئلة قبل الإرسال");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = (await res.json().catch(() => ({}))) as Result & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "تعذّر إرسال الإجابات");
        return;
      }
      setResult(data);
      router.refresh();
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  function retry() {
    setResult(null);
    setAnswers({});
  }

  if (result) {
    const byId = new Map(result.results.map((r) => [r.questionId, r]));
    return (
      <div className="space-y-5">
        <div
          role="status"
          className={`rounded-xl px-5 py-4 font-semibold ${result.passed ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger"}`}
        >
          <p className="text-xl">
            {result.passed ? "أحسنت! لقد نجحت" : "لم تصل إلى درجة النجاح"} — {result.percent}%
          </p>
          <p className="text-sm">
            {result.correct} من {result.total} إجابة صحيحة (درجة النجاح {passPercent}%)
          </p>
          {result.progress?.certificateCode && (
            <p className="mt-2 text-sm">
              <Link href={`/certificate/${result.progress.certificateCode}`} className="underline">
                شهادتك جاهزة: عرض الشهادة
              </Link>
            </p>
          )}
        </div>
        <ol className="space-y-3">
          {questions.map((q, i) => {
            const r = byId.get(q.id);
            return (
              <li key={q.id} className="card">
                <p className="font-semibold">
                  {i + 1}. {q.text}
                </p>
                <p className={`mt-1 text-sm font-semibold ${r?.isCorrect ? "text-ok" : "text-danger"}`}>
                  {r?.isCorrect ? "إجابة صحيحة" : "إجابة خاطئة"}
                </p>
                {!r?.isCorrect && r && (
                  <p className="text-sm text-muted">الإجابة الصحيحة: {q.options[r.correctIndex]}</p>
                )}
              </li>
            );
          })}
        </ol>
        <button type="button" className="btn btn-secondary" onClick={retry}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {questions.map((q, i) => (
        <fieldset key={q.id} className="card">
          <legend className="px-1 font-semibold">
            {i + 1}. {q.text}
          </legend>
          <div className="mt-2 space-y-1">
            {q.options.map((opt, idx) => (
              <label key={idx} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-brand-soft">
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={idx}
                  checked={answers[q.id] === idx}
                  onChange={() => setAnswers((a) => ({ ...a, [q.id]: idx }))}
                  className="size-5 accent-brand"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {error && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <button type="submit" className="btn" disabled={busy}>
        {busy ? "جارٍ التصحيح…" : "إرسال الإجابات"}
      </button>
    </form>
  );
}
