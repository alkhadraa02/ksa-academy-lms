import { prisma } from "@/lib/db";
import { ApiForm } from "./ApiForm";
import { Field } from "./Field";

type Course = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  price: number;
  level: string;
  hours: number;
  categoryId: string;
  instructorId: string;
  published: boolean;
};

export async function CourseForm({ course }: { course?: Course }) {
  const [categories, instructors] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.instructor.findMany({ orderBy: { name: "asc" } }),
  ]);
  const uid = course ? `c-${course.id}` : "c-new";
  return (
    <ApiForm
      action={course ? `/api/admin/courses/${course.id}` : "/api/admin/courses"}
      method={course ? "PATCH" : "POST"}
      submitLabel={course ? "حفظ التعديلات" : "إنشاء الدورة"}
      redirectTo={course ? undefined : "/admin/courses/{id}"}
      successText={course ? "تم الحفظ" : undefined}
      className="card space-y-4"
    >
      <Field uid={uid} name="title" label="عنوان الدورة" required defaultValue={course?.title} />
      <Field
        uid={uid}
        name="slug"
        label="الرابط المختصر (اختياري)"
        ltr
        defaultValue={course?.slug}
        hint="أحرف إنجليزية صغيرة وأرقام وشرطات، ويُولَّد تلقائياً إن تُرك فارغاً."
      />
      <Field uid={uid} name="summary" label="ملخص قصير" required textarea rows={2} defaultValue={course?.summary} />
      <Field uid={uid} name="description" label="وصف الدورة" required textarea rows={6} defaultValue={course?.description} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field uid={uid} name="price" label="السعر (ر.س، 0 = مجانية)" type="number" min={0} required defaultValue={course?.price ?? 0} />
        <Field uid={uid} name="hours" label="عدد الساعات" type="number" min={1} required defaultValue={course?.hours ?? 1} />
        <Field
          uid={uid}
          name="level"
          label="المستوى"
          defaultValue={course?.level ?? "مبتدئ"}
          options={["مبتدئ", "متوسط", "متقدم"].map((v) => ({ value: v, label: v }))}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          uid={uid}
          name="categoryId"
          label="التصنيف"
          defaultValue={course?.categoryId}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <Field
          uid={uid}
          name="instructorId"
          label="المدرّب"
          defaultValue={course?.instructorId}
          options={instructors.map((i) => ({ value: i.id, label: i.name }))}
        />
      </div>
      <Field uid={uid} name="published" label="نشر الدورة في الكتالوج" type="checkbox" defaultValue={course?.published ?? false} />
    </ApiForm>
  );
}
