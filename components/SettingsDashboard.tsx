"use client";

import {useLocale} from "next-intl";
import {usePathname, useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import DashboardSelect from "@/components/DashboardSelect";
import {createBackend, saveSocialAccountsBackend, updateProfileBackend, useBackend} from "@/lib/client-backend";

type SettingsTab = "profile" | "skills" | "host" | "social" | "payout" | "notifications" | "security";
const NUMBER_LOCALE = "en-US";

type PayoutMethod = {
  id: number;
  bank_name: string;
  account_holder_name: string;
  iban: string;
  minimum_payout_amount: number | string;
  currency: string;
  is_default: number | boolean;
};

type NotificationSettings = {
  email_new_lead: number;
  email_quote_opened: number;
  email_commission_approved: number;
  payout_status_updates: number;
};

const defaultNotificationSettings: NotificationSettings = {
  email_new_lead: 1,
  email_quote_opened: 1,
  email_commission_approved: 1,
  payout_status_updates: 0,
};

const emptyPayoutDraft = {
  bank_name: "",
  account_holder_name: "",
  iban: "",
  minimum_payout_amount: "500",
  currency: "SAR",
  is_default: false
};

const content = {
  en: {
    tabs: {
      profile: "Profile & Branding",
      skills: "Skills",
      host: "Host",
      social: "Social Media Accounts",
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
  lead: "تسجيل عميل مهتم جديد",
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
    social: "\u062d\u0633\u0627\u0628\u0627\u062a \u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639\u064a",
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

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="settings-toggle-row">
      <span>{label}</span>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      <i aria-hidden="true" />
    </label>
  );
}

function SocialFieldIcon({name}: {name: "tiktok" | "snapchat" | "x" | "facebook" | "instagram" | "linkedin"}) {
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
      ) : name === "instagram" ? (
        <svg viewBox="0 0 24 24">
          <path d="M7.2 2.8h9.6a4.4 4.4 0 0 1 4.4 4.4v9.6a4.4 4.4 0 0 1-4.4 4.4H7.2a4.4 4.4 0 0 1-4.4-4.4V7.2a4.4 4.4 0 0 1 4.4-4.4Zm0 2A2.4 2.4 0 0 0 4.8 7.2v9.6a2.4 2.4 0 0 0 2.4 2.4h9.6a2.4 2.4 0 0 0 2.4-2.4V7.2a2.4 2.4 0 0 0-2.4-2.4H7.2Zm10.3 1.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 7.4a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2Zm0 2a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24">
          <path d="M5 8.8h3.2V20H5V8.8Zm1.6-5.5a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8ZM10.4 8.8h3.1v1.5h.1c.4-.8 1.5-1.8 3-1.8 3.2 0 3.8 2.1 3.8 4.9V20h-3.2v-5.8c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3V20h-3.2V8.8Z" />
        </svg>
      )}
    </span>
  );
}

const settingsTabOrder: SettingsTab[] = ["profile", "skills", "host", "social", "payout", "notifications", "security"];

export default function SettingsDashboard() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const isArabic = locale === "ar";
  const copy = isArabic ? cleanArabicContent : content.en;
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [skillProofs, setSkillProofs] = useState<Array<{name: string; url: string}>>([]);
  const [skillsDraft, setSkillsDraft] = useState({skills_experience: "", skills_courses: ""});
  const [skillsStatus, setSkillsStatus] = useState("");
  const profile = useBackend<Record<string, unknown> & {id: number}>("/api/v1/profile");
  const team = useBackend<Array<Record<string, unknown> & {id: number}>>("/api/v1/data/team-members");
  const socialAccounts = useBackend<Array<Record<string, unknown> & {id: number}>>("/api/v1/profile/social-accounts");
  const payoutMethods = useBackend<PayoutMethod[]>("/api/v1/profile/payout-methods");
  const notificationSettings = useBackend<NotificationSettings>("/api/v1/profile/notification-settings");
  const [profileDraft, setProfileDraft] = useState({name: "", phone: "", city: "", district: "", referral_code: "", company_id: "", landing_slug: "", license_type: "none"});
  const [profileStatus, setProfileStatus] = useState("");
  const [licenseUploadStatus, setLicenseUploadStatus] = useState("");
  const [socialDraft, setSocialDraft] = useState<Record<string, string>>({tiktok: "", snapchat: "", x: "", facebook: "", instagram: "", linkedin: ""});
  const [socialStatus, setSocialStatus] = useState("");
  const [payoutDraft, setPayoutDraft] = useState(emptyPayoutDraft);
  const [editingPayoutId, setEditingPayoutId] = useState<number | null>(null);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutStatus, setPayoutStatus] = useState("");
  const [showTeamMemberModal, setShowTeamMemberModal] = useState(false);
  const [newTeamMember, setNewTeamMember] = useState({name: "", phone: ""});
  const [teamMemberStatus, setTeamMemberStatus] = useState("");
  const [passwordDraft, setPasswordDraft] = useState({current: "", next: "", confirm: ""});
  const [preferredLocale, setPreferredLocale] = useState(locale);
  const [securityStatus, setSecurityStatus] = useState("");
  const [notificationDraft, setNotificationDraft] = useState<NotificationSettings>(defaultNotificationSettings);
  const [notificationStatus, setNotificationStatus] = useState("");
  function parseSkillProofUrls(value: unknown) {
    const raw = String(value ?? "").trim();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((url): url is string => typeof url === "string")
        : [];
    } catch {
      return [];
    }
  }

  function mapSkillProofUrls(urls: string[]) {
    return urls.map((url, index) => ({
      name: `Skill proof ${index + 1}`,
      url,
    }));
  }

  useEffect(() => {
    if (!profile.data) return;
    setProfileDraft({
      name: String(profile.data.name ?? ""),
      phone: String(profile.data.phone ?? ""),
      city: String(profile.data.city ?? ""),
      district: String(profile.data.district ?? ""),
      referral_code: String(profile.data.referral_code ?? ""),
      company_id: String(profile.data.company_id ?? ""),
      landing_slug: String(profile.data.landing_slug ?? ""),
      license_type: String(profile.data.license_type ?? "none")
    });
    setSkillsDraft({
      skills_experience: String(profile.data.skills_experience ?? ""),
      skills_courses: String(profile.data.skills_courses ?? "")
    });
    setSkillProofs(mapSkillProofUrls(parseSkillProofUrls(profile.data.skills_proof_files)));
    setPreferredLocale(String(profile.data.preferred_locale ?? locale) === "en" ? "en" : "ar");
  }, [profile.data]);
  useEffect(() => {
    if (!socialAccounts.data) return;
    const values: Record<string, string> = {tiktok: "", snapchat: "", x: "", facebook: "", instagram: "", linkedin: ""};
    socialAccounts.data.forEach((account) => {
      const platform = String(account.platform ?? "");
      if (platform in values) values[platform] = String(account.url ?? account.handle ?? "");
    });
    setSocialDraft(values);
  }, [socialAccounts.data]);
  useEffect(() => {
    if (!notificationSettings.data) return;
    setNotificationDraft({
      email_new_lead: Number(notificationSettings.data.email_new_lead) ? 1 : 0,
      email_quote_opened: Number(notificationSettings.data.email_quote_opened) ? 1 : 0,
      email_commission_approved: Number(notificationSettings.data.email_commission_approved) ? 1 : 0,
      payout_status_updates: Number(notificationSettings.data.payout_status_updates) ? 1 : 0,
    });
  }, [notificationSettings.data]);
  async function saveProfile() {
    setProfileStatus("Saving…");
    try {
      await updateProfileBackend(profileDraft);
      setProfileStatus("Saved");
      await profile.reload();
      window.dispatchEvent(new Event("profile-updated"));
    } catch {
      setProfileStatus("Failed");
    }
  }
  async function saveSecurityPreferences() {
    const hasPasswordChange = Boolean(
      passwordDraft.current || passwordDraft.next || passwordDraft.confirm,
    );
    if (hasPasswordChange) {
      if (!passwordDraft.current || !passwordDraft.next || !passwordDraft.confirm) {
        setSecurityStatus(isArabic ? "\u0623\u062f\u062e\u0644 \u062c\u0645\u064a\u0639 \u062d\u0642\u0648\u0644 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" : "Complete all password fields");
        return;
      }
      if (passwordDraft.next !== passwordDraft.confirm) {
        setSecurityStatus(isArabic ? "\u0643\u0644\u0645\u062a\u0627 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u064a\u0631 \u0645\u062a\u0637\u0627\u0628\u0642\u062a\u064a\u0646" : "New passwords do not match");
        return;
      }
    }

    setSecurityStatus(isArabic ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638..." : "Saving...");
    try {
      if (hasPasswordChange) {
        const response = await fetch("/api/v1/profile/password", {
          method: "PUT",
          headers: {"Content-Type": "application/json; charset=utf-8"},
          body: JSON.stringify({
            currentPassword: passwordDraft.current,
            newPassword: passwordDraft.next,
          }),
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(String(body.error ?? "PASSWORD_UPDATE_FAILED"));
        }
      }

      await updateProfileBackend({preferred_locale: preferredLocale});
      await profile.reload();
      setPasswordDraft({current: "", next: "", confirm: ""});
      setSecurityStatus(isArabic ? "\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u062e\u064a\u0627\u0631\u0627\u062a" : "Preferences saved");

      if (preferredLocale !== locale) {
        const nextPath = pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${preferredLocale}`);
        router.replace(nextPath);
        router.refresh();
      }
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      setSecurityStatus(
        code === "CURRENT_PASSWORD_INCORRECT"
          ? isArabic
            ? "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062d\u0627\u0644\u064a\u0629 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629"
            : "Current password is incorrect"
          : isArabic
            ? "\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u0627\u0644\u062e\u064a\u0627\u0631\u0627\u062a"
            : "Unable to save preferences",
      );
    }
  }
  async function saveNotificationSettings() {
    setNotificationStatus(isArabic ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638..." : "Saving...");
    try {
      const response = await fetch("/api/v1/profile/notification-settings", {
        method: "PUT",
        headers: {"Content-Type": "application/json; charset=utf-8"},
        body: JSON.stringify(notificationDraft),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(String(body.error ?? "SAVE_FAILED"));
      await notificationSettings.reload();
      setNotificationStatus(isArabic ? "\u062a\u0645 \u062d\u0641\u0638 \u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a" : "Notification settings saved");
    } catch {
      setNotificationStatus(isArabic ? "\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a" : "Unable to save notification settings");
    }
  }
  async function uploadLicenseFile(file: File | undefined) {
    if (!file) return;
    setLicenseUploadStatus(isArabic ? "\u062c\u0627\u0631\u064a \u0627\u0644\u0631\u0641\u0639..." : "Uploading...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/v1/profile/license-file", {method: "POST", body: formData});
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "UPLOAD_FAILED");
      setLicenseUploadStatus(isArabic ? "\u062a\u0645 \u0631\u0641\u0639 \u0627\u0644\u0645\u0644\u0641" : "File uploaded");
      await profile.reload();
    } catch {
      setLicenseUploadStatus(isArabic ? "\u062a\u0639\u0630\u0631 \u0631\u0641\u0639 \u0627\u0644\u0645\u0644\u0641" : "Upload failed");
    }
  }
  useEffect(() => {
    if (!showTeamMemberModal) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowTeamMemberModal(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [showTeamMemberModal]);
  async function addTeamMember() {
    if (!newTeamMember.name.trim() || !newTeamMember.phone.trim()) {
      setTeamMemberStatus(isArabic ? "\u0627\u0644\u0627\u0633\u0645 \u0648\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" : "Member name and mobile number are required");
      return;
    }
    setTeamMemberStatus(isArabic ? "\u062c\u0627\u0631\u064a \u0627\u0644\u0625\u0636\u0627\u0641\u0629..." : "Adding...");
    try {
      await createBackend("team-members", {name: newTeamMember.name.trim(), phone: newTeamMember.phone.trim(), status: "inactive"});
      setNewTeamMember({name: "", phone: ""});
      setTeamMemberStatus("");
      setShowTeamMemberModal(false);
      await team.reload();
    } catch (error) {
      const duplicatePhone = error instanceof Error && error.message === "DUPLICATE_PHONE";
      setTeamMemberStatus(duplicatePhone
        ? (isArabic ? "\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644 \u0645\u0633\u062c\u0644 \u0645\u0633\u0628\u0642\u0627\u064b" : "This mobile number is already registered")
        : (isArabic ? "\u062a\u0639\u0630\u0631\u062a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0639\u0636\u0648" : "Unable to add member"));
    }
  }
  async function saveSocialAccounts() {
    setSocialStatus(isArabic ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638..." : "Saving...");
    try {
      await saveSocialAccountsBackend(socialDraft);
      setSocialStatus(isArabic ? "\u062a\u0645 \u0627\u0644\u062d\u0641\u0638" : "Saved");
      await socialAccounts.reload();
    } catch {
      setSocialStatus(isArabic ? "\u062a\u0639\u0630\u0631 \u0627\u0644\u062d\u0641\u0638" : "Save failed");
    }
  }
  function editPayoutMethod(method: PayoutMethod) {
    setShowPayoutForm(true);
    setEditingPayoutId(method.id);
    setPayoutDraft({
      bank_name: String(method.bank_name ?? ""),
      account_holder_name: String(method.account_holder_name ?? ""),
      iban: String(method.iban ?? ""),
      minimum_payout_amount: String(method.minimum_payout_amount ?? "500"),
      currency: String(method.currency ?? "SAR"),
      is_default: Boolean(Number(method.is_default))
    });
    setPayoutStatus("");
  }
  function resetPayoutForm() {
    setShowPayoutForm(false);
    setEditingPayoutId(null);
    setPayoutDraft(emptyPayoutDraft);
  }
  function addAnotherPayoutMethod() {
    setEditingPayoutId(null);
    setPayoutDraft(emptyPayoutDraft);
    setPayoutStatus("");
    setShowPayoutForm(true);
  }
  async function savePayoutMethod() {
    setPayoutStatus(isArabic ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638..." : "Saving...");
    try {
      const path = editingPayoutId
        ? `/api/v1/profile/payout-methods/${editingPayoutId}`
        : "/api/v1/profile/payout-methods";
      const response = await fetch(path, {
        method: editingPayoutId ? "PUT" : "POST",
        headers: {"Content-Type": "application/json; charset=utf-8"},
        body: JSON.stringify(payoutDraft)
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "SAVE_FAILED");
      setPayoutStatus(isArabic ? "\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u062d\u0633\u0627\u0628 \u0627\u0644\u0628\u0646\u0643\u064a" : "Bank account saved");
      resetPayoutForm();
      await payoutMethods.reload();
    } catch {
      setPayoutStatus(isArabic ? "\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0628\u0646\u0643\u064a\u0629" : "Check the bank account details");
    }
  }
  async function removePayoutMethod(id: number) {
    setPayoutStatus(isArabic ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0630\u0641..." : "Removing...");
    try {
      const response = await fetch(`/api/v1/profile/payout-methods/${id}`, {method: "DELETE"});
      if (!response.ok) throw new Error("DELETE_FAILED");
      if (editingPayoutId === id) resetPayoutForm();
      setPayoutStatus(isArabic ? "\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u062d\u0633\u0627\u0628" : "Bank account removed");
      await payoutMethods.reload();
    } catch {
      setPayoutStatus(isArabic ? "\u062a\u0639\u0630\u0631 \u062d\u0630\u0641 \u0627\u0644\u062d\u0633\u0627\u0628" : "Unable to remove account");
    }
  }
  const getTabLabel = (tab: SettingsTab) => {
    if (tab === "skills") {
      return isArabic ? "\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062a" : "Skills";
    }

    if (tab === "host") {
      return isArabic ? "\u0627\u0644\u0641\u0631\u064a\u0642" : "Team";
    }

    if (tab === "social") {
      return isArabic ? "\u062d\u0633\u0627\u0628\u0627\u062a \u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639\u064a" : "Social Media Accounts";
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
    companyId: isArabic ? "\u0631\u0645\u0632 \u0634\u0631\u0643\u0629 \u0627\u0644\u0645\u0633\u0648\u0642" : "Marketer Company ID",
    license: isArabic ? "\u0647\u0644 \u062a\u0645\u0644\u0643 \u0631\u062e\u0635\u0629 \u062a\u0633\u0648\u064a\u0642" : content.en.profile.license,
    licenseNone: isArabic ? "\u0644\u0627 \u0623\u0645\u0644\u0643 \u0631\u062e\u0635\u0629" : "No license",
    licenseVerified: isArabic ? "\u0645\u0648\u062b\u0642" : content.en.profile.licenseVerified,
    licenseEcommerce: isArabic ? "\u0631\u062e\u0635\u0629 \u062a\u0633\u0648\u064a\u0642 \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a" : content.en.profile.licenseEcommerce,
    licenseFal: isArabic ? "\u0631\u062e\u0635\u0629 \u0641\u0627\u0644" : content.en.profile.licenseFal
  };
  const licenseStatus = String(profile.data?.license_status ?? "pending");
  const licenseStatusLabels: Record<string, string> = {
    pending: isArabic ? "\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629" : "Pending review",
    verified: isArabic ? "\u0645\u0648\u062b\u0642\u0629" : "Verified",
    rejected: isArabic ? "\u0645\u0631\u0641\u0648\u0636\u0629" : "Rejected"
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
    hostName: isArabic ? "\u0627\u0633\u0645 \u0627\u0644\u0645\u062f\u064a\u0631" : "Manager Name",
    hostPhone: isArabic ? "\u0631\u0642\u0645 \u0627\u0644\u0645\u062f\u064a\u0631" : "Manager Number",
    members: isArabic ? "\u0623\u0639\u0636\u0627\u0621 \u0627\u0644\u0641\u0631\u064a\u0642" : "Team Members",
    name: isArabic ? "\u0627\u0644\u0627\u0633\u0645" : "Name",
    phone: isArabic ? "\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644" : "Mobile Number",
    status: isArabic ? "\u0627\u0644\u062d\u0627\u0644\u0629" : "Status",
    active: isArabic ? "\u0646\u0634\u0637" : "Active",
    pending: isArabic ? "\u0645\u0639\u0644\u0642" : "Pending",
    save: isArabic ? "\u0625\u0636\u0627\u0641\u0629 \u0639\u0636\u0648" : "Add Member"
  };
  const teamMembers = (team.data ?? []).map((member) => {
    const status = String(member.status ?? "active");
    const labels: Record<string, {ar: string; en: string}> = {
      active: {ar: "\u0646\u0634\u0637", en: "Active"},
      pending: {ar: "\u0642\u064a\u062f \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631", en: "Pending"},
      inactive: {ar: "\u063a\u064a\u0631 \u0646\u0634\u0637", en: "Inactive"}
    };
    return {
      name: String(member.name ?? "—"),
      phone: String(member.phone ?? "—"),
      status: labels[status]?.[isArabic ? "ar" : "en"] ?? status,
      statusClass: status
    };
  });
  const managerName = String(profile.data?.manager_name ?? "").trim();
  const managerPhone = String(profile.data?.manager_phone ?? "").trim();

  async function saveSkills() {
    setSkillsStatus(isArabic ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638..." : "Saving...");
    try {
      await updateProfileBackend(skillsDraft);
      setSkillsStatus(isArabic ? "\u062a\u0645 \u0627\u0644\u062d\u0641\u0638" : "Saved");
      await profile.reload();
    } catch {
      setSkillsStatus(isArabic ? "\u062a\u0639\u0630\u0631 \u0627\u0644\u062d\u0641\u0638" : "Save failed");
    }
  }

  async function handleSkillProofUpload(files: FileList | null) {
    if (!files?.length) return;
    setSkillsStatus(isArabic ? "\u062c\u0627\u0631\u064a \u0631\u0641\u0639 \u0627\u0644\u0635\u0648\u0631..." : "Uploading images...");
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("files", file));
      const response = await fetch("/api/v1/profile/skill-proofs", {method: "POST", body: formData});
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "UPLOAD_FAILED");
      setSkillsStatus(isArabic ? "\u062a\u0645 \u0631\u0641\u0639 \u0627\u0644\u0635\u0648\u0631" : "Images uploaded");
      setSkillProofs(mapSkillProofUrls(parseSkillProofUrls(body.data?.skills_proof_files)));
    } catch {
      setSkillsStatus(isArabic ? "\u062a\u0639\u0630\u0631 \u0631\u0641\u0639 \u0627\u0644\u0635\u0648\u0631" : "Image upload failed");
    }
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
                  <input onChange={(event) => setProfileDraft((current) => ({...current, name: event.target.value}))} value={profileDraft.name} />
                </label>
                <label>
                  <span>{profileFields.email}</span>
                  <input readOnly value={String(profile.data?.email ?? "")} type="email" />
                </label>
                <label>
                  <span>{profileFields.phone}</span>
                  <input onChange={(event) => setProfileDraft((current) => ({...current, phone: event.target.value}))} value={profileDraft.phone} type="tel" />
                </label>
                <label>
                  <span>{profileFields.city}</span>
                  <input onChange={(event) => setProfileDraft((current) => ({...current, city: event.target.value}))} value={profileDraft.city} />
                </label>
                <label>
                  <span>{profileFields.district}</span>
                  <input onChange={(event) => setProfileDraft((current) => ({...current, district: event.target.value}))} value={profileDraft.district} />
                </label>
                <label>
                  <span>{profileFields.joinedAt}</span>
                  <input disabled readOnly value={String(profile.data?.joined_at ?? "").slice(0, 10)} />
                </label>
                <label>
                  <span>{profileFields.referralCode}</span>
                  <input onChange={(event) => setProfileDraft((current) => ({...current, referral_code: event.target.value}))} value={profileDraft.referral_code} pattern="[A-Za-z0-9-]+" placeholder="btz-1942" />
                </label>
                <label>
                  <span>{profileFields.companyId}</span>
                  <input
                    inputMode="numeric"
                    min="1"
                    onChange={(event) => setProfileDraft((current) => ({...current, company_id: event.target.value.replace(/\D/g, "")}))}
                    placeholder="1001"
                    type="text"
                    value={profileDraft.company_id}
                  />
                </label>
                <div className={`settings-license-row ${profileDraft.license_type === "none" ? "no-license" : ""}`}>
                  <label>
                    <span>{profileFields.license}</span>
                    <DashboardSelect
                      ariaLabel={profileFields.license}
                      onValueChange={(value) => setProfileDraft((current) => ({...current, license_type: value}))}
                      options={[
                        {label: profileFields.licenseNone, value: "none"},
                        {label: profileFields.licenseVerified, value: "verified"},
                        {label: profileFields.licenseEcommerce, value: "e_marketing"},
                        {label: profileFields.licenseFal, value: "fal"}
                      ]}
                      value={profileDraft.license_type}
                    />
                  </label>
                  {profileDraft.license_type !== "none" ? (
                    <div className="settings-license-status-field">
                      <span>{isArabic ? "\u062d\u0627\u0644\u0629 \u0627\u0644\u0631\u062e\u0635\u0629" : "License Status"}</span>
                      <span className={`settings-license-status ${licenseStatus}`}>
                        <i aria-hidden="true" />
                        {licenseStatusLabels[licenseStatus] ?? licenseStatus}
                      </span>
                    </div>
                  ) : null}
                </div>
                {profileDraft.license_type !== "none" ? (
                  <div className="settings-license-upload-wrap">
                    <label className="settings-license-upload">
                      <input
                        accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx"
                        onChange={(event) => void uploadLicenseFile(event.target.files?.[0])}
                        type="file"
                      />
                      <strong>{isArabic ? "\u0625\u0636\u0627\u0641\u0629 \u0635\u0648\u0631\u0629 \u0623\u0648 \u0645\u0644\u0641 \u0627\u0644\u0631\u062e\u0635\u0629" : "Add license image or document"}</strong>
                      <span>{isArabic ? "PDF \u0623\u0648 Word \u0623\u0648 \u0635\u0648\u0631\u0629 - \u062d\u062a\u0649 10 MB" : "Image, PDF, or Word file - up to 10 MB"}</span>
                    </label>
                    {profile.data?.license_file_url ? (
                      <a className="settings-license-file-link" href={String(profile.data.license_file_url)} rel="noreferrer" target="_blank">
                        {isArabic ? "\u0639\u0631\u0636 \u0645\u0644\u0641 \u0627\u0644\u0631\u062e\u0635\u0629" : "View license file"}
                      </a>
                    ) : null}
                    {licenseUploadStatus ? <small>{licenseUploadStatus}</small> : null}
                  </div>
                ) : null}
              </fieldset>
              <fieldset>
                <legend>{copy.profile.link}</legend>
                <label>
                  <span>{copy.profile.slug}</span>
                  <input onChange={(event) => setProfileDraft((current) => ({...current, landing_slug: event.target.value}))} value={profileDraft.landing_slug} />
                </label>
                <label>
                  <span>{copy.profile.url}</span>
                  <div className="copy-link-control">
                    <input readOnly value={`https://middar.com/p/${profileDraft.landing_slug || "profile"}`} />
                    <button type="button">{copy.profile.copy}</button>
                  </div>
                </label>
              </fieldset>
            </div>
            <button className="settings-save-button" onClick={() => void saveProfile()} type="button">{copy.profile.save}</button>
            {profileStatus ? <small>{profileStatus}</small> : null}
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
                  <textarea
                    onChange={(event) => setSkillsDraft((current) => ({...current, skills_experience: event.target.value}))}
                    placeholder={skillsCopy.experiencePlaceholder}
                    value={skillsDraft.skills_experience}
                  />
                </label>
                <label>
                  <span>{skillsCopy.courses}</span>
                  <textarea
                    onChange={(event) => setSkillsDraft((current) => ({...current, skills_courses: event.target.value}))}
                    placeholder={skillsCopy.coursesPlaceholder}
                    value={skillsDraft.skills_courses}
                  />
                </label>
              </div>
              <label className="settings-proof-upload">
                <span>{skillsCopy.evidence}</span>
                <input
                  accept="image/png,image/jpeg"
                  multiple
                  onChange={(event) => void handleSkillProofUpload(event.target.files)}
                  type="file"
                />
                <strong aria-hidden="true">{"\u2197"}</strong>
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
            <button className="settings-save-button" onClick={() => void saveSkills()} type="button">{skillsCopy.save}</button>
            {skillsStatus ? <small>{skillsStatus}</small> : null}
          </>
        ) : null}

        {activeTab === "host" ? (
          <>
            <div className="settings-section-head">
              <h3>{hostCopy.title}</h3>
            </div>
            <div className="settings-host-page">
              <section className="settings-parent-node">
                <div className="settings-hierarchy-node-head">
                  <span className="settings-hierarchy-icon parent" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM5 21v-2.2A5.8 5.8 0 0 1 10.8 13h2.4a5.8 5.8 0 0 1 5.8 5.8V21" /><path d="M4 7h3M17 7h3" /></svg>
                  </span>
                  <div>
                    <strong>{isArabic ? "\u0627\u0644\u0645\u062f\u064a\u0631 \u0627\u0644\u0645\u0628\u0627\u0634\u0631" : "Direct manager"}</strong>
                  </div>
                  <span className="settings-hierarchy-level">{isArabic ? "\u0627\u0644\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0623\u0639\u0644\u0649" : "Top level"}</span>
                </div>
                <div className="settings-host-grid">
                  <label>
                    <span>{hostCopy.hostName}</span>
                    <div className="settings-host-readonly-value">
                      {managerName || (isArabic ? "\u063a\u064a\u0631 \u0645\u0631\u062a\u0628\u0637" : "Not linked")}
                    </div>
                  </label>
                  <label>
                    <span>{hostCopy.hostPhone}</span>
                    <div className="settings-host-readonly-value" dir="ltr">
                      {managerPhone || "\u2014"}
                    </div>
                  </label>
                </div>
              </section>

              <div className="settings-hierarchy-connector" aria-hidden="true">
                <i />
              </div>

              <div className="settings-current-user-node">
                <span className="settings-hierarchy-icon current" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></svg>
                </span>
                <div>
                  <small>{isArabic ? "\u062d\u0633\u0627\u0628\u0643 \u0627\u0644\u062d\u0627\u0644\u064a" : "Your current account"}</small>
                  <strong>{String(profile.data?.name ?? (isArabic ? "\u0627\u0644\u0645\u0633\u062a\u062e\u062f \u0627\u0644\u062d\u0627\u0644\u064a" : "Current user"))}</strong>
                </div>
                <span className="settings-hierarchy-level">{isArabic ? "\u062d\u0633\u0627\u0628\u0643" : "You"}</span>
              </div>

              <div className="settings-hierarchy-connector children" aria-hidden="true"><i /></div>

              <section className="settings-children-node">
                <div className="settings-children-head">
                  <div>
                    <span className="settings-hierarchy-icon children" aria-hidden="true">
                      <svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M2.5 20a5.5 5.5 0 0 1 11 0M13 20a4.5 4.5 0 0 1 9 0" /></svg>
                    </span>
                    <div><small>{isArabic ? "\u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a \u0627\u0644\u0641\u0631\u0639\u064a\u0629" : "Child accounts"}</small><h4>{hostCopy.members}</h4></div>
                  </div>
                  <span>{teamMembers.length}</span>
                </div>
                <div className="settings-team-table">
                  <div className="settings-team-row settings-team-head">
                    <span>{hostCopy.name}</span>
                    <span>{hostCopy.phone}</span>
                    <span>{hostCopy.status}</span>
                  </div>
                  {teamMembers.map((member) => (
                    <div className="settings-team-row settings-child-row" key={member.phone}>
                      <strong>{member.name}</strong>
                      <span dir="ltr">{member.phone}</span>
                      <span className={`badge ${member.statusClass}`}>{member.status}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <button className="settings-save-button" onClick={() => { setTeamMemberStatus(""); setShowTeamMemberModal(true); }} type="button">{hostCopy.save}</button>
            {showTeamMemberModal ? (
              <div
                className="team-member-modal-overlay"
                onMouseDown={(event) => { if (event.target === event.currentTarget) setShowTeamMemberModal(false); }}
                role="presentation"
              >
                <section aria-labelledby="team-member-modal-title" aria-modal="true" className="team-member-modal" role="dialog">
                  <div className="team-member-modal-head">
                    <div>
                      <span>{isArabic ? "\u0639\u0636\u0648 \u0641\u0631\u0639\u064a \u062c\u062f\u064a\u062f" : "New child account"}</span>
                      <h3 id="team-member-modal-title">{isArabic ? "\u0625\u0636\u0627\u0641\u0629 \u0639\u0636\u0648 \u062c\u062f\u064a\u062f \u0644\u0644\u0641\u0631\u064a\u0642" : "Add a New Team Member"}</h3>
                    </div>
            <button aria-label={isArabic ? "\u0625\u063a\u0644\u0627\u0642" : "Close"} onClick={() => setShowTeamMemberModal(false)} type="button">X</button>
                  </div>
                  <div className="team-member-modal-fields">
                    <label>
                      <span>{isArabic ? "\u0627\u0633\u0645 \u0627\u0644\u0639\u0636\u0648" : "Member Name"} <b className="required-mark" aria-hidden="true">*</b></span>
                      <input autoFocus onChange={(event) => setNewTeamMember((current) => ({...current, name: event.target.value}))} placeholder={isArabic ? "\u0627\u0643\u062a\u0628 \u0627\u0633\u0645 \u0627\u0644\u0639\u0636\u0648..." : "Enter the member name..."} required type="text" value={newTeamMember.name} />
                    </label>
                    <label>
                      <span>{isArabic ? "\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644" : "Mobile Number"} <b className="required-mark" aria-hidden="true">*</b></span>
                      <input dir="ltr" onChange={(event) => setNewTeamMember((current) => ({...current, phone: event.target.value}))} placeholder="+966 5x xxx xxxx" required type="tel" value={newTeamMember.phone} />
                    </label>
                  </div>
                  {teamMemberStatus ? <p className="team-member-modal-status" role="status">{teamMemberStatus}</p> : null}
                  <div className="team-member-modal-actions">
                    <button className="primary" onClick={() => void addTeamMember()} type="button">{isArabic ? "\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0625\u0636\u0627\u0641\u0629" : "Confirm"}</button>
                    <button className="secondary" onClick={() => setShowTeamMemberModal(false)} type="button">{isArabic ? "\u0625\u0644\u063a\u0627\u0621" : "Cancel"}</button>
                  </div>
                </section>
              </div>
            ) : null}
          </>
        ) : null}

        {activeTab === "social" ? (
          <>
            <div className="settings-section-head">
              <h3>{isArabic ? "\u062d\u0633\u0627\u0628\u0627\u062a \u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639\u064a" : "Social Media Accounts"}</h3>
              <p>{isArabic ? "\u0627\u0643\u062a\u0628 \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0623\u0648 \u0627\u0644\u0635\u0642 \u0631\u0627\u0628\u0637 \u0627\u0644\u062d\u0633\u0627\u0628 \u0627\u0644\u0643\u0627\u0645\u0644." : "Enter a username or paste the full profile link for each platform."}</p>
            </div>
            <div className="settings-form-grid settings-social-page">
              <fieldset className="settings-social-fields">
                <legend>{isArabic ? "\u062d\u0633\u0627\u0628\u0627\u062a\u0643" : "Your accounts"}</legend>
                {[
                  {key: "tiktok", label: isArabic ? "\u062a\u064a\u0643 \u062a\u0648\u0643" : "TikTok", placeholder: "@username or https://tiktok.com/@username"},
                  {key: "snapchat", label: isArabic ? "\u0633\u0646\u0627\u0628 \u0634\u0627\u062a" : "Snapchat", placeholder: "@username or https://snapchat.com/add/username"},
                  {key: "x", label: isArabic ? "\u062a\u0648\u064a\u062a\u0631" : "X / Twitter", placeholder: "@username or https://x.com/username"},
                  {key: "facebook", label: isArabic ? "\u0641\u064a\u0633 \u0628\u0648\u0643" : "Facebook", placeholder: "@username or https://facebook.com/username"},
                  {key: "instagram", label: isArabic ? "\u0625\u0646\u0633\u062a\u063a\u0631\u0627\u0645" : "Instagram", placeholder: "@username or https://instagram.com/username"},
                  {key: "linkedin", label: isArabic ? "\u0644\u064a\u0646\u0643\u062f\u0625\u0646" : "LinkedIn", placeholder: "@username or https://linkedin.com/in/username"}
                ].map((field) => (
                  <label className="settings-social-account-field" key={field.key}>
                    <span>{field.label}</span>
                    <div className="settings-social-input">
                      <SocialFieldIcon name={field.key as "tiktok" | "snapchat" | "x" | "facebook" | "instagram" | "linkedin"} />
                      <input
                        autoComplete="off"
                        dir="ltr"
                        onChange={(event) => setSocialDraft((current) => ({...current, [field.key]: event.target.value}))}
                        placeholder={field.placeholder}
                        spellCheck={false}
                        value={socialDraft[field.key] ?? ""}
                      />
                    </div>
                  </label>
                ))}
              </fieldset>
            </div>
            <div className="settings-social-save-row">
              <button className="settings-save-button" onClick={() => void saveSocialAccounts()} type="button">{isArabic ? "\u062d\u0641\u0638 \u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a" : "Save Accounts"}</button>
              {socialStatus ? <small>{socialStatus}</small> : null}
            </div>
          </>
        ) : null}

        {activeTab === "payout" ? (
          <>
            <div className="settings-section-head">
              <h3>{isArabic ? "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a \u0627\u0644\u0628\u0646\u0643\u064a\u0629" : "Manage Bank Accounts"}</h3>
              <p>{isArabic ? "\u0623\u0636\u0641 \u0648\u0639\u062f\u0644 \u0623\u0643\u062b\u0631 \u0645\u0646 \u062d\u0633\u0627\u0628 \u0628\u0646\u0643\u064a \u0648\u062d\u062f\u062f \u0627\u0644\u062d\u0633\u0627\u0628 \u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a \u0644\u0644\u062f\u0641\u0639\u0627\u062a." : "Add and edit multiple bank accounts, then choose the default account for payouts."}</p>
            </div>
            <div className="settings-bank-manager-head">
              <div>
                <strong>{isArabic ? "\u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a \u0627\u0644\u0645\u062d\u0641\u0648\u0638\u0629" : "Saved accounts"}</strong>
                <span>{isArabic ? `${(payoutMethods.data ?? []).length} \u062d\u0633\u0627\u0628` : `${(payoutMethods.data ?? []).length} account${(payoutMethods.data ?? []).length === 1 ? "" : "s"}`}</span>
              </div>
              {!showPayoutForm && (payoutMethods.data ?? []).length > 0 ? (
                <button className="settings-add-bank-button" onClick={addAnotherPayoutMethod} type="button">
                  <span aria-hidden="true">+</span>
                  {isArabic ? "\u0625\u0636\u0627\u0641\u0629 \u062d\u0633\u0627\u0628 \u0628\u0646\u0643\u064a" : "Add Bank Account"}
                </button>
              ) : null}
            </div>
            {(payoutMethods.data ?? []).length > 0 ? (
              <div className="settings-bank-account-list">
                {(payoutMethods.data ?? []).map((method) => (
                  <article className={`settings-bank-account-card ${Number(method.is_default) === 1 ? "default" : ""}`} key={method.id}>
                    <div className="settings-bank-account-info">
                      <strong>{method.bank_name}</strong>
                      <span>{method.account_holder_name}</span>
                      <code dir="ltr">{method.iban}</code>
                    </div>
                    <div className="settings-bank-account-meta">
                      {Number(method.is_default) === 1 ? <b>{isArabic ? "\u0627\u0644\u062d\u0633\u0627\u0628 \u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a" : "Default account"}</b> : null}
                      <span>{Number(method.minimum_payout_amount).toLocaleString(NUMBER_LOCALE)} {method.currency}</span>
                    </div>
                    <div className="settings-bank-account-actions">
                      <button onClick={() => editPayoutMethod(method)} type="button">{isArabic ? "\u062a\u0639\u062f\u064a\u0644" : "Edit"}</button>
                      <button className="danger" onClick={() => void removePayoutMethod(method.id)} type="button">{isArabic ? "\u062d\u0630\u0641" : "Remove"}</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
            {showPayoutForm || (payoutMethods.data ?? []).length === 0 ? (
              <>
            <div className="settings-form-grid settings-payout-form">
              <fieldset>
                <legend>{editingPayoutId ? (isArabic ? "\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u062d\u0633\u0627\u0628 \u0627\u0644\u0628\u0646\u0643\u064a" : "Edit bank account") : (isArabic ? "\u0625\u0636\u0627\u0641\u0629 \u062d\u0633\u0627\u0628 \u0628\u0646\u0643\u064a" : "Add bank account")}</legend>
                <div className="settings-payout-input-grid">
                  <label><span>{copy.payout.bankName}</span><input onChange={(event) => setPayoutDraft((current) => ({...current, bank_name: event.target.value}))} value={payoutDraft.bank_name} /></label>
                  <label><span>{copy.payout.holder}</span><input onChange={(event) => setPayoutDraft((current) => ({...current, account_holder_name: event.target.value}))} value={payoutDraft.account_holder_name} /></label>
                  <label><span>{copy.payout.iban}</span><input dir="ltr" onChange={(event) => setPayoutDraft((current) => ({...current, iban: event.target.value.toUpperCase()}))} placeholder="SA00 0000 0000 0000 0000 0000" value={payoutDraft.iban} /></label>
                  <label><span>{copy.payout.threshold}</span><input inputMode="decimal" min="0" onChange={(event) => setPayoutDraft((current) => ({...current, minimum_payout_amount: event.target.value}))} type="number" value={payoutDraft.minimum_payout_amount} /></label>
                  <label>
                    <span>{isArabic ? "\u0627\u0644\u0639\u0645\u0644\u0629" : "Currency"}</span>
                    <DashboardSelect ariaLabel={isArabic ? "\u0627\u0644\u0639\u0645\u0644\u0629" : "Currency"} onValueChange={(value) => setPayoutDraft((current) => ({...current, currency: value}))} options={[{label: "SAR", value: "SAR"}, {label: "USD", value: "USD"}, {label: "AED", value: "AED"}]} value={payoutDraft.currency} />
                  </label>
                  <label className="settings-default-bank-toggle">
                    <input checked={payoutDraft.is_default} onChange={(event) => setPayoutDraft((current) => ({...current, is_default: event.target.checked}))} type="checkbox" />
                    <span>{isArabic ? "\u062c\u0639\u0644\u0647 \u0627\u0644\u062d\u0633\u0627\u0628 \u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a" : "Make this the default account"}</span>
                  </label>
                </div>
              </fieldset>
            </div>
            <div className="settings-payout-actions">
              <button className="settings-save-button" onClick={() => void savePayoutMethod()} type="button">{isArabic ? "\u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a" : "Save Changes"}</button>
              {editingPayoutId ? <button className="settings-cancel-button" onClick={resetPayoutForm} type="button">{isArabic ? "\u0625\u0644\u063a\u0627\u0621" : "Cancel"}</button> : null}
              {payoutStatus ? <small>{payoutStatus}</small> : null}
            </div>
              </>
            ) : null}
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
                <Toggle
                  checked={Boolean(notificationDraft.email_new_lead)}
                  label={copy.notifications.lead}
                  onChange={(checked) => setNotificationDraft((draft) => ({...draft, email_new_lead: checked ? 1 : 0}))}
                />
                <Toggle
                  checked={Boolean(notificationDraft.email_quote_opened)}
                  label={copy.notifications.quote}
                  onChange={(checked) => setNotificationDraft((draft) => ({...draft, email_quote_opened: checked ? 1 : 0}))}
                />
                <Toggle
                  checked={Boolean(notificationDraft.email_commission_approved)}
                  label={copy.notifications.commission}
                  onChange={(checked) => setNotificationDraft((draft) => ({...draft, email_commission_approved: checked ? 1 : 0}))}
                />
              </fieldset>
              <fieldset>
                <legend>{copy.notifications.system}</legend>
                <Toggle
                  checked={Boolean(notificationDraft.payout_status_updates)}
                  label={copy.notifications.payout}
                  onChange={(checked) => setNotificationDraft((draft) => ({...draft, payout_status_updates: checked ? 1 : 0}))}
                />
              </fieldset>
            </div>
            {notificationStatus ? <p className="settings-status-message" role="status">{notificationStatus}</p> : null}
            <button className="settings-save-button" onClick={() => void saveNotificationSettings()} type="button">{copy.notifications.save}</button>
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
                  <input
                    autoComplete="current-password"
                    onChange={(event) => setPasswordDraft((draft) => ({...draft, current: event.target.value}))}
                    type="password"
                    value={passwordDraft.current}
                  />
                </label>
                <label>
                  <span>{copy.security.next}</span>
                  <input
                    autoComplete="new-password"
                    minLength={6}
                    onChange={(event) => setPasswordDraft((draft) => ({...draft, next: event.target.value}))}
                    type="password"
                    value={passwordDraft.next}
                  />
                </label>
                <label>
                  <span>{copy.security.confirm}</span>
                  <input
                    autoComplete="new-password"
                    minLength={6}
                    onChange={(event) => setPasswordDraft((draft) => ({...draft, confirm: event.target.value}))}
                    type="password"
                    value={passwordDraft.confirm}
                  />
                </label>
              </fieldset>
              <fieldset>
                <legend>{copy.security.language}</legend>
                <DashboardSelect
                  ariaLabel={copy.security.language}
                  onValueChange={setPreferredLocale}
                  options={[
                    {label: isArabic ? "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" : "Arabic", value: "ar"},
                    {label: "English", value: "en"}
                  ]}
                  value={preferredLocale}
                />
              </fieldset>
            </div>
            {securityStatus ? <p className="settings-status-message" role="status">{securityStatus}</p> : null}
            <button className="settings-save-button" onClick={() => void saveSecurityPreferences()} type="button">{copy.security.save}</button>
          </>
        ) : null}
      </article>
    </section>
  );
}
