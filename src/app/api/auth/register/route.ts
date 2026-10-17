import { prisma } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { handleError, json, readJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const parsed = await readJson(req, registerSchema);
    if (!parsed.ok) return parsed.res;
    const { name, password } = parsed.data;
    const email = parsed.data.email.toLowerCase();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    if (!rateLimit(`register:${ip}`, 10, 60 * 60_000)) {
      return json({ error: "محاولات كثيرة، حاول لاحقاً" }, 429);
    }

    if (await prisma.user.findUnique({ where: { email } })) {
      return json({ error: "هذا البريد مسجّل مسبقاً" }, 409);
    }
    const user = await prisma.user.create({
      data: { name, email, passwordHash: await hashPassword(password), role: "STUDENT" },
    });
    await createSession(user.id);
    return json({ ok: true, redirect: "/portal" }, 201);
  } catch (err) {
    return handleError(err);
  }
}
