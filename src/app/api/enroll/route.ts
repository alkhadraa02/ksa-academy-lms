import { authed, handleError, json, readJson } from "@/lib/api";
import { enrollUser } from "@/lib/services";
import { enrollSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const a = await authed();
    if ("res" in a) return a.res;
    const parsed = await readJson(req, enrollSchema);
    if (!parsed.ok) return parsed.res;

    const { enrollment, created } = await enrollUser(a.user.id, parsed.data.courseId, parsed.data.paymentRef);
    return json(
      {
        ok: true,
        status: enrollment.status,
        message:
          enrollment.status === "ACTIVE"
            ? "تم تسجيلك في الدورة، ابدأ التعلّم الآن"
            : "استلمنا طلبك وسيُفعَّل بعد التحقق من الدفع",
      },
      created ? 201 : 200,
    );
  } catch (err) {
    return handleError(err);
  }
}
