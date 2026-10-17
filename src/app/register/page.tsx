import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ApiForm } from "@/components/ApiForm";
import { Field } from "@/components/Field";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "إنشاء حساب جديد",
  description: "أنشئ حسابك مجاناً في الأكاديمية وسجّل في الدورات التدريبية واحصل على شهادات إتمام.",
  alternates: { canonical: "/register" },
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/portal");
  return (
    <div className="container-page flex justify-center py-12">
      <div className="card w-full max-w-md">
        <h1 className="mb-5 text-2xl font-bold">إنشاء حساب جديد</h1>
        <ApiForm action="/api/auth/register" submitLabel="إنشاء الحساب" redirectTo="/portal" buttonClassName="btn w-full">
          <div className="space-y-4">
            <Field label="الاسم الكامل" name="name" uid="reg" required autoComplete="name" />
            <Field label="البريد الإلكتروني" name="email" uid="reg" type="email" required autoComplete="email" ltr />
            <Field
              label="كلمة المرور"
              name="password"
              uid="reg"
              type="password"
              required
              autoComplete="new-password"
              hint="8 أحرف على الأقل"
              ltr
            />
          </div>
        </ApiForm>
        <p className="mt-5 text-sm text-muted">
          لديك حساب؟{" "}
          <Link href="/login" className="font-semibold text-brand-strong underline">
            سجّل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
