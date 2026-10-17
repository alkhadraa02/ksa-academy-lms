import { randomBytes } from "node:crypto";

export type GradableQuestion = { id: string; correctIndex: number };

export type QuestionResult = {
  questionId: string;
  chosen: number | null;
  correctIndex: number;
  isCorrect: boolean;
};

export type GradeResult = {
  correct: number;
  total: number;
  percent: number;
  passed: boolean;
  results: QuestionResult[];
};

/** Auto-grades a quiz. Unanswered questions count as wrong. An empty quiz never passes. */
export function gradeQuiz(
  questions: GradableQuestion[],
  answers: Record<string, number>,
  passPercent: number,
): GradeResult {
  const results: QuestionResult[] = questions.map((q) => {
    const chosen = Object.prototype.hasOwnProperty.call(answers, q.id) ? answers[q.id] : null;
    return {
      questionId: q.id,
      chosen,
      correctIndex: q.correctIndex,
      isCorrect: chosen === q.correctIndex,
    };
  });
  const correct = results.filter((r) => r.isCorrect).length;
  const total = questions.length;
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);
  return { correct, total, percent, passed: total > 0 && percent >= passPercent, results };
}

export function progressPercent(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

export type VideoSource = { kind: "embed" | "file"; src: string };

/** Turns a pasted lesson URL into something safe to embed. Only https; YouTube, Vimeo or a direct media file. */
export function parseVideoUrl(raw: string): VideoSource | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return /^[\w-]{11}$/.test(id) ? { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    let id = url.searchParams.get("v") ?? "";
    const m = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/);
    if (m) id = m[1];
    return /^[\w-]{11}$/.test(id) ? { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = url.pathname.match(/(?:\/video)?\/(\d{6,12})(?:\/|$)/);
    return m ? { kind: "embed", src: `https://player.vimeo.com/video/${m[1]}` } : null;
  }
  if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) return { kind: "file", src: url.toString() };
  return null;
}

/** ASCII slug. Arabic-only titles fall back to a random suffix so URLs stay clean. */
export function slugify(input: string, fallbackPrefix = "course"): string {
  const s = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return s || `${fallbackPrefix}-${randomBytes(3).toString("hex")}`;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCertificateCode(): string {
  const bytes = randomBytes(10);
  let out = "";
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `ACD-${out.slice(0, 5)}-${out.slice(5)}`;
}

export function isCertificateCode(code: string): boolean {
  return /^ACD-[A-Z2-9]{5}-[A-Z2-9]{5}$/.test(code);
}
