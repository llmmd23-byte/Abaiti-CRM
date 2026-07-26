"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { signOutAction } from "@/app/auth-actions";
import Image from "next/image";
import DashboardSelect from "@/components/DashboardSelect";
import PdfPreviewFrame from "@/components/PdfPreviewFrame";
import { notifyMarketingAssetsChanged } from "@/lib/marketing-assets-sync";

type MetricKey = "users" | "clients" | "demos" | "quotes" | "sales";
type DashboardPeriod = "all" | "day" | "week" | "month" | "year";
type DashboardSubFilter = "days" | "weeks" | "months" | "quarters";
type Summary = {
  totals: Record<MetricKey, number> & {
    openTickets: number;
    openQuotes: number;
    uncreatedSalesCommissions: number;
    invisibleCommissions: number;
    unpaidCommissions: number;
  };
  series: Record<MetricKey, Array<{ date: string; value: number }>>;
};
type AdminSection =
  | "dashboard"
  | "tickets"
  | "accounts"
  | "products"
  | "booths"
  | "tags"
  | "activity"
  | "content"
  | "permissions";
type AdminRow = Record<string, unknown> & { id: number };
type CurrentAccount = {
  name?: string;
  email?: string;
  role?: string;
};
type PermissionRecord = {
  subject_type: "role" | "user";
  subject_id: string;
  role_id: number | null;
  permission_key: string;
  can_view: number;
  can_create: number;
  can_edit: number;
  can_delete: number;
  can_approve: number;
  can_reports: number;
  can_dashboard: number;
  data_scope: "own" | "team" | "company" | "all";
};
type AdminPermissionData = {
  permissionKeys: string[];
  permissions: PermissionRecord[];
  permissionKeysByRoleType?: {
    admin: string[];
    user: string[];
  };
  roles: Array<{
    id: number;
    slug: string;
    name_ar: string;
    name_en: string;
    role_type?: "admin" | "user";
    is_system?: number;
  }>;
  users: AdminRow[];
  latestUpdatedAt?: string | null;
};
type LandingBrochure = {
  id?: number;
  isDefault?: boolean;
  isActive?: boolean;
  name?: string;
  size?: number;
  updatedAt?: string | null;
  url?: string;
  externalUrl?: string;
};
type ManagementData = {
  users: AdminRow[];
  userStats: AdminRow[];
  roles: Array<{
    id: number;
    slug: string;
    name_ar: string;
    name_en: string;
    role_type?: "admin" | "user";
  }>;
  tickets: AdminRow[];
  ticketTypes: AdminRow[];
  products: AdminRow[];
  content: AdminRow[];
  industries: AdminRow[];
  clients: AdminRow[];
  demos: AdminRow[];
  quotes: AdminRow[];
  sales: AdminRow[];
  commissions: AdminRow[];
  ticketEvents: AdminRow[];
  tagStats: AdminRow[];
};

const EMPTY_MANAGEMENT_DATA: ManagementData = {
  users: [],
  userStats: [],
  roles: [],
  tickets: [],
  ticketTypes: [],
  products: [],
  content: [],
  industries: [],
  clients: [],
  demos: [],
  quotes: [],
  sales: [],
  commissions: [],
  ticketEvents: [],
  tagStats: [],
};

const NUMBER_LOCALE = "en-US";
const ARABIC_DATE_LOCALE = "ar-SA-u-ca-gregory-nu-latn";

const metricLabels: Record<MetricKey, { ar: string; en: string }> = {
  users: { ar: "ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†", en: "Users" },
  clients: { ar: "ط§ظ„ط¹ظ…ظ„ط§ط،", en: "Clients" },
  demos: { ar: "ط§ظ„ظ†ط³ط® ط§ظ„طھط¬ط±ظٹط¨ظٹط©", en: "Demos" },
  quotes: { ar: "ط¹ط±ظˆط¶ ط§ظ„ط£ط³ط¹ط§ط±", en: "Quotes" },
  sales: { ar: "ط§ظ„ظ…ط¨ظٹط¹ط§طھ", en: "Sales" },
};

const navItems = [
  [{ ar: "\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645", en: "Dashboard" }, "dashboard"],
  [{ ar: "\u062a\u0630\u0627\u0643\u0631 \u0627\u0644\u062e\u062f\u0645\u0629", en: "Service Tickets" }, "tickets"],
  [{ ar: "\u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a", en: "Accounts" }, "accounts"],
  [{ ar: "\u0627\u0644\u0628\u0648\u062b\u0627\u062a", en: "Booths" }, "booths"],
  [{ ar: "\u0627\u0644\u0648\u0633\u0648\u0645", en: "Tags" }, "tags"],
  [{ ar: "\u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0627\u062a", en: "Permissions" }, "permissions"],
] as const;

const settingsNavItems = [
  [{ ar: "\u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a", en: "Products" }, "products"],
  [{ ar: "\u0627\u0644\u0623\u0646\u0634\u0637\u0629", en: "Industries" }, "activity"],
  [{ ar: "\u0627\u0644\u0645\u062d\u062a\u0648\u0649", en: "Content" }, "content"],
] as const;

const settingsSections = new Set<AdminSection>(["products", "activity", "content"]);

const adminValueLabels: Record<string, { ar: string; en: string }> = {
  active: { ar: "ظ†ط´ط·", en: "Active" },
  inactive: { ar: "ط؛ظٹط± ظ†ط´ط·", en: "Inactive" },
  pending: { ar: "ظ‚ظٹط¯ ط§ظ„ط§ظ†طھط¸ط§ط±", en: "Pending" },
  suspended: { ar: "ظ…ظˆظ‚ظˆظپ", en: "Suspended" },
  admin: { ar: "ظ…ط´ط±ظپ", en: "Admin" },
  affiliate: { ar: "ظ…ط³ظˆظ‚", en: "Affiliate" },
  sales: { ar: "ظ…ط¨ظٹط¹ط§طھ", en: "Sales" },
  support: { ar: "ط¯ط¹ظ…", en: "Support" },
  new: { ar: "\u062c\u062f\u064a\u062f", en: "New" },
  interested: { ar: "ظ…ظ‡طھظ…", en: "Interested" },
  proposal: { ar: "ط¹ط±ط¶ ظ…ظ‚ط¯ظ…", en: "Proposal" },
  won: { ar: "ظ…ظƒطھط³ط¨", en: "Won" },
  lost: { ar: "ظ…ظپظ‚ظˆط¯", en: "Lost" },
  contacted: { ar: "طھظ… ط§ظ„طھظˆط§طµظ„", en: "Contacted" },
  scheduled: { ar: "ظ…ط¬ط¯ظˆظ„", en: "Scheduled" },
  completed: { ar: "ظ…ظƒطھظ…ظ„", en: "Completed" },
  cancelled: { ar: "ظ…ظ„ط؛ظٹ", en: "Cancelled" },
  draft: { ar: "ظ…ط³ظˆط¯ط©", en: "Draft" },
  sent: { ar: "ظ…ط±ط³ظ„", en: "Sent" },
  accepted: { ar: "ظ…ظ‚ط¨ظˆظ„", en: "Accepted" },
  paid: { ar: "ظ…ط¯ظپظˆط¹", en: "Paid" },
  expired: { ar: "ظ…ظ†طھظ‡ظٹ", en: "Expired" },
  approved: { ar: "ظ…ط¹طھظ…ط¯", en: "Approved" },
  refunded: { ar: "ظ…ط³طھط±ط¯", en: "Refunded" },
  open: { ar: "ظ…ظپطھظˆط­", en: "Open" },
  in_progress: { ar: "ظ‚ظٹط¯ ط§ظ„طھظ†ظپظٹط°", en: "In Progress" },
  closed: { ar: "ظ…ط؛ظ„ظ‚", en: "Closed" },
  resolved: { ar: "طھظ… ط§ظ„ط­ظ„", en: "Resolved" },
  rejected: { ar: "ظ…ط±ظپظˆط¶", en: "Rejected" },
};

function displayAdminValue(value: unknown, isArabic: boolean) {
  const key = String(value ?? "");
  return adminValueLabels[key]?.[isArabic ? "ar" : "en"] ?? (key || "â€”");
}

function externalUrl(value: unknown) {
  const url = String(value ?? "").trim();
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function isLikelyWebsiteUrl(value: unknown) {
  const url = String(value ?? "").trim();
  if (!url) return false;
  if (/\s/.test(url)) return false;
  if (/[\u0600-\u06FF]/.test(url)) return false;
  return /^https?:\/\//i.test(url) || /^[^\s@]+\.[^\s@]{2,}(?:\/[^\s]*)?$/i.test(url);
}

function isPlaceUrl(value: unknown) {
  const url = String(value ?? "").trim();
  return /google\.[^/]+\/maps|maps\.app\.goo\.gl|place_id:/i.test(url);
}

function customerWebsiteUrl(value: unknown) {
  const website = String(value ?? "").trim();
  return website && !isPlaceUrl(website) && isLikelyWebsiteUrl(website)
    ? externalUrl(website)
    : "";
}

function formatAdminDateTime(value: unknown, isArabic: boolean) {
  const raw = String(value ?? "").trim();
  if (!raw) return "â€”";
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const date = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}Z`);
  if (Number.isNaN(date.getTime())) return "â€”";
  return new Intl.DateTimeFormat(isArabic ? ARABIC_DATE_LOCALE : NUMBER_LOCALE, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function commissionLevelForSalesCount(count: unknown) {
  const salesCount = Number(count ?? 0);
  if (salesCount >= 90) return "ظ…ط­طھط±ظپ ظ…ط§ط³ظٹ";
  if (salesCount >= 70) return "ظ…ط­طھط±ظپ ط°ظ‡ط¨ظٹ";
  if (salesCount >= 50) return "ظ…ط­طھط±ظپ ظپط¶ظٹ";
  if (salesCount >= 30) return "ظ…ط­طھط±ظپ";
  if (salesCount >= 20) return "ظ…ظ†ط¬ط²";
  if (salesCount >= 10) return "ظ†ط´ظٹط·";
  return "ظ…ط¨طھط¯ط¦";
}

function isWithinPeriod(row: AdminRow, period: DashboardPeriod) {
  if (period === "all") return true;
  const rawDate = String(row.created_at ?? "");
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "week") start.setDate(start.getDate() - 6);
  if (period === "month") start.setDate(1);
  if (period === "year") start.setMonth(0, 1);
  return date >= start;
}

function chartDateLabel(
  value: string,
  period: DashboardPeriod,
  subFilter: DashboardSubFilter,
  isArabic: boolean,
) {
  if (period === "day") return `${value}:00`;
  if (value.startsWith("week-")) {
    const weekNumber = value.replace("week-", "");
    return isArabic ? `ط§ظ„ط£ط³ط¨ظˆط¹ ${weekNumber}` : `Week ${weekNumber}`;
  }
  if (value.includes("-Q")) {
    const quarter = value.split("-Q")[1] ?? "";
    return isArabic ? `ط§ظ„ط±ط¨ط¹ ${quarter}` : `Q${quarter}`;
  }
  if (period === "all" || period === "year")
    return new Date(`${value}-01T12:00:00`).toLocaleDateString(
      isArabic ? ARABIC_DATE_LOCALE : NUMBER_LOCALE,
      { month: "short" },
    );
  return new Date(`${value}T12:00:00`).toLocaleDateString(
    isArabic ? ARABIC_DATE_LOCALE : NUMBER_LOCALE,
    { weekday: "short" },
  );
}

function formatAdminPeriodLabel(
  date: Date,
  period: DashboardPeriod,
  isArabic: boolean,
) {
  const locale = isArabic ? ARABIC_DATE_LOCALE : "en-US";
  if (period === "year") return String(date.getFullYear());
  if (period === "month") {
    return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
  }
  const start = new Date(date);
  if (period === "week") start.setDate(start.getDate() - 6);
  return `${start.toLocaleDateString(locale, { day: "2-digit", month: "short" })} - ${date.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" })}`;
}

function AdminIcon({ name }: { name: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {name === "dashboard" ? (
        <>
          <rect x="4" y="4" width="6" height="6" rx="1.5" />
          <rect x="14" y="4" width="6" height="6" rx="1.5" />
          <rect x="4" y="14" width="6" height="6" rx="1.5" />
          <rect x="14" y="14" width="6" height="6" rx="1.5" />
        </>
      ) : name === "tickets" ? (
        <>
          <path d="M5 4h14v16H5z" />
          <path d="M8 9h8M8 13h6" />
        </>
      ) : name === "accounts" ? (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2M17 8h4M19 6v4" />
        </>
      ) : name === "products" ? (
        <>
          <path d="m4 8 8-4 8 4-8 4-8-4Z" />
          <path d="M4 8v8l8 4 8-4V8M12 12v8" />
        </>
      ) : name === "booths" ? (
        <>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M8 5v14M16 5v14M4 12h16" />
          <path d="M8 8h8M8 16h8" />
        </>
      ) : name === "tags" ? (
        <>
          <path d="M5 5h6l8 8-6 6-8-8V5Z" />
          <circle cx="8.5" cy="8.5" r="1.3" />
          <path d="M14 6h3l3 3v3" />
        </>
      ) : name === "activity" ? (
        <>
          <path d="M4 19h16M6 15l4-4 3 3 5-7" />
          <path d="M16 7h2v2" />
        </>
      ) : name === "permissions" ? (
        <>
          <path d="M12 3 5 6v5c0 4.2 2.8 8 7 10 4.2-2 7-5.8 7-10V6l-7-3Z" />
          <path d="m9 12 2 2 4-5" />
        </>
      ) : name === "settings" ? (
        <>
          <path d="M4 7h16" />
          <path d="M4 17h16" />
          <circle cx="9" cy="7" r="2" />
          <circle cx="15" cy="17" r="2" />
        </>
      ) : (
        <>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M8 9h8M8 13h5" />
        </>
      )}
    </svg>
  );
}

export default function AdminDashboard({
  initialSection = "dashboard",
  currentAccount,
}: {
  initialSection?: AdminSection;
  currentAccount?: CurrentAccount;
} = {}) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const language = isArabic ? "ar" : "en";
  const pathname = usePathname() || "/admin";
  const currentAccountName =
    currentAccount?.name?.trim() || currentAccount?.email?.trim() || "";
  const currentAccountEmail =
    currentAccount?.email?.trim() &&
    currentAccount.email.trim() !== currentAccountName
      ? currentAccount.email.trim()
      : "";
  const [summary, setSummary] = useState<Summary | null>(null);
  const [activeMetric, setActiveMetric] = useState<MetricKey>("users");
  const [analyticsUserFilter, setAnalyticsUserFilter] = useState("all");
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const [subFilter, setSubFilter] = useState<DashboardSubFilter>("weeks");
  const [periodAnchor, setPeriodAnchor] = useState(() => new Date());
  const [activeSection, setActiveSection] = useState<AdminSection>(initialSection);
  const [management, setManagement] = useState<ManagementData | null>(null);
  const [managementError, setManagementError] = useState("");

  function loadManagement() {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    setManagementError("");
    fetch("/api/v1/admin/management", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.data) {
          throw new Error(String(body.error ?? "LOAD_FAILED"));
        }
        setManagement(body.data);
      })
      .catch(() => {
        setManagement(null);
        setManagementError(
          isArabic
            ? "طھط¹ط°ط± طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ. ط£ط¹ط¯ ط§ظ„ظ…ط­ط§ظˆظ„ط© ط¨ط¹ط¯ ظ„ط­ط¸ط§طھ."
            : "Could not load data. Please try again shortly.",
        );
      })
      .finally(() => window.clearTimeout(timeoutId));
  }

  function loadSummary() {
    const params = new URLSearchParams({
      period,
      group: subFilter,
      anchor: periodAnchor.toISOString().slice(0, 10),
    });
    if (analyticsUserFilter !== "all") {
      params.set("user_id", analyticsUserFilter);
    }
    fetch(`/api/v1/admin/summary?${params.toString()}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((body) => setSummary(body.data ?? null))
      .catch(() => setSummary(null));
  }

  function refreshAdminData() {
    loadManagement();
  }

  function patchManagementRow(resource: keyof ManagementData, row: AdminRow) {
    setManagement((current) => {
      if (!current || !Array.isArray(current[resource])) return current;
      return {
        ...current,
        [resource]: (current[resource] as AdminRow[]).map((item) =>
          Number(item.id) === Number(row.id) ? { ...item, ...row } : item,
        ),
      };
    });
  }

  useEffect(() => {
    if (activeSection !== "dashboard") return;
    loadSummary();
  }, [activeSection, period, subFilter, periodAnchor, analyticsUserFilter]);

  useEffect(() => {
    loadManagement();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("section", activeSection);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [activeSection]);

  const series = summary?.series[activeMetric] ?? [];
  const maxValue = Math.max(1, ...series.map((item) => item.value));
  const periodLabel = formatAdminPeriodLabel(periodAnchor, period, isArabic);
  const analyticsUserOptions = [
    {
      value: "all",
      label: isArabic ? "ظƒظ„ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ† (ط§ظ„ظƒظ„)" : "All users",
    },
    ...(management?.users ?? []).map((user) => ({
      value: String(user.id),
      label: String(
        user.name ??
          user.full_name ??
          user.email ??
          `${isArabic ? "ظ…ط³طھط®ط¯ظ…" : "User"} #${user.id}`,
      ),
    })),
  ];
  const selectedAnalyticsUser =
    analyticsUserFilter === "all"
      ? null
      : (management?.users ?? []).find(
          (user) => String(user.id) === analyticsUserFilter,
        ) ?? null;
  const analyticsUserName = selectedAnalyticsUser
    ? String(
        selectedAnalyticsUser.name ??
          selectedAnalyticsUser.full_name ??
          selectedAnalyticsUser.email ??
          `${isArabic ? "ظ…ط³طھط®ط¯ظ…" : "User"} #${selectedAnalyticsUser.id}`,
      )
    : isArabic
      ? "ظƒظ„ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†"
      : "All users";
  const analyticsUserRole = selectedAnalyticsUser
    ? String(selectedAnalyticsUser.role_name ?? selectedAnalyticsUser.role ?? "â€”")
    : isArabic
      ? "طھظ‚ط±ظٹط± ط´ط§ظ…ظ„"
      : "Comprehensive report";
  const analyticsLastLogin = selectedAnalyticsUser
    ? selectedAnalyticsUser.last_login_at
      ? String(selectedAnalyticsUser.last_login_at).slice(0, 10)
      : "â€”"
    : isArabic
      ? "ط§ظ„ط¢ظ†"
      : "Now";
  const selectedAnalyticsStats = selectedAnalyticsUser
    ? (management?.userStats ?? []).find(
        (row) => String(row.user_id) === String(selectedAnalyticsUser.id),
      ) ?? null
    : null;
  const allAnalyticsStats = (management?.userStats ?? []).reduce(
    (totals, row) => ({
      clients:
        totals.clients + Number(row.clients_count ?? row.leads_count ?? 0),
      quotes: totals.quotes + Number(row.quotes_count ?? 0),
    }),
    { clients: 0, quotes: 0 },
  );
  const analyticsAddedCustomers = selectedAnalyticsUser
    ? Number(selectedAnalyticsStats?.clients_count ?? selectedAnalyticsStats?.leads_count ?? 0)
    : allAnalyticsStats.clients || Number(summary?.totals.clients ?? 0);
  const analyticsAddedQuotes = selectedAnalyticsUser
    ? Number(selectedAnalyticsStats?.quotes_count ?? 0)
    : allAnalyticsStats.quotes || Number(summary?.totals.quotes ?? 0);
  const subFilterOptions =
    period === "month"
      ? [
          { value: "weeks" as const, label: isArabic ? "طھظ‚ط³ظٹظ… ط¨ط§ظ„ط£ط³ط§ط¨ظٹط¹" : "By weeks" },
          { value: "days" as const, label: isArabic ? "طھظ‚ط³ظٹظ… ط¨ط§ظ„ط£ظٹط§ظ…" : "By days" },
        ]
      : period === "year"
        ? [
            { value: "months" as const, label: isArabic ? "طھظ‚ط³ظٹظ… ط¨ط§ظ„ط´ظ‡ظˆط±" : "By months" },
            { value: "quarters" as const, label: isArabic ? "ط±ط¨ط¹ ط³ظ†ظˆظٹ" : "Quarterly" },
          ]
        : [{ value: "days" as const, label: isArabic ? "ط¹ط±ط¶ ظٹظˆظ…ظٹ" : "Daily view" }];
  function changeDashboardPeriod(nextPeriod: DashboardPeriod) {
    setPeriod(nextPeriod);
    setSubFilter(
      nextPeriod === "year" ? "months" : nextPeriod === "month" ? "weeks" : "days",
    );
    setPeriodAnchor(new Date());
  }
  function navigateDashboardPeriod(direction: "prev" | "next") {
    const step = direction === "next" ? 1 : -1;
    setPeriodAnchor((current) => {
      const next = new Date(current);
      if (period === "year") next.setFullYear(next.getFullYear() + step);
      else if (period === "month") next.setMonth(next.getMonth() + step);
      else if (period === "week") next.setDate(next.getDate() + step * 7);
      else next.setDate(next.getDate() + step);
      return next;
    });
  }
  return (
    <div className="admin-shell" dir={isArabic ? "rtl" : "ltr"}>
      <aside className="admin-sidebar">
        <Link className="admin-official-brand" href="/">
          <Image
            alt="Middar"
            height={63}
            priority
            src="/middar-logo-transparent-v2.png"
            width={220}
          />
        </Link>
        <nav>
          {navItems.map(([label, icon]) => (
            <button
              className={activeSection === icon ? "active" : ""}
              key={icon}
              onClick={() => setActiveSection(icon)}
              type="button"
            >
              <span className="admin-nav-icon">
                <AdminIcon name={icon} />
              </span>
              {label[language]}
            </button>
          ))}
          <details className="admin-nav-dropdown">
            <summary
              className={settingsSections.has(activeSection) ? "active" : ""}
              onClick={() => {
                if (!settingsSections.has(activeSection)) {
                  setActiveSection("products");
                }
              }}
            >
              <span className="admin-nav-icon">
                <AdminIcon name="settings" />
              </span>
              {isArabic ? "\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a" : "Settings"}
              <span aria-hidden="true" className="admin-nav-chevron">
                v
              </span>
            </summary>
            <div className="admin-nav-dropdown-menu">
              {settingsNavItems.map(([label, icon]) => (
                <button
                  className={activeSection === icon ? "active" : ""}
                  key={icon}
                  onClick={() => setActiveSection(icon)}
                  type="button"
                >
                  <span className="admin-nav-icon">
                    <AdminIcon name={icon} />
                  </span>
                  {label[language]}
                </button>
              ))}
            </div>
          </details>
        </nav>
        <div className="admin-sidebar-footer">
          <div
            className="admin-language-switch"
            aria-label={isArabic ? "\u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0644\u063a\u0629" : "Choose language"}
          >
            <Link
              className={isArabic ? "active" : ""}
              href={`${pathname}?section=${activeSection}`}
              locale="ar"
            >
              AR
            </Link>
            <Link
              className={!isArabic ? "active" : ""}
              href={`${pathname}?section=${activeSection}`}
              locale="en"
            >
              EN
            </Link>
          </div>
          <form action={signOutAction}>
            <input name="locale" type="hidden" value={locale} />
            <button className="admin-logout-button" type="submit">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" />
                <path d="M14 16l4-4-4-4" />
                <path d="M9 12h9" />
              </svg>
              {isArabic ? "طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬" : "Sign out"}
            </button>
          </form>
        </div>
      </aside>

      <main className="admin-main" id={`admin-${activeSection}`}>
        <header className="admin-header">
          <div>
            <p>{isArabic ? "ظ„ظˆط­ط© ط§ظ„ط¥ط¯ط§ط±ط© ط§ظ„ط±ط¦ظٹط³ظٹط©" : "Master Admin Panel"}</p>
            <h1>
              {activeSection === "dashboard"
                ? isArabic
                  ? "ظ…ط±ط­ط¨ظ‹ط§ ط¨ظƒ ظپظٹ ظ…ط±ظƒط² طھط­ظƒظ… ظ…ظٹط¯ط§ط±"
                  : "Welcome to Middar Control Center"
                : navItems.find((item) => item[1] === activeSection)?.[0][
                    language
                  ]}
            </h1>
            <span>
              {activeSection === "dashboard"
                ? isArabic
                  ? "ظ…ط±ط§ظ‚ط¨ط© ط§ظ„ظ…ظ†طµط© ظˆط¥ط¯ط§ط±ط© ط§ظ„ط¹ظ…ظ„ظٹط§طھ ظ…ظ† ظ…ظƒط§ظ† ظˆط§ط­ط¯."
                  : "Monitor the platform and manage operations from one place."
                : isArabic
                  ? "ط¹ط±ط¶ ظˆط¥ط¯ط§ط±ط© ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ظ†طµط© ط¨طµظ„ط§ط­ظٹط§طھ ط§ظ„ظ…ط´ط±ظپ ط§ظ„ط±ط¦ظٹط³ظٹ."
                  : "View and manage platform data with Master Admin privileges."}
            </span>
          </div>
          <div className="admin-status-stack">
          <div className="admin-live-status">
            <i /> {isArabic ? "ط§ظ„ظ†ط¸ط§ظ… ظٹط¹ظ…ظ„ ط¨ظƒظپط§ط،ط©" : "System operational"}
          </div>
            {activeSection === "dashboard" && currentAccountName ? (
              <div className="admin-current-account">
                <span>
                  {isArabic ? "\u0627\u0644\u062d\u0633\u0627\u0628 \u0627\u0644\u062d\u0627\u0644\u064a" : "Current account"}
                </span>
                <strong>{currentAccountName}</strong>
                {currentAccountEmail ? <small>{currentAccountEmail}</small> : null}
              </div>
            ) : null}
          </div>
        </header>

        {activeSection === "dashboard" ? (
          <>
            <section className="admin-metrics">
              {(
                ["users", "clients", "demos", "quotes", "sales"] as MetricKey[]
              ).map((key) => (
                <button
                  className={activeMetric === key ? "active" : ""}
                  key={key}
                  onClick={() => setActiveMetric(key)}
                  type="button"
                >
                  <span>{metricLabels[key][language]}</span>
                  <strong>
                    {summary?.totals[key]?.toLocaleString(NUMBER_LOCALE) ?? "â€”"}
                  </strong>
                </button>
              ))}
            </section>

            <section className="admin-chart-card">
              <div className="admin-chart-head">
                <div>
                  <span>
                    {isArabic ? "طھط­ظ„ظٹظ„ط§طھ ط§ظ„ظ…ظ†طµط©" : "Platform Analytics"}
                  </span>
                  <h2>
                    {isArabic ? "ظ†ظ…ظˆ" : "Growth"}{" "}
                    {metricLabels[activeMetric][language]}
                  </h2>
                </div>
                <div className="admin-period-controls">
                  <div className="admin-analytics-user-filter">
                    <DashboardSelect
                      ariaLabel={
                        isArabic
                          ? "ط§ط®طھظٹط§ط± ط§ظ„ظ…ط³طھط®ط¯ظ… ظ„طھط­ظ„ظٹظ„ط§طھ ط§ظ„ظ…ظ†طµط©"
                          : "Select user for platform analytics"
                      }
                      onValueChange={setAnalyticsUserFilter}
                      options={analyticsUserOptions}
                      searchable
                      searchPlaceholder={
                        isArabic ? "ط§ط¨ط­ط« ط¹ظ† ظ…ط³طھط®ط¯ظ…..." : "Search users..."
                      }
                      value={analyticsUserFilter}
                    />
                  </div>
                  <div className="admin-period-segment" aria-label={isArabic ? "ط§ظ„ظپطھط±ط© ط§ظ„ط±ط¦ظٹط³ظٹط©" : "Main period"}>
                    {(["week", "month", "year"] as DashboardPeriod[]).map((item) => (
                      <button
                        className={period === item ? "active" : ""}
                        key={item}
                        onClick={() => changeDashboardPeriod(item)}
                        type="button"
                      >
                        {item === "week"
                          ? isArabic
                            ? "ط£ط³ط¨ظˆط¹"
                            : "Week"
                          : item === "month"
                            ? isArabic
                              ? "ط´ظ‡ط±"
                              : "Month"
                            : isArabic
                              ? "ط³ظ†ط©"
                              : "Year"}
                      </button>
                    ))}
                  </div>
                  <div className="admin-period-navigator">
                    <button
                      aria-label={isArabic ? "ط§ظ„ظپطھط±ط© ط§ظ„ط³ط§ط¨ظ‚ط©" : "Previous period"}
                      onClick={() => navigateDashboardPeriod("prev")}
                      type="button"
                    >
                      {isArabic ? "â€؛" : "â€¹"}
                    </button>
                    <strong>{periodLabel}</strong>
                    <button
                      aria-label={isArabic ? "ط§ظ„ظپطھط±ط© ط§ظ„طھط§ظ„ظٹط©" : "Next period"}
                      onClick={() => navigateDashboardPeriod("next")}
                      type="button"
                    >
                      {isArabic ? "â€¹" : "â€؛"}
                    </button>
                  </div>
                  <div className="admin-period-subfilters">
                    {subFilterOptions.map((item) => (
                      <button
                        className={subFilter === item.value ? "active" : ""}
                        disabled={subFilterOptions.length === 1}
                        key={item.value}
                        onClick={() => setSubFilter(item.value)}
                        type="button"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="admin-chart">
                {series.map((item) => (
                  <div className="admin-chart-column" key={item.date}>
                    <div className="admin-chart-track">
                      <i
                        style={{
                          height: `${Math.max(8, (item.value / maxValue) * 100)}%`,
                        }}
                      >
                        <b>{item.value}</b>
                      </i>
                    </div>
                    <span>{chartDateLabel(item.date, period, subFilter, isArabic)}</span>
                  </div>
                ))}
              </div>
              <div className="admin-analytics-user-card">
                <div className="admin-analytics-user-summary">
                  <div className="admin-analytics-user-avatar" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M20 21a8 8 0 0 0-16 0" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <h3>
                      {isArabic
                        ? `ط£ط¯ط§ط،: ${analyticsUserName}`
                        : `Performance: ${analyticsUserName}`}
                    </h3>
                    <span>{analyticsUserRole}</span>
                  </div>
                </div>
                <div className="admin-analytics-user-metrics">
                  <div>
                    <span>{isArabic ? "ط§ظ„ط¹ظ…ظ„ط§ط، ط§ظ„ظ…ط¶ط§ظپظˆظ†" : "Added customers"}</span>
                    <strong>
                      {analyticsAddedCustomers.toLocaleString(NUMBER_LOCALE)}
                    </strong>
                  </div>
                  <div>
                    <span>{isArabic ? "ط§ظ„ط¹ط±ظˆط¶" : "Quotes"}</span>
                    <strong>
                      {analyticsAddedQuotes.toLocaleString(NUMBER_LOCALE)}
                    </strong>
                  </div>
                  <div>
                    <span>{isArabic ? "ط¢ط®ط± طھط³ط¬ظٹظ„ ط¯ط®ظˆظ„" : "Last login"}</span>
                    <strong>{analyticsLastLogin}</strong>
                  </div>
                </div>
              </div>
            </section>

            <AdminMetricList
              metric={activeMetric}
              data={management}
              isArabic={isArabic}
              onReload={() => {
                loadManagement();
                loadSummary();
              }}
            />

            <section className="admin-bottom-grid">
              <article id="admin-tickets">
                <span>{isArabic ? "ط§ظ„طھط°ط§ظƒط± ط§ظ„ظ…ظپطھظˆط­ط©" : "Open Tickets"}</span>
                <strong>{summary?.totals.openTickets ?? "â€”"}</strong>
                <p>
                  {isArabic
                    ? "ط·ظ„ط¨ط§طھ ط¯ط¹ظ… طھط­طھط§ط¬ ط¥ظ„ظ‰ ط§ظ„ظ…طھط§ط¨ط¹ط©"
                    : "Support requests needing attention"}
                </p>
              </article>
              <article id="admin-open-quotes">
                <span>
                  {isArabic ? "ط¹ط±ظˆط¶ ط§ظ„ط£ط³ط¹ط§ط± ط§ظ„ظ…ظپطھظˆط­ط©" : "Open Quotes"}
                </span>
                <strong>{summary?.totals.openQuotes ?? "â€”"}</strong>
                <p>
                  {isArabic
                    ? "ط¹ط±ظˆط¶ ط£ط³ط¹ط§ط± ظ„ظ… طھظڈط؛ظ„ظ‚ ط¨ط¹ط¯"
                    : "Quotes that have not been closed"}
                </p>
              </article>
              <article id="admin-uncreated-sales-commissions">
                <span>
                  {isArabic
                    ? "ط¹ظ…ظˆظ„ط§طھ ظ…ط¨ظٹط¹ط§طھ ط؛ظٹط± ظ…ظ†ط´ط£ط©"
                    : "Sales without commissions"}
                </span>
                <strong>
                  {summary?.totals.uncreatedSalesCommissions ?? "â€”"}
                </strong>
                <p>
                  {isArabic
                    ? "ظپظˆط§طھظٹط± ظ…ط¨ظٹط¹ط§طھ طھط­طھ ط§ظ„ط¥ط¬ط±ط§ط،"
                    : "Sales invoices in progress"}
                </p>
              </article>
              <article id="admin-invisible-commissions">
                <span>
                  {isArabic ? "ط¹ظ…ظˆظ„ط§طھ ط؛ظٹط± ظ…ط¹طھظ…ط¯ط©" : "Unapproved Commissions"}
                </span>
                <strong>{summary?.totals.invisibleCommissions ?? "â€”"}</strong>
                <p>
                  {isArabic
                    ? "ط¹ظ…ظˆظ„ط§طھ ظ„ظ… طھظڈط¹طھظ…ط¯ ط¨ط¹ط¯"
                    : "Commissions awaiting approval"}
                </p>
              </article>
              <article id="admin-unpaid-commissions">
                <span>
                  {isArabic ? "ط¹ظ…ظˆظ„ط§طھ ط؛ظٹط± ظ…ط¯ظپظˆط¹ط©" : "Unpaid Commissions"}
                </span>
                <strong>{summary?.totals.unpaidCommissions ?? "â€”"}</strong>
                <p>
                  {isArabic
                    ? "ط¹ظ…ظˆظ„ط§طھ ظ„ظ… ظٹظƒطھظ…ظ„ ط³ط¯ط§ط¯ظ‡ط§"
                    : "Commissions awaiting payment"}
                </p>
              </article>
            </section>
          </>
        ) : (
          <AdminManagementSection
            onReload={refreshAdminData}
            onRowUpdated={patchManagementRow}
            section={activeSection}
            data={management}
            error={managementError}
            isArabic={isArabic}
          />
        )}
      </main>
    </div>
  );
}

function AdminMetricList({
  metric,
  data,
  isArabic,
  onReload,
}: {
  metric: MetricKey;
  data: ManagementData | null;
  isArabic: boolean;
  onReload: () => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientUserFilter, setClientUserFilter] = useState("all");
  const [clientTagTypeFilter, setClientTagTypeFilter] = useState("all");
  const [clientTagFilter, setClientTagFilter] = useState("all");
  const [editingRow, setEditingRow] = useState<AdminRow | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, string>>({});
  const [editMessage, setEditMessage] = useState("");
  const [passwordRow, setPasswordRow] = useState<AdminRow | null>(null);
  const [passwordDraft, setPasswordDraft] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([]);
  const [transferTargetUserId, setTransferTargetUserId] = useState("");
  const [transferMessage, setTransferMessage] = useState("");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [createUserDraft, setCreateUserDraft] = useState({
    name: "",
    email: "",
    role: "sales",
    status: "active",
    password: "",
  });
  const [createUserMessage, setCreateUserMessage] = useState("");
  useEffect(() => {
    setSearch("");
    setStatusFilter("all");
    setClientUserFilter("all");
    setClientTagTypeFilter("all");
    setClientTagFilter("all");
    setEditingRow(null);
    setEditMessage("");
    setPasswordRow(null);
    setPasswordDraft("");
    setPasswordMessage("");
    setSelectedClientIds([]);
    setTransferTargetUserId("");
    setTransferMessage("");
    setIsCreateUserOpen(false);
    setCreateUserMessage("");
  }, [metric]);
  const metricData = data ?? EMPTY_MANAGEMENT_DATA;

  const openTicketTypeEditor = (_ticketType?: AdminRow) => {};

  const configs: Record<
    MetricKey,
    { rows: AdminRow[]; columns: Array<[string, string]> }
  > = {
    users: {
      rows: metricData.users,
      columns: [
        ["name", isArabic ? "ط§ظ„ط§ط³ظ…" : "Name"],
        ["email", isArabic ? "ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ" : "Email"],
        ["role", isArabic ? "ط§ظ„طµظ„ط§ط­ظٹط©" : "Role"],
        ["status", isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"],
        ["is_active", isArabic ? "ط­ط§ظ„ط© طھظپط¹ظٹظ„ ط§ظ„ط­ط³ط§ط¨" : "Account Active"],
        ["created_at", isArabic ? "طھط§ط±ظٹط® ط§ظ„ط¥ظ†ط´ط§ط،" : "Created Date"],
      ],
    },
    clients: {
      rows: metricData.clients,
      columns: [
        ["company_name", isArabic ? "\u0627\u0633\u0645 \u0627\u0644\u0634\u0631\u0643\u0629" : "Company Name"],
        ["name", isArabic ? "\u0627\u0644\u0627\u0633\u0645" : "Name"],
        ["stage", isArabic ? "\u0627\u0644\u062d\u0627\u0644\u0629" : "Status"],
        [
          isArabic ? "industry_name" : "industry_name_en",
          isArabic ? "\u0627\u0644\u0646\u0634\u0627\u0637" : "Activity",
        ],
        ["phone", isArabic ? "\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644" : "Mobile"],
        ["tag_names", isArabic ? "\u0627\u0644\u0648\u0633\u0648\u0645" : "Tags"],
        ["affiliate_user_name", isArabic ? "\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645" : "User"],
      ],
    },
    demos: {
      rows: metricData.demos,
      columns: [
        ["contact_name", isArabic ? "ط§ظ„ط¹ظ…ظٹظ„" : "Client"],
        ["company_name", isArabic ? "ط§ظ„ط´ط±ظƒط©" : "Company"],
        ["phone", isArabic ? "ط±ظ‚ظ… ط§ظ„ط¬ظˆط§ظ„" : "Mobile"],
        ["affiliate_user_name", isArabic ? "ط§ظ„ظ…ط³طھط®ط¯ظ…" : "User"],
        ["status", isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"],
        ["created_at", isArabic ? "طھط§ط±ظٹط® ط§ظ„ط¥ظ†ط´ط§ط،" : "Created Date"],
      ],
    },
    quotes: {
      rows: metricData.quotes,
      columns: [
        ["quote_number", isArabic ? "ط±ظ‚ظ… ط§ظ„ط¹ط±ط¶" : "Quote Number"],
        ["customer_name", isArabic ? "ط§ظ„ط¹ظ…ظٹظ„" : "Client"],
        ["product_name", isArabic ? "ط§ظ„ظ…ظ†طھط¬" : "Product"],
        ["amount", isArabic ? "ط§ظ„ظ‚ظٹظ…ط©" : "Amount"],
        ["valid_until", isArabic ? "طھط§ط±ظٹط® ط§ظ„ط§ظ†طھظ‡ط§ط،" : "Expiry Date"],
        ["affiliate_user_name", isArabic ? "ط§ظ„ظ…ط³طھط®ط¯ظ…" : "User"],
        ["status", isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"],
      ],
    },
    sales: {
      rows: metricData.sales,
      columns: [
        ["id", isArabic ? "ط±ظ‚ظ… ط§ظ„ط¹ظ…ظ„ظٹط©" : "Sale ID"],
        ["customer_name", isArabic ? "ط§ظ„ط¹ظ…ظٹظ„" : "Client"],
        ["product_name", isArabic ? "ط§ظ„ظ…ظ†طھط¬" : "Product"],
        ["sale_amount", isArabic ? "ط§ظ„ظ‚ظٹظ…ط©" : "Amount"],
        ["affiliate_user_name", isArabic ? "ط§ظ„ظ…ط³طھط®ط¯ظ…" : "User"],
        ["status", isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"],
      ],
    },
  };
  const config = configs[metric];
  const statusOptions: Record<
    MetricKey | "content",
    Array<{ value: string; label: string }>
  > = {
    users: [
      { value: "active", label: isArabic ? "ظ†ط´ط·" : "Active" },
      { value: "pending", label: isArabic ? "ظ‚ظٹط¯ ط§ظ„ط§ظ†طھط¸ط§ط±" : "Pending" },
      { value: "inactive", label: isArabic ? "ط؛ظٹط± ظ†ط´ط·" : "Inactive" },
      { value: "suspended", label: isArabic ? "ظ…ظˆظ‚ظˆظپ" : "Suspended" },
    ],
    clients: [
                  { value: "new", label: isArabic ? "\u062c\u062f\u064a\u062f" : "New" },
      { value: "interested", label: isArabic ? "ظ…ظ‡طھظ…" : "Interested" },
      { value: "proposal", label: isArabic ? "ط¹ط±ط¶ ظ…ظ‚ط¯ظ…" : "Proposal" },
      { value: "won", label: isArabic ? "ظ…ظƒطھط³ط¨" : "Won" },
      { value: "lost", label: isArabic ? "ظ…ظپظ‚ظˆط¯" : "Lost" },
    ],
    demos: [
                    { value: "new", label: isArabic ? "\u062c\u062f\u064a\u062f" : "New" },
      { value: "contacted", label: isArabic ? "طھظ… ط§ظ„طھظˆط§طµظ„" : "Contacted" },
      { value: "scheduled", label: isArabic ? "ظ…ط¬ط¯ظˆظ„" : "Scheduled" },
      { value: "completed", label: isArabic ? "ظ…ظƒطھظ…ظ„" : "Completed" },
      { value: "cancelled", label: isArabic ? "ظ…ظ„ط؛ظٹ" : "Cancelled" },
    ],
    quotes: [
      { value: "draft", label: isArabic ? "ظ…ط³ظˆط¯ط©" : "Draft" },
      { value: "sent", label: isArabic ? "ظ…ط±ط³ظ„" : "Sent" },
      { value: "accepted", label: isArabic ? "ظ…ظ‚ط¨ظˆظ„" : "Accepted" },
      { value: "paid", label: isArabic ? "ظ…ط¯ظپظˆط¹" : "Paid" },
      { value: "expired", label: isArabic ? "ظ…ظ†طھظ‡ظٹ" : "Expired" },
      { value: "cancelled", label: isArabic ? "ظ…ظ„ط؛ظٹ" : "Cancelled" },
    ],
    sales: [
      { value: "pending", label: isArabic ? "ظ‚ظٹط¯ ط§ظ„ط§ظ†طھط¸ط§ط±" : "Pending" },
      { value: "approved", label: isArabic ? "ظ…ط¹طھظ…ط¯" : "Approved" },
      { value: "paid", label: isArabic ? "ظ…ط¯ظپظˆط¹" : "Paid" },
      { value: "cancelled", label: isArabic ? "ظ…ظ„ط؛ظٹ" : "Cancelled" },
      { value: "refunded", label: isArabic ? "ظ…ط³طھط±ط¯" : "Refunded" },
    ],
    content: [
      { value: "active", label: isArabic ? "ظ†ط´ط·" : "Active" },
      { value: "inactive", label: isArabic ? "ط؛ظٹط± ظ†ط´ط·" : "Inactive" },
    ],
  };
  const userRoleOptions = useMemo(() => {
    const options = metricData.roles
      .filter((role) => String(role.slug ?? "").trim())
      .map((role) => ({
        value: String(role.slug),
        label: String(isArabic ? (role.name_ar ?? role.name_en) : (role.name_en ?? role.name_ar)),
      }));
    return options.length
      ? options
      : [{ value: "affiliate", label: isArabic ? "ظ…ط³ظˆظ‚" : "Affiliate" }];
  }, [isArabic, metricData.roles]);
  const defaultCreateUserRole =
    userRoleOptions.find((option) => option.value.toLowerCase() === "sales")
      ?.value ??
    userRoleOptions[0]?.value ??
    "affiliate";
  const userTextFields = [
    ["name", isArabic ? "ط§ظ„ط§ط³ظ…" : "Name", "text"],
    ["email", isArabic ? "ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ" : "Email", "email"],
    ["phone", isArabic ? "ط±ظ‚ظ… ط§ظ„ط¬ظˆط§ظ„" : "Mobile", "tel"],
    ["city", isArabic ? "ط§ظ„ظ…ط¯ظٹظ†ط©" : "City", "text"],
    ["district", isArabic ? "ط§ظ„ط­ظٹ" : "District", "text"],
    ["referral_code", isArabic ? "ط±ظ…ط² ط§ظ„ط¥ط­ط§ظ„ط©" : "Referral Code", "text"],
    ["landing_slug", isArabic ? "ط±ط§ط¨ط· ط§ظ„طµظپط­ط©" : "Landing Slug", "text"],
    ["license_file_url", isArabic ? "ط±ط§ط¨ط· ظ…ظ„ظپ ط§ظ„ط±ط®طµط©" : "License File URL", "text"],
    ["joined_at", isArabic ? "طھط§ط±ظٹط® ط§ظ„ط§ظ†ط¶ظ…ط§ظ…" : "Joined Date", "date"],
  ] as const;
  const userTextareaFields = [
    ["skills_experience", isArabic ? "ط§ظ„ط®ط¨ط±ط§طھ" : "Experience"],
    ["skills_courses", isArabic ? "ط§ظ„ط¯ظˆط±ط§طھ" : "Courses"],
  ] as const;
  const userReadonlyFields = [
    ["id", isArabic ? "ط±ظ‚ظ… ط§ظ„ظ…ط³طھط®ط¯ظ…" : "User ID"],
    ["role_type", isArabic ? "ظ†ظˆط¹ ط§ظ„ط¯ظˆط±" : "Role Type"],
    ["manager_name", isArabic ? "ط§ط³ظ… ط§ظ„ظ…ط¯ظٹط±" : "Manager Name"],
    ["is_active", isArabic ? "ظ…ظپط¹ظ„" : "Active"],
    ["created_at", isArabic ? "طھط§ط±ظٹط® ط§ظ„ط¥ظ†ط´ط§ط،" : "Created At"],
    ["updated_at", isArabic ? "طھط§ط±ظٹط® ط§ظ„طھط­ط¯ظٹط«" : "Updated At"],
    ["last_login_at", isArabic ? "ط¢ط®ط± ط¯ط®ظˆظ„" : "Last Login"],
    ["skills_proof_files", isArabic ? "ظ…ظ„ظپط§طھ ط¥ط«ط¨ط§طھ ط§ظ„ظ…ظ‡ط§ط±ط§طھ" : "Skill Proof Files"],
  ] as const;
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const hasUserFilter = ["clients", "demos", "quotes", "sales"].includes(
    metric,
  );
  const userFilterValueForRow = (row: AdminRow) => {
    const userId = Number(row.affiliate_user_id ?? row.user_id);
    if (Number.isInteger(userId) && userId > 0) return `id:${userId}`;
    const userName = String(row.affiliate_user_name ?? row.user_name ?? "").trim();
    return userName ? `name:${userName}` : "";
  };
  const userFilterOptions =
    hasUserFilter
      ? Array.from(
          new Map(
            config.rows
              .map((row) => {
                const value = userFilterValueForRow(row);
                const label = String(
                  row.affiliate_user_name ?? row.user_name ?? "",
                ).trim();
                return value && label ? [value, { value, label }] : null;
              })
              .filter(
                (
                  option,
                ): option is [string, { value: string; label: string }] =>
                  Boolean(option),
              ),
          ).values(),
        )
      : [];
  const parseIdList = (value: unknown) =>
    String(value ?? "")
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isInteger(item) && item > 0);
  const tagTypeFilterOptions = Array.from(
    new Map(
      (metricData.tagStats ?? [])
        .filter((row) => row.tag_type_id)
        .map((row) => [
          String(row.tag_type_id),
          {
            value: String(row.tag_type_id),
            label: String(row.type_name ?? row.tag_type_id),
          },
        ]),
    ).values(),
  );
  const tagFilterOptions = Array.from(
    new Map(
      (metricData.tagStats ?? [])
        .filter((row) => row.tag_id)
        .filter(
          (row) =>
            clientTagTypeFilter !== "all" &&
            String(row.tag_type_id) === clientTagTypeFilter,
        )
        .map((row) => [
          String(row.tag_id),
          {
            value: String(row.tag_id),
            label: String(row.tag_name ?? row.tag_id),
          },
        ]),
    ).values(),
  );
  const tagSelectOptions =
    clientTagTypeFilter === "all"
      ? [
          {
            value: "__select_type_first__",
            label: isArabic ? "ط§ط®طھط± ظ†ظˆط¹ ط§ظ„ظˆط³ظ… ط£ظˆظ„ظ‹ط§" : "Select a tag type first",
            disabled: true,
          },
        ]
      : [
          {
            value: "all",
            label: isArabic ? "ظƒظ„ ظˆط³ظˆظ… ظ‡ط°ط§ ط§ظ„ظ†ظˆط¹" : "All tags in this type",
          },
          ...tagFilterOptions,
        ];
  const visibleRows = useMemo(
    () =>
      config.rows.filter((row) => {
        const matchesSearch =
          !normalizedSearch ||
          Object.values(row).some((value) =>
            String(value ?? "")
              .toLocaleLowerCase()
              .includes(normalizedSearch),
          );
        const rowStatus = String(
          metric === "clients" ? (row.stage ?? "") : (row.status ?? ""),
        );
        const matchesClientUser =
          !hasUserFilter ||
          clientUserFilter === "all" ||
          userFilterValueForRow(row) === clientUserFilter;
        const rowTagTypeIds =
          metric === "clients" ? parseIdList(row.tag_type_ids) : [];
        const rowTagIds = metric === "clients" ? parseIdList(row.tag_ids) : [];
        const matchesTagType =
          metric !== "clients" ||
          clientTagTypeFilter === "all" ||
          rowTagTypeIds.includes(Number(clientTagTypeFilter));
        const matchesTag =
          metric !== "clients" ||
          clientTagFilter === "all" ||
          rowTagIds.includes(Number(clientTagFilter));
        return (
          matchesSearch &&
          matchesClientUser &&
          matchesTagType &&
          matchesTag &&
          (statusFilter === "all" || rowStatus === statusFilter)
        );
      }),
    [
      clientTagFilter,
      clientTagTypeFilter,
      clientUserFilter,
      config.rows,
      hasUserFilter,
      metric,
      normalizedSearch,
      statusFilter,
    ],
  );
  const visibleClientIds =
    metric === "clients"
      ? visibleRows
          .map((row) => Number(row.id))
          .filter((id) => Number.isInteger(id) && id > 0)
      : [];
  const visibleClientIdSet = new Set(visibleClientIds);
  const selectedVisibleClientIds = selectedClientIds.filter((id) =>
    visibleClientIdSet.has(id),
  );
  const allVisibleClientsSelected =
    visibleClientIds.length > 0 &&
    selectedVisibleClientIds.length === visibleClientIds.length;
  const transferUserOptions = (metricData.users ?? []).map((user) => ({
    value: String(user.id),
    label: String(
      user.name ||
        user.full_name ||
        user.email ||
        `${isArabic ? "\u0645\u0633\u062a\u062e\u062f\u0645" : "User"} #${user.id}`,
    ),
  }));

  function toggleClientSelection(id: number, checked: boolean) {
    setTransferMessage("");
    setSelectedClientIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return Array.from(next);
    });
  }

  function toggleVisibleClients(checked: boolean) {
    setTransferMessage("");
    setSelectedClientIds((current) => {
      const next = new Set(current);
      visibleClientIds.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return Array.from(next);
    });
  }

  async function transferSelectedClients() {
    const leadIds = selectedVisibleClientIds;
    if (!leadIds.length || !transferTargetUserId) {
      setTransferMessage(
        isArabic
          ? "\u062d\u062f\u062f \u0639\u0645\u0644\u0627\u0621 \u0648\u0627\u062e\u062a\u0631 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0627\u0644\u062c\u062f\u064a\u062f"
          : "Select clients and choose the new user",
      );
      return;
    }
    setTransferMessage(isArabic ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0648\u064a\u0644..." : "Transferring...");
    try {
      const response = await fetch("/api/v1/admin/clients/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          lead_ids: leadIds,
          target_user_id: Number(transferTargetUserId),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(body.error ?? "TRANSFER_FAILED"));
      setSelectedClientIds([]);
      setTransferTargetUserId("");
      setTransferMessage(
        isArabic
          ? `\u062a\u0645 \u062a\u062d\u0648\u064a\u0644 ${Number(body.data?.transferred ?? leadIds.length).toLocaleString(NUMBER_LOCALE)} \u0639\u0645\u064a\u0644`
          : `${Number(body.data?.transferred ?? leadIds.length).toLocaleString(NUMBER_LOCALE)} clients transferred`,
      );
      onReload();
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      setTransferMessage(
        code === "FORBIDDEN"
          ? isArabic
            ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0635\u0644\u0627\u062d\u064a\u0629 \u0644\u062a\u062d\u0648\u064a\u0644 \u0627\u0644\u0639\u0645\u0644\u0627\u0621"
            : "You do not have permission to transfer clients"
          : code === "INVALID_TARGET_USER"
            ? isArabic
              ? "\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0627\u0644\u0645\u062d\u062f\u062f \u0644\u064a\u0633 \u0636\u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0634\u0631\u0643\u0629"
              : "The selected user is not in the same company"
            : isArabic
              ? "\u062a\u0639\u0630\u0631 \u062a\u062d\u0648\u064a\u0644 \u0627\u0644\u0639\u0645\u0644\u0627\u0621"
              : "Unable to transfer clients",
      );
    }
  }

  function openEditor(row: AdminRow) {
    setEditingRow(row);
    setEditDraft(
      metric === "users"
        ? {
            name: String(row.name ?? ""),
            email: String(row.email ?? ""),
            phone: String(row.phone ?? ""),
            role: String(row.role ?? "affiliate"),
            status: String(row.status ?? "pending"),
            preferred_locale: String(row.preferred_locale ?? "ar"),
            city: String(row.city ?? ""),
            district: String(row.district ?? ""),
            referral_code: String(row.referral_code ?? ""),
            landing_slug: String(row.landing_slug ?? ""),
            company_id: row.company_id == null ? "" : String(row.company_id),
            manager_id: row.manager_id == null ? "" : String(row.manager_id),
            level: String(row.level ?? ""),
            comission_percentage:
              row.comission_percentage == null
                ? ""
                : String(row.comission_percentage),
            license_type: String(row.license_type ?? "none"),
            license_status: String(row.license_status ?? "pending"),
            license_file_url: String(row.license_file_url ?? ""),
            skills_experience: String(row.skills_experience ?? ""),
            skills_courses: String(row.skills_courses ?? ""),
            joined_at: String(row.joined_at ?? "").slice(0, 10),
          }
        : metric === "clients"
          ? {
              name: String(row.name ?? ""),
            company_name: String(row.company_name ?? ""),
            phone: String(row.phone ?? ""),
            stage: String(row.stage ?? "new"),
          }
        : metric === "demos"
            ? {
                contact_name: String(row.contact_name ?? ""),
                company_name: String(row.company_name ?? ""),
                phone: String(row.phone ?? ""),
                status: String(row.status ?? "new"),
              }
            : metric === "quotes"
              ? {
                  status: String(row.status ?? "draft"),
                  valid_until: String(row.valid_until ?? "").slice(0, 10),
                }
              : { status: String(row.status ?? "pending") },
    );
    setEditMessage("");
  }

  async function saveEdit() {
    if (!editingRow) return;
    setEditMessage(isArabic ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸..." : "Saving...");
    try {
      const resources: Record<MetricKey, string> = {
        users: "admin/users",
        clients: "data/leads",
        demos: "data/demo-requests",
        quotes: "data/quotes",
        sales: "data/sales",
      };
      const response = await fetch(
        `/api/v1/${resources[metric]}/${editingRow.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(editDraft),
        },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "SAVE_FAILED");
      onReload();
      setEditingRow(null);
    } catch (error) {
      setEditMessage(
        error instanceof Error &&
          error.message === "CANNOT_DISABLE_CURRENT_ADMIN"
          ? isArabic
            ? "ظ„ط§ ظٹظ…ظƒظ† طھط¹ط·ظٹظ„ ط­ط³ط§ط¨ ط§ظ„ظ…ط´ط±ظپ ط§ظ„ظ…ط³طھط®ط¯ظ… ط­ط§ظ„ظٹظ‹ط§"
            : "You cannot disable the current admin account"
          : isArabic
            ? "طھط¹ط°ط± ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ"
            : "Unable to save changes",
      );
    }
  }


  async function deleteEditingUser() {
    if (!editingRow) return;
    const email = String(editingRow.email ?? "").toLowerCase();
    if (email === "admin@middar.com") {
      setEditMessage(
        isArabic
          ? "ظ„ط§ ظٹظ…ظƒظ† ط­ط°ظپ admin@middar.com ظ„ط£ظ†ظ‡ ط­ط³ط§ط¨ ط£ط³ط§ط³ظٹ."
          : "admin@middar.com cannot be deleted because it is a core account.",
      );
      return;
    }
    if (
      !window.confirm(
        isArabic
          ? "ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ط­ط³ط§ط¨ ط§ظ„ظ…ط³طھط®ط¯ظ…طں ظ„ط§ ظٹظ…ظƒظ† ط§ظ„طھط±ط§ط¬ط¹ ط¹ظ† ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،."
          : "Delete this user account? This action cannot be undone.",
      )
    ) {
      return;
    }
    setEditMessage(isArabic ? "ط¬ط§ط±ظٹ ط§ظ„ط­ط°ظپ..." : "Deleting...");
    try {
      const response = await fetch(`/api/v1/admin/users/${editingRow.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(body.error ?? "DELETE_FAILED"));
      setEditingRow(null);
      setEditMessage("");
      onReload();
    } catch (error) {
      setEditMessage(
        error instanceof Error && error.message === "DEFAULT_ADMIN_PROTECTED"
          ? isArabic
            ? "ظ„ط§ ظٹظ…ظƒظ† ط­ط°ظپ admin@middar.com ظ„ط£ظ†ظ‡ ط­ط³ط§ط¨ ط£ط³ط§ط³ظٹ."
            : "admin@middar.com cannot be deleted because it is a core account."
          : isArabic
            ? "طھط¹ط°ط± ط­ط°ظپ ط§ظ„ط­ط³ط§ط¨"
            : "Unable to delete user account",
      );
    }
  }

  function openPasswordEditor(row: AdminRow) {
    setPasswordRow(row);
    setPasswordDraft("");
    setPasswordMessage("");
  }

  async function savePassword() {
    if (!passwordRow) return;
    if (passwordDraft.length < 6) {
      setPasswordMessage(
        isArabic
          ? "ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ظٹط¬ط¨ ط£ظ† طھظƒظˆظ† 6 ط£ط­ط±ظپ ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„"
          : "Password must be at least 6 characters",
      );
      return;
    }
    setPasswordMessage(isArabic ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸..." : "Saving...");
    try {
      const response = await fetch(
        `/api/v1/admin/users/${passwordRow.id}/password`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ password: passwordDraft }),
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "SAVE_FAILED");
      setPasswordRow(null);
      setPasswordDraft("");
      setPasswordMessage("");
      onReload();
    } catch {
      setPasswordMessage(
        isArabic ? "طھط¹ط°ط± طھط¹ط¯ظٹظ„ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±" : "Unable to update password",
      );
    }
  }

  function openCreateUserModal() {
    setCreateUserDraft({
      name: "",
      email: "",
      role: defaultCreateUserRole,
      status: "active",
      password: "",
    });
    setCreateUserMessage("");
    setIsCreateUserOpen(true);
  }

  function closeCreateUserModal() {
    setIsCreateUserOpen(false);
    setCreateUserMessage("");
    setCreateUserDraft({
      name: "",
      email: "",
      role: defaultCreateUserRole,
      status: "active",
      password: "",
    });
  }

  async function createUser() {
    if (
      !createUserDraft.name.trim() ||
      !createUserDraft.email.trim() ||
      !createUserDraft.role ||
      !createUserDraft.status ||
      createUserDraft.password.length < 6
    ) {
      setCreateUserMessage(
        isArabic
          ? "ط£ظƒظ…ظ„ ط§ظ„ط­ظ‚ظˆظ„ ط§ظ„ظ…ط·ظ„ظˆط¨ط©طŒ ظˆظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± 6 ط£ط­ط±ظپ ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„"
          : "Complete the required fields. Password must be at least 6 characters.",
      );
      return;
    }
    setCreateUserMessage(isArabic ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸..." : "Saving...");
    try {
      const response = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(createUserDraft),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(body.error ?? "CREATE_FAILED"));
      closeCreateUserModal();
      onReload();
    } catch (error) {
      setCreateUserMessage(
        error instanceof Error && error.message === "EMAIL_EXISTS"
          ? isArabic
            ? "ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ ظ…ط³طھط®ط¯ظ… ظ…ط³ط¨ظ‚ظ‹ط§"
            : "Email is already in use"
          : isArabic
            ? "طھط¹ط°ط± ط¥ظ†ط´ط§ط، ط§ظ„ظ…ط³طھط®ط¯ظ…"
            : "Unable to create user",
      );
    }
  }

  return (
    <section className={`admin-metric-list${metric === "clients" ? " admin-clients-list" : ""}`}>
      <div className="admin-metric-list-head">
        <div>
          <span>{isArabic ? "ط§ظ„ظ‚ط§ط¦ظ…ط© ط§ظ„طھظپطµظٹظ„ظٹط©" : "Detailed List"}</span>
          <h2>{metricLabels[metric][isArabic ? "ar" : "en"]}</h2>
        </div>
        <div className="admin-user-list-tools">
          <div className="admin-list-search">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="10.8" cy="10.8" r="6.2" />
              <path d="m15.5 15.5 4 4" />
            </svg>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                metric === "users"
                  ? isArabic
                    ? "ط§ط¨ط­ط« ط¹ظ† ظ…ط³طھط®ط¯ظ…..."
                    : "Search users..."
                  : isArabic
                    ? "ط§ظ„ط¨ط­ط« ظپظٹ ط§ظ„ظ‚ط§ط¦ظ…ط©..."
                    : "Search list..."
              }
              type="search"
              value={search}
            />
          </div>
          {metric === "clients" ? (
            <>
              <strong>
                {visibleRows.length.toLocaleString(NUMBER_LOCALE)}
              </strong>
              <div className="admin-user-status-filter admin-client-user-filter">
                <DashboardSelect
                  ariaLabel={isArabic ? "ظپظ„طھط±ط© ط§ظ„ط¹ظ…ظ„ط§ط،" : "Filter customers"}
                  onValueChange={setStatusFilter}
                  options={[
                    {
                      value: "all",
                      label: isArabic ? "ط¬ظ…ظٹط¹ ط§ظ„ط¹ظ…ظ„ط§ط،" : "All customers",
                    },
                    ...statusOptions.clients,
                  ]}
                  value={statusFilter}
                />
              </div>
              <div className="admin-user-status-filter admin-client-user-filter">
                <DashboardSelect
                  ariaLabel={isArabic ? "ظپظ„طھط±ط© ط­ط³ط¨ ظ†ظˆط¹ ط§ظ„ظˆط³ظ…" : "Filter by tag type"}
                  onValueChange={(value) => {
                    setClientTagTypeFilter(value);
                    setClientTagFilter("all");
                  }}
                  options={[
                    {
                      value: "all",
                      label: isArabic ? "ط¬ظ…ظٹط¹ ط£ظ†ظˆط§ط¹ ط§ظ„ظˆط³ظˆظ…" : "All tag types",
                    },
                    ...tagTypeFilterOptions,
                  ]}
                  value={clientTagTypeFilter}
                />
              </div>
              <div className="admin-user-status-filter admin-client-user-filter">
                <DashboardSelect
                  ariaLabel={isArabic ? "\u0641\u0644\u062a\u0631\u0629 \u062d\u0633\u0628 \u0627\u0644\u0648\u0633\u0645" : "Filter by tag"}
                  onValueChange={setClientTagFilter}
                  options={tagSelectOptions}
                  value={clientTagFilter}
                />
              </div>
              <div className="admin-user-status-filter admin-client-user-filter admin-client-added-by-filter highlight-user-filter">
                <DashboardSelect
                  ariaLabel={isArabic ? "\u0641\u0644\u062a\u0631\u0629 \u062d\u0633\u0628 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0627\u0644\u0630\u064a \u0623\u0636\u0627\u0641 \u0627\u0644\u0639\u0645\u064a\u0644" : "Filter by added user"}
                  menuClassName="admin-client-added-by-menu"
                  onValueChange={setClientUserFilter}
                  options={[
                    {
                      value: "all",
                      label: isArabic ? "\u0623\u064f\u0636\u064a\u0641 \u0628\u0648\u0627\u0633\u0637\u0629: \u0627\u0644\u0643\u0644" : "Added by: all",
                    },
                    ...userFilterOptions.map((option) => ({
                      ...option,
                      label: isArabic
                        ? `\u0623\u064f\u0636\u064a\u0641 \u0628\u0648\u0627\u0633\u0637\u0629: ${option.label}`
                        : `Added by: ${option.label}`,
                    })),
                  ]}
                  portal
                  value={clientUserFilter}
                />
              </div>
            </>
          ) : null}
          {metric !== "clients" ? (
            <div className="admin-user-status-filter">
            <DashboardSelect
              ariaLabel={isArabic ? "ظپظ„طھط±ط© ط­ط³ط¨ ط§ظ„ط­ط§ظ„ط©" : "Filter by status"}
              onValueChange={setStatusFilter}
              options={[
                {
                  value: "all",
                  label: isArabic ? "ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ" : "All Statuses",
                },
                ...statusOptions[metric],
              ]}
              value={statusFilter}
            />
            </div>
          ) : null}
          {hasUserFilter && metric !== "clients" ? (
            <div className="admin-user-status-filter admin-client-user-filter">
              <DashboardSelect
                ariaLabel={isArabic ? "ظپظ„طھط±ط© ط­ط³ط¨ ط§ظ„ظ…ط³طھط®ط¯ظ…" : "Filter by user"}
                onValueChange={setClientUserFilter}
                options={[
                  {
                    value: "all",
                    label: isArabic ? "ظƒظ„ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†" : "All Users",
                  },
                  ...userFilterOptions,
                ]}
                value={clientUserFilter}
              />
            </div>
          ) : null}
          {false && metric === "clients" ? (
            <Fragment>
              <div className="admin-user-status-filter admin-client-user-filter">
                <DashboardSelect
                  ariaLabel={isArabic ? "ظپظ„طھط±ط© ط­ط³ط¨ ظ†ظˆط¹ ط§ظ„ظˆط³ظ…" : "Filter by tag type"}
                  onValueChange={(value) => {
                    setClientTagTypeFilter(value);
                    setClientTagFilter("all");
                  }}
                  options={[
                    {
                      value: "all",
                      label: isArabic ? "ظƒظ„ ط£ظ†ظˆط§ط¹ ط§ظ„ظˆط³ظˆظ…" : "All Tag Types",
                    },
                    ...tagTypeFilterOptions,
                  ]}
                  value={clientTagTypeFilter}
                />
              </div>
              <div className="admin-user-status-filter admin-client-user-filter">
                <DashboardSelect
                  ariaLabel={isArabic ? "ظپظ„طھط±ط© ط­ط³ط¨ ط§ظ„ظˆط³ظ…" : "Filter by tag"}
                  onValueChange={setClientTagFilter}
                  options={tagSelectOptions}
                  value={clientTagFilter}
                />
              </div>
            </Fragment>
          ) : null}
          {metric !== "clients" ? (
            <strong>
              {visibleRows.length.toLocaleString(NUMBER_LOCALE)}
            </strong>
          ) : null}
          {metric === "users" ? (
            <button
              className="admin-add-user-btn add-user-btn"
              onClick={openCreateUserModal}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M15 19a6 6 0 0 0-12 0" />
                <circle cx="9" cy="8" r="4" />
                <path d="M19 8v6" />
                <path d="M16 11h6" />
              </svg>
              <span>{isArabic ? "ط¥ط¶ط§ظپط© ظ…ط³طھط®ط¯ظ… ط¬ط¯ظٹط¯" : "Add New User"}</span>
            </button>
          ) : null}
        </div>
      </div>
      {metric === "clients" ? (
        <div className="admin-client-transfer-bar">
          <label className="admin-client-select-all">
            <input
              checked={allVisibleClientsSelected}
              disabled={!visibleClientIds.length}
              onChange={(event) => toggleVisibleClients(event.target.checked)}
              type="checkbox"
            />
            <span>
              {isArabic ? "\u062a\u062d\u062f\u064a\u062f \u0643\u0644 \u0627\u0644\u0646\u062a\u0627\u0626\u062c" : "Select visible"}
            </span>
          </label>
          <strong>
            {selectedVisibleClientIds.length.toLocaleString(NUMBER_LOCALE)}{" "}
            {isArabic ? "\u0639\u0645\u064a\u0644 \u0645\u062d\u062f\u062f" : "selected clients"}
          </strong>
          <div className="admin-client-transfer-select">
            <select
              aria-label={isArabic ? "\u0627\u062e\u062a\u0631 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0627\u0644\u062c\u062f\u064a\u062f" : "Choose new user"}
              className="admin-client-transfer-native-select"
              onChange={(event) => {
                setTransferMessage("");
                setTransferTargetUserId(event.target.value);
              }}
              value={transferTargetUserId}
            >
              <option value="">
                {isArabic ? "\u0627\u062e\u062a\u0631 \u0645\u0633\u062a\u062e\u062f\u0645" : "Choose user"}
              </option>
              {transferUserOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            className="admin-client-transfer-btn"
            onClick={() => void transferSelectedClients()}
            type="button"
          >
            {isArabic ? "\u062a\u062d\u0648\u064a\u0644 \u0627\u0644\u0639\u0645\u0644\u0627\u0621" : "Transfer Clients"}
          </button>
          {transferMessage ? (
            <span className="admin-client-transfer-message">{transferMessage}</span>
          ) : null}
        </div>
      ) : null}
      {false ? (
        <div className="admin-ticket-types-panel">
          <div className="admin-ticket-types-head">
            <div>
              <span>{isArabic ? "ط£ظ†ظˆط§ط¹ ط§ظ„طھط°ط§ظƒط±" : "Ticket Types"}</span>
              <strong>
                {(data?.ticketTypes ?? []).length.toLocaleString(NUMBER_LOCALE)}{" "}
                {isArabic ? "ظ†ظˆط¹" : "types"}
              </strong>
            </div>
            <button
              className="admin-add-product"
              onClick={() => openTicketTypeEditor()}
              type="button"
            >
              {isArabic ? "ط¥ط¶ط§ظپط© ظ†ظˆط¹ طھط°ظƒط±ط©" : "Add Ticket Type"}
            </button>
          </div>
          <div className="admin-ticket-types-list">
            {(data?.ticketTypes ?? []).map((ticketType) => (
              <article className="admin-ticket-type-item" key={ticketType.id}>
                <div>
                  <strong>
                    {isArabic
                      ? String(ticketType.name_ar ?? "â€”")
                      : String(ticketType.name_en ?? ticketType.name_ar ?? "â€”")}
                  </strong>
                  <small>{String(ticketType.description ?? "")}</small>
                </div>
                <span className={`admin-status admin-status-${String(ticketType.status ?? "active")}`}>
                  {displayAdminValue(ticketType.status, isArabic)}
                </span>
                <button
                  className="admin-row-edit"
                  onClick={() => openTicketTypeEditor(ticketType)}
                  type="button"
                >
                  {isArabic ? "طھط¹ط¯ظٹظ„" : "Edit"}
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}
      <div className={`admin-table-wrap${metric === "clients" ? " admin-clients-table-wrap" : ""}`}>
        <table className={metric === "clients" ? "admin-clients-table" : undefined}>
          <thead>
            <tr>
              {metric === "clients" ? (
                <th className="admin-client-select-column">
                  <input
                    aria-label={isArabic ? "\u062a\u062d\u062f\u064a\u062f \u0643\u0644 \u0627\u0644\u0639\u0645\u0644\u0627\u0621" : "Select all clients"}
                    checked={allVisibleClientsSelected}
                    disabled={!visibleClientIds.length}
                    onChange={(event) => toggleVisibleClients(event.target.checked)}
                    type="checkbox"
                  />
                </th>
              ) : null}
              {config.columns.map(([key, label]) => (
                <th data-field={key} key={key}>{label}</th>
              ))}
              <th>{isArabic ? "ط¥ط¬ط±ط§ط،" : "Action"}</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={`${metric}-${row.id}-${index}`}>
                {metric === "clients" ? (
                  <td className="admin-client-select-column">
                    <input
                      aria-label={isArabic ? "\u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0639\u0645\u064a\u0644" : "Select client"}
                      checked={selectedClientIds.includes(Number(row.id))}
                      onChange={(event) =>
                        toggleClientSelection(Number(row.id), event.target.checked)
                      }
                      type="checkbox"
                    />
                  </td>
                ) : null}
                {config.columns.map(([key]) => {
                  const value =
                    metric === "clients" &&
                    key === "company_name"
                      ? row.company_name ?? row.name
                      : metric === "clients" &&
                    key === "industry_name_en" &&
                    !row[key]
                      ? row.industry_name
                      : metric === "clients" &&
                          key === "requirements" &&
                          !String(row[key] ?? "").trim()
                        ? isArabic
                          ? "ظ„ط§ ظٹظˆط¬ط¯ ظ…طھط·ظ„ط¨ط§طھ"
                          : "No requirements"
                        : row[key];
                  const isStatus =
                    key === "status" || key === "stage" || key === "role";
                  const isActiveFlag = key === "is_active";
                  const isTagNames = metric === "clients" && key === "tag_names";
                  const isDate =
                    key.includes("created") ||
                    key.includes("sold_at") ||
                    key === "valid_until";
                  const isAmount = key === "amount" || key === "sale_amount";
                  const isWebsite = key === "website" || key === "place_url";
                  const isPhone = key === "phone";
                  const websiteUrl =
                    key === "website"
                      ? customerWebsiteUrl(value)
                      : key === "place_url"
                        ? externalUrl(value)
                        : "";
                  return (
                    <td data-field={key} key={key}>
                      {isStatus ? (
                        <span
                          className={`admin-status admin-status-${String(value ?? "unknown")}`}
                        >
                          {displayAdminValue(value, isArabic)}
                        </span>
                      ) : isDate ? (
                        String(value ?? "â€”").slice(0, 10)
                      ) : isActiveFlag ? (
                        <span
                          className={`admin-status admin-status-${Number(value) === 1 ? "active" : "inactive"}`}
                        >
                          {Number(value) === 1
                            ? isArabic
                              ? "ظ…ظپط¹ظ„"
                              : "Active"
                            : isArabic
                              ? "ط؛ظٹط± ظ…ظپط¹ظ„"
                              : "Inactive"}
                        </span>
                      ) : isAmount ? (
                        `${Number(value ?? 0).toLocaleString(NUMBER_LOCALE)} ${String(row.currency ?? "SAR")}`
                      ) : isTagNames ? (
                        String(value ?? "")
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean).length ? (
                          <div className="admin-client-tags-cell">
                            {String(value ?? "")
                              .split(",")
                              .map((tag) => tag.trim())
                              .filter(Boolean)
                              .map((tag) => (
                                <span key={tag}>{tag}</span>
                              ))}
                          </div>
                        ) : (
                          "â€”"
                        )
                      ) : isWebsite ? (
                        websiteUrl ? (
                          <a href={websiteUrl} rel="noreferrer" target="_blank">
                            {String(value)}
                          </a>
                        ) : (
                          ""
                        )
                      ) : isPhone ? (
                        <bdi dir="ltr">{String(value ?? "â€”")}</bdi>
                      ) : (
                        String(value ?? "â€”")
                      )}
                    </td>
                  );
                })}
                <td>
                  <div className="admin-row-action-group">
                    <button
                      className="admin-row-edit"
                      onClick={() => openEditor(row)}
                      type="button"
                    >
                      {isArabic ? "طھط¹ط¯ظٹظ„" : "Edit"}
                    </button>
                    {metric === "users" ? (
                      <button
                        className="admin-row-edit admin-password-edit"
                        onClick={() => openPasswordEditor(row)}
                        type="button"
                      >
                        {isArabic ? "طھط¹ط¯ظٹظ„ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±" : "Edit Password"}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {visibleRows.length === 0 ? (
              <tr>
                <td className="admin-empty" colSpan={config.columns.length + (metric === "clients" ? 2 : 1)}>
                  {isArabic ? "ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ظ…ط·ط§ط¨ظ‚ط©" : "No matching data"}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {isCreateUserOpen ? (
        <div
          className="admin-create-user-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCreateUserModal();
          }}
          role="presentation"
        >
          <section
            aria-modal="true"
            className="admin-create-user-modal"
            role="dialog"
          >
            <div className="admin-create-user-head modal-header">
              <h3>{isArabic ? "ط¥ط¶ط§ظپط© ظ…ط³طھط®ط¯ظ… ط¬ط¯ظٹط¯" : "Add New User"}</h3>
              <button
                aria-label={isArabic ? "ط¥ط؛ظ„ط§ظ‚" : "Close"}
                className="close-modal-btn"
                onClick={closeCreateUserModal}
                type="button"
              >
                أ—
              </button>
            </div>
            <form
              className="admin-create-user-form modal-form"
              onSubmit={(event) => {
                event.preventDefault();
                void createUser();
              }}
            >
              <label className="form-group">
                <span>{isArabic ? "ط§ظ„ط§ط³ظ… ط¨ط§ظ„ظƒط§ظ…ظ„" : "Full Name"}</span>
                <input
                  onChange={(event) =>
                    setCreateUserDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder={isArabic ? "ط£ط¯ط®ظ„ ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ…" : "Enter user name"}
                  required
                  type="text"
                  value={createUserDraft.name}
                />
              </label>
              <label className="form-group">
                <span>{isArabic ? "ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ" : "Email"}</span>
                <input
                  dir="ltr"
                  onChange={(event) =>
                    setCreateUserDraft((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="example@middar.com"
                  required
                  type="email"
                  value={createUserDraft.email}
                />
              </label>
              <div className="admin-create-user-row form-row">
                <label className="form-group">
                  <span>{isArabic ? "ط§ظ„طµظ„ط§ط­ظٹط©" : "Role"}</span>
                  <select
                    className="admin-basic-select"
                    onChange={(event) =>
                      setCreateUserDraft((current) => ({
                        ...current,
                        role: event.target.value,
                      }))
                    }
                    value={createUserDraft.role}
                  >
                    {userRoleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-group">
                  <span>{isArabic ? "ط­ط§ظ„ط© ط§ظ„ط­ط³ط§ط¨" : "Account Status"}</span>
                  <select
                    className="admin-basic-select"
                    onChange={(event) =>
                      setCreateUserDraft((current) => ({
                        ...current,
                        status: event.target.value,
                      }))
                    }
                    value={createUserDraft.status}
                  >
                    {statusOptions.users.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="form-group">
                <span>{isArabic ? "ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±" : "Password"}</span>
                <input
                  dir="ltr"
                  minLength={6}
                  onChange={(event) =>
                    setCreateUserDraft((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder="********"
                  required
                  type="password"
                  value={createUserDraft.password}
                />
              </label>
              {createUserMessage ? (
                <p className="admin-create-user-message">{createUserMessage}</p>
              ) : null}
              <div className="admin-create-user-actions modal-footer">
                <button
                  className="btn-cancel"
                  onClick={closeCreateUserModal}
                  type="button"
                >
                  {isArabic ? "ط¥ظ„ط؛ط§ط،" : "Cancel"}
                </button>
                <button className="btn-submit" type="submit">
                  {isArabic ? "ط­ظپط¸ ط§ظ„ظ…ط³طھط®ط¯ظ…" : "Save User"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
      {editingRow ? (
        <div
          className="admin-edit-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditingRow(null);
          }}
          role="presentation"
        >
          <section className="admin-edit-modal" role="dialog" aria-modal="true">
            <div className="admin-edit-head">
              <div>
                <span>{isArabic ? "طھط¹ط¯ظٹظ„ ط§ظ„ط³ط¬ظ„" : "Edit Record"}</span>
                <h3>
                  {String(
                    editingRow.name ??
                      editingRow.title ??
                      editingRow.original_name ??
                      editingRow.contact_name ??
                      editingRow.quote_number ??
                      editingRow.id,
                  )}
                </h3>
              </div>
              <button onClick={() => setEditingRow(null)} type="button">
                X
              </button>
            </div>
            {metric === "users" ? (
              <div className="admin-user-edit-grid">
                {userTextFields.map(([field, label, type]) => (
                  <label key={field}>
                    <span>{label}</span>
                    <input
                      dir={
                        field === "phone" ||
                        field === "email"
                          ? "ltr"
                          : undefined
                      }
                      onChange={(event) =>
                        setEditDraft((current) => ({
                          ...current,
                          [field]: event.target.value,
                        }))
                      }
                      type={type}
                      value={editDraft[field] ?? ""}
                    />
                  </label>
                ))}
                {userTextareaFields.map(([field, label]) => (
                  <label className="admin-user-edit-wide" key={field}>
                    <span>{label}</span>
                    <textarea
                      onChange={(event) =>
                        setEditDraft((current) => ({
                          ...current,
                          [field]: event.target.value,
                        }))
                      }
                      value={editDraft[field] ?? ""}
                    />
                  </label>
                ))}
                <label>
                  <span>{isArabic ? "ط§ظ„طµظ„ط§ط­ظٹط©" : "Role"}</span>
                  <select
                    className="admin-basic-select"
                    onChange={(event) =>
                      setEditDraft((current) => ({ ...current, role: event.target.value }))
                    }
                    value={editDraft.role ?? "affiliate"}
                  >
                    {(
                      metricData.roles?.length
                        ? metricData.roles.map((role) => ({
                            value: String(role.slug),
                            label: `${isArabic ? role.name_ar : role.name_en} - ${
                              role.role_type === "admin"
                                ? isArabic
                                  ? "ط£ط¯ظ…ظ†"
                                  : "Admin"
                                : isArabic
                                  ? "ظ…ط³طھط®ط¯ظ…"
                                  : "User"
                            }`,
                          }))
                        : [
                            { value: "admin", label: "Admin" },
                            { value: "affiliate", label: "Affiliate" },
                            { value: "sales", label: "Sales" },
                            { value: "support", label: "Support" },
                          ]
                    ).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{isArabic ? "ط§ظ„ظ„ط؛ط© ط§ظ„ظ…ظپط¶ظ„ط©" : "Preferred Language"}</span>
                  <DashboardSelect
                    ariaLabel={isArabic ? "ط§ظ„ظ„ط؛ط© ط§ظ„ظ…ظپط¶ظ„ط©" : "Preferred Language"}
                    menuClassName="admin-edit-select-menu"
                    onValueChange={(preferred_locale) =>
                      setEditDraft((current) => ({
                        ...current,
                        preferred_locale,
                      }))
                    }
                    options={[
                      { value: "ar", label: isArabic ? "ط§ظ„ط¹ط±ط¨ظٹط©" : "Arabic" },
                      { value: "en", label: isArabic ? "ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط©" : "English" },
                    ]}
                    portal
                    value={editDraft.preferred_locale ?? "ar"}
                  />
                </label>
                <label>
                  <span>{isArabic ? "ظ†ظˆط¹ ط§ظ„ط±ط®طµط©" : "License Type"}</span>
                  <DashboardSelect
                    ariaLabel={isArabic ? "ظ†ظˆط¹ ط§ظ„ط±ط®طµط©" : "License Type"}
                    menuClassName="admin-edit-select-menu"
                    onValueChange={(license_type) =>
                      setEditDraft((current) => ({
                        ...current,
                        license_type,
                      }))
                    }
                    options={[
                      { value: "none", label: isArabic ? "ظ„ط§ طھظˆط¬ط¯" : "None" },
                      { value: "verified", label: isArabic ? "ظ…ظˆط«ظ‚" : "Verified" },
                      {
                        value: "e_marketing",
                        label: isArabic
                          ? "طھط³ظˆظٹظ‚ ط¥ظ„ظƒطھط±ظˆظ†ظٹ"
                          : "E-Marketing",
                      },
                      { value: "fal", label: isArabic ? "ظپط§ظ„" : "FAL" },
                    ]}
                    portal
                    value={editDraft.license_type ?? "none"}
                  />
                </label>
                <label>
                  <span>{isArabic ? "ط­ط§ظ„ط© ط§ظ„ط±ط®طµط©" : "License Status"}</span>
                  <DashboardSelect
                    ariaLabel={isArabic ? "ط­ط§ظ„ط© ط§ظ„ط±ط®طµط©" : "License Status"}
                    menuClassName="admin-edit-select-menu"
                    onValueChange={(license_status) =>
                      setEditDraft((current) => ({
                        ...current,
                        license_status,
                      }))
                    }
                    options={[
                      { value: "pending", label: isArabic ? "ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©" : "Pending" },
                      { value: "verified", label: isArabic ? "ظ…ظˆط«ظ‚ط©" : "Verified" },
                      { value: "rejected", label: isArabic ? "ظ…ط±ظپظˆط¶ط©" : "Rejected" },
                    ]}
                    portal
                    value={editDraft.license_status ?? "pending"}
                  />
                </label>
                <label>
                  <span>{isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"}</span>
                  <select
                    className="admin-basic-select"
                    onChange={(event) =>
                      setEditDraft((current) => ({ ...current, status: event.target.value }))
                    }
                    value={editDraft.status ?? statusOptions.users[0].value}
                  >
                    {statusOptions.users.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}
            {metric === "users" ? (
              <div className="admin-user-readonly-grid">
                <h4>{isArabic ? "ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ†ط¸ط§ظ…" : "System Information"}</h4>
                {userReadonlyFields.map(([field, label]) => {
                  const value = editingRow[field];
                  const display =
                    field === "is_active"
                      ? Number(value) === 1
                        ? isArabic
                          ? "ظ†ط¹ظ…"
                          : "Yes"
                        : isArabic
                          ? "ظ„ط§"
                          : "No"
                      : field.includes("_at")
                        ? formatAdminDateTime(value, isArabic)
                        : String(value ?? "â€”");
                  return (
                    <div key={field}>
                      <span>{label}</span>
                      <strong>{display}</strong>
                    </div>
                  );
                })}
              </div>
            ) : null}
            {metric === "clients" ? (
              <>
                <label>
                  <span>{isArabic ? "ط§ظ„ط§ط³ظ…" : "Name"}</span>
                  <input
                    onChange={(event) =>
                      setEditDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    value={editDraft.name ?? ""}
                  />
                </label>
                <label>
                  <span>{isArabic ? "ط§ظ„ط´ط±ظƒط©" : "Company"}</span>
                  <input
                    onChange={(event) =>
                      setEditDraft((current) => ({
                        ...current,
                        company_name: event.target.value,
                      }))
                    }
                    value={editDraft.company_name ?? ""}
                  />
                </label>
                <label>
                  <span>{isArabic ? "ط±ظ‚ظ… ط§ظ„ط¬ظˆط§ظ„" : "Mobile"}</span>
                  <input
                    dir="ltr"
                    onChange={(event) =>
                      setEditDraft((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    value={editDraft.phone ?? ""}
                  />
                </label>
              </>
            ) : null}
            {metric === "demos" ? (
              <>
                <label>
                  <span>{isArabic ? "ط§ظ„ط¹ظ…ظٹظ„" : "Client"}</span>
                  <input
                    onChange={(event) =>
                      setEditDraft((current) => ({
                        ...current,
                        contact_name: event.target.value,
                      }))
                    }
                    value={editDraft.contact_name ?? ""}
                  />
                </label>
                <label>
                  <span>{isArabic ? "ط§ظ„ط´ط±ظƒط©" : "Company"}</span>
                  <input
                    onChange={(event) =>
                      setEditDraft((current) => ({
                        ...current,
                        company_name: event.target.value,
                      }))
                    }
                    value={editDraft.company_name ?? ""}
                  />
                </label>
                <label>
                  <span>{isArabic ? "ط±ظ‚ظ… ط§ظ„ط¬ظˆط§ظ„" : "Mobile"}</span>
                  <input
                    dir="ltr"
                    onChange={(event) =>
                      setEditDraft((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    value={editDraft.phone ?? ""}
                  />
                </label>
              </>
            ) : null}
            {metric === "quotes" ? (
              <label>
                <span>{isArabic ? "طھط§ط±ظٹط® ط§ظ„ط§ظ†طھظ‡ط§ط،" : "Expiry Date"}</span>
                <input
                  onChange={(event) =>
                    setEditDraft((current) => ({
                      ...current,
                      valid_until: event.target.value,
                    }))
                  }
                  type="date"
                  value={editDraft.valid_until ?? ""}
                />
              </label>
            ) : null}
            {metric !== "users" ? (
            <label>
              <span>
                {metric === "clients"
                  ? isArabic
                    ? "ط§ظ„ظ…ط±ط­ظ„ط©"
                    : "Stage"
                  : isArabic
                    ? "ط§ظ„ط­ط§ظ„ط©"
                    : "Status"}
              </span>
              <DashboardSelect
                ariaLabel={isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"}
                menuClassName="admin-edit-select-menu"
                onValueChange={(value) =>
                  setEditDraft((current) => ({
                    ...current,
                    [metric === "clients" ? "stage" : "status"]: value,
                  }))
                }
                options={statusOptions[metric]}
                portal
                value={
                  editDraft[metric === "clients" ? "stage" : "status"] ??
                  statusOptions[metric][0].value
                }
              />
            </label>
            ) : null}
            {editMessage ? <p>{editMessage}</p> : null}
            <div className="admin-edit-actions">
              <button
                className="primary"
                onClick={() => void saveEdit()}
                type="button"
              >
                {isArabic ? "ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ" : "Save Changes"}
              </button>
              <button onClick={() => setEditingRow(null)} type="button">
                {isArabic ? "ط¥ظ„ط؛ط§ط،" : "Cancel"}
              </button>
            </div>
            {metric === "users" ? (
              <div className="admin-user-delete-section">
                <strong>{isArabic ? "ط­ط°ظپ ط§ظ„ط­ط³ط§ط¨" : "Delete Account"}</strong>
                <span>
                  {isArabic
                    ? "ظ‡ط°ط§ ط§ظ„ط®ظٹط§ط± ظٹط­ط°ظپ ط­ط³ط§ط¨ ط§ظ„ظ…ط³طھط®ط¯ظ… ظ…ظ† ط§ظ„ظ†ط¸ط§ظ…."
                    : "This option removes the user account from the system."}
                </span>
                <button
                  className="admin-row-delete admin-user-delete-btn"
                  disabled={String(editingRow.email ?? "").toLowerCase() === "admin@middar.com"}
                  onClick={() => void deleteEditingUser()}
                  type="button"
                >
                  {isArabic ? "ط­ط°ظپ ط§ظ„ط­ط³ط§ط¨" : "Delete Account"}
                </button>
                {String(editingRow.email ?? "").toLowerCase() === "admin@middar.com" ? (
                  <small>
                    {isArabic
                      ? "ظ„ط§ ظٹظ…ظƒظ† ط­ط°ظپ admin@middar.com ظ„ط£ظ†ظ‡ ط­ط³ط§ط¨ ط£ط³ط§ط³ظٹ."
                      : "admin@middar.com cannot be deleted because it is a core account."}
                  </small>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
      {passwordRow ? (
        <div
          className="admin-edit-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPasswordRow(null);
          }}
          role="presentation"
        >
          <section className="admin-edit-modal" role="dialog" aria-modal="true">
            <div className="admin-edit-head">
              <div>
                <span>{isArabic ? "طھط¹ط¯ظٹظ„ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±" : "Edit Password"}</span>
                <h3>{String(passwordRow.name ?? passwordRow.email ?? "")}</h3>
              </div>
              <button onClick={() => setPasswordRow(null)} type="button">
                X
              </button>
            </div>
            <label>
              <span>{isArabic ? "ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط§ظ„ط¬ط¯ظٹط¯ط©" : "New Password"}</span>
              <input
                autoFocus
                onChange={(event) => setPasswordDraft(event.target.value)}
                placeholder={
                  isArabic ? "ط£ط¯ط®ظ„ ظƒظ„ظ…ط© ظ…ط±ظˆط± ط¬ط¯ظٹط¯ط©" : "Enter a new password"
                }
                type="password"
                value={passwordDraft}
              />
            </label>
            {passwordMessage ? <p>{passwordMessage}</p> : null}
            <div className="admin-edit-actions">
              <button
                className="primary"
                onClick={() => void savePassword()}
                type="button"
              >
                {isArabic ? "ط­ظپط¸ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±" : "Save Password"}
              </button>
              <button onClick={() => setPasswordRow(null)} type="button">
                {isArabic ? "ط¥ظ„ط؛ط§ط،" : "Cancel"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function AdminTagsSection({
  data,
  isArabic,
  onReload,
}: {
  data: ManagementData;
  isArabic: boolean;
  onReload: () => void;
}) {
  const groupedTypes = Array.from(
    (data.tagStats ?? []).reduce((map, row) => {
      const typeId = Number(row.tag_type_id);
      if (!typeId) return map;
      const current = map.get(typeId) ?? {
        id: typeId,
        name: String(row.type_name ?? "?"),
        color: String(row.type_color ?? "#00b4d8"),
        tags: [] as Array<{
          id: number;
          name: string;
          color: string;
          count: number;
        }>,
      };
      if (row.tag_id) {
        current.tags.push({
          id: Number(row.tag_id),
          name: String(row.tag_name ?? "?"),
          color: String(row.tag_color ?? "#00b4d8"),
          count: Number(row.customer_count ?? 0),
        });
      }
      map.set(typeId, current);
      return map;
    }, new Map<number, { id: number; name: string; color: string; tags: Array<{ id: number; name: string; color: string; count: number }> }>()),
  ).map(([, value]) => value);
  const [typeDrafts, setTypeDrafts] = useState<
    Record<number, { name: string; color: string }>
  >({});
  const [tagDrafts, setTagDrafts] = useState<
    Record<number, { name: string; color: string }>
  >({});
  const [newTagDrafts, setNewTagDrafts] = useState<
    Record<number, { name: string; color: string }>
  >({});
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [viewingTypeId, setViewingTypeId] = useState<number | null>(null);
  const [savingKey, setSavingKey] = useState("");
  const [message, setMessage] = useState("");
  const editingType = groupedTypes.find((type) => type.id === editingTypeId);
  const viewingType = groupedTypes.find((type) => type.id === viewingTypeId);

  useEffect(() => {
    const nextTypes: Record<number, { name: string; color: string }> = {};
    const nextTags: Record<number, { name: string; color: string }> = {};
    groupedTypes.forEach((type) => {
      nextTypes[type.id] = { name: type.name, color: type.color };
      type.tags.forEach((tag) => {
        nextTags[tag.id] = { name: tag.name, color: tag.color };
      });
    });
    setTypeDrafts(nextTypes);
    setTagDrafts(nextTags);
  }, [data.tagStats]);

  function adminHexToRgb(hex: string) {
    const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : "00b4d8";
    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    };
  }

  function adminRgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
    return `#${[r, g, b]
      .map((value) =>
        Math.max(0, Math.min(255, Math.round(value)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`;
  }

  function adminMixHex(startHex: string, endHex: string, ratio: number) {
    const start = adminHexToRgb(startHex);
    const end = adminHexToRgb(endHex);
    return adminRgbToHex({
      r: start.r + (end.r - start.r) * ratio,
      g: start.g + (end.g - start.g) * ratio,
      b: start.b + (end.b - start.b) * ratio,
    });
  }

  async function rebalanceTagGradient(
    typeId: number,
    createdTag?: {
      id: number;
      tag_type_id?: number | null;
      tag_name?: string | null;
      tag_color?: string | null;
    },
    fallbackTypeColor?: string,
  ) {
    const type = groupedTypes.find((item) => item.id === typeId);
    const baseColor = String(type?.color ?? fallbackTypeColor ?? "#00b4d8");
    const gradientEnd = "#11293d";
    const tagsById = new Map<
      number,
      { id: number; name: string; color: string; count: number }
    >();
    groupedTypes
      .find((item) => item.id === typeId)
      ?.tags.forEach((tag) => {
        tagsById.set(tag.id, tag);
      });
    if (createdTag?.id) {
      tagsById.set(createdTag.id, {
        id: createdTag.id,
        name: String(createdTag.tag_name ?? ""),
        color: String(createdTag.tag_color ?? "#00b4d8"),
        count: 0,
      });
    }
    const tags = Array.from(tagsById.values()).sort(
      (first, second) => first.id - second.id,
    );
    await Promise.all(
      tags.map(async (tag, index) => {
        const ratio = tags.length === 1 ? 0 : index / (tags.length - 1);
        const response = await fetch(`/api/v1/data/lead-tags/${tag.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            tag_color: adminMixHex(baseColor, gradientEnd, ratio),
          }),
        });
        if (!response.ok) throw new Error("SAVE_GRADIENT_FAILED");
      }),
    );
  }

  async function saveTagSettings(type: {
    id: number;
    name: string;
    color: string;
    tags: Array<{ id: number; name: string; color: string; count: number }>;
  }) {
    const typeDraft = typeDrafts[type.id] ?? {
      name: type.name,
      color: type.color,
    };
    if (!typeDraft.name.trim()) return;
    setSavingKey(`tags-${type.id}`);
    setMessage(isArabic ? "ط¬ط§ط±ظٹ ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ..." : "Saving changes...");
    try {
      const typeResponse = await fetch(`/api/v1/data/lead-tag-types/${type.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          type_name: typeDraft.name.trim(),
          type_color: typeDraft.color,
        }),
      });
      if (!typeResponse.ok) throw new Error("SAVE_TYPE_FAILED");

      await Promise.all(
        type.tags.map(async (tag) => {
          const tagDraft = tagDrafts[tag.id] ?? {
            name: tag.name,
            color: tag.color,
          };
          if (!tagDraft.name.trim()) return;
          const response = await fetch(`/api/v1/data/lead-tags/${tag.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
              tag_name: tagDraft.name.trim(),
              tag_color: tagDraft.color,
            }),
          });
          if (!response.ok) throw new Error("SAVE_TAG_FAILED");
        }),
      );

      const newDraft = newTagDrafts[type.id] ?? { name: "", color: "#00b4d8" };
      if (newDraft.name.trim()) {
        const response = await fetch("/api/v1/data/lead-tags", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            tag_type_id: type.id,
            tag_name: newDraft.name.trim(),
            tag_color: newDraft.color,
          }),
        });
        if (!response.ok) throw new Error("ADD_TAG_FAILED");
        const createdTag = await response.json().catch(() => null);
        await rebalanceTagGradient(type.id, createdTag?.data ?? createdTag, typeDraft.color);
        setNewTagDrafts((current) => ({
          ...current,
          [type.id]: { name: "", color: "#00b4d8" },
        }));
      }

      setMessage(isArabic ? "طھظ… ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ" : "Changes saved");
      onReload();
    } catch {
      setMessage(isArabic ? "طھط¹ط°ط± ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ" : "Could not save changes");
    } finally {
      setSavingKey("");
    }
  }

  function hexToRgb(hex: string) {
    const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : "00b4d8";
    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    };
  }

  function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
    return `#${[r, g, b]
      .map((value) =>
        Math.max(0, Math.min(255, Math.round(value)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`;
  }

  function mixHex(startHex: string, endHex: string, ratio: number) {
    const start = hexToRgb(startHex);
    const end = hexToRgb(endHex);
    return rgbToHex({
      r: start.r + (end.r - start.r) * ratio,
      g: start.g + (end.g - start.g) * ratio,
      b: start.b + (end.b - start.b) * ratio,
    });
  }

  async function createTagGradient(type: {
    id: number;
    color: string;
    tags: Array<{ id: number; name: string; color: string; count: number }>;
  }) {
    if (!type.tags.length) {
      setMessage(
        isArabic
          ? "ظ„ط§ طھظˆط¬ط¯ ظˆط³ظˆظ… ظ„ط¥ظ†ط´ط§ط، طھط¯ط±ط¬ ظ„ظ‡ط§"
          : "No tags available for a gradient",
      );
      return;
    }
    const baseColor = typeDrafts[type.id]?.color ?? type.color;
    const gradientEnd = "#11293d";
    setSavingKey(`gradient-${type.id}`);
    setMessage(isArabic ? "ط¬ط§ط±ظٹ ط­ظپط¸ ط§ظ„طھط¯ط±ط¬ ط§ظ„ظ„ظˆظ†ظٹ..." : "Saving color gradient...");
    setTagDrafts((current) => {
      const next = { ...current };
      type.tags.forEach((tag, index) => {
        const ratio = type.tags.length === 1 ? 0 : index / (type.tags.length - 1);
        next[tag.id] = {
          ...(next[tag.id] ?? { name: tag.name, color: tag.color }),
          color: mixHex(baseColor, gradientEnd, ratio),
        };
      });
      return next;
    });
    try {
      await Promise.all(
        type.tags.map(async (tag, index) => {
          const tagDraft = tagDrafts[tag.id] ?? { name: tag.name, color: tag.color };
          const ratio = type.tags.length === 1 ? 0 : index / (type.tags.length - 1);
          const response = await fetch(`/api/v1/data/lead-tags/${tag.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
              tag_name: tagDraft.name.trim(),
              tag_color: mixHex(baseColor, gradientEnd, ratio),
            }),
          });
          if (!response.ok) throw new Error("SAVE_GRADIENT_FAILED");
        }),
      );
      setMessage(isArabic ? "طھظ… ط­ظپط¸ ط§ظ„طھط¯ط±ط¬ ط§ظ„ظ„ظˆظ†ظٹ" : "Color gradient saved");
      onReload();
    } catch {
      setMessage(isArabic ? "طھط¹ط°ط± ط­ظپط¸ ط§ظ„طھط¯ط±ط¬ ط§ظ„ظ„ظˆظ†ظٹ" : "Could not save color gradient");
    } finally {
      setSavingKey("");
    }
  }

  function pieBackground(
    tags: Array<{ color: string; count: number }>,
    total: number,
  ) {
    if (!total) return "conic-gradient(#e2eef6 0 360deg)";
    let start = 0;
    const segments = tags
      .filter((tag) => tag.count > 0)
      .map((tag) => {
        const end = start + (tag.count / total) * 360;
        const segment = `${tag.color} ${start}deg ${end}deg`;
        start = end;
        return segment;
      });
    return `conic-gradient(${segments.join(", ")})`;
  }

  return (
    <section className="admin-data-card admin-tags-page">
      <div className="admin-data-head">
        <div>
          <span>{isArabic ? "ط¥ط¯ط§ط±ط© ط§ظ„ظˆط³ظˆظ…" : "Tag Management"}</span>
          <strong>
            {editingType
              ? isArabic
                ? "طھط¹ط¯ظٹظ„ ظ†ظˆط¹ ط§ظ„ظˆط³ظ…"
                : "Edit Tag Type"
              : viewingType
                ? isArabic
                  ? "ظƒظ„ ظˆط³ظˆظ… ط§ظ„ظ†ظˆط¹"
                  : "All Tags in Type"
              : `${groupedTypes.length.toLocaleString(NUMBER_LOCALE)} ${
                  isArabic ? "ظ†ظˆط¹ ظˆط³ظ…" : "tag types"
                }`}
          </strong>
        </div>
      </div>

      {viewingType && !editingType ? (
        <div className="admin-tag-manager">
          <div className="admin-tag-manager-title">
            <button
              className="admin-permissions-back-btn"
              onClick={() => setViewingTypeId(null)}
              type="button"
            >
              {isArabic ? "ط±ط¬ظˆط¹" : "Back"}
            </button>
            <div>
              <span>{isArabic ? "ظ†ظˆط¹ ط§ظ„ظˆط³ظ…" : "Tag type"}</span>
              <h3>{viewingType.name}</h3>
              <p>
                {viewingType.tags.length.toLocaleString(NUMBER_LOCALE)}{" "}
                {isArabic ? "ظˆط³ظ…" : "tags"}
              </p>
            </div>
          </div>
          {(() => {
            const sortedTags = [...viewingType.tags].sort(
              (first, second) => second.count - first.count,
            );
            const totalCustomers = sortedTags.reduce(
              (sum, tag) => sum + tag.count,
              0,
            );
            const chartTags = sortedTags.filter((tag) => tag.count > 0);
            return (
              <div className="admin-all-tags-insights">
                <div
                  aria-label={viewingType.name}
                  className="admin-tag-pie admin-all-tags-pie"
                  style={{
                    background: pieBackground(chartTags, totalCustomers),
                  }}
                >
                  <div>
                    <strong>{totalCustomers.toLocaleString(NUMBER_LOCALE)}</strong>
                    <span>{isArabic ? "ط¹ظ…ظٹظ„" : "customers"}</span>
                  </div>
                </div>
                <div className="admin-all-tags-list">
                  {sortedTags.map((tag) => {
                    const percent = totalCustomers
                      ? Math.round((tag.count / totalCustomers) * 100)
                      : 0;
                    return (
                      <div className="admin-all-tag-row" key={tag.id}>
                        <i style={{ background: tag.color }} />
                        <span>{tag.name}</span>
                        <strong>{percent.toLocaleString(NUMBER_LOCALE)}%</strong>
                        <small>
                          {tag.count.toLocaleString(NUMBER_LOCALE)}{" "}
                          {isArabic ? "ط¹ظ…ظٹظ„" : "customers"}
                        </small>
                      </div>
                    );
                  })}
                  {!sortedTags.length ? (
                    <p className="admin-empty">
                      {isArabic
                        ? "ظ„ط§ طھظˆط¬ط¯ ظˆط³ظˆظ… ظ…ط±طھط¨ط·ط© ط¨ظ‡ط°ط§ ط§ظ„ظ†ظˆط¹"
                        : "No tags linked to this type"}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })()}
        </div>
      ) : !editingType ? (
        <div className="admin-tag-type-grid">
          {groupedTypes.length ? (
            groupedTypes.map((type) => {
              const totalCustomers = type.tags.reduce(
                (sum, tag) => sum + tag.count,
                0,
              );
              const chartTags = type.tags.filter((tag) => tag.count > 0);
              const topTags = [...type.tags]
                .sort((first, second) => second.count - first.count)
                .slice(0, 3);
              return (
                <article className="admin-tag-type-card" key={type.id}>
                  <div className="admin-tag-type-head">
                    <span style={{ background: type.color }} />
                    <div>
                      <h3>{type.name}</h3>
                      <p>
                        {totalCustomers.toLocaleString(NUMBER_LOCALE)}{" "}
                        {isArabic ? "ط¹ظ…ظٹظ„ ط¥ط¬ظ…ط§ظ„ظٹ" : "total customers"}
                      </p>
                    </div>
                  </div>

                  <div
                    aria-label={type.name}
                    className="admin-tag-pie"
                    style={{
                      background: pieBackground(chartTags, totalCustomers),
                    }}
                  >
                    <div>
                      <strong>{totalCustomers.toLocaleString(NUMBER_LOCALE)}</strong>
                      <span>{isArabic ? "ط¹ظ…ظٹظ„" : "customers"}</span>
                    </div>
                  </div>

                  <div className="admin-tag-breakdown">
                    {type.tags.length ? (
                      topTags.map((tag) => {
                        const percent = totalCustomers
                          ? Math.round((tag.count / totalCustomers) * 100)
                          : 0;
                        return (
                          <div key={tag.id}>
                            <i style={{ background: tag.color }} />
                            <span>{tag.name}</span>
                            <strong>
                              {percent.toLocaleString(NUMBER_LOCALE)}%
                            </strong>
                            <small>
                              {tag.count.toLocaleString(NUMBER_LOCALE)}{" "}
                              {isArabic ? "ط¹ظ…ظٹظ„" : "customers"}
                            </small>
                          </div>
                        );
                      })
                    ) : (
                      <p className="admin-empty">
                        {isArabic
                          ? "ظ„ط§ طھظˆط¬ط¯ ظˆط³ظˆظ… ظ…ط±طھط¨ط·ط© ط¨ظ‡ط°ط§ ط§ظ„ظ†ظˆط¹"
                          : "No tags linked to this type"}
                      </p>
                    )}
                  </div>

                  {type.tags.length > 3 ? (
                    <button
                      className="admin-action-btn admin-tag-view-more"
                      onClick={() => {
                        setViewingTypeId(type.id);
                        setMessage("");
                      }}
                      type="button"
                    >
                      {isArabic ? "ظ…ط´ط§ظ‡ط¯ط© ط§ظ„ظ…ط²ظٹط¯" : "View more"}
                    </button>
                  ) : null}

                  <button
                    className="admin-action-btn admin-tag-card-edit"
                    onClick={() => {
                      setEditingTypeId(type.id);
                      setMessage("");
                    }}
                    type="button"
                  >
                    {isArabic ? "طھط¹ط¯ظٹظ„" : "Edit"}
                  </button>
                </article>
              );
            })
          ) : (
            <p className="admin-empty">
              {isArabic
                ? "ظ„ط§ طھظˆط¬ط¯ ط£ظ†ظˆط§ط¹ ظˆط³ظˆظ… ط­طھظ‰ ط§ظ„ط¢ظ†"
                : "No tag types have been created yet"}
            </p>
          )}
        </div>
      ) : (
      <div className="admin-tag-manager">
        <div className="admin-tag-manager-title">
          <button
            className="admin-permissions-back-btn"
            onClick={() => {
              setEditingTypeId(null);
              setMessage("");
            }}
            type="button"
          >
            {isArabic ? "ط±ط¬ظˆط¹" : "Back"}
          </button>
          <span>{editingType.name}</span>
          <p>
            {isArabic
              ? "ط¹ط¯ظ‘ظ„ ظ†ظˆط¹ ط§ظ„ظˆط³ظ… ظˆط§ظ„ظˆط³ظˆظ… ط§ظ„ظ…ط±طھط¨ط·ط© ط¨ظ‡ ظپظٹ ظ‡ط°ظ‡ ط§ظ„طµظپط­ط©."
              : "Edit this tag type and its linked tags on this page."}
          </p>
        </div>

        {(() => {
          const type = editingType;
          const typeDraft = typeDrafts[type.id] ?? {
            name: type.name,
            color: type.color,
          };
          const newDraft = newTagDrafts[type.id] ?? {
            name: "",
            color: "#00b4d8",
          };
          return (
            <article className="admin-tag-manager-card" key={`manage-${type.id}`}>
                <div className="admin-tag-type-editor">
                  <label>
                    <span>{isArabic ? "ظ†ظˆط¹ ط§ظ„ظˆط³ظ…" : "Tag type"}</span>
                    <input
                      onChange={(event) =>
                        setTypeDrafts((current) => ({
                          ...current,
                          [type.id]: { ...typeDraft, name: event.target.value },
                        }))
                      }
                      value={typeDraft.name}
                    />
                  </label>
                  <label className="admin-color-field">
                    <span>{isArabic ? "ط§ظ„ظ„ظˆظ†" : "Color"}</span>
                    <input
                      onChange={(event) =>
                        setTypeDrafts((current) => ({
                          ...current,
                          [type.id]: { ...typeDraft, color: event.target.value },
                        }))
                      }
                      type="color"
                      value={typeDraft.color}
                    />
                  </label>
                </div>

                <div className="admin-linked-tags-editor">
                  <div className="admin-linked-tags-head">
                    <strong>{isArabic ? "ط§ظ„ظˆط³ظˆظ… ط§ظ„ظ…ط±طھط¨ط·ط©" : "Linked tags"}</strong>
                    <button
                      className="admin-action-btn admin-gradient-btn"
                      disabled={savingKey === `gradient-${type.id}`}
                      onClick={() => void createTagGradient(type)}
                      type="button"
                    >
                      {savingKey === `gradient-${type.id}`
                        ? isArabic
                          ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸..."
                          : "Saving..."
                        : isArabic
                          ? "ط¥ظ†ط´ط§ط، طھط¯ط±ط¬ ظ„ظˆظ†ظٹ"
                          : "Create color gradient"}
                    </button>
                  </div>
                  {type.tags.length ? (
                    type.tags.map((tag) => {
                      const tagDraft = tagDrafts[tag.id] ?? {
                        name: tag.name,
                        color: tag.color,
                      };
                      return (
                        <div className="admin-linked-tag-row" key={tag.id}>
                          <input
                            onChange={(event) =>
                              setTagDrafts((current) => ({
                                ...current,
                                [tag.id]: {
                                  ...tagDraft,
                                  name: event.target.value,
                                },
                              }))
                            }
                            value={tagDraft.name}
                          />
                          <input
                            aria-label={isArabic ? "ظ„ظˆظ† ط§ظ„ظˆط³ظ…" : "Tag color"}
                            onChange={(event) =>
                              setTagDrafts((current) => ({
                                ...current,
                                [tag.id]: {
                                  ...tagDraft,
                                  color: event.target.value,
                                },
                              }))
                            }
                            type="color"
                            value={tagDraft.color}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <p className="admin-empty">
                      {isArabic ? "ظ„ط§ طھظˆط¬ط¯ ظˆط³ظˆظ… ظ„ظ‡ط°ط§ ط§ظ„ظ†ظˆط¹" : "No tags for this type"}
                    </p>
                  )}
                </div>

                <div className="admin-add-linked-tag">
                  <input
                    onChange={(event) =>
                      setNewTagDrafts((current) => ({
                        ...current,
                        [type.id]: { ...newDraft, name: event.target.value },
                      }))
                    }
                    placeholder={isArabic ? "ط§ط³ظ… ظˆط³ظ… ط¬ط¯ظٹط¯" : "New tag name"}
                    value={newDraft.name}
                  />
                  <input
                    aria-label={isArabic ? "ظ„ظˆظ† ط§ظ„ظˆط³ظ… ط§ظ„ط¬ط¯ظٹط¯" : "New tag color"}
                    onChange={(event) =>
                      setNewTagDrafts((current) => ({
                        ...current,
                        [type.id]: { ...newDraft, color: event.target.value },
                      }))
                    }
                    type="color"
                    value={newDraft.color}
                  />
                </div>
                <div className="admin-tag-save-footer">
                  <button
                    className="admin-action-btn primary"
                    disabled={savingKey === `tags-${type.id}`}
                    onClick={() => void saveTagSettings(type)}
                    type="button"
                  >
                    {savingKey === `tags-${type.id}`
                      ? isArabic
                        ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸..."
                        : "Saving..."
                      : isArabic
                        ? "ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ"
                        : "Save Changes"}
                  </button>
                </div>
              </article>
          );
        })()}
        {message ? <p className="admin-form-message">{message}</p> : null}
      </div>
      )}
    </section>
  );
}

const permissionActionLabels = [
  ["can_view", { ar: "ط¹ط±ط¶", en: "View" }],
  ["can_create", { ar: "ط¥ط¶ط§ظپط©", en: "Create" }],
  ["can_edit", { ar: "طھط¹ط¯ظٹظ„", en: "Edit" }],
  ["can_delete", { ar: "ط­ط°ظپ", en: "Delete" }],
  ["can_approve", { ar: "ط§ط¹طھظ…ط§ط¯", en: "Approve" }],
  ["can_reports", { ar: "طھظ‚ط§ط±ظٹط±", en: "Reports" }],
  ["can_dashboard", { ar: "ظ„ظˆط­ط©", en: "Dashboard" }],
] as const;

const permissionScopeLabels: Record<string, { ar: string; en: string }> = {
  own: { ar: "ط¨ظٹط§ظ†ط§طھظ‡ ظپظ‚ط·", en: "Own data" },
  team: { ar: "ط¨ظٹط§ظ†ط§طھ ط§ظ„ظپط±ظٹظ‚", en: "Team data" },
  company: { ar: "ط¨ظٹط§ظ†ط§طھ ط§ظ„ط´ط±ظƒط©", en: "Company data" },
  all: { ar: "ظƒظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ", en: "All data" },
};

const permissionKeyLabels: Record<string, { ar: string; en: string }> = {
  "page.admin.dashboard": { ar: "طµظپط­ط© ط§ظ„ط£ط¯ظ…ظ† - ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…", en: "Admin - Dashboard Page" },
  "page.admin.tickets": { ar: "طµظپط­ط© ط§ظ„ط£ط¯ظ…ظ† - طھط°ط§ظƒط± ط§ظ„ط®ط¯ظ…ط©", en: "Admin - Service Tickets Page" },
  "page.admin.accounts": { ar: "طµظپط­ط© ط§ظ„ط£ط¯ظ…ظ† - ط§ظ„ط­ط³ط§ط¨ط§طھ", en: "Admin - Accounts Page" },
  "page.admin.booths": { ar: "طµظپط­ط© ط§ظ„ط£ط¯ظ…ظ† - ط§ظ„ط¨ظˆط«ط§طھ", en: "Admin - Booths Page" },
  "page.admin.products": { ar: "طµظپط­ط© ط§ظ„ط£ط¯ظ…ظ† - ط§ظ„ظ…ظ†طھط¬ط§طھ", en: "Admin - Products Page" },
  "page.admin.tags": { ar: "طµظپط­ط© ط§ظ„ط£ط¯ظ…ظ† - ط§ظ„ظˆط³ظˆظ…", en: "Admin - Tags Page" },
  "page.admin.activities": { ar: "طµظپط­ط© ط§ظ„ط£ط¯ظ…ظ† - ط§ظ„ط£ظ†ط´ط·ط©", en: "Admin - Activities Page" },
  "page.admin.content": { ar: "طµظپط­ط© ط§ظ„ط£ط¯ظ…ظ† - ط§ظ„ظ…ط­طھظˆظ‰", en: "Admin - Content Page" },
  "page.admin.permissions": { ar: "طµظپط­ط© ط§ظ„ط£ط¯ظ…ظ† - ط§ظ„طµظ„ط§ط­ظٹط§طھ", en: "Admin - Permissions Page" },
  "page.user.overview": { ar: "طµظپط­ط© ط§ظ„ظ…ط³طھط®ط¯ظ… - ظ†ط¸ط±ط© ط¹ط§ظ…ط©", en: "User - Overview Page" },
  "page.user.marketing": { ar: "طµظپط­ط© ط§ظ„ظ…ط³طھط®ط¯ظ… - ط§ظ„طھط³ظˆظٹظ‚", en: "User - Marketing Page" },
  "page.user.customers": { ar: "طµظپط­ط© ط§ظ„ظ…ط³طھط®ط¯ظ… - ط§ظ„ط¹ظ…ظ„ط§ط،", en: "User - Customers Page" },
  "page.user.stores": { ar: "طµظپط­ط© ط§ظ„ظ…ط³طھط®ط¯ظ… - ط§ظ„ظ…ط¹ط§ط±ط¶", en: "User - Stores Page" },
  "page.user.quotes": { ar: "طµظپط­ط© ط§ظ„ظ…ط³طھط®ط¯ظ… - ط¹ط±ظˆط¶ ط§ظ„ط£ط³ط¹ط§ط±", en: "User - Quotes Page" },
  "page.user.participation_contracts": { ar: "طµظپط­ط© ط§ظ„ظ…ط³طھط®ط¯ظ… - ط¹ظ‚ظˆط¯ ط§ظ„ظ…ط´ط§ط±ظƒط©", en: "User - Participation Contracts Page" },
  "page.user.sponsorship_contracts": { ar: "طµظپط­ط© ط§ظ„ظ…ط³طھط®ط¯ظ… - ط¹ظ‚ظˆط¯ ط§ظ„ط±ط¹ط§ظٹط©", en: "User - Sponsorship Contracts Page" },
  "page.user.sales_orders": { ar: "طµظپط­ط© ط§ظ„ظ…ط³طھط®ط¯ظ… - ط£ظˆط§ظ…ط± ط§ظ„ط¨ظٹط¹", en: "User - Sales Orders Page" },
  "page.user.rental_contracts": { ar: "طµظپط­ط© ط§ظ„ظ…ط³طھط®ط¯ظ… - ط¹ظ‚ظˆط¯ طھط£ط¬ظٹط±ظٹط©", en: "User - Rental Contracts Page" },
  "page.user.sales": { ar: "طµظپط­ط© ط§ظ„ظ…ط³طھط®ط¯ظ… - ط§ظ„ظ…ط¨ظٹط¹ط§طھ", en: "User - Sales Page" },
  "page.user.activation": { ar: "طµظپط­ط© ط§ظ„ظ…ط³طھط®ط¯ظ… - ط§ظ„طھظپط¹ظٹظ„", en: "User - Activation Page" },
  "page.user.education": { ar: "طµظپط­ط© ط§ظ„ظ…ط³طھط®ط¯ظ… - ط§ظ„ظ…ط­طھظˆظ‰ ط§ظ„طھط¹ظ„ظٹظ…ظٹ", en: "User - Education Page" },
  "page.user.support": { ar: "طµظپط­ط© ط§ظ„ظ…ط³طھط®ط¯ظ… - ظ…ط±ظƒط² ط§ظ„ط¯ط¹ظ…", en: "User - Support Page" },
  "page.user.accounts": { ar: "طµظپط­ط© ط§ظ„ظ…ط³طھط®ط¯ظ… - ط§ظ„ط­ط³ط§ط¨ط§طھ", en: "User - Accounts Page" },
  "page.user.settings": { ar: "طµظپط­ط© ط§ظ„ظ…ط³طھط®ط¯ظ… - ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ", en: "User - Settings Page" },
  "table.users": { ar: "ط¬ط¯ظˆظ„ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†", en: "Users Table" },
  "table.products": { ar: "ط¬ط¯ظˆظ„ ط§ظ„ظ…ظ†طھط¬ط§طھ", en: "Products Table" },
  "table.industries": { ar: "ط¬ط¯ظˆظ„ ط§ظ„ط£ظ†ط´ط·ط©", en: "Industries Table" },
  "table.marketing_assets": { ar: "ط¬ط¯ظˆظ„ ط§ظ„ظ…ظƒطھط¨ط© ط§ظ„طھط³ظˆظٹظ‚ظٹط©", en: "Marketing Library Table" },
  "table.educational_assets": { ar: "ط¬ط¯ظˆظ„ ط§ظ„ظ…ط­طھظˆظ‰ ط§ظ„طھط¹ظ„ظٹظ…ظٹ", en: "Educational Content Table" },
  "table.leads": { ar: "ط¬ط¯ظˆظ„ ط§ظ„ط¹ظ…ظ„ط§ط، ط§ظ„ظ…ظ‡طھظ…ظٹظ†", en: "Interested Customers Table" },
  "table.lead_contacts": { ar: "ط¬ط¯ظˆظ„ ط¬ظ‡ط§طھ ط§طھطµط§ظ„ ط§ظ„ط¹ظ…ظ„ط§ط،", en: "Client Contacts Table" },
  "table.lead_notes": { ar: "ط¬ط¯ظˆظ„ ظ…ظ„ط§ط­ط¸ط§طھ ط§ظ„ط¹ظ…ظ„ط§ط،", en: "Client Notes Table" },
  "table.tag_types": { ar: "ط¬ط¯ظˆظ„ ط£ظ†ظˆط§ط¹ ط§ظ„ظˆط³ظˆظ…", en: "Tag Types Table" },
  "table.tags": { ar: "ط¬ط¯ظˆظ„ ط§ظ„ظˆط³ظˆظ…", en: "Tags Table" },
  "table.lead_tag_assignments": { ar: "ط¬ط¯ظˆظ„ ط±ط¨ط· ط§ظ„ط¹ظ…ظ„ط§ط، ط¨ط§ظ„ظˆط³ظˆظ…", en: "Customer Tag Assignments Table" },
  "table.store": { ar: "ط¬ط¯ظˆظ„ ط§ظ„ظ…ط¹ط§ط±ط¶", en: "Stores Table" },
  "table.stock": { ar: "ط¬ط¯ظˆظ„ ظ…ط®ط²ظˆظ† ط§ظ„ظ…ط¹ط§ط±ط¶", en: "Store Stock Table" },
  "table.demo_requests": { ar: "ط¬ط¯ظˆظ„ ط§ظ„ظ†ط³ط® ط§ظ„طھط¬ط±ظٹط¨ظٹط©", en: "Demos Table" },
  "table.quotes": { ar: "ط¬ط¯ظˆظ„ ط¹ط±ظˆط¶ ط§ظ„ط£ط³ط¹ط§ط±", en: "Quotes Table" },
  "table.participation_contracts": { ar: "ط¬ط¯ظˆظ„ ط¹ظ‚ظˆط¯ ط§ظ„ظ…ط´ط§ط±ظƒط©", en: "Participation Contracts Table" },
  "table.sponsorship_contracts": { ar: "ط¬ط¯ظˆظ„ ط¹ظ‚ظˆط¯ ط§ظ„ط±ط¹ط§ظٹط©", en: "Sponsorship Contracts Table" },
  "table.rental_contracts": { ar: "ط¬ط¯ظˆظ„ ط¹ظ‚ظˆط¯ ط§ظ„طھط£ط¬ظٹط±", en: "Rental Contracts Table" },
  "table.rental_booths": { ar: "ط¬ط¯ظˆظ„ ط±ط¨ط· ط§ظ„ط¨ظˆط«ط§طھ ط¨ط¹ظ‚ظˆط¯ ط§ظ„طھط£ط¬ظٹط±", en: "Rental Booth Links Table" },
  "table.booths": { ar: "ط¬ط¯ظˆظ„ ط§ظ„ط¨ظˆط«ط§طھ", en: "Booths Table" },
  "table.sales_orders": { ar: "ط¬ط¯ظˆظ„ ط£ظˆط§ظ…ط± ط§ظ„ط¨ظٹط¹", en: "Sales Orders Table" },
  "table.sales": { ar: "ط¬ط¯ظˆظ„ ط§ظ„ظ…ط¨ظٹط¹ط§طھ", en: "Sales Table" },
  "table.commissions": { ar: "ط¬ط¯ظˆظ„ ط§ظ„ط¹ظ…ظˆظ„ط§طھ", en: "Commissions Table" },
  "table.support_tickets": { ar: "ط¬ط¯ظˆظ„ طھط°ط§ظƒط± ط§ظ„ط®ط¯ظ…ط©", en: "Support Tickets Table" },
  "table.support_ticket_types": { ar: "ط¬ط¯ظˆظ„ ط£ظ†ظˆط§ط¹ طھط°ط§ظƒط± ط§ظ„ط®ط¯ظ…ط©", en: "Support Ticket Types Table" },
  "table.support_ticket_events": { ar: "ط¬ط¯ظˆظ„ ط®ط· ط²ظ…ظ† ط§ظ„طھط°ط§ظƒط±", en: "Ticket Timeline Table" },
  "table.team_members": { ar: "ط¬ط¯ظˆظ„ ط£ط¹ط¶ط§ط، ط§ظ„ظپط±ظٹظ‚", en: "Team Members Table" },
  "table.social_accounts": { ar: "ط¬ط¯ظˆظ„ ط­ط³ط§ط¨ط§طھ ط§ظ„طھظˆط§طµظ„", en: "Social Accounts Table" },
  "table.payout_methods": { ar: "ط¬ط¯ظˆظ„ ط§ظ„ط­ط³ط§ط¨ط§طھ ط§ظ„ط¨ظ†ظƒظٹط©", en: "Bank Accounts Table" },
  "data.team_members": { ar: "ط±ط¤ظٹط© ط¨ظٹط§ظ†ط§طھ ط£ط¹ط¶ط§ط، ط§ظ„ظپط±ظٹظ‚", en: "View Team Members Data" },
  "commission.percentage": { ar: "طھط؛ظٹظٹط± ظ†ط³ط¨ط© ط§ظ„ط¹ظ…ظˆظ„ط©", en: "Change Commission Percentage" },
};

const permissionCategoryLabels: Record<string, { ar: string; en: string; order: number }> = {
  admin_pages: { ar: "طµظپط­ط§طھ ط§ظ„ط£ط¯ظ…ظ†", en: "Admin Pages", order: 10 },
  user_pages: { ar: "طµظپط­ط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ…", en: "User Pages", order: 20 },
  customers: { ar: "ط§ظ„ط¹ظ…ظ„ط§ط، ظˆط§ظ„ظˆط³ظˆظ…", en: "Customers & Tags", order: 30 },
  contracts: { ar: "ط§ظ„ط¹ظ‚ظˆط¯ ظˆط§ظ„ط¨ظˆط«ط§طھ", en: "Contracts & Booths", order: 40 },
  sales: { ar: "ط§ظ„ظ…ط¨ظٹط¹ط§طھ ظˆط§ظ„ط¹ظ…ظˆظ„ط§طھ", en: "Sales & Commissions", order: 50 },
  support: { ar: "ط§ظ„ط¯ط¹ظ… ظˆط§ظ„طھط°ط§ظƒط±", en: "Support & Tickets", order: 60 },
  settings: { ar: "ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ظˆط§ظ„ظ…ط­طھظˆظ‰", en: "Settings & Content", order: 70 },
  other: { ar: "طµظ„ط§ط­ظٹط§طھ ط£ط®ط±ظ‰", en: "Other Permissions", order: 90 },
};

function permissionCategoryForKey(key: string) {
  if (key.startsWith("page.admin.")) return "admin_pages";
  if (key.startsWith("page.user.")) return "user_pages";
  if (
    [
      "table.leads",
      "table.lead_contacts",
      "table.lead_notes",
      "table.tag_types",
      "table.tags",
      "table.lead_tag_assignments",
      "table.demo_requests",
    ].includes(key)
  )
    return "customers";
  if (
    [
      "table.participation_contracts",
      "table.sponsorship_contracts",
      "table.rental_contracts",
      "table.rental_booths",
      "table.booths",
      "table.sales_orders",
    ].includes(key)
  )
    return "contracts";
  if (
    [
      "table.quotes",
      "table.sales",
      "table.commissions",
      "commission.percentage",
    ].includes(key)
  )
    return "sales";
  if (key.includes("support_ticket") || key === "page.user.support")
    return "support";
  if (
    [
      "table.products",
      "table.industries",
      "table.marketing_assets",
      "table.educational_assets",
      "table.users",
      "table.store",
      "table.stock",
      "table.team_members",
      "table.social_accounts",
      "table.payout_methods",
      "data.team_members",
    ].includes(key)
  )
    return "settings";
  return "other";
}

function blankPermission(
  subjectType: "role" | "user",
  subjectId: string,
  permissionKey: string,
): PermissionRecord {
  return {
    subject_type: subjectType,
    subject_id: subjectId,
    role_id: null,
    permission_key: permissionKey,
    can_view: 0,
    can_create: 0,
    can_edit: 0,
    can_delete: 0,
    can_approve: 0,
    can_reports: 0,
    can_dashboard: 0,
    data_scope: "own",
  };
}

function AdminPermissionsSection({ isArabic }: { isArabic: boolean }) {
  const [permissionData, setPermissionData] =
    useState<AdminPermissionData | null>(null);
  const [subject, setSubject] = useState("role:admin");
  const [permissionView, setPermissionView] = useState<"roles" | "permissions">(
    "roles",
  );
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [roleDraft, setRoleDraft] = useState({
    name_ar: "",
    name_en: "",
    slug: "",
    role_type: "user" as "admin" | "user",
  });
  const [editingRole, setEditingRole] =
    useState<AdminPermissionData["roles"][number] | null>(null);
  const [usersRole, setUsersRole] =
    useState<AdminPermissionData["roles"][number] | null>(null);
  const [roleEditDraft, setRoleEditDraft] = useState({
    name_ar: "",
    name_en: "",
    slug: "",
  });
  const language = isArabic ? "ar" : "en";

  function loadPermissions() {
    return fetch("/api/v1/admin/permissions", { cache: "no-store" })
      .then((response) => response.json())
      .then((body) => setPermissionData(body.data ?? null))
      .catch(() => setPermissionData(null));
  }

  useEffect(() => {
    loadPermissions();
  }, []);

  if (!permissionData) {
    return (
      <section className="admin-data-card admin-loading">
        {isArabic ? "ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„طµظ„ط§ط­ظٹط§طھ..." : "Loading permissions..."}
      </section>
    );
  }

  const [subjectTypeRaw, subjectId] = subject.split(":");
  const subjectType = subjectTypeRaw === "user" ? "user" : "role";
  const selectedRole =
    subjectType === "role"
      ? permissionData.roles.find((role) => role.slug === subjectId)
      : permissionData.roles.find(
          (role) =>
            role.slug ===
            String(
              permissionData.users.find((user) => String(user.id) === subjectId)
                ?.role ?? "",
            ),
        );
  const selectedRoleType = selectedRole?.role_type ?? "user";
  const availablePermissionKeys =
    permissionData.permissionKeysByRoleType?.[selectedRoleType] ??
    permissionData.permissionKeys;
  const latestPermissionsUpdate = permissionData.latestUpdatedAt
    ? new Intl.DateTimeFormat(isArabic ? "ar-SA-u-ca-gregory" : "en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(permissionData.latestUpdatedAt))
    : "â€”";
  const subjectLabel =
    subjectType === "role"
      ? String(
          (isArabic ? selectedRole?.name_ar : selectedRole?.name_en) ??
            displayAdminValue(subjectId, isArabic),
        )
      : String(
          permissionData.users.find((user) => String(user.id) === subjectId)
            ?.name ??
            permissionData.users.find((user) => String(user.id) === subjectId)
              ?.email ??
            subjectId,
        );
  const permissionMap = new Map(
    permissionData.permissions
      .filter(
        (permission) =>
          permission.subject_type === subjectType &&
          permission.subject_id === subjectId,
      )
      .map((permission) => [permission.permission_key, permission]),
  );
  const filteredKeys = availablePermissionKeys.filter((key) => {
    const label = permissionKeyLabels[key]?.[language] ?? key;
    const normalized = query.trim().toLocaleLowerCase();
    return normalized
      ? `${label} ${key}`.toLocaleLowerCase().includes(normalized)
      : true;
  });
  const groupedPermissionKeys = filteredKeys
    .slice()
    .sort((first, second) => {
      const firstCategory =
        permissionCategoryLabels[permissionCategoryForKey(first)] ??
        permissionCategoryLabels.other;
      const secondCategory =
        permissionCategoryLabels[permissionCategoryForKey(second)] ??
        permissionCategoryLabels.other;
      if (firstCategory.order !== secondCategory.order) {
        return firstCategory.order - secondCategory.order;
      }
      return (permissionKeyLabels[first]?.[language] ?? first).localeCompare(
        permissionKeyLabels[second]?.[language] ?? second,
      );
    })
    .reduce<Array<{ category: string; keys: string[] }>>((groups, key) => {
      const category = permissionCategoryForKey(key);
      const current = groups[groups.length - 1];
      if (current?.category === category) current.keys.push(key);
      else groups.push({ category, keys: [key] });
      return groups;
    }, []);
  const usersForSelectedRole = usersRole
    ? permissionData.users.filter(
        (user) => String(user.role ?? "") === String(usersRole.slug),
      )
    : [];

  async function savePermission(
    permission: PermissionRecord,
    updates: Partial<PermissionRecord>,
  ) {
    const nextPermission = { ...permission, ...updates };
    setPermissionData((current) =>
      current
        ? {
            ...current,
            permissions: [
              ...current.permissions.filter(
                (item) =>
                  !(
                    item.subject_type === nextPermission.subject_type &&
                    item.subject_id === nextPermission.subject_id &&
                    item.permission_key === nextPermission.permission_key
                  ),
              ),
              nextPermission,
            ],
          }
        : current,
    );
    setMessage(isArabic ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸..." : "Saving...");
    try {
      const response = await fetch("/api/v1/admin/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(nextPermission),
      });
      if (!response.ok) throw new Error("SAVE_FAILED");
      setMessage(isArabic ? "طھظ… ط­ظپط¸ ط§ظ„طµظ„ط§ط­ظٹط©" : "Permission saved");
    } catch {
      setMessage(isArabic ? "طھط¹ط°ط± ط­ظپط¸ ط§ظ„طµظ„ط§ط­ظٹط©" : "Unable to save permission");
      loadPermissions();
    }
  }

  async function createRole() {
    setMessage(isArabic ? "ط¬ط§ط±ظٹ ط¥ظ†ط´ط§ط، ط§ظ„ط¯ظˆط±..." : "Creating role...");
    try {
      const response = await fetch("/api/v1/admin/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(roleDraft),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(body.error ?? "CREATE_FAILED"));
      setRoleDraft({ name_ar: "", name_en: "", slug: "", role_type: "user" });
      await loadPermissions();
      if (body.data?.slug) {
        setSubject(`role:${body.data.slug}`);
        setPermissionView("permissions");
      }
      setMessage(isArabic ? "طھظ… ط¥ظ†ط´ط§ط، ط§ظ„ط¯ظˆط±" : "Role created");
    } catch (error) {
      setMessage(
        error instanceof Error && error.message === "ROLE_ALREADY_EXISTS"
          ? isArabic
            ? "ظٹظˆط¬ط¯ ط¯ظˆط± ط¨ظ†ظپط³ ط§ظ„ط±ظ…ط²"
            : "A role with this slug already exists"
          : isArabic
            ? "طھط¹ط°ط± ط¥ظ†ط´ط§ط، ط§ظ„ط¯ظˆط±"
            : "Unable to create role",
      );
    }
  }

  function openRoleDetails(role: AdminPermissionData["roles"][number]) {
    if (Number(role.is_system ?? 1) === 1) return;
    setEditingRole(role);
    setRoleEditDraft({
      name_ar: String(role.name_ar ?? ""),
      name_en: String(role.name_en ?? ""),
      slug: String(role.slug ?? ""),
    });
    setMessage("");
  }

  async function saveRoleDetails() {
    if (!editingRole) return;
    setMessage(isArabic ? "\u062c\u0627\u0631\u064a \u062d\u0641\u0638 \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u062f\u0648\u0631..." : "Saving role details...");
    try {
      const response = await fetch("/api/v1/admin/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          slug: editingRole.slug,
          new_slug: roleEditDraft.slug,
          name_ar: roleEditDraft.name_ar,
          name_en: roleEditDraft.name_en,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(body.error ?? "SAVE_FAILED"));
      setEditingRole(null);
      await loadPermissions();
      const nextSlug = roleEditDraft.slug.trim();
      if (subjectType === "role" && subjectId === editingRole.slug && nextSlug) {
        setSubject(`role:${nextSlug}`);
      }
      setMessage(isArabic ? "\u062a\u0645 \u062d\u0641\u0638 \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u062f\u0648\u0631" : "Role details saved");
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      setMessage(
        code === "SYSTEM_ROLE_PROTECTED"
          ? isArabic
            ? "\u0644\u0627 \u064a\u0645\u0643\u0646 \u062a\u0639\u062f\u064a\u0644 \u062f\u0648\u0631 \u0623\u0633\u0627\u0633\u064a \u0641\u064a \u0627\u0644\u0646\u0638\u0627\u0645"
            : "System roles cannot be edited"
          : code === "ROLE_ALREADY_EXISTS"
            ? isArabic
              ? "\u064a\u0648\u062c\u062f \u062f\u0648\u0631 \u0628\u0646\u0641\u0633 \u0627\u0644\u0631\u0645\u0632"
              : "A role with this code already exists"
          : isArabic
            ? "\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u062f\u0648\u0631"
            : "Unable to save role details",
      );
    }
  }

  async function deleteRole(role: AdminPermissionData["roles"][number]) {
    if (Number(role.is_system ?? 1) === 1) return;
    const roleName = String(isArabic ? role.name_ar : role.name_en);
    const confirmed = window.confirm(
      isArabic
        ? `\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u062f\u0648\u0631 ${roleName}\u061f`
        : `Delete role ${roleName}?`,
    );
    if (!confirmed) return;

    setMessage(isArabic ? "\u062c\u0627\u0631\u064a \u062d\u0630\u0641 \u0627\u0644\u062f\u0648\u0631..." : "Deleting role...");
    try {
      const response = await fetch("/api/v1/admin/permissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ slug: role.slug }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(body.error ?? "DELETE_FAILED"));
      if (subjectType === "role" && subjectId === role.slug) {
        setSubject("role:admin");
      }
      await loadPermissions();
      setMessage(isArabic ? "\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u062f\u0648\u0631" : "Role deleted");
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      setMessage(
        code === "SYSTEM_ROLE_PROTECTED"
          ? isArabic
            ? "\u0644\u0627 \u064a\u0645\u0643\u0646 \u062d\u0630\u0641 \u062f\u0648\u0631 \u0623\u0633\u0627\u0633\u064a \u0641\u064a \u0627\u0644\u0646\u0638\u0627\u0645"
            : "System roles cannot be deleted"
          : code === "ROLE_IN_USE"
            ? isArabic
              ? "\u0644\u0627 \u064a\u0645\u0643\u0646 \u062d\u0630\u0641 \u062f\u0648\u0631 \u0645\u0631\u062a\u0628\u0637 \u0628\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646"
              : "This role is assigned to users"
            : isArabic
              ? "\u062a\u0639\u0630\u0631 \u062d\u0630\u0641 \u0627\u0644\u062f\u0648\u0631"
              : "Unable to delete role",
      );
    }
  }

  return (
    <section className="admin-data-card admin-permissions-card">
      <div className="admin-data-head admin-permissions-head">
        <div>
          <span>
            {permissionView === "permissions"
              ? isArabic
                ? "طھط¹ط¯ظٹظ„ طµظ„ط§ط­ظٹط§طھ ط§ظ„ط¯ظˆط±"
                : "Edit Role Permissions"
              : isArabic
                ? "ط¥ط¯ط§ط±ط© ط§ظ„طµظ„ط§ط­ظٹط§طھ"
                : "Permission Management"}
          </span>
          <strong>
            {permissionView === "permissions"
              ? `${isArabic ? "طµظ„ط§ط­ظٹط§طھ" : "Permissions"} ${subjectLabel}`
              : isArabic
                ? "ط§ظ„ط£ط¯ظˆط§ط± ظˆط§ظ„طµظ„ط§ط­ظٹط§طھ"
                : "Roles & Permissions"}
          </strong>
        </div>
        {permissionView === "permissions" ? (
          <div className="admin-permissions-tools">
            <button
              className="admin-permissions-back-btn"
              onClick={() => {
                setPermissionView("roles");
                setQuery("");
                setMessage("");
              }}
              type="button"
            >
              {isArabic ? "ط±ط¬ظˆط¹ ظ„ظ‚ط§ط¦ظ…ط© ط§ظ„ط£ط¯ظˆط§ط±" : "Back to Roles"}
            </button>
            <input
              aria-label={isArabic ? "ط¨ط­ط« ظپظٹ ط§ظ„طµظ„ط§ط­ظٹط§طھ" : "Search permissions"}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                isArabic ? "ط§ظ„ط¨ط­ط« ظپظٹ طµظ„ط§ط­ظٹط§طھ ط§ظ„ط¯ظˆط±..." : "Search role permissions..."
              }
              type="search"
              value={query}
            />
          </div>
        ) : null}
      </div>

      {message ? <p className="admin-permissions-message">{message}</p> : null}

      {permissionView === "roles" ? (
      <div className="admin-role-create-panel">
        <div>
          <span>{isArabic ? "ط¥ط¶ط§ظپط© ط¯ظˆط± ط¬ط¯ظٹط¯" : "Add New Role"}</span>
          <strong>
            {isArabic
              ? "ط£ظ†ط´ط¦ ط¯ظˆط±ظ‹ط§ ط«ظ… ط§ط±ط¨ط·ظ‡ ط¨ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ† ظˆط§ظ„طµظ„ط§ط­ظٹط§طھ"
              : "Create a role, then link it to users and permissions"}
          </strong>
        </div>
        <input
          onChange={(event) =>
            setRoleDraft((current) => ({ ...current, name_ar: event.target.value }))
          }
          placeholder={isArabic ? "ط§ط³ظ… ط§ظ„ط¯ظˆط± ط¨ط§ظ„ط¹ط±ط¨ظٹ" : "Arabic role name"}
          value={roleDraft.name_ar}
        />
        <input
          dir="ltr"
          onChange={(event) =>
            setRoleDraft((current) => ({ ...current, name_en: event.target.value }))
          }
          placeholder={isArabic ? "ط§ط³ظ… ط§ظ„ط¯ظˆط± ط¨ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ" : "English role name"}
          value={roleDraft.name_en}
        />
        <input
          dir="ltr"
          onChange={(event) =>
            setRoleDraft((current) => ({ ...current, slug: event.target.value }))
          }
          placeholder={isArabic ? "ط±ظ…ط² ط§ظ„ط¯ظˆط± ط§ط®طھظٹط§ط±ظٹ" : "Optional role slug"}
          value={roleDraft.slug}
        />
        <DashboardSelect
          ariaLabel={isArabic ? "ظ†ظˆط¹ ط§ظ„ط¯ظˆط±" : "Role type"}
          menuClassName="admin-edit-select-menu"
          onValueChange={(role_type) =>
            setRoleDraft((current) => ({
              ...current,
              role_type: role_type === "admin" ? "admin" : "user",
            }))
          }
          options={[
            { value: "user", label: isArabic ? "ط´ط§ط´ط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ…" : "User screens" },
            { value: "admin", label: isArabic ? "ط´ط§ط´ط§طھ ط§ظ„ط£ط¯ظ…ظ†" : "Admin screens" },
          ]}
          value={roleDraft.role_type}
        />
        <button className="admin-create-role-btn" onClick={createRole} type="button">
          {isArabic ? "ط¥ظ†ط´ط§ط، ط§ظ„ط¯ظˆط±" : "Create Role"}
        </button>
      </div>
      ) : null}

      {permissionView === "roles" ? (
      <div className="admin-roles-list-card">
        <div className="admin-roles-list-head">
          <div>
            <span>{isArabic ? "ظ‚ط§ط¦ظ…ط© ط§ظ„ط£ط¯ظˆط§ط±" : "Roles List"}</span>
            <strong>
              {isArabic
                ? "ط§ط®طھط± ط§ظ„ط¯ظˆط± ظ„طھط¹ط¯ظٹظ„ ط§ظ„طµظ„ط§ط­ظٹط§طھ ط§ظ„ظ…ط±طھط¨ط·ط© ط¨ظ‡"
                : "Choose a role to edit its linked permissions"}
            </strong>
          </div>
          <small>
            {permissionData.roles.length.toLocaleString(NUMBER_LOCALE)}{" "}
            {isArabic ? "ط¯ظˆط±" : "roles"}
          </small>
        </div>
        <div className="admin-roles-list-grid">
          {permissionData.roles.map((role) => {
            const isSelected =
              subjectType === "role" && subjectId === String(role.slug);
            return (
              <div
                className={`admin-role-list-row${isSelected ? " is-selected" : ""}`}
                key={role.slug}
              >
                <div>
                  <strong>{isArabic ? role.name_ar : role.name_en}</strong>
                  <span>{role.slug}</span>
                </div>
                <span className={`admin-role-type-pill ${role.role_type ?? "user"}`}>
                  {role.role_type === "admin"
                    ? isArabic
                      ? "ط´ط§ط´ط§طھ ط§ظ„ط£ط¯ظ…ظ†"
                      : "Admin screens"
                    : isArabic
                      ? "ط´ط§ط´ط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ…"
                      : "User screens"}
                </span>
                <div className="admin-role-actions">
                  <button
                    className="admin-row-edit"
                    onClick={() => {
                      setSubject(`role:${role.slug}`);
                      setQuery("");
                      setMessage("");
                      setPermissionView("permissions");
                    }}
                    type="button"
                  >
                    {isArabic ? "\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0627\u062a" : "Edit Permissions"}
                  </button>
                  <button
                    className="admin-row-edit admin-role-users-btn"
                    onClick={() => setUsersRole(role)}
                    type="button"
                  >
                    {isArabic ? "\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646" : "Users"}
                  </button>
                  {Number(role.is_system ?? 1) === 0 ? (
                    <button
                      className="admin-row-edit admin-role-details-btn"
                      onClick={() => openRoleDetails(role)}
                      title={isArabic ? "\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644" : "Edit Details"}
                      type="button"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                      <span className="sr-only">
                        {isArabic ? "\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644" : "Edit Details"}
                      </span>
                    </button>
                  ) : null}
                </div>
                {Number(role.is_system ?? 1) === 1 ? (
                  <span className="admin-system-role-badge">
                    {isArabic ? "\u0623\u0633\u0627\u0633\u064a" : "System"}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      ) : null}

      {editingRole ? (
        <div
          className="admin-edit-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditingRole(null);
          }}
          role="presentation"
        >
          <section
            aria-modal="true"
            className="admin-edit-modal admin-role-details-modal"
            dir={isArabic ? "rtl" : "ltr"}
            role="dialog"
          >
            <div className="admin-edit-head">
              <div>
                <span>{isArabic ? "\u062a\u0639\u062f\u064a\u0644 \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u062f\u0648\u0631" : "Edit Role Details"}</span>
                <h3>{String(editingRole.slug)}</h3>
              </div>
              <button onClick={() => setEditingRole(null)} type="button">
                X
              </button>
            </div>
            <label>
              <span>{isArabic ? "\u0631\u0645\u0632 \u0627\u0644\u062f\u0648\u0631" : "Role code"}</span>
              <input
                dir="ltr"
                onChange={(event) =>
                  setRoleEditDraft((current) => ({
                    ...current,
                    slug: event.target.value,
                  }))
                }
                value={roleEditDraft.slug}
              />
            </label>
            <label>
              <span>{isArabic ? "\u0627\u0633\u0645 \u0627\u0644\u062f\u0648\u0631 \u0628\u0627\u0644\u0639\u0631\u0628\u064a" : "Arabic role name"}</span>
              <input
                onChange={(event) =>
                  setRoleEditDraft((current) => ({
                    ...current,
                    name_ar: event.target.value,
                  }))
                }
                value={roleEditDraft.name_ar}
              />
            </label>
            <label>
              <span>{isArabic ? "\u0627\u0633\u0645 \u0627\u0644\u062f\u0648\u0631 \u0628\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a" : "English role name"}</span>
              <input
                dir="ltr"
                onChange={(event) =>
                  setRoleEditDraft((current) => ({
                    ...current,
                    name_en: event.target.value,
                  }))
                }
                value={roleEditDraft.name_en}
              />
            </label>
            <div className="admin-edit-actions">
              <button
                className="primary"
                onClick={() => void saveRoleDetails()}
                type="button"
              >
                {isArabic ? "\u062d\u0641\u0638 \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644" : "Save Details"}
              </button>
              <button onClick={() => setEditingRole(null)} type="button">
                {isArabic ? "\u0625\u0644\u063a\u0627\u0621" : "Cancel"}
              </button>
              <button
                className="danger"
                onClick={() => void deleteRole(editingRole)}
                type="button"
              >
                {isArabic ? "\u062d\u0630\u0641" : "Delete"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {usersRole ? (
        <div
          className="admin-edit-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setUsersRole(null);
          }}
          role="presentation"
        >
          <section
            aria-modal="true"
            className="admin-edit-modal admin-role-users-modal"
            dir={isArabic ? "rtl" : "ltr"}
            role="dialog"
          >
            <div className="admin-edit-head">
              <div>
                <span>{isArabic ? "\u0645\u0633\u062a\u062e\u062f\u0645\u0648 \u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0629" : "Role Users"}</span>
                <h3>{isArabic ? usersRole.name_ar : usersRole.name_en}</h3>
              </div>
              <button onClick={() => setUsersRole(null)} type="button">
                X
              </button>
            </div>
            <div className="admin-role-users-summary">
              <strong>{usersForSelectedRole.length.toLocaleString(NUMBER_LOCALE)}</strong>
              <span>{isArabic ? "\u0645\u0633\u062a\u062e\u062f\u0645" : "users"}</span>
            </div>
            {usersForSelectedRole.length ? (
              <div className="admin-role-users-list">
                {usersForSelectedRole.map((user) => (
                  <div className="admin-role-user-row" key={String(user.id)}>
                    <div>
                      <strong>
                        {String(
                          user.name ??
                            user.full_name ??
                            user.email ??
                            `${isArabic ? "\u0645\u0633\u062a\u062e\u062f\u0645" : "User"} #${user.id}`,
                        )}
                      </strong>
                      <span>{String(user.email ?? "\u2014")}</span>
                    </div>
                    <small>{displayAdminValue(user.status, isArabic)}</small>
                  </div>
                ))}
              </div>
            ) : (
              <p className="admin-role-users-empty">
                {isArabic
                  ? "\u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u0633\u062a\u062e\u062f\u0645\u0648\u0646 \u0645\u0631\u062a\u0628\u0637\u0648\u0646 \u0628\u0647\u0630\u0647 \u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0629."
                  : "No users are assigned to this role."}
              </p>
            )}
            <div className="admin-edit-actions">
              <button onClick={() => setUsersRole(null)} type="button">
                {isArabic ? "\u0625\u063a\u0644\u0627\u0642" : "Close"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {permissionView === "permissions" ? (
      <div className="admin-table-wrap admin-permissions-table-wrap">
        <table className="admin-permissions-table">
          <thead>
            <tr>
              <th>{isArabic ? "ط§ظ„طµظ„ط§ط­ظٹط©" : "Permission"}</th>
              {permissionActionLabels.map(([key, label]) => (
                <th key={key}>{label[language]}</th>
              ))}
              <th>{isArabic ? "ظ†ط·ط§ظ‚ ط§ظ„ط¨ظٹط§ظ†ط§طھ" : "Data Scope"}</th>
            </tr>
          </thead>
          <tbody>
            {groupedPermissionKeys.map((group) => (
              <Fragment key={group.category}>
                <tr className="admin-permission-category-row">
                  <td colSpan={permissionActionLabels.length + 2}>
                    <span>
                      {(permissionCategoryLabels[group.category] ??
                        permissionCategoryLabels.other)[language]}
                    </span>
                    <small>
                      {group.keys.length.toLocaleString(NUMBER_LOCALE)}{" "}
                      {isArabic ? "طµظ„ط§ط­ظٹط©" : "permissions"}
                    </small>
                  </td>
                </tr>
                {group.keys.map((permissionKey) => {
                  const permission =
                    permissionMap.get(permissionKey) ??
                    blankPermission(subjectType, subjectId, permissionKey);
                  return (
                    <tr key={`${subject}-${permissionKey}`}>
                      <td>
                        <strong>
                          {permissionKeyLabels[permissionKey]?.[language] ??
                            permissionKey}
                        </strong>
                        <span>{permissionKey}</span>
                      </td>
                      {permissionActionLabels.map(([key]) => (
                        <td key={key}>
                          <label className="admin-permission-check">
                            <input
                              checked={Number(permission[key]) === 1}
                              onChange={(event) =>
                                savePermission(permission, {
                                  [key]: event.target.checked ? 1 : 0,
                                } as Partial<PermissionRecord>)
                              }
                              type="checkbox"
                            />
                            <i />
                          </label>
                        </td>
                      ))}
                      <td>
                        <select
                          aria-label={isArabic ? "ظ†ط·ط§ظ‚ ط§ظ„ط¨ظٹط§ظ†ط§طھ" : "Data scope"}
                          className="admin-permission-scope"
                          onChange={(event) =>
                            savePermission(permission, {
                              data_scope: event.target
                                .value as PermissionRecord["data_scope"],
                            })
                          }
                          value={permission.data_scope}
                        >
                          {Object.entries(permissionScopeLabels).map(
                            ([value, label]) => (
                              <option key={value} value={value}>
                                {label[language]}
                              </option>
                            ),
                          )}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
            {filteredKeys.length === 0 ? (
              <tr>
                <td className="admin-empty" colSpan={9}>
                  {isArabic ? "ظ„ط§ طھظˆط¬ط¯ طµظ„ط§ط­ظٹط§طھ ظ…ط·ط§ط¨ظ‚ط©" : "No matching permissions"}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      ) : null}

      <div className="admin-permissions-footnote">
        <span>
          {isArabic
            ? "ط¢ط®ط± طھط¹ط¯ظٹظ„ ظ„ظ„طµظ„ط§ط­ظٹط§طھ ظƒط§ظ† ط¨طھط§ط±ظٹط®"
            : "Last permissions update was on"}
        </span>
        <strong>{latestPermissionsUpdate}</strong>
      </div>
    </section>
  );
}

export const PPT_BOOTH_LAYOUT = [
  { id: "FL1", left: 86.905, top: 20.73, width: 2.315, height: 3.254 },
  { id: "FL2", left: 86.905, top: 23.992, width: 2.315, height: 3.254 },
  { id: "FL3", left: 86.905, top: 27.255, width: 2.315, height: 3.254 },
  { id: "FL4", left: 86.905, top: 30.518, width: 2.315, height: 3.254 },
  { id: "FL5", left: 86.905, top: 33.781, width: 2.315, height: 3.254 },
  { id: "FL6", left: 86.905, top: 37.043, width: 2.315, height: 3.254 },
  { id: "FL7", left: 86.905, top: 40.306, width: 2.315, height: 3.254 },
  { id: "FL8", left: 86.905, top: 43.569, width: 2.315, height: 3.254 },
  { id: "FL9", left: 86.905, top: 46.832, width: 2.315, height: 3.254 },
  { id: "FL10", left: 86.905, top: 50.094, width: 2.315, height: 3.254 },
  { id: "FL11", left: 86.905, top: 53.357, width: 2.315, height: 3.254 },
  { id: "FL12", left: 86.905, top: 56.62, width: 2.315, height: 3.254 },
  { id: "FL13", left: 93.495, top: 56.62, width: 2.315, height: 3.254 },
  { id: "FL14", left: 93.495, top: 53.357, width: 2.315, height: 3.254 },
  { id: "FL15", left: 93.495, top: 50.094, width: 2.315, height: 3.254 },
  { id: "FL16", left: 93.495, top: 46.832, width: 2.315, height: 3.254 },
  { id: "FL17", left: 93.495, top: 43.569, width: 2.315, height: 3.254 },
  { id: "FL18", left: 93.495, top: 40.306, width: 2.315, height: 3.254 },
  { id: "FL19", left: 93.495, top: 37.043, width: 2.315, height: 3.254 },
  { id: "FL20", left: 93.495, top: 33.781, width: 2.315, height: 3.254 },
  { id: "FL21", left: 93.495, top: 30.518, width: 2.315, height: 3.254 },
  { id: "FL22", left: 93.495, top: 27.255, width: 2.315, height: 3.254 },
  { id: "FL23", left: 93.495, top: 23.992, width: 2.315, height: 3.254 },
  { id: "FL24", left: 93.495, top: 20.729, width: 2.315, height: 3.254 },
  { id: "IN1", left: 52.591, top: 77.768, width: 4.631, height: 9.674 },
  { id: "IN2", left: 60.255, top: 77.69, width: 6.174, height: 4.88 },
  { id: "IN3", left: 66.456, top: 77.69, width: 6.174, height: 4.88 },
  { id: "IN4", left: 75.717, top: 77.69, width: 6.174, height: 4.88 },
  { id: "IN5", left: 81.892, top: 77.69, width: 6.174, height: 4.88 },
  { id: "IN6", left: 88.066, top: 77.69, width: 6.174, height: 4.88 },
  { id: "IN7", left: 88.066, top: 82.561, width: 6.174, height: 4.88 },
  { id: "IN8", left: 81.892, top: 82.561, width: 6.174, height: 4.88 },
  { id: "IN9", left: 75.717, top: 82.561, width: 6.174, height: 4.88 },
  { id: "IN10", left: 66.456, top: 82.561, width: 6.174, height: 4.88 },
  { id: "IN11", left: 60.255, top: 82.561, width: 6.174, height: 4.88 },
  { id: "IN12", left: 52.591, top: 90.704, width: 4.631, height: 4.88 },
  { id: "IN13", left: 57.221, top: 90.704, width: 4.631, height: 4.88 },
  { id: "IN14", left: 61.852, top: 90.704, width: 4.631, height: 4.88 },
  { id: "IN15", left: 66.483, top: 90.704, width: 4.631, height: 4.88 },
  { id: "IN16", left: 71.113, top: 90.704, width: 4.631, height: 4.88 },
  { id: "IN17", left: 75.744, top: 90.704, width: 4.631, height: 4.88 },
  { id: "IN18", left: 80.375, top: 90.704, width: 4.631, height: 4.88 },
  { id: "IN19", left: 85.005, top: 90.704, width: 4.631, height: 4.88 },
  { id: "IN20", left: 89.643, top: 90.704, width: 4.631, height: 4.88 },
  { id: "M01", left: 41.786, top: 20.754, width: 4.631, height: 9.674 },
  { id: "M02", left: 41.786, top: 34.881, width: 4.631, height: 9.674 },
  { id: "M03", left: 41.786, top: 49.008, width: 4.631, height: 9.674 },
  { id: "M04", left: 41.786, top: 63.136, width: 4.631, height: 9.674 },
  { id: "M05", left: 31.543, top: 20.75, width: 4.638, height: 4.88 },
  { id: "M06", left: 31.546, top: 25.634, width: 4.631, height: 4.88 },
  { id: "M07", left: 31.546, top: 30.493, width: 4.631, height: 4.88 },
  { id: "M08", left: 30.774, top: 41.078, width: 6.174, height: 4.88 },
  { id: "M09", left: 30.775, top: 47.595, width: 6.174, height: 4.88 },
  { id: "M10", left: 31.54, top: 58.381, width: 4.631, height: 4.88 },
  { id: "M11", left: 31.54, top: 63.041, width: 4.631, height: 4.88 },
  { id: "M12", left: 31.54, top: 67.93, width: 4.631, height: 4.88 },
  { id: "M13", left: 26.916, top: 20.746, width: 4.631, height: 4.88 },
  { id: "M14", left: 26.913, top: 25.626, width: 4.631, height: 4.88 },
  { id: "M15", left: 26.916, top: 30.506, width: 4.631, height: 4.88 },
  { id: "M16", left: 26.916, top: 58.381, width: 4.631, height: 4.88 },
  { id: "M17", left: 26.916, top: 63.041, width: 4.631, height: 4.88 },
  { id: "M18", left: 26.91, top: 67.922, width: 4.631, height: 4.88 },
  { id: "M19", left: 17.654, top: 20.746, width: 4.631, height: 4.88 },
  { id: "M20", left: 17.652, top: 25.626, width: 4.631, height: 4.88 },
  { id: "M21", left: 17.654, top: 30.506, width: 4.631, height: 4.88 },
  { id: "M22", left: 17.654, top: 58.381, width: 4.631, height: 4.88 },
  { id: "M23", left: 17.652, top: 63.041, width: 4.631, height: 4.88 },
  { id: "M24", left: 17.652, top: 67.922, width: 4.631, height: 4.88 },
  { id: "M25", left: 13.035, top: 20.746, width: 4.631, height: 4.88 },
  { id: "M26", left: 13.035, top: 25.626, width: 4.631, height: 4.88 },
  { id: "M29", left: 13.035, top: 30.496, width: 4.631, height: 4.88 },
  { id: "M30", left: 13.035, top: 58.381, width: 4.631, height: 4.88 },
  { id: "M31", left: 13.035, top: 63.041, width: 4.631, height: 4.88 },
  { id: "M32", left: 13.035, top: 67.922, width: 4.631, height: 4.88 },
  { id: "M33", left: 4.19, top: 22.07, width: 6.174, height: 4.88 },
  { id: "M34", left: 4.19, top: 28.586, width: 6.174, height: 4.88 },
  { id: "RL1", left: 52.591, top: 20.831, width: 9.261, height: 4.88 },
  { id: "RL2", left: 69.57, top: 20.831, width: 9.261, height: 4.88 },
  { id: "RL3", left: 82.274, top: 20.73, width: 4.631, height: 4.88 },
  { id: "RL4", left: 82.274, top: 25.624, width: 4.631, height: 4.88 },
  { id: "RL5", left: 82.274, top: 30.519, width: 4.631, height: 4.88 },
  { id: "RL6", left: 82.274, top: 35.414, width: 4.631, height: 4.88 },
  { id: "RL7", left: 82.274, top: 40.309, width: 4.631, height: 4.88 },
  { id: "RL8", left: 82.274, top: 45.204, width: 4.631, height: 4.88 },
  { id: "RL9", left: 82.274, top: 50.098, width: 4.631, height: 4.88 },
  { id: "RL10", left: 82.274, top: 54.993, width: 4.631, height: 4.88 },
  { id: "RL13", left: 70.331, top: 50.113, width: 4.631, height: 4.88 },
  { id: "RL14", left: 70.331, top: 54.993, width: 4.631, height: 4.88 },
  { id: "RL15", left: 65.7, top: 50.113, width: 4.631, height: 4.88 },
  { id: "RL16", left: 65.7, top: 54.993, width: 4.631, height: 4.88 },
  { id: "RL19", left: 57.221, top: 61.85, width: 4.631, height: 4.88 },
  { id: "RL20", left: 57.221, top: 66.73, width: 4.631, height: 4.88 },
  { id: "RL21", left: 52.591, top: 61.85, width: 4.631, height: 4.88 },
  { id: "RL22", left: 52.591, top: 66.73, width: 4.631, height: 4.88 },
  { id: "RL23", left: 70.131, top: 66.73, width: 4.631, height: 4.88 },
  { id: "RL24", left: 65.5, top: 66.73, width: 4.631, height: 4.88 },
  { id: "RL25", left: 57.993, top: 54.993, width: 4.631, height: 4.88 },
  { id: "RL26", left: 53.362, top: 54.993, width: 4.631, height: 4.88 },
  { id: "RL27", left: 70.131, top: 61.85, width: 4.631, height: 4.88 },
  { id: "RL28", left: 65.5, top: 61.85, width: 4.631, height: 4.88 },
  { id: "RL29", left: 57.993, top: 50.113, width: 4.631, height: 4.88 },
  { id: "RL30", left: 53.362, top: 50.113, width: 4.631, height: 4.88 },
  { id: "RL31", left: 52.608, top: 40.108, width: 4.596, height: 4.88 },
  { id: "RL32", left: 52.608, top: 35.228, width: 4.596, height: 4.88 },
  { id: "RL33", left: 52.608, top: 30.348, width: 4.596, height: 4.88 },
  { id: "RL34", left: 61.87, top: 30.348, width: 4.595, height: 4.88 },
  { id: "RL35", left: 61.87, top: 35.228, width: 4.595, height: 4.88 },
  { id: "RL36", left: 61.87, top: 40.108, width: 4.595, height: 4.88 },
  { id: "GLASS HOUSE", left: 69.57, top: 30.165, width: 9.262, height: 16.267 },
  { id: "ACADEMY", left: 13.021, top: 38.648, width: 15.437, height: 16.267 },
  { id: "SB1", left: 4.958, top: 38.172, width: 2.26, height: 3.175 },
  { id: "SB2", left: 4.962, top: 42.017, width: 2.26, height: 3.176 },
  { id: "SB3", left: 4.962, top: 45.465, width: 2.26, height: 3.176 },
  { id: "SB4", left: 4.962, top: 48.913, width: 2.26, height: 3.176 },
  { id: "SB5", left: 4.962, top: 52.36, width: 2.26, height: 3.176 },
  { id: "SB6", left: 4.962, top: 55.808, width: 2.26, height: 3.176 },
  { id: "SB7", left: 4.962, top: 59.256, width: 2.26, height: 3.176 },
  { id: "SB8", left: 4.962, top: 62.703, width: 2.26, height: 3.176 },
  { id: "SB9", left: 4.962, top: 66.151, width: 2.26, height: 3.176 },
  { id: "1SB", left: 4.962, top: 69.599, width: 2.26, height: 3.176 },
  { id: "ST01", left: 78.957, top: 5.229, width: 7.718, height: 8.134 },
  { id: "ST02", left: 63.396, top: 5.229, width: 7.718, height: 8.134 },
  { id: "ST03", left: 27.894, top: 5.229, width: 7.718, height: 8.134 },
  { id: "ST04", left: 12.458, top: 5.229, width: 7.718, height: 8.134 },
  { id: "TP01", left: 44.582, top: 4.416, width: 9.261, height: 9.761 },
] as const;

export const FLOOR_MAP_AREA_LABELS = [
  { key: "traders", labelAr: "ط³ظˆظ‚ ط§ظ„طھط¬ط§ط±", labelEn: "Traders Market", left: 3.235, top: 16.719, width: 43.18, height: 4.486 },
  { key: "roasting", labelAr: "ظ…ظ†ط·ظ‚ط© ط§ظ„طھط­ظ…ظٹطµ", labelEn: "Roasting Area", left: 49.8, top: 16.719, width: 37.6, height: 4.237 },
  { key: "farmers", labelAr: "ط³ظˆظ‚ ظ…ط²ط§ط±ط¹ظٹظ† ط§ظ„ط¨ظ†", labelEn: "Coffee Farmers Market", left: 86.906, top: 19.21, width: 8.812, height: 42.352 },
  { key: "corridor-top", labelAr: "ظ…ظ…ط± 4m", labelEn: "Corridor 4m", left: 46.1, top: 14.3, width: 5.9, height: 4.7 },
  { key: "innovation", labelAr: "ط³ط§ط­ط© ط§ظ„ط§ط¨طھظƒط§ط±", labelEn: "Innovation Area", left: 52.464, top: 73.895, width: 43.309, height: 4.486 },
  { key: "stage", labelAr: "ط§ظ„ط³ط§ط­ط© ظˆط§ظ„ظ…ط³ط±ط­", labelEn: "Plaza & Stage", left: 3.235, top: 75.199, width: 43.355, height: 22.454 },
] as const;

export const FLOOR_MAP_ZONES = [
  { key: "all", labelAr: "ظƒظ„ ط§ظ„ط£ظ‚ط³ط§ظ…", labelEn: "All zones", left: 0, top: 0, width: 0, height: 0 },
  { key: "prefunction", labelAr: "ظ‚ط§ط¹ط© ظ…ط§ ظ‚ط¨ظ„ ط§ظ„ظپط¹ط§ظ„ظٹط©", labelEn: "Pre-Function Hall", left: 11.2, top: 4.6, width: 76.4, height: 9.2 },
  { key: "traders", labelAr: "ط³ظˆظ‚ ط§ظ„طھط¬ط§ط±", labelEn: "Traders Market", left: 3.0, top: 17.0, width: 47.8, height: 56.8 },
  { key: "roasting", labelAr: "ظ…ظ†ط·ظ‚ط© ط§ظ„طھط­ظ…ظٹطµ", labelEn: "Roasting Area", left: 49.8, top: 17.0, width: 37.6, height: 55.8 },
  { key: "farmers", labelAr: "ط³ظˆظ‚ ظ…ط²ط§ط±ط¹ظٹظ† ط§ظ„ط¨ظ†", labelEn: "Coffee Farmers Market", left: 88.8, top: 17.2, width: 6.8, height: 46.4 },
  { key: "innovation", labelAr: "ط³ط§ط­ط© ط§ظ„ط§ط¨طھظƒط§ط±", labelEn: "Innovation Area", left: 51.8, top: 74.2, width: 43.3, height: 22.4 },
  { key: "stage", labelAr: "ط§ظ„ط³ط§ط­ط© ظˆط§ظ„ظ…ط³ط±ط­", labelEn: "Plaza & Stage", left: 3.8, top: 75.6, width: 41.8, height: 21.0 },
] as const;

export function floorMapZoneForBooth(boothId: string) {
  if (boothId.startsWith("ST") || boothId.startsWith("TP")) return "prefunction";
  if (boothId.startsWith("M") || boothId === "ACADEMY" || boothId.startsWith("SB") || boothId.endsWith("SB")) return "traders";
  if (boothId.startsWith("RL") || boothId === "GLASS HOUSE") return "roasting";
  if (boothId.startsWith("FL")) return "farmers";
  if (boothId.startsWith("IN")) return "innovation";
  return "stage";
}

function boothPrefix(value: unknown) {
  return String(value ?? "").trim().toUpperCase().match(/^[A-Z]+/)?.[0] ?? "OTHER";
}

function boothSort(first: AdminRow, second: AdminRow) {
  return String(first.booth_number ?? "").localeCompare(
    String(second.booth_number ?? ""),
    "en",
    { numeric: true },
  );
}

function AdminBoothsSection({ isArabic }: { isArabic: boolean }) {
  const [booths, setBooths] = useState<AdminRow[]>([]);
  const [bookings, setBookings] = useState<AdminRow[]>([]);
  const [selectedBooth, setSelectedBooth] = useState<AdminRow | null>(null);
  const [draft, setDraft] = useState({
    booth_number: "",
    booth_size: "",
    booth_dimensions: "",
    booth_category: "",
    hall: "",
    location_zone: "",
    status: "available",
    notes: "",
  });
  const [query, setQuery] = useState("");
  const [activeZone, setActiveZone] = useState("all");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadBooths() {
    setIsLoading(true);
    setMessage("");
    try {
      const boothResponse = await fetch("/api/v1/data/booths", { cache: "no-store" });
      const boothPayload = await boothResponse.json().catch(() => ({}));
      if (!boothResponse.ok) throw new Error("LOAD_FAILED");
      setBooths(Array.isArray(boothPayload.data) ? boothPayload.data : []);
      void loadBoothBookings();
    } catch {
      setMessage(isArabic ? "طھط¹ط°ط± طھط­ظ…ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¨ظˆط«ط§طھ" : "Unable to load booths");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadBoothBookings() {
    try {
      const bookingResponse = await fetch("/api/v1/data/rental-booths", { cache: "no-store" });
      const bookingPayload = await bookingResponse.json().catch(() => ({}));
      if (bookingResponse.ok) {
        setBookings(Array.isArray(bookingPayload.data) ? bookingPayload.data : []);
      }
    } catch {
      setBookings([]);
    }
  }

  useEffect(() => {
    void loadBooths();
  }, []);

  const bookedByNumber = useMemo(() => {
    const map = new Map<string, AdminRow>();
    for (const booking of bookings) {
      const boothNumber = String(booking.booth_number ?? "").trim().toUpperCase();
      if (boothNumber) map.set(boothNumber, booking);
    }
    return map;
  }, [bookings]);

  const filteredBooths = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return [...booths].sort(boothSort);
    const exactQuery = query.trim().toUpperCase();
    const exactMatches = booths.filter(
      (booth) => String(booth.booth_number ?? "").trim().toUpperCase() === exactQuery,
    );
    if (exactMatches.length) return exactMatches.sort(boothSort);
    return booths
      .filter((booth) =>
        [
          booth.booth_number,
          booth.booth_size,
          booth.booth_dimensions,
          booth.booth_category,
          booth.hall,
          booth.location_zone,
          booth.notes,
        ].some((value) =>
          String(value ?? "").toLocaleLowerCase().includes(normalizedQuery),
        ),
      )
      .sort(boothSort);
  }, [booths, query]);

  const boothsByNumber = useMemo(() => {
    const map = new Map<string, AdminRow>();
    for (const booth of booths) {
      const boothNumber = String(booth.booth_number ?? "").trim().toUpperCase();
      if (boothNumber) map.set(boothNumber, booth);
    }
    return map;
  }, [booths]);
  const filteredBoothNumbers = useMemo(
    () =>
      new Set(
        filteredBooths.map((booth) =>
          String(booth.booth_number ?? "").trim().toUpperCase(),
        ),
      ),
    [filteredBooths],
  );
  const layoutBoothIds = useMemo(
    () => new Set<string>(PPT_BOOTH_LAYOUT.map((booth) => booth.id)),
    [],
  );
  const visibleLayoutBooths = useMemo(
    () => PPT_BOOTH_LAYOUT,
    [],
  );
  const unplacedBooths = useMemo(
    () =>
      filteredBooths.filter((booth) => {
        const boothNumber = String(booth.booth_number ?? "").trim().toUpperCase();
        return boothNumber && !layoutBoothIds.has(boothNumber);
      }),
    [filteredBooths, layoutBoothIds],
  );

  const selectedBooking = selectedBooth
    ? bookedByNumber.get(String(selectedBooth.booth_number ?? "").trim().toUpperCase())
    : null;
  const totalBooked = bookings.filter((booking) => String(booking.status ?? "") === "booked").length;
  const totalPendingPayment = bookings.filter((booking) => String(booking.status ?? "") === "pending_payment").length;
  const totalInactive = booths.filter((booth) => String(booth.status ?? "available") === "inactive").length;

  function selectBooth(booth: AdminRow) {
    setSelectedBooth(booth);
    setDraft({
      booth_number: String(booth.booth_number ?? ""),
      booth_size: String(booth.booth_size ?? ""),
      booth_dimensions: String(booth.booth_dimensions ?? ""),
      booth_category: String(booth.booth_category ?? ""),
      hall: String(booth.hall ?? ""),
      location_zone: String(booth.location_zone ?? ""),
      status: String(booth.status ?? "available"),
      notes: String(booth.notes ?? ""),
    });
    setMessage("");
  }

  function cancelBoothEdit() {
    setSelectedBooth(null);
    setDraft({
      booth_number: "",
      booth_size: "",
      booth_dimensions: "",
      booth_category: "",
      hall: "",
      location_zone: "",
      status: "available",
      notes: "",
    });
    setMessage("");
  }

  async function saveBooth() {
    if (!selectedBooth || isSaving) return;
    if (!draft.booth_number.trim()) {
      setMessage(isArabic ? "ط±ظ‚ظ… ط§ظ„ط¨ظˆط« ظ…ط·ظ„ظˆط¨" : "Booth number is required");
      return;
    }
    setIsSaving(true);
    setMessage(isArabic ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸..." : "Saving...");
    try {
      const response = await fetch(`/api/v1/data/booths/${selectedBooth.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          booth_number: draft.booth_number.trim().toUpperCase(),
          booth_size: draft.booth_size.trim() || null,
          booth_dimensions: draft.booth_dimensions.trim() || null,
          booth_category: draft.booth_category.trim() || null,
          hall: draft.hall.trim() || null,
          location_zone: draft.location_zone.trim() || null,
          status: draft.status,
          notes: draft.notes.trim() || null,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(payload.error ?? "SAVE_FAILED"));
      const nextBooth = {
        ...selectedBooth,
        ...(payload.data && typeof payload.data === "object" ? payload.data : {}),
      };
      setBooths((current) =>
        current.map((booth) => (Number(booth.id) === Number(nextBooth.id) ? nextBooth : booth)),
      );
      setSelectedBooth(nextBooth);
      setMessage(isArabic ? "طھظ… ط­ظپط¸ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¨ظˆط«" : "Booth saved");
      window.setTimeout(() => setMessage(""), 2200);
    } catch (error) {
      const code = error instanceof Error ? error.message : "SAVE_FAILED";
      const errorMessages: Record<string, { ar: string; en: string }> = {
        DUPLICATE_BOOTH_NUMBER: {
          ar: "ط±ظ‚ظ… ط§ظ„ط¨ظˆط« ظ…ط³طھط®ط¯ظ… ظ…ط³ط¨ظ‚ط§ظ‹",
          en: "Booth number is already used",
        },
        FORBIDDEN: {
          ar: "ظ„ط§ طھظˆط¬ط¯ طµظ„ط§ط­ظٹط© ظ„طھط¹ط¯ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¨ظˆط«",
          en: "You do not have permission to edit booth details",
        },
        VALIDATION_ERROR: {
          ar: "ط±ط§ط¬ط¹ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¨ظˆط« ظ‚ط¨ظ„ ط§ظ„ط­ظپط¸",
          en: "Review booth details before saving",
        },
      };
      const nextMessage = errorMessages[code] ?? {
        ar: "طھط¹ط°ط± ط­ظپط¸ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¨ظˆط«",
        en: "Unable to save booth",
      };
      setMessage(isArabic ? nextMessage.ar : nextMessage.en);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="admin-data-card admin-booths-page">
      <div className="admin-booths-head">
        <div>
          <span>{isArabic ? "ط¥ط¯ط§ط±ط© ط§ظ„ط¨ظˆط«ط§طھ" : "Booth Management"}</span>
          <h2>{isArabic ? "ط®ط±ظٹط·ط© ط§ظ„ط¨ظˆط«ط§طھ" : "Booth Layout"}</h2>
          <p>
            {isArabic
              ? "ط§ط®طھط± ط£ظٹ ط¨ظˆط« ظ…ظ† ط§ظ„ظ…ط®ط·ط· ظ„طھط¹ط¯ظٹظ„ ط±ظ‚ظ…ظ‡طŒ ظ…ظ‚ط§ط³ظ‡طŒ ط£ط¨ط¹ط§ط¯ظ‡طŒ ظ…ظˆظ‚ط¹ظ‡ ط£ظˆ ط­ط§ظ„طھظ‡."
              : "Select any booth from the layout to edit its number, size, dimensions, location, or status."}
          </p>
        </div>
        <div className="admin-booth-stats">
          <span>{booths.length.toLocaleString(NUMBER_LOCALE)} {isArabic ? "ط¨ظˆط«" : "booths"}</span>
          <span className="booked">{totalBooked.toLocaleString(NUMBER_LOCALE)} {isArabic ? "ظ…ط­ط¬ظˆط²" : "booked"}</span>
          <span className="pending-payment">{totalPendingPayment.toLocaleString(NUMBER_LOCALE)} {isArabic ? "بانتظار الدفع" : "pending"}</span>
          <span className="inactive">{totalInactive.toLocaleString(NUMBER_LOCALE)} {isArabic ? "ط؛ظٹط± ظ†ط´ط·" : "inactive"}</span>
          <div className="admin-booth-map-legend" aria-label={isArabic ? "ط¯ظ„ظٹظ„ ط£ظ„ظˆط§ظ† ط§ظ„ط¨ظˆط«ط§طھ" : "Booth color legend"}>
            <span>
              {isArabic ? "ظ…طھط§ط­" : "Available"}
              <i className="available" aria-hidden="true" />
            </span>
            <span>
              {isArabic ? "بانتظار الدفع" : "Pending payment"}
              <i className="pending-payment" aria-hidden="true" />
            </span>
            <span>
              {isArabic ? "ظ…ط­ط¬ظˆط²" : "Booked"}
              <i className="booked" aria-hidden="true" />
            </span>
            <span>
              {isArabic ? "ظ…ط®طھط§ط±" : "Selected"}
              <i className="selected" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>

      <div className="admin-booths-toolbar">
        <div className="admin-record-search-bar search-box">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <circle cx="10.8" cy="10.8" r="6.2" />
            <path d="m15.5 15.5 4 4" />
          </svg>
          <input
            aria-label={isArabic ? "ط§ظ„ط¨ط­ط« ظپظٹ ط§ظ„ط¨ظˆط«ط§طھ" : "Search booths"}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isArabic ? "ط§ط¨ط­ط« ط¨ط±ظ‚ظ… ط§ظ„ط¨ظˆط« ط£ظˆ ط§ظ„ظ…ظ†ط·ظ‚ط©..." : "Search booth number or zone..."}
            type="search"
            value={query}
          />
        </div>
        <div className="admin-booth-zone-filter" role="listbox" aria-label={isArabic ? "ظپظ„طھط±ط© ط§ظ„ط£ظ‚ط³ط§ظ…" : "Zone filter"}>
          {FLOOR_MAP_ZONES.filter((zone) => zone.key !== "stage").map((zone) => (
            <button
              aria-selected={activeZone === zone.key}
              className={activeZone === zone.key ? "active" : ""}
              key={zone.key}
              onClick={() => setActiveZone(zone.key)}
              type="button"
            >
              {isArabic ? zone.labelAr : zone.labelEn}
            </button>
          ))}
        </div>
        <button className="admin-action-btn" onClick={() => void loadBooths()} type="button">
          {isArabic ? "طھط­ط¯ظٹط«" : "Refresh"}
        </button>
      </div>

      <div className="admin-booths-workspace">
        <div className="admin-booths-layout" aria-busy={isLoading}>
          {isLoading ? (
            <div className="admin-booths-empty">{isArabic ? "ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„ط®ط±ظٹط·ط©..." : "Loading layout..."}</div>
          ) : visibleLayoutBooths.length ? (
            <>
              <div className="admin-floor-map-canvas">
                <div className="admin-floor-map-label top" dir={isArabic ? "rtl" : "ltr"}>
                  {isArabic ? "ظ‚ط§ط¹ط© ظ…ط§ ظ‚ط¨ظ„ ط§ظ„ظپط¹ط§ظ„ظٹط©" : "Pre-Function Hall"}
                </div>
                <div className="admin-floor-map-label entrance">{isArabic ? "ط¨ظˆط§ط¨ط© ط§ظ„ط¯ط®ظˆظ„" : "Entrance"}</div>
                <div className="admin-floor-map-label exit">{isArabic ? "ط¨ظˆط§ط¨ط© ط§ظ„ط®ط±ظˆط¬" : "Exit"}</div>
                {FLOOR_MAP_ZONES.filter((zone) => zone.key !== "all").map((zone) => (
                  <div
                    className={`admin-floor-zone-container ${zone.key} ${activeZone === zone.key ? "is-focused" : ""} ${activeZone !== "all" && activeZone !== zone.key ? "is-dimmed" : ""}`}
                    key={zone.key}
                    style={{
                      left: `${zone.left}%`,
                      top: `${zone.top}%`,
                      width: `${zone.width}%`,
                      height: `${zone.height}%`,
                    }}
                  />
                ))}
                {FLOOR_MAP_AREA_LABELS.map((area) => (
                  <div
                    className={`admin-floor-map-area-label ${area.key}`}
                    dir={isArabic ? "rtl" : "ltr"}
                    key={area.key}
                    style={{
                      left: `${area.left}%`,
                      top: `${area.top}%`,
                      width: `${area.width}%`,
                      height: `${area.height}%`,
                    }}
                  >
                    {isArabic ? area.labelAr : area.labelEn}
                  </div>
                ))}
                {visibleLayoutBooths.map((layoutBooth) => {
                  const layoutZone = floorMapZoneForBooth(layoutBooth.id);
                  const hasSearch = Boolean(query.trim());
                  const isSearchMatch = filteredBoothNumbers.has(layoutBooth.id);
                  const booth = boothsByNumber.get(layoutBooth.id);
                  const isMissing = !booth;
                  const bookingStatus = String(bookedByNumber.get(layoutBooth.id)?.status ?? "");
                  const isPendingPayment = bookingStatus === "pending_payment";
                  const isBooked = bookingStatus === "booked";
                  const isInactive = String(booth?.status ?? "available") === "inactive";
                  const isSelected = booth && Number(selectedBooth?.id) === Number(booth.id);
                  const isFeatureArea = layoutBooth.id === "ACADEMY" || layoutBooth.id === "GLASS HOUSE";
                  const boothMapLabel =
                    layoutBooth.id === "ACADEMY"
                      ? isArabic
                        ? "ط§ظ„ط£ظƒط§ط¯ظٹظ…ظٹط©"
                        : "Academy"
                      : layoutBooth.id === "GLASS HOUSE"
                        ? isArabic
                          ? "ط¬ظ„ط§ط³ ظ‡ط§ظˆط³"
                          : "Glass House"
                        : layoutBooth.id;
                  const boothMapSize = String(
                    booth?.booth_size ?? booth?.booth_dimensions ?? "",
                  ).trim();
                  return (
                    <button
                      className={`admin-booth-map-tile ${isFeatureArea ? "is-feature-area" : ""} ${hasSearch && !isSearchMatch ? "is-search-dimmed" : ""} ${hasSearch && isSearchMatch ? "is-search-match" : ""} ${activeZone !== "all" && activeZone !== layoutZone ? "is-zone-dimmed" : ""} ${activeZone === layoutZone ? "is-zone-focused" : ""} ${isPendingPayment ? "is-pending-payment" : ""} ${isBooked ? "is-booked" : ""} ${isInactive ? "is-inactive" : ""} ${isSelected ? "is-selected" : ""} ${isMissing ? "is-missing" : ""}`}
                      disabled={isMissing}
                      dir="ltr"
                      key={layoutBooth.id}
                      onClick={() => booth && selectBooth(booth)}
                      style={{
                        left: `${layoutBooth.left}%`,
                        top: `${layoutBooth.top}%`,
                        width: `${layoutBooth.width}%`,
                        height: `${layoutBooth.height}%`,
                      }}
                      title={layoutBooth.id}
                      type="button"
                    >
                      <strong>{boothMapLabel}</strong>
                      {boothMapSize ? <span>{boothMapSize}</span> : null}
                    </button>
                  );
                })}
              </div>
              {unplacedBooths.length ? (
                <section className="admin-unplaced-booths">
                  <div className="admin-booth-zone-title">
                    <strong>{isArabic ? "ط¨ظˆط«ط§طھ ط®ط§ط±ط¬ ط§ظ„ط®ط±ظٹط·ط©" : "Unplaced booths"}</strong>
                    <span>{unplacedBooths.length.toLocaleString(NUMBER_LOCALE)}</span>
                  </div>
                  <div className="admin-booth-buttons">
                    {unplacedBooths.map((booth) => {
                      const boothNumber = String(booth.booth_number ?? "").trim().toUpperCase();
                      const bookingStatus = String(bookedByNumber.get(boothNumber)?.status ?? "");
                      const isPendingPayment = bookingStatus === "pending_payment";
                      const isBooked = bookingStatus === "booked";
                      const isInactive = String(booth.status ?? "available") === "inactive";
                      const isSelected = Number(selectedBooth?.id) === Number(booth.id);
                      return (
                        <button
                          className={`admin-booth-tile ${isPendingPayment ? "is-pending-payment" : ""} ${isBooked ? "is-booked" : ""} ${isInactive ? "is-inactive" : ""} ${isSelected ? "is-selected" : ""}`}
                          key={booth.id}
                          onClick={() => selectBooth(booth)}
                          type="button"
                        >
                          <strong>{boothNumber}</strong>
                          <span>{String(booth.booth_dimensions ?? booth.booth_size ?? "")}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}
            </>
          ) : (
            <div className="admin-booths-empty">{isArabic ? "ظ„ط§ طھظˆط¬ط¯ ط¨ظˆط«ط§طھ ظ…ط·ط§ط¨ظ‚ط©" : "No matching booths"}</div>
          )}
        </div>

        <aside className="admin-booth-editor">
          {selectedBooth ? (
            <>
              <div className="admin-booth-editor-head">
                <div>
                  <span>{isArabic ? "ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¨ظˆط«" : "Booth Details"}</span>
                  <h3>{String(selectedBooth.booth_number ?? "")}</h3>
                </div>
                <span className={`admin-booth-status ${selectedBooking ? "booked" : String(draft.status)}`}>
                  {selectedBooking
                    ? isArabic ? "ظ…ط­ط¬ظˆط²" : "Booked"
                    : draft.status === "inactive"
                      ? isArabic ? "ط؛ظٹط± ظ†ط´ط·" : "Inactive"
                      : isArabic ? "ظ…طھط§ط­" : "Available"}
                </span>
              </div>
              {selectedBooking ? (
                <div className="admin-booth-booking-note">
                  <strong>{isArabic ? "ظ…ط±طھط¨ط· ط¨ط¹ظ‚ط¯" : "Linked contract"}</strong>
                  <span>
                    {String(selectedBooking.contract_number ?? selectedBooking.company_name ?? selectedBooking.rental_contract_id ?? "â€”")}
                  </span>
                </div>
              ) : null}
              <div className="admin-booth-form">
                {[
                  ["booth_number", isArabic ? "ط±ظ‚ظ… ط§ظ„ط¨ظˆط«" : "Booth number"],
                  ["booth_size", isArabic ? "ط§ظ„ظ…ط³ط§ط­ط©" : "Size"],
                  ["booth_dimensions", isArabic ? "ط£ط¨ط¹ط§ط¯ ط§ظ„ط¨ظˆط«" : "Dimensions"],
                  ["booth_category", isArabic ? "ط§ظ„ظپط¦ط©" : "Category"],
                  ["hall", isArabic ? "ط§ظ„ظ‚ط§ط¹ط©" : "Hall"],
                  ["location_zone", isArabic ? "ط§ظ„ظ…ظ†ط·ظ‚ط©" : "Zone"],
                ].map(([field, label]) => (
                  <label key={field}>
                    <span>{label}</span>
                    <input
                      dir={field === "booth_number" || field === "booth_size" || field === "booth_dimensions" ? "ltr" : undefined}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, [field]: event.target.value }))
                      }
                      value={draft[field as keyof typeof draft]}
                    />
                  </label>
                ))}
                <label>
                  <span>{isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"}</span>
                  <select
                    className="admin-basic-select"
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, status: event.target.value }))
                    }
                    value={draft.status}
                  >
                    <option value="available">{isArabic ? "ظ…طھط§ط­" : "Available"}</option>
                    <option value="inactive">{isArabic ? "ط؛ظٹط± ظ†ط´ط·" : "Inactive"}</option>
                  </select>
                </label>
                <label className="admin-booth-notes">
                  <span>{isArabic ? "ظ…ظ„ط§ط­ط¸ط§طھ" : "Notes"}</span>
                  <textarea
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, notes: event.target.value }))
                    }
                    value={draft.notes}
                  />
                </label>
              </div>
              {message ? <p className="admin-booth-message">{message}</p> : null}
              <div className="admin-edit-actions">
                <button className="secondary" onClick={cancelBoothEdit} type="button">
                  {isArabic ? "ط¥ظ„ط؛ط§ط، ط§ظ„طھط¹ط¯ظٹظ„" : "Reset"}
                </button>
                <button className="primary" disabled={isSaving} onClick={() => void saveBooth()} type="button">
                  {isSaving ? (isArabic ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸..." : "Saving...") : (isArabic ? "ط­ظپط¸ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¨ظˆط«" : "Save booth")}
                </button>
              </div>
            </>
          ) : (
            <div className="admin-booth-editor-empty">
              <strong>{isArabic ? "ط§ط®طھط± ط¨ظˆط« ظ…ظ† ط§ظ„ط®ط±ظٹط·ط©" : "Select a booth"}</strong>
              <span>{isArabic ? "ط³طھط¸ظ‡ط± ط¨ظٹط§ظ†ط§طھظ‡ ظ‡ظ†ط§ ظ„ظ„طھط¹ط¯ظٹظ„." : "Its details will appear here for editing."}</span>
              {message ? <p className="admin-booth-message">{message}</p> : null}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function AdminManagementSection({
  section,
  data,
  error,
  isArabic,
  onReload,
  onRowUpdated,
}: {
  section: Exclude<AdminSection, "dashboard">;
  data: ManagementData | null;
  error: string;
  isArabic: boolean;
  onReload: () => void;
  onRowUpdated: (resource: "tickets", row: AdminRow) => void;
}) {
  const [query, setQuery] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("all");
  const [isTicketAdvancedFilter, setIsTicketAdvancedFilter] = useState(false);
  const [editingTicket, setEditingTicket] = useState<AdminRow | null>(null);
  const [timelineTicket, setTimelineTicket] = useState<AdminRow | null>(null);
  const [ticketDraft, setTicketDraft] = useState({ status: "open", notes: "" });
  const [ticketEditMessage, setTicketEditMessage] = useState("");
  const [isTicketSaving, setIsTicketSaving] = useState(false);
  const [editingTicketType, setEditingTicketType] = useState<AdminRow | null>(null);
  const [isTicketTypesMenuOpen, setIsTicketTypesMenuOpen] = useState(false);
  const [isTicketTypeModalOpen, setIsTicketTypeModalOpen] = useState(false);
  const [ticketTypeDraft, setTicketTypeDraft] = useState({
    name_ar: "",
    name_en: "",
    description: "",
    status: "active",
    sort_order: "0",
  });
  const [ticketTypeMessage, setTicketTypeMessage] = useState("");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminRow | null>(null);
  const [editingIndustry, setEditingIndustry] = useState<AdminRow | null>(null);
  const [isIndustryModalOpen, setIsIndustryModalOpen] = useState(false);
  const [industryDraft, setIndustryDraft] = useState({
    name: "",
    name_en: "",
    slug: "",
    description: "",
    status: "active",
  });
  const [industryMessage, setIndustryMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    resource: "products" | "industries" | "marketing-assets" | "users";
    row: AdminRow;
  } | null>(null);
  const [productDraft, setProductDraft] = useState({
    name: "",
    name_en: "",
    slug: "",
    description: "",
    base_price: "",
    currency: "SAR",
    status: "active",
  });
  const [productMessage, setProductMessage] = useState("");
  const [contentUploadTitle, setContentUploadTitle] = useState("");
  const [contentUploadDescription, setContentUploadDescription] = useState("");
  const [contentUploadMessage, setContentUploadMessage] = useState("");
  const [contentUploadFileName, setContentUploadFileName] = useState("");
  const contentUploadFileRef = useRef<HTMLInputElement | null>(null);
  const [editingContentRow, setEditingContentRow] = useState<AdminRow | null>(null);
  const [contentEditDraft, setContentEditDraft] = useState({
    title: "",
    status: "active",
  });
  const [contentEditMessage, setContentEditMessage] = useState("");
  const [landingBrochure, setLandingBrochure] = useState<LandingBrochure | null>(null);
  const [landingPageUrl, setLandingPageUrl] = useState("");
  const [landingBrochureMessage, setLandingBrochureMessage] = useState("");
  const [isLandingPreviewOpen, setIsLandingPreviewOpen] = useState(false);
  const [isLandingDeleteConfirmOpen, setIsLandingDeleteConfirmOpen] = useState(false);
  const landingBrochureFileRef = useRef<HTMLInputElement | null>(null);
  const managementData = data ?? EMPTY_MANAGEMENT_DATA;
  const landingBrochurePreviewUrl = "/api/v1/landing-brochure#toolbar=1&navpanes=0";
  const canPreviewLandingBrochure =
    Boolean(landingBrochure?.url) && !landingBrochure?.isDefault;

  useEffect(() => {
    if (section !== "content") return;
    void loadLandingBrochure();
  }, [section]);

  useEffect(() => {
    if (!isLandingPreviewOpen && !isLandingDeleteConfirmOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsLandingPreviewOpen(false);
      if (event.key === "Escape") setIsLandingDeleteConfirmOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLandingPreviewOpen, isLandingDeleteConfirmOpen]);

  useEffect(() => {
    if (section !== "tickets") return;
    const controls = document.querySelectorAll<HTMLElement>(
      [
        ".service-ticket-filter-v2",
        ".service-ticket-status-v2",
        ".service-ticket-status-v2 .dashboard-select",
        ".service-ticket-status-v2 .dashboard-select-trigger",
        ".service-ticket-types-v2",
        ".service-ticket-types-v2 > .btn-types",
      ].join(", "),
    );
    controls.forEach((control) => {
      control.style.setProperty("flex", "0 0 166px", "important");
      control.style.setProperty("inline-size", "166px", "important");
      control.style.setProperty("width", "166px", "important");
      control.style.setProperty("min-width", "166px", "important");
      control.style.setProperty("max-width", "166px", "important");
      control.style.setProperty("box-sizing", "border-box", "important");
    });
  }, [section, ticketStatusFilter, isTicketTypesMenuOpen]);

  const configs = {
    tickets: {
      rows: managementData.tickets,
      columns: [
        ["ticket_number", isArabic ? "ط±ظ‚ظ… ط§ظ„طھط°ظƒط±ط©" : "Ticket Number"],
        ["subject", isArabic ? "ط§ظ„ظ…ظˆط¶ظˆط¹" : "Subject"],
        ["category", isArabic ? "ط§ظ„طھطµظ†ظٹظپ" : "Category"],
        ["details", isArabic ? "طھظپط§طµظٹظ„ ط§ظ„طھط°ظƒط±ط©" : "Ticket Details"],
        ["notes", isArabic ? "ط§ظ„ظ…ظ„ط§ط­ط¸ط§طھ" : "Notes"],
        ["status", isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"],
        ["user_name", isArabic ? "ط§ظ„ظ…ط³طھط®ط¯ظ…" : "User"],
        ["created_at", isArabic ? "طھط§ط±ظٹط® ط§ظ„ط¥ظ†ط´ط§ط،" : "Created Date"],
      ],
    },
    accounts: {
      rows: managementData.users,
      columns: [
        ["name", isArabic ? "ط§ظ„ط§ط³ظ…" : "Name"],
        ["email", isArabic ? "ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ" : "Email"],
        ["role", isArabic ? "ط§ظ„طµظ„ط§ط­ظٹط©" : "Role"],
        ["status", isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"],
        ["last_login_at", isArabic ? "ط¢ط®ط± ط¯ط®ظˆظ„" : "Last Login"],
      ],
    },
    products: {
      rows: managementData.products,
      columns: [
        [isArabic ? "name" : "name_en", isArabic ? "ط§ظ„ظ…ظ†طھط¬" : "Product"],
        ["slug", isArabic ? "ط§ظ„ط±ظ…ط²" : "Slug"],
        ["base_price", isArabic ? "ط§ظ„ط³ط¹ط±" : "Price"],
        ["currency", isArabic ? "ط§ظ„ط¹ظ…ظ„ط©" : "Currency"],
        ["status", isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"],
      ],
    },
    activity: {
      rows: managementData.industries,
      columns: [
        [isArabic ? "name" : "name_en", isArabic ? "ط§ط³ظ… ط§ظ„ظ†ط´ط§ط·" : "Industry"],
        ["slug", isArabic ? "ط§ظ„ط±ظ…ط²" : "Slug"],
        ["description", isArabic ? "ط§ظ„ظˆطµظپ" : "Description"],
        ["status", isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"],
        ["created_at", isArabic ? "طھط§ط±ظٹط® ط§ظ„ط¥ط¶ط§ظپط©" : "Created Date"],
      ],
    },
    content: {
      rows: managementData.content,
      columns: [
        ["title", isArabic ? "ط§ظ„ط¹ظ†ظˆط§ظ†" : "Title"],
        ["asset_type", isArabic ? "ظ†ظˆط¹ ط§ظ„ظ…ط­طھظˆظ‰" : "Content Type"],
        ["status", isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"],
        ["created_at", isArabic ? "طھط§ط±ظٹط® ط§ظ„ط¥ط¶ط§ظپط©" : "Created Date"],
      ],
    },
  } satisfies Record<
    Exclude<AdminSection, "dashboard" | "permissions" | "tags" | "booths">,
    { rows: AdminRow[]; columns: string[][] }
  >;
  const config =
    section === "content"
      ? {
          rows: managementData.content,
          columns: [
            ["title", isArabic ? "ط§ط³ظ… ط§ظ„ظ…ظ„ظپ" : "File Name"],
            ["original_name", isArabic ? "ط§ظ„ظ…ظ„ظپ ط§ظ„ط£طµظ„ظٹ" : "Original File"],
            ["asset_type", isArabic ? "ط§ظ„ظ†ظˆط¹" : "Type"],
            ["file_size", isArabic ? "ط§ظ„ط­ط¬ظ…" : "Size"],
            ["status", isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"],
            ["created_at", isArabic ? "طھط§ط±ظٹط® ط§ظ„ط±ظپط¹" : "Upload Date"],
          ],
        }
      : configs[section as Exclude<AdminSection, "dashboard" | "permissions" | "tags" | "booths">] ?? {
          rows: [],
          columns: [],
        };
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleRows = normalizedQuery
    ? config.rows.filter((row) =>
        Object.values(row).some((value) =>
          String(value ?? "")
            .toLocaleLowerCase()
            .includes(normalizedQuery),
        ),
      )
    : config.rows;
  const ticketAdvancedRows = useMemo(
    () =>
      section === "tickets" && isTicketAdvancedFilter
        ? visibleRows.filter((row) =>
            ["open", "in_progress", "pending"].includes(
              String(row.status ?? "open"),
            ),
          )
        : visibleRows,
    [isTicketAdvancedFilter, section, visibleRows],
  );
  const filteredRows = useMemo(
    () =>
      section === "tickets" && ticketStatusFilter !== "all"
        ? ticketAdvancedRows.filter(
            (row) => String(row.status ?? "open") === ticketStatusFilter,
          )
        : ticketAdvancedRows,
    [section, ticketAdvancedRows, ticketStatusFilter],
  );
  const usersById = useMemo(
    () =>
      new Map(
        managementData.users.map((user) => [
          Number(user.id),
          String(user.name ?? user.email ?? "").trim(),
        ]),
      ),
    [managementData.users],
  );

  if (section === "permissions") {
    return <AdminPermissionsSection isArabic={isArabic} />;
  }

  if (section === "tags") {
    return <AdminTagsSection data={managementData} isArabic={isArabic} onReload={onReload} />;
  }

  if (section === "booths") {
    return <AdminBoothsSection isArabic={isArabic} />;
  }

  if (!data)
    return (
      <section className="admin-data-card admin-loading">
        <span>
          {error || (isArabic ? "ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ..." : "Loading data...")}
        </span>
        {error ? (
          <button className="admin-action-btn" onClick={onReload}>
            {isArabic ? "ط¥ط¹ط§ط¯ط© ط§ظ„ظ…ط­ط§ظˆظ„ط©" : "Retry"}
          </button>
        ) : null}
      </section>
    );

  function getTicketUserName(row: AdminRow) {
    const directName = String(row.user_name ?? row.affiliate_user_name ?? "").trim();
    if (directName) return directName;
    const userId = Number(row.user_id);
    const userName = usersById.get(userId);
    if (userName) return userName;
    return userId ? `User #${userId}` : "â€”";
  }

  function openTicketEditor(ticket: AdminRow) {
    setEditingTicket(ticket);
    setTicketDraft({
      status: String(ticket.status ?? "open"),
      notes: String(ticket.notes ?? ""),
    });
    setTicketEditMessage("");
  }

  function openTicketTypeEditor(ticketType?: AdminRow) {
    setEditingTicketType(ticketType ?? null);
    setIsTicketTypeModalOpen(true);
    setTicketTypeDraft({
      name_ar: String(ticketType?.name_ar ?? ""),
      name_en: String(ticketType?.name_en ?? ""),
      description: String(ticketType?.description ?? ""),
      status: String(ticketType?.status ?? "active"),
      sort_order: String(ticketType?.sort_order ?? "0"),
    });
    setTicketTypeMessage("");
  }

  async function saveTicketType() {
    if (!ticketTypeDraft.name_ar.trim() || !ticketTypeDraft.name_en.trim()) {
      setTicketTypeMessage(
        isArabic ? "ط£ط¯ط®ظ„ ط§ط³ظ… ط§ظ„ظ†ظˆط¹ ط¨ط§ظ„ط¹ط±ط¨ظٹ ظˆط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ" : "Enter the Arabic and English type names",
      );
      return;
    }
    setTicketTypeMessage(isArabic ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸..." : "Saving...");
    try {
      const response = await fetch(
        editingTicketType
          ? `/api/v1/data/support-ticket-types/${editingTicketType.id}`
          : "/api/v1/data/support-ticket-types",
        {
          method: editingTicketType ? "PUT" : "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            ...ticketTypeDraft,
            sort_order: Number(ticketTypeDraft.sort_order || 0),
          }),
        },
      );
      if (!response.ok) throw new Error("SAVE_FAILED");
      setIsTicketTypeModalOpen(false);
      setEditingTicketType(null);
      setTicketTypeDraft({
        name_ar: "",
        name_en: "",
        description: "",
        status: "active",
        sort_order: "0",
      });
      setTicketTypeMessage("");
      onReload();
    } catch {
      setTicketTypeMessage(
        isArabic ? "طھط¹ط°ط± ط­ظپط¸ ظ†ظˆط¹ ط§ظ„طھط°ظƒط±ط©" : "Unable to save ticket type",
      );
    }
  }

  const savedTicketTimelineEvents = timelineTicket
    ? (managementData.ticketEvents ?? [])
        .filter((event) => Number(event.ticket_id) === Number(timelineTicket.id))
        .sort(
          (first, second) =>
            new Date(String(first.created_at ?? "")).getTime() -
            new Date(String(second.created_at ?? "")).getTime(),
        )
    : [];
  const ticketTimelineEvents =
    timelineTicket && savedTicketTimelineEvents.length === 0
      ? [
          {
            id: `created-${timelineTicket.id}`,
            ticket_id: timelineTicket.id,
            event_type: "created",
            note: String(timelineTicket.subject ?? ""),
            created_at: timelineTicket.created_at,
          },
          ...(String(timelineTicket.notes ?? "").trim()
            ? [
                {
                  id: `note-${timelineTicket.id}`,
                  ticket_id: timelineTicket.id,
                  event_type: "admin_note",
                  note: String(timelineTicket.notes ?? ""),
                  created_at: timelineTicket.created_at,
                },
              ]
            : []),
          {
            id: `status-${timelineTicket.id}`,
            ticket_id: timelineTicket.id,
            event_type: "status_changed",
            new_status: String(timelineTicket.status ?? ""),
            created_at: timelineTicket.created_at,
          },
        ]
      : savedTicketTimelineEvents;

  function ticketEventTitle(event: Record<string, unknown>) {
    const type = String(event.event_type ?? "");
    if (type === "created")
      return isArabic ? "طھظ… ط¥ظ†ط´ط§ط، ط§ظ„طھط°ظƒط±ط©" : "Ticket Created";
    if (type === "status_changed")
      return isArabic ? "طھظ… طھط؛ظٹظٹط± ط§ظ„ط­ط§ظ„ط©" : "Status Changed";
    if (type === "admin_note")
      return isArabic ? "ط£ط¶ظٹظپطھ ظ…ظ„ط§ط­ط¸ط© ط£ط¯ظ…ظ†" : "Admin Note Added";
    return isArabic ? "ط­ط±ظƒط© ط¹ظ„ظ‰ ط§ظ„طھط°ظƒط±ط©" : "Ticket Activity";
  }

  function ticketEventDescription(event: Record<string, unknown>) {
    const type = String(event.event_type ?? "");
    if (type === "status_changed") {
      const oldStatus = String(event.old_status ?? "");
      const newStatus = String(event.new_status ?? "");
      if (!oldStatus) return displayAdminValue(newStatus, isArabic);
      const arrow = isArabic ? "\u2190" : "\u2192";
      return `${displayAdminValue(oldStatus, isArabic)} ${arrow} ${displayAdminValue(newStatus, isArabic)}`;
    }
    return String(event.note ?? "");
  }

  async function saveTicket() {
    if (!editingTicket || isTicketSaving) return;
    const nextNotes = ticketDraft.notes.trim() || null;
    const fallbackTicket = {
      ...editingTicket,
      status: ticketDraft.status,
      notes: nextNotes,
    };
    setIsTicketSaving(true);
    setTicketEditMessage(isArabic ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸..." : "Saving...");
    try {
      const response = await fetch(
        `/api/v1/data/support-tickets/${editingTicket.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            status: ticketDraft.status,
            notes: nextNotes,
          }),
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(payload.error ?? "SAVE_FAILED"));
      const updatedTicket = {
        ...fallbackTicket,
        ...(payload.data && typeof payload.data === "object" ? payload.data : {}),
      };
      onRowUpdated("tickets", updatedTicket);
      setTimelineTicket((current) =>
        current && Number(current.id) === Number(updatedTicket.id)
          ? { ...current, ...updatedTicket }
          : current,
      );
      setEditingTicket(null);
      setTicketEditMessage("");
      window.setTimeout(() => onReload(), 200);
    } catch (error) {
      setTicketEditMessage(
        error instanceof Error && error.message === "FORBIDDEN"
          ? isArabic
            ? "ظ„ظٹط³طھ ظ„ط¯ظٹظƒ طµظ„ط§ط­ظٹط© طھط¹ط¯ظٹظ„ ط§ظ„طھط°ظƒط±ط©"
            : "You do not have permission to edit this ticket"
          : isArabic
            ? "طھط¹ط°ط± ط­ظپط¸ ط§ظ„طھط°ظƒط±ط©"
            : "Unable to save ticket",
      );
    } finally {
      setIsTicketSaving(false);
    }
  }

  async function updateTicketStatus(ticket: AdminRow, status: string) {
    const fallbackTicket = { ...ticket, status };
    try {
      const response = await fetch(`/api/v1/data/support-tickets/${ticket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          status,
          notes: ticket.notes ?? null,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(payload.error ?? "SAVE_FAILED"));
      const updatedTicket = {
        ...fallbackTicket,
        ...(payload.data && typeof payload.data === "object" ? payload.data : {}),
      };
      onRowUpdated("tickets", updatedTicket);
      setTimelineTicket((current) =>
        current && Number(current.id) === Number(updatedTicket.id)
          ? { ...current, ...updatedTicket }
          : current,
      );
      window.setTimeout(() => onReload(), 200);
    } catch {
      setTicketEditMessage(
        isArabic ? "طھط¹ط°ط± طھط­ط¯ظٹط« ط§ظ„طھط°ظƒط±ط©" : "Unable to update ticket",
      );
    }
  }

  async function saveProduct() {
    if (
      !productDraft.name.trim() ||
      !productDraft.name_en.trim() ||
      !productDraft.slug.trim() ||
      !productDraft.base_price
    ) {
      setProductMessage(
        isArabic
          ? "ط£ط¯ط®ظ„ ط§ط³ظ… ط§ظ„ظ…ظ†طھط¬ ظˆط§ظ„ط±ظ…ط² ظˆط§ظ„ط³ط¹ط±"
          : "Enter the Arabic and English product names, code, and price",
      );
      return;
    }
    setProductMessage(isArabic ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸..." : "Saving...");
    try {
      const response = await fetch(
        editingProduct
          ? `/api/v1/data/products/${editingProduct.id}`
          : "/api/v1/data/products",
        {
          method: editingProduct ? "PUT" : "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            ...productDraft,
            base_price: Number(productDraft.base_price),
          }),
        },
      );
      if (!response.ok) throw new Error("SAVE_FAILED");
      setIsProductModalOpen(false);
      setEditingProduct(null);
      onReload();
    } catch {
      setProductMessage(
        isArabic ? "طھط¹ط°ط± ط¥ط¶ط§ظپط© ط§ظ„ظ…ظ†طھط¬" : "Unable to add the product",
      );
    }
  }

  function openProductEditor(product: AdminRow) {
    setEditingProduct(product);
    setProductMessage("");
    setProductDraft({
      name: String(product.name ?? ""),
      name_en: String(product.name_en ?? ""),
      slug: String(product.slug ?? ""),
      description: String(product.description ?? ""),
      base_price: String(product.base_price ?? ""),
      currency: String(product.currency ?? "SAR"),
      status: String(product.status ?? "active"),
    });
    setIsProductModalOpen(true);
  }

  function requestProductDeletion(product: AdminRow) {
    setDeleteTarget({ resource: "products", row: product });
  }

  function requestIndustryDeletion(industry: AdminRow) {
    setDeleteTarget({ resource: "industries", row: industry });
  }

  function requestMarketingAssetDeletion(asset: AdminRow) {
    setDeleteTarget({ resource: "marketing-assets", row: asset });
  }

  function requestUserDeletion(user: AdminRow) {
    setDeleteTarget({ resource: "users", row: user });
  }

  async function confirmDeletion() {
    if (!deleteTarget) return;
    try {
      const response = await fetch(
        deleteTarget.resource === "users"
          ? `/api/v1/admin/users/${deleteTarget.row.id}`
          : `/api/v1/data/${deleteTarget.resource}/${deleteTarget.row.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "DELETE_FAILED");
      }
      setDeleteTarget(null);
      onReload();
    } catch (error) {
      if (error instanceof Error && error.message === "PRODUCT_IN_USE") {
        window.alert(
          isArabic
            ? "ظ„ط§ ظٹظ…ظƒظ† ط­ط°ظپ ط§ظ„ظ…ظ†طھط¬ ظ„ط£ظ†ظ‡ ظ…ط±طھط¨ط· ط¨ط·ظ„ط¨ط§طھ طھط¬ط±ظٹط¨ظٹط© ط£ظˆ ط¹ط±ظˆط¶ ط£ط³ط¹ط§ط± ط£ظˆ ظ…ط¨ظٹط¹ط§طھ."
            : "This product cannot be deleted because it is linked to demos, quotes, or sales.",
        );
        return;
      }
      if (error instanceof Error && error.message === "DEFAULT_ADMIN_PROTECTED") {
        window.alert(
          isArabic
            ? "ظ„ط§ ظٹظ…ظƒظ† ط­ط°ظپ ط­ط³ط§ط¨ admin@middar.com ظ„ط£ظ†ظ‡ ط­ط³ط§ط¨ ط£ط³ط§ط³ظٹ."
            : "You cannot delete admin@middar.com because it is a core account.",
        );
        return;
      }
      window.alert(
        isArabic
          ? "طھط¹ط°ط± ط§ظ„ط­ط°ظپ. ظ‚ط¯ ظٹظƒظˆظ† ط§ظ„ط³ط¬ظ„ ظ…ط±طھط¨ط·ط§ظ‹ ط¨ط³ط¬ظ„ط§طھ ط£ط®ط±ظ‰."
          : "Unable to delete this record. It may be linked to other records.",
      );
    }
  }

  function openIndustryEditor(industry: AdminRow) {
    setEditingIndustry(industry);
    setIndustryMessage("");
    setIndustryDraft({
      name: String(industry.name ?? ""),
      name_en: String(industry.name_en ?? industry.name ?? ""),
      slug: String(industry.slug ?? ""),
      description: String(industry.description ?? ""),
      status: String(industry.status ?? "active"),
    });
    setIsIndustryModalOpen(true);
  }

  async function saveIndustry() {
    if (
      !industryDraft.name.trim() ||
      !industryDraft.slug.trim()
    ) {
      setIndustryMessage(
        isArabic ? "ط£ط¯ط®ظ„ ط§ط³ظ… ط§ظ„ظ†ط´ط§ط· ظˆط§ظ„ط±ظ…ط²" : "Enter the industry name and code",
      );
      return;
    }
    setIndustryMessage(isArabic ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸..." : "Saving...");
    try {
      const payload = {
        ...industryDraft,
        name_en: industryDraft.name_en.trim() || industryDraft.name.trim(),
      };
      const response = await fetch(
        editingIndustry
          ? `/api/v1/data/industries/${editingIndustry.id}`
          : "/api/v1/data/industries",
        {
          method: editingIndustry ? "PUT" : "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) throw new Error("SAVE_FAILED");
      setEditingIndustry(null);
      setIsIndustryModalOpen(false);
      onReload();
    } catch {
      setIndustryMessage(
        isArabic ? "طھط¹ط°ط± ط­ظپط¸ ط§ظ„ظ†ط´ط§ط·" : "Unable to save the industry",
      );
    }
  }

  async function uploadMarketingContent() {
    const file = contentUploadFileRef.current?.files?.[0];
    if (!file) {
      setContentUploadMessage(isArabic ? "ط§ط®طھط± ظ…ظ„ظپظ‹ط§ ط£ظˆظ„ظ‹ط§" : "Choose a file first");
      return;
    }
    setContentUploadMessage(isArabic ? "ط¬ط§ط±ظٹ ط§ظ„ط±ظپط¹..." : "Uploading...");
    const body = new FormData();
    body.append("file", file);
    body.append("title", contentUploadTitle.trim() || file.name);
    body.append("description", contentUploadDescription.trim());
    try {
      const response = await fetch("/api/v1/marketing-assets/upload", {
        method: "POST",
        body,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(payload.error ?? "UPLOAD_FAILED"));
      setContentUploadTitle("");
      setContentUploadDescription("");
      setContentUploadFileName("");
      if (contentUploadFileRef.current) contentUploadFileRef.current.value = "";
      notifyMarketingAssetsChanged();
      onReload();
      setContentUploadMessage(isArabic ? "طھظ… ط±ظپط¹ ط§ظ„ظ…ظ„ظپ" : "File uploaded");
    } catch {
      setContentUploadMessage(isArabic ? "طھط¹ط°ط± ط±ظپط¹ ط§ظ„ظ…ظ„ظپ" : "Unable to upload file");
    }
    window.setTimeout(() => setContentUploadMessage(""), 2400);
  }

  function openContentEditor(row: AdminRow) {
    setEditingContentRow(row);
    setContentEditDraft({
      title: String(row.title ?? row.original_name ?? ""),
      status: String(row.status ?? "active"),
    });
    setContentEditMessage("");
  }

  async function saveContentEdit() {
    if (!editingContentRow) return;
    setContentEditMessage(isArabic ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸..." : "Saving...");
    try {
      const response = await fetch(`/api/v1/data/marketing-assets/${editingContentRow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          title: contentEditDraft.title.trim(),
          status: contentEditDraft.status,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(payload.error ?? "SAVE_FAILED"));
      notifyMarketingAssetsChanged();
      await onReload();
      await loadLandingBrochure();
      setEditingContentRow(null);
    } catch {
      setContentEditMessage(isArabic ? "طھط¹ط°ط± ط­ظپط¸ ط§ظ„ظ…ظ„ظپ" : "Unable to save file");
    }
  }

  async function toggleMarketingAssetStatus(asset: AdminRow) {
    const currentStatus = String(asset.status ?? "active");
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const response = await fetch(`/api/v1/data/marketing-assets/${asset.id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json; charset=utf-8"},
        body: JSON.stringify({status: nextStatus}),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(payload.error ?? "UPDATE_FAILED"));
      notifyMarketingAssetsChanged();
      await onReload();
      await loadLandingBrochure();
      if (isLandingPreviewOpen && nextStatus === "inactive") {
        setIsLandingPreviewOpen(false);
      }
    } catch {
      window.alert(isArabic ? "طھط¹ط°ط± طھط؛ظٹظٹط± ط­ط§ظ„ط© ط§ظ„ظ…ظ„ظپ" : "Unable to change file status");
    }
  }

  function formatLandingBrochureSize(value: unknown) {
    const size = Number(value ?? 0);
    if (!Number.isFinite(size) || size <= 0) return "â€”";
    if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
    if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${size} B`;
  }

  function landingBrochureDate(value: unknown) {
    if (!value) return "â€”";
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return "â€”";
    return date.toISOString().slice(0, 10);
  }

  async function loadLandingBrochure() {
    try {
      const response = await fetch("/api/v1/admin/landing-brochure", {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error("LOAD_FAILED");
      setLandingBrochure(payload.data ?? null);
      setLandingPageUrl(String(payload.data?.externalUrl ?? ""));
    } catch {
      setLandingBrochure(null);
      setLandingPageUrl("");
    }
  }

  function previewActiveBrochure() {
    setIsLandingPreviewOpen(true);
  }

  function closeLandingPreview() {
    setIsLandingPreviewOpen(false);
  }

  async function uploadLandingBrochure() {
    const file = landingBrochureFileRef.current?.files?.[0];
    if (!file) {
      setLandingBrochureMessage(isArabic ? "ط§ط®طھط± ظ…ظ„ظپ PDF ط£ظˆظ„ط§ظ‹" : "Choose a PDF file first");
      return;
    }
    if (
      file.size > 20 * 1024 * 1024 ||
      (!file.type.includes("pdf") && !file.name.toLocaleLowerCase().endsWith(".pdf"))
    ) {
      setLandingBrochureMessage(
        isArabic ? "ط§ظ„ظ…ظ„ظپ ظٹط¬ط¨ ط£ظ† ظٹظƒظˆظ† PDF ظˆظ„ط§ ظٹطھط¬ط§ظˆط² 20MB" : "The file must be a PDF up to 20MB",
      );
      return;
    }

    setLandingBrochureMessage(isArabic ? "ط¬ط§ط±ظٹ طھط­ط¯ظٹط« ط§ظ„ط¨ط±ظˆط´ظˆط±..." : "Updating brochure...");
    const body = new FormData();
    body.append("file", file);
    body.append("title", file.name);
    try {
      const response = await fetch("/api/v1/admin/landing-brochure", {
        method: "POST",
        body,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(payload.error ?? "UPLOAD_FAILED"));
      if (landingBrochureFileRef.current) landingBrochureFileRef.current.value = "";
      setLandingBrochure(payload.data ?? null);
      onReload();
      setLandingBrochureMessage(isArabic ? "طھظ… طھط­ط¯ظٹط« ط¨ط±ظˆط´ظˆط± طµظپط­ط© ط§ظ„ظ‡ط¨ظˆط·" : "Landing brochure updated");
    } catch {
      setLandingBrochureMessage(isArabic ? "طھط¹ط°ط± طھط­ط¯ظٹط« ط§ظ„ط¨ط±ظˆط´ظˆط±" : "Unable to update brochure");
    }
    window.setTimeout(() => setLandingBrochureMessage(""), 2600);
  }

  async function saveLandingPageUrl() {
    const nextUrl = landingPageUrl.trim();
    if (nextUrl && !/^https?:\/\/\S+\.\S+/i.test(nextUrl)) {
      setLandingBrochureMessage(
        isArabic ? "ط£ط¯ط®ظ„ ط±ط§ط¨ط·ط§ظ‹ طµط­ظٹط­ط§ظ‹ ظٹط¨ط¯ط£ ط¨ظ€ http ط£ظˆ https" : "Enter a valid URL starting with http or https",
      );
      return;
    }

    setLandingBrochureMessage(isArabic ? "ط¬ط§ط±ظٹ ط­ظپط¸ ط§ظ„ط±ط§ط¨ط·..." : "Saving link...");
    try {
      const response = await fetch("/api/v1/admin/landing-brochure", {
        method: "PUT",
        headers: {"Content-Type": "application/json; charset=utf-8"},
        body: JSON.stringify({externalUrl: nextUrl}),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(payload.error ?? "SAVE_FAILED"));
      setLandingBrochure(payload.data ?? null);
      setLandingPageUrl(String(payload.data?.externalUrl ?? ""));
      onReload();
      setLandingBrochureMessage(isArabic ? "طھظ… ط­ظپط¸ ط§ظ„ط±ط§ط¨ط·" : "Link saved");
    } catch {
      setLandingBrochureMessage(isArabic ? "طھط¹ط°ط± ط­ظپط¸ ط§ظ„ط±ط§ط¨ط·" : "Unable to save link");
    }
    window.setTimeout(() => setLandingBrochureMessage(""), 2600);
  }

  async function clearLandingPageUrl() {
    setLandingPageUrl("");
    setLandingBrochureMessage(isArabic ? "ط¬ط§ط±ظٹ ط¥ط²ط§ظ„ط© ط§ظ„ط±ط§ط¨ط·..." : "Clearing link...");
    try {
      const response = await fetch("/api/v1/admin/landing-brochure", {
        method: "PUT",
        headers: {"Content-Type": "application/json; charset=utf-8"},
        body: JSON.stringify({externalUrl: ""}),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error("CLEAR_FAILED");
      setLandingBrochure(payload.data ?? null);
      onReload();
      setLandingBrochureMessage(isArabic ? "طھظ…طھ ط¥ط²ط§ظ„ط© ط§ظ„ط±ط§ط¨ط·" : "Link cleared");
    } catch {
      setLandingBrochureMessage(isArabic ? "طھط¹ط°ط± ط¥ط²ط§ظ„ط© ط§ظ„ط±ط§ط¨ط·" : "Unable to clear link");
    }
    window.setTimeout(() => setLandingBrochureMessage(""), 2600);
  }

  async function deleteActiveBrochure() {
    setIsLandingDeleteConfirmOpen(false);
    setLandingBrochureMessage(isArabic ? "ط¬ط§ط±ظٹ ط§ظ„ط­ط°ظپ..." : "Deleting...");
    try {
      const response = await fetch("/api/v1/admin/landing-brochure", {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error("DELETE_FAILED");
      setLandingBrochure(payload.data ?? null);
      onReload();
      setLandingBrochureMessage(isArabic ? "طھظ… ط­ط°ظپ ط§ظ„ط¨ط±ظˆط´ظˆط± ط§ظ„ظ…ط®طµطµ" : "Custom brochure deleted");
    } catch {
      setLandingBrochureMessage(isArabic ? "طھط¹ط°ط± ط­ط°ظپ ط§ظ„ط¨ط±ظˆط´ظˆط±" : "Unable to delete brochure");
    }
    window.setTimeout(() => setLandingBrochureMessage(""), 2600);
  }

  async function toggleAccountStatus(row: AdminRow) {
    const currentStatus = String(row.status ?? "inactive");
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const response = await fetch(`/api/v1/admin/users/${row.id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json; charset=utf-8"},
        body: JSON.stringify({
          ...row,
          status: nextStatus,
          is_active: nextStatus === "active" ? 1 : 0,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(payload.error ?? "SAVE_FAILED"));
      onReload();
    } catch {
      window.alert(isArabic ? "ط·طھط¹ط°ط± طھط­ط¯ظٹط« ط­ط§ظ„ط© ط§ظ„ط­ط³ط§ط¨" : "Unable to update account status");
    }
  }

  if (section === "accounts") {
    return (
      <section className="admin-data-card admin-accounts-workspace" dir={isArabic ? "rtl" : "ltr"}>
        <div className="admin-data-head admin-accounts-head">
          <div className="records-info">
            <span>{isArabic ? "ط¥ط¯ط§ط±ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ" : "Data Management"}</span>
            <strong>
              {visibleRows.length.toLocaleString(NUMBER_LOCALE)}{" "}
              {isArabic ? "ط³ط¬ظ„" : "records"}
            </strong>
          </div>
          <div className="admin-data-tools admin-accounts-tools">
            <div className="admin-record-search-bar search-box">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <circle cx="10.8" cy="10.8" r="6.2" />
                <path d="m15.5 15.5 4 4" />
              </svg>
              <input
                aria-label={isArabic ? "ط§ظ„ط¨ط­ط«" : "Search"}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={isArabic ? "ط§ط¨ط­ط« ط¨ط§ظ„ط§ط³ظ… ط£ظˆ ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ..." : "Search by name or email..."}
                type="search"
                value={query}
              />
            </div>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{isArabic ? "ط§ظ„ط§ط³ظ…" : "Name"}</th>
                <th>{isArabic ? "ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ" : "Email"}</th>
                <th>{isArabic ? "ط§ظ„طµظ„ط§ط­ظٹط©" : "Role"}</th>
                <th>{isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"}</th>
                <th>{isArabic ? "ط¢ط®ط± ط¯ط®ظˆظ„" : "Last Login"}</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, index) => (
                <tr key={`account-${row.id}-${index}`}>
                  <td>{String(row.name ?? "â€”")}</td>
                  <td>{String(row.email ?? "â€”")}</td>
                  <td>
                    <span className={`admin-status admin-status-${String(row.role ?? "affiliate")}`}>
                      {displayAdminValue(row.role, isArabic)}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`admin-row-status-toggle ${String(row.status ?? "inactive") === "active" ? "is-active" : ""}`}
                      onClick={() => void toggleAccountStatus(row)}
                      type="button"
                    >
                      {displayAdminValue(row.status, isArabic)}
                    </button>
                  </td>
                  <td>{String(row.last_login_at ?? "â€”").slice(0, 10)}</td>
                </tr>
              ))}
              {visibleRows.length === 0 ? (
                <tr>
                  <td className="admin-empty" colSpan={5}>
                    {isArabic ? "ظ„ط§ طھظˆط¬ط¯ ط­ط³ط§ط¨ط§طھ ظ…ط·ط§ط¨ظ‚ط©" : "No matching accounts"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-data-card">
      {section === "content" ? (
        <>

          <article className="landing-page-manager">
            <div className="landing-page-manager-header">
              <div>
                <h2>
                  {isArabic
                    ? "ط¥ط¯ط§ط±ط© ط¨ط±ظˆط´ظˆط± ظˆطµظپط­ط© ط§ظ„ظ‡ط¨ظˆط·"
                    : "Landing Page Brochure Manager"}
                </h2>
                <p>
                  {isArabic
                    ? "طھط­ظƒظ… ظپظٹ ط§ظ„ظ…ظ„ظپ ط§ظ„ظ…ط±ظپظ‚ ط£ظˆ ط±ط§ط¨ط· طµظپط­ط© ط§ظ„ظ‡ط¨ظˆط· ط§ظ„ط®ط§ط±ط¬ظٹط© ظˆط¹ط±ط¶ظ‡ط§ ظ„ظ„ط¹ظ…ظ„ط§ط،."
                    : "Control the attached brochure and optional external landing page link shown to users."}
                </p>
              </div>
              <div className="landing-brochure-badges">
                <span className={`landing-brochure-badge ${landingBrochure?.isActive ? "active" : "inactive"}`}>
                  {landingBrochure?.isDefault
                    ? isArabic
                      ? "ط§ظ„ظ…ظ„ظپ ط§ظ„ط§ظپطھط±ط§ط¶ظٹ ظ†ط´ط·"
                      : "Default file active"
                    : isArabic
                      ? "ظ†ط´ط· ظˆظٹط¹ط±ط¶ ط§ظ„ط¢ظ†"
                      : "Active now"}
                </span>
                <span className={`landing-brochure-badge link ${landingBrochure?.externalUrl ? "active" : ""}`}>
                  {landingBrochure?.externalUrl
                    ? isArabic
                      ? "ط±ط§ط¨ط· ط®ط§ط±ط¬ظٹ ظ†ط´ط·"
                      : "External link active"
                    : isArabic
                      ? "ظ„ط§ ظٹظˆط¬ط¯ ط±ط§ط¨ط· ط®ط§ط±ط¬ظٹ ظ†ط´ط·"
                      : "No external link active"}
                </span>
              </div>
            </div>

            <div className="landing-page-manager-grid">
              <div className="current-file-preview">
                <div className="landing-file-icon" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <h4>{landingBrochure?.name ?? (isArabic ? "ظ„ط§ ظٹظˆط¬ط¯ ظ…ظ„ظپ ظ†ط´ط·" : "No active file")}</h4>
                <p>
                  {isArabic ? "ط§ظ„ط­ط¬ظ…" : "Size"}: {formatLandingBrochureSize(landingBrochure?.size)}
                  {" â€¢ "}
                  {isArabic ? "طھط§ط±ظٹط® ط§ظ„طھط­ط¯ظٹط«" : "Updated"}: {landingBrochureDate(landingBrochure?.updatedAt)}
                </p>
                <div className="landing-brochure-actions">
                  {canPreviewLandingBrochure ? (
                  <button onClick={previewActiveBrochure} type="button">
                    {isArabic ? "ظ…ط¹ط§ظٹظ†ط© ط³ط±ظٹط¹ط©" : "Preview"}
                  </button>
                  ) : null}
                  <button
                    className="danger"
                    onClick={() => setIsLandingDeleteConfirmOpen(true)}
                    type="button"
                    disabled={Boolean(landingBrochure?.isDefault)}
                  >
                    {isArabic ? "ط­ط°ظپ ط§ظ„ط¨ط±ظˆط´ظˆط±" : "Delete brochure"}
                  </button>
                </div>
              </div>

              <div className="upload-and-link-zone">
                <button
                  className="upload-new-zone"
                  onClick={() => landingBrochureFileRef.current?.click()}
                  type="button"
                >
                  <input
                    ref={landingBrochureFileRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={() => void uploadLandingBrochure()}
                  />
                  <span className="landing-upload-icon" aria-hidden="true">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </span>
                  <strong>
                    {isArabic
                      ? "ط§ط¶ط؛ط· ظ‡ظ†ط§ ظ„طھط­ط¯ظٹط« ط£ظˆ طھط؛ظٹظٹط± ظ…ظ„ظپ ط§ظ„ط¨ط±ظˆط´ظˆط±"
                      : "Click here to update or change the brochure file"}
                  </strong>
                  <small>
                    {isArabic
                      ? "ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ظ‚ط¨ظˆظ„ط© ظپظ‚ط·: PDF (ط§ظ„ط­ط¯ ط§ظ„ط£ظ‚طµظ‰: 20MB)"
                      : "Accepted files: PDF only (max 20MB)"}
                  </small>
                </button>

                <div className="landing-url-input-container">
                  <label>{isArabic ? "ط±ط§ط¨ط· طµظپط­ط© ط§ظ„ظ‡ط¨ظˆط· ط§ظ„ط®ط§ط±ط¬ظٹط© (ط§ط®طھظٹط§ط±ظٹ):" : "External landing page URL (optional):"}</label>
                  <div className="landing-url-row">
                    <div className="landing-url-input-shell">
                      <span aria-hidden="true">ًں”—</span>
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={landingPageUrl}
                        onChange={(event) => setLandingPageUrl(event.target.value)}
                      />
                    </div>
                    <button className="save" onClick={() => void saveLandingPageUrl()} type="button">
                      {isArabic ? "ط­ظپط¸ ط§ظ„ط±ط§ط¨ط·" : "Save link"}
                    </button>
                    <button className="clear" onClick={() => void clearLandingPageUrl()} type="button">
                      {isArabic ? "ط¥ط²ط§ظ„ط©" : "Clear"}
                    </button>
                  </div>
                  <p>
                    {isArabic
                      ? "ظ…ظ„ط§ط­ط¸ط©: ط¥ط°ط§ طھط±ظƒطھ ظ‡ط°ط§ ط§ظ„ط­ظ‚ظ„ ظپط§ط±ط؛ط§ظ‹طŒ ظپظ„ظ† ظٹط¸ظ‡ط± ط²ط± ظ†ط³ط® ط§ظ„ط±ط§ط¨ط· ظپظٹ ظˆط§ط¬ظ‡ط© ط§ظ„ظ…ط³طھط®ط¯ظ…."
                      : "Note: If this field is empty, the copy link button will not appear in the user view."}
                  </p>
                </div>
              </div>
            </div>
            {landingBrochureMessage ? (
              <p className="landing-brochure-message">{landingBrochureMessage}</p>
            ) : null}
          </article>

          {isLandingDeleteConfirmOpen ? (
            <div
              className="landing-delete-confirm-overlay"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setIsLandingDeleteConfirmOpen(false);
                }
              }}
              role="dialog"
              aria-modal="true"
              aria-label={isArabic ? "طھط£ظƒظٹط¯ ط­ط°ظپ ط§ظ„ط¨ط±ظˆط´ظˆط±" : "Confirm brochure deletion"}
            >
              <div
                className="landing-delete-confirm-modal"
                dir={isArabic ? "rtl" : "ltr"}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="landing-delete-confirm-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="m19 6-1 14H6L5 6" />
                    <path d="M10 11v5" />
                    <path d="M14 11v5" />
                  </svg>
                </div>
                <h3>{isArabic ? "طھط£ظƒظٹط¯ ط­ط°ظپ ط§ظ„ط¨ط±ظˆط´ظˆط±" : "Delete brochure?"}</h3>
                <p>
                  {isArabic
                    ? "ط³ظٹطھظ… ط­ط°ظپ ط§ظ„ط¨ط±ظˆط´ظˆط± ط§ظ„ظ…ط®طµطµ ظˆط§ظ„ط±ط¬ظˆط¹ ظ„ظ„ظ…ظ„ظپ ط§ظ„ط§ظپطھط±ط§ط¶ظٹ. ظ‡ظ„ طھط±ظٹط¯ ط§ظ„ظ…طھط§ط¨ط¹ط©طں"
                    : "The custom brochure will be deleted and the default file will be restored. Do you want to continue?"}
                </p>
                <div className="landing-delete-confirm-actions">
                  <button
                    className="secondary"
                    onClick={() => setIsLandingDeleteConfirmOpen(false)}
                    type="button"
                  >
                    {isArabic ? "ط¥ظ„ط؛ط§ط،" : "Cancel"}
                  </button>
                  <button
                    className="danger"
                    onClick={() => void deleteActiveBrochure()}
                    type="button"
                  >
                    {isArabic ? "طھط£ظƒظٹط¯ ط§ظ„ط­ط°ظپ" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {isLandingPreviewOpen ? (
            <div
              className="landing-preview-modal"
              role="dialog"
              aria-modal="true"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  closeLandingPreview();
                }
              }}
            >
              <div
                className={`landing-preview-window ${isArabic ? "rtl" : "ltr"}`}
                dir={isArabic ? "rtl" : "ltr"}
                onMouseDown={(event) => {
                  event.stopPropagation();
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
              >
                <div className="landing-preview-admin-bar">
                  <span>
                    <i aria-hidden="true" />
                    {isArabic
                      ? "ظˆط¶ط¹ ط§ظ„ظ…ط¹ط§ظٹظ†ط© ط§ظ„ظپظˆط±ظٹط©: ظ‡ظƒط°ط§ ط³طھط¸ظ‡ط± ط§ظ„ط´ط§ط´ط© ظ„ظ„ظ…ط³طھط®ط¯ظ… ط§ظ„ظ†ظ‡ط§ط¦ظٹ"
                      : "Live preview mode: this is how the screen appears to the end user"}
                  </span>
                  <button
                    onClick={closeLandingPreview}
                    onPointerDownCapture={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      closeLandingPreview();
                    }}
                    type="button"
                  >
                    {isArabic ? "ط¥ط؛ظ„ط§ظ‚ ط§ظ„ظ…ط¹ط§ظٹظ†ط©" : "Close preview"}
                    <b aria-hidden="true">أ—</b>
                  </button>
                </div>
                <div className="landing-preview-body">
                  <div className={`admin-preview-card ${isArabic ? "rtl" : "ltr"}`} dir={isArabic ? "rtl" : "ltr"}>
                    <div className="preview-header">
                      <h2>
                        {isArabic
                          ? "ط£ظ†ط¸ظ…ط© ط§ظ„ظ…ط¹ط§ط±ط¶ ظˆط§ظ„ظپط¹ط§ظ„ظٹط§طھ"
                          : "Exhibitions and Event Systems"}
                      </h2>
                      <p>
                        {isArabic
                          ? "ط­ظ„ ظ…طھظƒط§ظ…ظ„ ظ„ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط¹ط§ط±ط¶ ظˆط§ظ„ظ…ط¤طھظ…ط±ط§طھ ظˆط­ط¬ظˆط²ط§طھ ط§ظ„ط£ط¬ظ†ط­ط© ظˆط§ظ„ط®ط¯ظ…ط§طھ ط§ظ„ظ„ظˆط¬ط³طھظٹط© ط±ظ‚ظ…ظٹط§ظ‹."
                          : "A complete solution for managing exhibitions, conferences, booth bookings, and logistics digitally."}
                      </p>
                    </div>
                    <div className="admin-pdf-wrapper">
                      {landingBrochurePreviewUrl ? (
                        <PdfPreviewFrame
                          className="admin-pdf-preview"
                          minHeight={560}
                          src={landingBrochurePreviewUrl}
                          title={isArabic ? "ظ…ط¹ط§ظٹظ†ط© ط¨ط±ظˆط´ظˆط± طµظپط­ط© ط§ظ„ظ‡ط¨ظˆط·" : "Landing brochure preview"}
                        />
                      ) : (
                        <div className="landing-preview-placeholder">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span>
                            {isArabic
                              ? "ظ„ظ… ظٹطھظ… ط±ظپط¹ ط£ظٹ ط¨ط±ظˆط´ظˆط± طھظپط§ط¹ظ„ظٹ ط­ط§ظ„ظٹط§ظ‹ ظ„ظ…ط´ط§ظ‡ط¯ط© ظ…ط¹ط§ظٹظ†طھظ‡"
                              : "No interactive brochure is available to preview yet"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}


        <article className="admin-content-upload-card">
          <div>
            <h3>{isArabic ? "ط±ظپط¹ ظ…ظ„ظپ طھط³ظˆظٹظ‚ظٹ ط¬ط¯ظٹط¯" : "Upload Marketing File"}</h3>
            <p>
              {isArabic
                ? "ط£ط¶ظپ ظ…ظ„ظپط§طھ ط§ظ„ظ…ظƒطھط¨ط© ط§ظ„طھط³ظˆظٹظ‚ظٹط© ظ‡ظ†ط§ ظ„طھط¸ظ‡ط± ظ„ظ„ظ…ط³طھط®ط¯ظ…ظٹظ† ظ„ظ„ط¹ط±ط¶ ظˆط§ظ„طھظ†ط²ظٹظ„ ظپظ‚ط·."
                : "Add marketing library files here so users can view and download them only."}
            </p>
          </div>
          <div className="admin-content-upload-grid">
            <label>
              <span>{isArabic ? "ط§ط³ظ… ط§ظ„ظ…ظ„ظپ" : "File Title"}</span>
              <input
                onChange={(event) => setContentUploadTitle(event.target.value)}
                placeholder={isArabic ? "ظ…ط«ط§ظ„: ط¨ط±ظˆط´ظˆط± ط§ظ„ظ…ط¹ط±ط¶" : "Example: Expo brochure"}
                value={contentUploadTitle}
              />
            </label>
            <label>
              <span>{isArabic ? "ظ…ظ„ط§ط­ط¸ط§طھ" : "Notes"}</span>
              <input
                onChange={(event) => setContentUploadDescription(event.target.value)}
                placeholder={isArabic ? "ظˆطµظپ ظ…ط®طھطµط± ظ„ظ„ظ…ظ„ظپ" : "Short file description"}
                value={contentUploadDescription}
              />
            </label>
            <label>
              <span>{isArabic ? "ط§ط®طھظٹط§ط± ط§ظ„ظ…ظ„ظپ" : "Choose File"}</span>
              <div className="admin-custom-file-picker">
                <input
                  ref={contentUploadFileRef}
                  type="file"
                  onChange={(event) =>
                    setContentUploadFileName(event.target.files?.[0]?.name ?? "")
                  }
                />
                <button
                  onClick={() => contentUploadFileRef.current?.click()}
                  type="button"
                >
                  {isArabic ? "ط§ط®طھظٹط§ط± ظ…ظ„ظپ" : "Choose file"}
                </button>
                <strong>
                  {contentUploadFileName ||
                    (isArabic ? "ظ„ظ… ظٹطھظ… ط§ط®طھظٹط§ط± ظ…ظ„ظپ" : "No file selected")}
                </strong>
              </div>
            </label>
          </div>
          <div className="admin-content-upload-actions">
            <button onClick={() => void uploadMarketingContent()} type="button">
              <span>{isArabic ? "ط±ظپط¹ ط§ظ„ظ…ظ„ظپ" : "Upload File"}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>
            {contentUploadMessage ? <p>{contentUploadMessage}</p> : null}
          </div>
        </article>

        {editingContentRow ? (
          <div
            className="admin-edit-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setEditingContentRow(null);
            }}
            role="presentation"
          >
            <section
              className="admin-edit-modal admin-content-edit-modal"
              dir={isArabic ? "rtl" : "ltr"}
              role="dialog"
              aria-modal="true"
            >
              <div className="admin-edit-head">
                <div>
                  <span>{isArabic ? "طھط¹ط¯ظٹظ„ ط§ظ„ظ…ظ„ظپ" : "Edit File Properties"}</span>
                  <h3>{String(editingContentRow.title ?? editingContentRow.original_name ?? editingContentRow.id)}</h3>
                </div>
                <button onClick={() => setEditingContentRow(null)} type="button">
                  X
                </button>
              </div>
              <label>
                <span>{isArabic ? "ط§ط³ظ… ط§ظ„ظ…ظ„ظپ" : "File Name"}</span>
                <input
                  onChange={(event) =>
                    setContentEditDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder={isArabic ? "ط§ظƒطھط¨ ط§ط³ظ… ط§ظ„ظ…ظ„ظپ" : "Enter file name"}
                  value={contentEditDraft.title}
                />
              </label>
              <label>
                <span>{isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"}</span>
                <DashboardSelect
                  ariaLabel={isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"}
                  menuClassName="admin-edit-select-menu"
                  onValueChange={(status) =>
                    setContentEditDraft((current) => ({ ...current, status }))
                  }
                  options={[
                    { value: "active", label: isArabic ? "ظ†ط´ط·" : "Active" },
                    { value: "inactive", label: isArabic ? "ط؛ظٹط± ظ†ط´ط·" : "Inactive" },
                  ]}
                  portal
                  value={contentEditDraft.status}
                />
              </label>
              {contentEditMessage ? <p>{contentEditMessage}</p> : null}
              <div className="admin-edit-actions">
                <button
                  className="primary"
                  onClick={() => void saveContentEdit()}
                  type="button"
                >
                  {isArabic ? "ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ" : "Save Changes"}
                </button>
                <button onClick={() => setEditingContentRow(null)} type="button">
                  {isArabic ? "ط¥ظ„ط؛ط§ط،" : "Cancel"}
                </button>
              </div>
            </section>
          </div>
        ) : null}

        </>
      ) : null}
      <div
        className={`admin-data-head ${section === "tickets" ? "admin-ticket-data-head toolbar-container" : ""} ${section === "products" ? "admin-product-data-head" : ""} ${section === "activity" ? "admin-activity-data-head" : ""} ${section === "content" ? "admin-content-data-head" : ""}`}
      >
        <div className={section === "tickets" ? "admin-ticket-summary records-info" : undefined}>
          <span>{isArabic ? "ط¥ط¯ط§ط±ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ" : "Data Management"}</span>
          <strong>
            {filteredRows.length.toLocaleString(NUMBER_LOCALE)}{" "}
            {isArabic ? "ط³ط¬ظ„" : "records"}
          </strong>
        </div>
        <div
          className={`admin-data-tools ${section === "tickets" ? "admin-ticket-data-tools admin-ticket-toolbar service-ticket-toolbar-v2" : ""} ${section === "products" ? "admin-product-data-tools" : ""} ${section === "activity" ? "admin-activity-data-tools" : ""} ${section === "content" ? "admin-content-data-tools" : ""}`}
          style={
            section === "tickets"
              ? {
                  alignItems: "center",
                  columnGap: 8,
                  display: "flex",
                  flexWrap: "nowrap",
                  gap: 8,
                  justifyContent: "flex-start",
                  margin: 0,
                  minWidth: 0,
                }
              : undefined
          }
        >
          <div
            className={`admin-record-search-bar${section === "tickets" ? " admin-ticket-search-wide search-box service-ticket-search-v2" : ""}`}
            style={
              section === "tickets"
                ? {
                    flex: "0 1 320px",
                    margin: 0,
                    maxWidth: 320,
                    minWidth: 260,
                    width: 320,
                  }
                : undefined
            }
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="10.8" cy="10.8" r="6.2" />
              <path d="m15.5 15.5 4 4" />
            </svg>
            <input
              aria-label={isArabic ? "ط§ظ„ط¨ط­ط«" : "Search"}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                section === "tickets"
                  ? isArabic
                    ? "ط§ط¨ط­ط« ط¨ط±ظ‚ظ… ط§ظ„طھط°ظƒط±ط© ط£ظˆ ط§ظ„ط§ط³ظ…..."
                    : "Search by ticket number..."
                  : isArabic
                    ? "ط§ط¨ط­ط« ط¨ط§ط³ظ… ط§ظ„ظ…ظ„ظپ..."
                    : "Search by file name..."
              }
              type="search"
              value={query}
            />
            {section === "tickets" ? (
              <div className="admin-ticket-records-badge">
                {filteredRows.length.toLocaleString(NUMBER_LOCALE)}
              </div>
            ) : null}
          </div>
          {section === "products" ? (
            <button
              className="admin-add-product"
              onClick={() => {
                setEditingProduct(null);
                setProductDraft({
                  name: "",
                  name_en: "",
                  slug: "",
                  description: "",
                  base_price: "",
                  currency: "SAR",
                  status: "active",
                });
                setProductMessage("");
                setIsProductModalOpen(true);
              }}
              type="button"
            >
              {isArabic ? "ط¥ط¶ط§ظپط© ظ…ظ†طھط¬" : "Add Product"}
            </button>
          ) : null}
          {section === "activity" ? (
            <button
              className="admin-add-industry"
              onClick={() => {
                setEditingIndustry(null);
                setIndustryDraft({
                  name: "",
                  name_en: "",
                  slug: "",
                  description: "",
                  status: "active",
                });
                setIndustryMessage("");
                setIsIndustryModalOpen(true);
              }}
              type="button"
            >
              {isArabic ? "ط¥ط¶ط§ظپط© ظ†ط´ط§ط·" : "Add Industry"}
            </button>
          ) : null}
          {section === "tickets" ? (
            <button
              aria-pressed={isTicketAdvancedFilter}
              className={`admin-account-advanced-filter btn-advanced-filter service-ticket-filter-v2${isTicketAdvancedFilter ? " active" : ""}`}
              onClick={() => setIsTicketAdvancedFilter((current) => !current)}
              style={{
                flex: "0 0 166px",
                margin: 0,
                maxWidth: 166,
                minWidth: 166,
                width: 166,
              }}
              type="button"
            >
              {isArabic ? "ظپظ„طھط±ط© ظ…طھظ‚ط¯ظ…ط©" : "Advanced Filter"}
            </button>
          ) : null}
          {section === "tickets" ? (
            <div
              className="admin-ticket-status-filter status-select service-ticket-status-v2"
              style={{
                flex: "0 0 166px",
                margin: 0,
                maxWidth: 166,
                minWidth: 166,
                width: 166,
              }}
            >
              <DashboardSelect
                ariaLabel={
                  isArabic
                    ? "ظپظ„طھط±ط© ط§ظ„طھط°ط§ظƒط± ط­ط³ط¨ ط§ظ„ط­ط§ظ„ط©"
                    : "Filter tickets by status"
                }
                onValueChange={setTicketStatusFilter}
                options={[
                  {
                    value: "all",
                    label: isArabic ? "ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ" : "All Statuses",
                  },
                  { value: "open", label: isArabic ? "ظ…ظپطھظˆط­" : "Open" },
                  {
                    value: "in_progress",
                    label: isArabic ? "ظ‚ظٹط¯ ط§ظ„طھظ†ظپظٹط°" : "In Progress",
                  },
                  {
                    value: "resolved",
                    label: isArabic ? "طھظ… ط§ظ„ط­ظ„" : "Resolved",
                  },
                  { value: "closed", label: isArabic ? "ظ…ط؛ظ„ظ‚" : "Closed" },
                ]}
                value={ticketStatusFilter}
              />
            </div>
          ) : null}
          {section === "tickets" ? (
            <div
              className="admin-ticket-types-dropdown-wrap service-ticket-types-v2"
              style={{
                flex: "0 0 166px",
                margin: 0,
                maxWidth: 166,
                minWidth: 166,
                width: 166,
              }}
            >
              <button
                aria-expanded={isTicketTypesMenuOpen}
                className={`admin-ticket-types-toggle btn-types${isTicketTypesMenuOpen ? " active" : ""}`}
                onClick={() => setIsTicketTypesMenuOpen((current) => !current)}
                style={{
                  margin: 0,
                  maxWidth: 166,
                  minWidth: 166,
                  width: 166,
                }}
                type="button"
              >
                {isArabic ? "ط§ظ„ط£ظ†ظˆط§ط¹" : "Types"}
              </button>
              {isTicketTypesMenuOpen ? (
                <div className="admin-ticket-types-dropdown">
                  <div className="admin-ticket-types-head">
                    <div>
                      <span>{isArabic ? "ط£ظ†ظˆط§ط¹ ط§ظ„طھط°ط§ظƒط±" : "Ticket Types"}</span>
                      <strong>
                        {(data.ticketTypes ?? []).length.toLocaleString(NUMBER_LOCALE)}{" "}
                        {isArabic ? "ظ†ظˆط¹" : "types"}
                      </strong>
                    </div>
                    <button
                      className="admin-add-product"
                      onClick={() => {
                        setIsTicketTypesMenuOpen(false);
                        openTicketTypeEditor();
                      }}
                      type="button"
                    >
                      {isArabic ? "ط¥ط¶ط§ظپط© ظ†ظˆط¹ طھط°ظƒط±ط©" : "Add Ticket Type"}
                    </button>
                  </div>
                  <div className="admin-ticket-types-list">
                    {(data.ticketTypes ?? []).map((ticketType) => (
                      <article className="admin-ticket-type-item" key={ticketType.id}>
                        <div>
                          <strong>
                            {isArabic
                              ? String(ticketType.name_ar ?? "â€”")
                              : String(ticketType.name_en ?? ticketType.name_ar ?? "â€”")}
                          </strong>
                          <small>{String(ticketType.description ?? "")}</small>
                        </div>
                        <span className={`admin-status admin-status-${String(ticketType.status ?? "active")}`}>
                          {displayAdminValue(ticketType.status, isArabic)}
                        </span>
                        <button
                          className="admin-row-edit"
                          onClick={() => {
                            setIsTicketTypesMenuOpen(false);
                            openTicketTypeEditor(ticketType);
                          }}
                          type="button"
                        >
                          {isArabic ? "طھط¹ط¯ظٹظ„" : "Edit"}
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {false ? (
        <div className="admin-ticket-types-panel">
          <div className="admin-ticket-types-head">
            <div>
              <span>{isArabic ? "ط£ظ†ظˆط§ط¹ ط§ظ„طھط°ط§ظƒط±" : "Ticket Types"}</span>
              <strong>
                {(data?.ticketTypes ?? []).length.toLocaleString(NUMBER_LOCALE)}{" "}
                {isArabic ? "ظ†ظˆط¹" : "types"}
              </strong>
            </div>
            <button
              className="admin-add-product"
              onClick={() => openTicketTypeEditor()}
              type="button"
            >
              {isArabic ? "ط¥ط¶ط§ظپط© ظ†ظˆط¹ طھط°ظƒط±ط©" : "Add Ticket Type"}
            </button>
          </div>
          <div className="admin-ticket-types-list">
            {(data?.ticketTypes ?? []).map((ticketType) => (
              <article className="admin-ticket-type-item" key={ticketType.id}>
                <div>
                  <strong>
                    {isArabic
                      ? String(ticketType.name_ar ?? "â€”")
                      : String(ticketType.name_en ?? ticketType.name_ar ?? "â€”")}
                  </strong>
                  <small>{String(ticketType.description ?? "")}</small>
                </div>
                <span className={`admin-status admin-status-${String(ticketType.status ?? "active")}`}>
                  {displayAdminValue(ticketType.status, isArabic)}
                </span>
                <button
                  className="admin-row-edit"
                  onClick={() => openTicketTypeEditor(ticketType)}
                  type="button"
                >
                  {isArabic ? "طھط¹ط¯ظٹظ„" : "Edit"}
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              {config.columns.map((column) => (
                <th key={column[0]}>{column[1]}</th>
              ))}
              {section === "tickets" ||
              section === "products" ||
              section === "activity" ||
              section === "content" ? (
                <th className="admin-action-column-header">
                  {isArabic ? "ط¥ط¬ط±ط§ط،" : "Action"}
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, index) => (
              <Fragment
                key={`${section}-${String(row.activity_type ?? "record")}-${row.id}-${index}`}
              >
                <tr>
                  {config.columns.map(([key]) => (
                    <td key={key}>
                      {section === "content" && key === "status" ? (
                        <button
                          className={`admin-content-status-toggle admin-status admin-status-${String(row.status ?? "inactive")}`}
                          onClick={() => void toggleMarketingAssetStatus(row)}
                          aria-label={isArabic ? "طھط¨ط¯ظٹظ„ ط­ط§ظ„ط© ط§ظ„ظ…ظ„ظپ" : "Toggle file status"}
                          title={isArabic ? "ط§ط¶ط؛ط· ظ„طھط¨ط¯ظٹظ„ ط§ظ„ط­ط§ظ„ط©" : "Click to toggle status"}
                          type="button"
                        >
                          {displayAdminValue(row.status, isArabic)}
                        </button>
                      ) : key === "status" || key === "role" ? (
                        <span
                          className={`admin-status admin-status-${String(row[key] ?? "unknown")}`}
                        >
                          {displayAdminValue(row[key], isArabic)}
                        </span>
                      ) : key.includes("created") || key.includes("login") ? (
                        String(row[key] ?? "â€”").slice(0, 10)
                      ) : key === "base_price" ? (
                        Number(row[key] ?? 0).toLocaleString(NUMBER_LOCALE)
                      ) : key === "file_size" ? (
                        `${(Number(row[key] ?? 0) / 1024 / 1024).toLocaleString(NUMBER_LOCALE, {
                          maximumFractionDigits: 1,
                        })} MB`
                      ) : section === "tickets" && key === "user_name" ? (
                        getTicketUserName(row)
                      ) : (
                        String(row[key] ?? "â€”")
                      )}
                    </td>
                  ))}
                  {section === "tickets" ? (
                    <td>
                      <div className="admin-ticket-actions-container">
                        <button
                          className="ticket-action-btn accept"
                          disabled={["in_progress", "resolved", "closed"].includes(String(row.status ?? ""))}
                          onClick={() => void updateTicketStatus(row, "in_progress")}
                          type="button"
                        >
                          <svg aria-hidden="true" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {isArabic ? "ظ‚ط¨ظˆظ„ ط§ظ„ط·ظ„ط¨" : "Accept"}
                        </button>
                        <button
                          className="ticket-action-btn assign"
                          onClick={() => openTicketEditor(row)}
                          type="button"
                        >
                          <svg aria-hidden="true" viewBox="0 0 24 24">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          {isArabic ? "ط¥ط³ظ†ط§ط¯ ظ„ظپظ†ظٹ" : "Assign"}
                        </button>
                        <button
                          className="ticket-action-btn details"
                          onClick={() => setTimelineTicket(row)}
                          type="button"
                        >
                          <svg aria-hidden="true" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          {isArabic ? "ط¹ط±ط¶ ط§ظ„طھظپط§طµظٹظ„" : "Details"}
                        </button>
                        <span className="ticket-action-spacer" />
                        <button
                          className="ticket-action-btn cancel"
                          disabled={String(row.status ?? "") === "closed"}
                          onClick={() => void updateTicketStatus(row, "closed")}
                          type="button"
                        >
                          <svg aria-hidden="true" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                          {isArabic ? "ط¥ظ„ط؛ط§ط، ط§ظ„طھط°ظƒط±ط©" : "Cancel"}
                        </button>
                      </div>
                    </td>
                  ) : section === "products" ? (
                    <td>
                      <div className="admin-row-actions">
                        <button
                          className="admin-row-edit"
                          onClick={() => openProductEditor(row)}
                          aria-label={isArabic ? "طھط¹ط¯ظٹظ„" : "Edit"}
                          title={isArabic ? "طھط¹ط¯ظٹظ„" : "Edit"}
                          type="button"
                        >
                          <svg aria-hidden="true" viewBox="0 0 24 24">
                            <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
                            <path d="M13.5 6.5 17.5 10.5" />
                          </svg>
                        </button>
                        <button
                          className="admin-row-delete"
                          onClick={() => requestProductDeletion(row)}
                          aria-label={isArabic ? "ط­ط°ظپ" : "Delete"}
                          title={isArabic ? "ط­ط°ظپ" : "Delete"}
                          type="button"
                        >
                          <svg aria-hidden="true" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  ) : section === "activity" ? (
                    <td>
                      <div className="admin-row-actions">
                        <button
                          className="admin-row-edit"
                          onClick={() => openIndustryEditor(row)}
                          aria-label={isArabic ? "طھط¹ط¯ظٹظ„" : "Edit"}
                          title={isArabic ? "طھط¹ط¯ظٹظ„" : "Edit"}
                          type="button"
                        >
                          <svg aria-hidden="true" viewBox="0 0 24 24">
                            <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
                            <path d="M13.5 6.5 17.5 10.5" />
                          </svg>
                        </button>
                        <button
                          className="admin-row-delete"
                          onClick={() => requestIndustryDeletion(row)}
                          aria-label={isArabic ? "ط­ط°ظپ" : "Delete"}
                          title={isArabic ? "ط­ط°ظپ" : "Delete"}
                          type="button"
                        >
                          <svg aria-hidden="true" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  ) : section === "content" ? (
                    <td>
                      <div className="admin-row-actions">
                        <button
                          className="admin-row-edit"
                          onClick={() => openContentEditor(row)}
                          aria-label={isArabic ? "طھط¹ط¯ظٹظ„" : "Edit"}
                          title={isArabic ? "طھط¹ط¯ظٹظ„" : "Edit"}
                          type="button"
                        >
                          <svg aria-hidden="true" viewBox="0 0 24 24">
                            <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
                            <path d="M13.5 6.5 17.5 10.5" />
                          </svg>
                        </button>
                        <button
                          className="admin-row-delete"
                          onClick={() => requestMarketingAssetDeletion(row)}
                          aria-label={isArabic ? "ط­ط°ظپ" : "Delete"}
                          title={isArabic ? "ط­ط°ظپ" : "Delete"}
                          type="button"
                        >
                          <svg aria-hidden="true" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              </Fragment>
            ))}
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  className="admin-empty"
                  colSpan={
                    config.columns.length +
                    (section === "tickets" ||
                    section === "products" ||
                    section === "activity" ||
                    section === "content"
                      ? 1
                      : 0)
                  }
                >
                  {isArabic ? "ظ„ط§ طھظˆط¬ط¯ ط³ط¬ظ„ط§طھ ظ…ط·ط§ط¨ظ‚ط©" : "No matching records"}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {isTicketTypeModalOpen ? (
        <div
          className="admin-edit-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsTicketTypeModalOpen(false);
          }}
          role="presentation"
        >
          <section className="admin-edit-modal" aria-modal="true" role="dialog">
            <div className="admin-edit-head">
              <div>
                <span>{isArabic ? "ط£ظ†ظˆط§ط¹ ط§ظ„طھط°ط§ظƒط±" : "Ticket Types"}</span>
                <h3>
                  {editingTicketType
                    ? isArabic
                      ? "طھط¹ط¯ظٹظ„ ظ†ظˆط¹ ط§ظ„طھط°ظƒط±ط©"
                      : "Edit Ticket Type"
                    : isArabic
                      ? "ط¥ط¶ط§ظپط© ظ†ظˆط¹ طھط°ظƒط±ط©"
                      : "Add Ticket Type"}
                </h3>
              </div>
              <button onClick={() => setIsTicketTypeModalOpen(false)} type="button">
                X
              </button>
            </div>
            <label>
              <span>{isArabic ? "ط§ظ„ط§ط³ظ… ط¨ط§ظ„ط¹ط±ط¨ظٹ" : "Arabic Name"}</span>
              <input
                onChange={(event) =>
                  setTicketTypeDraft((current) => ({ ...current, name_ar: event.target.value }))
                }
                value={ticketTypeDraft.name_ar}
              />
            </label>
            <label>
              <span>{isArabic ? "ط§ظ„ط§ط³ظ… ط¨ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ" : "English Name"}</span>
              <input
                onChange={(event) =>
                  setTicketTypeDraft((current) => ({ ...current, name_en: event.target.value }))
                }
                value={ticketTypeDraft.name_en}
              />
            </label>
            <label>
              <span>{isArabic ? "ط§ظ„ظˆطµظپ" : "Description"}</span>
              <textarea
                className="admin-ticket-notes"
                onChange={(event) =>
                  setTicketTypeDraft((current) => ({ ...current, description: event.target.value }))
                }
                value={ticketTypeDraft.description}
              />
            </label>
            <label>
              <span>{isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"}</span>
              <DashboardSelect
                ariaLabel={isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"}
                menuClassName="admin-edit-select-menu"
                onValueChange={(status) =>
                  setTicketTypeDraft((current) => ({ ...current, status }))
                }
                options={[
                  { value: "active", label: isArabic ? "ظ†ط´ط·" : "Active" },
                  { value: "inactive", label: isArabic ? "ط؛ظٹط± ظ†ط´ط·" : "Inactive" },
                ]}
                portal
                value={ticketTypeDraft.status}
              />
            </label>
            <label>
              <span>{isArabic ? "ط§ظ„طھط±طھظٹط¨" : "Order"}</span>
              <input
                min="0"
                onChange={(event) =>
                  setTicketTypeDraft((current) => ({ ...current, sort_order: event.target.value }))
                }
                type="number"
                value={ticketTypeDraft.sort_order}
              />
            </label>
            {ticketTypeMessage ? <p>{ticketTypeMessage}</p> : null}
            <div className="admin-edit-actions">
              <button
                className="primary"
                onClick={() => void saveTicketType()}
                type="button"
              >
                {isArabic ? "ط­ظپط¸" : "Save"}
              </button>
              <button onClick={() => setIsTicketTypeModalOpen(false)} type="button">
                {isArabic ? "ط¥ظ„ط؛ط§ط،" : "Cancel"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {editingTicket ? (
        <div
          className="admin-edit-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditingTicket(null);
          }}
          role="presentation"
        >
          <section
            className="admin-edit-modal admin-ticket-edit-modal"
            aria-modal="true"
            role="dialog"
          >
            <div className="admin-edit-head">
              <div>
                <span>
                  {isArabic ? "طھط¹ط¯ظٹظ„ طھط°ظƒط±ط© ط§ظ„ط®ط¯ظ…ط©" : "Edit Service Ticket"}
                </span>
                <h3>{String(editingTicket.ticket_number ?? "-")}</h3>
              </div>
              <button onClick={() => setEditingTicket(null)} type="button">
                X
              </button>
            </div>
            <label>
              <span>{isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"}</span>
              <DashboardSelect
                ariaLabel={isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"}
                menuClassName="admin-edit-select-menu"
                onValueChange={(status) =>
                  setTicketDraft((current) => ({ ...current, status }))
                }
                options={[
                  { value: "open", label: isArabic ? "ظ…ظپطھظˆط­" : "Open" },
                  {
                    value: "in_progress",
                    label: isArabic ? "ظ‚ظٹط¯ ط§ظ„طھظ†ظپظٹط°" : "In Progress",
                  },
                  {
                    value: "resolved",
                    label: isArabic ? "طھظ… ط§ظ„ط­ظ„" : "Resolved",
                  },
                  { value: "closed", label: isArabic ? "ظ…ط؛ظ„ظ‚" : "Closed" },
                ]}
                portal
                value={ticketDraft.status}
              />
            </label>
            <label>
              <span>{isArabic ? "ظ…ظ„ط§ط­ط¸ط§طھ" : "Notes"}</span>
              <textarea
                className="admin-ticket-notes"
                onChange={(event) =>
                  setTicketDraft((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder={
                  isArabic
                    ? "ط£ط¶ظپ ظ…ظ„ط§ط­ط¸ط§طھ ط¹ظ„ظ‰ ط§ظ„طھط°ظƒط±ط©..."
                    : "Add notes to this ticket..."
                }
                value={ticketDraft.notes}
              />
            </label>
            {ticketEditMessage ? <p>{ticketEditMessage}</p> : null}
            <div className="admin-edit-actions">
              <button
                className="primary"
                disabled={isTicketSaving}
                onClick={() => void saveTicket()}
                type="button"
              >
                {isTicketSaving
                  ? isArabic
                    ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸..."
                    : "Saving..."
                  : isArabic
                    ? "ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ"
                    : "Save Changes"}
              </button>
              <button onClick={() => setEditingTicket(null)} type="button">
                {isArabic ? "ط¥ظ„ط؛ط§ط،" : "Cancel"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {timelineTicket ? (
        <div
          className="admin-edit-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setTimelineTicket(null);
          }}
          role="presentation"
        >
          <section
            className="admin-edit-modal admin-ticket-timeline-modal"
            aria-modal="true"
            role="dialog"
          >
            <div className="admin-edit-head">
              <div>
                <span>{isArabic ? "ط®ط· ط²ظ…ظ† ط§ظ„طھط°ظƒط±ط©" : "Ticket Timeline"}</span>
                <h3>{String(timelineTicket.ticket_number ?? "-")}</h3>
              </div>
              <button onClick={() => setTimelineTicket(null)} type="button">
                X
              </button>
            </div>
            <div className="admin-ticket-timeline-summary">
              <strong>{String(timelineTicket.subject ?? "-")}</strong>
              <span>
                {isArabic ? "ط§ظ„ط­ط§ظ„ط© ط§ظ„ط­ط§ظ„ظٹط©:" : "Current status:"}{" "}
                {displayAdminValue(timelineTicket.status, isArabic)}
              </span>
            </div>
            <div className="ticket-timeline admin-ticket-timeline">
              {ticketTimelineEvents.length > 0 ? (
                ticketTimelineEvents.map((event, index) => {
                  const description = ticketEventDescription(event);
                  return (
                    <div
                      className={`ticket-timeline-step ${
                        index === ticketTimelineEvents.length - 1 ? "current" : ""
                      }`}
                      key={event.id}
                    >
                      <span aria-hidden="true" />
                      <div>
                        <strong>{ticketEventTitle(event)}</strong>
                        <small>
                          {description ? `${description} - ` : ""}
                          {formatAdminDateTime(event.created_at, isArabic)}
                          {"actor_name" in event && event.actor_name
                            ? ` - ${String(event.actor_name)}`
                            : ""}
                        </small>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="admin-ticket-timeline-empty">
                  {isArabic
                    ? "ظ„ط§ طھظˆط¬ط¯ ط­ط±ظƒط§طھ ظ…ط­ظپظˆط¸ط© ظ„ظ‡ط°ظ‡ ط§ظ„طھط°ظƒط±ط© ط¨ط¹ط¯."
                    : "No saved timeline activity for this ticket yet."}
                </p>
              )}
            </div>
            <div className="admin-edit-actions">
              <button onClick={() => setTimelineTicket(null)} type="button">
                {isArabic ? "ط¥ط؛ظ„ط§ظ‚" : "Close"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {isProductModalOpen ? (
        <div
          className="admin-edit-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget)
              setIsProductModalOpen(false);
          }}
          role="presentation"
        >
          <section className="admin-edit-modal" aria-modal="true" role="dialog">
            <div className="admin-edit-head">
              <div>
                <span>{isArabic ? "ط§ظ„ظ…ظ†طھط¬ط§طھ" : "Products"}</span>
                <h3>
                  {editingProduct
                    ? isArabic
                      ? "طھط¹ط¯ظٹظ„ ط§ظ„ظ…ظ†طھط¬"
                      : "Edit Product"
                    : isArabic
                      ? "ط¥ط¶ط§ظپط© ظ…ظ†طھط¬ ط¬ط¯ظٹط¯"
                      : "Add New Product"}
                </h3>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                type="button"
              >
                X
              </button>
            </div>
            <label>
              <span>{isArabic ? "ط§ط³ظ… ط§ظ„ظ…ظ†طھط¬" : "Product Name"}</span>
              <input
                onChange={(event) =>
                  setProductDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                value={productDraft.name}
              />
            </label>
            <label>
              <span>
                {isArabic
                  ? "\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u062a\u062c \u0628\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629"
                  : "English Product Name"}
              </span>
              <input
                dir="ltr"
                onChange={(event) =>
                  setProductDraft((current) => ({
                    ...current,
                    name_en: event.target.value,
                  }))
                }
                value={productDraft.name_en}
              />
            </label>
            <label>
              <span>{isArabic ? "ط§ظ„ط±ظ…ط²" : "Code"}</span>
              <input
                dir="ltr"
                onChange={(event) =>
                  setProductDraft((current) => ({
                    ...current,
                    slug: event.target.value,
                  }))
                }
                value={productDraft.slug}
              />
            </label>
            <label>
              <span>{isArabic ? "ط§ظ„ط³ط¹ط±" : "Price"}</span>
              <input
                min="0"
                onChange={(event) =>
                  setProductDraft((current) => ({
                    ...current,
                    base_price: event.target.value,
                  }))
                }
                type="number"
                value={productDraft.base_price}
              />
            </label>
            <label>
              <span>{isArabic ? "ط§ظ„ظˆطµظپ" : "Description"}</span>
              <textarea
                onChange={(event) =>
                  setProductDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                value={productDraft.description}
              />
            </label>
            {productMessage ? <p>{productMessage}</p> : null}
            <div className="admin-edit-actions">
              <button
                className="primary"
                onClick={() => void saveProduct()}
                type="button"
              >
                {editingProduct
                  ? isArabic
                    ? "ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ"
                    : "Save Changes"
                  : isArabic
                    ? "ط¥ط¶ط§ظپط© ط§ظ„ظ…ظ†طھط¬"
                    : "Add Product"}
              </button>
              <button
                onClick={() => setIsProductModalOpen(false)}
                type="button"
              >
                {isArabic ? "ط¥ظ„ط؛ط§ط،" : "Cancel"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {isIndustryModalOpen ? (
        <div
          className="admin-edit-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setEditingIndustry(null);
              setIsIndustryModalOpen(false);
            }
          }}
          role="presentation"
        >
          <section className="admin-edit-modal" aria-modal="true" role="dialog">
            <div className="admin-edit-head">
              <div>
                <span>{isArabic ? "ط§ظ„ط£ظ†ط´ط·ط©" : "Industries"}</span>
                <h3>
                  {editingIndustry
                    ? isArabic
                      ? "طھط¹ط¯ظٹظ„ ط§ظ„ظ†ط´ط§ط·"
                      : "Edit Industry"
                    : isArabic
                      ? "ط¥ط¶ط§ظپط© ظ†ط´ط§ط· ط¬ط¯ظٹط¯"
                      : "Add New Industry"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingIndustry(null);
                  setIsIndustryModalOpen(false);
                }}
                type="button"
              >
                X
              </button>
            </div>
            <label>
              <span>{isArabic ? "ط§ط³ظ… ط§ظ„ظ†ط´ط§ط·" : "Industry Name"}</span>
              <input
                onChange={(event) =>
                  setIndustryDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                value={industryDraft.name}
              />
            </label>
            <label>
              <span>
                {isArabic
                  ? "\u0627\u0633\u0645 \u0627\u0644\u0646\u0634\u0627\u0637 \u0628\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629"
                  : "English Industry Name"}
              </span>
              <input
                dir="ltr"
                onChange={(event) =>
                  setIndustryDraft((current) => ({
                    ...current,
                    name_en: event.target.value,
                  }))
                }
                value={industryDraft.name_en}
              />
            </label>
            <label>
              <span>{isArabic ? "ط§ظ„ط±ظ…ط²" : "Code"}</span>
              <input
                dir="ltr"
                onChange={(event) =>
                  setIndustryDraft((current) => ({
                    ...current,
                    slug: event.target.value,
                  }))
                }
                value={industryDraft.slug}
              />
            </label>
            <label>
              <span>{isArabic ? "ط§ظ„ظˆطµظپ" : "Description"}</span>
              <textarea
                onChange={(event) =>
                  setIndustryDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                value={industryDraft.description}
              />
            </label>
            <label>
              <span>{isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"}</span>
              <DashboardSelect
                ariaLabel={isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"}
                menuClassName="admin-edit-select-menu"
                onValueChange={(status) =>
                  setIndustryDraft((current) => ({ ...current, status }))
                }
                options={[
                  { value: "active", label: isArabic ? "ظ†ط´ط·" : "Active" },
                  {
                    value: "inactive",
                    label: isArabic ? "ط؛ظٹط± ظ†ط´ط·" : "Inactive",
                  },
                ]}
                portal
                value={industryDraft.status}
              />
            </label>
            {industryMessage ? <p>{industryMessage}</p> : null}
            <div className="admin-edit-actions">
              <button
                className="primary"
                onClick={() => void saveIndustry()}
                type="button"
              >
                {editingIndustry
                  ? isArabic
                    ? "ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ"
                    : "Save Changes"
                  : isArabic
                    ? "ط¥ط¶ط§ظپط© ط§ظ„ظ†ط´ط§ط·"
                    : "Add Industry"}
              </button>
              <button
                onClick={() => {
                  setEditingIndustry(null);
                  setIsIndustryModalOpen(false);
                }}
                type="button"
              >
                {isArabic ? "ط¥ظ„ط؛ط§ط،" : "Cancel"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {deleteTarget ? (
        <div
          className="admin-edit-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDeleteTarget(null);
          }}
          role="presentation"
        >
          <section
            className="admin-delete-modal"
            aria-modal="true"
            role="dialog"
          >
            <div className="admin-delete-icon">!</div>
            <h3>{isArabic ? "طھط£ظƒظٹط¯ ط§ظ„ط­ط°ظپ" : "Confirm deletion"}</h3>
            <p>
              {isArabic
                ? `ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ آ«${String(deleteTarget.row.name ?? "")}آ»طں ظ„ط§ ظٹظ…ظƒظ† ط§ظ„طھط±ط§ط¬ط¹ ط¹ظ† ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،.`
                : `Delete "${String(deleteTarget.row.name ?? "")}"? This action cannot be undone.`}
            </p>
            <div className="admin-delete-actions">
              <button
                className="danger"
                onClick={() => void confirmDeletion()}
                type="button"
              >
                    {isArabic ? "\u062d\u0630\u0641" : "Delete"}
              </button>
              <button onClick={() => setDeleteTarget(null)} type="button">
                {isArabic ? "ط¥ظ„ط؛ط§ط،" : "Cancel"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function AdminAccountQuotes({
  data,
  isArabic,
  onReload,
}: {
  data: ManagementData;
  isArabic: boolean;
  onReload: () => void;
}) {
  const [accountUserFilter, setAccountUserFilter] = useState("all");
  const [isAdvancedFilter, setIsAdvancedFilter] = useState(false);
  const getAccountUserKey = (row: AdminRow) => {
    const id = row.affiliate_user_id ?? row.user_id;
    if (id !== undefined && id !== null && String(id).trim()) {
      return `id:${String(id)}`;
    }
    const name = String(row.affiliate_user_name ?? "").trim();
    return name ? `name:${name}` : "";
  };
  const accountUserOptions = Array.from(
    [...data.quotes, ...data.sales, ...(data.commissions ?? [])].reduce(
      (options, row) => {
        const key = getAccountUserKey(row);
        const label = String(row.affiliate_user_name ?? "").trim();
        if (key && label && !options.has(key)) options.set(key, label);
        return options;
      },
      new Map<string, string>(),
    ),
  ).map(([value, label]) => ({ value, label }));
  const matchesAccountUser = (row: AdminRow) =>
    accountUserFilter === "all" || getAccountUserKey(row) === accountUserFilter;
  const filteredQuotes = data.quotes.filter(matchesAccountUser);
  const filteredSales = data.sales.filter(matchesAccountUser);
  const filteredCommissions = (data.commissions ?? []).filter(
    matchesAccountUser,
  );
  const advancedSales = isAdvancedFilter
    ? filteredSales.filter((sale) => String(sale.status ?? "") === "pending")
    : filteredSales;
  const advancedCommissions = isAdvancedFilter
    ? filteredCommissions.filter((commission) =>
        ["pending", "approved"].includes(String(commission.status ?? "")),
      )
    : filteredCommissions;
  const rows = filteredQuotes.filter((quote) => {
    const status = String(quote.status ?? "");
    if (!["accepted", "paid"].includes(status)) return false;
    if (!isAdvancedFilter) return true;
    return (
      status === "accepted" ||
      (status === "paid" && !String(quote.sales_invoice_number ?? "").trim())
    );
  });
  const total = rows.reduce((sum, quote) => sum + Number(quote.amount ?? 0), 0);
  const [invoiceQuote, setInvoiceQuote] = useState<AdminRow | null>(null);
  const [invoiceMessage, setInvoiceMessage] = useState("");
  const receiptInputRef = useRef<HTMLInputElement | null>(null);
  const [receiptQuote, setReceiptQuote] = useState<AdminRow | null>(null);
  const [uploadingReceiptId, setUploadingReceiptId] = useState<number | null>(
    null,
  );
  const [receiptMessage, setReceiptMessage] = useState("");
  const [attachedReceiptQuoteIds, setAttachedReceiptQuoteIds] = useState<
    Set<number>
  >(() => new Set());

  function openReceiptPicker(quote: AdminRow) {
    setReceiptQuote(quote);
    setReceiptMessage("");
    receiptInputRef.current?.click();
  }

  async function uploadReceipt(file: File) {
    if (!receiptQuote) return;
    const quoteId = receiptQuote.id;
    const formData = new FormData();
    formData.append("receipt", file);
    setUploadingReceiptId(quoteId);
    setReceiptMessage(
      isArabic ? "ط¬ط§ط±ظٹ ط±ظپط¹ ط¥ط«ط¨ط§طھ ط§ظ„ط¯ظپط¹..." : "Uploading proof of payment...",
    );
    try {
      const response = await fetch(`/api/v1/admin/quotes/${quoteId}/receipt`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "UPLOAD_FAILED");
      }
      setAttachedReceiptQuoteIds((current) => new Set(current).add(quoteId));
      setReceiptMessage(
        isArabic
          ? "طھظ… ط±ط¨ط· ط¥ط«ط¨ط§طھ ط§ظ„ط¯ظپط¹ ط¨ط¹ط±ط¶ ط§ظ„ط³ط¹ط±."
          : "Proof of payment attached to this quote.",
      );
      setReceiptQuote(null);
      onReload();
    } catch (error) {
      const code = error instanceof Error ? error.message : "UPLOAD_FAILED";
      setReceiptMessage(
        code === "INVALID_FILE_TYPE"
          ? isArabic
            ? "ظٹط±ط¬ظ‰ ط±ظپط¹ طµظˆط±ط© ط£ظˆ ظ…ظ„ظپ PDF ظپظ‚ط·."
            : "Please upload an image or PDF file."
          : code === "QUOTE_NOT_ACCEPTED"
            ? isArabic
              ? "ظٹطھط§ط­ ط¥ط«ط¨ط§طھ ط§ظ„ط¯ظپط¹ ظ„ط¹ط±ظˆط¶ ط§ظ„ط£ط³ط¹ط§ط± ط§ظ„ظ…ظ‚ط¨ظˆظ„ط© ظپظ‚ط·."
              : "Proof of payment is available only for accepted quotes."
            : isArabic
              ? "طھط¹ط°ط± ط±ظپط¹ ط¥ط«ط¨ط§طھ ط§ظ„ط¯ظپط¹."
              : "Unable to upload proof of payment.",
      );
    } finally {
      setUploadingReceiptId(null);
      if (receiptInputRef.current) receiptInputRef.current.value = "";
    }
  }

  async function createSalesInvoice() {
    if (!invoiceQuote) return;
    setInvoiceMessage(
      isArabic ? "ط¬ط§ط±ظٹ ط¥ظ†ط´ط§ط، ط§ظ„ظپط§طھظˆط±ط©..." : "Creating invoice...",
    );
    try {
      const response = await fetch("/api/v1/admin/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ quote_id: invoiceQuote.id }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "CREATE_FAILED");
      }
      setInvoiceQuote(null);
      onReload();
    } catch (error) {
      setInvoiceMessage(
        error instanceof Error && error.message === "SALE_ALREADY_EXISTS"
          ? isArabic
            ? "طھظ… ط¥ظ†ط´ط§ط، ظپط§طھظˆط±ط© ظ…ط¨ظٹط¹ط§طھ ظ„ظ‡ط°ط§ ط§ظ„ط¹ط±ط¶ ظ…ط³ط¨ظ‚ط§ظ‹"
            : "A sales invoice already exists for this quote"
          : error instanceof Error && error.message === "QUOTE_NOT_PAID"
            ? isArabic
              ? "ظ„ط§ ظٹظ…ظƒظ† ط¥ظ†ط´ط§ط، ظپط§طھظˆط±ط© ظ‚ط¨ظ„ ط¯ظپط¹ ط¹ط±ط¶ ط§ظ„ط³ط¹ط±"
              : "A sales invoice cannot be created before payment"
            : isArabic
              ? "طھط¹ط°ط± ط¥ظ†ط´ط§ط، ظپط§طھظˆط±ط© ط§ظ„ظ…ط¨ظٹط¹ط§طھ"
              : "Unable to create the sales invoice",
      );
    }
  }

  return (
    <section className="admin-account-quotes">
      <div className="admin-account-section-head">
        <h2 className="admin-account-section-title">
          {isArabic ? "ط¹ط±ظˆط¶ ط§ظ„ط£ط³ط¹ط§ط±" : "Quotes"}
        </h2>
        <div className="admin-account-filter-actions">
          <button
            aria-pressed={isAdvancedFilter}
            className={`admin-account-advanced-filter${isAdvancedFilter ? " active" : ""}`}
            onClick={() => setIsAdvancedFilter((current) => !current)}
            type="button"
          >
            {isArabic ? "ظپظ„طھط±ط© ظ…طھظ‚ط¯ظ…ط©" : "Advanced Filter"}
          </button>
          <div className="admin-account-user-filter">
            <DashboardSelect
              ariaLabel={isArabic ? "ظپظ„طھط±ط© ط­ط³ط¨ ط§ظ„ظ…ط³طھط®ط¯ظ…" : "Filter by user"}
              onValueChange={setAccountUserFilter}
              options={[
                {
                  value: "all",
                  label: isArabic ? "ظƒظ„ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†" : "All users",
                },
                ...accountUserOptions,
              ]}
              searchable
              searchPlaceholder={
                isArabic ? "ط§ط¨ط­ط« ط¹ظ† ظ…ط³طھط®ط¯ظ…..." : "Search users..."
              }
              value={accountUserFilter}
            />
          </div>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-account-quotes-table">
          <thead>
            <tr>
              <th>{isArabic ? "ط±ظ‚ظ… ط§ظ„ط¹ط±ط¶" : "Quote Number"}</th>
              <th>{isArabic ? "ط§ط³ظ… ط§ظ„ط¹ظ…ظٹظ„" : "Client Name"}</th>
              <th>{isArabic ? "ط§ظ„ظ…ظ†طھط¬" : "Product"}</th>
              <th>{isArabic ? "ط§ظ„ظ…ط¨ظ„ط؛" : "Amount"}</th>
              <th>{isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"}</th>
              <th>{isArabic ? "ط§ظ„ظ…ط³طھط®ط¯ظ…" : "User"}</th>
              <th>{isArabic ? "ط§ظ„طھط§ط±ظٹط®" : "Date"}</th>
              <th>{isArabic ? "ط¥ط¬ط±ط§ط،" : "Action"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((quote) => {
              const hasSalesInvoice = Boolean(
                String(quote.sales_invoice_number ?? "").trim(),
              );
              const canCreateInvoice =
                String(quote.status ?? "") === "paid" && !hasSalesInvoice;
              const canUploadReceipt =
                String(quote.status ?? "") === "accepted";
              const hasReceipt =
                attachedReceiptQuoteIds.has(quote.id) ||
                Boolean(quote.payment_receipt_url);
              const isUploading = uploadingReceiptId === quote.id;
              return (
                <tr key={quote.id}>
                  <td>{String(quote.quote_number ?? "â€”")}</td>
                  <td>{String(quote.customer_name ?? "â€”")}</td>
                  <td>{String(quote.product_name ?? "â€”")}</td>
                  <td>{`${Number(quote.amount ?? 0).toLocaleString(NUMBER_LOCALE)} ${String(quote.currency ?? "SAR")}`}</td>
                  <td>
                    <span
                      className={`admin-status admin-status-${String(quote.status ?? "draft")}`}
                    >
                      {displayAdminValue(quote.status, isArabic)}
                    </span>
                  </td>
                  <td>{String(quote.affiliate_user_name ?? "â€”")}</td>
                  <td>{String(quote.created_at ?? "â€”").slice(0, 10)}</td>
                  <td>
                    <div className="admin-quote-action-row">
                      <button
                        className="admin-create-invoice"
                        disabled={!canCreateInvoice}
                        onClick={() => {
                          setInvoiceMessage("");
                          setInvoiceQuote(quote);
                        }}
                        title={
                          canCreateInvoice
                            ? undefined
                            : isArabic
                              ? "ظٹطھط§ط­ ط¨ط¹ط¯ ط§ظ„ط¯ظپط¹"
                              : "Available after payment"
                        }
                        type="button"
                      >
                        {hasSalesInvoice
                          ? isArabic
                            ? "طھظ… ط¥ظ†ط´ط§ط، ظپط§طھظˆط±ط© ظ…ط¨ظٹط¹ط§طھ"
                            : "Sales Invoice Created"
                          : isArabic
                            ? "ط¥ظ†ط´ط§ط، ظپط§طھظˆط±ط© ظ…ط¨ظٹط¹ط§طھ"
                            : "Create Sales Invoice"}
                      </button>
                      <button
                        className={`admin-proof-payment${hasReceipt ? " is-attached" : ""}`}
                        disabled={!canUploadReceipt || isUploading}
                        onClick={() => openReceiptPicker(quote)}
                        title={
                          canUploadReceipt
                            ? undefined
                            : isArabic
                              ? "ظٹطھط§ط­ ظ„ط¹ط±ظˆط¶ ط§ظ„ط£ط³ط¹ط§ط± ط§ظ„ظ…ظ‚ط¨ظˆظ„ط© ظپظ‚ط·"
                              : "Available only for accepted quotes"
                        }
                        type="button"
                      >
                        <span aria-hidden="true">?</span>
                        {isUploading
                          ? isArabic
                            ? "ط¬ط§ط±ظٹ ط§ظ„ط±ظپط¹..."
                            : "Uploading..."
                          : hasReceipt
                            ? isArabic
                              ? "طھظ… ط¥ط«ط¨ط§طھ ط§ظ„ط¯ظپط¹"
                              : "Payment Proven"
                            : isArabic
                              ? "ط¥ط«ط¨ط§طھ ط§ظ„ط¯ظپط¹"
                              : "Proof of Payment"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td className="admin-empty" colSpan={8}>
                  {isArabic ? "ظ„ط§ طھظˆط¬ط¯ ط¹ط±ظˆط¶" : "No quotes found"}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <input
        ref={receiptInputRef}
        accept="image/*,application/pdf"
        className="admin-proof-payment-input"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadReceipt(file);
        }}
        type="file"
      />
      {receiptMessage ? (
        <p className="admin-receipt-message">{receiptMessage}</p>
      ) : null}
      <div className="admin-account-quote-footer">
        <div className="admin-account-total">
          {isArabic ? "ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ:" : "Total:"}{" "}
          <strong>{total.toLocaleString(NUMBER_LOCALE)} SAR</strong>
        </div>
      </div>
      <AdminSalesList
        data={advancedSales}
        isArabic={isArabic}
        onReload={onReload}
      />
      <AdminCommissionList
        data={advancedCommissions}
        isArabic={isArabic}
        onReload={onReload}
      />
      {invoiceQuote ? (
        <div
          className="admin-edit-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setInvoiceQuote(null);
          }}
          role="presentation"
        >
          <section
            className="admin-edit-modal admin-sales-invoice-modal"
            aria-modal="true"
            role="dialog"
          >
            <div className="admin-edit-head">
              <div>
                <span>{isArabic ? "ظپط§طھظˆط±ط© ظ…ط¨ظٹط¹ط§طھ" : "Sales Invoice"}</span>
                <h3>
                  {isArabic
                    ? "طھط£ظƒظٹط¯ ط¥ظ†ط´ط§ط، ظپط§طھظˆط±ط© ط§ظ„ظ…ط¨ظٹط¹ط§طھ"
                    : "Confirm Sales Invoice"}
                </h3>
              </div>
              <button onClick={() => setInvoiceQuote(null)} type="button">
                X
              </button>
            </div>
            <div className="admin-invoice-details">
              <div>
                <span>{isArabic ? "ط±ظ‚ظ… ط§ظ„ظ…ط¨ظٹط¹ط§طھ" : "Sales Number"}</span>
                <strong>
                  {isArabic ? "ظٹظڈظ†ط´ط£ طھظ„ظ‚ط§ط¦ظٹط§ظ‹" : "Generated automatically"}
                </strong>
              </div>
              <div>
                <span>{isArabic ? "ط§ط³ظ… ط§ظ„ط¹ظ…ظٹظ„" : "Client Name"}</span>
                <strong>{String(invoiceQuote.customer_name ?? "â€”")}</strong>
              </div>
              <div>
                <span>{isArabic ? "ط§ظ„ظ…ظ†طھط¬" : "Product"}</span>
                <strong>{String(invoiceQuote.product_name ?? "â€”")}</strong>
              </div>
              <div>
                <span>{isArabic ? "ط§ظ„ظ…ط¨ظ„ط؛" : "Amount"}</span>
                <strong>{`${Number(invoiceQuote.amount ?? 0).toLocaleString(NUMBER_LOCALE)} ${String(invoiceQuote.currency ?? "SAR")}`}</strong>
              </div>
              <div>
                <span>{isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"}</span>
                <strong>{isArabic ? "ظ‚ظٹط¯ ط§ظ„ط§ظ†طھط¸ط§ط±" : "Pending"}</strong>
              </div>
              <div>
                <span>{isArabic ? "ط§ظ„ظ…ط³طھط®ط¯ظ…" : "User"}</span>
                <strong>
                  {String(invoiceQuote.affiliate_user_name ?? "â€”")}
                </strong>
              </div>
              <div>
                <span>{isArabic ? "ط±ظ‚ظ… ط§ظ„ط¹ط±ط¶" : "Quote Number"}</span>
                <strong>{String(invoiceQuote.quote_number ?? "â€”")}</strong>
              </div>
              <div>
                <span>{isArabic ? "ط§ظ„طھط§ط±ظٹط®" : "Date"}</span>
                <strong>
                  {new Date().toLocaleDateString(isArabic ? ARABIC_DATE_LOCALE : NUMBER_LOCALE)}
                </strong>
              </div>
              <div>
                <span>{isArabic ? "ط§ظ„ط¥ظٹطµط§ظ„" : "Receipt"}</span>
                <strong>
                  {isArabic ? "ظٹظڈظ†ط´ط£ ظ…ط¹ ط§ظ„ظپط§طھظˆط±ط©" : "Created with invoice"}
                </strong>
              </div>
            </div>
            {invoiceMessage ? (
              <p className="admin-invoice-message">{invoiceMessage}</p>
            ) : null}
            <div className="admin-edit-actions">
              <button
                className="primary"
                onClick={() => void createSalesInvoice()}
                type="button"
              >
                {isArabic ? "ط¥ظ†ط´ط§ط، ط§ظ„ظپط§طھظˆط±ط©" : "Create Invoice"}
              </button>
              <button onClick={() => setInvoiceQuote(null)} type="button">
                {isArabic ? "ط¥ظ„ط؛ط§ط،" : "Cancel"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function AdminSalesList({
  data,
  isArabic,
  onReload,
}: {
  data: AdminRow[];
  isArabic: boolean;
  onReload: () => void;
}) {
  const [commissionSale, setCommissionSale] = useState<AdminRow | null>(null);
  const [commissionPercent, setCommissionPercent] = useState(20);
  const [commissionMessage, setCommissionMessage] = useState("");
  const [createdCommissionSaleIds, setCreatedCommissionSaleIds] = useState<
    Set<number>
  >(() => new Set());
  async function createCommission() {
    if (!commissionSale) return;
    setCommissionMessage(
      isArabic ? "ط¬ط§ط±ظٹ ط¥ظ†ط´ط§ط، ط§ظ„ط¹ظ…ظˆظ„ط©..." : "Creating commission...",
    );
    try {
      const response = await fetch("/api/v1/admin/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          sale_id: commissionSale.id,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "CREATE_FAILED");
      }
      setCreatedCommissionSaleIds((current) =>
        new Set(current).add(commissionSale.id),
      );
      setCommissionSale(null);
      onReload();
    } catch (error) {
      setCommissionMessage(
        error instanceof Error && error.message === "COMMISSION_ALREADY_EXISTS"
          ? isArabic
            ? "طھظ… ط¥ظ†ط´ط§ط، ط¹ظ…ظˆظ„ط© ظ„ظ‡ط°ظ‡ ط§ظ„ظ…ط¨ظٹط¹ط§طھ ظ…ط³ط¨ظ‚ط§ظ‹"
            : "A commission already exists for this sale"
          : isArabic
            ? "طھط¹ط°ط± ط¥ظ†ط´ط§ط، ط§ظ„ط¹ظ…ظˆظ„ط©"
            : "Unable to create the commission",
      );
    }
  }

  const commissionAmount = commissionSale
    ? (Number(commissionSale.sale_amount ?? 0) * commissionPercent) / 100
    : 0;
  const commissionLevel = commissionSale
    ? commissionLevelForSalesCount(commissionSale.affiliate_sales_count)
    : "ظ…ط¨طھط¯ط¦";
  const total = data.reduce(
    (sum, sale) => sum + Number(sale.sale_amount ?? 0),
    0,
  );
  return (
    <section className="admin-sales-list">
      <h2>{isArabic ? "ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…ط¨ظٹط¹ط§طھ" : "Sales List"}</h2>
      <div className="admin-table-wrap">
        <table className="admin-account-quotes-table">
          <thead>
            <tr>
              <th>{isArabic ? "ط±ظ‚ظ… ط§ظ„ظ…ط¨ظٹط¹ط§طھ" : "Sales Number"}</th>
              <th>{isArabic ? "ط§ط³ظ… ط§ظ„ط¹ظ…ظٹظ„" : "Client Name"}</th>
              <th>{isArabic ? "ط§ظ„ظ…ظ†طھط¬" : "Product"}</th>
              <th>{isArabic ? "ط§ظ„ظ…ط¨ظ„ط؛" : "Amount"}</th>
              <th>{isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"}</th>
              <th>{isArabic ? "ط§ظ„ظ…ط³طھط®ط¯ظ…" : "User"}</th>
              <th>{isArabic ? "ط±ظ‚ظ… ط§ظ„ط¹ط±ط¶" : "Quote Number"}</th>
              <th>{isArabic ? "ط§ظ„طھط§ط±ظٹط®" : "Date"}</th>
              <th>{isArabic ? "ط¥ظ†ط´ط§ط، ط§ظ„ط¹ظ…ظˆظ„ط§طھ" : "Create Commission"}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((sale) => {
              const canCreateCommission =
                !sale.commission_id && !createdCommissionSaleIds.has(sale.id);
              return (
                <tr key={sale.id}>
                  <td>{String(sale.sales_invoice_number ?? `S-${sale.id}`)}</td>
                  <td>{String(sale.customer_name ?? "â€”")}</td>
                  <td>{String(sale.product_name ?? "â€”")}</td>
                  <td>{`${Number(sale.sale_amount ?? 0).toLocaleString(NUMBER_LOCALE)} ${String(sale.currency ?? "SAR")}`}</td>
                  <td>
                    <span
                      className={`admin-status admin-status-${String(sale.status ?? "pending")}`}
                    >
                      {displayAdminValue(sale.status, isArabic)}
                    </span>
                  </td>
                  <td>{String(sale.affiliate_user_name ?? "â€”")}</td>
                  <td>{String(sale.quote_number ?? "â€”")}</td>
                  <td>
                    {String(sale.sold_at ?? sale.created_at ?? "â€”").slice(
                      0,
                      10,
                    )}
                  </td>
                  <td>
                    <button
                      className="admin-create-commission"
                      disabled={!canCreateCommission}
                      onClick={() => {
                        setCommissionMessage("");
                        setCommissionPercent(
                          Number(sale.affiliate_comission_percentage ?? 20),
                        );
                        setCommissionSale(sale);
                      }}
                      type="button"
                    >
                      {canCreateCommission
                        ? isArabic
                          ? "ط¥ظ†ط´ط§ط، ط§ظ„ط¹ظ…ظˆظ„ط§طھ"
                          : "Create Commission"
                        : isArabic
                          ? "طھظ… ط¥ظ†ط´ط§ط، ط§ظ„ط¹ظ…ظˆظ„ط©"
                          : "Commission Created"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {data.length === 0 ? (
              <tr>
                <td className="admin-empty" colSpan={9}>
                  {isArabic ? "ظ„ط§ طھظˆط¬ط¯ ظ…ط¨ظٹط¹ط§طھ" : "No sales found"}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="admin-account-quote-footer">
        <div className="admin-account-total">
          {isArabic ? "ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ:" : "Total:"}{" "}
          <strong>{total.toLocaleString(NUMBER_LOCALE)} SAR</strong>
        </div>
      </div>
      {commissionSale ? (
        <div
          className="admin-edit-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCommissionSale(null);
          }}
          role="presentation"
        >
          <section
            className="admin-edit-modal admin-sales-invoice-modal"
            aria-modal="true"
            role="dialog"
          >
            <div className="admin-edit-head">
              <div>
                <span>{isArabic ? "ط¹ظ…ظˆظ„ط© ط§ظ„ظ…ط¨ظٹط¹ط§طھ" : "Sales Commission"}</span>
                <h3>
                  {isArabic
                    ? "طھط£ظƒظٹط¯ ط¥ظ†ط´ط§ط، ط§ظ„ط¹ظ…ظˆظ„ط©"
                    : "Confirm Commission Creation"}
                </h3>
              </div>
              <button onClick={() => setCommissionSale(null)} type="button">
                X
              </button>
            </div>
            <div className="admin-invoice-details">
              <div>
                <span>{isArabic ? "ط±ظ‚ظ… ط§ظ„ظ…ط¨ظٹط¹ط§طھ" : "Sales Number"}</span>
                <strong>
                  {String(
                    commissionSale.sales_invoice_number ??
                      `S-${commissionSale.id}`,
                  )}
                </strong>
              </div>
              <div>
                <span>{isArabic ? "ط§ط³ظ… ط§ظ„ط¹ظ…ظٹظ„" : "Client Name"}</span>
                <strong>{String(commissionSale.customer_name ?? "â€”")}</strong>
              </div>
              <div>
                <span>{isArabic ? "ط§ظ„ظ…ظ†طھط¬" : "Product"}</span>
                <strong>{String(commissionSale.product_name ?? "â€”")}</strong>
              </div>
              <div>
                <span>{isArabic ? "ظ…ط¨ظ„ط؛ ط§ظ„ظ…ط¨ظٹط¹ط§طھ" : "Sales Amount"}</span>
                <strong>{`${Number(commissionSale.sale_amount ?? 0).toLocaleString(NUMBER_LOCALE)} ${String(commissionSale.currency ?? "SAR")}`}</strong>
              </div>
              <div>
                <span>{isArabic ? "ط§ظ„ظ…ط³طھط®ط¯ظ…" : "User"}</span>
                <strong>
                  {String(commissionSale.affiliate_user_name ?? "â€”")}
                </strong>
              </div>
              <div>
                <span>{isArabic ? "ط¹ط¯ط¯ ط§ظ„ظ…ط¨ظٹط¹ط§طھ" : "Sales Count"}</span>
                <strong>
                  {String(commissionSale.affiliate_sales_count ?? 0)}
                </strong>
              </div>
              <div>
                <span>{isArabic ? "ط§ظ„ظ…ط³طھظˆظ‰" : "Level"}</span>
                <strong>{commissionLevel}</strong>
              </div>
              <div>
                <span>
                  {isArabic ? "ظ†ط³ط¨ط© ط§ظ„ط¹ظ…ظˆظ„ط©" : "Commission Percentage"}
                </span>
                <strong>{`${commissionPercent}%`}</strong>
              </div>
              <div>
                <span>{isArabic ? "ظ…ط¨ظ„ط؛ ط§ظ„ط¹ظ…ظˆظ„ط©" : "Commission Amount"}</span>
                <strong>{`${commissionAmount.toLocaleString(NUMBER_LOCALE, { maximumFractionDigits: 2 })} ${String(commissionSale.currency ?? "SAR")}`}</strong>
              </div>
              <div>
                <span>{isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"}</span>
                <strong>{isArabic ? "ظ‚ظٹط¯ ط§ظ„ط§ظ†طھط¸ط§ط±" : "Pending"}</strong>
              </div>
            </div>
            {commissionMessage ? (
              <p className="admin-invoice-message">{commissionMessage}</p>
            ) : null}
            <div className="admin-edit-actions">
              <button
                className="primary"
                onClick={() => void createCommission()}
                type="button"
              >
                {isArabic ? "ط¥ظ†ط´ط§ط، ط§ظ„ط¹ظ…ظˆظ„ط©" : "Create Commission"}
              </button>
              <button onClick={() => setCommissionSale(null)} type="button">
                {isArabic ? "ط¥ظ„ط؛ط§ط،" : "Cancel"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function AdminCommissionList({
  data = [],
  isArabic,
  onReload,
}: {
  data?: AdminRow[];
  isArabic: boolean;
  onReload: () => void;
}) {
  const [approvalMessage, setApprovalMessage] = useState("");
  const [paymentCommission, setPaymentCommission] = useState<AdminRow | null>(
    null,
  );
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [isLinkingPayment, setIsLinkingPayment] = useState(false);
  const total = data.reduce(
    (sum, commission) => sum + Number(commission.commission_amount ?? 0),
    0,
  );

  async function approveCommission(id: number) {
    setApprovalMessage("");
    try {
      const response = await fetch(`/api/v1/admin/commissions/${id}/approve`, {
        method: "PUT",
      });
      if (!response.ok) throw new Error("APPROVE_FAILED");
      onReload();
    } catch {
      setApprovalMessage(
        isArabic ? "طھط¹ط°ط± طھط¹ظ…ظٹط¯ ط§ظ„ط¹ظ…ظˆظ„ط©" : "Unable to approve the commission",
      );
    }
  }

  async function linkPayment() {
    if (!paymentCommission || !paymentReference.trim()) return;
    setIsLinkingPayment(true);
    setPaymentMessage("");
    try {
      const response = await fetch(
        `/api/v1/admin/commissions/${paymentCommission.id}/payment`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ payment_reference: paymentReference.trim() }),
        },
      );
      if (!response.ok) throw new Error("LINK_PAYMENT_FAILED");
      setPaymentCommission(null);
      setPaymentReference("");
      onReload();
    } catch {
      setPaymentMessage(
        isArabic
          ? "طھط¹ط°ط± ط±ط¨ط· ظ…ط±ط¬ط¹ ط§ظ„ط¯ظپط¹ ط¨ط§ظ„ط¹ظ…ظˆظ„ط©."
          : "Unable to link the payment reference.",
      );
    } finally {
      setIsLinkingPayment(false);
    }
  }

  return (
    <section className="admin-sales-list admin-commission-list">
      <h2>{isArabic ? "ظ‚ط§ط¦ظ…ط© ط§ظ„ط¹ظ…ظˆظ„ط§طھ" : "Commissions List"}</h2>
      <div className="admin-table-wrap">
        <table className="admin-account-quotes-table">
          <thead>
            <tr>
              <th>{isArabic ? "ط§ظ„ط±ظ‚ظ…" : "ID"}</th>
              <th>{isArabic ? "ط±ظ‚ظ… ط§ظ„ظ…ط¨ظٹط¹ط§طھ" : "Sales Number"}</th>
              <th>{isArabic ? "ط§ظ„ظ…ط³طھط®ط¯ظ…" : "User"}</th>
              <th>{isArabic ? "ظ†ظˆط¹ ط§ظ„ط¹ظ…ظˆظ„ط©" : "Commission Type"}</th>
              <th>{isArabic ? "ط§ظ„ظ…ط¨ظ„ط؛" : "Amount"}</th>
              <th>{isArabic ? "ط§ظ„ظ†ط³ط¨ط©" : "Commission Percentage"}</th>
              <th>{isArabic ? "ط§ظ„ط­ط§ظ„ط©" : "Status"}</th>
              <th>{isArabic ? "طھط§ط±ظٹط® ط§ظ„ظپط§طھظˆط±ط©" : "Invoice Date"}</th>
              <th>{isArabic ? "طھط§ط±ظٹط® ط§ظ„طھط¹ظ…ظٹط¯" : "Approval Date"}</th>
              <th>{isArabic ? "طھط§ط±ظٹط® ط§ظ„ط³ط¯ط§ط¯" : "Payment Date"}</th>
              <th>{isArabic ? "طھط¹ظ…ظٹط¯ ط§ظ„ط¹ظ…ظˆظ„ط§طھ" : "Approve Commissions"}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((commission) => {
              const canApprove = String(commission.status ?? "") === "pending";
              const canLinkPayment =
                String(commission.status ?? "") === "approved";
              return (
                <tr key={commission.id}>
                  <td>{String(commission.id)}</td>
                  <td>
                    {String(
                      commission.sales_invoice_number ??
                        `S-${String(commission.sale_id ?? "â€”")}`,
                    )}
                  </td>
                  <td>{String(commission.affiliate_user_name ?? "â€”")}</td>
                  <td>{String(commission.commission_type ?? "â€”")}</td>
                  <td>{`${Number(commission.commission_amount ?? 0).toLocaleString(NUMBER_LOCALE)} ${String(commission.currency ?? "SAR")}`}</td>
                  <td>{`${Number(commission.commission_percent ?? 0)}%`}</td>
                  <td>
                    <span
                      className={`admin-status admin-status-${String(commission.status ?? "pending")}`}
                    >
                      {displayAdminValue(commission.status, isArabic)}
                    </span>
                  </td>
                  <td>{String(commission.created_at ?? "â€”").slice(0, 10)}</td>
                  <td>{String(commission.approved_at ?? "â€”").slice(0, 10)}</td>
                  <td>{String(commission.paid_at ?? "â€”").slice(0, 10)}</td>
                  <td>
                    {canApprove ? (
                      <button
                        className="admin-approve-commissions"
                        onClick={() => void approveCommission(commission.id)}
                        type="button"
                      >
                        {isArabic ? "طھط¹ظ…ظٹط¯ ط§ظ„ط¹ظ…ظˆظ„ط§طھ" : "Approve Commissions"}
                      </button>
                    ) : null}
                    {canLinkPayment ? (
                      <button
                        className={`admin-link-payment${commission.payment_reference ? " is-linked" : ""}`}
                        onClick={() => {
                          setPaymentMessage("");
                          setPaymentReference(
                            String(commission.payment_reference ?? ""),
                          );
                          setPaymentCommission(commission);
                        }}
                        type="button"
                      >
                        <span aria-hidden="true">?</span>
                        {commission.payment_reference
                          ? isArabic
                            ? "طھظ… ط±ط¨ط· ط§ظ„ط¯ظپط¹"
                            : "Payment Linked"
                          : isArabic
                            ? "ط±ط¨ط· ط§ظ„ط¯ظپط¹"
                            : "Link Payment"}
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {data.length === 0 ? (
              <tr>
                <td className="admin-empty" colSpan={11}>
                  {isArabic ? "ظ„ط§ طھظˆط¬ط¯ ط¹ظ…ظˆظ„ط§طھ" : "No commissions found"}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="admin-account-quote-footer">
        <div className="admin-account-total">
          {isArabic ? "ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ:" : "Total:"}{" "}
          <strong>{total.toLocaleString(NUMBER_LOCALE)} SAR</strong>
        </div>
      </div>
      {approvalMessage ? (
        <p className="admin-invoice-message">{approvalMessage}</p>
      ) : null}
      {paymentCommission ? (
        <div
          className="admin-edit-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget)
              setPaymentCommission(null);
          }}
          role="presentation"
        >
          <section
            className="admin-edit-modal admin-payment-link-modal"
            aria-modal="true"
            role="dialog"
          >
            <div className="admin-edit-head">
              <div>
                <span>{isArabic ? "ط¯ظپط¹ط© ط§ظ„ط¹ظ…ظˆظ„ط©" : "Commission Payment"}</span>
                <h3>{isArabic ? "ط±ط¨ط· ط§ظ„ط¯ظپط¹" : "Link Payment"}</h3>
              </div>
              <button onClick={() => setPaymentCommission(null)} type="button">
                X
              </button>
            </div>
            <p className="admin-payment-link-copy">
              {isArabic
                ? `ط£ط¯ط®ظ„ ط±ظ‚ظ… ط§ظ„طھط­ظˆظٹظ„ ط£ظˆ ظ…ط±ط¬ط¹ ط§ظ„ط¹ظ…ظ„ظٹط© ظ„ظ„ط¹ظ…ظˆظ„ط© ط±ظ‚ظ… ${paymentCommission.id}.`
                : `Enter the bank transfer or transaction reference for commission #${paymentCommission.id}.`}
            </p>
            <label>
              <span>{isArabic ? "ظ…ط±ط¬ط¹ ط§ظ„ط¯ظپط¹" : "Payment Reference"}</span>
              <input
                autoFocus
                onChange={(event) => setPaymentReference(event.target.value)}
                placeholder={
                  isArabic ? "ظ…ط«ط§ظ„: TXN-123456" : "Example: TXN-123456"
                }
                value={paymentReference}
              />
            </label>
            {paymentMessage ? (
              <p className="admin-invoice-message">{paymentMessage}</p>
            ) : null}
            <div className="admin-edit-actions">
              <button
                className="primary"
                disabled={!paymentReference.trim() || isLinkingPayment}
                onClick={() => void linkPayment()}
                type="button"
              >
                {isLinkingPayment
                  ? isArabic
                    ? "ط¬ط§ط±ظچ ط§ظ„ط­ظپط¸..."
                    : "Saving..."
                  : isArabic
                    ? "ط­ظپط¸ ط§ظ„ط±ط¨ط·"
                    : "Save Link"}
              </button>
              <button onClick={() => setPaymentCommission(null)} type="button">
                {isArabic ? "ط¥ظ„ط؛ط§ط،" : "Cancel"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

