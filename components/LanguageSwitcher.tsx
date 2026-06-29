"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname() || "/";
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <Link
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      className="language-toggle"
      href={pathname}
      locale={nextLocale}
    >
      <span className={locale === "en" ? "active" : ""}>EN</span>
      <span className={locale === "ar" ? "active" : ""}>AR</span>
    </Link>
  );
}
