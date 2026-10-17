import { adminAction, adminBody } from "@/lib/admin-api";
import { deleteLesson, updateLesson } from "@/lib/admin-services";
import { lessonSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  return adminBody(req, lessonSchema, (data) => updateLesson(id, data));
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  return adminAction(req, () => deleteLesson(id));
}
