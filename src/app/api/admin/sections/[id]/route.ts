import { adminAction, adminBody } from "@/lib/admin-api";
import { deleteSection, updateSection } from "@/lib/admin-services";
import { sectionSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  return adminBody(req, sectionSchema, (data) => updateSection(id, data));
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  return adminAction(req, () => deleteSection(id));
}
