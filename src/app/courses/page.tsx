import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { CourseCard } from "@/components/CourseCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "دليل الدورات التدريبية",
  description: "تصفّح الدورات التدريبية العربية حسب التصنيف والمستوى، مجانية ومدفوعة، مع اختبارات وشهادات إتمام.",
  alternates: { canonical: "/courses" },
  openGraph: { title: "دليل الدورات التدريبية", url: "/courses" },
};

type Search = Promise<{ q?: string; category?: string }>;

export default async function CoursesPage({ searchParams }: { searchParams: Search }) {
  const { q, category } = await searchParams;
  const term = (q ?? "").trim().slice(0, 80);
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const courses = await prisma.course.findMany({
    where: {
      published: true,
      ...(category ? { category: { slug: category } } : {}),
      ...(term ? { OR: [{ title: { contains: term } }, { summary: { contains: term } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { category: true, instructor: true },
  });

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold">دليل الدورات التدريبية</h1>
      <form method="get" action="/courses" className="card mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_14rem_auto] sm:items-end">
        <div>
          <label htmlFor="q" className="label">
            ابحث عن دورة
          </label>
          <input id="q" name="q" defaultValue={term} className="input" placeholder="مثال: إدارة المشاريع" />
        </div>
        <div>
          <label htmlFor="category" className="label">
            التصنيف
          </label>
          <select id="category" name="category" defaultValue={category ?? ""} className="input">
            <option value="">كل التصنيفات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn">
          بحث
        </button>
      </form>

      <p className="mt-6 text-muted" role="status">
        {courses.length} دورة
      </p>
      {courses.length === 0 ? (
        <div className="card mt-3 text-center text-muted">لا توجد دورات مطابقة لبحثك، جرّب تصنيفاً أو كلمة أخرى.</div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </div>
  );
}
