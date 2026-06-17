"use client";

import {useLocale} from "next-intl";
import {usePathname, useRouter} from "@/i18n/navigation";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const nextLocale = locale === "ar" ? "en" : "ar";

  function switchLanguage() {
    router.replace(pathname, {locale: nextLocale});
  }

  return (
    <button
      className="language-toggle"
      type="button"
      onClick={switchLanguage}
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      <span className={locale === "en" ? "active" : ""}>EN</span>
      <span className={locale === "ar" ? "active" : ""}>AR</span>
    </button>
  );
}
