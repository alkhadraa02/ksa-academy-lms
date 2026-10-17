import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ENROLLMENT_LABEL, formatDate, formatPrice } from "@/lib/format";
import { ApiForm } from "@/components/ApiForm";

export const metadata: Metadata = { title: "طلبات الالتحاق" };

export default async function AdminEnrollments() {
  const rows = await prisma.enrollment.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: { user: { select: { name: true, email: true } }, course: { select: { title: true } } },
    take: 300,
  });
  const pending = rows.filter((r) => r.status === "PENDING");
  const rest = rows.filter((r) => r.status !== "PENDING");

  return (
    <>
      <h1 className="text-3xl font-bold">طلبات الالتحاق</h1>

      <h2 className="mb-3 mt-8 text-xl font-bold">بانتظار المراجعة ({pending.length})</h2>
      {pending.length === 0 ? (
        <p className="card text-muted">لا توجد طلبات معلّقة.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">طلبات بانتظار التحقق من الدفع</caption>
            <thead>
              <tr>
                <th scope="col">الطالب</th>
                <th scope="col">الدورة</th>
                <th scope="col">المبلغ</th>
                <th scope="col">مرجع الدفع</th>
                <th scope="col">التاريخ</th>
                <th scope="col">القرار</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="block font-semibold">{r.user.name}</span>
                    <span className="block text-muted" dir="ltr">
                      {r.user.email}
                    </span>
                  </td>
                  <td>{r.course.title}</td>
                  <td>{formatPrice(r.amount)}</td>
                  <td dir="ltr">{r.paymentRef || "—"}</td>
                  <td>{formatDate(r.createdAt)}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <ApiForm action="/api/admin/enrollments" submitLabel="اعتماد" ariaLabel={`اعتماد طلب ${r.user.name}`} buttonClassName="btn btn-sm">
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="decision" value="ACTIVE" />
                      </ApiForm>
                      <ApiForm
                        action="/api/admin/enrollments"
                        submitLabel="رفض"
                        ariaLabel={`رفض طلب ${r.user.name}`}
                        confirmText="رفض هذا الطلب؟"
                        buttonClassName="btn btn-danger btn-sm"
                      >
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="decision" value="REJECTED" />
                      </ApiForm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mb-3 mt-10 text-xl font-bold">السجل</h2>
      {rest.length === 0 ? (
        <p className="card text-muted">لا يوجد سجل بعد.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">سجل التسجيلات</caption>
            <thead>
              <tr>
                <th scope="col">الطالب</th>
                <th scope="col">الدورة</th>
                <th scope="col">المبلغ</th>
                <th scope="col">الحالة</th>
                <th scope="col">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {rest.map((r) => (
                <tr key={r.id}>
                  <td>{r.user.name}</td>
                  <td>{r.course.title}</td>
                  <td>{formatPrice(r.amount)}</td>
                  <td>
                    <span className={`badge ${r.status === "ACTIVE" ? "badge-ok" : "badge-danger"}`}>{ENROLLMENT_LABEL[r.status]}</span>
                  </td>
                  <td>{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
