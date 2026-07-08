"use client";

import {useActionState} from "react";
import {useLocale} from "next-intl";
import {captureAffiliateLead} from "@/app/actions";

export default function ChaletsLeadForm() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [state, formAction, pending] = useActionState(captureAffiliateLead, {});

  return (
    <form action={formAction} className="chalets-lead-form">
      <input name="affiliateUsername" type="hidden" value="chalets" />
      <input name="affiliateId" type="hidden" value="middar_chalets" />
      <input name="locale" type="hidden" value={locale} />
      <input name="companySize" type="hidden" value={isArabic ? "الشاليهات والمنتجعات" : "Chalets and resorts"} />

      <div className="chalets-form-grid">
        <label>
          <span>{isArabic ? "اسم المنشأة" : "Property name"}</span>
          <input name="propertyName" required type="text" placeholder={isArabic ? "اسم الشاليه أو المنتجع" : "Chalet or resort name"} />
        </label>

        <label>
          <span>{isArabic ? "الاسم الكامل" : "Full name"}</span>
          <input name="fullName" required type="text" placeholder={isArabic ? "أدخل اسمك الكامل" : "Enter your full name"} />
        </label>

        <label>
          <span>{isArabic ? "نوع النشاط" : "Business type"}</span>
          <select name="businessType" required defaultValue="">
            <option value="" disabled>
              {isArabic ? "اختر نوع النشاط" : "Select business type"}
            </option>
            <option value={isArabic ? "شاليهات" : "Chalets"}>{isArabic ? "شاليهات" : "Chalets"}</option>
            <option value={isArabic ? "منتجع" : "Resort"}>{isArabic ? "منتجع" : "Resort"}</option>
            <option value={isArabic ? "استراحة" : "Private lounge"}>{isArabic ? "استراحة" : "Private lounge"}</option>
            <option value={isArabic ? "مخيم أو وجهة ترفيهية" : "Camp or entertainment venue"}>
              {isArabic ? "مخيم أو وجهة ترفيهية" : "Camp or entertainment venue"}
            </option>
          </select>
        </label>

        <label>
          <span>{isArabic ? "البريد الإلكتروني" : "Email"}</span>
          <input dir="ltr" name="email" required type="email" placeholder="name@company.com" />
        </label>

        <label>
          <span>{isArabic ? "العنوان" : "Location"}</span>
          <input name="address" type="text" placeholder={isArabic ? "المدينة، الحي" : "City, district"} />
        </label>

        <label>
          <span>{isArabic ? "رقم الجوال" : "Mobile number"}</span>
          <input dir="ltr" name="phone" required type="tel" placeholder="+966 5X XXX XXXX" />
        </label>
      </div>

      <label>
        <span>{isArabic ? "المتطلبات الإضافية" : "Additional requirements"}</span>
        <textarea
          name="message"
          placeholder={
            isArabic
              ? "اذكر عدد الوحدات، طريقة الحجز الحالية، وأي تفاصيل تريد تجهيزها..."
              : "Share unit count, current booking flow, and any setup details..."
          }
        />
      </label>

      <button className="button button-form" disabled={pending} type="submit">
        {pending
          ? isArabic
            ? "جاري الإرسال..."
            : "Sending..."
          : isArabic
            ? "إرسال البيانات"
            : "Submit details"}
      </button>

      <p className={state.success ? "success" : ""} role="status">
        {state.success
          ? isArabic
            ? "تم استلام البيانات، وسيتواصل معك فريق ميدار قريباً."
            : "Details received. Middar will contact you shortly."
          : isArabic
            ? "املأ البيانات وسنجهز لك تصوراً مناسباً لإدارة الشاليهات."
            : "Fill in the details and we will prepare a suitable chalet management setup."}
      </p>
    </form>
  );
}
