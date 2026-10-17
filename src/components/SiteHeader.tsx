import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";
import { MobileMenu, type NavItem } from "./MobileMenu";

export const BRAND = "أكاديمية رواد";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const items: NavItem[] = [
    { href: "/", label: "الرئيسية" },
    { href: "/courses", label: "الدورات" },
  ];
  if (user) {
    items.push({ href: "/portal", label: "دوراتي" });
    if (user.role === "ADMIN") items.push({ href: "/admin", label: "لوحة التحكم" });
  } else {
    items.push({ href: "/login", label: "تسجيل الدخول" }, { href: "/register", label: "حساب جديد" });
  }

  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-surface">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href="/" className="min-w-0 truncate text-xl font-bold text-brand-strong">
          {BRAND}
        </Link>
        <nav aria-label="القائمة الرئيسية" className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-11 items-center rounded-lg px-3 font-semibold text-ink hover:bg-brand-soft"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user && (
            <>
              <span className="hidden max-w-40 truncate text-sm text-muted lg:inline">{user.name}</span>
              <LogoutButton />
            </>
          )}
          <MobileMenu items={items} />
        </div>
      </div>
    </header>
  );
}
