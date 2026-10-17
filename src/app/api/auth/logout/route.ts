import { destroySession } from "@/lib/auth";
import { handleError, json } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host && new URL(origin).host !== host) return json({ error: "طلب من مصدر غير مسموح" }, 403);
    await destroySession();
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
