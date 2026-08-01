import Image from "next/image";

import StaticSignInForm from "@/components/StaticSignInForm";

import {Link} from "@/i18n/navigation";
import {setRequestLocale} from "next-intl/server";

export default async function SignInPage({params}: {params: Promise<{locale: string}>}) {

  const {locale} = await params;

  setRequestLocale(locale);

  const isArabic = locale === "ar";

  const copy = isArabic

    ? {

        eyebrow: "بوابة الشركاء",

        title: "تسجيل الدخول إلى ميدار",

        subtitle: "أدخل بيانات حسابك للوصول إلى لوحة التحكم وإدارة عملياتك.",

        email: "البريد الإلكتروني أو اسم المستخدم",

        emailPlaceholder: "name@company.com",

        password: "كلمة المرور",

        passwordPlaceholder: "أدخل كلمة المرور",

        remember: "تذكرني",

        forgot: "نسيت كلمة المرور؟",

        submit: "تسجيل الدخول",

        submitting: "جارٍ تسجيل الدخول...",

        back: "العودة إلى الصفحة الرئيسية"

      }

    : {

        eyebrow: "Partner portal",

        title: "Sign in to Middar",

        subtitle: "Enter your account details to access the dashboard and manage your operations.",

        email: "Email address or username",

        emailPlaceholder: "name@company.com",

        password: "Password",

        passwordPlaceholder: "Enter your password",

        remember: "Remember me",

        forgot: "Forgot password?",

        submit: "Sign in",

        submitting: "Signing in...",

        back: "Back to home"

      };

  return (

    <main className="signin-page">

      <section className="signin-card" aria-labelledby="signin-title">

        <Link className="signin-brand" href="/" aria-label={copy.back}>

          <Image

            alt="Middar"

            className="signin-logo"

            height={73}

            priority

            src="/middar-logo-eng.png"

            width={256}

          />

        </Link>

        <header className="signin-heading">

          <span>{copy.eyebrow}</span>

          <h1 id="signin-title">{copy.title}</h1>

          <p>{copy.subtitle}</p>

        </header>

        <StaticSignInForm copy={copy} locale={locale} />

        <Link className="signin-back" href="/">{copy.back}</Link>

      </section>

    </main>

  );

}

