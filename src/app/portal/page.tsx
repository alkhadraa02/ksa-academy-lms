import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { courseProgress } from "@/lib/services";
import { ENROLLMENT_LABEL, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "دوراتي",
  description: "تابع دوراتك المسجّلة وتقدّمك وشهاداتك في بوابة الطالب بالأكاديمية.",
  robots: { index: false },
};

export default async function PortalPage() {
  const user = await requireUser();
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { course: { include: { category: true } } },
  });
  const rows = await Promise.all(
    enrollments.map(async (e) => ({
      e,
      progress: e.status === "ACTIVE" ? await courseProgress(user.id, e.courseId) : null,
    })),
  );

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold">مرحباً {user.name}</h1>
      <p className="mt-1 text-muted">دوراتك وتقدّمك في مكان واحد.</p>

      {rows.length === 0 ? (
        <div className="card mt-8 text-center">
          <p className="text-muted">لم تسجّل في أي دورة بعد.</p>
          <Link href="/courses" className="btn mt-4">
            تصفّح الدورات
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {rows.map(({ e, progress }) => (
            <li key={e.id} className="card min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge">{e.course.category.name}</span>
                <span
                  className={`badge ${e.status === "ACTIVE" ? "badge-ok" : e.status === "PENDING" ? "badge-warn" : "badge-danger"}`}
                >
                  {ENROLLMENT_LABEL[e.status]}
                </span>
              </div>
              <h2 className="text-lg font-bold">{e.course.title}</h2>
              {progress && (
                <div>
                  <div className="mb-1 flex justify-between text-sm text-muted">
                    <span>
                      {progress.doneLessons}/{progress.totalLessons} درس · {progress.passedQuizzes}/{progress.totalQuizzes} اختبار
                    </span>
                    <span>{progress.percent}%</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`تقدّم ${e.course.title}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress.percent}
                    className="h-2.5 overflow-hidden rounded-full bg-brand-soft"
                  >
                    <div className="h-full bg-brand" style={{ width: `${progress.percent}%` }} />
                  </div>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                {e.status === "ACTIVE" && (
                  <Link href={`/portal/courses/${e.course.slug}`} className="btn btn-sm">
                    {progress && progress.percent > 0 ? "تابع التعلّم" : "ابدأ الدورة"}
                  </Link>
                )}
                {e.certificateCode && (
                  <Link href={`/certificate/${e.certificateCode}`} className="btn btn-secondary btn-sm">
                    الشهادة
                  </Link>
                )}
                {e.status === "REJECTED" && (
                  <Link href={`/courses/${e.course.slug}`} className="btn btn-secondary btn-sm">
                    إعادة الإرسال
                  </Link>
                )}
                <span className="text-sm text-muted">سُجّلت في {formatDate(e.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
