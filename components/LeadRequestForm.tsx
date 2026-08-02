"use client";

import { useLocale } from "next-intl";
import { useMemo, useRef, useState, type FormEvent } from "react";
import * as XLSX from "xlsx";

import DashboardSelect from "@/components/DashboardSelect";
import { createBackend, deleteBackend, useBackend } from "@/lib/client-backend";

type IndustryRow = Record<string, unknown> & { id: number };
const NUMBER_LOCALE = "en-US";

function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current.trim());
      current = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else {
      current += char;
    }
  }

  row.push(current.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeImportHeader(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[\s-]+/g, "_");
}

function importedLeadValue(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = row[key]?.trim();
    if (value) return value;
  }
  return "";
}

async function parseImportedLeadRows(file: File) {
  const extension = file.name.split(".").pop()?.toLocaleLowerCase();
  if (extension === "csv") return parseCsvRows(await file.text());
  if (extension === "xlsx" || extension === "xls") {
    const workbook = XLSX.read(await file.arrayBuffer(), {
      cellDates: true,
      type: "array",
    });
    const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json<string[]>(sheet, {
      blankrows: false,
      defval: "",
      header: 1,
      raw: false,
    });
  }
  throw new Error("UNSUPPORTED_FILE");
}

function importedLeadValueFromRow(
  row: Record<string, string>,
  keys: string[],
  values: string[],
  fallbackIndex: number,
) {
  return importedLeadValue(row, keys) || values[fallbackIndex]?.trim() || "";
}

export default function LeadRequestForm({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const isArabic = useLocale() === "ar";
  const copy = isArabic
    ? {
        title: "\u0625\u0636\u0627\u0641\u0629 \u0639\u0645\u064a\u0644 \u0645\u0647\u062a\u0645",
        company: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u0634\u0623\u0629",
        companyPlaceholder: "\u0623\u062f\u062e\u0644 \u0627\u0633\u0645 \u0627\u0644\u0634\u0631\u0643\u0629 \u0623\u0648 \u0627\u0644\u0645\u0624\u0633\u0633\u0629",
        industry: "\u0646\u0648\u0639 \u0627\u0644\u0646\u0634\u0627\u0637",
        industryPlaceholder: "\u0627\u062e\u062a\u0631 \u0646\u0648\u0639 \u0627\u0644\u0646\u0634\u0627\u0637",
        address: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646",
        addressPlaceholder: "\u0627\u0644\u0645\u062f\u064a\u0646\u0629\u060c \u0627\u0644\u062d\u064a",
        name: "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644",
        namePlaceholder: "\u0623\u062f\u062e\u0644 \u0627\u0633\u0645 \u0627\u0644\u0639\u0645\u064a\u0644 \u0627\u0644\u0643\u0627\u0645\u0644",
        email: "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a",
        phone: "\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644",
        requirements: "\u0627\u0644\u0645\u062a\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0625\u0636\u0627\u0641\u064a\u0629",
        requirementsPlaceholder: "\u0627\u0630\u0643\u0631 \u0623\u064a \u0645\u062a\u0637\u0644\u0628\u0627\u062a \u062e\u0627\u0635\u0629 \u0623\u0648 \u062a\u0641\u0627\u0635\u064a\u0644 \u0625\u0636\u0627\u0641\u064a\u0629...",
        submit: "\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0639\u0645\u064a\u0644 \u0627\u0644\u0645\u0647\u062a\u0645",
        required: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u0634\u0623\u0629 \u0648\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0648\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644 \u062d\u0642\u0648\u0644 \u0625\u062c\u0628\u0627\u0631\u064a\u0629",
        creating: "\u062c\u0627\u0631\u064a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0639\u0645\u064a\u0644...",
        created: "\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0639\u0645\u064a\u0644 \u0627\u0644\u0645\u0647\u062a\u0645 \u0628\u0646\u062c\u0627\u062d",
        failed: "\u062a\u0639\u0630\u0631 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0639\u0645\u064a\u0644 \u0627\u0644\u0645\u0647\u062a\u0645",
        importExcel: "استيراد من إكسل",
        importTitle: "استيراد عملاء من ملف Excel",
        templatePrompt: "تحتاج للنموذج المعتمد؟",
        templateDownload: "تحميل قالب Excel",
        dropFile: "اسحب ملف Excel أو CSV هنا أو تصفح جهازك",
        csvSupport: "يدعم الاستيراد ملفات Excel وCSV.",
        removeFile: "إزالة",
        cancel: "إلغاء",
        startImport: "بدء الاستيراد",
        importing: "جاري الاستيراد...",
        csvOnly: "ارفع ملف Excel أو CSV فقط.",
        importFailed: "تعذر قراءة الملف. تأكد أن أول صف يحتوي أسماء الأعمدة أو استخدم القالب المعتمد.",
        noRows: "لم يتم العثور على صفوف صالحة للاستيراد",
        processingRows: "جاري استيراد البيانات...",
        processedRows: (processed: number, total: number) =>
          `تم معالجة ${processed.toLocaleString(NUMBER_LOCALE)} من أصل ${total.toLocaleString(NUMBER_LOCALE)} سجل`,
        imported: (count: number) =>
          `تم استيراد ${count.toLocaleString(NUMBER_LOCALE)} عميل`,
        cancellingImport: "جاري إلغاء الاستيراد وحذف العملاء المضافين...",
        cancelledImport: "تم إلغاء الاستيراد وحذف العملاء المضافين",
        cancelFailed: "تعذر حذف بعض العملاء المضافين. حاول مرة أخرى.",
      }
    : {
        title: "Add Interested Customer",
        company: "Company Name",
        companyPlaceholder: "Enter the company or organization name",
        industry: "Industry",
        industryPlaceholder: "Select an industry",
        address: "Address",
        addressPlaceholder: "City, district",
        name: "Full Name",
        namePlaceholder: "Enter the customer's full name",
        email: "Email Address",
        phone: "Mobile Number",
        requirements: "Additional Requirements",
        requirementsPlaceholder: "Mention any special requirements or additional details...",
        submit: "Add Interested Customer",
        required: "Company name, email address, and mobile number are required",
        creating: "Adding customer...",
        created: "Interested customer added successfully",
        failed: "Unable to add the interested customer",
        importExcel: "Import from Excel",
        importTitle: "Import Customers From Excel",
        templatePrompt: "Need the approved template?",
        templateDownload: "Download Excel Template",
        dropFile: "Drop an Excel or CSV file here or browse",
        csvSupport: "Import supports Excel and CSV files.",
        removeFile: "Remove",
        cancel: "Cancel",
        startImport: "Start Import",
        importing: "Importing...",
        csvOnly: "Upload an Excel or CSV file only.",
        importFailed: "Could not read the file. Make sure the first row has column names or use the approved template.",
        noRows: "No valid rows were found to import",
        processingRows: "Importing data...",
        processedRows: (processed: number, total: number) =>
          `Processed ${processed.toLocaleString(NUMBER_LOCALE)} of ${total.toLocaleString(NUMBER_LOCALE)} records`,
        imported: (count: number) =>
          `Imported ${count.toLocaleString(NUMBER_LOCALE)} customers`,
        cancellingImport: "Cancelling import and removing added customers...",
        cancelledImport: "Import cancelled and added customers removed",
        cancelFailed: "Could not remove some added customers. Please try again.",
      };
  const [leadRequest, setLeadRequest] = useState({
    companyName: "",
    industryId: "",
    address: "",
    fullName: "",
    email: "",
    phone: "",
    requirements: "",
  });
  const [status, setStatus] = useState("");
  const [excelImportOpen, setExcelImportOpen] = useState(false);
  const [excelImportFile, setExcelImportFile] = useState<File | null>(null);
  const [excelImportStatus, setExcelImportStatus] = useState("");
  const [excelImporting, setExcelImporting] = useState(false);
  const [excelImportCancelling, setExcelImportCancelling] = useState(false);
  const [excelImportProgress, setExcelImportProgress] = useState({
    processed: 0,
    total: 0,
  });
  const excelFileInputRef = useRef<HTMLInputElement | null>(null);
  const excelImportCancelRequestedRef = useRef(false);
  const excelImportedLeadIdsRef = useRef<number[]>([]);
  const { data: industries } = useBackend<IndustryRow[]>(
    "/api/v1/data/industries",
  );
  const excelImportPercent =
    excelImportProgress.total > 0
      ? Math.min(
          100,
          Math.round(
            (excelImportProgress.processed / excelImportProgress.total) * 100,
          ),
        )
      : 0;
  const leadTemplateHref = useMemo(() => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["company_name", "name", "phone", "email", "website", "place_url", "address", "requirements"],
      [
        "Example Coffee",
        "Ahmed Ali",
        "+966500000000",
        "lead@example.com",
        "https://example.com",
        "https://www.google.com/maps/place/?q=place_id:example",
        "Riyadh",
        "Interested in CRM",
      ],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Interested Customers");
    const base64 = XLSX.write(workbook, { bookType: "xlsx", type: "base64" });
    return `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
  }, []);

  function resetExcelImport() {
    setExcelImportFile(null);
    setExcelImportStatus("");
    setExcelImportProgress({ processed: 0, total: 0 });
    excelImportCancelRequestedRef.current = false;
    excelImportedLeadIdsRef.current = [];
    if (excelFileInputRef.current) excelFileInputRef.current.value = "";
  }

  async function rollbackExcelImport() {
    const leadIds = [...excelImportedLeadIdsRef.current].reverse();
    if (!leadIds.length) return true;
    setExcelImportCancelling(true);
    setExcelImportStatus(copy.cancellingImport);
    const results = await Promise.allSettled(
      leadIds.map((id) => deleteBackend("leads", id)),
    );
    const failed = results.some((result) => result.status === "rejected");
    if (!failed) excelImportedLeadIdsRef.current = [];
    setExcelImportStatus(failed ? copy.cancelFailed : copy.cancelledImport);
    setExcelImportCancelling(false);
    if (!failed) onCreated?.();
    return !failed;
  }

  async function closeExcelImport() {
    excelImportCancelRequestedRef.current = true;
    if (excelImporting) {
      setExcelImportStatus(copy.cancellingImport);
      return;
    }
    const rolledBack = await rollbackExcelImport();
    if (!rolledBack) return;
    setExcelImportOpen(false);
    resetExcelImport();
  }

  async function importExcelLeads() {
    if (!excelImportFile || excelImporting) return;

    setExcelImporting(true);
    setExcelImportStatus(copy.importing);
    excelImportCancelRequestedRef.current = false;
    excelImportedLeadIdsRef.current = [];
    try {
      const rows = (await parseImportedLeadRows(excelImportFile))
        .map((row) => row.map((value) => String(value ?? "").trim()))
        .filter((row) => row.some(Boolean));
      const firstRow = rows[0] ?? [];
      const normalizedFirstRow = firstRow.map(normalizeImportHeader);
      const knownHeaders = new Set([
        "company_name",
        "company",
        "facility",
        "business",
        "business_name",
        "name",
        "full_name",
        "contact_name",
        "phone",
        "mobile",
        "email",
        "website",
        "place_url",
        "store_location",
        "location",
        "address",
        "city",
        "requirements",
        "notes",
        "اسم_الشركة",
        "اسم_المنشأة",
        "الشركة",
        "المنشأة",
        "اسم_العميل",
        "الاسم",
        "رقم_الجوال",
        "الجوال",
        "البريد_الإلكتروني",
        "الايميل",
        "الموقع_الإلكتروني",
        "موقع_المحل",
        "العنوان",
        "المدينة",
        "المتطلبات",
        "ملاحظات",
      ]);
      const hasHeaderRow = normalizedFirstRow.some((header) =>
        knownHeaders.has(header),
      );
      const normalizedHeaders = hasHeaderRow
        ? normalizedFirstRow
        : [
            "company_name",
            "name",
            "phone",
            "email",
            "website",
            "place_url",
            "address",
            "requirements",
          ];
      const dataRows = hasHeaderRow ? rows.slice(1) : rows;
      setExcelImportProgress({ processed: 0, total: dataRows.length });
      let imported = 0;

      for (const values of dataRows) {
        if (excelImportCancelRequestedRef.current) break;
        const row = Object.fromEntries(
          normalizedHeaders.map((header, index) => [header, values[index] ?? ""]),
        );
        const companyName =
          importedLeadValueFromRow(
            row,
            ["company_name", "company", "facility", "business", "business_name", "اسم_الشركة", "اسم_المنشأة", "الشركة", "المنشأة"],
            values,
            0,
          ) ||
          importedLeadValueFromRow(
            row,
            ["name", "full_name", "contact_name", "اسم_العميل", "الاسم"],
            values,
            1,
          );
        if (!companyName) {
          setExcelImportProgress((current) => ({
            ...current,
            processed: current.processed + 1,
          }));
          continue;
        }

        const createdLead = await createBackend<{ id?: number }>("leads", {
          company_name: companyName,
          name:
            importedLeadValueFromRow(
              row,
              ["name", "full_name", "contact_name", "اسم_العميل", "الاسم"],
              values,
              1,
            ) ||
            companyName,
          phone: importedLeadValueFromRow(row, ["phone", "mobile", "رقم_الجوال", "الجوال"], values, 2),
          email: importedLeadValueFromRow(row, ["email", "البريد_الإلكتروني", "الايميل"], values, 3),
          website: importedLeadValueFromRow(row, ["website", "الموقع_الإلكتروني"], values, 4),
          place_url: importedLeadValueFromRow(row, ["place_url", "store_location", "location", "موقع_المحل"], values, 5),
          address: importedLeadValueFromRow(row, ["address", "city", "العنوان", "المدينة"], values, 6),
          requirements: importedLeadValueFromRow(row, ["requirements", "notes", "المتطلبات", "ملاحظات"], values, 7),
          source: "excel_import",
          stage: "interested",
        });
        if (createdLead?.id) {
          excelImportedLeadIdsRef.current.push(Number(createdLead.id));
        }
        imported += 1;
        setExcelImportProgress((current) => ({
          ...current,
          processed: current.processed + 1,
        }));
      }

      if (excelImportCancelRequestedRef.current) {
        await rollbackExcelImport();
        setExcelImportOpen(false);
        resetExcelImport();
        return;
      }

      setExcelImportStatus(imported ? copy.imported(imported) : copy.noRows);
      setExcelImportProgress((current) => ({
        processed: current.total,
        total: current.total,
      }));
      if (imported) {
        setExcelImportFile(null);
        if (excelFileInputRef.current) excelFileInputRef.current.value = "";
        onCreated?.();
      }
    } catch (error) {
      setExcelImportStatus(
        error instanceof Error && error.message === "UNSUPPORTED_FILE"
          ? copy.csvOnly
          : copy.importFailed,
      );
    } finally {
      setExcelImporting(false);
    }
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === copy.creating) return;
    if (
      !leadRequest.companyName.trim() ||
      !leadRequest.email.trim() ||
      !leadRequest.phone.trim()
    ) {
      setStatus(copy.required);
      return;
    }
    setStatus(copy.creating);
    try {
      await createBackend("leads", {
        name: leadRequest.fullName.trim(),
        company_name: leadRequest.companyName.trim(),
        email: leadRequest.email.trim() || null,
        phone: leadRequest.phone.trim(),
        source: "\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0639\u0645\u064a\u0644 \u0645\u0646 \u0642\u0628\u0644 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645",
        industry_id: leadRequest.industryId ? Number(leadRequest.industryId) : null,
        address: leadRequest.address.trim() || null,
        requirements: leadRequest.requirements.trim() || null,
        stage: "new",
      });
      setLeadRequest({
        companyName: "",
        industryId: "",
        address: "",
        fullName: "",
        email: "",
        phone: "",
        requirements: "",
      });
      setStatus(copy.created);
      onCreated?.();
    } catch {
      setStatus(copy.failed);
    }
  }

  return (
    <section
      className="dashboard-lead-request leads-hub-lead-request"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="dashboard-lead-request-inner">
        <div className="dashboard-lead-request-card">
          <h2>{copy.title}</h2>
          <form
            className="dashboard-lead-request-form"
            onSubmit={(event) => void submitLead(event)}
          >
            <div className="dashboard-lead-request-grid">
              <div className="dashboard-lead-request-stack">
                <div>
                  <label>{copy.company}</label>
                  <input
                    onChange={(event) =>
                      setLeadRequest((current) => ({
                        ...current,
                        companyName: event.target.value,
                      }))
                    }
                    placeholder={copy.companyPlaceholder}
                    required
                    type="text"
                    value={leadRequest.companyName}
                  />
                </div>
                <div className="lead-request-industry-field">
                  <label>{copy.industry}</label>
                  <DashboardSelect
                    ariaLabel={copy.industry}
                    onValueChange={(value) =>
                      setLeadRequest((current) => ({
                        ...current,
                        industryId: value,
                      }))
                    }
                    options={(industries ?? [])
                      .filter(
                        (industry) =>
                          String(industry.status ?? "active") === "active",
                      )
                      .map((industry) => ({
                        label: String(
                          (isArabic
                            ? industry.name
                            : industry.name_en ?? industry.name) ?? "—",
                        ),
                        value: String(industry.id),
                      }))}
                    placeholder={copy.industryPlaceholder}
                    value={leadRequest.industryId}
                  />
                </div>
                <div>
                  <label>{copy.address}</label>
                  <input
                    onChange={(event) =>
                      setLeadRequest((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    placeholder={copy.addressPlaceholder}
                    type="text"
                    value={leadRequest.address}
                  />
                </div>
              </div>
              <div className="dashboard-lead-request-stack">
                <div>
                  <label>{copy.name}</label>
                  <input
                    onChange={(event) =>
                      setLeadRequest((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    placeholder={copy.namePlaceholder}
                    required
                    type="text"
                    value={leadRequest.fullName}
                  />
                </div>
                <div>
                  <label>{copy.email}</label>
                  <input
                    dir="ltr"
                    onChange={(event) =>
                      setLeadRequest((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="name@company.com"
                    required
                    type="email"
                    value={leadRequest.email}
                  />
                </div>
                <div>
                  <label>{copy.phone}</label>
                  <input
                    dir="ltr"
                    onChange={(event) =>
                      setLeadRequest((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="+966 5X XXX XXXX"
                    required
                    type="tel"
                    value={leadRequest.phone}
                  />
                </div>
              </div>
            </div>
            <div>
              <label>{copy.requirements}</label>
              <textarea
                onChange={(event) =>
                  setLeadRequest((current) => ({
                    ...current,
                    requirements: event.target.value,
                  }))
                }
                placeholder={copy.requirementsPlaceholder}
                rows={3}
                value={leadRequest.requirements}
              />
            </div>
            <div className="lead-request-actions-row">
              <button aria-busy={status === copy.creating} disabled={status === copy.creating} type="submit">{copy.submit}</button>
              <button
                className="btn-excel-import"
                onClick={() => {
                  setExcelImportOpen(true);
                  setExcelImportStatus("");
                }}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M5 4h10l4 4v12H5z" />
                  <path d="M15 4v5h5" />
                  <path d="m8 11 5 5M13 11l-5 5" />
                </svg>
                {copy.importExcel}
              </button>
            </div>
            {status ? (
              <p className="dashboard-lead-request-status" role="status">
                {status}
              </p>
            ) : null}
          </form>
        </div>
      </div>
      {excelImportOpen ? (
        <div
          className="excel-import-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) void closeExcelImport();
          }}
          role="dialog"
          aria-modal="true"
          aria-label={copy.importTitle}
        >
          <div className="excel-import-modal" dir={isArabic ? "rtl" : "ltr"}>
            <div className="excel-import-modal-head">
              <h3>{copy.importTitle}</h3>
              <button
                aria-label={isArabic ? "إغلاق" : "Close"}
                disabled={excelImportCancelling}
                onClick={() => void closeExcelImport()}
                type="button"
              >
                ×
              </button>
            </div>
            <div className="download-template-box">
              <span>{copy.templatePrompt}</span>
              <a download="interested-customers-template.xlsx" href={leadTemplateHref}>
                {copy.templateDownload}
              </a>
            </div>
            <button
              className={`file-drop-area ${excelImportFile ? "has-file" : ""}`}
              onClick={() => excelFileInputRef.current?.click()}
              disabled={excelImporting || excelImportCancelling}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12 16V4" />
                <path d="m7 9 5-5 5 5" />
                <path d="M5 20h14" />
              </svg>
              <strong>{excelImportFile ? excelImportFile.name : copy.dropFile}</strong>
              <span>{copy.csvSupport}</span>
            </button>
            <input
              accept=".csv,.xlsx,.xls"
              hidden
              onChange={(event) => {
                setExcelImportFile(event.target.files?.[0] ?? null);
                setExcelImportStatus("");
                setExcelImportProgress({ processed: 0, total: 0 });
              }}
              ref={excelFileInputRef}
              type="file"
            />
            {excelImportFile ? (
              <div className="selected-file-info">
                <span>{excelImportFile.name}</span>
                <button
                  disabled={excelImporting || excelImportCancelling}
                  onClick={resetExcelImport}
                  type="button"
                >
                  {copy.removeFile}
                </button>
              </div>
            ) : null}
            {excelImportStatus ? (
              <p className="excel-import-status">{excelImportStatus}</p>
            ) : null}
            {excelImporting || excelImportProgress.total > 0 ? (
              <div className="import-progress-container">
                <div className="progress-info-header">
                  <span className="progress-status-text">
                    {excelImporting ? copy.processingRows : excelImportStatus}
                  </span>
                  <span className="progress-percentage">
                    {excelImportPercent}%
                  </span>
                </div>
                <div className="progress-bar-wrapper">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${excelImportPercent}%` }}
                  />
                </div>
                <div className="progress-details-footer">
                  <span>
                    {copy.processedRows(
                      excelImportProgress.processed,
                      excelImportProgress.total,
                    )}
                  </span>
                </div>
              </div>
            ) : null}
            <div className="excel-import-modal-actions">
              <button
                disabled={excelImportCancelling}
                onClick={() => void closeExcelImport()}
                type="button"
              >
                {copy.cancel}
              </button>
              <button
                className="btn-submit-excel"
                disabled={!excelImportFile || excelImporting || excelImportCancelling}
                onClick={() => void importExcelLeads()}
                type="button"
              >
                {excelImporting ? copy.importing : copy.startImport}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
