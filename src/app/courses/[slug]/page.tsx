import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatHours, formatPrice } from "@/lib/format";
import { EnrollBox } from "@/components/EnrollBox";
import { BRAND } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

async function load(slug: string) {
  return prisma.course.findFirst({
    where: { slug, published: true },
    include: {
      category: true,
      instructor: true,
      sections: { orderBy: { position: "asc" }, include: { lessons: { orderBy: { position: "asc" } } } },
      quizzes: { orderBy: { position: "asc" }, include: { _count: { select: { questions: true } } } },
    },
  });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const course = await load(slug);
  if (!course) return { title: "الدورة غير موجودة", robots: { index: false } };
  const description = course.summary.length >= 50 ? course.summary.slice(0, 160) : `${course.summary} — دورة تدريبية عربية على ${BRAND}.`.slice(0, 160);
  return {
    title: course.title.slice(0, 60),
    description,
    alternates: { canonical: `/courses/${course.slug}` },
    openGraph: { title: course.title.slice(0, 60), description, url: `/courses/${course.slug}`, type: "website" },
  };
}

export default async function CoursePage({ params }: { params: Params }) {
  const { slug } = await params;
  const course = await load(slug);
  if (!course) notFound();

  const user = await getCurrentUser();
  const enrollment = user
    ? await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } })
    : null;

  const lessons = course.sections.flatMap((s) => s.lessons);
  const totalMinutes = lessons.reduce((n, l) => n + l.minutes, 0);

  const ld = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.summary,
    inLanguage: "ar",
    provider: { "@type": "Organization", name: BRAND },
    offers: { "@type": "Offer", price: course.price, priceCurrency: "SAR", category: course.price === 0 ? "Free" : "Paid" },
  };

  return (
    <div className="container-page py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-8">
          <header>
            <span className="badge">{course.category.name}</span>
            <h1 className="mt-3 text-3xl font-bold leading-tight">{course.title}</h1>
            <p className="mt-3 text-lg text-muted">{course.summary}</p>
            <p className="mt-3 text-sm text-muted">
              {course.level} · {course.hours} ساعة · {lessons.length} درس · {course.quizzes.length} اختبار
            </p>
          </header>

          <section aria-labelledby="about">
            <h2 id="about" className="mb-2 text-xl font-bold">
              عن الدورة
            </h2>
            <p className="prose-lesson text-ink">{course.description}</p>
          </section>

          <section aria-labelledby="curriculum">
            <h2 id="curriculum" className="mb-3 text-xl font-bold">
              المنهج
            </h2>
            {course.sections.length === 0 ? (
              <p className="card text-muted">لم يُضَف محتوى لهذه الدورة بعد.</p>
            ) : (
              <div className="space-y-3">
                {course.sections.map((s, i) => (
                  <div key={s.id} className="card p-0">
                    <h3 className="border-b border-line px-5 py-3 font-bold">
                      {i + 1}. {s.title}
                    </h3>
                    <ul className="divide-y divide-line">
                      {s.lessons.map((l) => (
                        <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                          <span className="min-w-0 truncate">{l.title}</span>
                          <span className="shrink-0 text-muted">
                            {l.type === "VIDEO" ? "فيديو" : "نص"} · {formatHours(l.minutes)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {course.quizzes.length > 0 && (
                  <div className="card p-0">
                    <h3 className="border-b border-line px-5 py-3 font-bold">الاختبارات</h3>
                    <ul className="divide-y divide-line">
                      {course.quizzes.map((q) => (
                        <li key={q.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                          <span className="min-w-0 truncate">{q.title}</span>
                          <span className="shrink-0 text-muted">
                            {q._count.questions} سؤال · النجاح {q.passPercent}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>

          <section aria-labelledby="instructor" className="card">
            <h2 id="instructor" className="mb-1 text-xl font-bold">
              المدرّب
            </h2>
            <p className="font-semibold">{course.instructor.name}</p>
            <p className="text-sm text-muted">{course.instructor.title}</p>
            <p className="mt-2">{course.instructor.bio}</p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card space-y-4">
            <p className="text-3xl font-bold">{formatPrice(course.price)}</p>
            <ul className="space-y-1 text-sm text-muted">
              <li>المستوى: {course.level}</li>
              <li>المدة: {formatHours(totalMinutes || course.hours * 60)}</li>
              <li>شهادة إتمام عند إنهاء الدروس واجتياز الاختبارات</li>
            </ul>
            <EnrollBox
              courseId={course.id}
              slug={course.slug}
              price={course.price}
              loggedIn={Boolean(user)}
              status={enrollment?.status ?? null}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
