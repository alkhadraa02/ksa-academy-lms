import { adminBody } from "@/lib/admin-api";
import { createLesson } from "@/lib/admin-services";
import { lessonSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  return adminBody(req, lessonSchema, (data) => createLesson(id, data), 201);
}
