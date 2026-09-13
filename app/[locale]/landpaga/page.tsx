import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {hasLocale} from "next-intl";
import {setRequestLocale} from "next-intl/server";

import {routing} from "@/i18n/routing";
import LandpagaLanding from "./LandpagaLanding";

export const metadata: Metadata = {
  title: "المعرض الدولي لصناع القهوة و الشوكولاتة 2026",
  description: "صفحة الهبوط الرسمية للمعرض الدولي لصناع القهوة و الشوكولاتة 2026.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LandpagaPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return <LandpagaLanding />;
}
