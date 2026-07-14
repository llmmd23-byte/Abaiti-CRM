"use client";

import {useLocale, useTranslations} from "next-intl";
import {Link, usePathname, useRouter} from "@/i18n/navigation";
import Image from "next/image";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {signOutAction} from "@/app/auth-actions";
import {useEffect, useState} from "react";

type DashboardSection =
  | "overview"
  | "customers"
  | "stores"
  | "demo"
  | "accounts"
  | "productInfo"
  | "products"
  | "quotes"
  | "participationContracts"
  | "sponsorshipContracts"
  | "salesOrders"
  | "rentalContracts"
  | "commissions"
  | "education"
  | "support"
  | "settings";

type DashboardHref =
  | "/dashboard"
  | "/dashboard/customers"
  | "/dashboard/stores"
  | "/dashboard/demo"
  | "/dashboard/accounts"
  | "/dashboard/product-info"
  | "/educational-hub"
  | "/dashboard/products"
  | "/dashboard/quotes"
  | "/dashboard/participation-contracts"
  | "/dashboard/sponsorship-contracts"
  | "/dashboard/sales-orders"
  | "/dashboard/rental-contracts"
  | "/dashboard/commissions"
  | "/dashboard/educational-hub"
  | "/dashboard/support"
  | "/dashboard/settings";

type NavItem = {
  key: DashboardSection;
  href: DashboardHref;
  label: string;
  icon?:
    | "dashboard"
    | "products"
    | "marketing"
    | "leads"
    | "stores"
    | "quotes"
    | "sales"
    | "education"
    | "support"
    | "accounts"
    | "settings";
};

type SessionPermission = {can_view?: boolean};

const sectionPermissionKeys: Partial<Record<DashboardSection, string>> = {
  overview: "page.user.overview",
  products: "page.user.marketing",
  customers: "page.user.customers",
  stores: "page.user.stores",
  quotes: "page.user.quotes",
  participationContracts: "page.user.participation_contracts",
  sponsorshipContracts: "page.user.sponsorship_contracts",
  salesOrders: "page.user.sales_orders",
  rentalContracts: "page.user.rental_contracts",
  commissions: "page.user.sales",
  productInfo: "page.user.activation",
  education: "page.user.education",
  support: "page.user.support",
  accounts: "page.user.accounts",
  settings: "page.user.settings",
};

const overviewItem: NavItem = {key: "overview", href: "/dashboard", label: "portal.overview", icon: "dashboard"};

const coreGrowthItems: NavItem[] = [
  {
    key: "products",
    href: "/dashboard/products",
    label: "portal.marketing",
    icon: "marketing"
  },
  {
    key: "customers",
    href: "/dashboard/customers",
    label: "portal.potentialCustomers",
    icon: "leads"
  },
  {
    key: "stores",
    href: "/dashboard/stores",
    label: "portal.stores",
    icon: "stores"
  },
  {key: "quotes", href: "/dashboard/quotes", label: "portal.salesTools", icon: "quotes"},
  {
    key: "participationContracts",
    href: "/dashboard/participation-contracts",
    label: "portal.participationContracts",
    icon: "quotes"
  },
  {
    key: "sponsorshipContracts",
    href: "/dashboard/sponsorship-contracts",
    label: "portal.sponsorshipContracts",
    icon: "quotes"
  },
  {
    key: "salesOrders",
    href: "/dashboard/sales-orders",
    label: "portal.salesOrders",
    icon: "quotes"
  },
  {
    key: "rentalContracts",
    href: "/dashboard/rental-contracts",
    label: "portal.rentalContracts",
    icon: "quotes"
  },
  {
    key: "commissions",
    href: "/dashboard/commissions",
    label: "portal.sales",
    icon: "sales"
  },
  {
    key: "productInfo",
    href: "/dashboard/product-info",
    label: "portal.activation",
    icon: "products"
  }
];

const supportResourceItems: NavItem[] = [
  {
    key: "education",
    href: "/dashboard/educational-hub",
    label: "portal.educationalHub",
    icon: "education"
  },
  {key: "support", href: "/dashboard/support", label: "portal.helpDesk", icon: "support"},
  {
    key: "accounts",
    href: "/dashboard/accounts",
    label: "portal.accounts",
    icon: "accounts"
  },
  {key: "settings", href: "/dashboard/settings", label: "portal.settings", icon: "settings"}
];

function NavItemIcon({icon}: {icon: NavItem["icon"]}) {
  if (!icon) {
    return null;
  }

  return (
    <span className="sidebar-nav-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        {icon === "dashboard" ? (
          <>
            <rect x="4" y="4" width="7" height="7" rx="2" />
            <rect x="13" y="4" width="7" height="7" rx="2" />
            <rect x="4" y="13" width="7" height="7" rx="2" />
            <rect x="13" y="13" width="7" height="7" rx="2" />
          </>
        ) : icon === "products" ? (
          <>
            <path d="M4 7.5 12 3l8 4.5-8 4.5L4 7.5Z" />
            <path d="M4 7.5v9L12 21l8-4.5v-9" />
            <path d="M12 12v9" />
          </>
        ) : icon === "marketing" ? (
          <>
            <path d="m3 11 18-5v12L3 13z" />
            <path d="M11.6 16.7a3 3 0 0 1-5.8-1.6" />
            <path d="M21 9.2v5.6" />
            <path d="M6 10.2v3.6" />
          </>
        ) : icon === "leads" ? (
          <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="9.5" cy="7" r="4" />
            <path d="m17 11 2 2 4-4" />
          </>
        ) : icon === "quotes" ? (
          <>
            <path d="M7 3h8l4 4v14H7z" />
            <path d="M15 3v5h5" />
            <path d="M10 12h6" />
            <path d="M10 16h5" />
          </>
        ) : icon === "stores" ? (
          <>
            <path d="M4 9h16l-1.5-5h-13L4 9Z" />
            <path d="M5 9v11h14V9" />
            <path d="M9 20v-6h6v6" />
            <path d="M4 9c0 1.7 2.7 2.7 4 1.2 1.3 1.5 3.7 1.5 5 0 1.3 1.5 4 0 4-1.2" />
          </>
        ) : icon === "sales" ? (
          <>
            <path d="M4 19h16" />
            <path d="m6 15 4-4 3 3 5-7" />
            <path d="M16 7h2v2" />
          </>
        ) : icon === "education" ? (
          <>
            <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H20v17H8.5A3.5 3.5 0 0 0 5 22Z" />
            <path d="M5 5.5V22" />
            <path d="M9 7h7" />
            <path d="M9 11h6" />
          </>
        ) : icon === "support" ? (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9a2.7 2.7 0 0 1 5 1.4c0 1.9-2.5 2.1-2.5 4" />
            <path d="M12 18h.01" />
          </>
        ) : icon === "accounts" ? (
          <>
            <rect x="3" y="6" width="18" height="13" rx="3" />
            <path d="M3 10h18" />
            <path d="M7 15h4" />
          </>
        ) : icon === "settings" ? (
          <>
            <path d="M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.2a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4A2 2 0 0 0 4 9.9l.2.1a2 2 0 0 1 1 1.7v.6a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.8l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.2a2 2 0 0 1 1 1.7v.2a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.2a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.8l-.2-.1a2 2 0 0 1-1-1.7v-.6a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.8l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.2a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2Z" />
            <circle cx="12" cy="12" r="3" />
          </>
        ) : null}
      </svg>
    </span>
  );
}

function LogoutIcon() {
  return (
    <span className="sidebar-logout-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" />
        <path d="M14 16l4-4-4-4" />
        <path d="M9 12h9" />
      </svg>
    </span>
  );
}

export default function DashboardShell({
  initialUser,
  children
}: {
  active?: DashboardSection;
  initialUser?: {
    name?: string;
    role?: string;
    level?: string;
    status?: string;
    permissions?: Record<string, SessionPermission>;
  } | null;
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const direction = locale === "ar" ? "rtl" : "ltr";
  const [pendingHref, setPendingHref] = useState<DashboardHref | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    name?: string;
    role?: string;
    level?: string;
    status?: string;
    permissions?: Record<string, SessionPermission>;
  } | null>(initialUser ?? null);
  useEffect(() => {
    const loadCurrentUser = () => {
      fetch("/api/v1/auth/me", {cache: "no-store"})
        .then((response) => response.ok ? response.json() : null)
        .then((body) => setCurrentUser(body?.data ?? null))
        .catch(() => setCurrentUser(null));
    };
    loadCurrentUser();
    window.addEventListener("profile-updated", loadCurrentUser);
    return () => window.removeEventListener("profile-updated", loadCurrentUser);
  }, []);
  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);
  const accountOwnerName = currentUser?.name ?? (locale === "ar" ? "حساب ميدار" : "Middar account");
  const activityLabel = locale === "ar" ? "\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0646\u0634\u0627\u0637" : "Activity level";
  const activityLevel = currentUser?.role ?? (locale === "ar" ? "مستخدم" : "User");
  const levelLabels: Record<string, {ar: string; en: string}> = {
    "\u0645\u0628\u062a\u062f\u0626": {ar: "\u0645\u0628\u062a\u062f\u0626", en: "Beginner"},
    "\u0646\u0634\u064a\u0637": {ar: "\u0646\u0634\u064a\u0637", en: "Active"},
    "\u0645\u0646\u062c\u0632": {ar: "\u0645\u0646\u062c\u0632", en: "Achiever"},
    "\u0645\u062d\u062a\u0631\u0641": {ar: "\u0645\u062d\u062a\u0631\u0641", en: "Professional"},
    "\u0645\u062d\u062a\u0631\u0641 \u0641\u0636\u064a": {ar: "\u0645\u062d\u062a\u0631\u0641 \u0641\u0636\u064a", en: "Silver Professional"},
    "\u0645\u062d\u062a\u0631\u0641 \u0630\u0647\u0628\u064a": {ar: "\u0645\u062d\u062a\u0631\u0641 \u0630\u0647\u0628\u064a", en: "Gold Professional"},
    "\u0645\u062d\u062a\u0631\u0641 \u0645\u0627\u0633\u064a": {ar: "\u0645\u062d\u062a\u0631\u0641 \u0645\u0627\u0633\u064a", en: "Diamond Professional"}
  };
  const userLevel = currentUser?.level ?? "\u0645\u0628\u062a\u062f\u0626";
  const displayedLevel = levelLabels[userLevel]?.[locale === "ar" ? "ar" : "en"] ?? userLevel;
  const accountStatus = currentUser?.status ?? "inactive";
  const accountStatusLabels: Record<string, string> = {
    active: locale === "ar" ? "\u0646\u0634\u0637" : "Active",
    inactive: locale === "ar" ? "\u063a\u064a\u0631 \u0646\u0634\u0637" : "Inactive",
    pending: locale === "ar" ? "\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629" : "Pending",
    suspended: locale === "ar" ? "\u0645\u0648\u0642\u0648\u0641" : "Suspended"
  };
  const canViewItem = (item: NavItem) => {
    const permissionKey = sectionPermissionKeys[item.key];
    if (!permissionKey || !currentUser) return false;
    return currentUser.permissions?.[permissionKey]?.can_view === true;
  };
  const prefetchItem = (item: NavItem) => {
    router.prefetch(item.href);
  };
  const handleNavIntent = (item: NavItem) => {
    setPendingHref(item.href);
    prefetchItem(item);
  };
  useEffect(() => {
    if (!currentUser) return;
    [overviewItem, ...coreGrowthItems, ...supportResourceItems]
      .filter((item) => {
        const permissionKey = sectionPermissionKeys[item.key];
        return Boolean(
          permissionKey && currentUser.permissions?.[permissionKey]?.can_view,
        );
      })
      .forEach((item) => router.prefetch(item.href));
  }, [currentUser, router]);
  const normalizedPathname = pathname || "/dashboard";
  const activeSection =
    [...coreGrowthItems, ...supportResourceItems, overviewItem].find((item) => {
      if (item.href === "/dashboard") return normalizedPathname === "/dashboard";
      return (
        normalizedPathname === item.href ||
        normalizedPathname.startsWith(`${item.href}/`)
      );
    })?.key ?? "overview";
  const isItemActive = (item: NavItem) => {
    if (pendingHref === item.href) return true;

    if (!pathname) {
      return activeSection === item.key;
    }

    if (item.href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <section className="dashboard-shell dashboard-route-shell" dir={direction} data-locale={locale} data-section={activeSection}>
      <aside className="sidebar">
        <Link className="sidebar-brand sidebar-official-brand cursor-pointer" href="/" aria-label={t("brand.home")}>
          <Image
            alt="Middar"
            className="sidebar-official-logo"
            height={63}
            priority
            src="/middar-logo-transparent-v2.png"
            width={220}
          />
        </Link>

        <nav className="sidebar-nav" aria-label={t("nav.dashboard")}>
          {canViewItem(overviewItem) ? (
            <div className="sidebar-nav-item">
              <Link
                className={`${isItemActive(overviewItem) ? "active" : ""} has-nav-icon`}
                href={overviewItem.href}
                onClick={() => handleNavIntent(overviewItem)}
                onPointerEnter={() => prefetchItem(overviewItem)}
                prefetch
              >
                <NavItemIcon icon={overviewItem.icon} />
                {t(overviewItem.label)}
              </Link>
            </div>
          ) : null}

          <div className="sidebar-nav-group core-growth-group">
            {coreGrowthItems.filter(canViewItem).map((item) => {
              const itemLabel = t(item.label);

              return (
                <div className="sidebar-nav-item" key={item.key}>
                  <Link
                    className={`${isItemActive(item) ? "active" : ""} ${item.icon ? "has-nav-icon" : ""}`}
                    href={item.href}
                    onClick={() => handleNavIntent(item)}
                    onPointerEnter={() => prefetchItem(item)}
                    prefetch
                  >
                    <NavItemIcon icon={item.icon} />
                    {itemLabel}
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="sidebar-nav-divider" aria-hidden="true" />

          <div className="sidebar-nav-group support-resource-group">
            {supportResourceItems.filter(canViewItem).map((item) => {
              const itemLabel = t(item.label);

              return (
                <div className="sidebar-nav-item" key={item.key}>
                  <Link
                    className={`${isItemActive(item) ? "active" : ""} ${item.icon ? "has-nav-icon" : ""}`}
                    href={item.href}
                    onClick={() => handleNavIntent(item)}
                    onPointerEnter={() => prefetchItem(item)}
                    prefetch
                  >
                    <NavItemIcon icon={item.icon} />
                    {itemLabel}
                  </Link>
                </div>
              );
            })}
          </div>
        </nav>

        <div className="sidebar-bottom-actions">
          <div className="sidebar-meta">
            <div className="sidebar-profile-stack">
              <strong className="sidebar-profile-name">{accountOwnerName}</strong>
              <div className="sidebar-profile-row">
                <span>{activityLabel}</span>
                <b>{displayedLevel}</b>
              </div>
              <div className="sidebar-profile-row sidebar-status-row">
                <span>{t("dashboardPages.sidebar.accountStatus")}</span>
                <strong className={`account-status-${accountStatus}`}>
                  <i aria-hidden="true" />
                  {accountStatusLabels[accountStatus] ?? accountStatus}
                </strong>
              </div>
            </div>
          </div>

          <div className="sidebar-language-control">
            <LanguageSwitcher />
          </div>

          <div className="sidebar-session-actions">
            <form action={signOutAction}>
              <input name="locale" type="hidden" value={locale} />
              <button className="sidebar-logout-link" type="submit">
                <LogoutIcon />
                {t("dashboardPages.sidebar.logout")}
              </button>
            </form>
          </div>
        </div>
      </aside>

      <section className="dashboard-main dashboard-page">{children}</section>
    </section>
  );
}
