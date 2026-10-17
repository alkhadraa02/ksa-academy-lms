import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { ApiForm } from "@/components/ApiForm";

export const metadata: Metadata = { title: "الدورات" };

export default async function AdminCourses() {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, _count: { select: { enrollments: true, sections: true } } },
  });
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">الدورات</h1>
        <Link href="/admin/courses/new" className="btn">
          دورة جديدة
        </Link>
      </div>
      {courses.length === 0 ? (
        <p className="card mt-6 text-muted">لا توجد دورات بعد. أنشئ أول دورة.</p>
      ) : (
        <div className="table-wrap mt-6">
          <table className="table">
            <caption className="sr-only">قائمة الدورات</caption>
            <thead>
              <tr>
                <th scope="col">الدورة</th>
                <th scope="col">التصنيف</th>
                <th scope="col">السعر</th>
                <th scope="col">الأقسام</th>
                <th scope="col">المسجّلون</th>
                <th scope="col">الحالة</th>
                <th scope="col">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td className="font-semibold">{c.title}</td>
                  <td>{c.category.name}</td>
                  <td>{formatPrice(c.price)}</td>
                  <td>{c._count.sections}</td>
                  <td>{c._count.enrollments}</td>
                  <td>
                    <span className={`badge ${c.published ? "badge-ok" : "badge-warn"}`}>{c.published ? "منشورة" : "مسودة"}</span>
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/courses/${c.id}`} className="btn btn-secondary btn-sm">
                        تحرير
                      </Link>
                      <ApiForm
                        action={`/api/admin/courses/${c.id}`}
                        method="DELETE"
                        submitLabel="حذف"
                        ariaLabel={`حذف الدورة ${c.title}`}
                        confirmText={`حذف الدورة «${c.title}» نهائياً مع كل محتواها وتسجيلاتها؟`}
                        buttonClassName="btn btn-danger btn-sm"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
