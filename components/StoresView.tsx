"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";

import DashboardSelect from "@/components/DashboardSelect";
import { createBackend, useBackend } from "@/lib/client-backend";

type BackendRow = Record<string, unknown> & { id: number };

const emptyStoreDraft = {
  company_name: "",
  name: "",
  industry_id: "",
  email: "",
  phone: "",
  address: "",
  currency: "SAR",
};

const emptyStockDraft = {
  product_id: "",
  item_name: "",
  sku: "",
  quantity: "0",
  reorder_level: "0",
  unit_price: "",
  currency: "SAR",
  notes: "",
};

export default function StoresView() {
  const isArabic = useLocale() === "ar";
  const stores = useBackend<BackendRow[]>("/api/v1/data/stores");
  const stock = useBackend<BackendRow[]>("/api/v1/data/stock");
  const industries = useBackend<BackendRow[]>("/api/v1/data/industries");
  const products = useBackend<BackendRow[]>("/api/v1/data/products");
  const [storeDraft, setStoreDraft] = useState(emptyStoreDraft);
  const [stockDraft, setStockDraft] = useState(emptyStockDraft);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [storeStatus, setStoreStatus] = useState("");
  const [stockStatus, setStockStatus] = useState("");

  useEffect(() => {
    if (!selectedStoreId && stores.data?.[0]?.id) {
      setSelectedStoreId(String(stores.data[0].id));
    }
  }, [selectedStoreId, stores.data]);

  const selectedStore = (stores.data ?? []).find(
    (item) => Number(item.id) === Number(selectedStoreId),
  );
  const selectedStock = useMemo(
    () =>
      (stock.data ?? []).filter(
        (item) => Number(item.store_id) === Number(selectedStoreId),
      ),
    [selectedStoreId, stock.data],
  );

  async function addStore() {
    if (!storeDraft.company_name.trim()) {
      setStoreStatus(
        isArabic ? "اسم المعرض أو المنشأة مطلوب" : "Store or company name is required",
      );
      return;
    }
    setStoreStatus(isArabic ? "جاري إنشاء المعرض..." : "Creating store...");
    try {
      const created = await createBackend<BackendRow>("stores", {
        ...storeDraft,
        industry_id: storeDraft.industry_id
          ? Number(storeDraft.industry_id)
          : null,
        stage: "active",
      });
      setStoreDraft(emptyStoreDraft);
      await stores.reload();
      setSelectedStoreId(String(created.id));
      setStoreStatus(isArabic ? "تم إنشاء المعرض" : "Store has been created");
    } catch {
      setStoreStatus(isArabic ? "تعذر إنشاء المعرض" : "Unable to create store");
    }
  }

  async function addStockItem() {
    if (!selectedStoreId) {
      setStockStatus(isArabic ? "اختر معرضًا أولًا" : "Select a store first");
      return;
    }
    if (!stockDraft.item_name.trim()) {
      setStockStatus(isArabic ? "اسم الصنف مطلوب" : "Item name is required");
      return;
    }
    setStockStatus(isArabic ? "جاري إضافة المخزون..." : "Adding stock...");
    try {
      await createBackend("stock", {
        store_id: Number(selectedStoreId),
        product_id: stockDraft.product_id
          ? Number(stockDraft.product_id)
          : null,
        item_name: stockDraft.item_name.trim(),
        sku: stockDraft.sku.trim() || null,
        quantity: Number(stockDraft.quantity || 0),
        reorder_level: Number(stockDraft.reorder_level || 0),
        unit_price: stockDraft.unit_price
          ? Number(stockDraft.unit_price)
          : null,
        currency: stockDraft.currency,
        notes: stockDraft.notes.trim() || null,
      });
      setStockDraft(emptyStockDraft);
      await stock.reload();
      setStockStatus(isArabic ? "تمت إضافة المخزون" : "Stock has been added");
    } catch {
      setStockStatus(isArabic ? "تعذر إضافة المخزون" : "Unable to add stock");
    }
  }

  async function deleteStockItem(id: number) {
    setStockStatus(isArabic ? "جاري حذف الصنف..." : "Deleting item...");
    try {
      const response = await fetch(`/api/v1/data/stock/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("DELETE_FAILED");
      await stock.reload();
      setStockStatus(isArabic ? "تم حذف الصنف" : "Item has been deleted");
    } catch {
      setStockStatus(isArabic ? "تعذر حذف الصنف" : "Unable to delete item");
    }
  }

  const industryOptions = (industries.data ?? []).map((industry) => ({
    value: String(industry.id),
    label: String(
      industry[isArabic ? "name" : "name_en"] ?? industry.name ?? industry.id,
    ),
  }));
  const productOptions = (products.data ?? []).map((product) => ({
    value: String(product.id),
    label: String(
      product[isArabic ? "name" : "name_en"] ?? product.name ?? product.id,
    ),
  }));

  return (
    <div className="stores-workspace">
      <section className="stores-page-head">
        <div>
          <span>{isArabic ? "إدارة المعارض والمخزون" : "Stores & Stock Management"}</span>
          <h1>{isArabic ? "المعارض" : "Stores"}</h1>
          <p>
            {isArabic
              ? "أضف بيانات المعارض وتابع المخزون المرتبط بكل معرض."
              : "Add store details and manage the stock linked to each store."}
          </p>
        </div>
        <b>{(stores.data ?? []).length}</b>
      </section>

      <section className="stores-card">
        <div className="stores-section-title">
          <div>
            <span>{isArabic ? "بيانات المعرض" : "Store Details"}</span>
            <h2>{isArabic ? "إضافة معرض جديد" : "Add New Store"}</h2>
          </div>
        </div>
        <div className="stores-form-grid">
          <label>
            <span>{isArabic ? "اسم المعرض أو المنشأة *" : "Store or Company Name *"}</span>
            <input
              onChange={(event) =>
                setStoreDraft((current) => ({ ...current, company_name: event.target.value }))
              }
              value={storeDraft.company_name}
            />
          </label>
          <label>
            <span>{isArabic ? "اسم المسؤول" : "Contact Name"}</span>
            <input
              onChange={(event) =>
                setStoreDraft((current) => ({ ...current, name: event.target.value }))
              }
              value={storeDraft.name}
            />
          </label>
          <label>
            <span>{isArabic ? "النشاط" : "Activity"}</span>
            <DashboardSelect
              ariaLabel={isArabic ? "النشاط" : "Activity"}
              onValueChange={(value) =>
                setStoreDraft((current) => ({ ...current, industry_id: value }))
              }
              options={industryOptions}
              placeholder={isArabic ? "اختر النشاط" : "Select activity"}
              searchable
              value={storeDraft.industry_id}
            />
          </label>
          <label>
            <span>{isArabic ? "رقم الجوال" : "Mobile Number"}</span>
            <input
              dir="ltr"
              onChange={(event) =>
                setStoreDraft((current) => ({ ...current, phone: event.target.value }))
              }
              value={storeDraft.phone}
            />
          </label>
          <label>
            <span>{isArabic ? "البريد الإلكتروني" : "Email"}</span>
            <input
              dir="ltr"
              onChange={(event) =>
                setStoreDraft((current) => ({ ...current, email: event.target.value }))
              }
              type="email"
              value={storeDraft.email}
            />
          </label>
          <label>
            <span>{isArabic ? "العنوان" : "Address"}</span>
            <input
              onChange={(event) =>
                setStoreDraft((current) => ({ ...current, address: event.target.value }))
              }
              value={storeDraft.address}
            />
          </label>
        </div>
        <div className="stores-actions">
          <button onClick={() => void addStore()} type="button">
            {isArabic ? "إضافة المعرض" : "Add Store"}
          </button>
          {storeStatus ? <p role="status">{storeStatus}</p> : null}
        </div>
      </section>

      <section className="stores-card">
        <div className="stores-section-title">
          <div>
            <span>{isArabic ? "قائمة المعارض" : "Stores List"}</span>
            <h2>{isArabic ? "المعارض المسجلة" : "Registered Stores"}</h2>
          </div>
        </div>
        <div className="stores-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{isArabic ? "اسم المعرض" : "Store Name"}</th>
                <th>{isArabic ? "المسؤول" : "Contact"}</th>
                <th>{isArabic ? "الجوال" : "Mobile"}</th>
                <th>{isArabic ? "العنوان" : "Address"}</th>
                <th>{isArabic ? "عدد الأصناف" : "Stock Items"}</th>
                <th>{isArabic ? "إجراء" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {(stores.data ?? []).map((item) => {
                const itemCount = (stock.data ?? []).filter(
                  (entry) => Number(entry.store_id) === Number(item.id),
                ).length;
                return (
                  <tr className={Number(selectedStoreId) === item.id ? "selected" : ""} key={item.id}>
                    <td><strong>{String(item.company_name ?? "—")}</strong></td>
                    <td>{String(item.name ?? "").trim() || "—"}</td>
                    <td dir="ltr">{String(item.phone ?? "").trim() || "—"}</td>
                    <td>{String(item.address ?? "").trim() || "—"}</td>
                    <td>{itemCount.toLocaleString("en-US")}</td>
                    <td>
                      <button
                        className="stores-outline-button"
                        onClick={() => setSelectedStoreId(String(item.id))}
                        type="button"
                      >
                        {isArabic ? "إدارة المخزون" : "Manage Stock"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!stores.loading && !(stores.data ?? []).length ? (
                <tr><td colSpan={6}>{isArabic ? "لا توجد معارض بعد" : "No stores yet"}</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="stores-card stock-management-card">
        <div className="stores-section-title">
          <div>
            <span>{isArabic ? "المخزون" : "Stock"}</span>
            <h2>
              {selectedStore
                ? `${isArabic ? "مخزون" : "Stock of"} ${String(selectedStore.company_name ?? "")}`
                : isArabic ? "اختر معرضًا لإدارة مخزونه" : "Select a store to manage stock"}
            </h2>
          </div>
        </div>
        <div className="stores-form-grid stock-form-grid">
          <label>
            <span>{isArabic ? "المنتج" : "Product"}</span>
            <DashboardSelect
              ariaLabel={isArabic ? "المنتج" : "Product"}
              onValueChange={(value) => {
                const product = (products.data ?? []).find(
                  (item) => Number(item.id) === Number(value),
                );
                setStockDraft((current) => ({
                  ...current,
                  product_id: value,
                  item_name: String(
                    product?.[isArabic ? "name" : "name_en"] ?? product?.name ?? current.item_name,
                  ),
                  unit_price:
                    product?.base_price == null
                      ? current.unit_price
                      : String(product.base_price),
                  currency: String(product?.currency ?? current.currency),
                }));
              }}
              options={productOptions}
              placeholder={isArabic ? "اختر منتجًا" : "Select product"}
              searchable
              value={stockDraft.product_id}
            />
          </label>
          <label>
            <span>{isArabic ? "اسم الصنف *" : "Item Name *"}</span>
            <input
              onChange={(event) =>
                setStockDraft((current) => ({ ...current, item_name: event.target.value }))
              }
              value={stockDraft.item_name}
            />
          </label>
          <label>
            <span>{isArabic ? "رمز الصنف" : "SKU"}</span>
            <input
              dir="ltr"
              onChange={(event) =>
                setStockDraft((current) => ({ ...current, sku: event.target.value }))
              }
              value={stockDraft.sku}
            />
          </label>
          <label>
            <span>{isArabic ? "الكمية" : "Quantity"}</span>
            <input min="0" onChange={(event) => setStockDraft((current) => ({ ...current, quantity: event.target.value }))} type="number" value={stockDraft.quantity} />
          </label>
          <label>
            <span>{isArabic ? "حد إعادة الطلب" : "Reorder Level"}</span>
            <input min="0" onChange={(event) => setStockDraft((current) => ({ ...current, reorder_level: event.target.value }))} type="number" value={stockDraft.reorder_level} />
          </label>
          <label>
            <span>{isArabic ? "سعر الوحدة" : "Unit Price"}</span>
            <input min="0" onChange={(event) => setStockDraft((current) => ({ ...current, unit_price: event.target.value }))} type="number" value={stockDraft.unit_price} />
          </label>
          <label className="stores-wide-field">
            <span>{isArabic ? "ملاحظات المخزون" : "Stock Notes"}</span>
            <textarea onChange={(event) => setStockDraft((current) => ({ ...current, notes: event.target.value }))} value={stockDraft.notes} />
          </label>
        </div>
        <div className="stores-actions">
          <button disabled={!selectedStoreId} onClick={() => void addStockItem()} type="button">
            {isArabic ? "إضافة إلى المخزون" : "Add to Stock"}
          </button>
          {stockStatus ? <p role="status">{stockStatus}</p> : null}
        </div>
        <div className="stores-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{isArabic ? "الصنف" : "Item"}</th>
                <th>{isArabic ? "الرمز" : "SKU"}</th>
                <th>{isArabic ? "الكمية" : "Quantity"}</th>
                <th>{isArabic ? "حد الطلب" : "Reorder Level"}</th>
                <th>{isArabic ? "سعر الوحدة" : "Unit Price"}</th>
                <th>{isArabic ? "ملاحظات" : "Notes"}</th>
                <th>{isArabic ? "إجراء" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {selectedStock.map((item) => (
                <tr key={item.id}>
                  <td><strong>{String(item.item_name ?? "—")}</strong></td>
                  <td dir="ltr">{String(item.sku ?? "").trim() || "—"}</td>
                  <td>{Number(item.quantity ?? 0).toLocaleString("en-US")}</td>
                  <td>{Number(item.reorder_level ?? 0).toLocaleString("en-US")}</td>
                  <td dir="ltr">{item.unit_price == null ? "—" : `${String(item.currency ?? "SAR")} ${Number(item.unit_price).toLocaleString("en-US")}`}</td>
                  <td>{String(item.notes ?? "").trim() || "—"}</td>
                  <td><button className="stores-delete-button" onClick={() => void deleteStockItem(item.id)} type="button">{isArabic ? "حذف" : "Delete"}</button></td>
                </tr>
              ))}
              {selectedStoreId && !selectedStock.length ? (
                <tr><td colSpan={7}>{isArabic ? "لا يوجد مخزون لهذا المعرض" : "No stock for this store"}</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
