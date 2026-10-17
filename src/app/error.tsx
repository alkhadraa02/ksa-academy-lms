"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page py-20 text-center" role="alert">
      <h1 className="text-3xl font-bold">حدث خطأ غير متوقع</h1>
      <p className="mt-3 text-muted">تعذّر تحميل الصفحة. حاول مرة أخرى.</p>
      <button type="button" className="btn mt-6" onClick={reset}>
        إعادة المحاولة
      </button>
    </div>
  );
}
