import type { Metadata } from "next";

import { NextIntlClientProvider } from "next-intl";

import { hasLocale } from "next-intl";

import { setRequestLocale } from "next-intl/server";

import { notFound } from "next/navigation";

import { routing } from "@/i18n/routing";

import "../globals.css";

export const metadata: Metadata = {
  title: "Affiliate CRM Platform",

  description: "A bilingual affiliate marketing platform integrated with CRM.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,

  params,
}: {
  children: React.ReactNode;

  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <head>
        <meta charSet="UTF-8" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />

        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>

      <body suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
