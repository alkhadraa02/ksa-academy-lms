import { adminBody } from "@/lib/admin-api";
import { createQuestion } from "@/lib/admin-services";
import { questionSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  return adminBody(req, questionSchema, (data) => createQuestion(id, data), 201);
}
