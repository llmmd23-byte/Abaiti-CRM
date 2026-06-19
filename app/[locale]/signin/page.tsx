import Image from "next/image";
import {redirect} from "next/navigation";
import {Link} from "@/i18n/navigation";

export default async function SignInPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const isArabic = locale === "ar";
  async function signIn() {
    "use server";
    redirect(`/${locale}/dashboard`);
  }
  const copy = isArabic
    ? {
        eyebrow: "بوابة الشركاء",
        title: "تسجيل الدخول إلى ميدار",
        subtitle: "أدخل بيانات حسابك للوصول إلى لوحة التحكم وإدارة عملياتك.",
        email: "البريد الإلكتروني",
        emailPlaceholder: "name@company.com",
        password: "كلمة المرور",
        passwordPlaceholder: "أدخل كلمة المرور",
        remember: "تذكرني",
        forgot: "نسيت كلمة المرور؟",
        submit: "تسجيل الدخول",
        back: "العودة إلى الصفحة الرئيسية"
      }
    : {
        eyebrow: "Partner portal",
        title: "Sign in to Middar",
        subtitle: "Enter your account details to access the dashboard and manage your operations.",
        email: "Email address",
        emailPlaceholder: "name@company.com",
        password: "Password",
        passwordPlaceholder: "Enter your password",
        remember: "Remember me",
        forgot: "Forgot password?",
        submit: "Sign in",
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
            src="/middar-logo-transparent-v2.png"
            width={256}
          />
        </Link>

        <header className="signin-heading">
          <span>{copy.eyebrow}</span>
          <h1 id="signin-title">{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </header>

        <form action={signIn} className="signin-form">
          <label>
            <span>{copy.email}</span>
            <input
              autoComplete="email"
              dir="ltr"
              name="email"
              placeholder={copy.emailPlaceholder}
              required
              type="email"
            />
          </label>
          <label>
            <span>{copy.password}</span>
            <input
              autoComplete="current-password"
              name="password"
              placeholder={copy.passwordPlaceholder}
              required
              type="password"
            />
          </label>

          <div className="signin-options">
            <label className="signin-remember">
              <input name="remember" type="checkbox" />
              <span>{copy.remember}</span>
            </label>
            <button className="signin-forgot" type="button">{copy.forgot}</button>
          </div>

          <button className="signin-submit" type="submit">{copy.submit}</button>
        </form>

        <Link className="signin-back" href="/">{copy.back}</Link>
      </section>
    </main>
  );
}
