"use client";

import {useTranslations} from "next-intl";
import {useState} from "react";
import {
  CardTitle,
  DashboardCard,
  ResponsiveTable,
  StatusBadge,
  TabButton,
  dashboardField,
  dashboardLabel
} from "@/components/DashboardPrimitives";
import {cn, Eyebrow, theme} from "@/components/ui";

export function CustomersView() {
  const t = useTranslations();

  return (
    <DashboardCard>
      <CardTitle title={t("dashboardPages.customers.tableTitle")} subtitle={t("dashboardPages.customers.tableSubtitle")} />
      <ResponsiveTable
        headers={[
          t("dashboardPages.customers.name"),
          t("dashboardPages.customers.company"),
          t("dashboardPages.customers.source"),
          t("dashboardPages.customers.stage"),
          t("dashboardPages.customers.value"),
          t("dashboardPages.customers.owner")
        ]}
        rows={[1, 2, 3, 4].map((row) => [
          t(`dashboardPages.customers.row${row}.name`),
          t(`dashboardPages.customers.row${row}.company`),
          t(`dashboardPages.customers.row${row}.source`),
          <StatusBadge key="stage" tone={t(`dashboardPages.customers.row${row}.stageClass`)}>
            {t(`dashboardPages.customers.row${row}.stage`)}
          </StatusBadge>,
          t(`dashboardPages.customers.row${row}.value`),
          t(`dashboardPages.customers.row${row}.owner`)
        ])}
      />
    </DashboardCard>
  );
}

export function LeadsHubView() {
  const [activeTab, setActiveTab] = useState<"directory" | "demo">("directory");

  return (
    <section className="grid gap-[18px]" dir="rtl">
      <div
        className="grid grid-cols-1 gap-3 rounded-[20px] border border-slate-200/90 bg-white/80 p-2.5 shadow-[0_18px_42px_rgba(15,23,42,0.05)] md:grid-cols-2"
        role="tablist"
        aria-label={"\u062a\u0628\u0648\u064a\u0628\u0627\u062a \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0627\u0644\u0645\u062d\u062a\u0645\u0644\u064a\u0646"}
      >
        <TabButton
          active={activeTab === "directory"}
          onClick={() => setActiveTab("directory")}
          title={"\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0639\u0645\u0644\u0627\u0621"}
          subtitle={"\u062c\u062f\u0648\u0644 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0648\u0646\u0645\u0627\u0630\u062c \u0627\u0644\u0627\u0644\u062a\u0642\u0627\u0637"}
        />
        <TabButton
          active={activeTab === "demo"}
          onClick={() => setActiveTab("demo")}
          title={"\u0646\u0633\u062e\u0629 \u062a\u062c\u0631\u064a\u0628\u064a\u0629 \u0644\u0644\u0639\u0645\u064a\u0644"}
          subtitle={"\u062a\u0647\u064a\u0626\u0629 \u0628\u064a\u0626\u0629 \u0633\u0627\u0646\u062f\u0628\u0648\u0643\u0633 \u0648\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062a\u062c\u0627\u0631\u0628"}
        />
      </div>

      <div>{activeTab === "directory" ? <CustomersView /> : <DemoView />}</div>
    </section>
  );
}

const educationalImages = [
  {title: "\u0625\u0646\u0641\u0648\u063a\u0631\u0627\u0641\u064a\u0643 \u062f\u0648\u0631\u0629 \u0627\u0644\u0639\u0645\u064a\u0644", meta: "\u0634\u0631\u0627\u0626\u062d \u062a\u062b\u0642\u064a\u0641\u064a\u0629"},
  {title: "\u062f\u0644\u064a\u0644 \u062a\u0623\u0647\u064a\u0644 \u0627\u0644\u0639\u0645\u064a\u0644", meta: "\u062a\u0635\u0645\u064a\u0645 \u0644\u0644\u0645\u0634\u0627\u0631\u0643\u0629"},
  {title: "\u0645\u0642\u0627\u0631\u0646\u0629 \u0645\u0632\u0627\u064a\u0627 \u0627\u0644\u0642\u0637\u0627\u0639\u0627\u062a", meta: "\u0631\u0633\u0648\u0645 \u062a\u0648\u0636\u064a\u062d\u064a\u0629"},
  {title: "\u062e\u0631\u064a\u0637\u0629 \u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0646\u0638\u0627\u0645", meta: "\u0633\u0644\u0627\u064a\u062f\u0627\u062a \u062a\u0639\u0644\u064a\u0645\u064a\u0629"}
];

const educationalVideos = [
  {title: "\u0627\u0644\u0628\u062f\u0621 \u0627\u0644\u0633\u0631\u064a\u0639 \u0645\u0639 \u0645\u064a\u062f\u0627\u0631", duration: "04:20"},
  {title: "\u0634\u0631\u062d \u0631\u0628\u0637 \u0627\u0644\u0639\u0645\u064a\u0644 \u0628\u0627\u0644\u0642\u0637\u0627\u0639", duration: "06:15"},
  {title: "\u062a\u0647\u064a\u0626\u0629 \u0627\u0644\u0646\u0633\u062e\u0629 \u0627\u0644\u062a\u062c\u0631\u064a\u0628\u064a\u0629", duration: "05:05"},
  {title: "\u0623\u0641\u0636\u0644 \u0645\u0645\u0627\u0631\u0633\u0627\u062a \u0627\u0644\u0639\u0631\u0636 \u0648\u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629", duration: "07:40"}
];

export function EducationalHubView() {
  const [activeTab, setActiveTab] = useState<"images" | "videos">("images");

  return (
    <section className="grid gap-[18px]" dir="rtl">
      <div
        className="grid grid-cols-1 gap-3 rounded-[20px] border border-slate-200/90 bg-white/80 p-2.5 shadow-[0_18px_42px_rgba(15,23,42,0.05)] md:grid-cols-2"
        role="tablist"
        aria-label={"\u062a\u0628\u0648\u064a\u0628\u0627\u062a \u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u062a\u0639\u0644\u064a\u0645\u064a"}
      >
        <TabButton
          active={activeTab === "images"}
          onClick={() => setActiveTab("images")}
          title={"\u0645\u0643\u062a\u0628\u0629 \u0627\u0644\u0635\u0648\u0631 \u0627\u0644\u062a\u0639\u0644\u064a\u0645\u064a\u0629"}
          subtitle={"\u0625\u0646\u0641\u0648\u063a\u0631\u0627\u0641\u064a\u0643\u060c \u0634\u0631\u0627\u0626\u062d\u060c \u0648\u0631\u0633\u0648\u0645 \u062a\u0648\u0636\u064a\u062d\u064a\u0629"}
        />
        <TabButton
          active={activeTab === "videos"}
          onClick={() => setActiveTab("videos")}
          title={"\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u062a\u0639\u0644\u064a\u0645\u064a\u0629"}
          subtitle={"\u062f\u0631\u0648\u0633 \u0633\u0631\u064a\u0639\u0629\u060c \u0634\u0631\u0648\u062d\u0627\u062a\u060c \u0648\u062a\u0639\u0645\u0642 \u0641\u064a \u0627\u0644\u0645\u064a\u0632\u0627\u062a"}
        />
      </div>

      {activeTab === "images" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {educationalImages.map((item, index) => (
            <DashboardCard className="min-h-[270px] rounded-[18px]" key={item.title}>
              <span className="text-sm font-black text-[#22b8b8]">{`0${index + 1}`}</span>
              <div className="min-h-[96px] rounded-2xl bg-[linear-gradient(135deg,#e0f8f8,#ffffff)]" />
              <h3 className="m-0 text-base font-black leading-snug text-[#0b1f3a]">{item.title}</h3>
              <p className="m-0 text-sm font-semibold text-[#647280]">{item.meta}</p>
              <button className={theme.darkButton} type="button">{"\u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0644\u0641"}</button>
            </DashboardCard>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {educationalVideos.map((item) => (
            <DashboardCard className="min-h-[270px] rounded-[18px]" key={item.title}>
              <div className="grid min-h-[120px] place-items-center rounded-2xl bg-[linear-gradient(135deg,#071626,#0b1f3a)]">
                <span className="grid size-12 place-items-center rounded-full bg-[#22b8b8] text-white">{"\u25b6"}</span>
              </div>
              <h3 className="m-0 text-base font-black leading-snug text-[#0b1f3a]">{item.title}</h3>
              <p className="m-0 text-sm font-semibold text-[#647280]">{item.duration}</p>
              <button className={theme.darkButton} type="button">{"\u0645\u0634\u0627\u0647\u062f\u0629 \u0627\u0644\u062f\u0631\u0633"}</button>
            </DashboardCard>
          ))}
        </div>
      )}
    </section>
  );
}

export function AccountsView() {
  const t = useTranslations();

  return (
    <DashboardCard>
      <CardTitle title={t("dashboardPages.accounts.tableTitle")} subtitle={t("dashboardPages.accounts.tableSubtitle")} />
      <div className="grid grid-cols-1 gap-3 rounded-2xl bg-[#f8fafc] p-3 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div className="grid gap-1 rounded-xl bg-white p-4" key={item}>
            <span className="text-xs font-semibold text-[#647280]">{t(`dashboardPages.accounts.summary${item}.label`)}</span>
            <strong className="text-lg font-black text-[#0b1f3a]">{t(`dashboardPages.accounts.summary${item}.value`)}</strong>
          </div>
        ))}
      </div>
      <ResponsiveTable
        headers={[
          t("dashboardPages.accounts.date"),
          t("dashboardPages.accounts.reference"),
          t("dashboardPages.accounts.description"),
          t("dashboardPages.accounts.amount"),
          t("dashboardPages.accounts.status")
        ]}
        rows={[1, 2, 3, 4].map((row) => [
          t(`dashboardPages.accounts.row${row}.date`),
          t(`dashboardPages.accounts.row${row}.reference`),
          t(`dashboardPages.accounts.row${row}.description`),
          t(`dashboardPages.accounts.row${row}.amount`),
          <StatusBadge key="status" tone={t(`dashboardPages.accounts.row${row}.statusClass`)}>
            {t(`dashboardPages.accounts.row${row}.status`)}
          </StatusBadge>
        ])}
      />
    </DashboardCard>
  );
}

export function ProductsView() {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <DashboardCard className="rounded-[18px]" key={item}>
          <span className="text-xs font-black uppercase tracking-[0.08em] text-[#22b8b8]">{t(`dashboardPages.products.item${item}.eyebrow`)}</span>
          <h3 className="m-0 text-lg font-black leading-snug text-[#0b1f3a]">{t(`dashboardPages.products.item${item}.title`)}</h3>
          <p className="m-0 text-sm leading-7 text-[#647280]">{t(`dashboardPages.products.item${item}.copy`)}</p>
          <small className="mt-auto rounded-full bg-[#e0f8f8] px-3 py-2 text-xs font-black text-[#168f97]">{t(`dashboardPages.products.item${item}.status`)}</small>
        </DashboardCard>
      ))}
    </div>
  );
}

export function DemoView() {
  const t = useTranslations();

  return (
    <section className="grid gap-[18px]">
      <div className="grid gap-2">
        <Eyebrow>{t("dashboardPages.demo.eyebrow")}</Eyebrow>
        <h2 className="m-0 text-[clamp(28px,3vw,42px)] font-black leading-tight text-[#0b1f3a]">{t("dashboardPages.demo.title")}</h2>
        <p className="m-0 max-w-2xl text-sm leading-7 text-[#647280]">{t("dashboardPages.demo.cardSubtitle")}</p>
      </div>

      <DashboardCard>
        <CardTitle title={t("dashboardPages.demo.cardTitle")} subtitle={t("dashboardPages.demo.cardSubtitle")} />
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          <label className={dashboardLabel}>
            <span>{t("dashboardPages.demo.customer")}</span>
            <input className={dashboardField} placeholder={t("dashboardPages.demo.customerPlaceholder")} />
          </label>
          <label className={dashboardLabel}>
            <span>{t("dashboardPages.demo.product")}</span>
            <select className={dashboardField}>
              <option>{t("dashboardPages.products.item1.title")}</option>
              <option>{t("dashboardPages.products.item2.title")}</option>
            </select>
          </label>
          <label className={dashboardLabel}>
            <span>{t("dashboardPages.demo.duration")}</span>
            <select className={dashboardField}>
              <option>{t("dashboardPages.demo.durationOption1")}</option>
              <option>{t("dashboardPages.demo.durationOption2")}</option>
            </select>
          </label>
          <label className={dashboardLabel}>
            <span>{t("dashboardPages.demo.owner")}</span>
            <input className={dashboardField} placeholder={t("dashboardPages.demo.ownerPlaceholder")} />
          </label>
        </div>
        <div className="flex justify-start">
          <button className={theme.darkButton} type="button">
            {t("dashboardPages.demo.button")}
          </button>
        </div>
      </DashboardCard>
    </section>
  );
}
