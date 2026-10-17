import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { CourseCard } from "@/components/CourseCard";
import { BRAND } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${BRAND} | دورات تدريبية احترافية بالعربية`,
  description:
    "تعلّم مهارات سوق العمل مع دورات عربية بإشراف مدرّبين سعوديين، اختبارات تصحيح تلقائي وشهادات إتمام قابلة للطباعة.",
  alternates: { canonical: "/" },
  openGraph: { title: `${BRAND} | دورات تدريبية`, description: "دورات عربية باختبارات وشهادات إتمام.", url: "/" },
};

export default async function HomePage() {
  const [categories, courses, courseCount] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { courses: { where: { published: true } } } } } }),
    prisma.course.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { category: true, instructor: true },
    }),
    prisma.course.count({ where: { published: true } }),
  ]);

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: BRAND,
    description: "منصة تعلّم إلكتروني عربية للدورات التدريبية والشهادات.",
    areaServed: "SA",
    inLanguage: "ar",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd).replace(/</g, "\\u003c") }} />
      <section className="bg-brand-soft">
        <div className="container-page py-12 sm:py-20">
          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-brand-strong sm:text-5xl">
            طوّر مهاراتك مع دورات عربية تقودك إلى شهادة معتمدة
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            {courseCount} دورة في الإدارة والتقنية والتسويق واللغات، بدروس فيديو ونصوص واختبارات تصحيح تلقائي. تعلّم في الوقت الذي يناسبك واحصل على شهادة إتمام قابلة للطباعة.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/courses" className="btn">
              تصفّح الدورات
            </Link>
            <Link href="/register" className="btn btn-secondary">
              أنشئ حساباً مجانياً
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-12" aria-labelledby="cats">
        <h2 id="cats" className="mb-6 text-2xl font-bold">
          التصنيفات
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`/courses?category=${c.slug}`} className="card block min-w-0 hover:border-brand">
                <span className="block truncate font-bold">{c.name}</span>
                <span className="text-sm text-muted">{c._count.courses} دورة</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page pb-16" aria-labelledby="latest">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 id="latest" className="text-2xl font-bold">
            أحدث الدورات
          </h2>
          <Link href="/courses" className="font-semibold text-brand-strong underline">
            عرض الكل
          </Link>
        </div>
        {courses.length === 0 ? (
          <p className="card text-muted">لا توجد دورات منشورة حالياً، عُد قريباً.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
