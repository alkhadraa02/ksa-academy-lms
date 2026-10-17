import { adminBody } from "@/lib/admin-api";
import { createSection } from "@/lib/admin-services";
import { sectionSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  return adminBody(req, sectionSchema, (data) => createSection(id, data), 201);
}
