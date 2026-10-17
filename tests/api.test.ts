import { randomBytes } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const jar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`redirect:${to}`);
  },
}));

import { prisma } from "@/lib/db";
import { hashPassword, SESSION_COOKIE } from "@/lib/auth";
import { resetRateLimit } from "@/lib/rate-limit";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as enroll } from "@/app/api/enroll/route";
import { POST as createCourse } from "@/app/api/admin/courses/route";
import { POST as decide } from "@/app/api/admin/enrollments/route";
import { resetDb } from "./helpers";

const post = (url: string, body: unknown) =>
  new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", host: "localhost" },
    body: JSON.stringify(body),
  });

const randomPassword = () => `Pw-${randomBytes(9).toString("hex")}`;
const TEST_PASSWORD = randomPassword();
const WRONG_PASSWORD = randomPassword();
const SARA_PASSWORD = randomPassword();
const KHALID_PASSWORD = randomPassword();
let courseId: string;
let categoryId: string;
let instructorId: string;

beforeAll(async () => {
  await resetDb();
  await prisma.user.create({
    data: { name: "مدير", email: "admin@example.test", passwordHash: await hashPassword(TEST_PASSWORD), role: "ADMIN" },
  });
  const c = await prisma.category.create({ data: { name: "تقنية", slug: "tech-api" } });
  const i = await prisma.instructor.create({ data: { name: "مدرب", title: "مهندس" } });
  categoryId = c.id;
  instructorId = i.id;
  const course = await prisma.course.create({
    data: {
      title: "دورة API",
      slug: "api-course",
      summary: "ملخص الدورة",
      description: "وصف",
      price: 300,
      published: true,
      categoryId: c.id,
      instructorId: i.id,
    },
  });
  courseId = course.id;
});

beforeEach(() => {
  jar.clear();
  resetRateLimit();
});

describe("auth routes", () => {
  it("rejects invalid bodies with 400 and bad credentials with 401", async () => {
    expect((await login(post("/api/auth/login", { email: "nope" }))).status).toBe(400);
    const res = await login(post("/api/auth/login", { email: "admin@example.test", password: WRONG_PASSWORD }));
    expect(res.status).toBe(401);
    expect(jar.has(SESSION_COOKIE)).toBe(false);
  });

  it("signs an admin in, sets a session cookie and redirects to /admin", async () => {
    const res = await login(post("/api/auth/login", { email: "ADMIN@example.test", password: TEST_PASSWORD }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, role: "ADMIN", redirect: "/admin" });
    expect(jar.get(SESSION_COOKIE)).toMatch(/^[0-9a-f]{64}$/);
    // only a hash of the token is stored
    const stored = await prisma.session.findMany();
    expect(stored.every((s) => s.tokenHash !== jar.get(SESSION_COOKIE))).toBe(true);
  });

  it("throttles repeated failed logins", async () => {
    let last = 0;
    for (let i = 0; i < 10; i++) {
      last = (await login(post("/api/auth/login", { email: "admin@example.test", password: WRONG_PASSWORD }))).status;
    }
    expect(last).toBe(429);
  });
});

describe("student flow through the API", () => {
  it("requires sign-in to enroll", async () => {
    expect((await enroll(post("/api/enroll", { courseId }))).status).toBe(401);
  });

  it("registers, enrolls with a payment reference and waits for approval", async () => {
    const reg = await register(
      post("/api/auth/register", { name: "سارة العتيبي", email: "sara@example.test", password: SARA_PASSWORD }),
    );
    expect(reg.status).toBe(201);
    expect(jar.has(SESSION_COOKIE)).toBe(true);

    const noRef = await enroll(post("/api/enroll", { courseId }));
    expect(noRef.status).toBe(400);

    const ok = await enroll(post("/api/enroll", { courseId, paymentRef: "TRX-777" }));
    expect(ok.status).toBe(201);
    expect((await ok.json()).status).toBe("PENDING");
  });

  it("forbids students from admin mutations", async () => {
    await register(post("/api/auth/register", { name: "خالد", email: "khalid@example.test", password: KHALID_PASSWORD }));
    const res = await createCourse(
      post("/api/admin/courses", { title: "x", summary: "y", description: "z", categoryId, instructorId }),
    );
    expect(res.status).toBe(403);
  });
});

describe("admin routes", () => {
  it("rejects anonymous callers and cross-origin requests", async () => {
    expect((await decide(post("/api/admin/enrollments", { id: "x", decision: "ACTIVE" }))).status).toBe(401);
    await login(post("/api/auth/login", { email: "admin@example.test", password: TEST_PASSWORD }));
    const cross = new Request("http://localhost/api/admin/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json", host: "localhost", origin: "https://evil.example.com" },
      body: JSON.stringify({ id: "x", decision: "ACTIVE" }),
    });
    expect((await decide(cross)).status).toBe(403);
  });

  it("validates input, creates a course and approves an enrollment", async () => {
    await login(post("/api/auth/login", { email: "admin@example.test", password: TEST_PASSWORD }));

    const invalid = await createCourse(post("/api/admin/courses", { title: "" }));
    expect(invalid.status).toBe(400);

    const created = await createCourse(
      post("/api/admin/courses", {
        title: "Data Analysis Basics",
        summary: "مقدمة عملية في تحليل البيانات",
        description: "تفاصيل الدورة كاملة مع أمثلة تطبيقية",
        price: 150,
        level: "مبتدئ",
        hours: 4,
        categoryId,
        instructorId,
        published: true,
      }),
    );
    expect(created.status).toBe(201);
    const { id } = await created.json();
    expect((await prisma.course.findUniqueOrThrow({ where: { id } })).slug).toBe("data-analysis-basics");

    const enrollment = await prisma.enrollment.findFirstOrThrow({ where: { courseId } });
    const res = await decide(post("/api/admin/enrollments", { id: enrollment.id, decision: "ACTIVE" }));
    expect(res.status).toBe(200);
    expect((await prisma.enrollment.findUniqueOrThrow({ where: { id: enrollment.id } })).status).toBe("ACTIVE");
  });
});
