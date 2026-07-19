"use client";

import { useLocale, useTranslations } from "next-intl";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import DashboardSelect from "@/components/DashboardSelect";
import LeadRequestForm from "@/components/LeadRequestForm";
import { createBackend, updateBackend, useBackend } from "@/lib/client-backend";

type BackendRow = Record<string, unknown> & { id: number };
const NUMBER_LOCALE = "en-US";
const ARABIC_DATE_LOCALE = "ar-SA-u-ca-gregory-nu-latn";
const CUSTOMER_PAGE_SIZE = 10;
type CustomerDateFilter = "all" | "today" | "yesterday" | "week" | "month";
type CustomerOwnerFilter = "all" | "own" | "team";
type CustomerActionIconName = "edit" | "contacts" | "notes" | "tags";

function CustomerActionIcon({ name }: { name: CustomerActionIconName }) {
  if (name === "edit") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M4 20h4l11-11-4-4L4 16v4Z" />
        <path d="m13.5 6.5 4 4" />
      </svg>
    );
  }
  if (name === "contacts") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19v-1.5A4.5 4.5 0 0 1 8 13h2a4.5 4.5 0 0 1 4.5 4.5V19" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M16 14h1.5a3.5 3.5 0 0 1 3.5 3.5V19" />
      </svg>
    );
  }
  if (name === "notes") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M5 4h14v16H5z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 5h8l8 8-7 7-9-9V5Z" />
      <circle cx="9" cy="10" r="1.5" />
    </svg>
  );
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

function normalizeHexColor(value: unknown) {
  const color = String(value ?? "").trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : "#00b4d8";
}

function externalUrl(value: unknown) {
  const url = String(value ?? "").trim();
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function hexToRgb(hex: string) {
  const clean = normalizeHexColor(hex).slice(1);
  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  return `#${[r, g, b]
    .map((channel) =>
      Math.round(channel).toString(16).padStart(2, "0").slice(0, 2),
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

export function CustomersView() {
  const t = useTranslations();
  const isArabic = useLocale() === "ar";
  const leads = useBackend<BackendRow[]>("/api/v1/data/leads");
  const contacts = useBackend<BackendRow[]>("/api/v1/data/lead-contacts");
  const leadNotes = useBackend<BackendRow[]>("/api/v1/data/lead-notes");
  const leadTagTypes = useBackend<BackendRow[]>("/api/v1/data/lead-tag-types");
  const leadTags = useBackend<BackendRow[]>("/api/v1/data/lead-tags");
  const leadTagAssignments = useBackend<BackendRow[]>(
    "/api/v1/data/lead-tag-assignments",
  );
  const { data: currentUser } = useBackend<{
    userid: number;
    role: string;
    permissions?: Record<string, { data_scope?: string }>;
  }>("/api/v1/auth/me");
  const data = leads.data;
  const { data: industries } = useBackend<BackendRow[]>(
    "/api/v1/data/industries",
  );
  const [editingLead, setEditingLead] = useState<BackendRow | null>(null);
  const [customerView, setCustomerView] = useState<"table" | "kanban">("table");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerDateFilter, setCustomerDateFilter] =
    useState<CustomerDateFilter>("all");
  const [customerTagTypeFilter, setCustomerTagTypeFilter] = useState("all");
  const [customerTagFilter, setCustomerTagFilter] = useState("all");
  const [customerOwnerFilter, setCustomerOwnerFilter] =
    useState<CustomerOwnerFilter>("all");
  const [customerTeamUserFilter, setCustomerTeamUserFilter] = useState("all");
  const [customerPage, setCustomerPage] = useState(1);
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [kanbanStatus, setKanbanStatus] = useState("");
  const [leadEditDraft, setLeadEditDraft] = useState({
    company_name: "",
    name: "",
    industry_id: "",
    email: "",
    address: "",
    phone: "",
    stage: "new",
  });
  const [leadEditStatus, setLeadEditStatus] = useState("");
  const [contactsLead, setContactsLead] = useState<BackendRow | null>(null);
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [contactDeleteTarget, setContactDeleteTarget] = useState<BackendRow | null>(null);
  const [contactDraft, setContactDraft] = useState({
    name: "",
    phone: "",
    email: "",
    job_title: "",
  });
  const [contactStatus, setContactStatus] = useState("");
  const [notesLead, setNotesLead] = useState<BackendRow | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteStatus, setNoteStatus] = useState("");
  const [tagsLead, setTagsLead] = useState<BackendRow | null>(null);
  const [tagDraft, setTagDraft] = useState({
    tag_type_id: "",
    type_name: "",
    type_color: "#00b4d8",
    tag_id: "",
    tag_name: "",
    tag_color: "#00b4d8",
  });
  const [tagStatus, setTagStatus] = useState("");
  const [tagTypeModalOpen, setTagTypeModalOpen] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagModalStatus, setTagModalStatus] = useState("");
  const stageLabels: Record<string, { ar: string; en: string }> = {
    new: { ar: "\u062c\u062f\u064a\u062f", en: "New" },
    interested: { ar: "\u0645\u0647\u062a\u0645", en: "Interested" },
    proposal: {
      ar: "\u0639\u0631\u0636 \u0645\u0642\u062f\u0645",
      en: "Proposal",
    },
    won: { ar: "\u0645\u0643\u062a\u0633\u0628", en: "Won" },
    lost: { ar: "\u0645\u0641\u0642\u0648\u062f", en: "Lost" },
  };
  const stageOrder = ["new", "interested", "proposal", "won", "lost"];
  const getCustomerName = (row: BackendRow | null) =>
    String(row?.name ?? "").trim();
  const getCustomerTitle = (row: BackendRow | null) =>
    String(row?.company_name ?? "").trim() ||
    String(row?.name ?? "").trim() ||
    "—";
  const displayValue = (value: unknown) => String(value ?? "").trim() || "—";
  function renderCustomerProfile(customer: BackendRow) {
    const customerIndustry = industries?.find(
      (industry) => Number(industry.id) === Number(customer.industry_id),
    );
    const customerIndustryName = String(
      customerIndustry?.[isArabic ? "name" : "name_en"] ??
        customerIndustry?.name ??
        "",
    ).trim();
    const customerStage = String(customer.stage ?? "new");

    return (
      <section
        aria-label={isArabic ? "بيانات العميل" : "Customer Details"}
        className="tag-customer-profile"
      >
        <div className="tag-customer-profile-head">
          <div>
            <span>{isArabic ? "بيانات العميل" : "Customer Details"}</span>
            <h4>{getCustomerTitle(customer)}</h4>
          </div>
          <span className={`badge ${customerStage}`}>
            {stageLabels[customerStage]?.[isArabic ? "ar" : "en"] ??
              customerStage}
          </span>
        </div>
        <dl className="tag-customer-profile-grid">
          <div>
            <dt>{isArabic ? "اسم المنشأة" : "Company Name"}</dt>
            <dd>{displayValue(customer.company_name)}</dd>
          </div>
          <div>
            <dt>{isArabic ? "الاسم الكامل" : "Full Name"}</dt>
            <dd>{getCustomerName(customer)}</dd>
          </div>
          <div>
            <dt>{isArabic ? "نوع النشاط" : "Business Type"}</dt>
            <dd>{customerIndustryName || "—"}</dd>
          </div>
          <div>
            <dt>{isArabic ? "رقم الجوال" : "Mobile Number"}</dt>
            <dd dir="ltr">{displayValue(customer.phone)}</dd>
          </div>
          <div>
            <dt>{isArabic ? "البريد الإلكتروني" : "Email"}</dt>
            <dd dir="ltr">{displayValue(customer.email)}</dd>
          </div>
          <div>
            <dt>{isArabic ? "العنوان" : "Address"}</dt>
            <dd>{displayValue(customer.address)}</dd>
          </div>
          <div className="tag-customer-profile-wide">
            <dt>{isArabic ? "المتطلبات الإضافية" : "Additional Requirements"}</dt>
            <dd>
              {String(customer.requirements ?? "").trim() ||
                (isArabic ? "لا توجد متطلبات" : "No requirements")}
            </dd>
          </div>
          <div>
            <dt>{isArabic ? "المصدر" : "Source"}</dt>
            <dd>
              {String(customer.source ?? "").trim() ||
                (isArabic ? "لا يوجد مصدر" : "No source")}
            </dd>
          </div>
        </dl>
      </section>
    );
  }
  const customerDateFilterOptions = [
    { value: "all", label: isArabic ? "جميع العملاء" : "All Customers" },
    { value: "today", label: isArabic ? "المضافين اليوم" : "Added Today" },
    { value: "yesterday", label: isArabic ? "المضافين أمس" : "Added Yesterday" },
    { value: "week", label: isArabic ? "هذا الأسبوع" : "This Week" },
    { value: "month", label: isArabic ? "هذا الشهر" : "This Month" },
  ];
  const customerTagTypeFilterOptions = useMemo(
    () => [
      {
        value: "all",
        label: isArabic ? "جميع أنواع الوسوم" : "All Tag Types",
      },
      ...(leadTagTypes.data ?? []).map((type) => ({
        value: String(type.id),
        label: String(type.type_name ?? type.id),
      })),
    ],
    [isArabic, leadTagTypes.data],
  );
  const customerTagFilterOptions = useMemo(
    () => [
      { value: "all", label: isArabic ? "جميع الوسوم" : "All Tags" },
      ...(leadTags.data ?? [])
        .filter(
          (tag) =>
            customerTagTypeFilter === "all" ||
            Number(tag.tag_type_id) === Number(customerTagTypeFilter),
        )
        .map((tag) => ({
          value: String(tag.id),
          label: String(tag.tag_name ?? tag.id),
        })),
    ],
    [customerTagTypeFilter, isArabic, leadTags.data],
  );
  const currentUserId = Number(currentUser?.userid ?? 0);
  const currentUserRole = String(currentUser?.role ?? "").toLocaleLowerCase();
  const canSeeTeamCustomers =
    currentUserRole === "leader" ||
    currentUser?.permissions?.["table.leads"]?.data_scope === "team" ||
    (currentUserId > 0 &&
      (data ?? []).some(
        (row) => Number(row.affiliate_user_id ?? currentUserId) !== currentUserId,
      ));
  const customerOwnerFilterOptions = [
    { value: "all", label: isArabic ? "كل العملاء" : "All Customers" },
    { value: "own", label: isArabic ? "عملائي" : "My Customers" },
    { value: "team", label: isArabic ? "عملاء الفريق" : "Team Customers" },
  ];
  const customerTeamUserFilterOptions = useMemo(
    () => [
      { value: "all", label: isArabic ? "كل المستخدمين" : "All Users" },
      ...Array.from(
        (data ?? [])
          .filter(
            (row) =>
              currentUserId > 0 &&
              Number(row.affiliate_user_id ?? currentUserId) !== currentUserId,
          )
          .reduce((options, row) => {
            const userId = Number(row.affiliate_user_id);
            if (!Number.isFinite(userId) || userId <= 0) return options;
            const fallbackLabel = isArabic
              ? `مستخدم ${userId.toLocaleString(NUMBER_LOCALE)}`
              : `User ${userId.toLocaleString(NUMBER_LOCALE)}`;
            options.set(String(userId), {
              value: String(userId),
              label: String(row.affiliate_user_name ?? "").trim() || fallbackLabel,
            });
            return options;
          }, new Map<string, { value: string; label: string }>())
          .values(),
      ),
    ],
    [currentUserId, data, isArabic],
  );

  function matchesCustomerDateFilter(value: unknown) {
    if (customerDateFilter === "all") return true;
    const createdAt = parseDatabaseDate(value);
    if (!createdAt) return false;

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (customerDateFilter === "today") {
      return createdAt >= startOfToday && createdAt < startOfTomorrow;
    }
    if (customerDateFilter === "yesterday") {
      return createdAt >= startOfYesterday && createdAt < startOfToday;
    }
    if (customerDateFilter === "week") {
      return createdAt >= startOfWeek && createdAt < startOfTomorrow;
    }
    if (customerDateFilter === "month") {
      return createdAt >= startOfMonth && createdAt < startOfTomorrow;
    }
    return true;
  }

  const normalizedSearch = customerSearch.trim().toLocaleLowerCase();
  const leadTagsById = useMemo(
    () =>
      new Map(
        (leadTags.data ?? []).map((tag) => [Number(tag.id), tag] as const),
      ),
    [leadTags.data],
  );
  const leadTagAssignmentsByLeadId = useMemo(
    () =>
      (leadTagAssignments.data ?? []).reduce((groups, assignment) => {
        const leadId = Number(assignment.lead_id);
        if (!Number.isFinite(leadId) || leadId <= 0) return groups;
        const key = String(leadId);
        const current = groups.get(key) ?? [];
        current.push(assignment);
        groups.set(key, current);
        return groups;
      }, new Map<string, BackendRow[]>()),
    [leadTagAssignments.data],
  );
  const filteredCustomers = useMemo(
    () =>
      (data ?? []).filter((row) => {
        const ownerId = Number(row.affiliate_user_id ?? currentUserId);
        if (
          canSeeTeamCustomers &&
          currentUserId > 0 &&
          customerOwnerFilter === "own" &&
          ownerId !== currentUserId
        ) {
          return false;
        }
        if (
          canSeeTeamCustomers &&
          currentUserId > 0 &&
          customerOwnerFilter === "team" &&
          ownerId === currentUserId
        ) {
          return false;
        }
        if (
          canSeeTeamCustomers &&
          currentUserId > 0 &&
          customerOwnerFilter === "team" &&
          customerTeamUserFilter !== "all" &&
          ownerId !== Number(customerTeamUserFilter)
        ) {
          return false;
        }
        if (!matchesCustomerDateFilter(row.created_at)) return false;
        const rowTagIds = (leadTagAssignmentsByLeadId.get(String(row.id)) ?? [])
          .map((assignment) => Number(assignment.tag_id));
        if (
          customerTagFilter !== "all" &&
          !rowTagIds.includes(Number(customerTagFilter))
        ) {
          return false;
        }
        if (customerTagFilter === "all" && customerTagTypeFilter !== "all") {
          const hasTagFromSelectedType = rowTagIds.some((tagId) => {
            const tag = leadTagsById.get(tagId);
            return Number(tag?.tag_type_id) === Number(customerTagTypeFilter);
          });
          if (!hasTagFromSelectedType) return false;
        }
        if (!normalizedSearch) return true;
        const industryName = industries?.find(
          (industry) => Number(industry.id) === Number(row.industry_id),
        )?.name;
        return [
          row.name,
          row.company_name,
          row.phone,
          row.email,
          industryName,
          row.address,
          row.requirements,
          row.source,
          row.stage,
        ].some((value) =>
          String(value ?? "")
            .toLocaleLowerCase()
            .includes(normalizedSearch),
        );
      }),
    [
      canSeeTeamCustomers,
      currentUserId,
      customerDateFilter,
      customerOwnerFilter,
      customerTagFilter,
      customerTagTypeFilter,
      customerTeamUserFilter,
      data,
      industries,
      leadTagAssignmentsByLeadId,
      leadTagsById,
      normalizedSearch,
    ],
  );
  const customerTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredCustomers.length / CUSTOMER_PAGE_SIZE)),
    [filteredCustomers.length],
  );
  const activeCustomerPage = useMemo(
    () => Math.min(customerPage, customerTotalPages),
    [customerPage, customerTotalPages],
  );
  const paginatedCustomers = useMemo(
    () =>
      filteredCustomers.slice(
        (activeCustomerPage - 1) * CUSTOMER_PAGE_SIZE,
        activeCustomerPage * CUSTOMER_PAGE_SIZE,
      ),
    [activeCustomerPage, filteredCustomers],
  );
  const firstCustomerIndex = useMemo(
    () =>
      filteredCustomers.length === 0
        ? 0
        : (activeCustomerPage - 1) * CUSTOMER_PAGE_SIZE + 1,
    [activeCustomerPage, filteredCustomers.length],
  );
  const lastCustomerIndex = useMemo(
    () => Math.min(activeCustomerPage * CUSTOMER_PAGE_SIZE, filteredCustomers.length),
    [activeCustomerPage, filteredCustomers.length],
  );
  const firstPaginationButton = useMemo(
    () =>
      Math.min(
        Math.max(1, activeCustomerPage - 2),
        Math.max(1, customerTotalPages - 4),
      ),
    [activeCustomerPage, customerTotalPages],
  );
  const customerPageNumbers = useMemo(
    () =>
      Array.from(
        { length: Math.min(5, customerTotalPages) },
        (_, index) => firstPaginationButton + index,
      ),
    [customerTotalPages, firstPaginationButton],
  );
  const customersByStage = useMemo(
    () =>
      filteredCustomers.reduce((groups, row) => {
        const stage = String(row.stage ?? "new");
        const current = groups.get(stage) ?? [];
        current.push(row);
        groups.set(stage, current);
        return groups;
      }, new Map<string, BackendRow[]>()),
    [filteredCustomers],
  );
  const customerNotes = useMemo(
    () =>
      notesLead
        ? (leadNotes.data ?? [])
            .filter((note) => Number(note.lead_id) === Number(notesLead.id))
            .sort(
              (first, second) =>
                new Date(String(second.created_at ?? "")).getTime() -
                new Date(String(first.created_at ?? "")).getTime(),
            )
        : [],
    [leadNotes.data, notesLead],
  );
  const leadContacts = useMemo(
    () =>
      contactsLead
        ? (contacts.data ?? []).filter(
            (contact) => Number(contact.lead_id) === Number(contactsLead.id),
          )
        : [],
    [contacts.data, contactsLead],
  );

  useEffect(() => {
    setCustomerPage(1);
  }, [
    customerSearch,
    customerDateFilter,
    customerTagTypeFilter,
    customerTagFilter,
    customerOwnerFilter,
    customerTeamUserFilter,
    customerView,
  ]);

  useEffect(() => {
    if (customerOwnerFilter !== "team" && customerTeamUserFilter !== "all") {
      setCustomerTeamUserFilter("all");
    }
  }, [customerOwnerFilter, customerTeamUserFilter]);

  useEffect(() => {
    if (customerPage > customerTotalPages) setCustomerPage(customerTotalPages);
  }, [customerPage, customerTotalPages]);

  function openLeadEditor(row: BackendRow) {
    setEditingLead(row);
    setLeadEditDraft({
      company_name: String(row.company_name ?? ""),
      name: String(row.name ?? ""),
      industry_id: row.industry_id == null ? "" : String(row.industry_id),
      email: String(row.email ?? ""),
      address: String(row.address ?? ""),
      phone: String(row.phone ?? ""),
      stage: String(row.stage ?? "new"),
    });
    setLeadEditStatus("");
  }

  async function saveLeadEdit() {
    if (!editingLead) return;
    setLeadEditStatus(
      isArabic
        ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638..."
        : "Saving...",
    );
    try {
      const response = await fetch(`/api/v1/data/leads/${editingLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(leadEditDraft),
      });
      if (!response.ok) throw new Error("SAVE_FAILED");
      await leads.reload();
      setEditingLead(null);
    } catch {
      setLeadEditStatus(
        isArabic
          ? "\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u0627\u0644\u062a\u0639\u062f\u064a\u0644\u0627\u062a"
          : "Unable to save changes",
      );
    }
  }

  async function deleteLead() {
    if (!editingLead) return;
    const confirmed = window.confirm(
      isArabic
        ? "هل تريد حذف هذا العميل؟"
        : "Do you want to delete this customer?",
    );
    if (!confirmed) return;
    setLeadEditStatus(
      isArabic
        ? "\u062c\u0627\u0631\u064a \u062d\u0630\u0641 \u0627\u0644\u0639\u0645\u064a\u0644..."
        : "Deleting customer...",
    );
    try {
      const response = await fetch(`/api/v1/data/leads/${editingLead.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("DELETE_FAILED");
      await Promise.all([
        leads.reload(),
        contacts.reload(),
        leadNotes.reload(),
        leadTagAssignments.reload(),
      ]);
      setEditingLead(null);
    } catch {
      setLeadEditStatus(
        isArabic
          ? "\u062a\u0639\u0630\u0631 \u062d\u0630\u0641 \u0627\u0644\u0639\u0645\u064a\u0644"
          : "Unable to delete customer",
      );
    }
  }

  async function moveLeadToStage(leadId: number, stage: string) {
    const lead = (data ?? []).find((row) => row.id === leadId);
    setKanbanStatus("");
    setDraggedLeadId(null);
    setDragOverStage(null);
    if (!lead || String(lead.stage ?? "new") === stage) return;
    try {
      const response = await fetch(`/api/v1/data/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ stage }),
      });
      if (!response.ok) throw new Error("MOVE_FAILED");
      await leads.reload();
    } catch {
      setKanbanStatus(
        isArabic
          ? "\u062a\u0639\u0630\u0631 \u0646\u0642\u0644 \u0627\u0644\u0639\u0645\u064a\u0644"
          : "Unable to move customer",
      );
    }
  }

  function openLeadContacts(row: BackendRow) {
    setContactsLead(row);
    setEditingContactId(null);
    setContactDeleteTarget(null);
    setContactDraft({ name: "", phone: "", email: "", job_title: "" });
    setContactStatus("");
  }

  function openContactEditor(contact: BackendRow) {
    setEditingContactId(Number(contact.id));
    setContactDraft({
      name: String(contact.name ?? ""),
      phone: String(contact.phone ?? ""),
      email: String(contact.email ?? ""),
      job_title: String(contact.job_title ?? ""),
    });
    setContactStatus("");
  }

  function cancelContactEdit() {
    setEditingContactId(null);
    setContactDraft({ name: "", phone: "", email: "", job_title: "" });
    setContactStatus("");
  }

  async function saveLeadContact() {
    if (!contactsLead) return;
    if (!contactDraft.name.trim()) {
      setContactStatus(
        isArabic ? "\u0627\u0633\u0645 \u062c\u0647\u0629 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0645\u0637\u0644\u0648\u0628" : "Contact name is required",
      );
      return;
    }
    setContactStatus(isArabic ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638..." : "Saving...");
    try {
      const payload = {
        lead_id: contactsLead.id,
        name: contactDraft.name.trim(),
        phone: contactDraft.phone.trim() || null,
        email: contactDraft.email.trim() || null,
        job_title: contactDraft.job_title.trim() || null,
      };
      if (editingContactId) {
        const response = await fetch(`/api/v1/data/lead-contacts/${editingContactId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("UPDATE_FAILED");
      } else {
        await createBackend("lead-contacts", payload);
      }
      setEditingContactId(null);
      setContactDraft({ name: "", phone: "", email: "", job_title: "" });
      await contacts.reload();
      setContactStatus(
        editingContactId
          ? isArabic
            ? "تم تعديل جهة الاتصال"
            : "Contact has been updated"
          : isArabic
            ? "\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u062c\u0647\u0629 \u0627\u0644\u0627\u062a\u0635\u0627\u0644"
            : "Contact has been added",
      );
    } catch {
      setContactStatus(
        editingContactId
          ? isArabic
            ? "تعذر تعديل جهة الاتصال"
            : "Unable to update contact"
          : isArabic
            ? "\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u062c\u0647\u0629 \u0627\u0644\u0627\u062a\u0635\u0627\u0644"
            : "Unable to save contact",
      );
    }
  }

  async function deleteLeadContact(contact: BackendRow) {
    if (!contactsLead) return;
    const contactId = Number(contact.id);
    setContactStatus(isArabic ? "جاري حذف جهة الاتصال..." : "Deleting contact...");
    try {
      const response = await fetch(`/api/v1/data/lead-contacts/${contactId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("DELETE_FAILED");
      await contacts.reload();
      if (editingContactId === contactId) {
        setEditingContactId(null);
        setContactDraft({ name: "", phone: "", email: "", job_title: "" });
      }
      setContactStatus(
        isArabic ? "تم حذف جهة الاتصال" : "Contact has been deleted",
      );
      setContactDeleteTarget(null);
    } catch {
      setContactStatus(
        isArabic ? "تعذر حذف جهة الاتصال" : "Unable to delete contact",
      );
    }
  }

  function openLeadNotes(row: BackendRow) {
    setNotesLead(row);
    setNoteDraft("");
    setNoteStatus("");
  }

  async function saveLeadNote() {
    if (!notesLead) return;
    if (!noteDraft.trim()) {
      setNoteStatus(isArabic ? "\u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0629 \u0645\u0637\u0644\u0648\u0628\u0629" : "Note is required");
      return;
    }
    setNoteStatus(isArabic ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638..." : "Saving...");
    try {
      await createBackend("lead-notes", {
        lead_id: notesLead.id,
        note: noteDraft.trim(),
      });
      setNoteDraft("");
      await leadNotes.reload();
      setNoteStatus(isArabic ? "\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0629" : "Note has been added");
    } catch {
      setNoteStatus(isArabic ? "\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0629" : "Unable to save note");
    }
  }

  function openLeadTags(row: BackendRow) {
    setTagsLead(row);
    setTagDraft({
      tag_type_id: "",
      type_name: "",
      type_color: "#00b4d8",
      tag_id: "",
      tag_name: "",
      tag_color: "#00b4d8",
    });
    setTagStatus("");
    setTagTypeModalOpen(false);
    setTagModalOpen(false);
    setTagModalStatus("");
  }

  async function createNewTagType() {
    const typeName = tagDraft.type_name.trim();
    if (!typeName) {
      setTagModalStatus(
        isArabic ? "اسم نوع الوسم مطلوب" : "Tag type name is required",
      );
      return;
    }
    setTagModalStatus(isArabic ? "جاري الحفظ..." : "Saving...");
    try {
      const existingType = (leadTagTypes.data ?? []).find(
        (item) =>
          String(item.type_name ?? "").trim().toLocaleLowerCase() ===
          typeName.toLocaleLowerCase(),
      );
      const createdType =
        existingType ??
        (await createBackend<BackendRow>("lead-tag-types", {
          type_name: typeName,
          type_color: tagDraft.type_color,
        }));
      await leadTagTypes.reload();
      setTagDraft((current) => ({
        ...current,
        tag_type_id: String(createdType.id),
        type_name: "",
        tag_id: "",
        tag_name: "",
      }));
      setTagTypeModalOpen(false);
      setTagModalStatus("");
    } catch {
      setTagModalStatus(
        isArabic ? "تعذر إنشاء نوع الوسم" : "Unable to create tag type",
      );
    }
  }

  async function rebalanceTagTypeGradient(
    typeId: number,
    createdTag: BackendRow,
    fallbackTypeColor?: string,
  ) {
    const tagType = (leadTagTypes.data ?? []).find(
      (item) => Number(item.id) === typeId,
    );
    const baseColor = normalizeHexColor(tagType?.type_color ?? fallbackTypeColor);
    const gradientEnd = "#11293d";
    const tagsById = new Map<number, BackendRow>();
    (leadTags.data ?? [])
      .filter((item) => Number(item.tag_type_id) === typeId)
      .forEach((item) => tagsById.set(Number(item.id), item));
    tagsById.set(Number(createdTag.id), {
      ...createdTag,
      tag_type_id: typeId,
    });
    const tags = Array.from(tagsById.values()).sort(
      (first, second) => Number(first.id) - Number(second.id),
    );
    await Promise.all(
      tags.map((tag, index) => {
        const ratio = tags.length === 1 ? 0 : index / (tags.length - 1);
        return updateBackend("lead-tags", tag.id, {
          tag_color: mixHex(baseColor, gradientEnd, ratio),
        });
      }),
    );
  }

  async function createNewTag() {
    const tagName = tagDraft.tag_name.trim();
    const typeId = Number(tagDraft.tag_type_id);
    if (!Number.isInteger(typeId) || typeId <= 0) {
      setTagModalStatus(
        isArabic ? "اختر نوع الوسم أولًا" : "Select a tag type first",
      );
      return;
    }
    if (!tagName) {
      setTagModalStatus(isArabic ? "اسم الوسم مطلوب" : "Tag name is required");
      return;
    }
    setTagModalStatus(isArabic ? "جاري الحفظ..." : "Saving...");
    try {
      const existingTag = (leadTags.data ?? []).find(
        (item) =>
          Number(item.tag_type_id) === typeId &&
          String(item.tag_name ?? "").trim().toLocaleLowerCase() ===
            tagName.toLocaleLowerCase(),
      );
      const isNewTag = !existingTag;
      const createdTag =
        existingTag ??
        (await createBackend<BackendRow>("lead-tags", {
          tag_type_id: typeId,
          tag_name: tagName,
          tag_color: tagDraft.tag_color,
        }));
      if (isNewTag) {
        await rebalanceTagTypeGradient(typeId, createdTag);
      }
      await leadTags.reload();
      setTagDraft((current) => ({
        ...current,
        tag_id: String(createdTag.id),
        tag_name: "",
      }));
      setTagModalOpen(false);
      setTagModalStatus("");
    } catch {
      setTagModalStatus(isArabic ? "تعذر إنشاء الوسم" : "Unable to create tag");
    }
  }

  async function saveLeadTag() {
    if (!tagsLead) return;
    const isCreatingTag = tagDraft.tag_id === "__new__";
    if (
      !tagDraft.tag_id ||
      (isCreatingTag && !tagDraft.tag_name.trim())
    ) {
      setTagStatus(
        isArabic ? "اختر وسمًا موجودًا أو اكتب وسمًا جديدًا" : "Select an existing tag or write a new tag",
      );
      return;
    }
    const isCreatingTagType = tagDraft.tag_type_id === "__new__";
    if (
      !tagDraft.tag_id &&
      (!tagDraft.tag_type_id ||
        (isCreatingTagType && !tagDraft.type_name.trim()))
    ) {
      setTagStatus(
        isArabic
          ? "اختر نوع الوسم أو اكتب نوعًا جديدًا"
          : "Select a tag type or write a new type",
      );
      return;
    }
    setTagStatus(isArabic ? "جاري الحفظ..." : "Saving...");
    try {
      const normalizedTagName = tagDraft.tag_name.trim();
      const normalizedTypeName = tagDraft.type_name.trim();
      let tagTypeId =
        tagDraft.tag_type_id && !isCreatingTagType
          ? Number(tagDraft.tag_type_id)
          : null;
      if (!tagTypeId && normalizedTypeName) {
        const existingType = (leadTagTypes.data ?? []).find(
          (item) =>
            String(item.type_name ?? "").trim().toLocaleLowerCase() ===
            normalizedTypeName.toLocaleLowerCase(),
        );
        const tagType =
          existingType ??
          (await createBackend<BackendRow>("lead-tag-types", {
            type_name: normalizedTypeName,
            type_color: tagDraft.type_color,
          }));
        tagTypeId = Number(tagType.id);
      }
      let tag = isCreatingTag
        ? undefined
        : (leadTags.data ?? []).find(
            (item) => Number(item.id) === Number(tagDraft.tag_id),
          );
      const existingAssignments = (leadTagAssignments.data ?? []).filter(
        (assignment) => Number(assignment.lead_id) === Number(tagsLead.id),
      );
      const assignedTypeIds = new Set(
        existingAssignments
          .map((assignment) => {
            const assignedTag = (leadTags.data ?? []).find(
              (item) => Number(item.id) === Number(assignment.tag_id),
            );
            return Number(assignedTag?.tag_type_id);
          })
          .filter((typeId) => Number.isInteger(typeId) && typeId > 0),
      );
      const resolvedTypeId = tag ? Number(tag.tag_type_id) : Number(tagTypeId);
      if (assignedTypeIds.has(resolvedTypeId)) {
        setTagStatus(
          isArabic
            ? "لا يمكن إضافة أكثر من وسم واحد من نفس النوع لهذا العميل"
            : "This customer already has a tag from this type",
        );
        return;
      }
      if (!tag) {
        const existingTag = (leadTags.data ?? []).find(
          (item) =>
            String(item.tag_name ?? "").trim().toLocaleLowerCase() ===
              normalizedTagName.toLocaleLowerCase() &&
            Number(item.tag_type_id) === Number(tagTypeId),
        );
        const isNewTag = !existingTag;
        tag =
          existingTag ??
          (await createBackend<BackendRow>("lead-tags", {
            ...(tagTypeId ? { tag_type_id: tagTypeId } : {}),
            tag_name: normalizedTagName,
            tag_color: tagDraft.tag_color,
          }));
        if (isNewTag && tagTypeId) {
          await rebalanceTagTypeGradient(Number(tagTypeId), tag, tagDraft.type_color);
        }
      }
      await createBackend("lead-tag-assignments", {
        lead_id: tagsLead.id,
        tag_id: tag.id,
      });
      setTagDraft({
        tag_type_id: "",
        type_name: "",
        type_color: "#00b4d8",
        tag_id: "",
        tag_name: "",
        tag_color: "#00b4d8",
      });
      await leadTagTypes.reload();
      await leadTags.reload();
      await leadTagAssignments.reload();
      setTagStatus(isArabic ? "تم ربط الوسم بالعميل" : "Tag linked to customer");
    } catch {
      setTagStatus(isArabic ? "تعذر ربط الوسم" : "Unable to link tag");
    }
  }

  async function deleteLeadTagAssignment(assignmentId: number) {
    if (!tagsLead) return;
    setTagStatus(isArabic ? "جاري فك الربط..." : "Unlinking...");
    try {
      const response = await fetch(`/api/v1/data/lead-tag-assignments/${assignmentId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("DELETE_FAILED");
      await leadTagAssignments.reload();
      setTagStatus(isArabic ? "تم فك ربط الوسم" : "Tag has been unlinked");
    } catch {
      setTagStatus(isArabic ? "تعذر فك ربط الوسم" : "Unable to unlink tag");
    }
  }

  if (tagsLead) {
    const customerAssignments =
      leadTagAssignmentsByLeadId.get(String(tagsLead.id)) ?? [];
    const assignedTagIds = new Set(
      customerAssignments.map((assignment) => Number(assignment.tag_id)),
    );
    const assignedTagTypeIds = new Set(
      customerAssignments
        .map((assignment) => {
          const tag = leadTagsById.get(Number(assignment.tag_id));
          return Number(tag?.tag_type_id);
        })
        .filter((typeId) => Number.isInteger(typeId) && typeId > 0),
    );
    const availableTagTypes = leadTagTypes.data ?? [];
    const selectedTagTypeId =
      tagDraft.tag_type_id ? Number(tagDraft.tag_type_id) : null;
    const availableTags = (leadTags.data ?? []).filter((tag) => {
      if (!selectedTagTypeId) return false;
      if (assignedTagIds.has(Number(tag.id))) return false;
      if (assignedTagTypeIds.has(Number(tag.tag_type_id))) return false;
      return Number(tag.tag_type_id) === selectedTagTypeId;
    });
    const tagOptions = selectedTagTypeId
      ? [
          ...availableTags.map((tag) => ({
            value: String(tag.id),
            label: String(tag.tag_name ?? tag.id),
          })),
          {
            value: "__new__",
            label: isArabic ? "+ إضافة وسم جديد" : "+ Add New Tag",
          },
        ]
      : [
          {
            value: "__select_type_first__",
            label: isArabic ? "اختر نوع الوسم أولًا" : "Select a tag type first",
            disabled: true,
          },
        ];

    return (
      <article className="table-card expanded-table-card lead-tags-screen">
        <div className="customer-edit-modal-head">
          <div>
            <span>{isArabic ? "وسوم العميل" : "Customer Tags"}</span>
            <h3>{getCustomerTitle(tagsLead)}</h3>
          </div>
          <button
            aria-label={isArabic ? "الرجوع" : "Back"}
            onClick={() => setTagsLead(null)}
            type="button"
          >
            {isArabic ? "رجوع" : "Back"}
          </button>
        </div>

        {renderCustomerProfile(tagsLead)}

        <div className="lead-contacts-form lead-tags-form">
          <label>
            <span>
              {isArabic
                ? "اختيار أو إضافة نوع وسم جديد"
                : "Select or Add a New Tag Type"}
            </span>
            <DashboardSelect
              ariaLabel={
                isArabic
                  ? "اختيار أو إضافة نوع وسم جديد"
                  : "Select or add a new tag type"
              }
              onValueChange={(value) => {
                if (value === "__new__") {
                  setTagDraft((current) => ({
                    ...current,
                    type_name: "",
                    type_color: "#00b4d8",
                  }));
                  setTagModalStatus("");
                  setTagTypeModalOpen(true);
                  return;
                }
                setTagDraft((current) => ({
                  ...current,
                  tag_type_id: value,
                  type_name: "",
                  tag_id: "",
                }));
              }}
              options={[
                ...availableTagTypes.map((type) => ({
                  value: String(type.id),
                  label: String(type.type_name ?? type.id),
                  disabled: assignedTagTypeIds.has(Number(type.id)),
                })),
                {
                  value: "__new__",
                  label: isArabic
                    ? "+ إضافة نوع وسم جديد"
                    : "+ Add New Tag Type",
                },
              ]}
              placeholder={
                isArabic
                  ? "اختر نوع الوسم أو أضف نوعًا جديدًا"
                  : "Select a tag type or add a new one"
              }
              searchable
              searchPlaceholder={
                isArabic ? "ابحث عن نوع الوسم..." : "Search tag types..."
              }
              value={tagDraft.tag_type_id}
            />
          </label>
          <label>
            <span>
              {isArabic
                ? "اختيار أو إضافة وسم جديد"
                : "Select or Add a New Tag"}
            </span>
            <DashboardSelect
              ariaLabel={
                isArabic
                  ? "اختيار أو إضافة وسم جديد"
                  : "Select or add a new tag"
              }
              onValueChange={(value) => {
                if (value === "__new__") {
                  if (!selectedTagTypeId) {
                    setTagStatus(
                      isArabic
                        ? "اختر نوع الوسم أولًا"
                        : "Select a tag type first",
                    );
                    return;
                  }
                  setTagDraft((current) => ({
                    ...current,
                    tag_name: "",
                    tag_color: "#00b4d8",
                  }));
                  setTagModalStatus("");
                  setTagModalOpen(true);
                  return;
                }
                setTagDraft((current) => ({
                  ...current,
                  tag_id: value,
                  tag_name: "",
                }));
              }}
              options={tagOptions}
              placeholder={
                selectedTagTypeId
                  ? isArabic
                    ? "اختر وسمًا أو أضف وسمًا جديدًا"
                    : "Select a tag or add a new one"
                  : isArabic
                    ? "اختر نوع الوسم أولًا"
                    : "Select a tag type first"
              }
              searchable
              searchPlaceholder={isArabic ? "ابحث عن وسم..." : "Search tags..."}
              value={tagDraft.tag_id}
            />
          </label>
        </div>

        <div className="lead-contacts-actions">
          <button className="primary" onClick={() => void saveLeadTag()} type="button">
            {isArabic ? "إضافة وسم" : "Add Tag"}
          </button>
          {tagStatus ? <p role="status">{tagStatus}</p> : null}
        </div>

        <div className="responsive-table lead-contacts-table lead-tags-table">
          <table>
            <thead>
              <tr>
                <th>{isArabic ? "نوع الوسم" : "Tag Type"}</th>
                <th>{isArabic ? "الوسم" : "Tag"}</th>
                <th>{isArabic ? "اللون" : "Color"}</th>
                <th>{isArabic ? "تاريخ الإنشاء" : "Created At"}</th>
                <th>{isArabic ? "إجراء" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {customerAssignments.map((assignment) => {
                const tag = (leadTags.data ?? []).find(
                  (item) => Number(item.id) === Number(assignment.tag_id),
                );
                const tagType = availableTagTypes.find(
                  (type) => Number(type.id) === Number(tag?.tag_type_id),
                );
                const tagColor = String(tag?.tag_color ?? "#00b4d8");
                const tagTypeColor = String(tagType?.type_color ?? "#00b4d8");
                return (
                  <tr key={assignment.id}>
                    <td>
                      {tagType ? (
                        <span
                          className="lead-tag-pill lead-tag-type-pill"
                          style={{ borderColor: tagTypeColor, color: tagTypeColor }}
                        >
                          {String(tagType.type_name ?? "—")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span
                        className="lead-tag-pill"
                        style={{ borderColor: tagColor, color: tagColor }}
                      >
                        {String(tag?.tag_name ?? "—")}
                      </span>
                    </td>
                    <td dir="ltr">{tagColor}</td>
                    <td>{formatUserDateTime(assignment.created_at, isArabic)}</td>
                    <td>
                      <button
                        className="customer-row-edit-button customer-row-delete-button"
                        onClick={() =>
                          void deleteLeadTagAssignment(Number(assignment.id))
                        }
                        type="button"
                      >
                        {isArabic ? "فك الربط" : "Unlink"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {customerAssignments.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    {isArabic
                      ? "لا توجد وسوم مرتبطة بهذا العميل"
                      : "No tags linked to this customer"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {tagTypeModalOpen ? (
          <div
            className="tag-create-modal-overlay"
            onMouseDown={() => setTagTypeModalOpen(false)}
            role="presentation"
          >
            <section
              aria-labelledby="new-tag-type-title"
              aria-modal="true"
              className="tag-create-modal"
              onMouseDown={(event) => event.stopPropagation()}
              role="dialog"
            >
              <div className="tag-create-modal-head">
                <div>
                  <span>{isArabic ? "أنواع الوسوم" : "Tag Types"}</span>
                  <h3 id="new-tag-type-title">
                    {isArabic ? "إضافة نوع وسم جديد" : "Add New Tag Type"}
                  </h3>
                </div>
                <button
                  aria-label={isArabic ? "إغلاق" : "Close"}
                  onClick={() => setTagTypeModalOpen(false)}
                  type="button"
                >
                  X
                </button>
              </div>
              <label>
                <span>{isArabic ? "اسم نوع الوسم" : "Tag Type Name"}</span>
                <input
                  autoFocus
                  onChange={(event) =>
                    setTagDraft((current) => ({
                      ...current,
                      type_name: event.target.value,
                    }))
                  }
                  placeholder={isArabic ? "مثال: مرحلة العميل" : "Example: Customer stage"}
                  type="text"
                  value={tagDraft.type_name}
                />
              </label>
              <label>
                <span>{isArabic ? "لون نوع الوسم" : "Tag Type Color"}</span>
                <input
                  onChange={(event) =>
                    setTagDraft((current) => ({
                      ...current,
                      type_color: event.target.value,
                    }))
                  }
                  type="color"
                  value={tagDraft.type_color}
                />
              </label>
              {tagModalStatus ? <p role="status">{tagModalStatus}</p> : null}
              <div className="tag-create-modal-actions">
                <button
                  className="primary"
                  onClick={() => void createNewTagType()}
                  type="button"
                >
                  {isArabic ? "حفظ نوع الوسم" : "Save Tag Type"}
                </button>
                <button
                  className="secondary"
                  onClick={() => setTagTypeModalOpen(false)}
                  type="button"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {tagModalOpen ? (
          <div
            className="tag-create-modal-overlay"
            onMouseDown={() => setTagModalOpen(false)}
            role="presentation"
          >
            <section
              aria-labelledby="new-tag-title"
              aria-modal="true"
              className="tag-create-modal"
              onMouseDown={(event) => event.stopPropagation()}
              role="dialog"
            >
              <div className="tag-create-modal-head">
                <div>
                  <span>{isArabic ? "الوسوم" : "Tags"}</span>
                  <h3 id="new-tag-title">
                    {isArabic ? "إضافة وسم جديد" : "Add New Tag"}
                  </h3>
                </div>
                <button
                  aria-label={isArabic ? "إغلاق" : "Close"}
                  onClick={() => setTagModalOpen(false)}
                  type="button"
                >
                  X
                </button>
              </div>
              <label>
                <span>{isArabic ? "اسم الوسم" : "Tag Name"}</span>
                <input
                  autoFocus
                  onChange={(event) =>
                    setTagDraft((current) => ({
                      ...current,
                      tag_name: event.target.value,
                    }))
                  }
                  placeholder={isArabic ? "مثال: عميل مهم" : "Example: Important customer"}
                  type="text"
                  value={tagDraft.tag_name}
                />
              </label>
              <label>
                <span>{isArabic ? "لون الوسم" : "Tag Color"}</span>
                <input
                  onChange={(event) =>
                    setTagDraft((current) => ({
                      ...current,
                      tag_color: event.target.value,
                    }))
                  }
                  type="color"
                  value={tagDraft.tag_color}
                />
              </label>
              {tagModalStatus ? <p role="status">{tagModalStatus}</p> : null}
              <div className="tag-create-modal-actions">
                <button
                  className="primary"
                  onClick={() => void createNewTag()}
                  type="button"
                >
                  {isArabic ? "حفظ الوسم" : "Save Tag"}
                </button>
                <button
                  className="secondary"
                  onClick={() => setTagModalOpen(false)}
                  type="button"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </article>
    );
  }

  if (notesLead) {
    return (
      <article className="table-card expanded-table-card lead-notes-screen">
        <div className="customer-edit-modal-head">
          <div>
            <span>{isArabic ? "\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0627\u0644\u0639\u0645\u064a\u0644" : "Customer Notes"}</span>
            <h3>{getCustomerTitle(notesLead)}</h3>
          </div>
          <button
            aria-label={isArabic ? "\u0627\u0644\u0631\u062c\u0648\u0639" : "Back"}
            onClick={() => setNotesLead(null)}
            type="button"
          >
            {isArabic ? "\u0631\u062c\u0648\u0639" : "Back"}
          </button>
        </div>

        {renderCustomerProfile(notesLead)}

        <label className="lead-note-input">
          <span>{isArabic ? "\u0625\u0636\u0627\u0641\u0629 \u0645\u0644\u0627\u062d\u0638\u0629 \u062c\u062f\u064a\u062f\u0629" : "Add a New Note"}</span>
          <textarea
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder={
              isArabic
                ? "\u0627\u0643\u062a\u0628 \u0645\u0644\u0627\u062d\u0638\u0629 \u0645\u0631\u062a\u0628\u0637\u0629 \u0628\u0647\u0630\u0627 \u0627\u0644\u0639\u0645\u064a\u0644..."
                : "Write a note linked to this customer..."
            }
            value={noteDraft}
          />
        </label>

        <div className="lead-contacts-actions">
          <button className="primary" onClick={() => void saveLeadNote()} type="button">
            {isArabic ? "\u0625\u0636\u0627\u0641\u0629 \u0645\u0644\u0627\u062d\u0638\u0629" : "Add Note"}
          </button>
          {noteStatus ? <p role="status">{noteStatus}</p> : null}
        </div>

        <div className="lead-notes-timeline">
          {customerNotes.map((note) => (
            <article className="lead-note-item" key={note.id}>
              <time dateTime={String(note.created_at ?? "")}>
                {formatUserDateTime(note.created_at, isArabic)}
              </time>
              <p>{String(note.note ?? "?")}</p>
            </article>
          ))}
          {customerNotes.length === 0 ? (
            <p className="lead-notes-empty">
              {isArabic
                ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0645\u0631\u062a\u0628\u0637\u0629 \u0628\u0647\u0630\u0627 \u0627\u0644\u0639\u0645\u064a\u0644"
                : "No notes linked to this customer"}
            </p>
          ) : null}
        </div>
      </article>
    );
  }

  if (contactsLead) {
    return (
      <article className="table-card expanded-table-card lead-contacts-screen">
        <div className="customer-edit-modal-head">
          <div>
            <span>{isArabic ? "\u062c\u0647\u0627\u062a \u0627\u0644\u0627\u062a\u0635\u0627\u0644" : "Contacts"}</span>
            <h3>{getCustomerTitle(contactsLead)}</h3>
          </div>
          <button
            aria-label={isArabic ? "\u0627\u0644\u0631\u062c\u0648\u0639" : "Back"}
            onClick={() => setContactsLead(null)}
            type="button"
          >
            {isArabic ? "\u0631\u062c\u0648\u0639" : "Back"}
          </button>
        </div>

        {renderCustomerProfile(contactsLead)}

        <div className="lead-contacts-form">
          <label>
            <span>{isArabic ? "\u0627\u0633\u0645 \u0627\u0644\u0634\u062e\u0635" : "Person Name"}</span>
            <input
              onChange={(event) =>
                setContactDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder={isArabic ? "\u0627\u0643\u062a\u0628 \u0627\u0633\u0645 \u062c\u0647\u0629 \u0627\u0644\u0627\u062a\u0635\u0627\u0644..." : "Write contact name..."}
              type="text"
              value={contactDraft.name}
            />
          </label>
          <label>
            <span>{isArabic ? "\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644" : "Mobile Number"}</span>
            <input
              dir="ltr"
              onChange={(event) =>
                setContactDraft((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              placeholder="+966 5X XXX XXXX"
              type="tel"
              value={contactDraft.phone}
            />
          </label>
          <label>
            <span>{isArabic ? "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a" : "Email"}</span>
            <input
              dir="ltr"
              onChange={(event) =>
                setContactDraft((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="name@company.com"
              type="email"
              value={contactDraft.email}
            />
          </label>
          <label>
            <span>{isArabic ? "\u0627\u0644\u0645\u0633\u0645\u0649 \u0627\u0644\u0648\u0638\u064a\u0641\u064a" : "Job Title"}</span>
            <input
              onChange={(event) =>
                setContactDraft((current) => ({
                  ...current,
                  job_title: event.target.value,
                }))
              }
              placeholder={isArabic ? "\u0645\u062b\u0627\u0644: \u0645\u062f\u064a\u0631 \u0627\u0644\u0645\u0634\u062a\u0631\u064a\u0627\u062a" : "Example: Purchasing Manager"}
              type="text"
              value={contactDraft.job_title}
            />
          </label>
        </div>

        <div className="lead-contacts-actions">
          <button className="primary" onClick={() => void saveLeadContact()} type="button">
            {editingContactId
              ? isArabic
                ? "حفظ تعديل جهة الاتصال"
                : "Save Contact"
              : isArabic
                ? "\u0625\u0636\u0627\u0641\u0629 \u062c\u0647\u0629 \u0627\u062a\u0635\u0627\u0644"
                : "Add Contact"}
          </button>
          {editingContactId ? (
            <button className="secondary" onClick={cancelContactEdit} type="button">
              {isArabic ? "إلغاء التعديل" : "Cancel Edit"}
            </button>
          ) : null}
          {contactStatus ? <p role="status">{contactStatus}</p> : null}
        </div>

        <div className="responsive-table lead-contacts-table">
          <table>
            <thead>
              <tr>
                <th>{isArabic ? "\u0627\u0633\u0645 \u0627\u0644\u0634\u062e\u0635" : "Person Name"}</th>
                <th>{isArabic ? "\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644" : "Mobile Number"}</th>
                <th>{isArabic ? "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a" : "Email"}</th>
                <th>{isArabic ? "\u0627\u0644\u0645\u0633\u0645\u0649 \u0627\u0644\u0648\u0638\u064a\u0641\u064a" : "Job Title"}</th>
                <th>{isArabic ? "\u0625\u062c\u0631\u0627\u0621" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {leadContacts.map((contact) => (
                <tr key={contact.id}>
                  <td>{displayValue(contact.name)}</td>
                  <td dir="ltr">{displayValue(contact.phone)}</td>
                  <td dir="ltr">{displayValue(contact.email)}</td>
                  <td>{displayValue(contact.job_title)}</td>
                  <td>
                    <div className="lead-contact-row-actions">
                      <button
                        className="customer-row-edit-button"
                        onClick={() => openContactEditor(contact)}
                        type="button"
                      >
                        {isArabic ? "تعديل" : "Edit"}
                      </button>
                      <button
                        className="customer-row-edit-button customer-row-delete-button"
                        onClick={() => setContactDeleteTarget(contact)}
                        type="button"
                      >
                        {isArabic ? "\u062d\u0630\u0641" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {leadContacts.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    {isArabic
                      ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u062c\u0647\u0627\u062a \u0627\u062a\u0635\u0627\u0644 \u0645\u0631\u062a\u0628\u0637\u0629 \u0628\u0647\u0630\u0627 \u0627\u0644\u0639\u0645\u064a\u0644"
                      : "No contacts linked to this customer"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {contactDeleteTarget ? (
          <div
            aria-modal="true"
            className="contact-delete-modal-overlay"
            role="dialog"
          >
            <div className="contact-delete-modal">
              <span className="contact-delete-icon" aria-hidden="true">
                !
              </span>
              <h3>{isArabic ? "تأكيد حذف جهة الاتصال" : "Confirm Contact Delete"}</h3>
              <p>
                {isArabic
                  ? "هل تريد حذف جهة الاتصال هذه؟ لا يمكن التراجع عن هذه العملية."
                  : "Do you want to delete this contact? This action cannot be undone."}
              </p>
              <strong>{displayValue(contactDeleteTarget.name)}</strong>
              <div className="contact-delete-actions">
                <button
                  className="secondary"
                  onClick={() => setContactDeleteTarget(null)}
                  type="button"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </button>
                <button
                  className="danger"
                  onClick={() => void deleteLeadContact(contactDeleteTarget)}
                  type="button"
                >
                  {isArabic ? "تأكيد الحذف" : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </article>
    );
  }

  if (editingLead) {
    return (
      <article className="table-card expanded-table-card customer-edit-fullscreen">
        <div className="customer-edit-modal-head">
          <div>
            <span>
              {isArabic
                ? "\u062a\u062d\u062f\u064a\u062b \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0639\u0645\u064a\u0644"
                : "Update customer"}
            </span>
            <h3>{getCustomerTitle(editingLead)}</h3>
          </div>
          <button
            aria-label={isArabic ? "\u0627\u0644\u0631\u062c\u0648\u0639" : "Back"}
            onClick={() => setEditingLead(null)}
            type="button"
          >
            {isArabic ? "\u0631\u062c\u0648\u0639" : "Back"}
          </button>
        </div>

        <div className="customer-edit-fields">
          <label>
            <span>{isArabic ? "\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u0634\u0623\u0629" : "Facility / Company Name"}</span>
            <input
              onChange={(event) =>
                setLeadEditDraft((current) => ({
                  ...current,
                  company_name: event.target.value,
                }))
              }
              placeholder={isArabic ? "\u0623\u062f\u062e\u0644 \u0627\u0633\u0645 \u0627\u0644\u0634\u0631\u0643\u0629 \u0623\u0648 \u0627\u0644\u0645\u0624\u0633\u0633\u0629" : "Enter the company or organization name"}
              type="text"
              value={leadEditDraft.company_name}
            />
          </label>
          <label>
            <span>{isArabic ? "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644" : "Full Name"}</span>
            <input
              onChange={(event) =>
                setLeadEditDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder={isArabic ? "\u0623\u062f\u062e\u0644 \u0627\u0633\u0645 \u0627\u0644\u0639\u0645\u064a\u0644 \u0627\u0644\u0643\u0627\u0645\u0644" : "Enter the full client name"}
              type="text"
              value={leadEditDraft.name}
            />
          </label>
          <label className="customer-edit-industry-field">
            <span>{isArabic ? "\u0646\u0648\u0639 \u0627\u0644\u0646\u0634\u0627\u0637" : "Business Type"}</span>
            <div className="customer-edit-industry-select">
              <DashboardSelect
                ariaLabel={isArabic ? "\u0646\u0648\u0639 \u0627\u0644\u0646\u0634\u0627\u0637" : "Business Type"}
                onValueChange={(value) =>
                  setLeadEditDraft((current) => ({
                    ...current,
                    industry_id: value,
                  }))
                }
                options={(industries ?? [])
                  .filter((industry) => String(industry.status ?? "active") === "active")
                  .map((industry) => ({
                    value: String(industry.id),
                    label: String(
                      (isArabic ? industry.name : industry.name_en ?? industry.name) ??
                        industry.id,
                    ),
                  }))}
                placeholder={isArabic ? "\u0627\u062e\u062a\u0631 \u0646\u0648\u0639 \u0627\u0644\u0646\u0634\u0627\u0637" : "Select a business type"}
                value={leadEditDraft.industry_id}
              />
            </div>
          </label>
          <label>
            <span>{isArabic ? "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a" : "Email"}</span>
            <input
              dir="ltr"
              onChange={(event) =>
                setLeadEditDraft((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="name@company.com"
              type="email"
              value={leadEditDraft.email}
            />
          </label>
          <label>
            <span>{isArabic ? "\u0627\u0644\u0639\u0646\u0648\u0627\u0646" : "Address"}</span>
            <input
              onChange={(event) =>
                setLeadEditDraft((current) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
              placeholder={isArabic ? "\u0627\u0644\u0645\u062f\u064a\u0646\u0629\u060c \u0627\u0644\u062d\u064a" : "City, district"}
              type="text"
              value={leadEditDraft.address}
            />
          </label>
          <label>
            <span>{isArabic ? "\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644" : "Mobile Number"}</span>
            <input
              dir="ltr"
              onChange={(event) =>
                setLeadEditDraft((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              placeholder="+966 5X XXX XXXX"
              type="tel"
              value={leadEditDraft.phone}
            />
          </label>
        </div>

        <div className="customer-edit-management-grid">
          <label>
            <span>{isArabic ? "\u0627\u0644\u0645\u0631\u062d\u0644\u0629" : "Stage"}</span>
            <DashboardSelect
              ariaLabel={isArabic ? "\u0627\u0644\u0645\u0631\u062d\u0644\u0629" : "Stage"}
              onValueChange={(value) =>
                setLeadEditDraft((current) => ({ ...current, stage: value }))
              }
              options={Object.entries(stageLabels).map(([value, label]) => ({
                value,
                label: label[isArabic ? "ar" : "en"],
              }))}
              value={leadEditDraft.stage}
            />
          </label>
          <div className="customer-edit-source">
            <span>{isArabic ? "\u0627\u0644\u0645\u0635\u062f\u0631" : "Source"}</span>
            <strong>
              {String(editingLead.source ?? "").trim() ||
                (isArabic ? "لا يوجد مصدر" : "No source")}
            </strong>
          </div>
        </div>
        {leadEditStatus ? <p className="customer-edit-status">{leadEditStatus}</p> : null}
        <div className="customer-edit-modal-actions">
          <button className="primary" onClick={() => void saveLeadEdit()} type="button">
            {isArabic
              ? "\u062d\u0641\u0638 \u0627\u0644\u062a\u0639\u062f\u064a\u0644\u0627\u062a"
              : "Save Changes"}
          </button>
          <button onClick={() => setEditingLead(null)} type="button">
            {isArabic ? "\u0625\u0644\u063a\u0627\u0621" : "Cancel"}
          </button>
          <button className="danger" onClick={() => void deleteLead()} type="button">
            {isArabic ? "\u062d\u0630\u0641 \u0627\u0644\u0639\u0645\u064a\u0644" : "Delete Customer"}
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="table-card expanded-table-card">
      <div className="card-title">
        <div>
          <h3>{t("dashboardPages.customers.tableTitle")}</h3>
          <span>{t("dashboardPages.customers.tableSubtitle")}</span>
        </div>
        <div className="customer-filter-controls">
          <div className="customer-search-bar">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              aria-label={
                isArabic
                  ? "\u0627\u0644\u0628\u062d\u062b \u0641\u064a \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0639\u0645\u0644\u0627\u0621"
                  : "Search customer data"
              }
              onChange={(event) => setCustomerSearch(event.target.value)}
              placeholder={
                isArabic
                  ? "\u0627\u0628\u062d\u062b \u0628\u0627\u0644\u0627\u0633\u0645\u060c \u0627\u0644\u0634\u0631\u0643\u0629\u060c \u0627\u0644\u062c\u0648\u0627\u0644\u060c \u0627\u0644\u0646\u0634\u0627\u0637..."
                  : "Search by name, company, mobile, activity..."
              }
              type="search"
              value={customerSearch}
            />
            <span>{filteredCustomers.length}</span>
          </div>
          <div className="customer-date-filter">
            <DashboardSelect
              ariaLabel={isArabic ? "فلترة العملاء حسب تاريخ الإنشاء" : "Filter customers by creation date"}
              onValueChange={(value) =>
                setCustomerDateFilter(value as CustomerDateFilter)
              }
              options={customerDateFilterOptions}
              portal
              value={customerDateFilter}
            />
          </div>
          {canSeeTeamCustomers ? (
            <div className="customer-date-filter">
              <DashboardSelect
                ariaLabel={
                  isArabic
                    ? "فلترة العملاء حسب المستخدم"
                    : "Filter customers by user"
                }
                onValueChange={(value) =>
                  setCustomerOwnerFilter(value as CustomerOwnerFilter)
                }
                options={customerOwnerFilterOptions}
                portal
                value={customerOwnerFilter}
              />
            </div>
          ) : null}
          {canSeeTeamCustomers && customerOwnerFilter === "team" ? (
            <div className="customer-date-filter">
              <DashboardSelect
                ariaLabel={
                  isArabic
                    ? "اختيار مستخدم من الفريق"
                    : "Select a team user"
                }
                onValueChange={setCustomerTeamUserFilter}
                options={customerTeamUserFilterOptions}
                portal
                searchable
                searchPlaceholder={
                  isArabic ? "ابحث عن مستخدم..." : "Search users..."
                }
                value={customerTeamUserFilter}
              />
            </div>
          ) : null}
          <div className="customer-tag-filters">
            <div className="customer-tag-filter">
              <DashboardSelect
                ariaLabel={
                  isArabic ? "فلترة العملاء حسب نوع الوسم" : "Filter customers by tag type"
                }
                onValueChange={(value) => {
                  setCustomerTagTypeFilter(value);
                  setCustomerTagFilter("all");
                }}
                options={customerTagTypeFilterOptions}
                portal
                searchable
                searchPlaceholder={
                  isArabic ? "ابحث عن نوع الوسم..." : "Search tag types..."
                }
                value={customerTagTypeFilter}
              />
            </div>
            <div className="customer-tag-filter">
              <DashboardSelect
                ariaLabel={
                  isArabic ? "فلترة العملاء حسب الوسم" : "Filter customers by tag"
                }
                onValueChange={setCustomerTagFilter}
                options={customerTagFilterOptions}
                portal
                searchable
                searchPlaceholder={
                  isArabic ? "ابحث عن وسم..." : "Search tags..."
                }
                value={customerTagFilter}
              />
            </div>
          </div>
        </div>
        <div
          className="customer-view-switch"
          role="group"
          aria-label={
            isArabic
              ? "\u0637\u0631\u064a\u0642\u0629 \u0639\u0631\u0636 \u0627\u0644\u0639\u0645\u0644\u0627\u0621"
              : "Customer view"
          }
        >
          <button
            className={customerView === "table" ? "active" : ""}
            onClick={() => setCustomerView("table")}
            type="button"
          >
            {isArabic ? "\u062c\u062f\u0648\u0644" : "Table"}
          </button>
          <button
            className={customerView === "kanban" ? "active" : ""}
            onClick={() => setCustomerView("kanban")}
            type="button"
          >
            {isArabic ? "\u0643\u0627\u0646\u0628\u0627\u0646" : "Kanban"}
          </button>
        </div>
      </div>
      {customerView === "table" ? (
        <div className="responsive-table customers-list-table">
          <table>
            <thead>
              <tr>
                <th>{isArabic ? "اسم الشركة" : "Company Name"}</th>
                <th>{isArabic ? "الحالة" : "Status"}</th>
                <th>{isArabic ? "الاسم" : "Name"}</th>
                <th>
                  {isArabic
                    ? "\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644"
                    : "Mobile Number"}
                </th>
                <th>{isArabic ? "الموقع الإلكتروني" : "Website"}</th>
                <th>
                  {isArabic ? "المتطلبات الإضافية" : "Additional Requirements"}
                </th>
                <th>
                  {isArabic
                    ? "\u0627\u0644\u0648\u0633\u0648\u0645"
                    : "Tags"}
                </th>
                <th>
                  {isArabic ? "\u0625\u062c\u0631\u0627\u0621" : "Action"}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((row) => {
                const rowTagAssignments =
                  leadTagAssignmentsByLeadId.get(String(row.id)) ?? [];
                const rowTags = rowTagAssignments
                  .map((assignment) => leadTagsById.get(Number(assignment.tag_id)))
                  .filter(Boolean);
                return (
                  <Fragment key={row.id}>
                    <tr>
                    <td>{String(row.company_name ?? "").trim()}</td>
                    <td>
                      <span className={`badge ${String(row.stage ?? "new")}`}>
                        {stageLabels[String(row.stage ?? "new")]?.[
                          isArabic ? "ar" : "en"
                        ] ?? String(row.stage ?? "new")}
                      </span>
                    </td>
                    <td>{getCustomerName(row)}</td>
                    <td dir="ltr">{String(row.phone ?? "").trim()}</td>
                    <td dir="ltr">
                      {String(row.website ?? "").trim() ? (
                        <a
                          href={externalUrl(row.website)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {String(row.website)}
                        </a>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="customers-details-cell customers-requirements-cell">
                      {String(row.requirements ?? "").trim() ||
                        (isArabic ? "لا توجد متطلبات" : "No requirements")}
                    </td>
                    <td className="customers-details-cell customers-tags-cell">
                      <div className="customers-tags-list">
                        {rowTags.length ? (
                          rowTags.map((tag) => {
                            const tagColor = String(tag?.tag_color ?? "#00b4d8");
                            return (
                              <span
                                className="lead-tag-pill"
                                key={Number(tag?.id)}
                                style={{ borderColor: tagColor, color: tagColor }}
                              >
                                {String(tag?.tag_name ?? "").trim()}
                              </span>
                            );
                          })
                        ) : (
                          <span className="muted-table-value">
                            {isArabic ? "لا توجد وسوم" : "No tags"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="customer-row-actions">
                        <button
                          aria-label={isArabic ? "تعديل" : "Edit"}
                          className="customer-row-edit-button customer-action-icon-button"
                          onClick={() => openLeadEditor(row)}
                          title={isArabic ? "تعديل" : "Edit"}
                          type="button"
                        >
                          <CustomerActionIcon name="edit" />
                        </button>
                        <button
                          aria-label={isArabic ? "جهات الاتصال" : "Contacts"}
                          className="customer-row-edit-button customer-row-contacts-button customer-action-icon-button"
                          onClick={() => openLeadContacts(row)}
                          title={isArabic ? "جهات الاتصال" : "Contacts"}
                          type="button"
                        >
                          <CustomerActionIcon name="contacts" />
                        </button>
                        <button
                          aria-label={isArabic ? "ملاحظات" : "Notes"}
                          className="customer-row-edit-button customer-row-notes-button customer-action-icon-button"
                          onClick={() => openLeadNotes(row)}
                          title={isArabic ? "ملاحظات" : "Notes"}
                          type="button"
                        >
                          <CustomerActionIcon name="notes" />
                        </button>
                        <button
                          aria-label={isArabic ? "وسوم" : "Tags"}
                          className="customer-row-edit-button customer-row-tags-button customer-action-icon-button"
                          onClick={() => openLeadTags(row)}
                          title={isArabic ? "وسوم" : "Tags"}
                          type="button"
                        >
                          <CustomerActionIcon name="tags" />
                        </button>
                      </div>
                    </td>
                    </tr>
                  </Fragment>
                );
              })}
              {filteredCustomers.length === 0 ? (
                <tr className="customer-search-empty-row">
                  <td colSpan={8}>
                    {isArabic
                      ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c \u0645\u0637\u0627\u0628\u0642\u0629"
                      : "No matching customers"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          {filteredCustomers.length > CUSTOMER_PAGE_SIZE ? (
            <div className="customer-pagination" aria-label={isArabic ? "ترقيم صفحات العملاء" : "Customer pagination"}>
              <span>
                {isArabic
                  ? `${firstCustomerIndex.toLocaleString(NUMBER_LOCALE)}-${lastCustomerIndex.toLocaleString(NUMBER_LOCALE)} من ${filteredCustomers.length.toLocaleString(NUMBER_LOCALE)}`
                  : `${firstCustomerIndex.toLocaleString(NUMBER_LOCALE)}-${lastCustomerIndex.toLocaleString(NUMBER_LOCALE)} of ${filteredCustomers.length.toLocaleString(NUMBER_LOCALE)}`}
              </span>
              <div>
                <button
                  disabled={activeCustomerPage === 1}
                  onClick={() => setCustomerPage((page) => Math.max(1, page - 1))}
                  type="button"
                >
                  {isArabic ? "السابق" : "Previous"}
                </button>
                {customerPageNumbers.map((page) => (
                  <button
                    aria-current={page === activeCustomerPage ? "page" : undefined}
                    className={page === activeCustomerPage ? "active" : ""}
                    key={page}
                    onClick={() => setCustomerPage(page)}
                    type="button"
                  >
                    {page.toLocaleString(NUMBER_LOCALE)}
                  </button>
                ))}
                <button
                  disabled={activeCustomerPage === customerTotalPages}
                  onClick={() =>
                    setCustomerPage((page) => Math.min(customerTotalPages, page + 1))
                  }
                  type="button"
                >
                  {isArabic ? "التالي" : "Next"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div>
          {kanbanStatus ? (
            <p className="customer-kanban-status" role="status">
              {kanbanStatus}
            </p>
          ) : null}
          <div className="customer-kanban-board">
            {stageOrder.map((stage) => {
              const stageLeads = customersByStage.get(stage) ?? [];
              return (
                <section
                  className={`customer-kanban-column stage-${stage} ${dragOverStage === stage ? "drag-over" : ""}`}
                  key={stage}
                  onDragEnter={() => setDragOverStage(stage)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDragLeave={(event) => {
                    if (
                      !event.currentTarget.contains(event.relatedTarget as Node)
                    )
                      setDragOverStage(null);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const leadId =
                      draggedLeadId ??
                      Number(event.dataTransfer.getData("text/plain"));
                    if (leadId) void moveLeadToStage(leadId, stage);
                  }}
                >
                  <div className="customer-kanban-column-head">
                    <span className={`badge ${stage}`}>
                      {stageLabels[stage][isArabic ? "ar" : "en"]}
                    </span>
                    <b>{stageLeads.length}</b>
                  </div>
                  <div className="customer-kanban-cards">
                    {stageLeads.map((row) => (
                      <article
                        className={`customer-kanban-card ${draggedLeadId === row.id ? "dragging" : ""}`}
                        draggable
                        key={row.id}
                        onDragEnd={() => {
                          setDraggedLeadId(null);
                          setDragOverStage(null);
                        }}
                        onDragStart={(event) => {
                          setDraggedLeadId(row.id);
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData(
                            "text/plain",
                            String(row.id),
                          );
                        }}
                      >
                        <div className="customer-kanban-card-head">
                          <div>
                            <strong>{getCustomerTitle(row)}</strong>
                            <span>{getCustomerName(row)}</span>
                          </div>
                          <button
                            aria-label={isArabic ? "تعديل" : "Edit"}
                            className="customer-action-icon-button"
                            onClick={() => openLeadEditor(row)}
                            title={isArabic ? "تعديل" : "Edit"}
                            type="button"
                          >
                            <CustomerActionIcon name="edit" />
                          </button>
                          <button
                            aria-label={isArabic ? "جهات الاتصال" : "Contacts"}
                            className="customer-action-icon-button"
                            onClick={() => openLeadContacts(row)}
                            title={isArabic ? "جهات الاتصال" : "Contacts"}
                            type="button"
                          >
                            <CustomerActionIcon name="contacts" />
                          </button>
                          <button
                            aria-label={isArabic ? "ملاحظات" : "Notes"}
                            className="customer-action-icon-button"
                            onClick={() => openLeadNotes(row)}
                            title={isArabic ? "ملاحظات" : "Notes"}
                            type="button"
                          >
                            <CustomerActionIcon name="notes" />
                          </button>
                          <button
                            aria-label={isArabic ? "وسوم" : "Tags"}
                            className="customer-action-icon-button"
                            onClick={() => openLeadTags(row)}
                            title={isArabic ? "وسوم" : "Tags"}
                            type="button"
                          >
                            <CustomerActionIcon name="tags" />
                          </button>
                        </div>
                        <dl>
                          <div>
                            <dt>
                              {isArabic
                                ? "\u0627\u0644\u062c\u0648\u0627\u0644"
                                : "Mobile"}
                            </dt>
                            <dd dir="ltr">{String(row.phone ?? "?")}</dd>
                          </div>
                          <div>
                            <dt>
                              {isArabic
                                ? "\u0627\u0644\u0646\u0634\u0627\u0637"
                                : "Activity"}
                            </dt>
                            <dd>
                              {String(
                                industries?.find(
                                  (industry) =>
                                    Number(industry.id) ===
                                    Number(row.industry_id),
                                )?.[isArabic ? "name" : "name_en"] ??
                                  industries?.find(
                                    (industry) =>
                                      Number(industry.id) ===
                                      Number(row.industry_id),
                                  )?.name ??
                                  "?",
                              )}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                    {stageLeads.length === 0 ? (
                      <p className="customer-kanban-empty">
                        {isArabic
                          ? "\u0644\u0627 \u064a\u0648\u062c\u062f \u0639\u0645\u0644\u0627\u0621"
                          : "No customers"}
                      </p>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}

export function LeadsHubView() {
  const isArabic = useLocale() === "ar";
  const [activeTab, setActiveTab] = useState<"directory" | "add" | "demo">(
    "directory",
  );
  const tabs = {
    directory: {
      title: isArabic ? "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0639\u0645\u0644\u0627\u0621" : "Customer List",
      subtitle: isArabic
        ? "\u062c\u062f\u0648\u0644 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0648\u0646\u0645\u0627\u0630\u062c \u0627\u0644\u0627\u0644\u062a\u0642\u0627\u0637"
        : "Customer table and lead capture forms",
    },
    add: {
      title: isArabic ? "\u0625\u0636\u0627\u0641\u0629 \u0639\u0645\u064a\u0644 \u0645\u0647\u062a\u0645" : "Add Interested Customer",
      subtitle: isArabic
        ? "\u0623\u062f\u062e\u0644 \u0639\u0645\u064a\u0644\u064b\u0627 \u062c\u062f\u064a\u062f\u064b\u0627 \u0648\u0623\u0636\u0641\u0647 \u0645\u0628\u0627\u0634\u0631\u0629 \u0625\u0644\u0649 \u0627\u0644\u0642\u0627\u0626\u0645\u0629"
        : "Enter a new customer and add them directly to the list",
    },
    demo: {
      title: isArabic ? "\u0646\u0633\u062e\u0629 \u062a\u062c\u0631\u064a\u0628\u064a\u0629 \u0644\u0644\u0639\u0645\u064a\u0644" : "Customer Demo",
      subtitle: isArabic
        ? "\u062a\u062c\u0647\u064a\u0632 \u0628\u064a\u0626\u0629 \u0633\u0627\u0646\u062f\u0628\u0648\u0643\u0633 \u0648\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062a\u062c\u0627\u0631\u0628"
        : "Prepare sandbox environments and manage demos",
    },
  };

  return (
    <section className="leads-hub-view" dir={isArabic ? "rtl" : "ltr"}>
      <div
        className="leads-hub-tabs"
        role="tablist"
        aria-label={
          isArabic ? "\u062a\u0628\u0648\u064a\u0628\u0627\u062a \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0627\u0644\u0645\u0647\u062a\u0645\u064a\u0646" : "Potential customers tabs"
        }
      >
        <button
          className={activeTab === "directory" ? "active" : ""}
          onClick={() => setActiveTab("directory")}
          role="tab"
          type="button"
        >
          <strong>{tabs.directory.title}</strong>
          <span>{tabs.directory.subtitle}</span>
        </button>
        <button
          className={activeTab === "add" ? "active" : ""}
          onClick={() => setActiveTab("add")}
          role="tab"
          type="button"
        >
          <strong>{tabs.add.title}</strong>
          <span>{tabs.add.subtitle}</span>
        </button>
        <button
          className={activeTab === "demo" ? "active" : ""}
          onClick={() => setActiveTab("demo")}
          role="tab"
          type="button"
        >
          <strong>{tabs.demo.title}</strong>
          <span>{tabs.demo.subtitle}</span>
        </button>
      </div>

      <div className="leads-hub-panel">
        {activeTab === "directory" ? (
          <CustomersView />
        ) : activeTab === "add" ? (
          <LeadRequestForm onCreated={() => setActiveTab("directory")} />
        ) : (
          <DemoView />
        )}
      </div>
    </section>
  );
}

const educationalImages = [
  {
    title:
      "\u0625\u0646\u0641\u0648\u063a\u0631\u0627\u0641\u064a\u0643 \u062f\u0648\u0631\u0629 \u0627\u0644\u0639\u0645\u064a\u0644",
    meta: "\u0634\u0631\u0627\u0626\u062d \u062a\u062b\u0642\u064a\u0641\u064a\u0629",
  },
  {
    title:
      "\u062f\u0644\u064a\u0644 \u062a\u0623\u0647\u064a\u0644 \u0627\u0644\u0639\u0645\u064a\u0644",
    meta: "\u062a\u0635\u0645\u064a\u0645 \u0644\u0644\u0645\u0634\u0627\u0631\u0643\u0629",
  },
  {
    title:
      "\u0645\u0642\u0627\u0631\u0646\u0629 \u0645\u0632\u0627\u064a\u0627 \u0627\u0644\u0642\u0637\u0627\u0639\u0627\u062a",
    meta: "\u0631\u0633\u0648\u0645 \u062a\u0648\u0636\u064a\u062d\u064a\u0629",
  },
  {
    title:
      "\u062e\u0631\u064a\u0637\u0629 \u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0646\u0638\u0627\u0645",
    meta: "\u0633\u0644\u0627\u064a\u062f\u0627\u062a \u062a\u0639\u0644\u064a\u0645\u064a\u0629",
  },
];

const educationalVideos = [
  {
    title:
      "\u0627\u0644\u0628\u062f\u0621 \u0627\u0644\u0633\u0631\u064a\u0639 \u0645\u0639 \u0645\u064a\u062f\u0627\u0631",
    duration: "04:20",
  },
  {
    title:
      "\u0634\u0631\u062d \u0631\u0628\u0637 \u0627\u0644\u0639\u0645\u064a\u0644 \u0628\u0627\u0644\u0642\u0637\u0627\u0639",
    duration: "06:15",
  },
  {
    title:
      "\u062a\u0647\u064a\u0626\u0629 \u0627\u0644\u0646\u0633\u062e\u0629 \u0627\u0644\u062a\u062c\u0631\u064a\u0628\u064a\u0629",
    duration: "05:05",
  },
  {
    title:
      "\u0623\u0641\u0636\u0644 \u0645\u0645\u0627\u0631\u0633\u0627\u062a \u0627\u0644\u0639\u0631\u0636 \u0648\u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629",
    duration: "07:40",
  },
];

export function EducationalHubView() {
  const [activeTab, setActiveTab] = useState<"images" | "videos">("images");
  const { data } = useBackend<BackendRow[]>("/api/v1/data/educational-assets");
  const liveImages = useMemo(
    () => (data ?? []).filter((item) => item.asset_type !== "video"),
    [data],
  );
  const liveVideos = useMemo(
    () => (data ?? []).filter((item) => item.asset_type === "video"),
    [data],
  );

  return (
    <section className="education-hub-view" dir="rtl">
      <div
        className="education-tabs"
        role="tablist"
        aria-label={
          "\u062a\u0628\u0648\u064a\u0628\u0627\u062a \u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u062a\u0639\u0644\u064a\u0645\u064a"
        }
      >
        <button
          className={activeTab === "images" ? "active" : ""}
          onClick={() => setActiveTab("images")}
          role="tab"
          type="button"
        >
          <strong>
            {
              "\u0645\u0643\u062a\u0628\u0629 \u0627\u0644\u0635\u0648\u0631 \u0627\u0644\u062a\u0639\u0644\u064a\u0645\u064a\u0629"
            }
          </strong>
          <span>
            {
              "\u0625\u0646\u0641\u0648\u063a\u0631\u0627\u0641\u064a\u0643\u060c \u0634\u0631\u0627\u0626\u062d\u060c \u0648\u0631\u0633\u0648\u0645 \u062a\u0648\u0636\u064a\u062d\u064a\u0629"
            }
          </span>
        </button>
        <button
          className={activeTab === "videos" ? "active" : ""}
          onClick={() => setActiveTab("videos")}
          role="tab"
          type="button"
        >
          <strong>
            {
              "\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u062a\u0639\u0644\u064a\u0645\u064a\u0629"
            }
          </strong>
          <span>
            {
              "\u062f\u0631\u0648\u0633 \u0633\u0631\u064a\u0639\u0629\u060c \u0634\u0631\u0648\u062d\u0627\u062a\u060c \u0648\u062a\u0639\u0645\u0642 \u0641\u064a \u0627\u0644\u0645\u064a\u0632\u0627\u062a"
            }
          </span>
        </button>
      </div>

      <div className="education-panel">
        {activeTab === "images" ? (
          <div className="education-card-grid">
            {liveImages.map((item, index) => (
              <article
                className="education-asset-card image-card"
                key={item.id}
              >
                <span>{`0${index + 1}`}</span>
                <div className="education-asset-preview" />
                <h3>{String(item.title)}</h3>
                <p>{String(item.description ?? "")}</p>
                {item.url ? (
                  <a href={String(item.url)} rel="noreferrer" target="_blank">
                    {
                      "\u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0644\u0641"
                    }
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="education-card-grid">
            {liveVideos.map((item) => (
              <article
                className="education-asset-card video-card"
                key={item.id}
              >
                <div className="education-video-thumb">
                  <span>{"\u25b6"}</span>
                </div>
                <h3>{String(item.title)}</h3>
                <p>{String(item.duration ?? "")}</p>
                {item.url ? (
                  <a href={String(item.url)} rel="noreferrer" target="_blank">
                    {
                      "\u0645\u0634\u0627\u0647\u062f\u0629 \u0627\u0644\u062f\u0631\u0633"
                    }
                  </a>
                ) : null}
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
  const isArabic = useLocale() === "ar";
  const { data } = useBackend<BackendRow[]>("/api/v1/data/commissions");
  const approvedTotal = useMemo(
    () =>
      (data ?? [])
        .filter((row) => row.status === "approved")
        .reduce((sum, row) => sum + Number(row.commission_amount ?? 0), 0),
    [data],
  );
  const pending = useMemo(
    () =>
      (data ?? [])
        .filter((row) => row.status === "pending")
        .reduce((sum, row) => sum + Number(row.commission_amount ?? 0), 0),
    [data],
  );
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const paidThisMonth = useMemo(
    () =>
      (data ?? [])
        .filter((row) => {
          if (row.status !== "paid") return false;
          const paidDate = new Date(String(row.paid_at ?? row.created_at ?? ""));
          return (
            !Number.isNaN(paidDate.getTime()) &&
            paidDate.getMonth() === currentMonth &&
            paidDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, row) => sum + Number(row.commission_amount ?? 0), 0),
    [currentMonth, currentYear, data],
  );
  const commissionStatusDate = (row: BackendRow) => {
    const status = String(row.status ?? "pending");
    const value =
      status === "approved"
        ? row.approved_at
        : status === "paid"
          ? row.paid_at
          : row.created_at;
    return String(value ?? "?").slice(0, 10);
  };
  const commissionStatusLabel = (status: unknown) => {
    const key = String(status ?? "pending");
    const labels: Record<string, { ar: string; en: string }> = {
      pending: {
        ar: "\u0642\u064a\u062f \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631",
        en: "Pending",
      },
      approved: { ar: "\u0645\u0639\u062a\u0645\u062f\u0629", en: "Approved" },
      paid: { ar: "\u0645\u062f\u0641\u0648\u0639\u0629", en: "Paid" },
      cancelled: { ar: "\u0645\u0644\u063a\u064a\u0629", en: "Cancelled" },
    };
    return labels[key]?.[isArabic ? "ar" : "en"] ?? key;
  };

  return (
    <article className="table-card expanded-table-card financial-ledger-card">
      <div className="card-title">
        <h3>{t("dashboardPages.accounts.tableTitle")}</h3>
        <span>{t("dashboardPages.accounts.tableSubtitle")}</span>
      </div>
      <div className="account-summary-strip">
        <div>
          <span>{t("dashboardPages.accounts.summary1.label")}</span>
          <strong>{approvedTotal.toLocaleString(NUMBER_LOCALE)} SAR</strong>
        </div>
        <div>
          <span>{t("dashboardPages.accounts.summary2.label")}</span>
          <strong>{pending.toLocaleString(NUMBER_LOCALE)} SAR</strong>
        </div>
        <div>
          <span>{t("dashboardPages.accounts.summary3.label")}</span>
          <strong>{paidThisMonth.toLocaleString(NUMBER_LOCALE)} SAR</strong>
        </div>
      </div>
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>
                {isArabic
                  ? "\u0627\u0633\u0645 \u0627\u0644\u0639\u0645\u064a\u0644"
                  : "Client Name"}
              </th>
              <th>
                {isArabic
                  ? "\u0631\u0642\u0645 \u0641\u0627\u062a\u0648\u0631\u0629 \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a"
                  : "Sales Invoice Number"}
              </th>
              <th>
                {isArabic
                  ? "\u0645\u0628\u0644\u063a \u0627\u0644\u0639\u0645\u0648\u0644\u0629"
                  : "Commission Amount"}
              </th>
              <th>
                {isArabic
                  ? "\u0646\u0633\u0628\u0629 \u0627\u0644\u0639\u0645\u0648\u0644\u0629"
                  : "Commission Rate"}
              </th>
              <th>
                {isArabic
                  ? "\u0646\u0648\u0639 \u0627\u0644\u0639\u0645\u0648\u0644\u0629"
                  : "Commission Type"}
              </th>
              <th>{t("dashboardPages.accounts.status")}</th>
              <th>{t("dashboardPages.accounts.date")}</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => (
              <tr key={row.id}>
                <td>{String(row.customer_name ?? "?")}</td>
                <td>
                  {String(
                    row.sales_invoice_number ??
                      `S-${String(row.sale_id ?? "?")}`,
                  )}
                </td>
                <td>
                  {Number(row.commission_amount ?? 0).toLocaleString(NUMBER_LOCALE)}{" "}
                  {String(row.currency ?? "SAR")}
                </td>
                <td>
                  {Number(row.commission_percent ?? 0).toLocaleString(
                    NUMBER_LOCALE,
                    { maximumFractionDigits: 2 },
                  )}
                  %
                </td>
                <td>{String(row.commission_type ?? "—")}</td>
                <td>
                  <span className={`badge ${String(row.status ?? "pending")}`}>
                    {commissionStatusLabel(row.status)}
                  </span>
                </td>
                <td>{commissionStatusDate(row)}</td>
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
  const products = useBackend<BackendRow[]>("/api/v1/data/products");
  const demos = useBackend<BackendRow[]>("/api/v1/data/demo-requests");
  const leads = useBackend<BackendRow[]>("/api/v1/data/leads");
  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false);
  const customerSearchRef = useRef<HTMLDivElement>(null);
  const [productId, setProductId] = useState("");
  const [duration, setDuration] = useState(
    t("dashboardPages.demo.durationOption1"),
  );
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState("");
  const [demoListStatus, setDemoListStatus] = useState("");
  const [demoStatusFilter, setDemoStatusFilter] = useState("all");
  const normalizedDemoStatus = status.toLowerCase();
  const demoFormStatusTone = !status
    ? ""
    : normalizedDemoStatus.includes("saved") ||
        status.includes("\u062a\u0645 \u0627\u0644\u062d\u0641\u0638")
      ? "success"
      : normalizedDemoStatus.includes("saving") ||
          status.includes("\u062c\u0627\u0631\u064a")
        ? "muted"
        : "warning";

  useEffect(() => {
    const closeCustomerMenu = (event: PointerEvent) => {
      if (!customerSearchRef.current?.contains(event.target as Node)) {
        setCustomerMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeCustomerMenu);
    return () => document.removeEventListener("pointerdown", closeCustomerMenu);
  }, []);

  async function submitDemo() {
    const selectedLead = (leads.data ?? []).find(
      (lead) => String(lead.id) === selectedLeadId,
    );
    if (!selectedLead || !productId) {
      setStatus(isArabic ? "\u0627\u062e\u062a\u0631 \u0627\u0644\u0639\u0645\u064a\u0644 \u0648\u0627\u0644\u0645\u0646\u062a\u062c" : "Select a customer and product");
      return;
    }
    const hasExistingDemo = (demos.data ?? []).some(
      (demo) => Number(demo.lead_id) === Number(selectedLead.id),
    );
    if (hasExistingDemo) {
      setStatus(
        isArabic
          ? "\u064a\u0648\u062c\u062f \u0646\u0633\u062e\u0629 \u062a\u062c\u0631\u064a\u0628\u064a\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u0639\u0645\u064a\u0644 \u0645\u0633\u0628\u0642\u064b\u0627"
          : "This customer already has a trial demo",
      );
      return;
    }
    setStatus(isArabic ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638..." : "Saving...");
    try {
      await createBackend("demo-requests", {
        lead_id: selectedLead.id,
        product_id: Number(productId),
        industry_id: selectedLead.industry_id ?? null,
        company_name: String(selectedLead.company_name ?? selectedLead.name ?? ""),
        contact_name: String(selectedLead.name ?? ""),
        email: selectedLead.email ?? null,
        phone: selectedLead.phone ?? null,
        address: selectedLead.address ?? null,
        requirements: `${duration}${owner ? ` - ${owner}` : ""}`,
      });
      setStatus(isArabic ? "\u062a\u0645 \u0627\u0644\u062d\u0641\u0638" : "Saved");
      setCustomerQuery("");
      setSelectedLeadId("");
      setProductId("");
      await demos.reload();
    } catch (error) {
      const duplicate =
        error instanceof Error && error.message === "DUPLICATE_CUSTOMER_DEMO";
      setStatus(
        duplicate
          ? isArabic
            ? "\u064a\u0648\u062c\u062f \u0646\u0633\u062e\u0629 \u062a\u062c\u0631\u064a\u0628\u064a\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u0639\u0645\u064a\u0644 \u0645\u0633\u0628\u0642\u064b\u0627"
            : "This customer already has a trial demo"
          : isArabic
            ? "\u0641\u0634\u0644 \u0627\u0644\u062d\u0641\u0638"
            : "Failed",
      );
    }
  }

  async function updateDemoStatus(demoId: number, nextStatus: string) {
    setDemoListStatus(isArabic ? "\u062c\u0627\u0631\u064a \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u062d\u0627\u0644\u0629..." : "Updating status...");
    try {
      const response = await fetch(`/api/v1/data/demo-requests/${demoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) throw new Error("SAVE_FAILED");
      await demos.reload();
      setDemoListStatus("");
    } catch {
      setDemoListStatus(isArabic ? "\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u0627\u0644\u062d\u0627\u0644\u0629" : "Unable to save status");
    }
  }

  const productOptions = isArabic
    ? ["\u0646\u0638\u0627\u0645 \u0627\u0644\u062a\u062c\u0632\u0626\u0629", "\u0646\u0638\u0627\u0645 \u0627\u0644\u0645\u0637\u0627\u0639\u0645 \u0648\u0627\u0644\u0645\u0642\u0627\u0647\u064a", "\u0646\u0638\u0627\u0645 \u0627\u0644\u062e\u062f\u0645\u0627\u062a"]
    : ["Retail system", "Restaurants and cafes system", "Services system"];
  const normalizedCustomerQuery = customerQuery.trim().toLocaleLowerCase();
  const matchingCustomers = useMemo(
    () =>
      (leads.data ?? [])
        .filter((lead) =>
          [lead.name, lead.company_name, lead.phone, lead.email].some((value) =>
            String(value ?? "").toLocaleLowerCase().includes(normalizedCustomerQuery),
          ),
        )
        .slice(0, 8),
    [leads.data, normalizedCustomerQuery],
  );
  const demoStatusLabels: Record<string, string> = isArabic
    ? {
        new: "\u062c\u062f\u064a\u062f",
        contacted: "\u0646\u0634\u0637",
        completed: "\u0645\u063a\u0644\u0642",
      }
    : { new: "New", contacted: "Active", completed: "Closed" };
  const isDemoExpired = (demo: BackendRow) => {
    const createdAt = new Date(String(demo.created_at ?? ""));
    if (Number.isNaN(createdAt.getTime())) return false;
    const durationDays = Number(String(demo.requirements ?? "").match(/\d+/)?.[0] ?? 14);
    const expiryDate = new Date(createdAt);
    expiryDate.setDate(expiryDate.getDate() + durationDays);
    return expiryDate.getTime() < Date.now();
  };
  const normalizeDemoStatus = (value: unknown) => {
    const current = String(value ?? "new").toLowerCase();
    if (current === "new") return "new";
    if (current === "completed" || current === "cancelled") return "completed";
    return "contacted";
  };
  const filteredDemos = useMemo(
    () =>
      (demos.data ?? []).filter(
        (demo) =>
          demoStatusFilter === "all" ||
          (isDemoExpired(demo) ? "completed" : normalizeDemoStatus(demo.status)) ===
            demoStatusFilter,
      ),
    [demoStatusFilter, demos.data],
  );
  const demoRemainingTimeLabel = (demo: BackendRow) => {
    const createdAt = new Date(String(demo.created_at ?? ""));
    if (Number.isNaN(createdAt.getTime())) return "\u2014";

    const details = String(demo.requirements ?? "");
    const durationDays = Number(details.match(/\d+/)?.[0] ?? 14);
    const expiryDate = new Date(createdAt);
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    const remainingDays = Math.ceil(
      (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    if (remainingDays <= 0) return isArabic ? "\u0645\u063a\u0644\u0642" : "Closed";
    return isArabic
      ? `${remainingDays.toLocaleString(NUMBER_LOCALE)} \u064a\u0648\u0645`
      : `${remainingDays.toLocaleString(NUMBER_LOCALE)} day${remainingDays === 1 ? "" : "s"}`;
  };

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
          <div className="demo-customer-search-field">
            <span>{t("dashboardPages.demo.customer")}</span>
            <div className="demo-customer-search" ref={customerSearchRef}>
              <input
                autoComplete="off"
                onChange={(event) => {
                  setCustomerQuery(event.target.value);
                  setSelectedLeadId("");
                  setCustomerMenuOpen(true);
                }}
                onFocus={() => setCustomerMenuOpen(true)}
                value={customerQuery}
                placeholder={
                  isArabic
                    ? "\u0627\u0628\u062d\u062b \u0628\u0627\u0633\u0645 \u0627\u0644\u0639\u0645\u064a\u0644 \u0623\u0648 \u0627\u0644\u062c\u0648\u0627\u0644..."
                    : "Search customers by name or mobile..."
                }
              />
              {customerMenuOpen ? (
                <div className="demo-customer-search-menu" role="listbox">
                  {matchingCustomers.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => {
                        setSelectedLeadId(String(lead.id));
                        setCustomerQuery(
                          `${String(lead.company_name ?? "?")} - ${String(lead.name ?? "?")}`,
                        );
                        setCustomerMenuOpen(false);
                      }}
                      role="option"
                      type="button"
                    >
                      <span>
                        <strong>{String(lead.company_name ?? "?")}</strong>
                        <small>{String(lead.name ?? "?")}</small>
                      </span>
                      <small dir="ltr">{String(lead.phone ?? "?")}</small>
                    </button>
                  ))}
                  {matchingCustomers.length === 0 ? (
                    <p>{isArabic ? "\u0644\u0627 \u064a\u0648\u062c\u062f \u0639\u0645\u064a\u0644 \u0645\u0637\u0627\u0628\u0642" : "No matching customer"}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
          <label>
            <span>{t("dashboardPages.demo.product")}</span>
            <DashboardSelect
              ariaLabel={t("dashboardPages.demo.product")}
              onValueChange={setProductId}
              options={(products.data ?? []).map((product) => ({
                label: String(
                  (isArabic ? product.name : product.name_en ?? product.name) ??
                    product.id,
                ),
                value: String(product.id),
              }))}
              placeholder={productOptions[0]}
              value={productId}
            />
          </label>
          <label>
            <span>{t("dashboardPages.demo.duration")}</span>
            <DashboardSelect
              ariaLabel={t("dashboardPages.demo.duration")}
              onValueChange={setDuration}
              options={[
                {
                  label: isArabic ? "7 أيام" : "7 days",
                  value: isArabic ? "7 أيام" : "7 days",
                },
                ...[1, 2].map((item) => ({
                  label: t(`dashboardPages.demo.durationOption${item}`),
                  value: t(`dashboardPages.demo.durationOption${item}`),
                })),
              ]}
              value={duration}
            />
          </label>
          <label>
            <span>{t("dashboardPages.demo.owner")}</span>
            <input
              onChange={(event) => setOwner(event.target.value)}
              value={owner}
              placeholder={t("dashboardPages.demo.ownerPlaceholder")}
            />
          </label>
        </div>
        <div className="demo-action-row">
          <button
            className="button button-dark compact-action"
            onClick={() => void submitDemo()}
            type="button"
          >
            {t("dashboardPages.demo.button")}
          </button>
          {status ? (
            <small className={`demo-form-status ${demoFormStatusTone}`} role="status">
              {status}
            </small>
          ) : null}
        </div>
      </article>

      <article className="table-card demo-requests-list">
        <div className="card-title">
          <div>
            <div className="demo-list-title-row">
              <h3>{isArabic ? "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0646\u0633\u062e \u0627\u0644\u062a\u062c\u0631\u064a\u0628\u064a\u0629" : "Demo Requests"}</h3>
              <div className="demo-status-filter">
                <DashboardSelect
                  ariaLabel={isArabic ? "\u062a\u0635\u0641\u064a\u0629 \u062d\u0633\u0628 \u0627\u0644\u062d\u0627\u0644\u0629" : "Filter by status"}
                  onValueChange={setDemoStatusFilter}
                  options={[
                    {
                      value: "all",
                      label: isArabic ? "\u0643\u0644 \u0627\u0644\u062d\u0627\u0644\u0627\u062a" : "All Statuses",
                    },
                    ...Object.entries(demoStatusLabels).map(([value, label]) => ({
                      value,
                      label,
                    })),
                  ]}
                  value={demoStatusFilter}
                />
              </div>
            </div>
            <span>
              {isArabic
                ? "\u0645\u062a\u0627\u0628\u0639\u0629 \u062c\u0645\u064a\u0639 \u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0646\u0633\u062e \u0627\u0644\u062a\u062c\u0631\u064a\u0628\u064a\u0629 \u0627\u0644\u0645\u062d\u0641\u0648\u0638\u0629"
                : "Track all saved demo requests"}
            </span>
            {demoListStatus ? (
              <small className="demo-list-status" role="status">
                {demoListStatus}
              </small>
            ) : null}
          </div>
        </div>
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>{isArabic ? "\u0627\u0644\u0639\u0645\u064a\u0644" : "Customer"}</th>
                <th>{isArabic ? "\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644" : "Mobile Number"}</th>
                <th>{isArabic ? "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0646\u0634\u0627\u0621" : "Created Date"}</th>
                <th>{isArabic ? "\u0627\u0644\u0634\u0631\u0643\u0629" : "Company"}</th>
                <th>{isArabic ? "\u0627\u0644\u0645\u0646\u062a\u062c" : "Product"}</th>
                <th>{isArabic ? "\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0646\u0633\u062e\u0629" : "Demo Details"}</th>
                <th>{isArabic ? "\u0627\u0644\u0645\u062a\u0628\u0642\u064a \u0639\u0644\u0649 \u0627\u0646\u062a\u0647\u0627\u0621 \u0627\u0644\u0646\u0633\u062e\u0629" : "Remaining Time"}</th>
                <th>{isArabic ? "\u0627\u0644\u062d\u0627\u0644\u0629" : "Status"}</th>
                <th>{isArabic ? "\u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredDemos.map((demo) => {
                const demoStatus = isDemoExpired(demo)
                  ? "completed"
                  : normalizeDemoStatus(demo.status);
                const product = (products.data ?? []).find(
                  (item) => Number(item.id) === Number(demo.product_id),
                );
                return (
                  <tr key={String(demo.id)}>
                    <td>
                      <strong>{String(demo.contact_name ?? "?")}</strong>
                    </td>
                    <td className="demo-phone-cell" dir="ltr">
                      {String(demo.phone ?? "?")}
                    </td>
                    <td className="demo-date-cell" dir="ltr">
                      {String(demo.created_at ?? "").slice(0, 10) || "?"}
                    </td>
                    <td>{String(demo.company_name ?? "?")}</td>
                    <td>
                      {String(
                        (isArabic
                          ? product?.name
                          : product?.name_en ?? product?.name) ?? "?",
                      )}
                    </td>
                    <td>{String(demo.requirements ?? "?")}</td>
                    <td>{demoRemainingTimeLabel(demo)}</td>
                    <td>
                      <div className={`demo-inline-status demo-status-${demoStatus}`}>
                        <span className="demo-status-readonly">
                          {demoStatusLabels[demoStatus] ?? demoStatus}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button
                        className="demo-activate-button"
                        disabled={demoStatus === "contacted" || demoStatus === "completed"}
                        onClick={() => void updateDemoStatus(demo.id, "contacted")}
                        type="button"
                      >
                        {demoStatus === "completed"
                          ? isArabic
                            ? "\u0645\u063a\u0644\u0642"
                            : "Closed"
                          : demoStatus === "contacted"
                          ? isArabic
                            ? "\u0646\u0634\u0637 \u0627\u0644\u0646\u0633\u062e\u0629"
                            : "Active"
                          : isArabic
                            ? "\u062a\u0646\u0634\u064a\u0637"
                            : "Activate"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredDemos.length === 0 ? (
                <tr>
                  <td className="demo-requests-empty" colSpan={9}>
                    {isArabic
                      ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0637\u0644\u0628\u0627\u062a \u062a\u062c\u0631\u064a\u0628\u064a\u0629 \u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u0644\u062d\u0627\u0644\u0629 \u0627\u0644\u0645\u062d\u062f\u062f\u0629"
                      : "No demo requests match the selected status"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
