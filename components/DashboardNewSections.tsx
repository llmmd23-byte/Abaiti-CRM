"use client";

import {useLocale, useTranslations} from "next-intl";
import {useState} from "react";
import DashboardSelect from "@/components/DashboardSelect";

export function CustomersView() {
  const t = useTranslations();

  return (
    <article className="table-card expanded-table-card">
      <div className="card-title">
        <h3>{t("dashboardPages.customers.tableTitle")}</h3>
        <span>{t("dashboardPages.customers.tableSubtitle")}</span>
      </div>
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>{t("dashboardPages.customers.name")}</th>
              <th>{t("dashboardPages.customers.company")}</th>
              <th>{t("dashboardPages.customers.source")}</th>
              <th>{t("dashboardPages.customers.stage")}</th>
              <th>{t("dashboardPages.customers.value")}</th>
              <th>{t("dashboardPages.customers.owner")}</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((row) => (
              <tr key={row}>
                <td>{t(`dashboardPages.customers.row${row}.name`)}</td>
                <td>{t(`dashboardPages.customers.row${row}.company`)}</td>
                <td>{t(`dashboardPages.customers.row${row}.source`)}</td>
                <td>
                  <span className={`badge ${t(`dashboardPages.customers.row${row}.stageClass`)}`}>
                    {t(`dashboardPages.customers.row${row}.stage`)}
                  </span>
                </td>
                <td>{t(`dashboardPages.customers.row${row}.value`)}</td>
                <td>{t(`dashboardPages.customers.row${row}.owner`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export function LeadsHubView() {
  const [activeTab, setActiveTab] = useState<"directory" | "demo">("directory");

  return (
    <section className="leads-hub-view" dir="rtl">
      <div className="leads-hub-tabs" role="tablist" aria-label={"\u062a\u0628\u0648\u064a\u0628\u0627\u062a \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0627\u0644\u0645\u062d\u062a\u0645\u0644\u064a\u0646"}>
        <button
          className={activeTab === "directory" ? "active" : ""}
          onClick={() => setActiveTab("directory")}
          role="tab"
          type="button"
        >
          <strong>{"\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0639\u0645\u0644\u0627\u0621"}</strong>
          <span>{"\u062c\u062f\u0648\u0644 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0648\u0646\u0645\u0627\u0630\u062c \u0627\u0644\u0627\u0644\u062a\u0642\u0627\u0637"}</span>
        </button>
        <button
          className={activeTab === "demo" ? "active" : ""}
          onClick={() => setActiveTab("demo")}
          role="tab"
          type="button"
        >
          <strong>{"\u0646\u0633\u062e\u0629 \u062a\u062c\u0631\u064a\u0628\u064a\u0629 \u0644\u0644\u0639\u0645\u064a\u0644"}</strong>
          <span>{"\u062a\u0647\u064a\u0626\u0629 \u0628\u064a\u0626\u0629 \u0633\u0627\u0646\u062f\u0628\u0648\u0643\u0633 \u0648\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062a\u062c\u0627\u0631\u0628"}</span>
        </button>
      </div>

      <div className="leads-hub-panel">
        {activeTab === "directory" ? <CustomersView /> : <DemoView />}
      </div>
    </section>
  );
}

const educationalImages = [
  {
    title: "\u0625\u0646\u0641\u0648\u063a\u0631\u0627\u0641\u064a\u0643 \u062f\u0648\u0631\u0629 \u0627\u0644\u0639\u0645\u064a\u0644",
    meta: "\u0634\u0631\u0627\u0626\u062d \u062a\u062b\u0642\u064a\u0641\u064a\u0629"
  },
  {
    title: "\u062f\u0644\u064a\u0644 \u062a\u0623\u0647\u064a\u0644 \u0627\u0644\u0639\u0645\u064a\u0644",
    meta: "\u062a\u0635\u0645\u064a\u0645 \u0644\u0644\u0645\u0634\u0627\u0631\u0643\u0629"
  },
  {
    title: "\u0645\u0642\u0627\u0631\u0646\u0629 \u0645\u0632\u0627\u064a\u0627 \u0627\u0644\u0642\u0637\u0627\u0639\u0627\u062a",
    meta: "\u0631\u0633\u0648\u0645 \u062a\u0648\u0636\u064a\u062d\u064a\u0629"
  },
  {
    title: "\u062e\u0631\u064a\u0637\u0629 \u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0646\u0638\u0627\u0645",
    meta: "\u0633\u0644\u0627\u064a\u062f\u0627\u062a \u062a\u0639\u0644\u064a\u0645\u064a\u0629"
  }
];

const educationalVideos = [
  {
    title: "\u0627\u0644\u0628\u062f\u0621 \u0627\u0644\u0633\u0631\u064a\u0639 \u0645\u0639 \u0645\u064a\u062f\u0627\u0631",
    duration: "04:20"
  },
  {
    title: "\u0634\u0631\u062d \u0631\u0628\u0637 \u0627\u0644\u0639\u0645\u064a\u0644 \u0628\u0627\u0644\u0642\u0637\u0627\u0639",
    duration: "06:15"
  },
  {
    title: "\u062a\u0647\u064a\u0626\u0629 \u0627\u0644\u0646\u0633\u062e\u0629 \u0627\u0644\u062a\u062c\u0631\u064a\u0628\u064a\u0629",
    duration: "05:05"
  },
  {
    title: "\u0623\u0641\u0636\u0644 \u0645\u0645\u0627\u0631\u0633\u0627\u062a \u0627\u0644\u0639\u0631\u0636 \u0648\u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629",
    duration: "07:40"
  }
];

export function EducationalHubView() {
  const [activeTab, setActiveTab] = useState<"images" | "videos">("images");

  return (
    <section className="education-hub-view" dir="rtl">
      <div className="education-tabs" role="tablist" aria-label={"\u062a\u0628\u0648\u064a\u0628\u0627\u062a \u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u062a\u0639\u0644\u064a\u0645\u064a"}>
        <button
          className={activeTab === "images" ? "active" : ""}
          onClick={() => setActiveTab("images")}
          role="tab"
          type="button"
        >
          <strong>{"\u0645\u0643\u062a\u0628\u0629 \u0627\u0644\u0635\u0648\u0631 \u0627\u0644\u062a\u0639\u0644\u064a\u0645\u064a\u0629"}</strong>
          <span>{"\u0625\u0646\u0641\u0648\u063a\u0631\u0627\u0641\u064a\u0643\u060c \u0634\u0631\u0627\u0626\u062d\u060c \u0648\u0631\u0633\u0648\u0645 \u062a\u0648\u0636\u064a\u062d\u064a\u0629"}</span>
        </button>
        <button
          className={activeTab === "videos" ? "active" : ""}
          onClick={() => setActiveTab("videos")}
          role="tab"
          type="button"
        >
          <strong>{"\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u062a\u0639\u0644\u064a\u0645\u064a\u0629"}</strong>
          <span>{"\u062f\u0631\u0648\u0633 \u0633\u0631\u064a\u0639\u0629\u060c \u0634\u0631\u0648\u062d\u0627\u062a\u060c \u0648\u062a\u0639\u0645\u0642 \u0641\u064a \u0627\u0644\u0645\u064a\u0632\u0627\u062a"}</span>
        </button>
      </div>

      <div className="education-panel">
        {activeTab === "images" ? (
          <div className="education-card-grid">
            {educationalImages.map((item, index) => (
              <article className="education-asset-card image-card" key={item.title}>
                <span>{`0${index + 1}`}</span>
                <div className="education-asset-preview" />
                <h3>{item.title}</h3>
                <p>{item.meta}</p>
                <button type="button">{"\u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0644\u0641"}</button>
              </article>
            ))}
          </div>
        ) : (
          <div className="education-card-grid">
            {educationalVideos.map((item) => (
              <article className="education-asset-card video-card" key={item.title}>
                <div className="education-video-thumb">
                  <span>{"\u25b6"}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.duration}</p>
                <button type="button">{"\u0645\u0634\u0627\u0647\u062f\u0629 \u0627\u0644\u062f\u0631\u0633"}</button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function AccountsView() {
  const t = useTranslations();

  return (
    <article className="table-card expanded-table-card financial-ledger-card">
      <div className="card-title">
        <h3>{t("dashboardPages.accounts.tableTitle")}</h3>
        <span>{t("dashboardPages.accounts.tableSubtitle")}</span>
      </div>
      <div className="account-summary-strip">
        {[1, 2, 3].map((item) => (
          <div key={item}>
            <span>{t(`dashboardPages.accounts.summary${item}.label`)}</span>
            <strong>{t(`dashboardPages.accounts.summary${item}.value`)}</strong>
          </div>
        ))}
      </div>
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>{t("dashboardPages.accounts.date")}</th>
              <th>{t("dashboardPages.accounts.reference")}</th>
              <th>{t("dashboardPages.accounts.description")}</th>
              <th>{t("dashboardPages.accounts.amount")}</th>
              <th>{t("dashboardPages.accounts.status")}</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((row) => (
              <tr key={row}>
                <td>{t(`dashboardPages.accounts.row${row}.date`)}</td>
                <td>{t(`dashboardPages.accounts.row${row}.reference`)}</td>
                <td>{t(`dashboardPages.accounts.row${row}.description`)}</td>
                <td>{t(`dashboardPages.accounts.row${row}.amount`)}</td>
                <td>
                  <span className={`badge ${t(`dashboardPages.accounts.row${row}.statusClass`)}`}>
                    {t(`dashboardPages.accounts.row${row}.status`)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export function ProductsView() {
  const t = useTranslations();

  return (
    <div className="products-grid">
      {[1, 2, 3, 4].map((item) => (
        <article className="product-system-card" key={item}>
          <span>{t(`dashboardPages.products.item${item}.eyebrow`)}</span>
          <h3>{t(`dashboardPages.products.item${item}.title`)}</h3>
          <p>{t(`dashboardPages.products.item${item}.copy`)}</p>
          <small>{t(`dashboardPages.products.item${item}.status`)}</small>
        </article>
      ))}
    </div>
  );
}

export function DemoView() {
  const t = useTranslations();
  const isArabic = useLocale() === "ar";
  const productOptions = isArabic
    ? ["نظام التجزئة", "نظام المطاعم والمقاهي", "نظام الخدمات"]
    : ["Retail system", "Restaurants and cafes system", "Services system"];

  return (
    <section className="demo-form-view">
      <div className="demo-form-head">
        <p className="eyebrow">{t("dashboardPages.demo.eyebrow")}</p>
        <h2>{t("dashboardPages.demo.title")}</h2>
        <p>{t("dashboardPages.demo.cardSubtitle")}</p>
      </div>

      <article className="quote-card demo-launch-card">
        <div className="card-title">
          <h3>{t("dashboardPages.demo.cardTitle")}</h3>
          <span>{t("dashboardPages.demo.cardSubtitle")}</span>
        </div>
        <div className="form-grid demo-input-grid">
          <label>
            <span>{t("dashboardPages.demo.customer")}</span>
            <input placeholder={t("dashboardPages.demo.customerPlaceholder")} />
          </label>
          <label>
            <span>{t("dashboardPages.demo.product")}</span>
            <DashboardSelect
              ariaLabel={t("dashboardPages.demo.product")}
              defaultValue={productOptions[0]}
              options={productOptions.map((option) => ({label: option, value: option}))}
            />
          </label>
          <label>
            <span>{t("dashboardPages.demo.duration")}</span>
            <DashboardSelect
              ariaLabel={t("dashboardPages.demo.duration")}
              defaultValue={t("dashboardPages.demo.durationOption1")}
              options={[1, 2].map((item) => ({
                label: t(`dashboardPages.demo.durationOption${item}`),
                value: t(`dashboardPages.demo.durationOption${item}`)
              }))}
            />
          </label>
          <label>
            <span>{t("dashboardPages.demo.owner")}</span>
            <input placeholder={t("dashboardPages.demo.ownerPlaceholder")} />
          </label>
        </div>
        <div className="demo-action-row">
          <button className="button button-dark compact-action" type="button">
            {t("dashboardPages.demo.button")}
          </button>
        </div>
      </article>
    </section>
  );
}
