import Link from "next/link";
import { formatPrice } from "@/lib/format";

export type CourseCardData = {
  slug: string;
  title: string;
  summary: string;
  price: number;
  level: string;
  hours: number;
  category: { name: string };
  instructor: { name: string };
};

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <article className="card flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge">{course.category.name}</span>
        <span className="text-sm text-muted">{course.level}</span>
      </div>
      <h3 className="text-lg font-bold leading-snug">
        <Link href={`/courses/${course.slug}`} className="hover:text-brand-strong hover:underline">
          {course.title}
        </Link>
      </h3>
      <p className="line-clamp-3 text-sm text-muted">{course.summary}</p>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3 text-sm">
        <span className="min-w-0 truncate text-muted">
          {course.instructor.name} · {course.hours} ساعة
        </span>
        <strong className={course.price === 0 ? "text-ok" : "text-ink"}>{formatPrice(course.price)}</strong>
      </div>
    </article>
  );
}
