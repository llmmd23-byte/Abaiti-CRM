"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import DashboardSelect from "@/components/DashboardSelect";
import { createBackend, useBackend } from "@/lib/client-backend";

type BackendRow = Record<string, unknown> & { id: number };
const NUMBER_LOCALE = "en-US";
const ARABIC_DATE_LOCALE = "ar-SA-u-ca-gregory-nu-latn";

function dateAfterDays(days: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysUntilDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 14;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.max(
    1,
    Math.min(30, Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))),
  );
}

function formatMoney(value: unknown, currency = "SAR") {
  return `${Number(value ?? 0).toLocaleString(NUMBER_LOCALE)} ${currency}`;
}

function cleanDate(value: unknown) {
  return String(value ?? "").slice(0, 10) || "—";
}

function parseDatabaseDate(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const date = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatUserDateTime(value: unknown, isArabic: boolean) {
  const date = parseDatabaseDate(value);
  if (!date) return "—";
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

function remainingQuoteTimeLabel(row: BackendRow, isArabic: boolean) {
  const validUntilValue = String(row.valid_until ?? "").trim();
  let expiryDate = validUntilValue ? new Date(validUntilValue) : null;

  if (!expiryDate || Number.isNaN(expiryDate.getTime())) {
    const createdAt = new Date(String(row.created_at ?? ""));
    if (Number.isNaN(createdAt.getTime())) return "—";
    expiryDate = new Date(createdAt);
    expiryDate.setDate(expiryDate.getDate() + 14);
  }

  expiryDate.setHours(23, 59, 59, 999);
  const remainingDays = Math.ceil(
    (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  if (remainingDays <= 0) return isArabic ? "منتهي" : "Expired";
  return isArabic
    ? `${remainingDays.toLocaleString(NUMBER_LOCALE)} يوم`
    : `${remainingDays.toLocaleString(NUMBER_LOCALE)} day${remainingDays === 1 ? "" : "s"}`;
}

function productName(product: BackendRow | undefined, isArabic: boolean) {
  return String((isArabic ? product?.name : product?.name_en ?? product?.name) ?? "—");
}

export function DashboardHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: string;
}) {
  return (
    <div className="dashboard-topbar page-topbar">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {action ? <button className="button button-primary">{action}</button> : null}
    </div>
  );
}

export function MetricsGrid() {
  const t = useTranslations();
  const isArabic = useLocale() === "ar";
  const { data } = useBackend<Record<string, number>>("/api/v1/dashboard/summary");
  const currentMonthSales = Number(data?.salesCurrentMonthAmount ?? 0);
  const previousMonthSales = Number(data?.salesPreviousMonthAmount ?? 0);
  const approvedCommissionAmount = Number(data?.approvedCommissionAmount ?? 0);
  const quoteCount = Number(data?.quotes ?? 0);
  const salesCount = Number(data?.sales ?? 0);
  const salesGrowth =
    previousMonthSales > 0
      ? ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100
      : null;
  const quoteConversion = quoteCount > 0 ? (salesCount / quoteCount) * 100 : 0;

  const notes = [
    salesGrowth === null
      ? isArabic
        ? "لا توجد مبيعات في الشهر السابق"
        : "No sales in the previous month"
      : `${salesGrowth >= 0 ? "+" : ""}${salesGrowth.toFixed(1)}% ${isArabic ? "مقارنة بالشهر السابق" : "vs previous month"}`,
    isArabic
      ? `${approvedCommissionAmount.toLocaleString(NUMBER_LOCALE)} SAR قيد الصرف`
      : `${approvedCommissionAmount.toLocaleString(NUMBER_LOCALE)} SAR pending payout`,
    isArabic
      ? `${quoteCount.toLocaleString(NUMBER_LOCALE)} عرض سعر منشأ`
      : `${quoteCount.toLocaleString(NUMBER_LOCALE)} quotes created`,
    isArabic
      ? `${salesCount.toLocaleString(NUMBER_LOCALE)} مبيعات من ${quoteCount.toLocaleString(NUMBER_LOCALE)} عرض سعر`
      : `${salesCount.toLocaleString(NUMBER_LOCALE)} sales from ${quoteCount.toLocaleString(NUMBER_LOCALE)} quotes`,
  ];

  const values = [
    `${Number(data?.salesAmount ?? 0).toLocaleString(NUMBER_LOCALE)} SAR`,
    `${Number(data?.commissionAmount ?? 0).toLocaleString(NUMBER_LOCALE)} SAR`,
    String(data?.leads ?? 0),
    `${quoteConversion.toFixed(1)}%`,
  ];

  return (
    <div className="metric-grid">
      {[1, 2, 3, 4].map((item, index) => (
        <article className="metric-card" key={item}>
          <span>{t(`metrics.item${item}.label`)}</span>
          <strong>{values[index]}</strong>
          <small>{notes[index] || t(`metrics.item${item}.note`)}</small>
        </article>
      ))}
    </div>
  );
}

export function PerformanceChart() {
  const t = useTranslations();
  const isArabic = useLocale() === "ar";
  const [trendPeriod, setTrendPeriod] = useState<"week" | "month" | "year">("week");
  const { data } = useBackend<{
    salesTrend?: Array<{ day: string; amount: number; total: number }>;
  }>(`/api/v1/dashboard/summary?period=${trendPeriod}`);

  const trendByDay = new Map(
    (data?.salesTrend ?? []).map((item) => [String(item.day).slice(0, 10), item]),
  );
  const slotCount = trendPeriod === "year" ? 12 : trendPeriod === "month" ? 30 : 7;
  const salesTrend = Array.from({ length: slotCount }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    if (trendPeriod === "year") {
      day.setDate(1);
      day.setMonth(day.getMonth() - (11 - index));
    } else {
      day.setDate(day.getDate() - (slotCount - 1 - index));
    }
    const key =
      trendPeriod === "year"
        ? `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}`
        : `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    return trendByDay.get(key) ?? { day: key, amount: 0, total: 0 };
  });
  const maximumAmount = Math.max(...salesTrend.map((item) => item.amount), 1);
  const periodAmount = salesTrend.reduce((total, item) => total + item.amount, 0);
  const periodSales = salesTrend.reduce((total, item) => total + item.total, 0);
  const averageSale = periodSales > 0 ? periodAmount / periodSales : 0;
  const periodLabel =
    trendPeriod === "week"
      ? isArabic
        ? "آخر 7 أيام"
        : "Last 7 days"
      : trendPeriod === "month"
        ? isArabic
          ? "آخر 30 يومًا"
          : "Last 30 days"
        : isArabic
          ? "آخر 12 شهرًا"
          : "Last 12 months";

  return (
    <article className="chart-card full-card">
      <div className="card-title">
        <h3>{t("chart.title")}</h3>
        <div className="chart-title-tools">
          <div className="chart-legend">
            <span className="chart-legend-pill">
              <i className="teal pulse" />
              {isArabic ? `مبيعات ${periodLabel}` : `Sales - ${periodLabel}`}
            </span>
          </div>
          <div className="chart-period-filter" role="group">
            {[
              ["week", isArabic ? "أسبوع" : "Week"],
              ["month", isArabic ? "شهر" : "Month"],
              ["year", isArabic ? "سنة" : "Year"],
            ].map(([period, label]) => (
              <button
                className={trendPeriod === period ? "active" : ""}
                key={period}
                onClick={() => setTrendPeriod(period as "week" | "month" | "year")}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="chart-insights-row">
        <span className="chart-insight teal">
          {isArabic ? "إجمالي الفترة" : "Period total"}: {periodAmount.toLocaleString(NUMBER_LOCALE)} SAR
        </span>
        <span className="chart-insight navy">
          {isArabic ? "عدد المبيعات" : "Sales count"}: {periodSales.toLocaleString(NUMBER_LOCALE)}
        </span>
        <span className="chart-insight emerald">
          {isArabic ? "متوسط قيمة المبيعات" : "Average sale value"}:{" "}
          {averageSale.toLocaleString(NUMBER_LOCALE, { maximumFractionDigits: 2 })} SAR
        </span>
      </div>
      <div
        className="bar-chart"
        aria-label={t("chart.label")}
        style={{ "--chart-columns": salesTrend.length } as React.CSSProperties}
      >
        {salesTrend.map((item) => {
          const dayLabel = new Intl.DateTimeFormat(isArabic ? ARABIC_DATE_LOCALE : NUMBER_LOCALE, {
            ...(trendPeriod === "year"
              ? { month: "short" as const, year: "2-digit" as const }
              : { weekday: "short" as const }),
          }).format(new Date(`${item.day}${trendPeriod === "year" ? "-01" : ""}T12:00:00`));
          return (
            <div className="bar-chart-column" key={item.day}>
              <small>{dayLabel}</small>
              <span
                className={item.amount > 0 ? "" : "is-zero"}
                title={`${dayLabel}: ${item.amount.toLocaleString(NUMBER_LOCALE)} SAR`}
                style={{
                  "--h":
                    item.amount > 0
                      ? `${Math.max(8, (item.amount / maximumAmount) * 100)}%`
                      : "0%",
                } as React.CSSProperties}
              />
              <small>{item.amount.toLocaleString(NUMBER_LOCALE)}</small>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export function QuoteSystem() {
  const t = useTranslations();
  const isArabic = useLocale() === "ar";
  const [flowStep, setFlowStep] = useState<"action" | "channel">("action");
  const [selectedAction, setSelectedAction] = useState("");
  const [submittedMessage, setSubmittedMessage] = useState("");
  const flowRef = useRef<HTMLDivElement | null>(null);
  const leads = useBackend<BackendRow[]>("/api/v1/data/leads");
  const products = useBackend<BackendRow[]>("/api/v1/data/products");
  const quotes = useBackend<BackendRow[]>("/api/v1/data/quotes");
  const [leadId, setLeadId] = useState("");
  const [productId, setProductId] = useState("");
  const [quoteDurationDays, setQuoteDurationDays] = useState("14");
  const [validUntil, setValidUntil] = useState(() => dateAfterDays(14));
  const [quoteNotes, setQuoteNotes] = useState("");
  const [quoteValidation, setQuoteValidation] = useState("");
  const [quoteStatusFilter, setQuoteStatusFilter] = useState("all");
  const [quoteStatusMessage, setQuoteStatusMessage] = useState("");
  const [quoteHistoryView, setQuoteHistoryView] = useState<"table" | "kanban">("table");
  const [draggedQuoteId, setDraggedQuoteId] = useState<number | null>(null);
  const [dragOverQuoteStatus, setDragOverQuoteStatus] = useState<string | null>(null);

  const selectedProduct = (products.data ?? []).find((product) => String(product.id) === productId);
  const amount = selectedProduct?.base_price == null ? "" : String(selectedProduct.base_price);
  const productCurrency = String(selectedProduct?.currency ?? "SAR");
  const quoteStatusLabels: Record<string, string> = isArabic
    ? {
        draft: "مسودة",
        sent: "مرسل",
        accepted: "مقبول",
        paid: "مدفوع",
        expired: "منتهي",
        cancelled: "ملغي",
      }
    : {
        draft: "Draft",
        sent: "Sent",
        accepted: "Accepted",
        paid: "Paid",
        expired: "Expired",
        cancelled: "Cancelled",
      };
  const userEditableQuoteStatuses = ["draft", "sent", "accepted"];
  const editableQuoteStatusOptions = Object.entries(quoteStatusLabels)
    .filter(([value]) => userEditableQuoteStatuses.includes(value))
    .map(([value, label]) => ({ value, label }));
  const text = {
    customerSearch: isArabic ? "ابحث عن العميل..." : "Search customers...",
    amountPlaceholder: isArabic ? "اختر المنتج لعرض قيمة العرض" : "Select a product to view its price",
    detailsLabel: isArabic ? "تفاصيل العرض" : "Quote Details",
    detailsPlaceholder: isArabic
      ? "اكتب تفاصيل العرض والملاحظات الخاصة بالعميل..."
      : "Enter quote details and customer notes...",
    validation: isArabic ? "يرجى تعبئة جميع الحقول المطلوبة" : "Please complete all required fields",
    created: isArabic ? "تم إنشاء عرض السعر بنجاح" : "Quote created successfully",
    duplicate: isArabic ? "يوجد عرض سعر لهذا العميل مسبقًا" : "This customer already has a quote",
    failed: isArabic ? "تعذر إنشاء عرض السعر" : "Unable to create quote",
    updating: isArabic ? "جاري تحديث الحالة..." : "Updating status...",
    updateFailed: isArabic ? "تعذر تحديث الحالة" : "Unable to update status",
    allStatuses: isArabic ? "كل الحالات" : "All Statuses",
    table: isArabic ? "جدول" : "Table",
    kanban: isArabic ? "كانبان" : "Kanban",
    noQuotes: isArabic ? "لا توجد عروض" : "No quotes",
    noQuotesForStatus: isArabic
      ? "لا توجد عروض أسعار مطابقة للحالة المختارة"
      : "No quotes match the selected status",
    restrictedStatus: isArabic
      ? "يمكن للمستخدم التبديل فقط بين مسودة ومرسل ومقبول"
      : "Users can only switch between Draft, Sent, and Accepted",
    durationLabel: isArabic ? "مدة العرض بالأيام" : "Quote Duration (Days)",
    durationPlaceholder: isArabic ? "اكتب مدة العرض" : "Enter duration",
    durationLimit: isArabic ? "الحد الأقصى 30 يوم" : "Maximum 30 days",
  };
  const filteredQuotes = (quotes.data ?? []).filter(
    (quote) => quoteStatusFilter === "all" || String(quote.status ?? "draft") === quoteStatusFilter,
  );

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

  async function createQuote() {
    const durationNumber = Number(quoteDurationDays);
    if (
      !leadId ||
      !productId ||
      amount === "" ||
      !validUntil ||
      !Number.isFinite(durationNumber) ||
      durationNumber < 1 ||
      durationNumber > 30
    ) {
      setQuoteValidation(text.validation);
      return;
    }
    try {
      await createBackend("quotes", {
        lead_id: leadId,
        product_id: productId,
        amount,
        currency: productCurrency,
        valid_until: validUntil,
        notes: quoteNotes.trim() || null,
      });
      await quotes.reload();
      setSubmittedMessage(text.created);
      setQuoteNotes("");
      setQuoteValidation("");
      setFlowStep("channel");
    } catch (error) {
      const duplicate = error instanceof Error && error.message === "DUPLICATE_CUSTOMER_QUOTE";
      setSubmittedMessage(duplicate ? text.duplicate : text.failed);
    }
    window.setTimeout(() => setSubmittedMessage(""), 1800);
  }

  async function updateQuoteStatus(quoteId: number, status: string) {
    const currentQuote = (quotes.data ?? []).find((quote) => Number(quote.id) === Number(quoteId));
    const currentStatus = String(currentQuote?.status ?? "draft");
    if (
      !userEditableQuoteStatuses.includes(status) ||
      !userEditableQuoteStatuses.includes(currentStatus)
    ) {
      setQuoteStatusMessage(text.restrictedStatus);
      window.setTimeout(() => setQuoteStatusMessage(""), 2200);
      return;
    }
    setQuoteStatusMessage(text.updating);
    try {
      const response = await fetch(`/api/v1/data/quotes/${quoteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("UPDATE_FAILED");
      await quotes.reload();
      setQuoteStatusMessage("");
    } catch {
      setQuoteStatusMessage(text.updateFailed);
    }
  }

  return (
    <div className="quotes-page-grid">
      <article className="quote-card quote-form-card">
        <div className="card-title">
          <h3>{t("dashboardPages.quotes.formTitle")}</h3>
          <span>{t("dashboardPages.quotes.formSubtitle")}</span>
        </div>
        <div className="form-grid">
          <label className="quote-field quote-field-customer">
            <span>
              {t("dashboardPages.quotes.customer")} <b className="required-mark">*</b>
            </span>
            <DashboardSelect
              ariaLabel={t("dashboardPages.quotes.customer")}
              onValueChange={setLeadId}
              options={(leads.data ?? []).map((lead) => ({
                label: String(lead.name ?? lead.email ?? lead.id),
                value: String(lead.id),
              }))}
              placeholder={t("dashboardPages.quotes.customerPlaceholder")}
              searchable
              searchPlaceholder={text.customerSearch}
              value={leadId}
            />
          </label>
          <label className="quote-field quote-field-product">
            <span>
              {t("dashboardPages.quotes.package")} <b className="required-mark">*</b>
            </span>
            <DashboardSelect
              ariaLabel={t("dashboardPages.quotes.package")}
              onValueChange={setProductId}
              options={(products.data ?? []).map((product) => ({
                label: productName(product, isArabic),
                value: String(product.id),
              }))}
              placeholder={t("dashboardPages.quotes.packageOption1")}
              value={productId}
            />
          </label>
          <label className="quote-field quote-field-amount">
            <span>
              {t("dashboardPages.quotes.amount")} <b className="required-mark">*</b>
            </span>
            <div className="quote-readonly-amount">
              <input
                aria-readonly="true"
                placeholder={text.amountPlaceholder}
                readOnly
                type="text"
                value={amount === "" ? "" : Number(amount).toLocaleString(NUMBER_LOCALE)}
              />
              <span>{productCurrency}</span>
            </div>
          </label>
          <label className="quote-field quote-field-duration">
            <span>
              {text.durationLabel} <b className="required-mark">*</b>
            </span>
            <input
              inputMode="numeric"
              max={30}
              min={1}
              onChange={(event) => {
                const rawValue = event.target.value.replace(/[^\d]/g, "");
                if (!rawValue) {
                  setQuoteDurationDays("");
                  return;
                }
                const nextDays = Math.max(1, Math.min(30, Number(rawValue)));
                setQuoteDurationDays(String(nextDays));
                setValidUntil(dateAfterDays(nextDays));
              }}
              placeholder={text.durationPlaceholder}
              type="number"
              value={quoteDurationDays}
            />
            <small className="quote-duration-hint">{text.durationLimit}</small>
          </label>
          <label className="quote-field quote-field-date">
            <span>
              {t("dashboardPages.quotes.validUntil")} <b className="required-mark">*</b>
            </span>
            <input
              max={dateAfterDays(30)}
              min={dateAfterDays(0)}
              onChange={(event) => {
                setValidUntil(event.target.value);
                setQuoteDurationDays(String(daysUntilDate(event.target.value)));
              }}
              type="date"
              value={validUntil}
            />
          </label>
        </div>
        <div className="quote-flow" ref={flowRef}>
          <div className="quote-flow-menu bg-white border border-slate-100 shadow-sm rounded-2xl p-6 w-full text-right">
            <label className="quote-details-field">
              <span>{text.detailsLabel}</span>
              <textarea
                onChange={(event) => setQuoteNotes(event.target.value)}
                placeholder={text.detailsPlaceholder}
                value={quoteNotes}
              />
            </label>
            <div className="quote-action-row">
              <button
                aria-pressed={selectedAction === "create"}
                className="quote-flow-option quote-action-option rounded-full bg-[#11293D] px-6 py-4 font-bold text-white shadow-md"
                onClick={() => {
                  setSelectedAction("create");
                  void createQuote();
                }}
                type="button"
              >
                {isArabic ? "إنشاء عرض سعر" : "Create Quote"}
              </button>
              {quoteValidation ? (
                <p className="quote-required-message" role="alert">
                  {quoteValidation}
                </p>
              ) : null}
              {flowStep === "channel" ? (
                <div className="quote-channel-panel">
                  <button className="quote-flow-option" type="button">
                    {isArabic ? "إرسال عبر الواتساب" : "Send via WhatsApp"}
                  </button>
                  <button className="quote-flow-option" type="button">
                    {isArabic ? "إرسال عبر الإيميل" : "Send via Email"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          {submittedMessage ? <p className="quote-flow-success">{submittedMessage}</p> : null}
        </div>
      </article>

      <article className="quote-card quote-history-card">
        <div className="card-title">
          <div>
            <div className="quote-history-title-row">
              <h3>{t("dashboardPages.quotes.historyTitle")}</h3>
              <div className="quote-status-filter">
                <DashboardSelect
                  ariaLabel={isArabic ? "فلترة عروض الأسعار حسب الحالة" : "Filter quotes by status"}
                  onValueChange={setQuoteStatusFilter}
                  options={[
                    { value: "all", label: text.allStatuses },
                    ...Object.entries(quoteStatusLabels).map(([value, label]) => ({ value, label })),
                  ]}
                  value={quoteStatusFilter}
                />
              </div>
            </div>
            <span>{t("dashboardPages.quotes.historySubtitle")}</span>
            {quoteStatusMessage ? <small className="quote-status-message">{quoteStatusMessage}</small> : null}
          </div>
          <div className="quote-history-view-switch" role="group">
            <button
              className={quoteHistoryView === "table" ? "active" : ""}
              onClick={() => setQuoteHistoryView("table")}
              type="button"
            >
              {text.table}
            </button>
            <button
              className={quoteHistoryView === "kanban" ? "active" : ""}
              onClick={() => setQuoteHistoryView("kanban")}
              type="button"
            >
              {text.kanban}
            </button>
          </div>
        </div>
        {quoteHistoryView === "table" ? (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>{t("dashboardPages.quotes.quoteId")}</th>
                  <th>{t("commission.customer")}</th>
                  <th>{t("dashboardPages.quotes.package")}</th>
                  <th>{t("dashboardPages.quotes.amount")}</th>
                  <th>{isArabic ? "المتبقي على انتهاء العرض" : "Remaining Time"}</th>
                  <th>{t("commission.status")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((row) => {
                  const quoteStatus = String(row.status ?? "draft");
                  const lead = (leads.data ?? []).find((item) => Number(item.id) === Number(row.lead_id));
                  const product = (products.data ?? []).find((item) => Number(item.id) === Number(row.product_id));
                  return (
                    <tr key={row.id}>
                      <td>{String(row.quote_number ?? row.id)}</td>
                      <td>{String(lead?.name ?? row.lead_id ?? "—")}</td>
                      <td>{productName(product, isArabic)}</td>
                      <td>{formatMoney(row.amount, String(row.currency ?? "SAR"))}</td>
                      <td>{remainingQuoteTimeLabel(row, isArabic)}</td>
                      <td>
                        <div className={`quote-inline-status quote-status-${quoteStatus}`}>
                          <DashboardSelect
                            ariaLabel={isArabic ? "تغيير حالة عرض السعر" : "Change quote status"}
                            menuClassName={`quote-status-portal-menu ${isArabic ? "rtl" : "ltr"}`}
                            onValueChange={(value) => void updateQuoteStatus(row.id, value)}
                            options={
                              userEditableQuoteStatuses.includes(quoteStatus)
                                ? editableQuoteStatusOptions
                                : [{ value: quoteStatus, label: quoteStatusLabels[quoteStatus] ?? quoteStatus }]
                            }
                            portal
                            value={quoteStatus}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td className="quote-history-empty" colSpan={6}>
                      {text.noQuotesForStatus}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="quote-kanban-board">
            {Object.entries(quoteStatusLabels).map(([stage, label]) => {
              const stageQuotes = filteredQuotes.filter((quote) => String(quote.status ?? "draft") === stage);
              return (
                <section
                  className={`quote-kanban-column quote-status-${stage} ${dragOverQuoteStatus === stage ? "drag-over" : ""}`}
                  key={stage}
                  onDragEnter={() => setDragOverQuoteStatus(stage)}
                  onDragLeave={() => setDragOverQuoteStatus(null)}
                  onDragOver={(event) => {
                    if (userEditableQuoteStatuses.includes(stage)) {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    } else {
                      event.dataTransfer.dropEffect = "none";
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const quoteId = draggedQuoteId ?? Number(event.dataTransfer.getData("text/plain"));
                    setDraggedQuoteId(null);
                    setDragOverQuoteStatus(null);
                    if (quoteId && userEditableQuoteStatuses.includes(stage)) void updateQuoteStatus(quoteId, stage);
                  }}
                >
                  <div className="quote-kanban-column-head">
                    <strong>{label}</strong>
                    <span>{stageQuotes.length}</span>
                  </div>
                  <div className="quote-kanban-cards">
                    {stageQuotes.map((quote) => {
                      const lead = (leads.data ?? []).find((item) => item.id === Number(quote.lead_id));
                      const product = (products.data ?? []).find((item) => item.id === Number(quote.product_id));
                      return (
                        <article
                          className={`quote-kanban-card ${draggedQuoteId === quote.id ? "dragging" : ""}`}
                          draggable={userEditableQuoteStatuses.includes(String(quote.status ?? "draft"))}
                          key={quote.id}
                          onDragEnd={() => {
                            setDraggedQuoteId(null);
                            setDragOverQuoteStatus(null);
                          }}
                          onDragStart={(event) => {
                            setDraggedQuoteId(quote.id);
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", String(quote.id));
                          }}
                        >
                          <div className="quote-kanban-card-head">
                            <strong>{String(lead?.name ?? quote.lead_id ?? "—")}</strong>
                            <small>{String(quote.quote_number ?? quote.id)}</small>
                          </div>
                          <span>{productName(product, isArabic)}</span>
                          <b>{formatMoney(quote.amount, String(quote.currency ?? "SAR"))}</b>
                        </article>
                      );
                    })}
                    {stageQuotes.length === 0 ? <p className="quote-kanban-empty">{text.noQuotes}</p> : null}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </article>
    </div>
  );
}

export function CommissionTable({ expanded = false }: { expanded?: boolean }) {
  const t = useTranslations();
  const { data } = useBackend<BackendRow[]>("/api/v1/data/commissions");
  const rows = data ?? [];

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
              <th>{t("commission.affiliate")}</th>
              <th>{t("commission.saleId")}</th>
              <th>{t("commission.rate")}</th>
              <th>{t("commission.amount")}</th>
              <th>{t("commission.status")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{String(row.affiliate_user_id ?? "—")}</td>
                <td>{String(row.sale_id ?? "—")}</td>
                <td>{String(row.commission_percent ?? 0)}%</td>
                <td>{formatMoney(row.commission_amount, String(row.currency ?? "SAR"))}</td>
                <td>
                  <span className={`badge ${String(row.status ?? "pending")}`}>{String(row.status ?? "pending")}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export function SalesTable({ expanded = false }: { expanded?: boolean }) {
  const isArabic = useLocale() === "ar";
  const { data } = useBackend<BackendRow[]>("/api/v1/data/sales");
  const { data: currentUser } =
    useBackend<{ userid: number }>("/api/v1/auth/me");
  const rows = data ?? [];
  const currentUserId = Number(currentUser?.userid ?? 0);
  const showUserColumn =
    currentUserId > 0 &&
    rows.some(
      (row) =>
        Number(row.affiliate_user_id ?? currentUserId) !== currentUserId,
    );
  const statusLabel = (status: unknown) => {
    const key = String(status ?? "pending");
    const labels: Record<string, { ar: string; en: string }> = {
      pending: { ar: "قيد الانتظار", en: "Pending" },
      approved: { ar: "معتمد", en: "Approved" },
      paid: { ar: "مدفوع", en: "Paid" },
      cancelled: { ar: "ملغي", en: "Cancelled" },
      refunded: { ar: "مسترد", en: "Refunded" },
    };
    return labels[key]?.[isArabic ? "ar" : "en"] ?? key;
  };

  return (
    <article className={`table-card ${expanded ? "expanded-table-card" : ""}`}>
      <div className="card-title">
        <h3>{isArabic ? "قائمة المبيعات" : "Sales List"}</h3>
        <span>
          {isArabic ? "البيانات معروضة مباشرة من جدول المبيعات" : "Data is loaded directly from the sales table"}
        </span>
      </div>
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>{isArabic ? "رقم المبيعات" : "Sales Number"}</th>
              <th>{isArabic ? "العميل" : "Client"}</th>
              <th>{isArabic ? "المنتج" : "Product"}</th>
              <th>{isArabic ? "المبلغ" : "Amount"}</th>
              {showUserColumn ? (
                <th>{isArabic ? "المستخدم" : "User"}</th>
              ) : null}
              <th>{isArabic ? "الحالة" : "Status"}</th>
              <th>{isArabic ? "رقم العرض" : "Quote Number"}</th>
              <th>{isArabic ? "التاريخ" : "Date"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{String(row.sales_invoice_number ?? `S-${row.id}`)}</td>
                <td>{String(row.customer_name ?? "—")}</td>
                <td>{String((isArabic ? row.product_name : row.product_name_en ?? row.product_name) ?? "—")}</td>
                <td>{formatMoney(row.sale_amount, String(row.currency ?? "SAR"))}</td>
                {showUserColumn ? (
                  <td>{String(row.affiliate_user_name ?? "—")}</td>
                ) : null}
                <td>
                  <span className={`badge ${String(row.status ?? "pending")}`}>{statusLabel(row.status)}</span>
                </td>
                <td>{String(row.quote_number ?? "—")}</td>
                <td>{cleanDate(row.sold_at ?? row.created_at)}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={showUserColumn ? 8 : 7}>
                  {isArabic ? "لا توجد مبيعات" : "No sales found"}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export function HelpDeskPanel({ expanded = false }: { expanded?: boolean }) {
  const isArabic = useLocale() === "ar";
  const tickets = useBackend<BackendRow[]>("/api/v1/data/support-tickets");
  const ticketEvents = useBackend<BackendRow[]>("/api/v1/data/support-ticket-events");
  const [ticketFilter, setTicketFilter] = useState("all");
  const [advancedTicketFilter, setAdvancedTicketFilter] = useState(false);
  const [category, setCategory] = useState("Commission Issue");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  const statusLabels: Record<string, string> = isArabic
    ? {
        open: "مفتوحة",
        in_progress: "قيد المعالجة",
        resolved: "محلولة",
        closed: "مغلقة",
      }
    : {
        open: "Open",
        in_progress: "In progress",
        resolved: "Resolved",
        closed: "Closed",
      };
  const categoryOptions = [
    { value: "Commission Issue", label: isArabic ? "مشكلة عمولة" : "Commission Issue" },
    { value: "Account Support", label: isArabic ? "دعم الحساب" : "Account Support" },
    { value: "Technical Issue", label: isArabic ? "مشكلة تقنية" : "Technical Issue" },
  ];
  const categoryLabel = (value: unknown) => {
    const rawCategory = String(value ?? "");
    return categoryOptions.find((option) => option.value === rawCategory)?.label || rawCategory || "—";
  };
  const filteredTickets = (tickets.data ?? []).filter((ticket) => {
    const status = String(ticket.status ?? "open");
    if (advancedTicketFilter && !["open", "in_progress"].includes(status)) {
      return false;
    }
    return ticketFilter === "all" || status === ticketFilter;
  });

  const createdAgo = (value: unknown) => {
    const date = parseDatabaseDate(value);
    if (!date) return "—";
    const formatter = new Intl.RelativeTimeFormat(isArabic ? "ar-u-nu-latn" : "en", { numeric: "auto" });
    const diffDays = Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return isArabic ? `تم الإنشاء ${formatter.format(diffDays, "day")}` : `Created ${formatter.format(diffDays, "day")}`;
  };

  const eventTitle = (event: Record<string, unknown>) => {
    const type = String(event.event_type ?? "");
    if (type === "created") return isArabic ? "تم إنشاء التذكرة" : "Ticket created";
    if (type === "status_changed") return isArabic ? "تم تغيير الحالة" : "Status changed";
    if (type === "admin_note") return isArabic ? "أضاف الأدمن ملاحظة" : "Admin added a note";
    return isArabic ? "حركة على التذكرة" : "Ticket activity";
  };

  const eventDescription = (event: Record<string, unknown>) => {
    const type = String(event.event_type ?? "");
    if (type === "status_changed") {
      const oldStatus = String(event.old_status ?? "");
      const newStatus = String(event.new_status ?? "");
      const arrow = isArabic ? "←" : "→";
      return `${statusLabels[oldStatus] ?? oldStatus} ${arrow} ${statusLabels[newStatus] ?? newStatus}`;
    }
    if (type === "admin_note") return String(event.note ?? "");
    if (type === "created") return String(event.note ?? "");
    return String(event.note ?? "");
  };

  async function submitTicket() {
    if (!subject.trim() || !details.trim()) {
      setSaveStatus(isArabic ? "يرجى تعبئة الموضوع والتفاصيل" : "Subject and details are required");
      return;
    }
    setSaveStatus(isArabic ? "جاري الحفظ..." : "Saving...");
    try {
      await createBackend("support-tickets", {
        category,
        subject: subject.trim(),
        details: details.trim(),
      });
      setSubject("");
      setDetails("");
      setSaveStatus(isArabic ? "تم فتح التذكرة" : "Ticket opened");
      await tickets.reload();
    } catch {
      setSaveStatus(isArabic ? "تعذر فتح التذكرة" : "Unable to open ticket");
    }
  }

  return (
    <section className={`support-layout ${expanded ? "expanded-support-card" : ""}`}>
      <article className="support-card past-tickets-card ticket-list-card">
        <div className="card-title">
          <div>
            <h3>{isArabic ? "التذاكر السابقة" : "Past tickets"}</h3>
            <span>{isArabic ? "متابعة حالة طلبات الدعم" : "Track support requests"}</span>
          </div>
          <div className="ticket-filter-tools">
            <div className="demo-status-filter">
              <DashboardSelect
                ariaLabel={isArabic ? "فلترة التذاكر حسب الحالة" : "Filter tickets by status"}
                onValueChange={setTicketFilter}
                options={[
                  { value: "all", label: isArabic ? "كل الحالات" : "All statuses" },
                  ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
                ]}
                value={ticketFilter}
              />
            </div>
            <button
              aria-pressed={advancedTicketFilter}
              className={`ticket-advanced-filter${advancedTicketFilter ? " active" : ""}`}
              onClick={() => setAdvancedTicketFilter((current) => !current)}
              type="button"
            >
              {isArabic ? "فلترة متقدمة" : "Advanced Filter"}
            </button>
          </div>
        </div>
        <div className="ticket-list">
          {filteredTickets.map((ticket) => {
            const status = String(ticket.status ?? "open");
            const events = (ticketEvents.data ?? [])
              .filter((event) => Number(event.ticket_id) === Number(ticket.id))
              .sort(
                (first, second) =>
                  new Date(String(first.created_at ?? "")).getTime() -
                  new Date(String(second.created_at ?? "")).getTime(),
              );
            const timelineEvents =
              events.length > 0
                ? events
                : [
                    {
                      id: `created-${ticket.id}`,
                      ticket_id: ticket.id,
                      event_type: "created",
                      note: String(ticket.subject ?? ""),
                      created_at: ticket.created_at,
                    },
                    {
                      id: `status-${ticket.id}`,
                      ticket_id: ticket.id,
                      event_type: "status_changed",
                      new_status: status,
                      created_at: ticket.updated_at ?? ticket.created_at,
                    },
                  ];
            return (
              <article className="ticket-list-item ticket-row" key={ticket.id}>
                <div className="ticket-content">
                  <div className="ticket-subject-line">
                    <span className="ticket-field-label">
                      {isArabic ? "موضوع:" : "Subject:"}
                    </span>
                    <strong>{String(ticket.subject ?? ticket.ticket_number ?? "—")}</strong>
                  </div>
                  <span className="ticket-meta">
                    {String(ticket.ticket_number ?? "—")}
                  </span>
                  <p className="ticket-category-line">
                    <span className="ticket-field-label">
                      {isArabic ? "تصنيف التذكرة:" : "Ticket category:"}
                    </span>
                    {categoryLabel(ticket.category)}
                  </p>
                  <p className="ticket-details">
                    <span className="ticket-field-label">
                      {isArabic ? "تفاصيل:" : "Details:"}
                    </span>
                    {String(ticket.details ?? "—")}
                  </p>
                  {String(ticket.notes ?? "").trim() ? (
                    <div className="ticket-admin-note">
                      <span className="ticket-field-label">
                        {isArabic ? "ملاحظة الأدمن:" : "Admin note:"}
                      </span>
                      <strong>{String(ticket.notes)}</strong>
                    </div>
                  ) : null}
                  <time>
                    <span>{isArabic ? "تم الإنشاء" : "Created"}</span>
                    {createdAgo(ticket.created_at)}
                  </time>
                  <div className="ticket-timeline" aria-label={isArabic ? "الخط الزمني للتذكرة" : "Ticket timeline"}>
                    {timelineEvents.map((event, index) => {
                      const description = eventDescription(event);
                      return (
                        <div
                          className={`ticket-timeline-step ${index === timelineEvents.length - 1 ? "current" : ""}`}
                          key={String(event.id ?? `${ticket.id}-${index}`)}
                        >
                          <span aria-hidden="true" />
                          <div>
                            <strong>{eventTitle(event)}</strong>
                            <small>
                              {description ? `${description} · ` : ""}
                              {formatUserDateTime(event.created_at, isArabic)}
                            </small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <span className={`badge ${status}`}>{statusLabels[status] ?? status}</span>
              </article>
            );
          })}
          {filteredTickets.length === 0 ? (
            <p className="ticket-list-empty">
              {isArabic ? "لا توجد تذاكر بهذه الحالة" : "No tickets with this status"}
            </p>
          ) : null}
        </div>
      </article>

      <article className="support-card ticket-form-card">
        <div className="card-title">
          <div>
            <h3>{isArabic ? "مركز الدعم" : "Help Desk"}</h3>
            <span>{isArabic ? "دعم الشركة الرئيسية" : "Parent company support"}</span>
          </div>
        </div>
        <label>
          <span>{isArabic ? "تصنيف التذكرة" : "Ticket category"}</span>
          <DashboardSelect
            ariaLabel={isArabic ? "تصنيف التذكرة" : "Ticket category"}
            onValueChange={setCategory}
            options={categoryOptions}
            value={category}
          />
        </label>
        <label className="support-ticket-subject">
          <span>{isArabic ? "موضوع التذكرة" : "Ticket subject"}</span>
          <input
            onChange={(event) => setSubject(event.target.value)}
            placeholder={isArabic ? "اكتب موضوع طلب الدعم" : "Enter the support request subject"}
            type="text"
            value={subject}
          />
        </label>
        <label>
          <span>{isArabic ? "تفاصيل الطلب" : "Request details"}</span>
          <textarea
            onChange={(event) => setDetails(event.target.value)}
            placeholder={isArabic ? "اكتب تفاصيل طلب الدعم..." : "Support request details..."}
            value={details}
          />
        </label>
        <div className="demo-action-row">
          <button className="button button-dark compact-action" onClick={() => void submitTicket()} type="button">
            {isArabic ? "فتح تذكرة دعم" : "Open Support Ticket"}
          </button>
          {saveStatus ? <small>{saveStatus}</small> : null}
        </div>
      </article>
    </section>
  );
}

