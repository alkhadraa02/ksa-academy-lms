import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadEnrolledCourse } from "@/lib/portal";
import { parseVideoUrl } from "@/lib/grading";
import { LessonComplete } from "@/components/LessonComplete";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "الدرس", robots: { index: false } };

type Params = Promise<{ slug: string; lessonId: string }>;

export default async function LessonPage({ params }: { params: Params }) {
  const { slug, lessonId } = await params;
  const { course, doneIds } = await loadEnrolledCourse(slug);

  const flat = course.sections.flatMap((s) => s.lessons.map((l) => ({ ...l, sectionTitle: s.title })));
  const index = flat.findIndex((l) => l.id === lessonId);
  if (index < 0) notFound();
  const lesson = flat[index];
  const next = flat[index + 1];
  const video = lesson.type === "VIDEO" ? parseVideoUrl(lesson.videoUrl) : null;

  const nextHref = next
    ? `/portal/courses/${course.slug}/lessons/${next.id}`
    : course.quizzes[0]
      ? `/portal/courses/${course.slug}/quizzes/${course.quizzes[0].id}`
      : `/portal/courses/${course.slug}`;
  const nextLabel = next ? "الدرس التالي" : course.quizzes[0] ? "انتقل إلى الاختبار" : "العودة إلى المحتوى";

  return (
    <div className="container-page py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
        <article className="min-w-0">
          <nav aria-label="مسار التنقّل" className="mb-3 text-sm">
            <Link href={`/portal/courses/${course.slug}`} className="text-brand-strong underline">
              {course.title}
            </Link>
            <span className="text-muted"> / {lesson.sectionTitle}</span>
          </nav>
          <h1 className="text-2xl font-bold">{lesson.title}</h1>

          {lesson.type === "VIDEO" &&
            (video?.kind === "embed" ? (
              <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl bg-ink">
                <iframe
                  src={video.src}
                  title={lesson.title}
                  className="size-full"
                  allow="encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  loading="lazy"
                />
              </div>
            ) : video?.kind === "file" ? (
              <video src={video.src} controls preload="metadata" className="mt-4 aspect-video w-full rounded-xl bg-ink">
                <track kind="captions" />
              </video>
            ) : (
              <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-danger">
                رابط الفيديو غير صالح، أبلغ الإدارة.
              </p>
            ))}

          {lesson.content.trim() && <div className="prose-lesson card mt-4">{lesson.content}</div>}

          <LessonComplete lessonId={lesson.id} done={doneIds.has(lesson.id)} nextHref={nextHref} nextLabel={nextLabel} />
        </article>

        <aside aria-label="دروس الدورة" className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-0">
            <h2 className="border-b border-line px-4 py-3 font-bold">دروس الدورة</h2>
            <ul className="max-h-96 divide-y divide-line overflow-y-auto">
              {flat.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/portal/courses/${course.slug}/lessons/${l.id}`}
                    aria-current={l.id === lesson.id ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-2 px-4 py-2 text-sm hover:bg-brand-soft ${l.id === lesson.id ? "bg-brand-soft font-bold" : ""}`}
                  >
                    <span aria-hidden="true">{doneIds.has(l.id) ? "✅" : "⚪"}</span>
                    <span className="min-w-0 truncate">{l.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
