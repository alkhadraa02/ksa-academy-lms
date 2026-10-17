import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-20 text-center">
      <h1 className="text-3xl font-bold">الصفحة غير موجودة</h1>
      <p className="mt-3 text-muted">ربما حُذفت الصفحة أو الرابط غير صحيح.</p>
      <Link href="/courses" className="btn mt-6">
        تصفّح الدورات
      </Link>
    </div>
  );
}
