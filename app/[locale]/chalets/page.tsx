import {setRequestLocale} from "next-intl/server";
import Image from "next/image";
import {Link} from "@/i18n/navigation";
import ChaletsLeadForm from "@/components/ChaletsLeadForm";

const features = [
  ["تقويم ذكي للحجوزات", "شاهد الحجوزات والمواعيد وحالات الدفع في تقويم يومي وشهري واضح."],
  ["موقع إلكتروني خاص بالشاليه", "اعرض الوحدات والمزايا والطلبات من صفحة جاهزة مرتبطة بالنظام."],
  ["رسائل وتذكيرات تلقائية", "اربط العميل بتأكيد الموعد والتذكير قبل الوصول برسائل منظمة."],
  ["إدارة حجوزات الشاليهات", "تابع حالة كل حجز وتفاصيل العميل ومواعيد الدخول والخروج من مكان واحد."],
  ["تقارير وتحليلات متقدمة", "اعرف أيام الذروة ومصادر الطلبات ونسبة الإشغال لتخطط بشكل أدق."],
  ["خيارات دفع إلكترونية متكاملة", "دعم مدى وفيزا وماستركارد و Apple Pay حسب إعداداتك."],
  ["فواتير إلكترونية واضحة", "أصدر فواتير منظمة مع دعم إعداد متطلبات منشأتك."],
  ["دعم وتدريب أثناء الإعداد", "نجهز النظام مع فريقك حتى تبدأ التشغيل بثقة."],
];

export default async function ChaletsLandingPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const isArabic = locale === "ar";
  setRequestLocale(locale);

  return (
    <main className="chalets-old-page" dir={isArabic ? "rtl" : "ltr"}>
      <section className="chalets-old-hero">
        <div className="chalets-old-overlay" />

        <nav className="chalets-old-nav" aria-label="التنقل">
          <Link className="chalets-old-brand" href="/">
            <Image alt="Middar" height={211} priority src="/middar-logo-transparent-v2.png" unoptimized width={747} />
          </Link>
          <div className="chalets-old-links">
            <Link href="/">الرئيسية</Link>
            <Link href="/pricing">الأسعار</Link>
            <Link href="/#industries">القطاعات</Link>
            <Link href="/blog">المدونة</Link>
            <Link href="/contact">تواصل</Link>
          </div>
          <div className="chalets-old-actions">
            <Link href="/chalets" locale="en">English</Link>
            <Link className="chalets-old-login" href="/signin">تسجيل الدخول</Link>
            <a className="chalets-old-start" href="#chalets-lead-form">ابدأ الآن</a>
          </div>
        </nav>

        <div className="chalets-old-container chalets-old-hero-grid">
          <div className="chalets-old-copy">
            <span className="chalets-old-pill">نظام سعودي لإدارة الشاليهات والمنتجعات</span>
            <h1>شاليهك يستحق نظاماً يواكب طموحك</h1>
            <p>
              مع ميدار أدر حجوزاتك، استقبل المدفوعات إلكترونياً، أرسل التذكيرات تلقائياً، واعرف حالة الدخل والحجوزات من لوحة واحدة.
            </p>
            <strong>إدارة أسهل. وقت أقل. حجوزات أكثر.</strong>
            <div className="chalets-old-buttons">
              <a className="chalets-old-primary" href="#chalets-lead-form">ابدأ الآن</a>
              <a className="chalets-old-secondary" href="#features">شاهد المميزات</a>
            </div>
            <small>عرض مناسب حسب عدد الشاليهات وطريقة التشغيل</small>
          </div>

          <div className="chalets-old-calendar">
            <div className="chalets-old-window">
              <b />
              <b />
              <b />
            </div>
            <div className="chalets-old-calendar-head">
              <h2>تقويم الحجوزات</h2>
            </div>
            <div className="chalets-old-stats">
              <article>
                <span>دخل الشهر</span>
                <strong>إيرادات الحجز</strong>
                <small>حسب الباقة</small>
              </article>
              <article>
                <span>نسبة الإشغال</span>
                <strong>عرض الإشغال</strong>
                <small>حسب التقويم</small>
              </article>
            </div>
            <section>
              <div className="chalets-old-month">
                <strong>حجوزات مؤكدة</strong>
                <span>يونيو</span>
              </div>
              <div className="chalets-old-days">
                {["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"].map((day) => (
                  <small key={day}>{day}</small>
                ))}
                {Array.from({length: 21}).map((_, index) => (
                  <span className={index === 1 || index === 9 || index === 18 ? "pending" : index === 4 || index === 12 || index === 15 ? "active" : ""} key={index}>
                    {index + 1}
                  </span>
                ))}
              </div>
            </section>
            <div className="chalets-old-new-booking">
              <strong>حجز جديد</strong>
              <span>تم الدفع عبر مدى</span>
              <small>رسالة واتساب أرسلت تلقائياً</small>
            </div>
          </div>
        </div>
      </section>

      <section className="chalets-old-problem">
        <div className="chalets-old-container chalets-old-two">
          <article className="chalets-old-card">
            <h2>ميدار يجمع كل شيء في مكان واحد</h2>
            {["حالة كل حجز واضحة للفريق", "الدفعات والعربون مرتبطة بالحجز", "بيانات العميل محفوظة للزيارات القادمة", "تذكيرات وملاحظات تشغيلية قبل الموعد"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </article>
          <div>
            <span className="chalets-old-kicker">المشكلة واضحة</span>
            <h2>هل ما زلت تدير شاليهك بالطريقة التقليدية؟</h2>
            <p>
              بين الرسائل المتفرقة، جداول الحجوزات اليدوية، متابعة المدفوعات، وتذكير العملاء، تصبح التفاصيل عبئاً يومياً في التشغيل.
            </p>
          </div>
        </div>
      </section>

      <section className="chalets-old-strip">
        {[
          ["باقات", "حسب نموذج التشغيل"],
          ["دعم", "متابعة أثناء الإعداد"],
          ["ZATCA", "فواتير إلكترونية متوافقة"],
          ["Apple Pay", "مدى وفيزا وماستركارد"],
        ].map(([title, text]) => (
          <article key={title}>
            <strong>{title}</strong>
            <span>{text}</span>
          </article>
        ))}
      </section>

      <section className="chalets-old-features" id="features">
        <div className="chalets-old-container">
          <div className="chalets-old-head">
            <span className="chalets-old-kicker">المميزات</span>
            <h2>كل ما تحتاجه لإدارة شاليهك بكفاءة أعلى</h2>
            <p>مميزات عملية مصممة حول الحجز، الدفع، المتابعة، وتجربة العميل.</p>
          </div>
          <div className="chalets-old-feature-grid">
            {features.map(([title, text], index) => (
              <article key={title}>
                <i>{String(index + 1).padStart(2, "0")}</i>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="chalets-old-saudi">
        <div className="chalets-old-container chalets-old-two">
          <div className="chalets-old-dark-list">
            {[
              ["جاهز للفوترة الإلكترونية", "تنظيم بيانات الفواتير وربطها بالحجوزات."],
              ["دفع موثوق ومباشر", "خيارات دفع رقمية تناسب العميل السعودي."],
              ["باقات حسب التشغيل", "نموذج مرن يناسب عدد الوحدات وفريقك."],
            ].map(([title, text]) => (
              <article key={title}>
                <strong>{title}</strong>
                <span>{text}</span>
              </article>
            ))}
          </div>
          <div>
            <span className="chalets-old-kicker">جاهز للسوق المحلي</span>
            <h2>نظام مصمم لاحتياجات السوق السعودي</h2>
            <p>من الحجز إلى الدفع والفوترة، يساعدك ميدار على تقديم تجربة أكثر تنظيماً للعميل وفريق التشغيل.</p>
          </div>
        </div>
      </section>

      <section className="chalets-old-form-section" id="chalets-lead-form">
        <div className="chalets-old-container chalets-old-form-grid">
          <div>
            <span className="chalets-old-kicker">تعبئة البيانات</span>
            <h2>ابدأ بإدارة شاليهك بطريقة أذكى من اليوم</h2>
            <p>أرسل بيانات المنشأة، وسنجهز لك تصوراً مناسباً حسب نوع النشاط وعدد الوحدات وطريقة التشغيل الحالية.</p>
          </div>
          <div className="chalets-old-form-card">
            <ChaletsLeadForm />
          </div>
        </div>
      </section>

      <footer className="chalets-old-footer">
        <div className="chalets-old-container">
          <Image alt="Middar" height={211} src="/middar-logo-transparent-v2.png" unoptimized width={747} />
          <nav>
            <Link href="/">الرئيسية</Link>
            <Link href="/pricing">الأسعار</Link>
            <Link href="/contact">تواصل</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
