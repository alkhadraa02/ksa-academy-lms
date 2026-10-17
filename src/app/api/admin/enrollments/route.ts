import { adminBody } from "@/lib/admin-api";
import { decideEnrollment } from "@/lib/services";
import { decisionSchema } from "@/lib/validation";

export async function POST(req: Request) {
  return adminBody(req, decisionSchema, async (d) => {
    await decideEnrollment(d.id, d.decision);
    return { ok: true };
  });
}
