import { adminAction, adminBody } from "@/lib/admin-api";
import { deleteQuestion, updateQuestion } from "@/lib/admin-services";
import { questionSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  return adminBody(req, questionSchema, (data) => updateQuestion(id, data));
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  return adminAction(req, () => deleteQuestion(id));
}
