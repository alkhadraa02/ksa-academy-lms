import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isCertificateCode } from "@/lib/grading";
import { formatDate } from "@/lib/format";
import { PrintButton } from "@/components/PrintButton";
import { BRAND } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

type Params = Promise<{ code: string }>;

export const metadata: Metadata = {
  title: "شهادة إتمام",
  description: "شهادة إتمام دورة تدريبية صادرة عن الأكاديمية، يمكن التحقق منها برمز الشهادة.",
  robots: { index: false },
};

export default async function CertificatePage({ params }: { params: Params }) {
  const { code } = await params;
  if (!isCertificateCode(code)) notFound();
  const e = await prisma.enrollment.findUnique({
    where: { certificateCode: code },
    include: { user: { select: { name: true } }, course: { include: { instructor: true } } },
  });
  if (!e) notFound();

  return (
    <div className="container-page py-8">
      <div className="no-print mb-4 flex justify-end">
        <PrintButton />
      </div>
      <section
        aria-label="شهادة إتمام"
        className="mx-auto max-w-4xl rounded-2xl border-4 border-double border-brand bg-surface p-6 text-center sm:p-12"
      >
        <p className="text-lg font-semibold text-brand-strong">{BRAND}</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-5xl">شهادة إتمام</h1>
        <p className="mt-8 text-muted">تشهد الأكاديمية بأن</p>
        <p className="mt-2 break-words text-3xl font-bold text-brand-strong sm:text-4xl">{e.user.name}</p>
        <p className="mt-6 text-muted">قد أتمّ بنجاح الدورة التدريبية</p>
        <p className="mt-2 text-2xl font-bold">{e.course.title}</p>
        <p className="mt-2 text-muted">
          بمدة {e.course.hours} ساعة · المستوى {e.course.level}
        </p>
        <div className="mt-10 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted">تاريخ الإتمام</p>
            <p className="font-semibold">{formatDate(e.completedAt ?? e.createdAt)}</p>
          </div>
          <div>
            <p className="text-muted">المدرّب</p>
            <p className="font-semibold">{e.course.instructor.name}</p>
          </div>
          <div>
            <p className="text-muted">رمز الشهادة</p>
            <p className="font-mono font-semibold" dir="ltr">
              {e.certificateCode}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
