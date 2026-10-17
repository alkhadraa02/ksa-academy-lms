import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: { default: "لوحة التحكم", template: "%s | لوحة التحكم" }, robots: { index: false } };

const links = [
  { href: "/admin", label: "نظرة عامة" },
  { href: "/admin/courses", label: "الدورات" },
  { href: "/admin/enrollments", label: "طلبات الالتحاق" },
  { href: "/admin/students", label: "الطلاب" },
  { href: "/admin/revenue", label: "الإيرادات" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <div className="container-page py-6">
      <nav aria-label="لوحة التحكم" className="mb-6 flex flex-wrap gap-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="btn btn-secondary btn-sm">
            {l.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
