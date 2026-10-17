import { authed, handleError, json, readJson } from "@/lib/api";
import { submitQuiz } from "@/lib/services";
import { quizSubmitSchema } from "@/lib/validation";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const a = await authed();
    if ("res" in a) return a.res;
    const parsed = await readJson(req, quizSubmitSchema);
    if (!parsed.ok) return parsed.res;
    const { id } = await ctx.params;
    const result = await submitQuiz(a.user.id, id, parsed.data.answers);
    return json({ ok: true, result });
  } catch (err) {
    return handleError(err);
  }
}
