"use client";

import {useLocale} from "next-intl";

export type DashboardHeaderSection = "overview" | "leads" | "quotes" | "sales" | "accounts" | "activation";

type HeaderContent = {
  badge: string;
  label: string;
  subtitle: string;
  title: string;
};

const headerContent: Record<DashboardHeaderSection, {ar: HeaderContent; en: HeaderContent}> = {
  overview: {
    ar: {
      label: "لوحة المؤشرات",
      title: "نظرة عامة على أداء المنصة والعمليات",
      subtitle: "تتبع أداء العمولات، إحصائيات المبيعات، ونمو الشبكة التسويقية بشكل لحظي.",
      badge: "Analytics Hub"
    },
    en: {
      label: "Analytics dashboard",
      title: "Platform performance and operations overview",
      subtitle: "Monitor commissions, sales statistics, and marketing-network growth in real time.",
      badge: "Analytics Hub"
    }
  },
  leads: {
    ar: {
      label: "إدارة العملاء",
      title: "إدارة العملاء المؤهلين والنشطين في واجهة واحدة",
      subtitle: "سجلات CRM مرتبطة بمصدر المسوق وتتبع حالات المتابعة تلقائياً.",
      badge: "CRM Hub"
    },
    en: {
      label: "Customer management",
      title: "Manage qualified and active customers in one interface",
      subtitle: "CRM records connected to affiliate sources with automatic follow-up tracking.",
      badge: "CRM Hub"
    }
  },
  quotes: {
    ar: {
      label: "المعاملات المالية",
      title: "إصدار وتتبع عروض الأسعار والمقترحات المخصصة",
      subtitle: "مراجعة العروض المرسلة للعملاء من قبل المسوقين ونسب إغلاق الصفقات.",
      badge: "Quotes Panel"
    },
    en: {
      label: "Financial transactions",
      title: "Create and track quotations and custom proposals",
      subtitle: "Review affiliate quotations sent to customers and monitor deal close rates.",
      badge: "Quotes Panel"
    }
  },
  sales: {
    ar: {
      label: "حركه المبيعات",
      title: "مراجعة كشف المبيعات، عمولات وحركه المدفوعات",
      subtitle: "سجل مالي متكامل لتتبع المبيعات والمدفوعات المعتمدة.",
      badge: "Ledger Hub"
    },
    en: {
      label: "Sales activity",
      title: "Review sales, commissions, and payment activity",
      subtitle: "A complete financial record for tracking sales and approved payments.",
      badge: "Ledger Hub"
    }
  },
  accounts: {
    ar: {
      label: "حركة العمولات",
      title: "مراجعة كشف العمولات وحركات الصرف",
      subtitle: "سجل مالي متكامل لتتبع الرصيد المتاح، المبالغ قيد الاعتماد، والمدفوعات الشهرية.",
      badge: "Ledger Hub"
    },
    en: {
      label: "Earnings activity",
      title: "Review commissions, earnings, and payout activity",
      subtitle: "A complete financial record for available balances, pending amounts, and monthly payouts.",
      badge: "Ledger Hub"
    }
  },
  activation: {
    ar: {
      label: "تهيئة النسخه",
      title: "تفعيل وإعداد نسخة العميل",
      subtitle: "إدارة تراخيص الأنظمة المشغلة للقطاعات ومراقبة كفاءة التكوين الأساسي.",
      badge: "Core System"
    },
    en: {
      label: "Platform setup",
      title: "Activate and configure Middar smart-sector systems",
      subtitle: "Manage system licenses across sectors and monitor core configuration efficiency.",
      badge: "Core System"
    }
  }
};

export default function DashboardHeaderBanner({section}: {section: DashboardHeaderSection}) {
  const locale = useLocale();
  const content = headerContent[section][locale === "ar" ? "ar" : "en"];
  const isLedger = section === "sales" || section === "accounts";

  return (
    <header className={`dashboard-header-banner bg-white border border-slate-100 shadow-sm rounded-2xl p-6 mb-6 w-full flex justify-between ${
      isLedger ? "dashboard-header-banner-ledger flex-col md:flex-row items-start md:items-center gap-4 text-right" : "items-center"
    }`}>
      <div className={`dashboard-header-banner-copy flex flex-col text-right ${isLedger ? "gap-0" : "gap-1"}`}>
        <span className={`dashboard-header-banner-label text-[#00b4d8] text-xs mb-1 ${isLedger ? "font-bold" : "font-semibold"}`}>
          {content.label}
        </span>
        <h1 className={`dashboard-header-banner-title text-[#0f2942] text-xl font-bold md:text-2xl ${isLedger ? "mb-2" : ""}`}>
          {content.title}
        </h1>
        <p className={`dashboard-header-banner-subtitle text-sm ${isLedger ? "text-slate-400" : "text-slate-500"}`}>{content.subtitle}</p>
      </div>
      <span className={`dashboard-header-banner-chip text-[#00b4d8] border px-4 rounded-full text-xs ${
        isLedger
          ? "dashboard-header-banner-ledger-chip bg-[#00b4d8]/5 border-[#00b4d8]/10 py-2 font-semibold"
          : "bg-cyan-50/60 border-cyan-100/50 py-1.5 font-medium"
      }`}>
        {content.badge}
      </span>
    </header>
  );
}
