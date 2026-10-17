import { adminAction, adminBody } from "@/lib/admin-api";
import { deleteQuiz, updateQuiz } from "@/lib/admin-services";
import { quizSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  return adminBody(req, quizSchema, (data) => updateQuiz(id, data));
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  return adminAction(req, () => deleteQuiz(id));
}
