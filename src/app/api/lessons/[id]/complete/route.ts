import { authed, handleError, json } from "@/lib/api";
import { completeLesson } from "@/lib/services";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host && new URL(origin).host !== host) return json({ error: "طلب من مصدر غير مسموح" }, 403);
    const a = await authed();
    if ("res" in a) return a.res;
    const { id } = await ctx.params;
    const progress = await completeLesson(a.user.id, id);
    return json({ ok: true, progress });
  } catch (err) {
    return handleError(err);
  }
}
