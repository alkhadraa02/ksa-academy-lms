"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { kind: "section" | "lesson" | "question" | "quiz"; id: string; name: string };

export function MoveButtons({ kind, id, name }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function move(direction: "up" | "down") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id, direction }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "تعذّر النقل");
        return;
      }
      router.refresh();
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button type="button" className="btn btn-secondary btn-sm btn-icon" disabled={busy} aria-label={`نقل ${name} للأعلى`} onClick={() => move("up")}>
        <span aria-hidden="true">↑</span>
      </button>
      <button type="button" className="btn btn-secondary btn-sm btn-icon" disabled={busy} aria-label={`نقل ${name} للأسفل`} onClick={() => move("down")}>
        <span aria-hidden="true">↓</span>
      </button>
      {error && (
        <span role="alert" className="text-sm font-semibold text-danger">
          {error}
        </span>
      )}
    </span>
  );
}
