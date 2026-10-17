import { adminAction, adminBody } from "@/lib/admin-api";
import { deleteCourse, updateCourse } from "@/lib/admin-services";
import { courseSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  return adminBody(req, courseSchema, (data) => updateCourse(id, data));
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  return adminAction(req, () => deleteCourse(id));
}
