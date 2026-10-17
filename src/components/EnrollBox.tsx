import Link from "next/link";
import { ApiForm } from "./ApiForm";
import { Field } from "./Field";
import { ENROLLMENT_LABEL } from "@/lib/format";

type Props = {
  courseId: string;
  slug: string;
  price: number;
  loggedIn: boolean;
  status: "PENDING" | "ACTIVE" | "REJECTED" | null;
};

export function EnrollBox({ courseId, slug, price, loggedIn, status }: Props) {
  if (!loggedIn) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">سجّل الدخول أو أنشئ حساباً للتسجيل في هذه الدورة.</p>
        <Link href="/login" className="btn w-full">
          تسجيل الدخول
        </Link>
        <Link href="/register" className="btn btn-secondary w-full">
          حساب جديد
        </Link>
      </div>
    );
  }
  if (status === "ACTIVE") {
    return (
      <Link href={`/portal/courses/${slug}`} className="btn w-full">
        تابع التعلّم
      </Link>
    );
  }
  if (status === "PENDING") {
    return (
      <p role="status" className="rounded-lg bg-warn-soft px-3 py-3 text-sm font-semibold text-warn">
        {ENROLLMENT_LABEL.PENDING}. سنفعّل الدورة فور مراجعة الحوالة.
      </p>
    );
  }
  return (
    <ApiForm
      action="/api/enroll"
      submitLabel={price === 0 ? "سجّل مجاناً" : "أرسل طلب التسجيل"}
      buttonClassName="btn w-full"
    >
      {status === "REJECTED" && (
        <p className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
          رُفض طلبك السابق. يمكنك إعادة الإرسال بمرجع دفع صحيح.
        </p>
      )}
      <input type="hidden" name="courseId" value={courseId} />
      {price > 0 && (
        <Field
          label="رقم الحوالة أو مرجع الدفع"
          name="paymentRef"
          uid="enroll"
          required
          hint="حوّل رسوم الدورة ثم أدخل رقم الحوالة، وسيتحقق فريقنا ويفعّل التسجيل."
        />
      )}
    </ApiForm>
  );
}
