"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

type Props = {
  action: string;
  method?: "POST" | "PATCH" | "DELETE";
  children?: ReactNode;
  submitLabel: string;
  ariaLabel?: string;
  /** Where to go after success. `{id}` is replaced by the `id` the API returns. Default: refresh the page. */
  redirectTo?: string;
  confirmText?: string;
  className?: string;
  buttonClassName?: string;
  successText?: string;
  resetOnSuccess?: boolean;
};

/**
 * Generic JSON form. Fields use plain `name`s; `data-type="bool"` on a checkbox sends a boolean and
 * `data-type="lines"` on a textarea sends an array of non-empty lines.
 */
export function ApiForm({
  action,
  method = "POST",
  children,
  submitLabel,
  ariaLabel,
  redirectTo,
  confirmText,
  className,
  buttonClassName = "btn",
  successText,
  resetOnSuccess,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (confirmText && !window.confirm(confirmText)) return;
    const form = e.currentTarget;
    const body: Record<string, unknown> = {};
    for (const el of Array.from(form.elements)) {
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) continue;
      if (!el.name) continue;
      const kind = el.dataset.type;
      if (el instanceof HTMLInputElement && el.type === "checkbox") {
        body[el.name] = el.checked;
      } else if (kind === "lines") {
        body[el.name] = el.value
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
      } else if (el instanceof HTMLInputElement && el.type === "radio") {
        if (el.checked) body[el.name] = el.value;
      } else {
        body[el.name] = el.value;
      }
    }
    setBusy(true);
    setError("");
    setDone("");
    try {
      const res = await fetch(action, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "DELETE" ? undefined : JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
      if (!res.ok) {
        setError(data.error ?? "تعذّر تنفيذ الطلب");
        return;
      }
      if (successText) setDone(successText);
      if (resetOnSuccess) form.reset();
      if (redirectTo) router.push(redirectTo.replace("{id}", data.id ?? ""));
      router.refresh();
    } catch {
      setError("تعذّر الاتصال بالخادم، حاول مرة أخرى");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={className} noValidate={false}>
      {children}
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="mt-3 rounded-lg bg-ok-soft px-3 py-2 text-sm font-semibold text-ok">
          {done}
        </p>
      )}
      <button type="submit" disabled={busy} aria-label={ariaLabel} className={`${buttonClassName} ${children ? "mt-4" : ""}`}>
        {busy ? "جارٍ التنفيذ…" : submitLabel}
      </button>
    </form>
  );
}
