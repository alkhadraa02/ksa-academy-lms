import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ApiForm } from "@/components/ApiForm";
import { Field } from "@/components/Field";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "سجّل الدخول إلى حسابك في الأكاديمية لمتابعة دوراتك واختباراتك وشهاداتك.",
  alternates: { canonical: "/login" },
  robots: { index: false },
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/portal");
  return (
    <div className="container-page flex justify-center py-12">
      <div className="card w-full max-w-md">
        <h1 className="mb-5 text-2xl font-bold">تسجيل الدخول</h1>
        <ApiForm action="/api/auth/login" submitLabel="دخول" redirectTo="/portal" buttonClassName="btn w-full">
          <div className="space-y-4">
            <Field label="البريد الإلكتروني" name="email" uid="login" type="email" required autoComplete="email" ltr />
            <Field label="كلمة المرور" name="password" uid="login" type="password" required autoComplete="current-password" ltr />
          </div>
        </ApiForm>
        <p className="mt-5 text-sm text-muted">
          ليس لديك حساب؟{" "}
          <Link href="/register" className="font-semibold text-brand-strong underline">
            أنشئ حساباً
          </Link>
        </p>
      </div>
    </div>
  );
}
