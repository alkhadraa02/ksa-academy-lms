import Link from "next/link";
import { prisma } from "@/lib/db";
import { revenueReport } from "@/lib/services";
import { formatPrice } from "@/lib/format";

export default async function AdminHome() {
  const [courses, students, pending, active, revenue] = await Promise.all([
    prisma.course.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.enrollment.count({ where: { status: "PENDING" } }),
    prisma.enrollment.count({ where: { status: "ACTIVE" } }),
    revenueReport(),
  ]);
  const stats = [
    { label: "الدورات", value: courses, href: "/admin/courses" },
    { label: "الطلاب", value: students, href: "/admin/students" },
    { label: "طلبات بانتظار المراجعة", value: pending, href: "/admin/enrollments" },
    { label: "تسجيلات مفعّلة", value: active, href: "/admin/enrollments" },
    { label: "إجمالي الإيرادات", value: formatPrice(revenue.total), href: "/admin/revenue" },
  ];
  return (
    <>
      <h1 className="text-3xl font-bold">لوحة التحكم</h1>
      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="card block hover:bg-brand-soft">
              <span className="block text-sm text-muted">{s.label}</span>
              <span className="block text-3xl font-bold">{s.value}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
