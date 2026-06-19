"use client";

import {useLocale} from "next-intl";
import {useState} from "react";
import DashboardSelect from "@/components/DashboardSelect";

type SettingsTab = "profile" | "skills" | "host" | "payout" | "notifications" | "security";

const content = {
  en: {
    tabs: {
      profile: "Profile & Branding",
      skills: "Skills",
      host: "Host",
      payout: "Payout & Financial",
      notifications: "Notifications",
      security: "Security & Preferences"
    },
    profile: {
      title: "Profile & Branding Settings",
      subtitle: "Control the identity shown on your affiliate pages and CRM records.",
      personal: "Personal Info",
      link: "Affiliate Link Manager",
      fullName: "Full Name",
      email: "Email",
      phone: "Mobile Number",
      city: "City",
      district: "District",
      joinedAt: "Join Date",
      referralCode: "Marketer Referral Code",
      license: "Do you have a marketing license?",
      licenseVerified: "Verified",
      licenseEcommerce: "E-marketing License",
      licenseFal: "FAL License",
      slug: "Landing Page Slug",
      url: "Unique Affiliate URL",
      copy: "Copy Link",
      save: "Save Changes"
    },
    payout: {
      title: "Payout & Financial Settings",
      subtitle: "Keep payout details clean, validated, and ready for approved commissions.",
      bank: "Bank Details",
      threshold: "Minimum Payout Threshold",
      bankName: "Bank Name",
      holder: "Account Holder Name",
      iban: "IBAN",
      save: "Save Changes"
    },
    notifications: {
      title: "Notification Preferences",
      subtitle: "Choose which affiliate and CRM events should reach you instantly.",
      email: "Email Notifications",
      system: "System Notifications",
      lead: "New Lead Registered",
      quote: "Quote Opened by Client",
      commission: "Commission Approved",
      payout: "Instant payout status changes",
      save: "Save Changes"
    },
    security: {
      title: "Security & Preferences",
      subtitle: "Protect your account and set your preferred dashboard experience.",
      password: "Password Update",
      language: "Language Preference",
      current: "Current Password",
      next: "New Password",
      confirm: "Confirm Password",
      save: "Save Changes"
    }
  },
  ar: {
    tabs: {
      profile: "الحساب والهوية",
      payout: "المالية والصرف",
      notifications: "التنبيهات",
      security: "الأمان والخيارات"
    },
    profile: {
      title: "إعدادات الحساب والهوية",
      subtitle: "تحكم بالهوية الظاهرة في صفحاتك التسويقية وسجلات CRM.",
      personal: "المعلومات الشخصية",
      link: "إدارة رابط المسوق",
      fullName: "الاسم الكامل",
      email: "البريد الإلكتروني",
      phone: "رقم الجوال",
      slug: "اسم رابط صفحة الهبوط",
      url: "رابط المسوق الفريد",
      copy: "نسخ الرابط",
      save: "حفظ التغييرات"
    },
    payout: {
      title: "الإعدادات المالية والصرف",
      subtitle: "حافظ على بيانات الصرف منظمة وجاهزة للعمولات المعتمدة.",
      bank: "البيانات البنكية",
      threshold: "حد الصرف الأدنى",
      bankName: "اسم البنك",
      holder: "اسم صاحب الحساب",
      iban: "رقم الآيبان",
      save: "حفظ التغييرات"
    },
    notifications: {
      title: "إدارة التنبيهات",
      subtitle: "اختر تنبيهات العملاء والعروض والعمولات التي تريد استقبالها.",
      email: "تنبيهات البريد الإلكتروني",
      system: "تنبيهات النظام والمتصفح",
      lead: "تسجيل عميل محتمل جديد",
      quote: "فتح عرض السعر من العميل",
      commission: "اعتماد عمولة",
      payout: "تغييرات حالة الصرف فورياً",
      save: "حفظ التغييرات"
    },
    security: {
      title: "الأمان والخيارات",
      subtitle: "احم حسابك واضبط تجربة لوحة التحكم حسب تفضيلك.",
      password: "تحديث كلمة المرور",
      language: "تفضيل اللغة",
      current: "كلمة المرور الحالية",
      next: "كلمة المرور الجديدة",
      confirm: "تأكيد كلمة المرور",
      save: "حفظ التغييرات"
    }
  }
};

const cleanArabicContent: typeof content.en = {
  tabs: {
    profile: "\u0627\u0644\u062d\u0633\u0627\u0628 \u0648\u0627\u0644\u0647\u0648\u064a\u0629",
    skills: "\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062a",
    host: "\u0627\u0644\u0645\u0633\u062a\u0636\u064a\u0641",
    payout: "\u0627\u0644\u0645\u0627\u0644\u064a\u0629 \u0648\u0627\u0644\u0635\u0631\u0641",
    notifications: "\u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a",
    security: "\u0627\u0644\u0623\u0645\u0627\u0646 \u0648\u0627\u0644\u062e\u064a\u0627\u0631\u0627\u062a"
  },
  profile: {
    title: "\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u062d\u0633\u0627\u0628 \u0648\u0627\u0644\u0647\u0648\u064a\u0629",
    subtitle: "\u062a\u062d\u0643\u0645 \u0628\u0627\u0644\u0647\u0648\u064a\u0629 \u0627\u0644\u0638\u0627\u0647\u0631\u0629 \u0641\u064a \u0635\u0641\u062d\u0627\u062a\u0643 \u0627\u0644\u062a\u0633\u0648\u064a\u0642\u064a\u0629 \u0648\u0633\u062c\u0644\u0627\u062a CRM.",
    personal: "\u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0634\u062e\u0635\u064a\u0629",
    link: "\u0625\u062f\u0627\u0631\u0629 \u0631\u0627\u0628\u0637 \u0627\u0644\u0645\u0633\u0648\u0642",
    fullName: "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644",
    email: "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a",
    phone: "\u0631\u0642\u0645 \u0627\u0644\u0645\u0648\u0628\u0627\u064a\u0644",
    city: "\u0627\u0644\u0645\u062f\u064a\u0646\u0629",
    district: "\u0627\u0644\u062d\u064a",
    joinedAt: "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0627\u0646\u0636\u0645\u0627\u0645",
    referralCode: "\u0631\u0645\u0632 \u0627\u0644\u0625\u062d\u0627\u0644\u0629 \u0644\u0644\u0645\u0633\u0648\u0642",
    license: "\u0647\u0644 \u062a\u0645\u0644\u0643 \u0631\u062e\u0635\u0629 \u062a\u0633\u0648\u064a\u0642",
    licenseVerified: "\u0645\u0648\u062b\u0642",
    licenseEcommerce: "\u0631\u062e\u0635\u0629 \u062a\u0633\u0648\u064a\u0642 \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a",
    licenseFal: "\u0631\u062e\u0635\u0629 \u0641\u0627\u0644",
    slug: "\u0627\u0633\u0645 \u0631\u0627\u0628\u0637 \u0635\u0641\u062d\u0629 \u0627\u0644\u0647\u0628\u0648\u0637",
    url: "\u0631\u0627\u0628\u0637 \u0627\u0644\u0645\u0633\u0648\u0642 \u0627\u0644\u0641\u0631\u064a\u062f",
    copy: "\u0646\u0633\u062e \u0627\u0644\u0631\u0627\u0628\u0637",
    save: "\u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a"
  },
  payout: {
    title: "\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0645\u0627\u0644\u064a\u0629 \u0648\u0627\u0644\u0635\u0631\u0641",
    subtitle: "\u062d\u0627\u0641\u0638 \u0639\u0644\u0649 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0635\u0631\u0641 \u0645\u0646\u0638\u0645\u0629 \u0648\u062c\u0627\u0647\u0632\u0629 \u0644\u0644\u0639\u0645\u0648\u0644\u0627\u062a \u0627\u0644\u0645\u0639\u062a\u0645\u062f\u0629.",
    bank: "\u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0628\u0646\u0643\u064a\u0629",
    threshold: "\u062d\u062f \u0627\u0644\u0635\u0631\u0641 \u0627\u0644\u0623\u062f\u0646\u0649",
    bankName: "\u0627\u0633\u0645 \u0627\u0644\u0628\u0646\u0643",
    holder: "\u0627\u0633\u0645 \u0635\u0627\u062d\u0628 \u0627\u0644\u062d\u0633\u0627\u0628",
    iban: "\u0631\u0642\u0645 \u0627\u0644\u0622\u064a\u0628\u0627\u0646",
    save: "\u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a"
  },
  notifications: {
    title: "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a",
    subtitle: "\u0627\u062e\u062a\u0631 \u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0648\u0627\u0644\u0639\u0631\u0648\u0636 \u0648\u0627\u0644\u0639\u0645\u0648\u0644\u0627\u062a \u0627\u0644\u062a\u064a \u062a\u0631\u064a\u062f \u0627\u0633\u062a\u0642\u0628\u0627\u0644\u0647\u0627.",
    email: "\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a",
    system: "\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0627\u0644\u0646\u0638\u0627\u0645 \u0648\u0627\u0644\u0645\u062a\u0635\u0641\u062d",
    lead: "\u062a\u0633\u062c\u064a\u0644 \u0639\u0645\u064a\u0644 \u0645\u0624\u0647\u0644 \u062c\u062f\u064a\u062f",
    quote: "\u0641\u062a\u062d \u0639\u0631\u0636 \u0627\u0644\u0633\u0639\u0631 \u0645\u0646 \u0627\u0644\u0639\u0645\u064a\u0644",
    commission: "\u0627\u0639\u062a\u0645\u0627\u062f \u0639\u0645\u0648\u0644\u0629",
    payout: "\u062a\u063a\u064a\u064a\u0631\u0627\u062a \u062d\u0627\u0644\u0629 \u0627\u0644\u0635\u0631\u0641 \u0641\u0648\u0631\u064a\u0627\u064b",
    save: "\u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a"
  },
  security: {
    title: "\u0627\u0644\u0623\u0645\u0627\u0646 \u0648\u0627\u0644\u062e\u064a\u0627\u0631\u0627\u062a",
    subtitle: "\u0627\u062d\u0645 \u062d\u0633\u0627\u0628\u0643 \u0648\u0627\u0636\u0628\u0637 \u062a\u062c\u0631\u0628\u0629 \u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645 \u062d\u0633\u0628 \u062a\u0641\u0636\u064a\u0644\u0643.",
    password: "\u062a\u062d\u062f\u064a\u062b \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
    language: "\u062a\u0641\u0636\u064a\u0644 \u0627\u0644\u0644\u063a\u0629",
    current: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062d\u0627\u0644\u064a\u0629",
    next: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062c\u062f\u064a\u062f\u0629",
    confirm: "\u062a\u0623\u0643\u064a\u062f \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
    save: "\u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a"
  }
};

function Toggle({label, defaultChecked = true}: {label: string; defaultChecked?: boolean}) {
  return (
    <label className="settings-toggle-row">
      <span>{label}</span>
      <input type="checkbox" defaultChecked={defaultChecked} />
      <i aria-hidden="true" />
    </label>
  );
}

function SocialFieldIcon({name}: {name: "tiktok" | "snapchat" | "x" | "facebook" | "linkedin"}) {
  return (
    <span className={`settings-social-icon ${name}`} aria-hidden="true">
      {name === "tiktok" ? (
        <svg viewBox="0 0 24 24">
          <path d="M14.6 3c.3 2.8 1.9 4.7 4.6 5.1v3.3a8.1 8.1 0 0 1-4.5-1.3v5.8c0 3.3-2.2 5.2-5 5.2-2.7 0-4.8-1.9-4.8-4.5 0-2.8 2.2-4.5 5.2-4.5.3 0 .6 0 .8.1v3.5a2.8 2.8 0 0 0-.8-.1c-1 0-1.7.6-1.7 1.5s.7 1.5 1.6 1.5c1.1 0 1.7-.7 1.7-2V3h2.9Z" />
        </svg>
      ) : name === "snapchat" ? (
        <svg viewBox="0 0 24 24">
          <path d="M12 3.8c3 0 4.6 2.3 4.6 4.9 0 .6-.1 1.4-.1 2.1 0 .5.2.7.6.7.8 0 1.3-.4 1.7-.4.5 0 .9.3.9.8 0 .9-1.9 1.3-2.4 1.7.1 1.1 1.9 3.2 3.8 3.6.4.1.6.4.6.7 0 .7-1.8 1.1-2.8 1.3-.3.1-.4 1.1-1.1 1.1-.6 0-1.5-.4-2.6-.4-1.2 0-1.8 1.4-3.3 1.4s-2.1-1.4-3.3-1.4c-1.1 0-2 .4-2.6.4-.7 0-.8-1-1.1-1.1-1-.2-2.8-.6-2.8-1.3 0-.3.2-.6.6-.7 1.9-.4 3.7-2.5 3.8-3.6-.5-.4-2.4-.8-2.4-1.7 0-.5.4-.8.9-.8.4 0 .9.4 1.7.4.4 0 .6-.2.6-.7 0-.7-.1-1.5-.1-2.1 0-2.6 1.6-4.9 4.6-4.9Z" />
        </svg>
      ) : name === "x" ? (
        <svg viewBox="0 0 24 24">
          <path d="M14.2 10.8 20.1 4h-2.6l-4.4 5.1L9.6 4H4l6.2 9.1L3.9 20h2.6l4.9-5.7 3.9 5.7H21l-6.8-9.2Zm-1.7 2-1-1.4L7.5 5.9h1.1l3.4 4.9 1 1.4 4.3 6h-1.1l-3.7-5.4Z" />
        </svg>
      ) : name === "facebook" ? (
        <svg viewBox="0 0 24 24">
          <path d="M14.3 8.2V6.5c0-.8.4-1.2 1.3-1.2h1.5V2.7a21 21 0 0 0-2.4-.1c-2.4 0-4 1.5-4 4.1v1.5H8v3h2.7v8.2h3.6v-8.2h2.4l.4-3h-2.8Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24">
          <path d="M5 8.8h3.2V20H5V8.8Zm1.6-5.5a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8ZM10.4 8.8h3.1v1.5h.1c.4-.8 1.5-1.8 3-1.8 3.2 0 3.8 2.1 3.8 4.9V20h-3.2v-5.8c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3V20h-3.2V8.8Z" />
        </svg>
      )}
    </span>
  );
}

const settingsTabOrder: SettingsTab[] = ["profile", "skills", "host", "payout", "notifications", "security"];

export default function SettingsDashboard() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const copy = isArabic ? cleanArabicContent : content.en;
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [skillProofs, setSkillProofs] = useState<Array<{name: string; url: string}>>([]);
  const getTabLabel = (tab: SettingsTab) => {
    if (tab === "skills") {
      return isArabic ? "\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062a" : "Skills";
    }

    if (tab === "host") {
      return isArabic ? "\u0627\u0644\u0641\u0631\u064a\u0642" : "Team";
    }

    return copy.tabs[tab];
  };
  const profileFields = {
    fullName: copy.profile.fullName,
    phone: isArabic ? "\u0631\u0642\u0645 \u0627\u0644\u0645\u0648\u0628\u0627\u064a\u0644" : copy.profile.phone,
    email: copy.profile.email,
    city: isArabic ? "\u0627\u0644\u0645\u062f\u064a\u0646\u0629" : content.en.profile.city,
    district: isArabic ? "\u0627\u0644\u062d\u064a" : content.en.profile.district,
    joinedAt: isArabic ? "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0627\u0646\u0636\u0645\u0627\u0645" : content.en.profile.joinedAt,
    referralCode: isArabic ? "\u0631\u0645\u0632 \u0627\u0644\u0625\u062d\u0627\u0644\u0629 \u0644\u0644\u0645\u0633\u0648\u0642" : content.en.profile.referralCode,
    license: isArabic ? "\u0647\u0644 \u062a\u0645\u0644\u0643 \u0631\u062e\u0635\u0629 \u062a\u0633\u0648\u064a\u0642" : content.en.profile.license,
    licenseVerified: isArabic ? "\u0645\u0648\u062b\u0642" : content.en.profile.licenseVerified,
    licenseEcommerce: isArabic ? "\u0631\u062e\u0635\u0629 \u062a\u0633\u0648\u064a\u0642 \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a" : content.en.profile.licenseEcommerce,
    licenseFal: isArabic ? "\u0631\u062e\u0635\u0629 \u0641\u0627\u0644" : content.en.profile.licenseFal
  };
  const skillsCopy = {
    title: isArabic ? "\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062a" : "Skills",
    experience: isArabic ? "\u0627\u0644\u062e\u0628\u0631\u0627\u062a" : "Experience",
    experiencePlaceholder: isArabic ? "\u0627\u0630\u0643\u0631 \u062e\u0628\u0631\u0627\u062a\u0643 \u0627\u0644\u0633\u0627\u0628\u0642\u0629 \u0641\u064a \u0645\u062c\u0627\u0644 \u0627\u0644\u062a\u0633\u0648\u064a\u0642 \u0648\u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a..." : "List your previous experience in marketing and sales...",
    courses: isArabic ? "\u0627\u0644\u062f\u0648\u0631\u0627\u062a" : "Courses",
    coursesPlaceholder: isArabic ? "\u0627\u0644\u0634\u0647\u0627\u062f\u0627\u062a \u0627\u0644\u0645\u0647\u0646\u064a\u0629 \u0623\u0648 \u0627\u0644\u062f\u0648\u0631\u0627\u062a \u0627\u0644\u062a\u062f\u0631\u064a\u0628\u064a\u0629 \u0627\u0644\u062a\u064a \u062d\u0635\u0644\u062a \u0639\u0644\u064a\u0647\u0627..." : "Professional certificates or training courses you have completed...",
    evidence: isArabic ? "\u0623\u062f\u0644\u0629 \u0625\u062b\u0628\u0627\u062a \u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062a (\u0635\u0648\u0631)" : "Skill Proof Evidence (Images)",
    upload: isArabic ? "\u0627\u0636\u063a\u0637 \u0647\u0646\u0627 \u0623\u0648 \u0642\u0645 \u0628\u0633\u062d\u0628 \u0648\u0625\u0641\u0644\u0627\u062a \u0627\u0644\u0635\u0648\u0631 \u0644\u0631\u0641\u0639\u0647\u0627 \u0643\u062f\u0644\u064a\u0644 (PNG, JPG)" : "Click here or drag and drop images to upload as proof (PNG, JPG)",
    save: isArabic ? "\u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a" : "Save Changes"
  };
  const hostCopy = {
    title: isArabic ? "\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0641\u0631\u064a\u0642" : "Team Details",
    hostName: isArabic ? "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u0636\u064a\u0641" : "Host Name",
    hostNamePlaceholder: isArabic ? "\u0627\u0643\u062a\u0628 \u0627\u0633\u0645 \u0627\u0644\u0634\u062e\u0635 \u0623\u0648 \u0627\u0644\u062c\u0647\u0629 \u0627\u0644\u0645\u0633\u062a\u0636\u064a\u0641\u0629..." : "Write the host person or organization name...",
    hostPhone: isArabic ? "\u0631\u0642\u0645 \u0627\u0644\u0645\u0633\u062a\u0636\u064a\u0641" : "Host Number",
    hostPhonePlaceholder: "+966 5x xxx xxxx",
    members: isArabic ? "\u0623\u0639\u0636\u0627\u0621 \u0627\u0644\u0641\u0631\u064a\u0642" : "Team Members",
    name: isArabic ? "\u0627\u0644\u0627\u0633\u0645" : "Name",
    phone: isArabic ? "\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644" : "Mobile Number",
    status: isArabic ? "\u0627\u0644\u062d\u0627\u0644\u0629" : "Status",
    active: isArabic ? "\u0646\u0634\u0637" : "Active",
    pending: isArabic ? "\u0645\u0639\u0644\u0642" : "Pending",
    save: isArabic ? "\u0625\u0636\u0627\u0641\u0629 \u0639\u0636\u0648" : "Add Member"
  };
  const teamMembers = [
    {name: isArabic ? "\u0639\u0628\u062f\u0627\u0644\u0644\u0647 \u0627\u0644\u0634\u0631\u064a\u0643" : "Abdullah Partner", phone: "+966 55 000 1244", status: hostCopy.active, statusClass: "paid"},
    {name: isArabic ? "\u0646\u0648\u0631\u0629 \u0627\u0644\u063a\u0627\u0645\u062f\u064a" : "Noura Alghamdi", phone: "+966 54 882 1900", status: hostCopy.active, statusClass: "paid"},
    {name: isArabic ? "\u0633\u0627\u0631\u0629 \u0627\u0644\u0639\u062a\u064a\u0628\u064a" : "Sarah Alotaibi", phone: "+966 50 431 7721", status: hostCopy.pending, statusClass: "pending"}
  ];

  function handleSkillProofUpload(files: FileList | null) {
    if (!files) {
      return;
    }

    const images = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({name: file.name, url: URL.createObjectURL(file)}));

    setSkillProofs((current) => [...current, ...images].slice(0, 8));
  }

  return (
    <section className="settings-dashboard-panel">
      <div className="settings-tabs" role="tablist" aria-orientation="vertical">
        {settingsTabOrder.map((tab) => (
          <button
            aria-selected={activeTab === tab}
            className={activeTab === tab ? "active" : ""}
            key={tab}
            onClick={() => setActiveTab(tab)}
            role="tab"
            type="button"
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </div>

      <article className="settings-tab-card" role="tabpanel">
        {activeTab === "profile" ? (
          <>
            <div className="settings-section-head">
              <h3>{copy.profile.title}</h3>
              <p>{copy.profile.subtitle}</p>
            </div>
            <div className="settings-form-grid">
              <fieldset className="settings-profile-fields">
                <legend>{copy.profile.personal}</legend>
                <label>
                  <span>{profileFields.fullName}</span>
                  <input defaultValue={isArabic ? "عبدالله الشريك" : "Abdullah Partner"} />
                </label>
                <label>
                  <span>{profileFields.email}</span>
                  <input defaultValue="partner@middar.com" type="email" />
                </label>
                <label>
                  <span>{profileFields.phone}</span>
                  <input defaultValue="+966 55 000 1244" type="tel" />
                </label>
                <label>
                  <span>{profileFields.city}</span>
                  <input defaultValue={isArabic ? "\u0627\u0644\u0631\u064a\u0627\u0636" : "Riyadh"} />
                </label>
                <label>
                  <span>{profileFields.district}</span>
                  <input defaultValue={isArabic ? "\u062d\u064a \u0627\u0644\u0645\u0644\u0642\u0627" : "Al Malqa"} />
                </label>
                <label>
                  <span>{profileFields.joinedAt}</span>
                  <input disabled readOnly value="2026-06-13" />
                </label>
                <label>
                  <span>{profileFields.referralCode}</span>
                  <input defaultValue="btz-1942" pattern="[A-Za-z0-9-]+" placeholder="btz-1942" />
                </label>
                <label>
                  <span>{profileFields.license}</span>
                  <DashboardSelect
                    ariaLabel={profileFields.license}
                    defaultValue={profileFields.licenseVerified}
                    options={[
                      profileFields.licenseVerified,
                      profileFields.licenseEcommerce,
                      profileFields.licenseFal
                    ].map((option) => ({label: option, value: option}))}
                  />
                </label>
              </fieldset>
              <fieldset className="settings-social-fields">
                <legend>{isArabic ? "\u062d\u0633\u0627\u0628\u0627\u062a \u0627\u0644\u0633\u0648\u0634\u0644 \u0645\u064a\u062f\u064a\u0627" : "Social Media Accounts"}</legend>
                {[
                  {key: "tiktok", label: isArabic ? "\u062a\u064a\u0643 \u062a\u0648\u0643" : "TikTok", placeholder: isArabic ? "username@ \u0623\u0648 \u0631\u0627\u0628\u0637 \u0627\u0644\u062d\u0633\u0627\u0628" : "username@ or profile link"},
                  {key: "snapchat", label: isArabic ? "\u0633\u0646\u0627\u0628 \u0634\u0627\u062a" : "Snapchat", placeholder: isArabic ? "username@ \u0623\u0648 \u0631\u0627\u0628\u0637 \u0627\u0644\u062d\u0633\u0627\u0628" : "username@ or profile link"},
                  {key: "x", label: isArabic ? "\u062a\u0648\u064a\u062a\u0631" : "X / Twitter", placeholder: isArabic ? "username@ \u0623\u0648 \u0631\u0627\u0628\u0637 \u0627\u0644\u062d\u0633\u0627\u0628" : "username@ or profile link"},
                  {key: "facebook", label: isArabic ? "\u0641\u064a\u0633 \u0628\u0648\u0643" : "Facebook", placeholder: isArabic ? "username@ \u0623\u0648 \u0631\u0627\u0628\u0637 \u0627\u0644\u062d\u0633\u0627\u0628" : "username@ or profile link"},
                  {key: "linkedin", label: isArabic ? "\u0644\u064a\u0646\u0643\u062f\u0646" : "LinkedIn", placeholder: isArabic ? "username@ \u0623\u0648 \u0631\u0627\u0628\u0637 \u0627\u0644\u062d\u0633\u0627\u0628" : "username@ or profile link"}
                ].map((field) => (
                  <label key={field.key}>
                    <span>{field.label}</span>
                    <div className="settings-social-input">
                      <SocialFieldIcon name={field.key as "tiktok" | "snapchat" | "x" | "facebook" | "linkedin"} />
                      <input placeholder={field.placeholder} />
                    </div>
                  </label>
                ))}
              </fieldset>
              <fieldset>
                <legend>{copy.profile.link}</legend>
                <label>
                  <span>{copy.profile.slug}</span>
                  <input defaultValue="abdullah-growth" />
                </label>
                <label>
                  <span>{copy.profile.url}</span>
                  <div className="copy-link-control">
                    <input readOnly value="https://middar.com/p/abdullah-growth" />
                    <button type="button">{copy.profile.copy}</button>
                  </div>
                </label>
              </fieldset>
            </div>
            <button className="settings-save-button" type="button">{copy.profile.save}</button>
          </>
        ) : null}

        {activeTab === "skills" ? (
          <>
            <div className="settings-section-head">
              <h3>{skillsCopy.title}</h3>
            </div>
            <div className="settings-skills-page">
              <div className="settings-skills-grid">
                <label>
                  <span>{skillsCopy.experience}</span>
                  <textarea placeholder={skillsCopy.experiencePlaceholder} />
                </label>
                <label>
                  <span>{skillsCopy.courses}</span>
                  <textarea placeholder={skillsCopy.coursesPlaceholder} />
                </label>
              </div>
              <label className="settings-proof-upload">
                <span>{skillsCopy.evidence}</span>
                <input
                  accept="image/png,image/jpeg"
                  multiple
                  onChange={(event) => handleSkillProofUpload(event.target.files)}
                  type="file"
                />
                <strong aria-hidden="true">▧</strong>
                <p>{skillsCopy.upload}</p>
              </label>
              {skillProofs.length > 0 ? (
                <div className="settings-proof-preview-grid">
                  {skillProofs.map((proof) => (
                    <figure key={`${proof.name}-${proof.url}`}>
                      <img alt={proof.name} src={proof.url} />
                    </figure>
                  ))}
                </div>
              ) : null}
            </div>
            <button className="settings-save-button" type="button">{skillsCopy.save}</button>
          </>
        ) : null}

        {activeTab === "host" ? (
          <>
            <div className="settings-section-head">
              <h3>{hostCopy.title}</h3>
            </div>
            <div className="settings-host-page">
              <div className="settings-host-grid">
                <label>
                  <span>{hostCopy.hostName}</span>
                  <input placeholder={hostCopy.hostNamePlaceholder} type="text" />
                </label>
                <label>
                  <span>{hostCopy.hostPhone}</span>
                  <input dir="ltr" placeholder={hostCopy.hostPhonePlaceholder} type="tel" />
                </label>
              </div>
              <div className="settings-team-divider" />
              <h4>{hostCopy.members}</h4>
              <div className="settings-team-table">
                <div className="settings-team-row settings-team-head">
                  <span>{hostCopy.name}</span>
                  <span>{hostCopy.phone}</span>
                  <span>{hostCopy.status}</span>
                </div>
                {teamMembers.map((member) => (
                  <div className="settings-team-row" key={member.phone}>
                    <strong>{member.name}</strong>
                    <span dir="ltr">{member.phone}</span>
                    <span className={`badge ${member.statusClass}`}>{member.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="settings-save-button" type="button">{hostCopy.save}</button>
          </>
        ) : null}

        {activeTab === "payout" ? (
          <>
            <div className="settings-section-head">
              <h3>{copy.payout.title}</h3>
              <p>{copy.payout.subtitle}</p>
            </div>
            <div className="settings-form-grid">
              <fieldset>
                <legend>{copy.payout.bank}</legend>
                <label>
                  <span>{copy.payout.bankName}</span>
                  <input defaultValue={isArabic ? "البنك الأهلي السعودي" : "Saudi National Bank"} />
                </label>
                <label>
                  <span>{copy.payout.holder}</span>
                  <input defaultValue={isArabic ? "عبدالله الشريك" : "Abdullah Partner"} />
                </label>
                <label>
                  <span>{copy.payout.iban}</span>
                  <input defaultValue="SA03 8000 0000 6080 1016 7519" pattern="^[A-Z]{2}[0-9A-Z ]{13,32}$" />
                </label>
              </fieldset>
              <fieldset>
                <legend>{copy.payout.threshold}</legend>
                <label>
                  <span>{copy.payout.threshold}</span>
                  <DashboardSelect
                    ariaLabel={copy.payout.threshold}
                    defaultValue="500"
                    options={[
                      {label: "$100", value: "100"},
                      {label: "$500", value: "500"},
                      {label: "$1,000", value: "1000"}
                    ]}
                  />
                </label>
                <div className="threshold-meter">
                  <span />
                </div>
              </fieldset>
            </div>
            <button className="settings-save-button" type="button">{copy.payout.save}</button>
          </>
        ) : null}

        {activeTab === "notifications" ? (
          <>
            <div className="settings-section-head">
              <h3>{copy.notifications.title}</h3>
              <p>{copy.notifications.subtitle}</p>
            </div>
            <div className="settings-form-grid">
              <fieldset>
                <legend>{copy.notifications.email}</legend>
                <Toggle label={copy.notifications.lead} />
                <Toggle label={copy.notifications.quote} />
                <Toggle label={copy.notifications.commission} />
              </fieldset>
              <fieldset>
                <legend>{copy.notifications.system}</legend>
                <Toggle label={copy.notifications.payout} defaultChecked={false} />
              </fieldset>
            </div>
            <button className="settings-save-button" type="button">{copy.notifications.save}</button>
          </>
        ) : null}

        {activeTab === "security" ? (
          <>
            <div className="settings-section-head">
              <h3>{copy.security.title}</h3>
              <p>{copy.security.subtitle}</p>
            </div>
            <div className="settings-form-grid">
              <fieldset>
                <legend>{copy.security.password}</legend>
                <label>
                  <span>{copy.security.current}</span>
                  <input type="password" />
                </label>
                <label>
                  <span>{copy.security.next}</span>
                  <input type="password" />
                </label>
                <label>
                  <span>{copy.security.confirm}</span>
                  <input type="password" />
                </label>
              </fieldset>
              <fieldset>
                <legend>{copy.security.language}</legend>
                <DashboardSelect
                  ariaLabel={copy.security.language}
                  defaultValue={locale}
                  options={[
                    {label: "العربية", value: "ar"},
                    {label: "English", value: "en"}
                  ]}
                />
              </fieldset>
            </div>
            <button className="settings-save-button" type="button">{copy.security.save}</button>
          </>
        ) : null}
      </article>
    </section>
  );
}
