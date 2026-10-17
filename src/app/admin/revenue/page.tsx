import type { Metadata } from "next";
import { revenueReport } from "@/lib/services";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "تقرير الإيرادات" };

export default async function RevenuePage() {
  const r = await revenueReport();
  const max = Math.max(1, ...r.byMonth.map((m) => m.amount));
  const stats = [
    { label: "إجمالي الإيرادات المعتمدة", value: formatPrice(r.total) },
    { label: "تسجيلات مدفوعة", value: String(r.paidEnrollments) },
    { label: "مبالغ قيد المراجعة", value: formatPrice(r.pendingAmount) },
    { label: "طلبات معلّقة", value: String(r.pendingCount) },
  ];
  return (
    <>
      <h1 className="text-3xl font-bold">تقرير الإيرادات</h1>
      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <dt className="text-sm text-muted">{s.label}</dt>
            <dd className="text-2xl font-bold">{s.value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mb-3 mt-10 text-xl font-bold">حسب الدورة</h2>
      {r.byCourse.length === 0 ? (
        <p className="card text-muted">لا توجد إيرادات معتمدة بعد.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">الإيرادات حسب الدورة</caption>
            <thead>
              <tr>
                <th scope="col">الدورة</th>
                <th scope="col">التسجيلات</th>
                <th scope="col">الإيراد</th>
              </tr>
            </thead>
            <tbody>
              {r.byCourse.map((c) => (
                <tr key={c.title}>
                  <td className="font-semibold">{c.title}</td>
                  <td>{c.count}</td>
                  <td>{formatPrice(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mb-3 mt-10 text-xl font-bold">حسب الشهر</h2>
      {r.byMonth.length === 0 ? (
        <p className="card text-muted">لا توجد بيانات شهرية.</p>
      ) : (
        <ul className="card space-y-3">
          {r.byMonth.map((m) => (
            <li key={m.month} className="grid grid-cols-[5rem_1fr_7rem] items-center gap-3">
              <span dir="ltr" className="text-start text-sm">
                {m.month}
              </span>
              <span className="h-3 overflow-hidden rounded-full bg-brand-soft" aria-hidden="true">
                <span className="block h-full bg-brand" style={{ width: `${Math.round((m.amount / max) * 100)}%` }} />
              </span>
              <span className="text-sm font-semibold">{formatPrice(m.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
