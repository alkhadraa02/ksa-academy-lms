import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "الطلاب" };

export default async function AdminStudents() {
  await requireAdmin();
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      enrollments: { select: { status: true, certificateCode: true } },
    },
  });
  return (
    <>
      <h1 className="text-3xl font-bold">الطلاب ({students.length})</h1>
      {students.length === 0 ? (
        <p className="card mt-6 text-muted">لا يوجد طلاب مسجّلون بعد.</p>
      ) : (
        <div className="table-wrap mt-6">
          <table className="table">
            <caption className="sr-only">قائمة الطلاب</caption>
            <thead>
              <tr>
                <th scope="col">الاسم</th>
                <th scope="col">البريد</th>
                <th scope="col">دورات مفعّلة</th>
                <th scope="col">شهادات</th>
                <th scope="col">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold">{s.name}</td>
                  <td dir="ltr" className="text-start">
                    {s.email}
                  </td>
                  <td>{s.enrollments.filter((e) => e.status === "ACTIVE").length}</td>
                  <td>{s.enrollments.filter((e) => e.certificateCode).length}</td>
                  <td>{formatDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
