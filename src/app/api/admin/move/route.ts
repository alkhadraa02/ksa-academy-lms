import { z } from "zod";
import { adminBody } from "@/lib/admin-api";
import { moveItem } from "@/lib/admin-services";

const moveSchema = z.object({
  kind: z.enum(["section", "lesson", "question", "quiz"]),
  id: z.string().min(1).max(64),
  direction: z.enum(["up", "down"]),
});

export async function POST(req: Request) {
  return adminBody(req, moveSchema, (d) => moveItem(d.kind, d.id, d.direction));
}
