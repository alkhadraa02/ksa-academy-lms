import type { z } from "zod";
import { getCurrentUser, type SessionUser } from "./auth";
import { ServiceError } from "./services";
import { firstError } from "./validation";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

type Parsed<T> = { ok: true; data: T } | { ok: false; res: Response };

/** Same-origin JSON body check + zod validation for every mutating API route. */
export async function readJson<S extends z.ZodType>(req: Request, schema: S): Promise<Parsed<z.infer<S>>> {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host) {
    let originHost = "";
    try {
      originHost = new URL(origin).host;
    } catch {
      /* invalid origin falls through to the rejection below */
    }
    if (originHost !== host) return { ok: false, res: json({ error: "طلب من مصدر غير مسموح" }, 403) };
  }
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) {
    return { ok: false, res: json({ error: "نوع المحتوى يجب أن يكون JSON" }, 415) };
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false, res: json({ error: "JSON غير صالح" }, 400) };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return { ok: false, res: json({ error: firstError(parsed.error) }, 400) };
  return { ok: true, data: parsed.data };
}

export async function authed(): Promise<{ user: SessionUser } | { res: Response }> {
  const user = await getCurrentUser();
  if (!user) return { res: json({ error: "سجّل الدخول أولاً" }, 401) };
  return { user };
}

export function handleError(err: unknown) {
  if (err instanceof ServiceError) return json({ error: err.message }, err.status);
  console.error(err);
  return json({ error: "حدث خطأ غير متوقع" }, 500);
}
