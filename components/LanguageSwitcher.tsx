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
      className="inline-grid min-h-10 cursor-pointer grid-cols-2 gap-1 rounded-lg border border-[#dde6ee] bg-white/70 p-1 font-medium text-[#647280] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]"
      type="button"
      onClick={switchLanguage}
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      <span className={`grid min-w-[42px] place-items-center rounded-md ${locale === "en" ? "bg-[#e0f8f8] text-[#0b1f3a] shadow-[0_12px_28px_rgba(32,184,181,0.2)]" : ""}`}>EN</span>
      <span className={`grid min-w-[42px] place-items-center rounded-md ${locale === "ar" ? "bg-[#e0f8f8] text-[#0b1f3a] shadow-[0_12px_28px_rgba(32,184,181,0.2)]" : ""}`}>AR</span>
    </button>
  );
}
