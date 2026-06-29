"use client";

import { useLocale, useTranslations } from "next-intl";
import { Fragment, useEffect, useRef, useState } from "react";
import DashboardSelect from "@/components/DashboardSelect";
import LeadRequestForm from "@/components/LeadRequestForm";
import { createBackend, useBackend } from "@/lib/client-backend";

type BackendRow = Record<string, unknown> & { id: number };
const NUMBER_LOCALE = "en-US";
const ARABIC_DATE_LOCALE = "ar-SA-u-ca-gregory-nu-latn";

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
  const data = leads.data;
  const { data: industries } = useBackend<BackendRow[]>(
    "/api/v1/data/industries",
  );
  const [editingLead, setEditingLead] = useState<BackendRow | null>(null);
  const [customerView, setCustomerView] = useState<"table" | "kanban">("table");
  const [customerSearch, setCustomerSearch] = useState("");
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
  const normalizedSearch = customerSearch.trim().toLocaleLowerCase();
  const filteredCustomers = (data ?? []).filter((row) => {
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
  });

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
      await createBackend("lead-contacts", {
        lead_id: contactsLead.id,
        name: contactDraft.name.trim(),
        phone: contactDraft.phone.trim() || null,
        email: contactDraft.email.trim() || null,
        job_title: contactDraft.job_title.trim() || null,
      });
      setContactDraft({ name: "", phone: "", email: "", job_title: "" });
      await contacts.reload();
      setContactStatus(
        isArabic ? "\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u062c\u0647\u0629 \u0627\u0644\u0627\u062a\u0635\u0627\u0644" : "Contact has been added",
      );
    } catch {
      setContactStatus(
        isArabic ? "\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u062c\u0647\u0629 \u0627\u0644\u0627\u062a\u0635\u0627\u0644" : "Unable to save contact",
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
  }

  async function saveLeadTag() {
    if (!tagsLead) return;
    if (!tagDraft.tag_id && !tagDraft.tag_name.trim()) {
      setTagStatus(
        isArabic ? "اختر وسمًا موجودًا أو اكتب وسمًا جديدًا" : "Select an existing tag or write a new tag",
      );
      return;
    }
    if (
      !tagDraft.tag_id &&
      !tagDraft.tag_type_id &&
      !tagDraft.type_name.trim()
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
      let tagTypeId = tagDraft.tag_type_id ? Number(tagDraft.tag_type_id) : null;
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
      let tag = (leadTags.data ?? []).find(
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
        tag =
          (leadTags.data ?? []).find(
            (item) =>
              String(item.tag_name ?? "").trim().toLocaleLowerCase() ===
              normalizedTagName.toLocaleLowerCase(),
          ) ??
          (await createBackend<BackendRow>("lead-tags", {
            ...(tagTypeId ? { tag_type_id: tagTypeId } : {}),
            tag_name: normalizedTagName,
            tag_color: tagDraft.tag_color,
          }));
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
    const customerAssignments = (leadTagAssignments.data ?? []).filter(
      (assignment) => Number(assignment.lead_id) === Number(tagsLead.id),
    );
    const assignedTagIds = new Set(
      customerAssignments.map((assignment) => Number(assignment.tag_id)),
    );
    const assignedTagTypeIds = new Set(
      customerAssignments
        .map((assignment) => {
          const tag = (leadTags.data ?? []).find(
            (item) => Number(item.id) === Number(assignment.tag_id),
          );
          return Number(tag?.tag_type_id);
        })
        .filter((typeId) => Number.isInteger(typeId) && typeId > 0),
    );
    const availableTagTypes = leadTagTypes.data ?? [];
    const selectedTagTypeId = tagDraft.tag_type_id ? Number(tagDraft.tag_type_id) : null;
    const availableTags = (leadTags.data ?? []).filter((tag) => {
      if (assignedTagIds.has(Number(tag.id))) return false;
      if (assignedTagTypeIds.has(Number(tag.tag_type_id))) return false;
      if (!selectedTagTypeId) return true;
      return Number(tag.tag_type_id) === selectedTagTypeId;
    });

    return (
      <article className="table-card expanded-table-card lead-tags-screen">
        <div className="customer-edit-modal-head">
          <div>
            <span>{isArabic ? "وسوم العميل" : "Customer Tags"}</span>
            <h3>{String(tagsLead.name ?? tagsLead.company_name ?? "?")}</h3>
          </div>
          <button
            aria-label={isArabic ? "الرجوع" : "Back"}
            onClick={() => setTagsLead(null)}
            type="button"
          >
            {isArabic ? "رجوع" : "Back"}
          </button>
        </div>

        <div className="lead-contacts-form lead-tags-form">
          <label>
            <span>{isArabic ? "اختيار نوع الوسم" : "Select Tag Type"}</span>
            <DashboardSelect
              ariaLabel={isArabic ? "اختيار نوع الوسم" : "Select tag type"}
              onValueChange={(value) =>
                setTagDraft((current) => ({
                  ...current,
                  tag_type_id: value,
                  type_name: "",
                  tag_id: "",
                }))
              }
              options={availableTagTypes.map((type) => ({
                value: String(type.id),
                label: String(type.type_name ?? type.id),
                disabled: assignedTagTypeIds.has(Number(type.id)),
              }))}
              placeholder={
                availableTagTypes.length
                  ? isArabic
                    ? "اختر مجموعة الوسم"
                    : "Choose tag group"
                  : isArabic
                    ? "لا توجد مجموعات بعد"
                    : "No groups yet"
              }
              searchable
              searchPlaceholder={
                isArabic ? "ابحث عن نوع الوسم..." : "Search tag types..."
              }
              value={tagDraft.tag_type_id}
            />
          </label>
          <label>
            <span>{isArabic ? "أو اكتب نوعًا جديدًا" : "Or Create New Type"}</span>
            <input
              onChange={(event) =>
                setTagDraft((current) => ({
                  ...current,
                  tag_type_id: "",
                  type_name: event.target.value,
                  tag_id: "",
                }))
              }
              placeholder={isArabic ? "مثال: مرحلة العميل" : "Example: Customer stage"}
              type="text"
              value={tagDraft.type_name}
            />
          </label>
          <label>
            <span>{isArabic ? "لون نوع الوسم" : "Type Color"}</span>
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
          <label>
            <span>{isArabic ? "اختيار وسم موجود" : "Select Existing Tag"}</span>
            <DashboardSelect
              ariaLabel={isArabic ? "اختيار وسم موجود" : "Select existing tag"}
              onValueChange={(value) =>
                setTagDraft((current) => ({
                  ...current,
                  tag_id: value,
                  tag_name: "",
                }))
              }
              options={availableTags.map((tag) => ({
                value: String(tag.id),
                label: (() => {
                  const tagType = availableTagTypes.find(
                    (type) => Number(type.id) === Number(tag.tag_type_id),
                  );
                  return tagType
                    ? `${String(tag.tag_name ?? tag.id)} · ${String(tagType.type_name ?? "")}`
                    : String(tag.tag_name ?? tag.id);
                })(),
              }))}
              placeholder={
                availableTags.length
                  ? isArabic
                    ? "اختر من الوسوم الموجودة"
                    : "Choose from existing tags"
                  : isArabic
                    ? "لا توجد وسوم متاحة"
                    : "No available tags"
              }
              searchable
              searchPlaceholder={isArabic ? "ابحث عن وسم..." : "Search tags..."}
              value={tagDraft.tag_id}
            />
          </label>
          <label>
            <span>{isArabic ? "أو اكتب وسمًا جديدًا" : "Or Create New Tag"}</span>
            <input
              onChange={(event) =>
                setTagDraft((current) => ({
                  ...current,
                  tag_id: "",
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
                <th>{isArabic ? "الوسم" : "Tag"}</th>
                <th>{isArabic ? "نوع الوسم" : "Tag Type"}</th>
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
                      <span
                        className="lead-tag-pill"
                        style={{ borderColor: tagColor, color: tagColor }}
                      >
                        {String(tag?.tag_name ?? "?")}
                      </span>
                    </td>
                    <td>
                      {tagType ? (
                        <span
                          className="lead-tag-pill lead-tag-type-pill"
                          style={{ borderColor: tagTypeColor, color: tagTypeColor }}
                        >
                          {String(tagType.type_name ?? "?")}
                        </span>
                      ) : (
                        "—"
                      )}
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
      </article>
    );
  }

  if (notesLead) {
    const customerNotes = (leadNotes.data ?? [])
      .filter((note) => Number(note.lead_id) === Number(notesLead.id))
      .sort(
        (first, second) =>
          new Date(String(second.created_at ?? "")).getTime() -
          new Date(String(first.created_at ?? "")).getTime(),
      );

    return (
      <article className="table-card expanded-table-card lead-notes-screen">
        <div className="customer-edit-modal-head">
          <div>
            <span>{isArabic ? "\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0627\u0644\u0639\u0645\u064a\u0644" : "Customer Notes"}</span>
            <h3>{String(notesLead.name ?? notesLead.company_name ?? "?")}</h3>
          </div>
          <button
            aria-label={isArabic ? "\u0627\u0644\u0631\u062c\u0648\u0639" : "Back"}
            onClick={() => setNotesLead(null)}
            type="button"
          >
            {isArabic ? "\u0631\u062c\u0648\u0639" : "Back"}
          </button>
        </div>

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
    const leadContacts = (contacts.data ?? []).filter(
      (contact) => Number(contact.lead_id) === Number(contactsLead.id),
    );

    return (
      <article className="table-card expanded-table-card lead-contacts-screen">
        <div className="customer-edit-modal-head">
          <div>
            <span>{isArabic ? "\u062c\u0647\u0627\u062a \u0627\u0644\u0627\u062a\u0635\u0627\u0644" : "Contacts"}</span>
            <h3>{String(contactsLead.name ?? contactsLead.company_name ?? "?")}</h3>
          </div>
          <button
            aria-label={isArabic ? "\u0627\u0644\u0631\u062c\u0648\u0639" : "Back"}
            onClick={() => setContactsLead(null)}
            type="button"
          >
            {isArabic ? "\u0631\u062c\u0648\u0639" : "Back"}
          </button>
        </div>

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
            {isArabic ? "\u0625\u0636\u0627\u0641\u0629 \u062c\u0647\u0629 \u0627\u062a\u0635\u0627\u0644" : "Add Contact"}
          </button>
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
              </tr>
            </thead>
            <tbody>
              {leadContacts.map((contact) => (
                <tr key={contact.id}>
                  <td>{String(contact.name ?? "?")}</td>
                  <td dir="ltr">{String(contact.phone ?? "?")}</td>
                  <td dir="ltr">{String(contact.email ?? "?")}</td>
                  <td>{String(contact.job_title ?? "?")}</td>
                </tr>
              ))}
              {leadContacts.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    {isArabic
                      ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u062c\u0647\u0627\u062a \u0627\u062a\u0635\u0627\u0644 \u0645\u0631\u062a\u0628\u0637\u0629 \u0628\u0647\u0630\u0627 \u0627\u0644\u0639\u0645\u064a\u0644"
                      : "No contacts linked to this customer"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
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
            <h3>{String(leadEditDraft.name || editingLead.name || "?")}</h3>
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
            <strong>{String(editingLead.source ?? "?")}</strong>
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
                <th>{isArabic ? "النشاط" : "Activity"}</th>
                <th>{isArabic ? "الحالة" : "Status"}</th>
                <th>{isArabic ? "الاسم" : "Name"}</th>
                <th>
                  {isArabic
                    ? "\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644"
                    : "Mobile Number"}
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
              {filteredCustomers.map((row) => {
                const rowTagAssignments = (leadTagAssignments.data ?? []).filter(
                  (assignment) => Number(assignment.lead_id) === Number(row.id),
                );
                const rowTags = rowTagAssignments
                  .map((assignment) =>
                    (leadTags.data ?? []).find(
                      (tag) => Number(tag.id) === Number(assignment.tag_id),
                    ),
                  )
                  .filter(Boolean);
                return (
                  <Fragment key={row.id}>
                    <tr>
                    <td>{String(row.company_name ?? "?")}</td>
                    <td>
                      {String(
                        industries?.find(
                          (industry) =>
                            Number(industry.id) === Number(row.industry_id),
                        )?.[isArabic ? "name" : "name_en"] ??
                          industries?.find(
                            (industry) =>
                              Number(industry.id) === Number(row.industry_id),
                          )?.name ??
                          "?",
                      )}
                    </td>
                    <td>
                      <span className={`badge ${String(row.stage ?? "new")}`}>
                        {stageLabels[String(row.stage ?? "new")]?.[
                          isArabic ? "ar" : "en"
                        ] ?? String(row.stage ?? "new")}
                      </span>
                    </td>
                    <td>{String(row.name ?? "?")}</td>
                    <td dir="ltr">{String(row.phone ?? "?")}</td>
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
                                {String(tag?.tag_name ?? "?")}
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
                          className="customer-row-edit-button"
                          onClick={() => openLeadEditor(row)}
                          type="button"
                        >
                          {isArabic ? "\u062a\u0639\u062f\u064a\u0644" : "Edit"}
                        </button>
                        <button
                          className="customer-row-edit-button customer-row-contacts-button"
                          onClick={() => openLeadContacts(row)}
                          type="button"
                        >
                          {isArabic ? "جهات الاتصال" : "Contacts"}
                        </button>
                        <button
                          className="customer-row-edit-button customer-row-notes-button"
                          onClick={() => openLeadNotes(row)}
                          type="button"
                        >
                          {isArabic ? "ملاحظات" : "Notes"}
                        </button>
                        <button
                          className="customer-row-edit-button customer-row-tags-button"
                          onClick={() => openLeadTags(row)}
                          type="button"
                        >
                          {isArabic ? "وسوم" : "Tags"}
                        </button>
                      </div>
                    </td>
                    </tr>
                  </Fragment>
                );
              })}
              {filteredCustomers.length === 0 ? (
                <tr className="customer-search-empty-row">
                  <td colSpan={7}>
                    {isArabic
                      ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c \u0645\u0637\u0627\u0628\u0642\u0629"
                      : "No matching customers"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
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
              const stageLeads = filteredCustomers.filter(
                (row) => String(row.stage ?? "new") === stage,
              );
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
                            <strong>{String(row.name ?? "?")}</strong>
                            <span>{String(row.company_name ?? "?")}</span>
                          </div>
                          <button
                            onClick={() => openLeadEditor(row)}
                            type="button"
                          >
                            {isArabic
                              ? "\u062a\u0639\u062f\u064a\u0644"
                              : "Edit"}
                          </button>
                          <button
                            onClick={() => openLeadContacts(row)}
                            type="button"
                          >
                            {isArabic ? "\u062c\u0647\u0627\u062a \u0627\u0644\u0627\u062a\u0635\u0627\u0644" : "Contacts"}
                          </button>
                          <button
                            onClick={() => openLeadNotes(row)}
                            type="button"
                          >
                            {isArabic ? "\u0645\u0644\u0627\u062d\u0638\u0627\u062a" : "Notes"}
                          </button>
                          <button
                            onClick={() => openLeadTags(row)}
                            type="button"
                          >
                            {isArabic ? "وسوم" : "Tags"}
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
  const liveImages = (data ?? []).filter((item) => item.asset_type !== "video");
  const liveVideos = (data ?? []).filter((item) => item.asset_type === "video");

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
  const approvedTotal = (data ?? [])
    .filter((row) => row.status === "approved")
    .reduce((sum, row) => sum + Number(row.commission_amount ?? 0), 0);
  const pending = (data ?? [])
    .filter((row) => row.status === "pending")
    .reduce((sum, row) => sum + Number(row.commission_amount ?? 0), 0);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const paidThisMonth = (data ?? [])
    .filter((row) => {
      if (row.status !== "paid") return false;
      const paidDate = new Date(String(row.paid_at ?? row.created_at ?? ""));
      return (
        !Number.isNaN(paidDate.getTime()) &&
        paidDate.getMonth() === currentMonth &&
        paidDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, row) => sum + Number(row.commission_amount ?? 0), 0);
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
  const matchingCustomers = (leads.data ?? [])
    .filter((lead) =>
      [lead.name, lead.company_name, lead.phone, lead.email].some((value) =>
        String(value ?? "").toLocaleLowerCase().includes(normalizedCustomerQuery),
      ),
    )
    .slice(0, 8);
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
  const filteredDemos = (demos.data ?? []).filter(
    (demo) =>
      demoStatusFilter === "all" ||
      (isDemoExpired(demo) ? "completed" : normalizeDemoStatus(demo.status)) ===
        demoStatusFilter,
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
                          `${String(lead.name ?? "?")} - ${String(lead.company_name ?? "?")}`,
                        );
                        setCustomerMenuOpen(false);
                      }}
                      role="option"
                      type="button"
                    >
                      <span>
                        <strong>{String(lead.name ?? "?")}</strong>
                        <small>{String(lead.company_name ?? "?")}</small>
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
