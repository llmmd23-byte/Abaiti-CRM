"use client";

import {useTranslations} from "next-intl";
import {useEffect, useRef, useState} from "react";
import {
  CardTitle,
  DashboardCard,
  ResponsiveTable,
  StatusBadge,
  dashboardField,
  dashboardLabel
} from "@/components/DashboardPrimitives";
import {cn, Eyebrow, theme} from "@/components/ui";

export function DashboardHeader({
  eyebrow,
  title,
  action
}: {
  eyebrow: string;
  title: string;
  action?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="m-0 text-[clamp(30px,4vw,50px)] font-bold leading-[1.12] text-[#0b1f3a]">{title}</h2>
      </div>
      {action ? <button className={theme.primaryButton}>{action}</button> : null}
    </div>
  );
}

export function MetricsGrid() {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <article className={cn("grid gap-2.5 p-6", theme.glass)} key={item}>
          <span className="text-[13px] font-medium text-[#647280]">{t(`metrics.item${item}.label`)}</span>
          <strong className="text-[clamp(26px,3vw,38px)] font-extrabold leading-none text-[#0b1f3a]">
            {t(`metrics.item${item}.value`)}
          </strong>
          <small className="text-[13px] font-medium leading-relaxed text-[#647280]">{t(`metrics.item${item}.note`)}</small>
        </article>
      ))}
    </div>
  );
}

export function PerformanceChart() {
  const t = useTranslations();
  const legendItems = [
    {label: "\u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0627\u0644\u0645\u0633\u062a\u0647\u062f\u0641\u0648\u0646", className: "teal pulse"},
    {label: "\u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u0645\u0631\u0633\u0644\u0629", className: "navy"},
    {label: "\u0627\u0644\u0639\u0645\u0648\u0644\u0627\u062a \u0627\u0644\u0645\u062d\u0635\u0644\u0629", className: "emerald"}
  ];
  const insightItems = [
    {label: "\u2191 14% \u0646\u0645\u0648 \u0645\u0639\u062f\u0644 \u0627\u0644\u062a\u062d\u0648\u064a\u0644 \u0627\u0644\u062a\u0634\u063a\u064a\u0644\u064a", className: "teal"},
    {label: "\u0645\u062a\u0648\u0633\u0637 \u0642\u064a\u0645\u0629 \u0627\u0644\u0635\u0641\u0642\u0627\u062a: $1,250", className: "navy"},
    {label: "\u0627\u0644\u0642\u0637\u0627\u0639 \u0627\u0644\u0623\u0639\u0644\u0649 \u0625\u0646\u062a\u0627\u062c\u064a\u0629: \u0627\u0644\u0634\u0627\u0644\u064a\u0647\u0627\u062a \u0648\u0627\u0644\u0645\u0646\u062a\u062c\u0639\u0627\u062a", className: "emerald"}
  ];

  return (
    <article className={cn("w-full p-6", theme.glass)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h3 className="m-0 text-xl font-bold leading-tight text-[#0b1f3a]">{t("chart.title")}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-2" aria-label="\u0645\u0641\u062a\u0627\u062d \u0645\u0624\u0634\u0631\u0627\u062a \u0627\u0644\u0623\u062f\u0627\u0621">
            {legendItems.map((item) => (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/75 px-3 py-1.5 text-xs font-semibold text-[#647280]" key={item.label}>
                <i
                  className={cn(
                    "size-2.5 rounded-full",
                    item.className.includes("teal") && "bg-[#22b8b8]",
                    item.className.includes("navy") && "bg-[#0b1f3a]",
                    item.className.includes("emerald") && "bg-emerald-500"
                  )}
                />
                {item.label}
              </span>
            ))}
          </div>
          <span className="rounded-full bg-[#e0f8f8] px-3 py-1.5 text-xs font-bold text-[#0b1f3a]">{t("chart.period")}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {insightItems.map((item) => (
          <span
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-bold",
              item.className === "teal" && "bg-[#e0f8f8] text-[#168f97]",
              item.className === "navy" && "bg-slate-100 text-[#0b1f3a]",
              item.className === "emerald" && "bg-emerald-50 text-emerald-700"
            )}
            key={item.label}
          >
            {item.label}
          </span>
        ))}
      </div>
      <div className="mt-6 flex h-[280px] items-end gap-3 rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-5" aria-label={t("chart.label")}>
        {[42, 58, 38, 74, 64, 86, 78].map((height) => (
          <span
            className="block flex-1 rounded-t-[14px] bg-[linear-gradient(180deg,#22b8b8,#0b1f3a)] shadow-[0_14px_28px_rgba(34,184,184,0.16)]"
            key={height}
            style={{height: `${height}%`}}
          />
        ))}
      </div>
    </article>
  );
}

export function QuoteSystem() {
  const t = useTranslations();
  const [flowStep, setFlowStep] = useState<"action" | "channel">("action");
  const [selectedAction, setSelectedAction] = useState("");
  const [submittedMessage, setSubmittedMessage] = useState("");
  const flowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (flowRef.current && !flowRef.current.contains(event.target as Node)) {
        setFlowStep("action");
        setSelectedAction("");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function handleChannelSubmit(channel: string) {
    setSubmittedMessage(channel);
    setFlowStep("action");
    setSelectedAction("");
    window.setTimeout(() => setSubmittedMessage(""), 1800);
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <DashboardCard>
        <CardTitle title={t("dashboardPages.quotes.historyTitle")} subtitle={t("dashboardPages.quotes.historySubtitle")} />
        <ResponsiveTable
          headers={[
            t("dashboardPages.quotes.quoteId"),
            t("commission.customer"),
            t("dashboardPages.quotes.package"),
            t("dashboardPages.quotes.amount"),
            t("commission.status")
          ]}
          rows={[1, 2, 3].map((row) => [
            t(`dashboardPages.quotes.row${row}.id`),
            t(`dashboardPages.quotes.row${row}.customer`),
            t(`dashboardPages.quotes.row${row}.package`),
            t(`dashboardPages.quotes.row${row}.amount`),
            <StatusBadge key="status" tone={t(`dashboardPages.quotes.row${row}.statusClass`)}>
              {t(`dashboardPages.quotes.row${row}.status`)}
            </StatusBadge>
          ])}
        />
      </DashboardCard>

      <DashboardCard>
        <CardTitle title={t("dashboardPages.quotes.formTitle")} subtitle={t("dashboardPages.quotes.formSubtitle")} />
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <label className={dashboardLabel}>
            <span>{t("dashboardPages.quotes.customer")}</span>
            <input className={dashboardField} placeholder={t("dashboardPages.quotes.customerPlaceholder")} />
          </label>
          <label className={dashboardLabel}>
            <span>{t("dashboardPages.quotes.package")}</span>
            <select className={dashboardField}>
              <option>{t("dashboardPages.quotes.packageOption1")}</option>
              <option>{t("dashboardPages.quotes.packageOption2")}</option>
            </select>
          </label>
          <label className={dashboardLabel}>
            <span>{t("dashboardPages.quotes.amount")}</span>
            <input className={dashboardField} placeholder="$8,400" />
          </label>
          <label className={dashboardLabel}>
            <span>{t("dashboardPages.quotes.validUntil")}</span>
            <input className={dashboardField} placeholder="30 days" />
          </label>
          </div>
          <div className="relative grid" ref={flowRef}>
            <div className="mt-3 grid gap-3 rounded-[14px] border border-slate-200 bg-white p-3 shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
                {flowStep === "action" ? (
                  <>
                    <span className="grid gap-1 text-[13px] font-black text-[#0b1f3a]">{"\u0646\u0648\u0639 \u0627\u0644\u0639\u0631\u0636"}</span>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-center text-sm font-medium text-slate-700 transition hover:-translate-y-px hover:bg-slate-50"
                        onClick={() => {
                          setSelectedAction("\u0625\u0646\u0634\u0627\u0621 \u0639\u0631\u0636 \u0633\u0639\u0631");
                          setFlowStep("channel");
                        }}
                        type="button"
                      >
                        {"\u0625\u0646\u0634\u0627\u0621 \u0639\u0631\u0636 \u0633\u0639\u0631"}
                      </button>
                      <button
                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-center text-sm font-medium text-slate-700 transition hover:-translate-y-px hover:bg-slate-50"
                        onClick={() => {
                          setSelectedAction("\u0625\u0646\u0634\u0627\u0621 \u0631\u0627\u0628\u0637 \u062f\u0641\u0639");
                          setFlowStep("channel");
                        }}
                        type="button"
                      >
                        {"\u0625\u0646\u0634\u0627\u0621 \u0631\u0627\u0628\u0637 \u062f\u0641\u0639"}
                      </button>
                    </div>
                  </>
                ) : (
                <>
                  <span className="grid gap-1 text-[13px] font-black text-[#0b1f3a]">
                    {"\u0642\u0646\u0627\u0629 \u0627\u0644\u0625\u0631\u0633\u0627\u0644"}
                    {selectedAction ? <small className="text-xs font-medium text-[#647280]">{selectedAction}</small> : null}
                  </span>
                  <button
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-center text-sm font-medium text-slate-700 transition hover:-translate-y-px hover:bg-slate-50"
                    onClick={() => handleChannelSubmit("\u062a\u0645 \u062a\u062c\u0647\u064a\u0632 \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0639\u0628\u0631 \u0627\u0644\u0648\u0627\u062a\u0633\u0627\u0628")}
                    type="button"
                  >
                    <span className="grid size-[22px] place-items-center rounded-full bg-slate-900 text-[11px] font-black text-white" aria-hidden="true">W</span>
                    {"\u0625\u0631\u0633\u0627\u0644 \u0639\u0628\u0631 \u0627\u0644\u0648\u0627\u062a\u0633\u0627\u0628"}
                  </button>
                  <button
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-center text-sm font-medium text-slate-700 transition hover:-translate-y-px hover:bg-slate-50"
                    onClick={() => handleChannelSubmit("\u062a\u0645 \u062a\u062c\u0647\u064a\u0632 \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0639\u0628\u0631 \u0627\u0644\u0625\u064a\u0645\u064a\u0644")}
                    type="button"
                  >
                    <span className="grid size-[22px] place-items-center rounded-full bg-slate-900 text-white" aria-hidden="true">
                      <svg className="size-[15px] fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 20 20">
                        <path d="M3 5h14v10H3z" />
                        <path d="m3 6 7 5 7-5" />
                      </svg>
                    </span>
                    {"\u0625\u0631\u0633\u0627\u0644 \u0639\u0628\u0631 \u0627\u0644\u0625\u064a\u0645\u064a\u0644"}
                  </button>
                  </>
                )}
              </div>

            {submittedMessage ? <p className="m-0 mt-2 rounded-xl border border-emerald-500/25 bg-emerald-50/70 px-3 py-2.5 text-[13px] font-bold leading-relaxed text-emerald-700">{submittedMessage}</p> : null}
          </div>
      </DashboardCard>
    </div>
  );
}

export function CommissionTable({expanded = false}: {expanded?: boolean}) {
  const t = useTranslations();

  return (
    <DashboardCard className={expanded ? "w-full" : ""}>
      <CardTitle title={t("commission.title")} subtitle={t("commission.subtitle")} />
      <ResponsiveTable
        headers={[
          t("commission.customer"),
          t("commission.sale"),
          t("commission.percent"),
          t("commission.amount"),
          t("commission.status")
        ]}
        rows={[1, 2, 3].map((row) => [
          t(`commission.row${row}.customer`),
          t(`commission.row${row}.sale`),
          t(`commission.row${row}.percent`),
          t(`commission.row${row}.commission`),
          <StatusBadge key="status" tone={t(`commission.row${row}.statusClass`)}>
            {t(`commission.row${row}.status`)}
          </StatusBadge>
        ])}
      />
    </DashboardCard>
  );
}

export function HelpDeskPanel({expanded = false}: {expanded?: boolean}) {
  const t = useTranslations();
  const categoryOther = t("support.categoryOther");
  const [ticketCategory, setTicketCategory] = useState(t("support.category1"));

  return (
    <div className={cn("grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]", expanded && "w-full")}>
      <DashboardCard>
        <CardTitle title={t("dashboardPages.support.ticketList")} subtitle={t("support.openTickets")} />
        <div className="grid gap-3">
          {[1, 2, 3].map((ticket) => (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3" key={ticket}>
              <div className="grid gap-1">
                <strong className="text-sm font-black leading-snug text-[#0b1f3a]">{t(`dashboardPages.support.ticket${ticket}.title`)}</strong>
                <span className="text-xs font-semibold text-[#647280]">{t(`dashboardPages.support.ticket${ticket}.meta`)}</span>
              </div>
              <StatusBadge tone={t(`dashboardPages.support.ticket${ticket}.statusClass`)}>
                {t(`dashboardPages.support.ticket${ticket}.status`)}
              </StatusBadge>
            </div>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard>
        <CardTitle title={t("support.title")} subtitle={t("support.subtitle")} />
        <label className={dashboardLabel}>
          <span>{t("support.category")}</span>
          <select className={dashboardField} value={ticketCategory} onChange={(event) => setTicketCategory(event.target.value)}>
            <option value={t("support.category1")}>{t("support.category1")}</option>
            <option value={t("support.category2")}>{t("support.category2")}</option>
            <option value={t("support.category3")}>{t("support.category3")}</option>
            <option value={t("support.category4")}>{t("support.category4")}</option>
            <option value={categoryOther}>{categoryOther}</option>
          </select>
        </label>
        {ticketCategory === categoryOther ? (
          <label className={dashboardLabel}>
            <span>{t("support.customCategoryLabel")}</span>
            <input className={dashboardField} type="text" placeholder={t("support.customCategoryPlaceholder")} />
          </label>
        ) : null}
        <textarea className={cn(dashboardField, "min-h-[120px] resize-y")} placeholder={t("support.detailsPlaceholder")} />
        <button className={theme.darkButton}>{t("support.button")}</button>
      </DashboardCard>
    </div>
  );
}

export function SettingsPanel() {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <DashboardCard className="gap-2.5" key={item}>
          <span className="text-[13px] font-medium text-[#647280]">{t(`dashboardPages.settings.item${item}.label`)}</span>
          <strong className="text-[clamp(24px,3vw,34px)] font-black leading-none text-[#0b1f3a]">
            {t(`dashboardPages.settings.item${item}.value`)}
          </strong>
          <small className="text-[13px] font-medium leading-relaxed text-[#647280]">{t(`dashboardPages.settings.item${item}.note`)}</small>
        </DashboardCard>
      ))}
    </div>
  );
}
