"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  lessonId: string;
  done: boolean;
  nextHref: string | null;
  nextLabel: string;
};

export function LessonComplete({ lessonId, done, nextHref, nextLabel }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(done);
  const [certificate, setCertificate] = useState<string | null>(null);

  async function mark() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/lessons/${lessonId}/complete`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string; certificateCode?: string | null };
      if (!res.ok) {
        setError(data.error ?? "تعذّر حفظ التقدّم");
        return;
      }
      setCompleted(true);
      setCertificate(data.certificateCode ?? null);
      router.refresh();
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-3">
      {error && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      {certificate && (
        <p role="status" className="rounded-lg bg-ok-soft px-3 py-2 text-sm font-semibold text-ok">
          أتممت الدورة! شهادتك جاهزة:{" "}
          <Link href={`/certificate/${certificate}`} className="underline">
            عرض الشهادة
          </Link>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {completed ? (
          <span className="badge badge-ok">✓ تم إكمال الدرس</span>
        ) : (
          <button type="button" className="btn" onClick={mark} disabled={busy}>
            {busy ? "جارٍ الحفظ…" : "أكملت الدرس"}
          </button>
        )}
        {nextHref && (
          <Link href={nextHref} className="btn btn-secondary">
            {nextLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
