"use client";

import Image from "next/image";
import {useState, type FormEvent} from "react";

function resolveCrmEndpoint() {
  return "/api/v1/public/landing-leads";
}

function StatCard({value, label}: {value: string; label: string}) {
  return (
    <article>
      <b>{value}</b>
      <span>{label}</span>
    </article>
  );
}

function ZoneCard({
  number,
  title,
  copy,
}: {
  number: string;
  title: string;
  copy: string;
}) {
  return (
    <article>
      <b>{number}</b>
      <h3>{title}</h3>
      <p>{copy}</p>
    </article>
  );
}

function PackageCard({
  title,
  price,
  size,
  featured = false,
}: {
  title: string;
  price: string;
  size: string;
  featured?: boolean;
}) {
  return (
    <article className={featured ? "featured" : undefined}>
      <small>{title}</small>
      <b>
        {price} <i>ر.س</i>
      </b>
      <span>{size}</span>
      <a href="#lead-form">{featured ? "اطلب التفاصيل" : "احجز الآن"}</a>
    </article>
  );
}

export default function LandpagaLanding() {
  const [status, setStatus] = useState<{
    message: string;
    type: "idle" | "loading" | "success" | "error";
  }>({
    message: "بياناتك خاصة ولن تُستخدم إلا للتواصل بشأن المعرض.",
    type: "idle",
  });

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus({message: "جاري إرسال الطلب...", type: "loading"});

    try {
      const crmEndpoint = resolveCrmEndpoint();
      const response = await fetch(crmEndpoint, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          affiliateUsername: "user",
          affiliateEmail: "admin@middar.com",
          companyName: String(formData.get("company") ?? "").trim(),
          fullName: String(formData.get("name") ?? "").trim(),
          phone: String(formData.get("whatsapp") ?? "").trim(),
          sector: String(formData.get("sector") ?? "").trim(),
          source: "landpaga",
        }),
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("request failed");
      }

      form.reset();
      setStatus({
        message: "تم استلام طلبك. سيتواصل معك مستشار المشاركة قريبًا.",
        type: "success",
      });
    } catch {
      setStatus({
        message: "تعذر إرسال الطلب الآن. حاول مرة أخرى.",
        type: "error",
      });
    }
  }

  return (
    <main className="event-landpaga" id="top">
      <header className="event-landpaga-header">
        <a className="event-landpaga-brand" href="#top" aria-label="المعرض الدولي لصناع القهوة و الشوكولاتة">
          <Image src="/landpaga/logo-mark.png" alt="شعار المعرض" width={70} height={98} priority />
          <span>
            <b>المعرض الدولي</b>
            <small>لصناع القهوة و الشوكولاتة</small>
          </span>
        </a>
        <div className="event-landpaga-badges">
          <span>تحت إشراف غرفة جدة</span>
          <span>
            ترخيص نطاقي <b>26/3275</b>
          </span>
        </div>
        <a className="event-landpaga-contact" href="https://wa.me/966566707352">
          اتصل بنا
        </a>
      </header>

      <section className="event-landpaga-hero">
        <div className="event-landpaga-hero-copy">
          <Image
            className="event-landpaga-official"
            src="/landpaga/official-header.png"
            alt="المعرض الدولي لصناع القهوة و الشوكولاتة وغرفة جدة"
            width={960}
            height={264}
            priority
          />
          <p className="event-landpaga-eyebrow">المعرض الدولي لصناع القهوة و الشوكولاتة</p>
          <h1>
            وسّع نطاق أعمالك
            <em>وشارك في المعرض الأضخم</em>
          </h1>
          <p className="event-landpaga-lead">
            استعرض منتجاتك، وأبرم الصفقات، وابنِ شراكات جديدة مع آلاف الزوار وصنّاع القرار في قلب سوق يتجاوز 2 مليار دولار.
          </p>
          <div className="event-landpaga-meta">
            <span>
              <small>التاريخ</small>
              <b>08 - 10 أكتوبر 2026</b>
            </span>
            <i />
            <span>
              <small>المكان</small>
              <b>قاعة فندق الهيلتون الكبرى - جدة</b>
            </span>
          </div>
          <div className="event-landpaga-phone">
            <span>رد سريع عبر الواتساب:</span>
            <a href="https://wa.me/966566707352">+966 56 670 7352</a>
            <a href="https://wa.me/966545477164">+966 54 547 7164</a>
          </div>
        </div>
        <div className="event-landpaga-media" aria-label="صورة قهوة وشوكولاتة">
          <Image src="/landpaga/coffee-photo-v3.png" alt="فنجان قهوة مع حبوب البن والشوكولاتة" width={760} height={900} priority />
          <span>
            COFFEE <i>×</i> CHOCOLATE
          </span>
        </div>
      </section>

      <section className="event-landpaga-proof">
        <p className="event-landpaga-label">سوق سريع النمو</p>
        <div className="event-landpaga-proof-grid">
          <StatCard value="20,000+" label="زائر متوقع" />
          <StatCard value="10,000+" label="مقهى نشط في جدة" />
          <StatCard value="2 مليار+" label="دولار حجم السوق" />
          <StatCard value="70+" label="براند مشارك" />
        </div>
      </section>

      <section className="event-landpaga-strengths">
        <p className="event-landpaga-label">لماذا تشارك كعارض؟</p>
        <div className="event-landpaga-strength-grid">
          <StatCard value="01" label="تواصل مع أكثر من 20,000 زائر ومتخصص" />
          <StatCard value="02" label="اعرض منتجاتك ومعداتك أمام جمهور متخصص" />
          <StatCard value="03" label="جلسات حوارية وورش عمل وعروض مباشرة" />
          <StatCard value="04" label="ابنِ شراكات مع كبار الموردين والمشترين" />
        </div>
      </section>

      <section className="event-landpaga-zones">
        <p className="event-landpaga-label">ست مناطق لصناعة واحدة</p>
        <div className="event-landpaga-zone-grid">
          <ZoneCard number="01" title="منطقة التحميص" copy="محامص، صناع شوكولاتة، ومقاهٍ ومنتجات حرفية." />
          <ZoneCard number="02" title="سوق مزارعي البن" copy="تجار البن الأخضر، مصدرو الكاكاو، والتعاونيات الزراعية." />
          <ZoneCard number="03" title="ساحة الابتكار" copy="معدات التحميص، الأتمتة، التقنية، وحلول نقاط البيع." />
          <ZoneCard number="04" title="جلاس هاوس" copy="تقييم حسي واحترافي محدود لخبراء الجودة." />
          <ZoneCard number="05" title="الأكاديمية" copy="ورش عمل وجلسات فنية وعروض حية مع الخبراء." />
          <ZoneCard number="06" title="سوق التجار" copy="تجربة بيع مباشر للعلامات والمقاهي والمحامص." />
        </div>
      </section>

      <section className="event-landpaga-packages">
        <p className="event-landpaga-label">فئات المشاركة</p>
        <h2>
          اختر المساحة التي
          <em>تناسب علامتك.</em>
        </h2>
        <div className="event-landpaga-package-grid">
          <PackageCard title="جناح المنتجين" price="5,000" size="2×2 م²" />
          <PackageCard title="جناح كلاسيك" price="11,500" size="3×3 م²" />
          <PackageCard title="جناح سيجنتشر" price="15,250" size="3×4 م²" />
          <PackageCard title="جناح رئيسي" price="21,500" size="3×6 م²" featured />
        </div>
        <p className="event-landpaga-vat">جميع الأسعار شاملة ضريبة القيمة المضافة.</p>
      </section>

      <section className="event-landpaga-program">
        <div>
          <p className="event-landpaga-label">برنامج المعرض</p>
          <h2>
            ثلاثة أيام من
            <em>المعرفة والمنافسة.</em>
          </h2>
        </div>
        <div className="event-landpaga-program-list">
          <article>
            <b>08 أكتوبر</b>
          </article>
          <article>
            <b>09 أكتوبر</b>
          </article>
          <article>
            <b>10 أكتوبر</b>
          </article>
        </div>
      </section>

      <section className="event-landpaga-capture">
        <div className="event-landpaga-capture-copy">
          <p className="event-landpaga-label">المقاعد محدودة</p>
          <h2>
            احجز حضور
            <em>علامتك الآن.</em>
          </h2>
          <p>اطلب ملف المشاركة والمخطط، وسيتواصل معك مستشار المشاركة خلال دقائق.</p>
          <a href="https://wa.me/966545477164">أو تواصل عبر واتساب</a>
        </div>

        <form className="event-landpaga-form" id="lead-form" onSubmit={submitLead}>
          <div className="event-landpaga-form-heading">
            <span>01</span>
            <h2>اطلب ملف المشاركة والمخطط</h2>
            <p>املأ البيانات خلال 20 ثانية وسيتواصل معك مستشار المشاركة.</p>
          </div>
          <label>
            اسم الشركة / العلامة التجارية
            <input required name="company" type="text" placeholder="اسم الشركة / العلامة التجارية" />
          </label>
          <label>
            اسم المسؤول
            <input required name="name" type="text" placeholder="الاسم الكامل" />
          </label>
          <label>
            رقم الواتساب
            <input required name="whatsapp" type="tel" placeholder="+966 5X XXX XXXX" dir="ltr" />
          </label>
          <label>
            مجال النشاط
            <select required name="sector" defaultValue="">
              <option value="" disabled>
                اختر مجال النشاط
              </option>
              <option>ملاك المقاهي والكافيهات</option>
              <option>صناع القهوة و الشوكولاتة والمحامص</option>
              <option>مورّدو المعدات وآلات الضيافة</option>
              <option>أصحاب العلامات التجارية والأسر المنتجة</option>
              <option>المستثمرون في قطاع الأغذية والمشروبات</option>
            </select>
          </label>
          <button className="event-landpaga-button" disabled={status.type === "loading"} type="submit">
            {status.type === "loading" ? "جاري الإرسال..." : "أرسل طلب المشاركة"}
          </button>
          <p
            className={`event-landpaga-status ${status.type === "success" ? "success" : ""} ${status.type === "error" ? "error" : ""}`}
            role="status"
          >
            {status.message}
          </p>
        </form>
      </section>

      <section className="event-landpaga-partners">
        <p className="event-landpaga-label">شركاؤنا في النجاح</p>
        <div className="event-landpaga-partner-groups">
          <div>
            <small>الشريك الاستراتيجي</small>
            <div>
              <strong>كروبس كورنر</strong>
              <strong>رُماه</strong>
              <strong>جمعية قُوت للمطاعم والمقاهي</strong>
            </div>
          </div>
          <div>
            <small>الشريك الداعم</small>
            <strong>هِرَكو HRCO</strong>
          </div>
          <div>
            <small>الشريك التقني</small>
            <strong>ميدار Middar</strong>
          </div>
          <div>
            <small>الشريك التسويقي</small>
            <strong>سكاي للتسويق Sky Marketing</strong>
          </div>
        </div>
      </section>

      <footer className="event-landpaga-footer">
        <div className="event-landpaga-brand">
          <Image src="/landpaga/logo-mark.png" alt="شعار المعرض" width={70} height={98} />
          <span>
            <b>المعرض الدولي</b>
            <small>لصناع القهوة و الشوكولاتة</small>
          </span>
        </div>
        <div className="event-landpaga-footer-contact">
          <span>للاستفسار والحجز</span>
          <a href="https://wa.me/966566707352">+966 56 670 7352</a>
          <a href="https://wa.me/966545477164">+966 54 547 7164</a>
        </div>
      </footer>
      <a className="event-landpaga-floating" href="https://wa.me/966566707352" aria-label="تواصل عبر واتساب">
        واتساب
      </a>
    </main>
  );
}
