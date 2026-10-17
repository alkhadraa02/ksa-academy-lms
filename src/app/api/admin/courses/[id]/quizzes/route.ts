import { adminBody } from "@/lib/admin-api";
import { createQuiz } from "@/lib/admin-services";
import { quizSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  return adminBody(req, quizSchema, (data) => createQuiz(id, data), 201);
}
