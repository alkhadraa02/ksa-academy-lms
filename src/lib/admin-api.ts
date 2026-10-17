import type { z } from "zod";
import { getCurrentUser } from "./auth";
import { handleError, json, readJson } from "./api";

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Returns a 401/403 response unless the caller is a signed-in admin on the same origin. */
export async function guardAdmin(req: Request): Promise<Response | null> {
  if (!sameOrigin(req)) return json({ error: "طلب من مصدر غير مسموح" }, 403);
  const user = await getCurrentUser();
  if (!user) return json({ error: "سجّل الدخول أولاً" }, 401);
  if (user.role !== "ADMIN") return json({ error: "هذه العملية للمدير فقط" }, 403);
  return null;
}

/** Admin-only mutation with a JSON body validated by zod. */
export async function adminBody<S extends z.ZodType>(
  req: Request,
  schema: S,
  run: (data: z.infer<S>) => Promise<unknown>,
  status = 200,
): Promise<Response> {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  const parsed = await readJson(req, schema);
  if (!parsed.ok) return parsed.res;
  try {
    return json(await run(parsed.data), status);
  } catch (err) {
    return handleError(err);
  }
}

/** Admin-only mutation without a body (DELETE). */
export async function adminAction(req: Request, run: () => Promise<unknown>): Promise<Response> {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  try {
    return json(await run());
  } catch (err) {
    return handleError(err);
  }
}
