"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";

import DashboardSelect from "@/components/DashboardSelect";
import { createBackend, updateBackend, useBackend } from "@/lib/client-backend";

type BackendRow = Record<string, unknown> & { id: number };

type StockDraft = {
  product_id: string;
  item_name: string;
  sku: string;
  quantity: string;
  reorder_level: string;
  unit_price: string;
  currency: string;
  notes: string;
};

const emptyStockDraft: StockDraft = {
  product_id: "",
  item_name: "",
  sku: "",
  quantity: "0",
  reorder_level: "0",
  unit_price: "",
  currency: "SAR",
  notes: "",
};

const stockDraftFromRow = (row: BackendRow): StockDraft => ({
  product_id: row.product_id == null ? "" : String(row.product_id),
  item_name: String(row.item_name ?? ""),
  sku: String(row.sku ?? ""),
  quantity: String(row.quantity ?? "0"),
  reorder_level: String(row.reorder_level ?? "0"),
  unit_price: row.unit_price == null ? "" : String(row.unit_price),
  currency: String(row.currency ?? "SAR"),
  notes: String(row.notes ?? ""),
});

function stockPayload(storeId: string, draft: StockDraft) {
  return {
    store_id: Number(storeId),
    product_id: draft.product_id ? Number(draft.product_id) : null,
    item_name: draft.item_name.trim(),
    sku: draft.sku.trim() || null,
    quantity: Number(draft.quantity || 0),
    reorder_level: Number(draft.reorder_level || 0),
    unit_price: draft.unit_price ? Number(draft.unit_price) : null,
    currency: draft.currency || "SAR",
    notes: draft.notes.trim() || null,
  };
}

export default function StockEditView({ storeId }: { storeId: string }) {
  const isArabic = useLocale() === "ar";
  const stores = useBackend<BackendRow[]>("/api/v1/data/stores");
  const stock = useBackend<BackendRow[]>("/api/v1/data/stock");
  const products = useBackend<BackendRow[]>("/api/v1/data/products");
  const [newDraft, setNewDraft] = useState(emptyStockDraft);
  const [editDrafts, setEditDrafts] = useState<Record<number, StockDraft>>({});
  const [status, setStatus] = useState("");

  const selectedStore = (stores.data ?? []).find(
    (store) => Number(store.id) === Number(storeId),
  );

  const selectedStock = useMemo(
    () =>
      (stock.data ?? []).filter(
        (item) => Number(item.store_id) === Number(storeId),
      ),
    [stock.data, storeId],
  );

  useEffect(() => {
    setEditDrafts((current) => {
      const next = { ...current };
      for (const item of selectedStock) {
        if (!next[item.id]) next[item.id] = stockDraftFromRow(item);
      }
      return next;
    });
  }, [selectedStock]);

  const productOptions = (products.data ?? []).map((product) => ({
    value: String(product.id),
    label: String(
      product[isArabic ? "name" : "name_en"] ?? product.name ?? product.id,
    ),
  }));

  function applyProductToDraft(
    value: string,
    setter: (updater: (current: StockDraft) => StockDraft) => void,
  ) {
    const product = (products.data ?? []).find(
      (item) => Number(item.id) === Number(value),
    );
    setter((current) => ({
      ...current,
      product_id: value,
      item_name: String(
        product?.[isArabic ? "name" : "name_en"] ?? product?.name ?? current.item_name,
      ),
      unit_price:
        product?.base_price == null ? current.unit_price : String(product.base_price),
      currency: String(product?.currency ?? current.currency),
    }));
  }

  async function addStockItem() {
    if (!newDraft.item_name.trim()) {
      setStatus(isArabic ? "اسم الصنف مطلوب" : "Item name is required");
      return;
    }
    setStatus(isArabic ? "جاري إضافة الصنف..." : "Adding item...");
    try {
      await createBackend("stock", stockPayload(storeId, newDraft));
      setNewDraft(emptyStockDraft);
      await stock.reload();
      setStatus(isArabic ? "تمت إضافة الصنف" : "Item has been added");
    } catch {
      setStatus(isArabic ? "تعذر إضافة الصنف" : "Unable to add item");
    }
  }

  async function saveStockItem(id: number) {
    const draft = editDrafts[id];
    if (!draft?.item_name.trim()) {
      setStatus(isArabic ? "اسم الصنف مطلوب" : "Item name is required");
      return;
    }
    setStatus(isArabic ? "جاري حفظ التعديل..." : "Saving changes...");
    try {
      await updateBackend("stock", id, stockPayload(storeId, draft));
      await stock.reload();
      setStatus(isArabic ? "تم حفظ تعديل المخزون" : "Stock changes have been saved");
    } catch {
      setStatus(isArabic ? "تعذر حفظ التعديل" : "Unable to save changes");
    }
  }

  async function deleteStockItem(id: number) {
    setStatus(isArabic ? "جاري حذف الصنف..." : "Deleting item...");
    try {
      const response = await fetch(`/api/v1/data/stock/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("DELETE_FAILED");
      setEditDrafts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      await stock.reload();
      setStatus(isArabic ? "تم حذف الصنف" : "Item has been deleted");
    } catch {
      setStatus(isArabic ? "تعذر حذف الصنف" : "Unable to delete item");
    }
  }

  const backHref = `/${isArabic ? "ar" : "en"}/dashboard/stores`;

  return (
    <div className="stores-workspace">
      <section className="stores-page-head">
        <div>
          <span>{isArabic ? "تعديل المخزون" : "Stock Editing"}</span>
          <h1>
            {selectedStore
              ? String(selectedStore.company_name ?? "")
              : isArabic ? "المعرض غير موجود" : "Store not found"}
          </h1>
          <p>
            {isArabic
              ? "عدّل أصناف المخزون والكميات والأسعار الخاصة بهذا المعرض."
              : "Edit stock items, quantities, and prices for this store."}
          </p>
        </div>
        <Link className="stores-outline-button stores-page-link" href={backHref}>
          {isArabic ? "رجوع للمعارض" : "Back to stores"}
        </Link>
      </section>

      <section className="stores-card">
        <div className="stores-section-title">
          <div>
            <span>{isArabic ? "إضافة صنف" : "Add Item"}</span>
            <h2>{isArabic ? "صنف جديد في المخزون" : "New Stock Item"}</h2>
          </div>
        </div>
        <div className="stores-form-grid stock-form-grid">
          <label>
            <span>{isArabic ? "المنتج" : "Product"}</span>
            <DashboardSelect
              ariaLabel={isArabic ? "المنتج" : "Product"}
              onValueChange={(value) => applyProductToDraft(value, setNewDraft)}
              options={productOptions}
              placeholder={isArabic ? "اختر منتجًا" : "Select product"}
              searchable
              value={newDraft.product_id}
            />
          </label>
          <StockFields draft={newDraft} isArabic={isArabic} setDraft={setNewDraft} />
        </div>
        <div className="stores-actions">
          <button disabled={!selectedStore} onClick={() => void addStockItem()} type="button">
            {isArabic ? "إضافة للمخزون" : "Add to Stock"}
          </button>
          {status ? <p role="status">{status}</p> : null}
        </div>
      </section>

      <section className="stores-card">
        <div className="stores-section-title">
          <div>
            <span>{isArabic ? "الأصناف الحالية" : "Current Items"}</span>
            <h2>{isArabic ? "تعديل المخزون" : "Edit Stock"}</h2>
          </div>
          <b>{selectedStock.length.toLocaleString("en-US")}</b>
        </div>

        <div className="stock-edit-list">
          {selectedStock.map((item) => {
            const draft = editDrafts[item.id] ?? stockDraftFromRow(item);
            const setDraft = (updater: (current: StockDraft) => StockDraft) =>
              setEditDrafts((current) => ({
                ...current,
                [item.id]: updater(current[item.id] ?? stockDraftFromRow(item)),
              }));

            return (
              <article className="stock-edit-item" key={item.id}>
                <div className="stores-section-title">
                  <div>
                    <span>{String(item.sku ?? "").trim() || (isArabic ? "بدون رمز" : "No SKU")}</span>
                    <h2>{String(item.item_name ?? "")}</h2>
                  </div>
                </div>
                <div className="stores-form-grid stock-form-grid">
                  <label>
                    <span>{isArabic ? "المنتج" : "Product"}</span>
                    <DashboardSelect
                      ariaLabel={isArabic ? "المنتج" : "Product"}
                      onValueChange={(value) => applyProductToDraft(value, setDraft)}
                      options={productOptions}
                      placeholder={isArabic ? "اختر منتجًا" : "Select product"}
                      searchable
                      value={draft.product_id}
                    />
                  </label>
                  <StockFields draft={draft} isArabic={isArabic} setDraft={setDraft} />
                </div>
                <div className="stores-actions">
                  <button onClick={() => void saveStockItem(item.id)} type="button">
                    {isArabic ? "حفظ التعديل" : "Save Changes"}
                  </button>
                  <button
                    className="stores-delete-button"
                    onClick={() => void deleteStockItem(item.id)}
                    type="button"
                  >
                    {isArabic ? "حذف" : "Delete"}
                  </button>
                </div>
              </article>
            );
          })}
          {!stock.loading && selectedStore && !selectedStock.length ? (
            <p className="stock-edit-empty">
              {isArabic ? "لا يوجد مخزون لهذا المعرض بعد." : "No stock for this store yet."}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function StockFields({
  draft,
  isArabic,
  setDraft,
}: {
  draft: StockDraft;
  isArabic: boolean;
  setDraft: (updater: (current: StockDraft) => StockDraft) => void;
}) {
  return (
    <>
      <label>
        <span>{isArabic ? "اسم الصنف *" : "Item Name *"}</span>
        <input
          onChange={(event) =>
            setDraft((current) => ({ ...current, item_name: event.target.value }))
          }
          value={draft.item_name}
        />
      </label>
      <label>
        <span>{isArabic ? "رمز الصنف" : "SKU"}</span>
        <input
          dir="ltr"
          onChange={(event) =>
            setDraft((current) => ({ ...current, sku: event.target.value }))
          }
          value={draft.sku}
        />
      </label>
      <label>
        <span>{isArabic ? "الكمية" : "Quantity"}</span>
        <input
          min="0"
          onChange={(event) =>
            setDraft((current) => ({ ...current, quantity: event.target.value }))
          }
          type="number"
          value={draft.quantity}
        />
      </label>
      <label>
        <span>{isArabic ? "حد إعادة الطلب" : "Reorder Level"}</span>
        <input
          min="0"
          onChange={(event) =>
            setDraft((current) => ({ ...current, reorder_level: event.target.value }))
          }
          type="number"
          value={draft.reorder_level}
        />
      </label>
      <label>
        <span>{isArabic ? "سعر الوحدة" : "Unit Price"}</span>
        <input
          min="0"
          onChange={(event) =>
            setDraft((current) => ({ ...current, unit_price: event.target.value }))
          }
          type="number"
          value={draft.unit_price}
        />
      </label>
      <label className="stores-wide-field">
        <span>{isArabic ? "ملاحظات المخزون" : "Stock Notes"}</span>
        <textarea
          onChange={(event) =>
            setDraft((current) => ({ ...current, notes: event.target.value }))
          }
          value={draft.notes}
        />
      </label>
    </>
  );
}
