"use client";

import {useTranslations} from "next-intl";
import {useEffect, useRef, useState} from "react";
import DashboardSelect from "@/components/DashboardSelect";

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
    <div className="dashboard-topbar page-topbar">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action ? <button className="button button-primary">{action}</button> : null}
    </div>
  );
}

export function MetricsGrid() {
  const t = useTranslations();

  return (
    <div className="metric-grid">
      {[1, 2, 3, 4].map((item) => (
        <article className="metric-card" key={item}>
          <span>{t(`metrics.item${item}.label`)}</span>
          <strong>{t(`metrics.item${item}.value`)}</strong>
          <small>{t(`metrics.item${item}.note`)}</small>
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
    <article className="chart-card full-card">
      <div className="card-title">
        <h3>{t("chart.title")}</h3>
        <div className="chart-title-tools">
          <div className="chart-legend" aria-label="\u0645\u0641\u062a\u0627\u062d \u0645\u0624\u0634\u0631\u0627\u062a \u0627\u0644\u0623\u062f\u0627\u0621">
            {legendItems.map((item) => (
              <span className="chart-legend-pill" key={item.label}>
                <i className={item.className} />
                {item.label}
              </span>
            ))}
          </div>
          <span className="chart-period-pill">{t("chart.period")}</span>
        </div>
      </div>
      <div className="chart-insights-row">
        {insightItems.map((item) => (
          <span className={`chart-insight ${item.className}`} key={item.label}>
            {item.label}
          </span>
        ))}
      </div>
      <div className="bar-chart" aria-label={t("chart.label")}>
        {[42, 58, 38, 74, 64, 86, 78].map((height) => (
          <span key={height} style={{"--h": `${height}%`} as React.CSSProperties} />
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
    <div className="quotes-page-grid">
      <article className="quote-card quote-form-card">
        <div className="card-title">
          <h3>{t("dashboardPages.quotes.formTitle")}</h3>
          <span>{t("dashboardPages.quotes.formSubtitle")}</span>
        </div>
        <div className="form-grid">
          <label>
            <span>{t("dashboardPages.quotes.customer")}</span>
            <input placeholder={t("dashboardPages.quotes.customerPlaceholder")} />
          </label>
          <label>
            <span>{t("dashboardPages.quotes.package")}</span>
            <DashboardSelect
              ariaLabel={t("dashboardPages.quotes.package")}
              defaultValue={t("dashboardPages.quotes.packageOption1")}
              options={[1, 2].map((item) => ({
                label: t(`dashboardPages.quotes.packageOption${item}`),
                value: t(`dashboardPages.quotes.packageOption${item}`)
              }))}
            />
          </label>
          <label>
            <span>{t("dashboardPages.quotes.amount")}</span>
            <input placeholder="$8,400" />
          </label>
          <label>
            <span>{t("dashboardPages.quotes.validUntil")}</span>
            <input placeholder="30 days" />
          </label>
          </div>
          <div className="quote-flow" ref={flowRef}>
            <div className="quote-flow-menu bg-white border border-slate-100 shadow-sm rounded-2xl p-6 w-full text-right">
              <div className="quote-action-row">
                {["\u0625\u0646\u0634\u0627\u0621 \u0639\u0631\u0636 \u0633\u0639\u0631", "\u0625\u0646\u0634\u0627\u0621 \u0631\u0627\u0628\u0637 \u062f\u0641\u0639"].map((action) => {
                  const isSelected = selectedAction === action;

                  return (
                    <button
                      aria-pressed={isSelected}
                      className={`quote-flow-option quote-action-option rounded-xl px-6 py-4 transition-all duration-200 ${
                        isSelected
                          ? "selected bg-[#11293D] text-white border border-[#11293D] font-bold shadow-md rounded-full"
                          : "bg-[#11293D] text-white border border-[#11293D] hover:bg-[#12283F] rounded-full"
                      }`}
                      key={action}
                      onClick={() => {
                        setSelectedAction(action);
                        setFlowStep("channel");
                      }}
                      style={isSelected ? {
                        backgroundColor: "#11293d",
                        borderColor: "#11293d",
                        boxShadow: "0 4px 10px -2px rgba(17, 41, 61, 0.28)",
                        color: "#ffffff",
                        fontWeight: 700
                      } : undefined}
                      type="button"
                    >
                      {action}
                    </button>
                  );
                })}
              </div>

              {flowStep === "channel" ? (
                <div className="quote-channel-panel">
                  <span className="quote-flow-title text-[#0f2942] text-sm font-bold mb-3 block">
                    {"\u0642\u0646\u0627\u0629 \u0627\u0644\u0625\u0631\u0633\u0627\u0644"}
                    {selectedAction ? <small>{selectedAction}</small> : null}
                  </span>
                  <button
                    className="quote-flow-option"
                    onClick={() => handleChannelSubmit("\u062a\u0645 \u062a\u062c\u0647\u064a\u0632 \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0639\u0628\u0631 \u0627\u0644\u0648\u0627\u062a\u0633\u0627\u0628")}
                    type="button"
                  >
                    <span className="quote-flow-icon" aria-hidden="true">W</span>
                    {"\u0625\u0631\u0633\u0627\u0644 \u0639\u0628\u0631 \u0627\u0644\u0648\u0627\u062a\u0633\u0627\u0628"}
                  </button>
                  <button
                    className="quote-flow-option"
                    onClick={() => handleChannelSubmit("\u062a\u0645 \u062a\u062c\u0647\u064a\u0632 \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0639\u0628\u0631 \u0627\u0644\u0625\u064a\u0645\u064a\u0644")}
                    type="button"
                  >
                    <span className="quote-flow-icon" aria-hidden="true">
                      <svg viewBox="0 0 20 20">
                        <path d="M3 5h14v10H3z" />
                        <path d="m3 6 7 5 7-5" />
                      </svg>
                    </span>
                    {"\u0625\u0631\u0633\u0627\u0644 \u0639\u0628\u0631 \u0627\u0644\u0625\u064a\u0645\u064a\u0644"}
                  </button>
                </div>
              ) : null}
            </div>

            {submittedMessage ? <p className="quote-flow-success">{submittedMessage}</p> : null}
          </div>
      </article>

      <article className="quote-card quote-history-card">
        <div className="card-title">
          <h3>{t("dashboardPages.quotes.historyTitle")}</h3>
          <span>{t("dashboardPages.quotes.historySubtitle")}</span>
        </div>
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>{t("dashboardPages.quotes.quoteId")}</th>
                <th>{t("commission.customer")}</th>
                <th>{t("dashboardPages.quotes.package")}</th>
                <th>{t("dashboardPages.quotes.amount")}</th>
                <th>{t("commission.status")}</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((row) => (
                <tr key={row}>
                  <td>{t(`dashboardPages.quotes.row${row}.id`)}</td>
                  <td>{t(`dashboardPages.quotes.row${row}.customer`)}</td>
                  <td>{t(`dashboardPages.quotes.row${row}.package`)}</td>
                  <td>{t(`dashboardPages.quotes.row${row}.amount`)}</td>
                  <td>
                    <span className={`badge ${t(`dashboardPages.quotes.row${row}.statusClass`)}`}>
                      {t(`dashboardPages.quotes.row${row}.status`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

export function CommissionTable({expanded = false}: {expanded?: boolean}) {
  const t = useTranslations();

  return (
    <article className={`table-card ${expanded ? "expanded-table-card" : ""}`}>
      <div className="card-title">
        <h3>{t("commission.title")}</h3>
        <span>{t("commission.subtitle")}</span>
      </div>
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>{t("commission.customer")}</th>
              <th>{t("commission.sale")}</th>
              <th>{t("commission.percent")}</th>
              <th>{t("commission.amount")}</th>
              <th>{t("commission.status")}</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((row) => (
              <tr key={row}>
                <td>{t(`commission.row${row}.customer`)}</td>
                <td>{t(`commission.row${row}.sale`)}</td>
                <td>{t(`commission.row${row}.percent`)}</td>
                <td>{t(`commission.row${row}.commission`)}</td>
                <td>
                  <span className={`badge ${t(`commission.row${row}.statusClass`)}`}>
                    {t(`commission.row${row}.status`)}
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

export function HelpDeskPanel({expanded = false}: {expanded?: boolean}) {
  const t = useTranslations();
  const categoryOther = t("support.categoryOther");
  const [ticketCategory, setTicketCategory] = useState(t("support.category1"));

  return (
    <div className={`helpdesk-layout ${expanded ? "expanded-support-card" : ""}`}>
      <article className="support-card ticket-list-card">
        <div className="card-title">
          <h3>{t("dashboardPages.support.ticketList")}</h3>
          <span>{t("support.openTickets")}</span>
        </div>
        <div className="ticket-list">
          {[1, 2, 3].map((ticket) => (
            <div className="ticket-row" key={ticket}>
              <div>
                <strong>{t(`dashboardPages.support.ticket${ticket}.title`)}</strong>
                <span>{t(`dashboardPages.support.ticket${ticket}.meta`)}</span>
              </div>
              <span className={`badge ${t(`dashboardPages.support.ticket${ticket}.statusClass`)}`}>
                {t(`dashboardPages.support.ticket${ticket}.status`)}
              </span>
            </div>
          ))}
        </div>
      </article>

      <article className="support-card ticket-form-card">
        <div className="card-title">
          <h3>{t("support.title")}</h3>
          <span>{t("support.subtitle")}</span>
        </div>
        <label>
          <span>{t("support.category")}</span>
          <DashboardSelect
            ariaLabel={t("support.category")}
            onValueChange={setTicketCategory}
            options={[1, 2, 3, 4].map((item) => ({
              label: t(`support.category${item}`),
              value: t(`support.category${item}`)
            })).concat({label: categoryOther, value: categoryOther})}
            value={ticketCategory}
          />
        </label>
        {ticketCategory === categoryOther ? (
          <label className="support-other-category">
            <span>{t("support.customCategoryLabel")}</span>
            <input type="text" placeholder={t("support.customCategoryPlaceholder")} />
          </label>
        ) : null}
        <textarea placeholder={t("support.detailsPlaceholder")} />
        <button className="button button-dark compact-action">{t("support.button")}</button>
      </article>
    </div>
  );
}

export function SettingsPanel() {
  const t = useTranslations();

  return (
    <div className="settings-grid">
      {[1, 2, 3].map((item) => (
        <article className="metric-card settings-card" key={item}>
          <span>{t(`dashboardPages.settings.item${item}.label`)}</span>
          <strong>{t(`dashboardPages.settings.item${item}.value`)}</strong>
          <small>{t(`dashboardPages.settings.item${item}.note`)}</small>
        </article>
      ))}
    </div>
  );
}
