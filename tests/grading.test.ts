import { describe, expect, it } from "vitest";
import {
  generateCertificateCode,
  gradeQuiz,
  isCertificateCode,
  parseVideoUrl,
  progressPercent,
  slugify,
} from "@/lib/grading";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";

const questions = [
  { id: "a", correctIndex: 1 },
  { id: "b", correctIndex: 0 },
  { id: "c", correctIndex: 2 },
  { id: "d", correctIndex: 3 },
];

describe("gradeQuiz", () => {
  it("scores correct answers and applies the pass mark", () => {
    const r = gradeQuiz(questions, { a: 1, b: 0, c: 2, d: 0 }, 70);
    expect(r.correct).toBe(3);
    expect(r.percent).toBe(75);
    expect(r.passed).toBe(true);
  });

  it("counts unanswered questions as wrong and fails below the mark", () => {
    const r = gradeQuiz(questions, { a: 1 }, 60);
    expect(r.correct).toBe(1);
    expect(r.percent).toBe(25);
    expect(r.passed).toBe(false);
    expect(r.results.find((x) => x.questionId === "b")?.chosen).toBeNull();
  });

  it("passes exactly at the threshold", () => {
    expect(gradeQuiz(questions, { a: 1, b: 0 }, 50).passed).toBe(true);
  });

  it("never passes an empty quiz", () => {
    const r = gradeQuiz([], {}, 0);
    expect(r.percent).toBe(0);
    expect(r.passed).toBe(false);
  });

  it("ignores prototype keys in answers", () => {
    const r = gradeQuiz([{ id: "constructor", correctIndex: 0 }], {}, 50);
    expect(r.correct).toBe(0);
  });
});

describe("progressPercent", () => {
  it("handles zero totals and caps at 100", () => {
    expect(progressPercent(0, 0)).toBe(0);
    expect(progressPercent(1, 3)).toBe(33);
    expect(progressPercent(9, 3)).toBe(100);
  });
});

describe("parseVideoUrl", () => {
  it("normalises YouTube links to the nocookie embed", () => {
    const expected = { kind: "embed", src: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" };
    expect(parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual(expected);
    expect(parseVideoUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual(expected);
    expect(parseVideoUrl("https://youtube.com/shorts/dQw4w9WgXcQ")).toEqual(expected);
  });

  it("supports Vimeo and direct files", () => {
    expect(parseVideoUrl("https://vimeo.com/123456789")).toEqual({
      kind: "embed",
      src: "https://player.vimeo.com/video/123456789",
    });
    expect(parseVideoUrl("https://cdn.example.com/a/b.mp4")?.kind).toBe("file");
  });

  it("rejects insecure, unknown and script URLs", () => {
    expect(parseVideoUrl("http://youtu.be/dQw4w9WgXcQ")).toBeNull();
    expect(parseVideoUrl("javascript:alert(1)")).toBeNull();
    expect(parseVideoUrl("https://evil.example.com/page")).toBeNull();
    expect(parseVideoUrl("not a url")).toBeNull();
  });
});

describe("slugify and certificate codes", () => {
  it("builds ASCII slugs and falls back for Arabic-only titles", () => {
    expect(slugify("Intro to Excel 2026!")).toBe("intro-to-excel-2026");
    expect(slugify("مقدمة في الإكسل")).toMatch(/^course-[0-9a-f]{6}$/);
  });

  it("generates unique, valid certificate codes", () => {
    const a = generateCertificateCode();
    const b = generateCertificateCode();
    expect(isCertificateCode(a)).toBe(true);
    expect(a).not.toBe(b);
    expect(isCertificateCode("ACD-XXXXX")).toBe(false);
  });
});

describe("rateLimit", () => {
  it("blocks after the maximum within the window and recovers after it", () => {
    resetRateLimit();
    expect(rateLimit("k", 2, 1000, 0)).toBe(true);
    expect(rateLimit("k", 2, 1000, 10)).toBe(true);
    expect(rateLimit("k", 2, 1000, 20)).toBe(false);
    expect(rateLimit("k", 2, 1000, 1500)).toBe(true);
  });
});
