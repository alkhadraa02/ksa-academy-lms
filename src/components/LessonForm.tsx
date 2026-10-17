import { ApiForm } from "./ApiForm";
import { Field } from "./Field";

type Lesson = { id: string; title: string; type: string; videoUrl: string; content: string; minutes: number };

export function LessonForm({ sectionId, lesson }: { sectionId: string; lesson?: Lesson }) {
  const uid = lesson ? `l-${lesson.id}` : `l-new-${sectionId}`;
  return (
    <ApiForm
      action={lesson ? `/api/admin/lessons/${lesson.id}` : `/api/admin/sections/${sectionId}/lessons`}
      method={lesson ? "PATCH" : "POST"}
      submitLabel={lesson ? "حفظ الدرس" : "إضافة الدرس"}
      successText={lesson ? "تم الحفظ" : "تمت الإضافة"}
      resetOnSuccess={!lesson}
      className="space-y-3"
    >
      <Field uid={uid} name="title" label="عنوان الدرس" required defaultValue={lesson?.title} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          uid={uid}
          name="type"
          label="نوع الدرس"
          defaultValue={lesson?.type ?? "VIDEO"}
          options={[
            { value: "VIDEO", label: "فيديو" },
            { value: "TEXT", label: "نص" },
          ]}
        />
        <Field uid={uid} name="minutes" label="المدة بالدقائق" type="number" min={1} required defaultValue={lesson?.minutes ?? 10} />
      </div>
      <Field
        uid={uid}
        name="videoUrl"
        label="رابط الفيديو (للدروس المرئية)"
        ltr
        defaultValue={lesson?.videoUrl}
        hint="https من يوتيوب أو فيميو، أو ملف mp4/webm مباشر."
      />
      <Field uid={uid} name="content" label="نص الدرس / ملاحظات" textarea rows={4} defaultValue={lesson?.content} />
    </ApiForm>
  );
}
