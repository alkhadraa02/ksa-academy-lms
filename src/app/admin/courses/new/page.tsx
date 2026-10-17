import type { Metadata } from "next";
import { CourseForm } from "@/components/CourseForm";

export const metadata: Metadata = { title: "دورة جديدة" };

export default function NewCoursePage() {
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">دورة جديدة</h1>
      <CourseForm />
    </>
  );
}
