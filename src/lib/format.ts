export function formatPrice(price: number): string {
  if (price <= 0) return "مجاني";
  return `${price.toLocaleString("en-US")} ر.س`;
}

const dateFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { dateStyle: "long" });

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return dateFmt.format(typeof d === "string" ? new Date(d) : d);
}

export function formatHours(minutes: number): string {
  if (minutes < 60) return `${minutes} دقيقة`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} س ${m} د` : `${h} ساعة`;
}

export const ENROLLMENT_LABEL: Record<string, string> = {
  PENDING: "بانتظار التحقق من الدفع",
  ACTIVE: "مفعّل",
  REJECTED: "مرفوض",
};

export function parseOptions(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
