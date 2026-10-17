import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { handleError, json, readJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const parsed = await readJson(req, loginSchema);
    if (!parsed.ok) return parsed.res;
    const email = parsed.data.email.toLowerCase();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    if (!rateLimit(`login:${ip}:${email}`, 8, 10 * 60_000)) {
      return json({ error: "محاولات كثيرة، حاول بعد عدة دقائق" }, 429);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const ok = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
    if (!user || !ok) return json({ error: "البريد أو كلمة المرور غير صحيحة" }, 401);

    await createSession(user.id);
    return json({ ok: true, role: user.role, redirect: user.role === "ADMIN" ? "/admin" : "/portal" });
  } catch (err) {
    return handleError(err);
  }
}
