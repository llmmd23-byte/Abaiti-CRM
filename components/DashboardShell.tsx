"use client";

import {useLocale, useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {cn, theme} from "@/components/ui";

type DashboardSection =
  | "overview"
  | "customers"
  | "demo"
  | "accounts"
  | "productInfo"
  | "products"
  | "quotes"
  | "commissions"
  | "education"
  | "support"
  | "settings";

type DashboardHref =
  | "/dashboard"
  | "/dashboard/customers"
  | "/dashboard/demo"
  | "/dashboard/accounts"
  | "/dashboard/product-info"
  | "/educational-hub"
  | "/dashboard/products"
  | "/dashboard/quotes"
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
    | "quotes"
    | "sales"
    | "education"
    | "support"
    | "accounts"
    | "settings";
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
  {key: "quotes", href: "/dashboard/quotes", label: "portal.salesTools", icon: "quotes"},
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
    href: "/educational-hub",
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
    <span
      className="inline-grid size-[30px] flex-none place-items-center rounded-[10px] bg-white/[0.06] text-current transition group-hover:bg-white/[0.08] group-[.active]:bg-[#00a19d]/15"
      aria-hidden="true"
    >
      <svg className="size-[18px] fill-none stroke-current stroke-[1.9] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24">
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

export default function DashboardShell({
  active,
  children
}: {
  active: DashboardSection;
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const direction = locale === "ar" ? "rtl" : "ltr";
  const accountOwnerName = locale === "ar" ? "\u0639\u0628\u062f\u0627\u0644\u0644\u0647 \u0627\u0644\u0634\u0631\u064a\u0643" : "Abdullah Partner";
  const activityLabel = locale === "ar" ? "\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0646\u0634\u0627\u0637" : "Activity level";
  const activityLevel = locale === "ar" ? "\u0645\u062d\u062a\u0631\u0641 \u0630\u0647\u0628\u064a" : "Gold Pro";

  return (
    <section
      className={cn(
        "flex min-h-screen flex-col border-t border-[#dde6ee] md:grid md:grid-cols-[252px_minmax(0,1fr)]",
        "rtl:md:grid-cols-[minmax(0,1fr)_252px]",
        theme.dashboardBg
      )}
      dir={direction}
      data-locale={locale}
    >
      <aside
        className={cn(
          "flex flex-col gap-2 p-3 text-white/75 md:sticky md:top-[77px] md:h-[calc(100vh-77px)] md:p-6",
          "md:col-start-1 rtl:md:col-start-2",
          theme.darkPanel
        )}
      >
        <Link
          className="mb-6 inline-flex min-h-[58px] w-full max-w-[248px] cursor-pointer items-center justify-center gap-4 rounded-[18px] border border-slate-200/80 bg-[#f8fcfd]/95 px-3 py-2 shadow-[0_18px_40px_rgba(0,0,0,0.16),0_0_26px_rgba(34,184,184,0.12)] transition hover:bg-white hover:shadow-[0_20px_46px_rgba(0,0,0,0.18),0_0_30px_rgba(34,184,184,0.15)]"
          href="/"
          aria-label={t("brand.home")}
        >
          <span className="inline-flex items-baseline font-['Cairo','Plus_Jakarta_Sans',Inter,sans-serif] text-[29px] font-black leading-none text-[#0b1f3a]">
            Midda<span className="text-[#22b8b8]">r</span>
          </span>
          <span className="h-[38px] w-0.5 flex-none bg-[#0b1f3a]/85" aria-hidden="true" />
          <span className="inline-flex size-11 flex-none items-center justify-center" aria-hidden="true">
            <svg className="size-full overflow-visible drop-shadow-[0_10px_24px_rgba(34,184,184,0.18)]" viewBox="0 0 64 64" role="img">
              <path className="fill-none stroke-[#22b8b8] stroke-[6.4] [stroke-linecap:round]" d="M15 20a23 23 0 0 1 14-9" />
              <path className="fill-none stroke-[#0b1f3a] stroke-[6.4] [stroke-linecap:round]" d="M36 11a23 23 0 0 1 14 9" />
              <path className="fill-none stroke-[#22b8b8] stroke-[6.4] [stroke-linecap:round]" d="M52 28a23 23 0 0 1-5 18" />
              <path className="fill-none stroke-[#0b1f3a] stroke-[6.4] [stroke-linecap:round]" d="M39 52a23 23 0 0 1-18-2" />
              <path className="fill-none stroke-[#22b8b8] stroke-[6.4] [stroke-linecap:round]" d="M13 43a23 23 0 0 1-1-16" />
              <circle className="fill-[#22b8b8]" cx="14" cy="25" r="4" />
              <circle className="fill-[#0b1f3a]" cx="32" cy="10" r="4" />
              <circle className="fill-[#22b8b8]" cx="50" cy="25" r="4" />
              <circle className="fill-[#0b1f3a]" cx="46" cy="48" r="4" />
              <circle className="fill-[#22b8b8]" cx="22" cy="50" r="4" />
              <circle className="fill-[#0b1f3a]" cx="12" cy="42" r="4" />
              <circle className="fill-[#22b8b8]" cx="32" cy="32" r="5" />
            </svg>
          </span>
        </Link>

        <nav className="grid gap-2" aria-label={t("nav.dashboard")}>
          <div>
            <Link
              className={cn(
                "group flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-bold leading-[1.35] text-[#00a19d] transition",
                "bg-[#e6f6f6] hover:bg-[#e6f6f6] hover:shadow-[0_16px_30px_rgba(0,161,157,0.14)]",
                active === overviewItem.key && "active"
              )}
              href={overviewItem.href}
            >
              <NavItemIcon icon={overviewItem.icon} />
              {t(overviewItem.label)}
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {coreGrowthItems.map((item) => {
              const itemLabel = t(item.label);

              return (
                <div key={item.key}>
                  <Link
                    className={cn(
                      "group flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-semibold leading-[1.35] text-slate-200/85 transition hover:bg-white/[0.05] hover:text-white",
                      active === item.key &&
                        "active bg-[#e6f6f6] text-[#00a19d] shadow-[0_14px_28px_rgba(34,184,184,0.12)] hover:bg-[#e6f6f6] hover:text-[#00a19d]"
                    )}
                    href={item.href}
                  >
                    <NavItemIcon icon={item.icon} />
                    {itemLabel}
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="my-3 h-px bg-white/10" aria-hidden="true" />

          <div className="flex flex-col gap-2 pb-2">
            {supportResourceItems.map((item) => {
              const itemLabel = t(item.label);

              return (
                <div key={item.key}>
                  <Link
                    className={cn(
                      "group flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-semibold leading-[1.35] text-slate-200/85 transition hover:bg-white/[0.05] hover:text-white",
                      active === item.key &&
                        "active bg-[#e6f6f6] text-[#00a19d] shadow-[0_14px_28px_rgba(34,184,184,0.12)] hover:bg-[#e6f6f6] hover:text-[#00a19d]"
                    )}
                    href={item.href}
                  >
                    <NavItemIcon icon={item.icon} />
                    {itemLabel}
                  </Link>
                </div>
              );
            })}
          </div>
        </nav>

        <div className="mt-auto grid rounded-lg border border-white/10 bg-white/[0.05] p-4 text-white/70">
          <div className="flex flex-col gap-2">
            <strong className="text-[15px] font-extrabold leading-[1.45] text-white">{accountOwnerName}</strong>
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-xs font-semibold leading-normal text-slate-200/70">{activityLabel}</span>
              <b className="text-xs font-extrabold leading-normal text-[#f6d77a]">{activityLevel}</b>
            </div>
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-xs font-semibold leading-normal text-slate-200/70">{t("dashboardPages.sidebar.accountStatus")}</span>
              <strong className="inline-flex items-center gap-2 text-[13px] font-extrabold text-white">
                <i className="inline-block size-2 rounded-full bg-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.72)]" aria-hidden="true" />
                {t("dashboardPages.sidebar.active")}
              </strong>
            </div>
          </div>
        </div>
      </aside>

      <section className="min-w-0 flex-1 p-[clamp(32px,4vw,56px)] md:col-start-2 rtl:md:col-start-1">
        <div className="grid content-start gap-[18px]">{children}</div>
      </section>
    </section>
  );
}
