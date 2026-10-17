import { z } from "zod";
import { parseVideoUrl } from "./grading";

export const loginSchema = z.object({
  email: z.email("البريد الإلكتروني غير صالح").max(160),
  password: z.string().min(1, "أدخل كلمة المرور").max(200),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً").max(80),
  email: z.email("البريد الإلكتروني غير صالح").max(160),
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل").max(200),
});

export const enrollSchema = z.object({
  courseId: z.string().min(1).max(64),
  paymentRef: z.string().trim().max(120).optional(),
});

export const quizSubmitSchema = z.object({
  answers: z.record(z.string().max(64), z.number().int().min(0).max(9)),
});

const id = z.string().min(1).max(64);

export const courseSchema = z.object({
  title: z.string().trim().min(3, "عنوان الدورة قصير").max(120),
  slug: z
    .string()
    .trim()
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "الرابط: أحرف إنجليزية صغيرة وأرقام وشرطات فقط")
    .optional()
    .or(z.literal("")),
  summary: z.string().trim().min(10, "الملخص قصير").max(300),
  description: z.string().trim().min(20, "الوصف قصير").max(5000),
  price: z.coerce.number().int("السعر رقم صحيح").min(0).max(1_000_000),
  level: z.enum(["مبتدئ", "متوسط", "متقدم"]),
  hours: z.coerce.number().int().min(1).max(500),
  categoryId: id,
  instructorId: id,
  published: z.boolean(),
});

export const sectionSchema = z.object({
  title: z.string().trim().min(2, "عنوان القسم قصير").max(120),
});

export const lessonSchema = z
  .object({
    title: z.string().trim().min(2, "عنوان الدرس قصير").max(140),
    type: z.enum(["VIDEO", "TEXT"]),
    videoUrl: z.string().trim().max(500).default(""),
    content: z.string().max(20000).default(""),
    minutes: z.coerce.number().int().min(1).max(600),
  })
  .superRefine((v, ctx) => {
    if (v.type === "VIDEO" && !parseVideoUrl(v.videoUrl)) {
      ctx.addIssue({
        code: "custom",
        path: ["videoUrl"],
        message: "رابط الفيديو يجب أن يكون https من يوتيوب أو فيميو أو ملف mp4/webm",
      });
    }
    if (v.type === "TEXT" && v.content.trim().length < 5) {
      ctx.addIssue({ code: "custom", path: ["content"], message: "اكتب محتوى الدرس" });
    }
  });

export const quizSchema = z.object({
  title: z.string().trim().min(2, "عنوان الاختبار قصير").max(120),
  passPercent: z.coerce.number().int().min(1).max(100),
});

export const questionSchema = z
  .object({
    text: z.string().trim().min(3, "نص السؤال قصير").max(400),
    options: z.array(z.string().trim().min(1).max(200)).min(2, "خياران على الأقل").max(6),
    correctIndex: z.coerce.number().int().min(0),
  })
  .refine((q) => q.correctIndex < q.options.length, {
    path: ["correctIndex"],
    message: "الإجابة الصحيحة خارج الخيارات",
  });

export const decisionSchema = z.object({
  id,
  decision: z.enum(["ACTIVE", "REJECTED"]),
});

export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "بيانات غير صالحة";
}
