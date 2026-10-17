import { adminBody } from "@/lib/admin-api";
import { createCourse } from "@/lib/admin-services";
import { courseSchema } from "@/lib/validation";

export async function POST(req: Request) {
  return adminBody(req, courseSchema, createCourse, 201);
}
