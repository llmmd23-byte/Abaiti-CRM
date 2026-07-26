"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { FLOOR_MAP_AREA_LABELS, FLOOR_MAP_ZONES, PPT_BOOTH_LAYOUT, floorMapZoneForBooth } from "@/components/AdminDashboard";
import DashboardSelect from "@/components/DashboardSelect";
import { createBackend, updateBackend, useBackend } from "@/lib/client-backend";

type BackendRow = Record<string, unknown> & { id: number };
const NUMBER_LOCALE = "en-US";
const ARABIC_DATE_LOCALE = "ar-SA-u-ca-gregory-nu-latn";
type UserTrendPeriod = "week" | "month" | "year";
type UserTrendGroup = "days" | "weeks" | "months" | "quarters";
type RentalBoothPosition = {
  id: string;
  area: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

const RENTAL_BOOTH_POSITIONS: RentalBoothPosition[] = [
  {id: "ST04", area: "25m?", left: 31.97, top: 19.89, width: 3.84, height: 7.32},
  {id: "ST03", area: "25m?", left: 39.66, top: 19.89, width: 3.84, height: 7.32},
  {id: "TP01", area: "36m?", left: 48.35, top: 19.89, width: 4.61, height: 8.79},
  {id: "ST02", area: "25m?", left: 57.34, top: 19.89, width: 3.84, height: 7.32},
  {id: "ST01", area: "25m?", left: 65.09, top: 19.89, width: 3.84, height: 7.32},
  {id: "FL1", area: "", left: 67.7, top: 31.65, width: 1.15, height: 2.93},
  {id: "FL24", area: "", left: 70.98, top: 31.65, width: 1.15, height: 2.93},
  {id: "RL3", area: "9m?", left: 65.97, top: 32.38, width: 2.31, height: 4.39},
  {id: "M25", area: "9m?", left: 31.49, top: 32.39, width: 2.31, height: 4.39},
  {id: "M19", area: "9m?", left: 33.79, top: 32.39, width: 2.31, height: 4.39},
  {id: "M13", area: "9m?", left: 38.4, top: 32.39, width: 2.31, height: 4.39},
  {id: "M05", area: "9m?", left: 40.71, top: 32.4, width: 2.31, height: 4.39},
  {id: "RL1", area: "18m?", left: 52.34, top: 32.47, width: 4.61, height: 4.39},
  {id: "RL2", area: "18m?", left: 60.8, top: 32.47, width: 4.61, height: 4.39},
  {id: "M33", area: "12m?", left: 27.47, top: 33.59, width: 3.07, height: 4.39},
  {id: "M01", area: "18m?", left: 45.81, top: 34.56, width: 2.31, height: 8.71},
  {id: "FL2", area: "", left: 67.7, top: 34.59, width: 1.15, height: 2.93},
  {id: "FL23", area: "", left: 70.98, top: 34.59, width: 1.15, height: 2.93},
  {id: "M26", area: "9m?", left: 31.49, top: 36.79, width: 2.31, height: 4.39},
  {id: "M20", area: "9m?", left: 33.79, top: 36.79, width: 2.31, height: 4.39},
  {id: "M14", area: "9m?", left: 38.4, top: 36.79, width: 2.31, height: 4.39},
  {id: "M06", area: "9m?", left: 40.71, top: 36.79, width: 2.31, height: 4.39},
  {id: "RL4", area: "9m?", left: 65.97, top: 36.79, width: 2.31, height: 4.39},
  {id: "FL3", area: "", left: 67.7, top: 37.52, width: 1.15, height: 2.93},
  {id: "FL22", area: "", left: 70.98, top: 37.52, width: 1.15, height: 2.93},
  {id: "M34", area: "12m?", left: 27.47, top: 39.45, width: 3.07, height: 4.39},
  {id: "FL4", area: "", left: 67.7, top: 40.46, width: 1.15, height: 2.93},
  {id: "FL21", area: "", left: 70.98, top: 40.46, width: 1.15, height: 2.93},
  {id: "RL34", area: "9m?", left: 55.8, top: 40.91, width: 2.34, height: 4.39},
  {id: "M29", area: "9m?", left: 31.49, top: 41.17, width: 2.31, height: 4.39},
  {id: "M07", area: "9m?", left: 40.71, top: 41.17, width: 2.31, height: 4.39},
  {id: "M21", area: "9m?", left: 33.79, top: 41.18, width: 2.31, height: 4.39},
  {id: "M15", area: "9m?", left: 38.4, top: 41.18, width: 2.31, height: 4.39},
  {id: "RL5", area: "9m?", left: 65.97, top: 41.19, width: 2.31, height: 4.39},
  {id: "FL5", area: "", left: 67.7, top: 43.4, width: 1.15, height: 2.93},
  {id: "FL20", area: "", left: 70.98, top: 43.4, width: 1.15, height: 2.93},
  {id: "RL6", area: "9m?", left: 65.97, top: 45.6, width: 2.31, height: 4.39},
  {id: "RL35", area: "12m?", left: 55.8, top: 46.06, width: 3.07, height: 4.39},
  {id: "RL32", area: "12m?", left: 51.19, top: 46.2, width: 3.07, height: 4.39},
  {id: "FL6", area: "", left: 67.7, top: 46.33, width: 1.15, height: 2.93},
  {id: "FL19", area: "", left: 70.98, top: 46.33, width: 1.15, height: 2.93},
  {id: "M02", area: "18m?", left: 45.81, top: 47.28, width: 2.31, height: 8.71},
  {id: "SB1", area: "", left: 26.88, top: 47.31, width: 1.15, height: 2.86},
  {id: "FL7", area: "", left: 67.7, top: 49.27, width: 1.15, height: 2.93},
  {id: "FL18", area: "", left: 70.98, top: 49.27, width: 1.15, height: 2.93},
  {id: "RL7", area: "9m?", left: 65.97, top: 50.01, width: 2.31, height: 4.39},
  {id: "M08", area: "12m?", left: 40.71, top: 50.7, width: 3.07, height: 4.39},
  {id: "SB2", area: "", left: 26.88, top: 50.78, width: 1.15, height: 2.86},
  {id: "RL36", area: "9m?", left: 55.8, top: 51.18, width: 2.29, height: 4.39},
  {id: "RL31", area: "9m?", left: 51.19, top: 51.32, width: 2.29, height: 4.39},
  {id: "FL8", area: "", left: 67.7, top: 52.21, width: 1.15, height: 2.93},
  {id: "FL17", area: "", left: 70.98, top: 52.21, width: 1.15, height: 2.93},
  {id: "SB3", area: "", left: 26.88, top: 53.88, width: 1.15, height: 2.86},
  {id: "RL8", area: "9m?", left: 65.97, top: 54.41, width: 2.31, height: 4.39},
  {id: "FL9", area: "", left: 67.7, top: 55.15, width: 1.15, height: 2.93},
  {id: "FL16", area: "", left: 70.98, top: 55.15, width: 1.15, height: 2.93},
  {id: "M09", area: "12m?", left: 40.71, top: 56.57, width: 3.07, height: 4.39},
  {id: "SB4", area: "", left: 26.88, top: 56.98, width: 1.15, height: 2.86},
  {id: "FL10", area: "", left: 67.7, top: 58.08, width: 1.15, height: 2.93},
  {id: "FL15", area: "", left: 70.98, top: 58.08, width: 1.15, height: 2.93},
  {id: "RL9", area: "9m?", left: 65.97, top: 58.82, width: 2.31, height: 4.39},
  {id: "RL29", area: "9m?", left: 54.26, top: 58.83, width: 2.31, height: 4.39},
  {id: "RL15", area: "9m?", left: 59.36, top: 58.83, width: 2.31, height: 4.39},
  {id: "RL13", area: "9m?", left: 61.72, top: 58.83, width: 2.31, height: 4.39},
  {id: "M03", area: "18m?", left: 45.81, top: 60.0, width: 4.57, height: 4.39},
  {id: "SB5", area: "", left: 26.88, top: 60.09, width: 1.15, height: 2.86},
  {id: "FL11", area: "", left: 67.7, top: 61.02, width: 1.15, height: 2.93},
  {id: "FL14", area: "", left: 70.98, top: 61.02, width: 1.15, height: 2.93},
  {id: "SB6", area: "", left: 26.88, top: 63.19, width: 1.15, height: 2.86},
  {id: "RL26", area: "12m?", left: 51.57, top: 63.23, width: 2.31, height: 5.86},
  {id: "RL25", area: "9m?", left: 54.26, top: 63.23, width: 2.31, height: 4.39},
  {id: "RL16", area: "9m?", left: 59.36, top: 63.23, width: 2.31, height: 4.39},
  {id: "RL14", area: "9m?", left: 61.72, top: 63.23, width: 2.31, height: 4.39},
  {id: "RL10", area: "9m?", left: 65.97, top: 63.23, width: 2.31, height: 4.39},
  {id: "FL12", area: "", left: 67.7, top: 63.96, width: 1.15, height: 2.93},
  {id: "FL13", area: "", left: 70.98, top: 63.96, width: 1.15, height: 2.93},
  {id: "M30", area: "9m?", left: 31.49, top: 66.28, width: 2.31, height: 4.39},
  {id: "M22", area: "9m?", left: 33.79, top: 66.28, width: 2.31, height: 4.39},
  {id: "M16", area: "9m?", left: 38.4, top: 66.28, width: 2.31, height: 4.39},
  {id: "M10", area: "9m?", left: 40.71, top: 66.28, width: 2.31, height: 4.39},
  {id: "SB7", area: "", left: 26.88, top: 66.3, width: 1.15, height: 2.86},
  {id: "SB8", area: "", left: 26.88, top: 69.4, width: 1.15, height: 2.86},
  {id: "M31", area: "9m?", left: 31.49, top: 70.47, width: 2.31, height: 4.39},
  {id: "M23", area: "9m?", left: 33.79, top: 70.47, width: 2.31, height: 4.39},
  {id: "M17", area: "9m?", left: 38.4, top: 70.47, width: 2.31, height: 4.39},
  {id: "M11", area: "9m?", left: 40.71, top: 70.47, width: 2.31, height: 4.39},
  {id: "RL21", area: "9m?", left: 51.19, top: 70.48, width: 2.31, height: 4.39},
  {id: "RL19", area: "9m?", left: 53.49, top: 70.48, width: 2.31, height: 4.39},
  {id: "RL27", area: "9m?", left: 62.85, top: 70.52, width: 2.31, height: 5.86},
  {id: "SB9", area: "", left: 26.88, top: 72.5, width: 1.15, height: 2.86},
  {id: "1SB", area: "", left: 26.88, top: 75.6, width: 1.15, height: 2.86},
  {id: "M04", area: "18m?", left: 45.81, top: 72.71, width: 4.57, height: 4.39},
  {id: "RL22", area: "9m?", left: 51.19, top: 74.84, width: 2.31, height: 4.39},
  {id: "RL20", area: "9m?", left: 53.49, top: 74.84, width: 2.31, height: 4.39},
  {id: "M32", area: "9m?", left: 31.49, top: 74.86, width: 2.31, height: 4.39},
  {id: "M24", area: "9m?", left: 33.79, top: 74.86, width: 2.31, height: 4.39},
  {id: "M18", area: "9m?", left: 38.4, top: 74.86, width: 2.31, height: 4.39},
  {id: "M12", area: "9m?", left: 40.71, top: 74.87, width: 2.31, height: 4.39},
  {id: "RL24", area: "12m?", left: 59.74, top: 74.91, width: 2.31, height: 5.86},
  {id: "RL23", area: "9m?", left: 62.85, top: 74.91, width: 2.31, height: 5.86},
  {id: "IN2", area: "12m?", left: 55.39, top: 83.66, width: 3.07, height: 4.39},
  {id: "IN3", area: "12m?", left: 58.48, top: 83.66, width: 3.07, height: 4.39},
  {id: "IN4", area: "12m?", left: 63.09, top: 83.66, width: 3.07, height: 4.39},
  {id: "IN5", area: "12m?", left: 66.16, top: 83.66, width: 3.07, height: 4.39},
  {id: "IN6", area: "12m?", left: 69.24, top: 83.66, width: 3.07, height: 4.39},
  {id: "IN1", area: "18m?", left: 51.19, top: 85.89, width: 2.31, height: 8.71},
  {id: "IN11", area: "12m?", left: 55.39, top: 88.04, width: 3.07, height: 4.39},
  {id: "IN10", area: "12m?", left: 58.48, top: 88.04, width: 3.07, height: 4.39},
  {id: "IN9", area: "12m?", left: 63.09, top: 88.04, width: 3.07, height: 4.39},
  {id: "IN8", area: "12m?", left: 66.16, top: 88.04, width: 3.07, height: 4.39},
  {id: "IN7", area: "9m?", left: 69.24, top: 88.04, width: 3.07, height: 4.39},
  {id: "IN12", area: "9m?", left: 51.19, top: 95.37, width: 2.31, height: 4.39},
  {id: "IN13", area: "9m?", left: 53.49, top: 95.37, width: 2.31, height: 4.39},
  {id: "IN14", area: "9m?", left: 55.8, top: 95.37, width: 2.31, height: 4.39},
  {id: "IN15", area: "9m?", left: 58.11, top: 95.37, width: 2.31, height: 4.39},
  {id: "IN16", area: "9m?", left: 60.41, top: 95.37, width: 2.31, height: 4.39},
  {id: "IN17", area: "9m?", left: 62.72, top: 95.37, width: 2.31, height: 4.39},
  {id: "IN18", area: "9m?", left: 65.02, top: 95.37, width: 2.31, height: 4.39},
  {id: "IN19", area: "9m?", left: 67.33, top: 95.37, width: 2.31, height: 4.39},
  {id: "IN20", area: "9m?", left: 69.64, top: 95.37, width: 2.31, height: 4.39},
] as const;

const RENTAL_BOOTH_GROUP_LABELS = ["ST", "RL", "M", "IN", "FL", "SB", "TP"] as const;

const RENTAL_BOOTH_GROUPS = RENTAL_BOOTH_GROUP_LABELS.map((label) => ({
  label,
  booths: RENTAL_BOOTH_POSITIONS.filter((booth) => booth.id.match(/^[A-Z]+/)?.[0] === label),
}));

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

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatUserTrendPeriodLabel(date: Date, period: UserTrendPeriod, isArabic: boolean) {
  const locale = isArabic ? ARABIC_DATE_LOCALE : NUMBER_LOCALE;
  if (period === "year") return String(date.getFullYear());
  if (period === "month") return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
  const start = new Date(date);
  start.setDate(start.getDate() - 6);
  return `${start.toLocaleDateString(locale, { day: "2-digit", month: "short" })} - ${date.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" })}`;
}

function buildUserTrendSlots(period: UserTrendPeriod, group: UserTrendGroup, anchor: Date, isArabic: boolean) {
  const locale = isArabic ? ARABIC_DATE_LOCALE : NUMBER_LOCALE;
  if (period === "year") {
    if (group === "quarters") {
      return [1, 2, 3, 4].map((quarter) => ({
        day: `${anchor.getFullYear()}-Q${quarter}`,
        label: isArabic ? `\u0627\u0644\u0631\u0628\u0639 ${quarter}` : `Q${quarter}`,
        amount: 0,
        total: 0,
      }));
    }
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(anchor.getFullYear(), index, 1);
      return {
        day: toMonthKey(date),
        label: date.toLocaleDateString(locale, { month: "short" }),
        amount: 0,
        total: 0,
      };
    });
  }
  if (period === "month") {
    if (group === "weeks") {
      return [1, 2, 3, 4, 5].map((week) => ({
        day: `week-${week}`,
        label: isArabic ? `\u0627\u0644\u0623\u0633\u0628\u0648\u0639 ${week}` : `Week ${week}`,
        amount: 0,
        total: 0,
      }));
    }
    const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(anchor.getFullYear(), anchor.getMonth(), index + 1);
      return {
        day: toDateKey(date),
        label: String(index + 1),
        amount: 0,
        total: 0,
      };
    });
  }
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(anchor);
    date.setDate(anchor.getDate() - (6 - index));
    return {
      day: toDateKey(date),
      label: date.toLocaleDateString(locale, { weekday: "short" }),
      amount: 0,
      total: 0,
    };
  });
}

function formatMoney(value: unknown, currency = "SAR") {
  return `${Number(value ?? 0).toLocaleString(NUMBER_LOCALE)} ${currency}`;
}

function roundMoney(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

function cleanDate(value: unknown) {
  return String(value ?? "").slice(0, 10) || "-";
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
  if (!date) return "-";
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

function ContractActionIcon({type}: {type: "edit" | "print"}) {
  if (type === "print") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M6 9V3h12v6" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path d="M6 14h12v7H6z" />
        <path d="M18 12h.01" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function remainingQuoteTimeLabel(row: BackendRow, isArabic: boolean) {
  const validUntilValue = String(row.valid_until ?? "").trim();
  let expiryDate = validUntilValue ? new Date(validUntilValue) : null;

  if (!expiryDate || Number.isNaN(expiryDate.getTime())) {
    const createdAt = new Date(String(row.created_at ?? ""));
    if (Number.isNaN(createdAt.getTime())) return "-";
    expiryDate = new Date(createdAt);
    expiryDate.setDate(expiryDate.getDate() + 14);
  }

  expiryDate.setHours(23, 59, 59, 999);
  const remainingDays = Math.ceil(
    (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  if (remainingDays <= 0) return isArabic ? "منتهي" : "Expired";
  return isArabic
    ? `${remainingDays.toLocaleString(NUMBER_LOCALE)} ${remainingDays === 1 ? "يوم" : "أيام"}`
    : `${remainingDays.toLocaleString(NUMBER_LOCALE)} day${remainingDays === 1 ? "" : "s"}`;
}

function productName(product: BackendRow | undefined, isArabic: boolean) {
  return String((isArabic ? product?.name : product?.name_en ?? product?.name) ?? "-");
}

export function DashboardHeader({
  eyebrow,
  title,
  action,
  badge,
  subtitle,
  variant = "default",
}: {
  eyebrow: string;
  title: string;
  action?: string;
  badge?: string;
  subtitle?: string;
  variant?: "default" | "card";
}) {
  if (variant === "card") {
    return (
      <div className="page-header-card">
        {badge ? (
          <div className="header-left-action">
            <span className="badge-pill">{badge}</span>
          </div>
        ) : null}
        <div className="header-right-content">
          <span className="category-subtitle">{eyebrow}</span>
          <h1 className="main-page-title">{title}</h1>
          {subtitle ? <p className="description-text">{subtitle}</p> : null}
        </div>
      </div>
    );
  }

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

  const metricText = {
    noPreviousSales: isArabic ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0628\u064a\u0639\u0627\u062a \u0641\u064a \u0627\u0644\u0634\u0647\u0631 \u0627\u0644\u0633\u0627\u0628\u0642" : "No sales in the previous month",
    comparedPreviousMonth: isArabic ? "\u0645\u0642\u0627\u0631\u0646\u0629 \u0628\u0627\u0644\u0634\u0647\u0631 \u0627\u0644\u0633\u0627\u0628\u0642" : "vs previous month",
    pendingPayout: isArabic ? "\u0642\u064a\u062f \u0627\u0644\u0635\u0631\u0641" : "pending payout",
    quotesCreated: isArabic ? "\u0639\u0631\u0636 \u0633\u0639\u0631 \u0645\u0646\u0634\u0623" : "quotes created",
    salesFromQuotes: isArabic ? "\u0645\u0628\u064a\u0639\u0627\u062a \u0645\u0646" : "sales from",
    quoteLabel: isArabic ? "\u0639\u0631\u0636 \u0633\u0639\u0631" : "quotes",
  };

  const notes = [
    salesGrowth === null
      ? metricText.noPreviousSales
      : `${salesGrowth >= 0 ? "+" : ""}${salesGrowth.toFixed(1)}% ${metricText.comparedPreviousMonth}`,
    `${approvedCommissionAmount.toLocaleString(NUMBER_LOCALE)} SAR ${metricText.pendingPayout}`,
    `${quoteCount.toLocaleString(NUMBER_LOCALE)} ${metricText.quotesCreated}`,
    isArabic
      ? `${salesCount.toLocaleString(NUMBER_LOCALE)} ${metricText.salesFromQuotes} ${quoteCount.toLocaleString(NUMBER_LOCALE)} ${metricText.quoteLabel}`
      : `${salesCount.toLocaleString(NUMBER_LOCALE)} ${metricText.salesFromQuotes} ${quoteCount.toLocaleString(NUMBER_LOCALE)} ${metricText.quoteLabel}`,
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
  const [trendPeriod, setTrendPeriod] = useState<UserTrendPeriod>("month");
  const [trendGroup, setTrendGroup] = useState<UserTrendGroup>("weeks");
  const [trendAnchor, setTrendAnchor] = useState(() => new Date());
  const { data: currentUser } =
    useBackend<{ userid: number; name: string; role: string }>("/api/v1/auth/me");
  const currentUserId = Number(currentUser?.userid ?? 0);
  const summaryParams = new URLSearchParams({
    period: trendPeriod,
    group: trendGroup,
    anchor: trendAnchor.toISOString().slice(0, 10),
  });
  if (currentUserId > 0) summaryParams.set("userId", String(currentUserId));
  const { data } = useBackend<{
    leads?: number;
    wonLeads?: number;
    salesTrend?: Array<{ day: string; amount: number; total: number }>;
  }>(`/api/v1/dashboard/summary?${summaryParams.toString()}`);
  const dashboardUsers = useBackend<
    Array<{
      id: number;
      name: string;
      email: string;
      role: string;
      role_name: string;
      last_login_at: string | null;
      leads_count: number;
    }>
  >("/api/v1/dashboard/users");

  const trendByDay = new Map(
    (data?.salesTrend ?? []).map((item) => [String(item.day), item]),
  );
  const salesTrend = buildUserTrendSlots(trendPeriod, trendGroup, trendAnchor, isArabic).map((slot) => ({
    ...slot,
    ...(trendByDay.get(slot.day) ?? { amount: 0, total: 0 }),
  }));
  const maximumAmount = Math.max(...salesTrend.map((item) => item.amount), 1);
  const periodAmount = salesTrend.reduce((total, item) => total + item.amount, 0);
  const periodSales = salesTrend.reduce((total, item) => total + item.total, 0);
  const averageSale = periodSales > 0 ? periodAmount / periodSales : 0;
  const selectedUser = (dashboardUsers.data ?? []).find(
    (user) => String(user.id) === String(currentUserId),
  );
  const addedLeadsCount =
    Number(data?.leads ?? selectedUser?.leads_count ?? 0);
  const activityRate =
    Number(data?.leads ?? 0) > 0
      ? Math.round((Number(data?.wonLeads ?? 0) / Number(data?.leads ?? 1)) * 100)
      : 0;
  const lastLoginLabel = selectedUser?.last_login_at
    ? new Intl.DateTimeFormat(isArabic ? ARABIC_DATE_LOCALE : "en-US", {
        dateStyle: "medium",
      }).format(new Date(selectedUser.last_login_at))
    : isArabic
      ? "غير متاح"
      : "Not available";
  const periodLabel = formatUserTrendPeriodLabel(trendAnchor, trendPeriod, isArabic);
  const groupOptions =
    trendPeriod === "month"
      ? [
          { value: "weeks" as const },
          { value: "days" as const },
        ]
      : trendPeriod === "year"
        ? [
            { value: "months" as const },
            { value: "quarters" as const },
          ]
        : [{ value: "days" as const }];
  function changeTrendPeriod(nextPeriod: UserTrendPeriod) {
    setTrendPeriod(nextPeriod);
    setTrendGroup(nextPeriod === "year" ? "months" : nextPeriod === "month" ? "weeks" : "days");
    setTrendAnchor(new Date());
  }
  function navigateTrend(direction: "prev" | "next") {
    const step = direction === "next" ? 1 : -1;
    setTrendAnchor((current) => {
      const next = new Date(current);
      if (trendPeriod === "year") next.setFullYear(next.getFullYear() + step);
      else if (trendPeriod === "month") next.setMonth(next.getMonth() + step);
      else next.setDate(next.getDate() + step * 7);
      return next;
    });
  }
  const userTrendText = {
    performanceTitle: isArabic
      ? "\u0623\u062f\u0627\u0621 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0648\u0627\u0644\u0639\u0631\u0648\u0636 \u0648\u0627\u0644\u0639\u0645\u0648\u0644\u0627\u062a"
      : "Customer, Quote, and Commission Performance",
    performanceSubtitle: isArabic
      ? "\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a \u0648\u062a\u0648\u0632\u064a\u0639\u0647\u0627 \u062d\u0633\u0628 \u0627\u0644\u0641\u062a\u0631\u0627\u062a \u0627\u0644\u0632\u0645\u0646\u064a\u0629"
      : "Track sales distribution across selected time periods",
    salesLabel: isArabic ? "\u0645\u0628\u064a\u0639\u0627\u062a" : "Sales",
    periodTotal: isArabic ? "\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0641\u062a\u0631\u0629" : "Period total",
    salesCount: isArabic ? "\u0639\u062f\u062f \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a" : "Sales count",
    averageSale: isArabic ? "\u0645\u062a\u0648\u0633\u0637 \u0642\u064a\u0645\u0629 \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a" : "Average sale value",
    currentUserPerformance: isArabic ? "أداء المستخدم الحالي" : "Current user performance",
    addedLeads: isArabic ? "العملاء المضافون" : "Added leads",
    activityRate: isArabic ? "معدل النشاط بالمنصة" : "Platform activity rate",
    lastLogin: isArabic ? "آخر تسجيل دخول" : "Last login",
    periodButtons: {
      week: isArabic ? "\u0623\u0633\u0628\u0648\u0639" : "Week",
      month: isArabic ? "\u0634\u0647\u0631" : "Month",
      year: isArabic ? "\u0633\u0646\u0629" : "Year",
    } as Record<UserTrendPeriod, string>,
    groupLabels: {
      days: isArabic ? "\u062a\u0642\u0633\u064a\u0645 \u0628\u0627\u0644\u0623\u064a\u0627\u0645" : "By days",
      weeks: isArabic ? "\u062a\u0642\u0633\u064a\u0645 \u0628\u0627\u0644\u0623\u0633\u0627\u0628\u064a\u0639" : "By weeks",
      months: isArabic ? "\u062a\u0642\u0633\u064a\u0645 \u0628\u0627\u0644\u0634\u0647\u0648\u0631" : "By months",
      quarters: isArabic ? "\u0631\u0628\u0639 \u0633\u0646\u0648\u064a" : "Quarterly",
    } as Record<UserTrendGroup, string>,
  };

  return (
    <article className="chart-card full-card">
      <div className="card-title">
        <div className="user-performance-heading">
          <h3>{userTrendText.performanceTitle}</h3>
          <p>{userTrendText.performanceSubtitle}</p>
        </div>
        <div className="chart-title-tools">
          <div className="analytics-filters-bar">
            <div className="user-period-segment">
              {(["week", "month", "year"] as UserTrendPeriod[]).map((period) => (
                <button
                  className={trendPeriod === period ? "active" : ""}
                  key={period}
                  onClick={() => changeTrendPeriod(period)}
                  type="button"
                >
                  {userTrendText.periodButtons[period]}
                </button>
              ))}
            </div>
            <div className="user-period-navigator">
              <button aria-label={isArabic ? "الفترة السابقة" : "Previous period"} onClick={() => navigateTrend("prev")} type="button">‹</button>
              <strong>{periodLabel}</strong>
              <button aria-label={isArabic ? "الفترة التالية" : "Next period"} onClick={() => navigateTrend("next")} type="button">›</button>
            </div>
            <div className="user-period-subfilters">
              {groupOptions.map((option) => (
                <button
                  className={trendGroup === option.value ? "active" : ""}
                  disabled={groupOptions.length === 1}
                  key={option.value}
                  onClick={() => setTrendGroup(option.value)}
                  type="button"
                >
                  {userTrendText.groupLabels[option.value]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="user-stats-card">
        <div className="user-info">
          <div className="user-avatar" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          </div>
          <div>
            <h4>
              {selectedUser
                ? `${isArabic ? "أداء:" : "Performance:"} ${selectedUser.name}`
                : userTrendText.currentUserPerformance}
            </h4>
            <span className="user-role-badge">
              {selectedUser ? selectedUser.role_name : String(currentUser?.role ?? "—")}
            </span>
          </div>
        </div>
        <div className="user-metrics">
          <div className="metric-item">
            <span className="metric-label">{userTrendText.addedLeads}</span>
            <span className="metric-value text-teal">
              {addedLeadsCount.toLocaleString(NUMBER_LOCALE)}
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">{userTrendText.activityRate}</span>
            <span className="metric-value text-navy">{activityRate}%</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">{userTrendText.lastLogin}</span>
            <span className="metric-value">{lastLoginLabel}</span>
          </div>
        </div>
      </div>
      <div className="chart-insights-row">
        <span className="chart-insight teal">
          {userTrendText.periodTotal}: {periodAmount.toLocaleString(NUMBER_LOCALE)} SAR
        </span>
        <span className="chart-insight navy">
          {userTrendText.salesCount}: {periodSales.toLocaleString(NUMBER_LOCALE)}
        </span>
        <span className="chart-insight emerald">
          {userTrendText.averageSale}:{" "}
          {averageSale.toLocaleString(NUMBER_LOCALE, { maximumFractionDigits: 2 })} SAR
        </span>
      </div>
      <div
        className="bar-chart"
        aria-label={t("chart.label")}
        style={{ "--chart-columns": salesTrend.length } as React.CSSProperties}
      >
        {salesTrend.map((item) => {
          const dayLabel = item.label;
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
  const filteredQuotes = useMemo(
    () =>
      (quotes.data ?? []).filter(
        (quote) =>
          quoteStatusFilter === "all" ||
          String(quote.status ?? "draft") === quoteStatusFilter,
      ),
    [quoteStatusFilter, quotes.data],
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

export function ParticipationContractsPanel({locale}: {locale: string}) {
  const isArabic = locale === "ar";
  const contracts = useBackend<BackendRow[]>("/api/v1/data/participation-contracts");
  const leads = useBackend<BackendRow[]>("/api/v1/data/leads");
  const [leadId, setLeadId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Saudi Arabia");
  const [standNumber, setStandNumber] = useState("");
  const [locationCategory, setLocationCategory] = useState("standard");
  const [packageType, setPackageType] = useState("space_shell_scheme");
  const [spaceSqm, setSpaceSqm] = useState("");
  const [pricePerSqm, setPricePerSqm] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [contractDate, setContractDate] = useState(() => dateAfterDays(0));
  const [notes, setNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [editingContractId, setEditingContractId] = useState<number | null>(null);
  const [participationSearch, setParticipationSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [contractTypeFilter, setContractTypeFilter] = useState("all");

  const text = isArabic
    ? {
        formTitle: "إضافة بيانات العقد",
        formSubtitle: "بيانات العارض والمشاركة كما تظهر في عقد المشاركة",
        listTitle: "قائمة العقود",
        listSubtitle: "العقود التي تم إدخالها من حسابك",
        customer: "العميل المهتم",
        customerPlaceholder: "اختر العميل المهتم",
        customerSearch: "ابحث باسم العميل أو الشركة",
        companyName: "اسم الشركة",
        brandName: "العلامة التجارية",
        contactName: "الشخص المسؤول",
        email: "البريد الإلكتروني",
        website: "الموقع الإلكتروني",
        phone: "الهاتف",
        mobile: "الجوال",
        address: "العنوان",
        city: "المدينة",
        country: "الدولة",
        standNumber: "رقم الجناح",
        locationCategory: "فئة الموقع",
        packageType: "نوع المشاركة",
        spaceSqm: "المساحة بالمتر",
        pricePerSqm: "السعر للمتر",
        totalAmount: "إجمالي العقد",
        contractDate: "تاريخ العقد",
        notes: "ملاحظات",
        save: "حفظ العقد",
        update: "تحديث العقد",
        edit: "تعديل",
        print: "طباعة",
        actions: "الإجراءات",
        saving: "جاري الحفظ...",
        saved: "تم حفظ العقد",
        updated: "تم تحديث العقد",
        failed: "تعذر حفظ العقد",
        validation: "أدخل اسم الشركة، الشخص المسؤول، ونوع المشاركة",
        noCustomerData: "اختر عميلاً مهتماً لتعبئة بيانات الشركة تلقائياً",
        noContracts: "لا توجد عقود مشاركة حتى الآن",
        standard: "موقع عادي",
        premium: "موقع مميز",
        spaceOnly: "مساحة فقط",
        shellScheme: "مساحة مع تجهيز",
        draft: "مسودة",
        sent: "مرسل",
        signed: "موقع",
        cancelled: "ملغي",
      }
    : {
        formTitle: "Add contract details",
        formSubtitle: "Exhibitor and participation details from the participation contract",
        listTitle: "Contracts list",
        listSubtitle: "Contracts entered from your account",
        customer: "Interested customer",
        customerPlaceholder: "Select interested customer",
        customerSearch: "Search by customer or company",
        companyName: "Company name",
        brandName: "Brand name",
        contactName: "Contact person",
        email: "Email",
        website: "Website",
        phone: "Phone",
        mobile: "Mobile",
        address: "Address",
        city: "City",
        country: "Country",
        standNumber: "Stand number",
        locationCategory: "Location category",
        packageType: "Package type",
        spaceSqm: "Space sqm",
        pricePerSqm: "Price per sqm",
        totalAmount: "Contract total",
        contractDate: "Contract date",
        notes: "Notes",
        save: "Save contract",
        update: "Update contract",
        edit: "Edit",
        print: "Print",
        actions: "Actions",
        saving: "Saving...",
        saved: "Contract saved",
        updated: "Contract updated",
        failed: "Unable to save contract",
        validation: "Enter company name, contact person, and package type",
        noCustomerData: "Select an interested customer to fill company details automatically",
        noContracts: "No participation contracts yet",
        standard: "Standard location",
        premium: "Premium location",
        spaceOnly: "Space only",
        shellScheme: "Space & shell scheme",
        draft: "Draft",
        sent: "Sent",
        signed: "Signed",
        cancelled: "Cancelled",
      };

  const computedTotal = useMemo(() => {
    const space = Number(spaceSqm);
    const price = Number(pricePerSqm);
    if (!Number.isFinite(space) || !Number.isFinite(price) || space <= 0 || price <= 0) return "";
    return String(space * price);
  }, [pricePerSqm, spaceSqm]);
  const displayedTotal = totalAmount || computedTotal;
  const statusLabels: Record<string, string> = {
    draft: text.draft,
    sent: text.sent,
    signed: text.signed,
    cancelled: text.cancelled,
  };
  const packageLabels: Record<string, string> = {
    space_only: text.spaceOnly,
    space_shell_scheme: text.shellScheme,
  };
  const selectedLead = (leads.data ?? []).find((lead) => String(lead.id) === leadId);
  const filteredContracts = useMemo(() => {
    const query = participationSearch.trim().toLocaleLowerCase();
    return (contracts.data ?? []).filter((contract) => {
      const matchesSearch =
        !query ||
        [
          contract.contract_number,
          contract.customer_name,
          contract.company_name,
          contract.contact_name,
          contract.email,
          contract.phone,
          contract.mobile,
          contract.location_category,
          contract.package_type,
        ].some((value) => String(value ?? "").toLocaleLowerCase().includes(query));
      const matchesLocation = locationFilter === "all" || String(contract.location_category ?? "") === locationFilter;
      const matchesContractType = contractTypeFilter === "all" || String(contract.package_type ?? "") === contractTypeFilter;
      return matchesSearch && matchesLocation && matchesContractType;
    });
  }, [contractTypeFilter, contracts.data, locationFilter, participationSearch]);
  const resetContractFilters = () => {
    setParticipationSearch("");
    setLocationFilter("all");
    setContractTypeFilter("all");
  };
  const participationContractStats = useMemo(() => {
    const rows = contracts.data ?? [];
    return {
      total: rows.length,
      value: rows.reduce((sum, contract) => sum + Number(contract.total_amount ?? 0), 0),
      pending: rows.filter((contract) =>
        ["draft", "sent"].includes(String(contract.status ?? "draft")),
      ).length,
    };
  }, [contracts.data]);

  function applyLeadData(nextLeadId: string) {
    setLeadId(nextLeadId);
    const lead = (leads.data ?? []).find((item) => String(item.id) === nextLeadId);
    if (!lead) return;
    setCompanyName(String(lead.company_name ?? lead.name ?? ""));
    setContactName(String(lead.name ?? ""));
    setEmail(String(lead.email ?? ""));
    setPhone(String(lead.phone ?? ""));
    setMobile(String(lead.phone ?? ""));
    setAddress(String(lead.address ?? ""));
  }

  function resetContractForm() {
    setEditingContractId(null);
    setLeadId("");
    setCompanyName("");
    setBrandName("");
    setContactName("");
    setEmail("");
    setWebsite("");
    setPhone("");
    setMobile("");
    setAddress("");
    setCity("");
    setCountry("Saudi Arabia");
    setStandNumber("");
    setLocationCategory("standard");
    setPackageType("space_shell_scheme");
    setSpaceSqm("");
    setPricePerSqm("");
    setTotalAmount("");
    setContractDate(dateAfterDays(0));
    setNotes("");
  }

  function editContract(contract: BackendRow) {
    setEditingContractId(Number(contract.id));
    setLeadId(contract.lead_id ? String(contract.lead_id) : "");
    setCompanyName(String(contract.company_name ?? ""));
    setBrandName(String(contract.brand_name ?? ""));
    setContactName(String(contract.contact_name ?? ""));
    setEmail(String(contract.email ?? ""));
    setWebsite(String(contract.website ?? ""));
    setPhone(String(contract.phone ?? ""));
    setMobile(String(contract.mobile ?? ""));
    setAddress(String(contract.address ?? ""));
    setCity(String(contract.city ?? ""));
    setCountry(String(contract.country ?? "Saudi Arabia"));
    setStandNumber(String(contract.stand_number ?? ""));
    setLocationCategory(String(contract.location_category ?? "standard"));
    setPackageType(String(contract.package_type ?? "space_shell_scheme"));
    setSpaceSqm(contract.space_sqm == null ? "" : String(contract.space_sqm));
    setPricePerSqm(contract.price_per_sqm == null ? "" : String(contract.price_per_sqm));
    setTotalAmount(contract.total_amount == null ? "" : String(contract.total_amount));
    setContractDate(cleanDate(contract.contract_date) === "—" ? dateAfterDays(0) : cleanDate(contract.contract_date));
    setNotes(String(contract.notes ?? ""));
    window.scrollTo({top: 0, behavior: "smooth"});
  }

  function escapePrintValue(value: unknown) {
    return String(value ?? "—")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function printContract(contract: BackendRow) {
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) return;
    const printPackageValue = String(contract.package_type ?? "");
    const printLocationValue = String(contract.location_category ?? "");
    const printCurrency = String(contract.currency ?? "SAR");
    const printSpace = String(contract.space_sqm ?? "");
    const printPrice = contract.price_per_sqm == null ? "" : String(contract.price_per_sqm);
    const printTotal = contract.total_amount == null ? "" : String(contract.total_amount);
    const printVat = contract.total_amount == null ? "" : String(Number(contract.total_amount) * 0.15);
    const printGrandTotal = contract.total_amount == null ? "" : String(Number(contract.total_amount) * 1.15);
    const printInput = (value: unknown, style = "") =>
      `<input type="text" class="input-field" readonly value="${escapePrintValue(value ?? "")}" style="${style}">`;
    const printCheck = (checked: boolean) => (checked ? "checked" : "");
    const shellSelected = printPackageValue === "space_shell_scheme";
    const spaceOnlySelected = printPackageValue === "space_only";
    const locationASelected = printLocationValue === "standard";
    const locationBSelected = printLocationValue === "premium";

    printWindow!.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>عقد مشاركة معرض رونق وأناقة 2026 - ${escapePrintValue(contract.contract_number)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    * { box-sizing: border-box; font-family: 'Cairo', Arial, sans-serif; margin: 0; padding: 0; }
    @page { size: A4 portrait; margin: 0; }
    html, body { width: 210mm; min-height: 297mm; }
    body { background-color: #f5f5f5; color: #333; font-size: 10px; line-height: 1.35; }
    .page {
      width: 210mm;
      height: 297mm;
      min-height: 297mm;
      padding: 10mm 11mm 9mm;
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      position: relative;
      overflow: hidden;
    }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    .header-table td { border: none !important; padding: 5px; vertical-align: top; }
    .logo-area { font-weight: bold; font-size: 18px; color: #1a365d; }
    .expo-details { text-align: center; font-size: 10.5px; }
    .expo-details h1 { font-size: 15px; color: #bc9c22; margin-bottom: 4px; }
    .section-title { background-color: #1a365d; color: #fff; padding: 4px 8mm; text-align: center; font-weight: bold; font-size: 12px; margin: 10px 0 7px; display: flex; justify-content: space-between; }
    table.form-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    table.form-table td { border: 1px solid #ccc; padding: 4px 5px; vertical-align: middle; }
    .label-ar { float: right; font-weight: 600; }
    .label-en { float: left; font-weight: 600; color: #555; font-size: 10px; direction: ltr; }
    .input-field { width: 100%; border: none; border-bottom: 1px dashed #999; padding: 1px 2px; font-size: 10px; background: transparent; color: #111; }
    .grid-container { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .checkbox-group { border: 1px solid #ccc; padding: 6px; margin-bottom: 8px; }
    .checkbox-item { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; padding: 1px 0; }
    .checkbox-item input, .pricing-table input[type="checkbox"] { margin: 0 5px; transform: scale(1.05); }
    .pricing-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .pricing-table th, .pricing-table td { border: 1px solid #ccc; padding: 3px 4px; text-align: center; }
    .pricing-table th { background-color: #f2f2f2; font-size: 10px; }
    .terms-container { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: justify; font-size: 9px; line-height: 1.35; }
    .terms-box { direction: rtl; }
    .terms-box.en { direction: ltr; text-align: left; font-size: 8.5px; }
    .article-title { font-weight: bold; margin-top: 8px; color: #1a365d; }
    .signature-section { margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .sig-box { border: 1px solid #aaa; padding: 10px; height: 110px; position: relative; }
    .page-number { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); font-size: 10px; color: #777; }
    @media print {
      body { background: none; width: 210mm; }
      .page { margin: 0; box-shadow: none; page-break-after: always; break-after: page; }
    }
  </style>
</head>
<body>
  <div class="page">
    <table class="header-table">
      <tr>
        <td style="width: 30%;">
          <div class="logo-area">REE</div>
          <div style="font-size:9px; color:#555;">alsawsan<br>exhibitions & conferences</div>
          <div style="font-size:9px; color:#555; margin-top:8px;">${escapePrintValue(contract.contract_number)}</div>
        </td>
        <td style="width: 40%; text-align: center;" class="expo-details">
          <h1>RAWNAQ & ELEGANCE EXPO</h1>
          <h2>معرض رونق وأناقة 2026</h2>
          <p>22-25 December 2026</p>
          <p>من 22 الى 25 ديسمبر 2026</p>
          <p>Hilton Hotel, Grand Hilton Hall - Jeddah</p>
          <p>فندق هيلتون، قاعة الهيلتون الكبرى - جدة</p>
        </td>
        <td style="width: 30%; text-align: left; font-size: 10px;">
          <strong style="color:#bc9c22;">PARTICIPATION CONTRACT</strong><br>
          <strong>عقد المشاركة</strong><br>
          <span style="font-size:9px;">www.alsawsanexpo.com</span>
        </td>
      </tr>
    </table>

    <div class="section-title"><span class="label-en">EXHIBITOR INFO</span><span class="label-ar">بيانات العارض</span></div>
    <table class="form-table">
      <tr><td colspan="2"><span class="label-ar">اسم الشركة كما يظهر في السجل التجاري:</span><span class="label-en">Company Name (as in CR):</span>${printInput(contract.company_name)}</td></tr>
      <tr>
        <td><span class="label-ar">العلامة التجارية:</span><span class="label-en">Brand Name:</span>${printInput(contract.brand_name)}</td>
        <td><span class="label-ar">رقم الجناح:</span><span class="label-en">Stand Number:</span>${printInput(contract.stand_number)}</td>
      </tr>
      <tr><td colspan="2"><span class="label-ar">العنوان:</span><span class="label-en">Address:</span>${printInput(contract.address)}</td></tr>
      <tr>
        <td><span class="label-ar">المدينة:</span><span class="label-en">City:</span>${printInput(contract.city)}</td>
        <td><span class="label-ar">الدولة:</span><span class="label-en">Country:</span>${printInput(contract.country)}</td>
      </tr>
      <tr>
        <td><span class="label-ar">الجوال:</span><span class="label-en">Mobile:</span>${printInput(contract.mobile)}</td>
        <td><span class="label-ar">الهاتف / الفاكس:</span><span class="label-en">Tel / Fax:</span>${printInput(`${String(contract.phone ?? "")}${contract.fax ? ` / ${String(contract.fax)}` : ""}`)}</td>
      </tr>
      <tr>
        <td><span class="label-ar">البريد الإلكتروني:</span><span class="label-en">E-mail:</span>${printInput(contract.email)}</td>
        <td><span class="label-ar">الموقع الإلكتروني:</span><span class="label-en">Website:</span>${printInput(contract.website)}</td>
      </tr>
      <tr>
        <td><span class="label-ar">الشخص المسؤول:</span><span class="label-en">Contact Person:</span>${printInput(contract.contact_name)}</td>
        <td><span class="label-ar">المنصب:</span><span class="label-en">Position:</span>${printInput("")}</td>
      </tr>
    </table>

    <div class="section-title"><span class="label-en">SPACE RATES & RESERVATION</span><span class="label-ar">حجز المساحات والأسعار</span></div>
    <table class="pricing-table">
      <thead>
        <tr><th>الفئة / Location</th><th>نوع الحجز / Type</th><th>سعر المتر / Rate (SAR)</th><th>المساحة / Sqm</th><th>الإجمالي / Total</th></tr>
      </thead>
      <tbody>
        <tr>
          <td rowspan="2"><strong>Location A</strong> (فئة أ) <input type="checkbox" ${printCheck(locationASelected)}></td>
          <td>Space & Shell Scheme (موقع وجناح) <input type="checkbox" ${printCheck(locationASelected && shellSelected)}></td>
          <td>2,075 SAR</td><td>${printInput(locationASelected && shellSelected ? printSpace : "", "width:50px; text-align:center;")}</td><td>${printInput(locationASelected && shellSelected ? printTotal : "", "width:80px;")}</td>
        </tr>
        <tr>
          <td>Space Only (موقع فقط) <input type="checkbox" ${printCheck(locationASelected && spaceOnlySelected)}></td>
          <td>1,600 SAR</td><td>${printInput(locationASelected && spaceOnlySelected ? printSpace : "", "width:50px; text-align:center;")}</td><td>${printInput(locationASelected && spaceOnlySelected ? printTotal : "", "width:80px;")}</td>
        </tr>
        <tr>
          <td rowspan="2"><strong>Location B</strong> (فئة ب) <input type="checkbox" ${printCheck(locationBSelected)}></td>
          <td>Space & Shell Scheme (موقع وجناح) <input type="checkbox" ${printCheck(locationBSelected && shellSelected)}></td>
          <td>1,775 SAR</td><td>${printInput(locationBSelected && shellSelected ? printSpace : "", "width:50px; text-align:center;")}</td><td>${printInput(locationBSelected && shellSelected ? printTotal : "", "width:80px;")}</td>
        </tr>
        <tr>
          <td>Space Only (موقع فقط) <input type="checkbox" ${printCheck(locationBSelected && spaceOnlySelected)}></td>
          <td>1,300 SAR</td><td>${printInput(locationBSelected && spaceOnlySelected ? printSpace : "", "width:50px; text-align:center;")}</td><td>${printInput(locationBSelected && spaceOnlySelected ? printTotal : "", "width:80px;")}</td>
        </tr>
        <tr style="background:#f9f9f9;"><td colspan="2"><strong>رسوم التسجيل الإلزامية / Registration Fee</strong></td><td>1,500 SAR</td><td>شامل الخدمات</td><td>1,500 SAR</td></tr>
        <tr><td colspan="4" style="text-align:left; font-weight:bold;">ضريبة القيمة المضافة 15% / VAT 15%:</td><td>${printInput(printVat, "width:80px;")}</td></tr>
        <tr style="background:#f2f2f2; font-weight:bold;"><td colspan="4" style="text-align:left;">المجموع الكلي / TOTAL (${escapePrintValue(printCurrency)}):</td><td>${printInput(printGrandTotal, "width:80px;")}</td></tr>
      </tbody>
    </table>
    <p style="font-size:9px; color:#555; margin-top:5px; text-align: justify;">
      * <strong>Note:</strong> The stand package includes traditional built wooden shell scheme with table, chairs, shelves, country flag, and plastic waste bin.<br>
      * <strong>ملاحظة:</strong> يشمل الجناح المتكامل ستاند مبني خشبي تقليدي، طاولة، كراسي، كاونتر، رفوف، علم الدولة، وسلة مهملات بلاستيكية.
    </p>
    <div class="section-title"><span class="label-en">PAYMENT & DECLARATION</span><span class="label-ar">شروط الدفع والإقرار</span></div>
    <p style="font-size:9.5px; text-align:justify;">
      <strong>طريقة الدفع (Payment Terms):</strong> الدفع عند التوقيع 100% عن طريق التحويل البنكي. لا يتحمل المرسل إليه أي رسوم تحويل.<br>
      <strong>إقرار العارض (Exhibitor's Declaration):</strong> أقر أنا الموقع أدناه بأنني قرأت وفهمت شروط وأحكام معرض رونق وأناقة، وأوافق دون تحفظ على كل فقراته.
    </p>
    <div class="signature-section">
      <div class="sig-box"><div class="label-ar">التوقيع والختم الخاص بالشركة العارضة (إلزامي)</div><div class="label-en" style="position:absolute; bottom:25px; left:10px;">Signature & Stamp of Exhibiting Company</div><div style="position:absolute; bottom:5px; right:10px; font-size:10px;">Name: ${escapePrintValue(contract.contact_name)} Date: ${escapePrintValue(cleanDate(contract.contract_date))}</div></div>
      <div class="sig-box"><div class="label-ar">التوقيع والختم الخاص بالمنظم</div><div class="label-en" style="position:absolute; bottom:25px; left:10px;">Signature & Stamp of Organizer</div><div style="position:absolute; bottom:5px; right:10px; font-size:10px;">Name:........................... Date: / / </div></div>
    </div>
    <div class="page-number">1 (4)</div>
  </div>

  <div class="page">
    <table class="header-table"><tr><td><div class="logo-area" style="font-size:14px;">REE 2026</div></td><td style="text-align:center; font-weight:bold;">نشاط العمل وقطاع المنتجات | BUSINESS ACTIVITIES & SECTORS</td><td style="text-align:left; font-size:9px;">www.alsawsanexpo.com</td></tr></table>
    <div class="grid-container">
      <div class="checkbox-group">
        <div style="background:#f2f2f2; font-weight:bold; padding:3px; margin-bottom:5px; text-align:center;">نشاط العمل / Business Activities</div>
        <div class="checkbox-item"><span><input type="checkbox"> مصنع / Manufacturer</span><input type="checkbox"></div>
        <div class="checkbox-item"><span><input type="checkbox"> موزع إقليمي / Regional Distributor</span><input type="checkbox"></div>
        <div class="checkbox-item"><span><input type="checkbox"> موزع محلي / National Distributor</span><input type="checkbox"></div>
        <div class="checkbox-item"><span><input type="checkbox"> الاستيراد والتصدير / Import & Export</span><input type="checkbox"></div>
        <div class="checkbox-item"><span><input type="checkbox"> البيع بالتجزئة / Retail</span><input type="checkbox"></div>
        <div class="checkbox-item"><span><input type="checkbox"> مزود خدمة / Service Provider</span><input type="checkbox"></div>
      </div>
      <div class="checkbox-group">
        <div style="background:#f2f2f2; font-weight:bold; padding:3px; margin-bottom:5px; text-align:center;">قطاع المنتجات / Product Group</div>
        <div class="checkbox-item"><span><input type="checkbox"> جناح وطني أو إقليمي / National Pavilion</span><input type="checkbox"></div>
        <div class="checkbox-item"><span><input type="checkbox"> العود والعطور والبخور / Perfumes & Oud</span><input type="checkbox"></div>
        <div class="checkbox-item"><span><input type="checkbox"> مستلزمات وإكسسوارات رجالية / Men's Accessories</span><input type="checkbox"></div>
        <div class="checkbox-item"><span><input type="checkbox"> أزياء الرجل العصرية / Men's Fashion</span><input type="checkbox"></div>
        <div class="checkbox-item"><span><input type="checkbox"> الأناقة النسائية / Women's Elegance</span><input type="checkbox"></div>
        <div class="checkbox-item"><span><input type="checkbox"> مصممو ومصممات الأزياء / Fashion Designers</span><input type="checkbox"></div>
      </div>
    </div>
    <div class="checkbox-group" style="margin-top:10px;">
      <div style="background:#f2f2f2; font-weight:bold; padding:3px; margin-bottom:5px; text-align:center;">تفاصيل إضافية للقطاعات / Additional Sectors</div>
      <div class="grid-container"><div><label><input type="checkbox"> المشالح والبشوت / Cloaks & Bishts</label><br><label><input type="checkbox"> الغترة والشماغ والعقل / Traditional Headwear</label><br><label><input type="checkbox"> سبح، خواتم، ساعات، أقلام / Luxury Accessories</label></div><div><label><input type="checkbox"> ملابس داخلية ومنزلية / Homewear</label><br><label><input type="checkbox"> خدمات نسائية مميزة / Premium Women Services</label><br><label><input type="checkbox"> أخرى / Other: ........................</label></div></div>
    </div>
    <div class="section-title"><span class="label-en">TARGET VISITORS</span><span class="label-ar">الفئات المستهدفة من الزوار</span></div>
    <div class="checkbox-group"><div class="checkbox-item"><span><input type="checkbox"> تجار الجملة والمستوردون / Wholesalers & Importers</span><span><input type="checkbox"> المصممون ودور الأزياء / Designers</span></div><div class="checkbox-item"><span><input type="checkbox"> الموزعون والموردون / Distributors & Suppliers</span><span><input type="checkbox"> أصحاب المحلات والمتاجر / Store Owners</span></div><div class="checkbox-item"><span><input type="checkbox"> تجار التجزئة / Retailers</span><span><input type="checkbox"> المستثمرون / Investors</span></div></div>
    <div style="margin-top:15px; border:1px solid #ccc; padding:10px;"><strong class="label-ar">أذكر اسم 3 شركات سعودية على الأقل تود دعوتهم للمعرض:</strong><strong class="label-en">Name at least 3 Saudi companies you would like us to invite:</strong>${printInput("", "margin-top:10px;")}${printInput("", "margin-top:10px;")}${printInput("", "margin-top:10px;")}</div>
    <div class="page-number">2 (4)</div>
  </div>

  <div class="page">
    <div style="text-align:center; font-weight:bold; font-size:14px; border-bottom:2px solid #1a365d; padding-bottom:5px; margin-bottom:10px;">الأحكام والشروط العامة للمعرض (تابع عقد المشاركة)</div>
    <div class="terms-container" style="grid-template-columns: 1fr;"><div class="terms-box">
      <div class="article-title">الفقرة الأولى - الأنظمة والقوانين العامة لإقامة المعارض</div><p>يتم تحديد الشروط والأنظمة العامة الخاصة بتنظيم المعرض من قبل المنظم، ويحق له تعديل المواعيد أو الموقع إذا اقتضت الحاجة.</p>
      <div class="article-title">الفقرة الثانية - شروط المشاركة في المعرض</div><p>يلتزم العارض بعرض المنتجات أو الخدمات المصرح بها فقط وبالأنظمة المعمول بها في المملكة العربية السعودية.</p>
      <div class="article-title">الفقرة الثالثة - الطلبات</div><p>يعتبر تقديم طلب المشاركة تعهداً ملزماً بدفع أجرة الجناح والتكاليف المرتبطة به.</p>
      <div class="article-title">الفقرة الخامسة - نقل الملكية والتأجير من الباطن</div><p>لا يحق للعارض التنازل عن المساحة أو تأجيرها للغير إلا بموافقة خطية مسبقة من المنظم.</p>
      <div class="article-title">الفقرة السادسة - الانسحاب</div><p>في حال انسحاب العارض أو عدم شغله للجناح، تصبح المبالغ المدفوعة أو المتبقية مستحقة بالكامل للمنظم.</p>
      <div class="article-title">الفقرة الحادية عشرة - توزيع أجنحة المعرض</div><p>يقوم المنظم بتوزيع الأجنحة وتعديل المساحات حسب مصلحة المعرض.</p>
      <div class="article-title">الفقرة التاسعة عشر - التأشيرات والجمارك</div><p>تقع على عاتق العارض مسؤولية إنهاء الإجراءات النظامية للتأشيرات والجمارك.</p>
      <div class="article-title">الفقرة الثامنة والعشرون - القانون والاختصاص</div><p>تخضع هذه الاتفاقية لأنظمة المملكة العربية السعودية، والنص العربي هو المرجع الأساسي.</p>
    </div></div>
    <div class="page-number">3 (4)</div>
  </div>

  <div class="page">
    <div style="text-align:center; font-weight:bold; font-size:14px; border-bottom:2px solid #1a365d; padding-bottom:5px; margin-bottom:10px;">GENERAL TERMS & CONDITIONS (PARTICIPANT CONTRACT)</div>
    <div class="terms-container" style="grid-template-columns: 1fr;"><div class="terms-box en">
      <div class="article-title">Article 1 - General Regulations for Exhibitions</div><p>General specifications concerning the organization of the Exhibition, its opening/closing dates, and location are decided and may be modified by the organizer.</p>
      <div class="article-title">Article 2 - Conditions for Participation</div><p>An Exhibitor may present only products or services manufactured, designed, represented, or authorized by himself. All exhibits must comply with the regulations of Saudi Arabia.</p>
      <div class="article-title">Article 3 - Applications</div><p>Submission of the participation application form constitutes a binding undertaking to pay the full price of the stand hire and all associated costs.</p>
      <div class="article-title">Article 5 - Assignment / Sub-letting</div><p>Without prior written consent, an exhibitor shall not transfer, sublet, or share all or part of the allocated space.</p>
      <div class="article-title">Article 6 - Withdrawal</div><p>In the event of withdrawal or non-occupation, all sums paid and/or remaining due shall be retained by the organizer.</p>
      <div class="article-title">Article 11 - Allocation of Stands</div><p>The organizer establishes the layout and allocates sites at his free will and may modify the size and layout of the requested area.</p>
      <div class="article-title">Article 19 - Visa & Customs</div><p>It is the sole responsibility of the exhibitor to complete visa formalities and customs clearances.</p>
      <div class="article-title">Article 28 - Governing Law and Jurisdiction</div><p>This agreement shall be governed by the laws of the Kingdom of Saudi Arabia. The Arabic text remains the primary legal reference.</p>
    </div></div>
    <div class="page-number">4 (4)</div>
  </div>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`);
    printWindow!.document.close();
    return;
    const statusValue = String(contract.status ?? "draft");
    const packageValue = String(contract.package_type ?? "");
    const currency = String(contract.currency ?? "SAR");
    const pricePerSqm = contract.price_per_sqm == null ? "—" : formatMoney(contract.price_per_sqm, currency);
    const total = contract.total_amount == null ? "—" : formatMoney(contract.total_amount, currency);
    const field = (label: string, value: unknown, wide = false) => `
      <div class="field ${wide ? "wide" : ""}">
        <span>${escapePrintValue(label)}</span>
        <strong>${escapePrintValue(value)}</strong>
      </div>`;
    printWindow!.document.write(`<!doctype html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <title>Participation Contract - ${escapePrintValue(contract.contract_number)}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              color: #111827;
              background: #eef2f7;
              font-family: Arial, "Tahoma", sans-serif;
            }
            .sheet {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              padding: 10mm;
              background: #ffffff;
              border: 1px solid #d7dde6;
            }
            .top {
              display: grid;
              grid-template-columns: 1fr 118px;
              gap: 16px;
              align-items: start;
              direction: ltr;
              border-bottom: 4px solid #111827;
              padding-bottom: 10px;
            }
            .title h1 {
              margin: 0;
              color: #111827;
              font-size: 38px;
              line-height: 0.95;
              font-weight: 900;
              letter-spacing: 0;
            }
            .title h2 {
              margin: 8px 0 0;
              color: #0f766e;
              font-size: 18px;
              font-weight: 800;
            }
            .event {
              margin-top: 10px;
              color: #374151;
              font-size: 13px;
              line-height: 1.55;
              direction: ltr;
            }
            .logo {
              border: 2px solid #111827;
              min-height: 92px;
              display: grid;
              place-items: center;
              text-align: center;
              font-weight: 900;
              font-size: 13px;
              line-height: 1.2;
            }
            .contract-number {
              margin-top: 8px;
              padding: 7px 10px;
              border: 1px solid #111827;
              text-align: center;
              font-size: 12px;
              font-weight: 800;
            }
            .section {
              margin-top: 12px;
              border: 2px solid #111827;
            }
            .section-title {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              padding: 7px 10px;
              color: #ffffff;
              background: #111827;
              font-size: 14px;
              font-weight: 900;
              letter-spacing: 0;
            }
            .fields {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 0;
              border-top: 1px solid #111827;
            }
            .field {
              min-height: 43px;
              padding: 7px 9px;
              border-inline-start: 1px solid #cbd5e1;
              border-bottom: 1px solid #cbd5e1;
              direction: ltr;
            }
            .field:nth-child(2n) { border-inline-start: 0; }
            .field.wide { grid-column: 1 / -1; }
            .field span {
              display: block;
              color: #475569;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
            }
            .field strong {
              display: block;
              margin-top: 5px;
              min-height: 18px;
              color: #111827;
              border-bottom: 1px solid #111827;
              font-size: 13px;
              font-weight: 700;
              overflow-wrap: anywhere;
            }
            .participation-grid {
              display: grid;
              grid-template-columns: 1.4fr 0.8fr 0.8fr 0.9fr;
              border-top: 1px solid #111827;
              direction: ltr;
            }
            .participation-grid div {
              min-height: 58px;
              padding: 8px;
              border-inline-end: 1px solid #cbd5e1;
              border-bottom: 1px solid #cbd5e1;
            }
            .participation-grid div:last-child { border-inline-end: 0; }
            .participation-grid span {
              display: block;
              color: #475569;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
            }
            .participation-grid strong {
              display: block;
              margin-top: 7px;
              font-size: 14px;
              border-bottom: 1px solid #111827;
            }
            .terms {
              padding: 10px 12px;
              font-size: 11px;
              line-height: 1.55;
              direction: ltr;
            }
            .terms p { margin: 0 0 7px; }
            .terms-ar {
              direction: rtl;
              text-align: right;
              color: #374151;
            }
            .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 18px;
              margin-top: 16px;
              direction: ltr;
            }
            .signature {
              min-height: 90px;
              padding: 10px;
              border: 1px solid #111827;
            }
            .signature b {
              display: block;
              margin-bottom: 16px;
              font-size: 12px;
            }
            .line {
              height: 26px;
              border-bottom: 1px solid #111827;
              margin-bottom: 8px;
            }
            .footer {
              margin-top: 12px;
              display: flex;
              justify-content: space-between;
              color: #475569;
              font-size: 11px;
              direction: ltr;
            }
            @media print {
              body { background: #ffffff; }
              .sheet { width: auto; min-height: auto; border: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          <main class="sheet">
            <header class="top">
              <div class="title">
                <h1>PARTICIPATION<br />CONTRACT 2026</h1>
                <h2>عقد المشاركة 2026</h2>
                <div class="event">
                  22 - 25 December 2026<br />
                  At the Hilton Hotel, the Grand Hilton Hall<br />
                  Jeddah, Saudi Arabia<br />
                  <span dir="rtl">من 22 الى 25 ديسمبر 2026 - جدة، المملكة العربية السعودية</span>
                </div>
              </div>
              <div>
                <div class="logo">RAWNAQ &<br />ELEGANCE<br />EXPO</div>
                <div class="contract-number">${escapePrintValue(contract.contract_number)}</div>
              </div>
            </header>

            <section class="section">
              <div class="section-title"><span>EXHIBITOR</span><span>العارض</span></div>
              <div class="fields">
                ${field("Company name / اسم الشركة", contract.company_name)}
                ${field("Brand name / العلامة التجارية", contract.brand_name)}
                ${field("Contact person / الشخص المسؤول", contract.contact_name)}
                ${field("E-mail / البريد الإلكتروني", contract.email)}
                ${field("Tel / هاتف", contract.phone)}
                ${field("Mobile / الجوال", contract.mobile)}
                ${field("Website / الموقع الإلكتروني", contract.website)}
                ${field("Fax / فاكس", contract.fax)}
                ${field("Address / العنوان", contract.address, true)}
                ${field("City / المدينة", contract.city)}
                ${field("Country / الدولة", contract.country)}
              </div>
            </section>

            <section class="section">
              <div class="section-title"><span>PARTICIPATION</span><span>المشاركة</span></div>
              <div class="participation-grid">
                <div><span>Stand Number / رقم الجناح</span><strong>${escapePrintValue(contract.stand_number)}</strong></div>
                <div><span>Location / فئة الموقع</span><strong>${escapePrintValue(contract.location_category)}</strong></div>
                <div><span>Space / المساحة</span><strong>${escapePrintValue(contract.space_sqm)} sqm</strong></div>
                <div><span>Status / الحالة</span><strong>${escapePrintValue(statusLabels[statusValue] ?? statusValue)}</strong></div>
                <div><span>Package / نوع المشاركة</span><strong>${escapePrintValue(packageLabels[packageValue] ?? packageValue)}</strong></div>
                <div><span>Price / sqm</span><strong>${escapePrintValue(pricePerSqm)}</strong></div>
                <div><span>Total / الإجمالي</span><strong>${escapePrintValue(total)}</strong></div>
                <div><span>Date / التاريخ</span><strong>${escapePrintValue(cleanDate(contract.contract_date))}</strong></div>
              </div>
            </section>

            <section class="section">
              <div class="section-title"><span>PAYMENT METHOD</span><span>طريقة الدفع</span></div>
              <div class="terms">
                <p>• By bank transfer. Banking information will be mentioned in the invoice.</p>
                <p>• Payment by transfer must state on the transfer order: “Settlement at no cost to the payee.”</p>
                <p class="terms-ar">• يتم الدفع عن طريق التحويل البنكي وتذكر بيانات التحويل في الفاتورة.</p>
              </div>
            </section>

            <section class="section">
              <div class="section-title"><span>EXHIBITOR'S DECLARATION</span><span>إقرار العارض</span></div>
              <div class="terms">
                <p>For the avoidance of doubt, reference to Exhibitor within this declaration and within the Terms & Conditions shall include reference to all their Co-Exhibitors.</p>
                <p>I, the undersigned, declare that I am aware of the Terms & Conditions, possess a copy thereof, and accept, without reservation, all its clauses.</p>
                <p class="terms-ar">أقر أنا الموقع أدناه بعلمي بالشروط والأحكام وقبولي لها دون تحفظ.</p>
                <p><b>Notes:</b> ${escapePrintValue(contract.notes)}</p>
              </div>
            </section>

            <div class="signatures">
              <div class="signature">
                <b>Exhibitor / العارض</b>
                <div class="line">${escapePrintValue(contract.contact_name)}</div>
                <div class="line">Date / التاريخ</div>
              </div>
              <div class="signature">
                <b>Organizer / المنظم</b>
                <div class="line"></div>
                <div class="line">Date / التاريخ</div>
              </div>
            </div>

            <footer class="footer">
              <span>www.alsawsanexpo.com</span>
              <span>Participation Contract 2026</span>
            </footer>
          </main>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>`);
    printWindow!.document.close();
  }

  async function saveContract() {
    if (!companyName.trim() || !contactName.trim() || !packageType) {
      setSaveStatus(text.validation);
      return;
    }
    setSaveStatus(text.saving);
    const payload = {
      lead_id: leadId ? Number(leadId) : null,
      company_name: companyName.trim(),
      brand_name: brandName.trim() || null,
      contact_name: contactName.trim(),
      email: email.trim() || null,
      website: website.trim() || null,
      phone: phone.trim() || null,
      mobile: mobile.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      country: country.trim() || null,
      stand_number: standNumber.trim() || null,
      location_category: locationCategory,
      package_type: packageType,
      space_sqm: spaceSqm ? Number(spaceSqm) : null,
      price_per_sqm: pricePerSqm ? Number(pricePerSqm) : null,
      total_amount: displayedTotal ? Number(displayedTotal) : null,
      contract_date: contractDate || null,
      notes: notes.trim() || null,
    };
    try {
      if (editingContractId) {
        await updateBackend("participation-contracts", editingContractId, payload);
        setSaveStatus(text.updated);
      } else {
        await createBackend("participation-contracts", payload);
        setSaveStatus(text.saved);
      }
      resetContractForm();
      await contracts.reload();
    } catch {
      setSaveStatus(text.failed);
    }
    window.setTimeout(() => setSaveStatus(""), 2200);
  }

  return (
    <div className="quotes-page-grid">
      <article className="quote-card quote-form-card">
        <div className="card-title">
          <h3>{text.formTitle}</h3>
          <span>{text.formSubtitle}</span>
        </div>
        <div className="form-grid">
          <label className="quote-field quote-field-customer contract-lead-select-field">
            <span>{text.customer}</span>
            <DashboardSelect
              ariaLabel={text.customer}
              menuClassName="contract-lead-select-menu"
              onValueChange={applyLeadData}
              options={(leads.data ?? []).map((lead) => ({
                label: String(lead.company_name ?? lead.name ?? lead.id),
                value: String(lead.id),
              }))}
              placeholder=""
              searchable
              searchPlaceholder={text.customerSearch}
              value={leadId}
            />
            {!selectedLead ? <small className="quote-duration-hint">{text.noCustomerData}</small> : null}
          </label>
          <label className="quote-field">
            <span>{text.companyName} <b className="required-mark">*</b></span>
            <input onChange={(event) => setCompanyName(event.target.value)} value={companyName} />
          </label>
          <label className="quote-field">
            <span>{text.brandName}</span>
            <input onChange={(event) => setBrandName(event.target.value)} value={brandName} />
          </label>
          <label className="quote-field">
            <span>{text.contactName} <b className="required-mark">*</b></span>
            <input onChange={(event) => setContactName(event.target.value)} value={contactName} />
          </label>
          <label className="quote-field">
            <span>{text.mobile}</span>
            <input inputMode="tel" onChange={(event) => setMobile(event.target.value)} value={mobile} />
          </label>
          <label className="quote-field">
            <span>{text.email}</span>
            <input onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
          </label>
          <label className="quote-field">
            <span>{text.website}</span>
            <input onChange={(event) => setWebsite(event.target.value)} value={website} />
          </label>
          <label className="quote-field">
            <span>{text.phone}</span>
            <input inputMode="tel" onChange={(event) => setPhone(event.target.value)} value={phone} />
          </label>
          <label className="quote-field">
            <span>{text.standNumber}</span>
            <input onChange={(event) => setStandNumber(event.target.value)} value={standNumber} />
          </label>
          <label className="quote-field">
            <span>{text.locationCategory}</span>
            <DashboardSelect
              ariaLabel={text.locationCategory}
              onValueChange={setLocationCategory}
              options={[
                {label: text.standard, value: "standard"},
                {label: text.premium, value: "premium"},
              ]}
              value={locationCategory}
            />
          </label>
          <label className="quote-field">
            <span>{text.packageType} <b className="required-mark">*</b></span>
            <DashboardSelect
              ariaLabel={text.packageType}
              onValueChange={setPackageType}
              options={[
                {label: text.spaceOnly, value: "space_only"},
                {label: text.shellScheme, value: "space_shell_scheme"},
              ]}
              value={packageType}
            />
          </label>
          <label className="quote-field">
            <span>{text.spaceSqm}</span>
            <input inputMode="decimal" min="0" onChange={(event) => setSpaceSqm(event.target.value)} type="number" value={spaceSqm} />
          </label>
          <label className="quote-field">
            <span>{text.pricePerSqm}</span>
            <input inputMode="decimal" min="0" onChange={(event) => setPricePerSqm(event.target.value)} type="number" value={pricePerSqm} />
          </label>
          <label className="quote-field">
            <span>{text.totalAmount}</span>
            <input inputMode="decimal" min="0" onChange={(event) => setTotalAmount(event.target.value)} placeholder={computedTotal} type="number" value={totalAmount} />
          </label>
          <label className="quote-field">
            <span>{text.contractDate}</span>
            <input onChange={(event) => setContractDate(event.target.value)} type="date" value={contractDate} />
          </label>
          <label className="quote-field">
            <span>{text.city}</span>
            <input onChange={(event) => setCity(event.target.value)} value={city} />
          </label>
          <label className="quote-field">
            <span>{text.country}</span>
            <input onChange={(event) => setCountry(event.target.value)} value={country} />
          </label>
        </div>
        <label className="quote-details-field">
          <span>{text.address}</span>
          <textarea onChange={(event) => setAddress(event.target.value)} value={address} />
        </label>
        <label className="quote-details-field">
          <span>{text.notes}</span>
          <textarea onChange={(event) => setNotes(event.target.value)} value={notes} />
        </label>
        <div className="quote-action-row">
          <button className="button button-primary" onClick={() => void saveContract()} type="button">
            {editingContractId ? text.update : text.save}
          </button>
          {saveStatus ? <p className="quote-validation">{saveStatus}</p> : null}
        </div>
      </article>

      <article className="quote-card quote-history-card">
        <div className="card-title">
          <div>
            <h3>{text.listTitle}</h3>
            <span>{text.listSubtitle}</span>
          </div>
        </div>
        <div className="contract-summary-grid">
          <div className="contract-summary-card">
            <span className="contract-summary-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
            </span>
            <div>
              <span>{isArabic ? "إجمالي عقود المشاركة" : "Total participation contracts"}</span>
              <strong>{participationContractStats.total.toLocaleString(NUMBER_LOCALE)}</strong>
            </div>
          </div>
          <div className="contract-summary-card">
            <span className="contract-summary-icon success">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M12 9v6" /><path d="M8 12h8" /></svg>
            </span>
            <div>
              <span>{isArabic ? "القيمة الإجمالية" : "Total value"}</span>
              <strong>{formatMoney(participationContractStats.value, "SAR")}</strong>
            </div>
          </div>
          <div className="contract-summary-card">
            <span className="contract-summary-icon warning">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5" /><path d="M12 16h.01" /></svg>
            </span>
            <div>
              <span>{isArabic ? "بانتظار الاعتماد والتوقيع" : "Pending approval and signature"}</span>
              <strong>{participationContractStats.pending.toLocaleString(NUMBER_LOCALE)}</strong>
            </div>
          </div>
        </div>
        <div className="contract-smart-filter-row" aria-label={isArabic ? "فلاتر قائمة العقود" : "Contract list filters"}>
          <div className="contract-smart-search">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="10.8" cy="10.8" r="6.2" />
              <path d="m15.5 15.5 4 4" />
            </svg>
            <input
              onChange={(event) => setParticipationSearch(event.target.value)}
              placeholder={isArabic ? "\\u0627\\u0628\\u062d\\u062b \\u0628\\u0627\\u0644\\u0627\\u0633\\u0645\\u060c \\u0627\\u0644\\u0634\\u0631\\u0643\\u0629\\u060c \\u0627\\u0644\\u062c\\u0648\\u0627\\u0644..." : "Search by name, company, mobile..."}
              type="search"
              value={participationSearch}
            />
            <strong>{filteredContracts.length.toLocaleString(NUMBER_LOCALE)}</strong>
          </div>
          <div className="contract-smart-select">
            <DashboardSelect
              ariaLabel={text.locationCategory}
              onValueChange={setLocationFilter}
              options={[
                {label: isArabic ? "كل فئات الموقع" : "All locations", value: "all"},
                {label: text.standard, value: "standard"},
                {label: text.premium, value: "premium"},
              ]}
              value={locationFilter}
            />
          </div>
          <div className="contract-smart-select">
            <DashboardSelect
              ariaLabel={text.packageType}
              onValueChange={setContractTypeFilter}
              options={[
                {label: isArabic ? "كل أنواع العقد" : "All contract types", value: "all"},
                {label: text.spaceOnly, value: "space_only"},
                {label: text.shellScheme, value: "space_shell_scheme"},
              ]}
              value={contractTypeFilter}
            />
          </div>
          <button className="contract-smart-reset" onClick={resetContractFilters} type="button">
            {isArabic ? "إعادة تعيين" : "Reset"}
          </button>
        </div>
        <div className="quote-history-table">
          <table>
            <thead>
              <tr>
                <th>{isArabic ? "\\u0631\\u0642\\u0645 \\u0627\\u0644\\u0639\\u0642\\u062f" : "Contract #"}</th>
                <th>{text.customer}</th>
                <th>{text.companyName}</th>
                <th>{text.packageType}</th>
                <th>{text.spaceSqm}</th>
                <th>{text.totalAmount}</th>
                <th>{isArabic ? "\\u0627\\u0644\\u062d\\u0627\\u0644\\u0629" : "Status"}</th>
                <th>{text.contractDate}</th>
                <th>{text.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((contract) => {
                const packageValue = String(contract.package_type ?? "");
                const statusValue = String(contract.status ?? "draft");
                return (
                  <tr key={contract.id}>
                    <td>{String(contract.contract_number ?? contract.id)}</td>
                    <td>{String(contract.customer_name ?? "-")}</td>
                    <td>{String(contract.company_name ?? "-")}</td>
                    <td>{packageLabels[packageValue] ?? packageValue}</td>
                    <td>{Number(contract.space_sqm ?? 0).toLocaleString(NUMBER_LOCALE)}</td>
                    <td>{formatMoney(contract.total_amount, String(contract.currency ?? "SAR"))}</td>
                    <td><span className={`quote-status ${statusValue}`}>{statusLabels[statusValue] ?? statusValue}</span></td>
                    <td>{cleanDate(contract.contract_date)}</td>
                    <td>
                      <div className="contract-table-actions">
                        <button aria-label={text.edit} className="contract-table-action icon" onClick={() => editContract(contract)} title={text.edit} type="button">
                          <ContractActionIcon type="edit" />
                        </button>
                        <button aria-label={text.print} className="contract-table-action primary icon" onClick={() => printContract(contract)} title={text.print} type="button">
                          <ContractActionIcon type="print" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!contracts.loading && !filteredContracts.length ? (
                <tr>
                  <td className="quote-history-empty" colSpan={9}>{text.noContracts}</td>
                </tr>
              ) : null}
              {contracts.loading ? (
                <tr>
                  <td className="quote-history-empty" colSpan={9}>{isArabic ? "جاري التحميل..." : "Loading..."}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

export function SponsorshipContractsPanel({locale}: {locale: string}) {
  const isArabic = locale === "ar";
  const contracts = useBackend<BackendRow[]>("/api/v1/data/sponsorship-contracts");
  const leads = useBackend<BackendRow[]>("/api/v1/data/leads");
  const [leadId, setLeadId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Saudi Arabia");
  const [standNumber, setStandNumber] = useState("");
  const [sponsorshipCategory, setSponsorshipCategory] = useState("gold");
  const [packageType, setPackageType] = useState("sponsorship_participation");
  const [spaceSqm, setSpaceSqm] = useState("");
  const [pricePerSqm, setPricePerSqm] = useState("");
  const [sponsorshipAmount, setSponsorshipAmount] = useState("");
  const [registrationFee, setRegistrationFee] = useState("500");
  const [otherServicesAmount, setOtherServicesAmount] = useState("");
  const [contractDate, setContractDate] = useState(() => dateAfterDays(0));
  const [notes, setNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [editingContractId, setEditingContractId] = useState<number | null>(null);
  const [sponsorshipSearch, setSponsorshipSearch] = useState("");
  const [sponsorshipCategoryFilter, setSponsorshipCategoryFilter] = useState("all");
  const [sponsorshipContractTypeFilter, setSponsorshipContractTypeFilter] = useState("all");

  const text = isArabic
    ? {
        formTitle: "إضافة بيانات العقد",
        formSubtitle: "بيانات عقد الرعاية مرتبطة مباشرة بالعملاء المهتمين",
        listTitle: "قائمة العقود",
        listSubtitle: "عقود الرعاية التي تم إدخالها من حسابك",
        customer: "العميل المهتم",
        customerPlaceholder: "اختر العميل المهتم",
        customerSearch: "ابحث باسم العميل أو الشركة",
        companyName: "اسم الشركة",
        brandName: "العلامة التجارية",
        contactName: "الشخص المسؤول",
        email: "البريد الإلكتروني",
        website: "الموقع الإلكتروني",
        phone: "الهاتف",
        mobile: "الجوال",
        address: "العنوان",
        city: "المدينة",
        country: "الدولة",
        standNumber: "رقم الجناح",
        sponsorshipCategory: "فئة الرعاية",
        packageType: "نوع العقد",
        spaceSqm: "المساحة بالمتر",
        pricePerSqm: "السعر للمتر",
        sponsorshipAmount: "مبلغ الرعاية",
        registrationFee: "رسوم التسجيل",
        otherServicesAmount: "خدمات أخرى",
        vatAmount: "ضريبة القيمة المضافة",
        grandTotal: "الإجمالي النهائي",
        contractDate: "تاريخ العقد",
        notes: "ملاحظات",
        save: "حفظ العقد",
        update: "تحديث العقد",
        edit: "تعديل",
        print: "طباعة",
        actions: "الإجراءات",
        saving: "جاري الحفظ...",
        saved: "تم حفظ العقد",
        updated: "تم تحديث العقد",
        failed: "تعذر حفظ العقد",
        validation: "أدخل اسم الشركة، الشخص المسؤول، وفئة الرعاية",
        noCustomerData: "اختر عميلاً مهتماً لتعبئة بيانات الشركة تلقائياً",
        noContracts: "لا توجد عقود رعاية حتى الآن",
        sponsorshipParticipation: "رعاية ومشاركة",
        sponsorshipOnly: "رعاية فقط",
        platinum: "راعي بلاتيني",
        gold: "راعي ذهبي",
        silver: "راعي فضي",
        partner: "شريك استراتيجي",
        draft: "مسودة",
        sent: "مرسل",
        signed: "موقع",
        cancelled: "ملغي",
      }
    : {
        formTitle: "Add contract details",
        formSubtitle: "Sponsorship contract details linked to interested customers",
        listTitle: "Contracts list",
        listSubtitle: "Sponsorship contracts entered from your account",
        customer: "Interested customer",
        customerPlaceholder: "Select interested customer",
        customerSearch: "Search by customer or company",
        companyName: "Company name",
        brandName: "Brand name",
        contactName: "Contact person",
        email: "Email",
        website: "Website",
        phone: "Phone",
        mobile: "Mobile",
        address: "Address",
        city: "City",
        country: "Country",
        standNumber: "Stand number",
        sponsorshipCategory: "Sponsorship category",
        packageType: "Contract type",
        spaceSqm: "Space sqm",
        pricePerSqm: "Price per sqm",
        sponsorshipAmount: "Sponsorship amount",
        registrationFee: "Registration fee",
        otherServicesAmount: "Other services",
        vatAmount: "VAT",
        grandTotal: "Grand total",
        contractDate: "Contract date",
        notes: "Notes",
        save: "Save contract",
        update: "Update contract",
        edit: "Edit",
        print: "Print",
        actions: "Actions",
        saving: "Saving...",
        saved: "Contract saved",
        updated: "Contract updated",
        failed: "Unable to save contract",
        validation: "Enter company name, contact person, and sponsorship category",
        noCustomerData: "Select an interested customer to fill company details automatically",
        noContracts: "No sponsorship contracts yet",
        sponsorshipParticipation: "Sponsorship & participation",
        sponsorshipOnly: "Sponsorship only",
        platinum: "Platinum sponsor",
        gold: "Gold sponsor",
        silver: "Silver sponsor",
        partner: "Strategic partner",
        draft: "Draft",
        sent: "Sent",
        signed: "Signed",
        cancelled: "Cancelled",
      };

  const amounts = useMemo(() => {
    const includesParticipation = packageType === "sponsorship_participation";
    const boothAmount = includesParticipation
      ? Number(spaceSqm || 0) * Number(pricePerSqm || 0)
      : 0;
    const sponsorship = Number(sponsorshipAmount || 0);
    const registration = Number(registrationFee || 0);
    const other = Number(otherServicesAmount || 0);
    const subtotal = boothAmount + sponsorship + registration + other;
    const vat = subtotal * 0.15;
    return {boothAmount, subtotal, vat, grandTotal: subtotal + vat};
  }, [otherServicesAmount, packageType, pricePerSqm, registrationFee, spaceSqm, sponsorshipAmount]);
  const showParticipationFields = packageType === "sponsorship_participation";

  useEffect(() => {
    if (packageType !== "sponsorship_only") return;
    setSpaceSqm("");
    setPricePerSqm("");
  }, [packageType]);
  const selectedLead = (leads.data ?? []).find((lead) => String(lead.id) === leadId);
  const statusLabels: Record<string, string> = {
    draft: text.draft,
    sent: text.sent,
    signed: text.signed,
    cancelled: text.cancelled,
  };
  const categoryLabels: Record<string, string> = {
    platinum: text.platinum,
    gold: text.gold,
    silver: text.silver,
    partner: text.partner,
  };
  const packageLabels: Record<string, string> = {
    sponsorship_participation: text.sponsorshipParticipation,
    sponsorship_only: text.sponsorshipOnly,
  };
  const filteredSponsorshipContracts = useMemo(() => {
    const query = sponsorshipSearch.trim().toLocaleLowerCase();
    return (contracts.data ?? []).filter((contract) => {
      const matchesSearch =
        !query ||
        [
          contract.contract_number,
          contract.customer_name,
          contract.company_name,
          contract.contact_name,
          contract.email,
          contract.phone,
          contract.mobile,
          contract.sponsorship_category,
          contract.package_type,
        ].some((value) => String(value ?? "").toLocaleLowerCase().includes(query));
      const matchesCategory =
        sponsorshipCategoryFilter === "all" ||
        String(contract.sponsorship_category ?? "") === sponsorshipCategoryFilter;
      const matchesContractType =
        sponsorshipContractTypeFilter === "all" ||
        String(contract.package_type ?? "") === sponsorshipContractTypeFilter;
      return matchesSearch && matchesCategory && matchesContractType;
    });
  }, [contracts.data, sponsorshipCategoryFilter, sponsorshipContractTypeFilter, sponsorshipSearch]);
  const resetSponsorshipFilters = () => {
    setSponsorshipSearch("");
    setSponsorshipCategoryFilter("all");
    setSponsorshipContractTypeFilter("all");
  };
  const sponsorshipContractStats = useMemo(() => {
    const rows = contracts.data ?? [];
    return {
      total: rows.length,
      value: rows.reduce((sum, contract) => sum + Number(contract.grand_total ?? 0), 0),
      pending: rows.filter((contract) =>
        ["draft", "sent"].includes(String(contract.status ?? "draft")),
      ).length,
    };
  }, [contracts.data]);

  function applyLeadData(nextLeadId: string) {
    setLeadId(nextLeadId);
    const lead = (leads.data ?? []).find((item) => String(item.id) === nextLeadId);
    if (!lead) return;
    setCompanyName(String(lead.company_name ?? lead.name ?? ""));
    setContactName(String(lead.name ?? ""));
    setEmail(String(lead.email ?? ""));
    setPhone(String(lead.phone ?? ""));
    setMobile(String(lead.phone ?? ""));
    setAddress(String(lead.address ?? ""));
  }

  function resetContractForm() {
    setEditingContractId(null);
    setLeadId("");
    setCompanyName("");
    setBrandName("");
    setContactName("");
    setEmail("");
    setWebsite("");
    setPhone("");
    setMobile("");
    setAddress("");
    setCity("");
    setCountry("Saudi Arabia");
    setStandNumber("");
    setSponsorshipCategory("gold");
    setPackageType("sponsorship_participation");
    setSpaceSqm("");
    setPricePerSqm("");
    setSponsorshipAmount("");
    setRegistrationFee("500");
    setOtherServicesAmount("");
    setContractDate(dateAfterDays(0));
    setNotes("");
  }

  function editContract(contract: BackendRow) {
    setEditingContractId(Number(contract.id));
    setLeadId(contract.lead_id ? String(contract.lead_id) : "");
    setCompanyName(String(contract.company_name ?? ""));
    setBrandName(String(contract.brand_name ?? ""));
    setContactName(String(contract.contact_name ?? ""));
    setEmail(String(contract.email ?? ""));
    setWebsite(String(contract.website ?? ""));
    setPhone(String(contract.phone ?? ""));
    setMobile(String(contract.mobile ?? ""));
    setAddress(String(contract.address ?? ""));
    setCity(String(contract.city ?? ""));
    setCountry(String(contract.country ?? "Saudi Arabia"));
    setStandNumber(String(contract.stand_number ?? ""));
    setSponsorshipCategory(String(contract.sponsorship_category ?? "gold"));
    setPackageType(String(contract.package_type ?? "sponsorship_participation"));
    setSpaceSqm(contract.space_sqm == null ? "" : String(contract.space_sqm));
    setPricePerSqm(contract.price_per_sqm == null ? "" : String(contract.price_per_sqm));
    setSponsorshipAmount(contract.sponsorship_amount == null ? "" : String(contract.sponsorship_amount));
    setRegistrationFee(contract.registration_fee == null ? "" : String(contract.registration_fee));
    setOtherServicesAmount(contract.other_services_amount == null ? "" : String(contract.other_services_amount));
    setContractDate(cleanDate(contract.contract_date) === "—" ? dateAfterDays(0) : cleanDate(contract.contract_date));
    setNotes(String(contract.notes ?? ""));
    window.scrollTo({top: 0, behavior: "smooth"});
  }

  function escapePrintValue(value: unknown) {
    return String(value ?? "—")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function printContract(contract: BackendRow) {
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) return;
    const currency = String(contract.currency ?? "SAR");
    const printIncludesParticipation = String(contract.package_type ?? "sponsorship_participation") === "sponsorship_participation";
    const contractTitleEn = printIncludesParticipation ? "SPONSORSHIP & PARTICIPATION CONTRACT" : "SPONSORSHIP CONTRACT";
    const contractTitleAr = printIncludesParticipation ? "عقد الرعاية والمشاركة" : "عقد الرعاية";
    const declarationAr = printIncludesParticipation
      ? "أقر أنا الموقع أدناه بصحة البيانات وقبولي شروط عقد الرعاية والمشاركة."
      : "أقر أنا الموقع أدناه بصحة البيانات وقبولي شروط عقد الرعاية.";
    const declarationEn = printIncludesParticipation
      ? "I hereby confirm the accuracy of the information and accept the terms of this sponsorship and participation contract."
      : "I hereby confirm the accuracy of the information and accept the terms of this sponsorship contract.";
    const printSpaceSqm = Number(contract.space_sqm ?? 0);
    const printPricePerSqm = Number(contract.price_per_sqm ?? 0);
    const boothAmount = printIncludesParticipation
      ? printSpaceSqm * printPricePerSqm
      : 0;
    const sponsorship = Number(contract.sponsorship_amount ?? 0);
    const registration = Number(contract.registration_fee ?? 0);
    const other = Number(contract.other_services_amount ?? 0);
    const subtotal = boothAmount + sponsorship + registration + other;
    const vat = Number(contract.vat_amount ?? subtotal * 0.15);
    const grandTotal = Number(contract.grand_total ?? subtotal + vat);
    const field = (labelAr: string, labelEn: string, value: unknown) => `
      <td class="label-cell">${escapePrintValue(labelAr)}<br><span>${escapePrintValue(labelEn)}</span></td>
      <td class="input-cell">${escapePrintValue(value)}</td>`;
    const checked = (value: string) =>
      String(contract.sponsorship_category ?? "") === value ? "checked" : "";
    const companyAddressRow = printIncludesParticipation
      ? `<tr>${field("العنوان", "Address", contract.address)}${field("رقم الجناح", "Stand No.", contract.stand_number)}</tr>`
      : `<tr>${field("العنوان", "Address", contract.address)}${field("رقم العقد", "Contract No.", contract.contract_number)}</tr>`;
    const participationFeeRows = printIncludesParticipation
      ? `
        <tr><td>المساحة بالمتر</td><td class="en-text">Space SQM</td><td>${printSpaceSqm.toLocaleString(NUMBER_LOCALE)}</td><td>متر مربع</td></tr>
        <tr><td>السعر للمتر</td><td class="en-text">Price Per SQM</td><td>${printPricePerSqm.toLocaleString(NUMBER_LOCALE)}</td><td>${escapePrintValue(currency)}</td></tr>
        <tr><td>قيمة المساحة</td><td class="en-text">Space Amount</td><td>${boothAmount.toLocaleString(NUMBER_LOCALE)}</td><td>${escapePrintValue(currency)}</td></tr>`
      : "";

    printWindow.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${escapePrintValue(contractTitleAr)} - ${escapePrintValue(contract.contract_number)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&family=Montserrat:wght@300;400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4 portrait; margin: 0; }
    body { font-family: 'Cairo', Arial, sans-serif; font-size: 10.5px; color: #333; line-height: 1.35; background: #f4f6f9; }
    .en-text { font-family: 'Montserrat', Arial, sans-serif; direction: ltr; text-align: left; }
    .page { width: 210mm; height: 297mm; padding: 11mm; margin: 0 auto; background: #fff; position: relative; overflow: hidden; }
    .header-table, .form-table, .pricing-table { width: 100%; border-collapse: collapse; }
    .header-table { margin-bottom: 12px; }
    .header-table td { border: none; padding: 5px; vertical-align: middle; }
    .logo-area { text-align: center; font-size: 24px; font-weight: bold; color: #a88734; border: 2px solid #a88734; padding: 10px; border-radius: 5px; }
    .main-title { text-align: center; color: #1a2a3a; }
    .main-title h1 { font-size: 17px; color: #a88734; letter-spacing: 1px; }
    .main-title h2 { font-size: 15px; margin: 3px 0; }
    .main-title p { font-size: 10px; color: #666; }
    .section-title { background: #1a2a3a; color: #fff; padding: 6px 10px; font-size: 12px; font-weight: bold; margin: 12px 0 8px; border-radius: 3px; display: flex; justify-content: space-between; }
    .form-table td, .pricing-table th, .pricing-table td { border: 1px solid #d8d8d8; padding: 5px; vertical-align: middle; }
    .label-cell { background: #f9f9f9; font-weight: 700; width: 22%; }
    .label-cell span { color: #777; font-size: 8.5px; direction: ltr; }
    .input-cell { width: 28%; min-height: 22px; color: #111; font-weight: 600; }
    .pricing-table th { background: #f1f1f1; color: #1a2a3a; }
    .checkbox-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; margin-top: 6px; }
    .checkbox-item { border: 1px solid #d8d8d8; padding: 6px; min-height: 34px; display: flex; align-items: center; justify-content: space-between; }
    .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 14px; }
    .sig-box { border: 1px solid #aaa; padding: 10px; height: 88px; }
    .sig-line { border-bottom: 1px solid #777; height: 26px; margin-top: 12px; }
    .two-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .activity-box { border: 1px solid #ddd; padding: 8px; min-height: 88px; }
    .activity-box h3 { color: #1a2a3a; font-size: 12px; margin-bottom: 6px; }
    .terms-container { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; text-align: justify; font-size: 8.5px; line-height: 1.45; }
    .terms-box.en { direction: ltr; text-align: left; font-family: 'Montserrat', Arial, sans-serif; }
    .article-title { font-weight: 700; margin-top: 7px; color: #1a2a3a; }
    .page-number { position: absolute; bottom: 7mm; left: 50%; transform: translateX(-50%); color: #777; font-size: 9px; }
    @media print {
      body { background: #fff; }
      .page { margin: 0; page-break-after: always; break-after: page; }
    }
  </style>
</head>
<body>
  <section class="page">
    <table class="header-table">
      <tr>
        <td style="width:25%"><div class="logo-area">REE</div></td>
        <td class="main-title" style="width:50%">
          <h1>${escapePrintValue(contractTitleEn)}</h1>
          <h2>${escapePrintValue(contractTitleAr)}</h2>
          <p>Rawnaq & Elegance Expo 2026 - Jeddah Hilton</p>
        </td>
        <td class="en-text" style="width:25%; font-size:10px">
          Contract No.<br><b>${escapePrintValue(contract.contract_number)}</b><br>
          Date<br><b>${escapePrintValue(cleanDate(contract.contract_date))}</b>
        </td>
      </tr>
    </table>
    <div class="section-title"><span>بيانات الشركة</span><span class="en-text">COMPANY DETAILS</span></div>
    <table class="form-table">
      <tr>${field("اسم الشركة", "Company Name", contract.company_name)}${field("العلامة التجارية", "Brand", contract.brand_name)}</tr>
      <tr>${field("الشخص المسؤول", "Contact Person", contract.contact_name)}${field("البريد الإلكتروني", "Email", contract.email)}</tr>
      <tr>${field("الجوال", "Mobile", contract.mobile)}${field("الهاتف", "Phone", contract.phone)}</tr>
      <tr>${field("الموقع الإلكتروني", "Website", contract.website)}${field("المدينة / الدولة", "City / Country", `${String(contract.city ?? "")} / ${String(contract.country ?? "")}`)}</tr>
      ${companyAddressRow}
    </table>
    <div class="section-title"><span>فئة الرعاية</span><span class="en-text">SPONSORSHIP CATEGORY</span></div>
    <div class="checkbox-row">
      <label class="checkbox-item">راعي بلاتيني <input type="checkbox" ${checked("platinum")}></label>
      <label class="checkbox-item">راعي ذهبي <input type="checkbox" ${checked("gold")}></label>
      <label class="checkbox-item">راعي فضي <input type="checkbox" ${checked("silver")}></label>
      <label class="checkbox-item">شريك استراتيجي <input type="checkbox" ${checked("partner")}></label>
    </div>
    <div class="section-title"><span>الرسوم</span><span class="en-text">FEES</span></div>
    <table class="pricing-table">
      <thead><tr><th>البند</th><th class="en-text">Item</th><th>المبلغ</th><th>العملة</th></tr></thead>
      <tbody>
        ${participationFeeRows}
        <tr><td>مبلغ الرعاية</td><td class="en-text">Sponsorship Amount</td><td>${sponsorship.toLocaleString(NUMBER_LOCALE)}</td><td>${escapePrintValue(currency)}</td></tr>
        <tr><td>رسوم التسجيل</td><td class="en-text">Registration Fee</td><td>${registration.toLocaleString(NUMBER_LOCALE)}</td><td>${escapePrintValue(currency)}</td></tr>
        <tr><td>خدمات أخرى</td><td class="en-text">Other Services</td><td>${other.toLocaleString(NUMBER_LOCALE)}</td><td>${escapePrintValue(currency)}</td></tr>
        <tr><td>ضريبة القيمة المضافة 15%</td><td class="en-text">VAT 15%</td><td>${vat.toLocaleString(NUMBER_LOCALE)}</td><td>${escapePrintValue(currency)}</td></tr>
        <tr><td><b>الإجمالي النهائي</b></td><td class="en-text"><b>Grand Total</b></td><td><b>${grandTotal.toLocaleString(NUMBER_LOCALE)}</b></td><td>${escapePrintValue(currency)}</td></tr>
      </tbody>
    </table>
    <div class="signature-section">
      <div class="sig-box"><b>الراعي / Sponsor</b><div class="sig-line">${escapePrintValue(contract.contact_name)}</div></div>
      <div class="sig-box"><b>المنظم / Organizer</b><div class="sig-line"></div></div>
    </div>
    <div class="page-number">1 / 3</div>
  </section>
  <section class="page">
    <div class="section-title"><span>بيانات النشاط</span><span class="en-text">BUSINESS ACTIVITIES</span></div>
    <div class="two-columns">
      <div class="activity-box"><h3>المنتجات والخدمات</h3><p>${escapePrintValue(contract.notes || "تفاصيل المنتجات أو الخدمات التي سيتم عرضها ضمن الرعاية.")}</p></div>
      <div class="activity-box en-text"><h3>Products & Services</h3><p>${escapePrintValue(contract.notes || "Products or services to be promoted during the sponsorship.")}</p></div>
      <div class="activity-box"><h3>الفئة المستهدفة</h3><p>زوار المعرض، العملاء المهتمون، الشركاء التجاريون، وصناع القرار.</p></div>
      <div class="activity-box en-text"><h3>Target Visitors</h3><p>Expo visitors, interested customers, business partners, and decision makers.</p></div>
    </div>
    <div class="section-title"><span>إقرار الراعي</span><span class="en-text">SPONSOR DECLARATION</span></div>
    <table class="form-table">
      <tr><td>${escapePrintValue(declarationAr)}</td></tr>
      <tr><td class="en-text">${escapePrintValue(declarationEn)}</td></tr>
    </table>
    <div class="signature-section">
      <div class="sig-box"><b>الاسم / Name</b><div class="sig-line">${escapePrintValue(contract.contact_name)}</div></div>
      <div class="sig-box"><b>الختم / Stamp</b><div class="sig-line"></div></div>
    </div>
    <div class="page-number">2 / 3</div>
  </section>
  <section class="page">
    <div class="section-title"><span>الشروط والأحكام</span><span class="en-text">TERMS & CONDITIONS</span></div>
    <div class="terms-container">
      <div class="terms-box">
        <div class="article-title">المادة 1 - الالتزام</div><p>يعد توقيع هذا العقد التزامًا بسداد كامل قيمة الرعاية والخدمات المتفق عليها.</p>
        <div class="article-title">المادة 2 - السداد</div><p>يتم السداد حسب الفاتورة الصادرة من المنظم، ولا يعد الحجز مؤكدًا إلا بعد اعتماد الدفعة المطلوبة.</p>
        <div class="article-title">المادة 3 - التنازل</div><p>لا يحق للراعي التنازل عن حقوق الرعاية أو مشاركتها مع طرف آخر دون موافقة خطية من المنظم.</p>
        <div class="article-title">المادة 4 - الإلغاء</div><p>في حال الإلغاء أو عدم الحضور، يحق للمنظم الاحتفاظ بالمبالغ المدفوعة والمستحقة وفق سياسة المعرض.</p>
        <div class="article-title">المادة 5 - النظام العام</div><p>يلتزم الراعي بتعليمات إدارة المعرض والجهات الرسمية طوال فترة التجهيز والتشغيل.</p>
      </div>
      <div class="terms-box en">
        <div class="article-title">Article 1 - Commitment</div><p>Signing this contract is a binding commitment to pay the full sponsorship and related service fees.</p>
        <div class="article-title">Article 2 - Payment</div><p>Payment shall be made according to the organizer's invoice. Booking is confirmed only after the required payment is approved.</p>
        <div class="article-title">Article 3 - Assignment</div><p>The sponsor may not assign or share sponsorship rights with another party without written organizer approval.</p>
        <div class="article-title">Article 4 - Cancellation</div><p>In case of cancellation or non-attendance, the organizer may retain paid and due amounts according to expo policy.</p>
        <div class="article-title">Article 5 - Compliance</div><p>The sponsor shall comply with expo management and official authority instructions during setup and operation.</p>
      </div>
    </div>
    <div class="page-number">3 / 3</div>
  </section>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`);
    printWindow.document.close();
  }

  async function saveContract() {
    if (!companyName.trim() || !contactName.trim() || !sponsorshipCategory) {
      setSaveStatus(text.validation);
      return;
    }
    setSaveStatus(text.saving);
    const payload = {
      lead_id: leadId ? Number(leadId) : null,
      company_name: companyName.trim(),
      brand_name: brandName.trim() || null,
      contact_name: contactName.trim(),
      email: email.trim() || null,
      website: website.trim() || null,
      phone: phone.trim() || null,
      mobile: mobile.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      country: country.trim() || null,
      stand_number: standNumber.trim() || null,
      sponsorship_category: sponsorshipCategory,
      package_type: packageType,
      space_sqm: showParticipationFields && spaceSqm ? Number(spaceSqm) : 0,
      price_per_sqm: showParticipationFields && pricePerSqm ? Number(pricePerSqm) : 0,
      sponsorship_amount: sponsorshipAmount ? Number(sponsorshipAmount) : 0,
      registration_fee: registrationFee ? Number(registrationFee) : 0,
      other_services_amount: otherServicesAmount ? Number(otherServicesAmount) : 0,
      vat_amount: amounts.vat,
      grand_total: amounts.grandTotal,
      contract_date: contractDate || null,
      notes: notes.trim() || null,
    };
    try {
      if (editingContractId) {
        await updateBackend("sponsorship-contracts", editingContractId, payload);
        setSaveStatus(text.updated);
      } else {
        await createBackend("sponsorship-contracts", payload);
        setSaveStatus(text.saved);
      }
      resetContractForm();
      await contracts.reload();
    } catch {
      setSaveStatus(text.failed);
    }
    window.setTimeout(() => setSaveStatus(""), 2200);
  }

  return (
    <div className="quotes-page-grid">
      <article className="quote-card quote-form-card">
        <div className="card-title">
          <h3>{text.formTitle}</h3>
          <span>{text.formSubtitle}</span>
        </div>
        <div className="form-grid">
          <label className="quote-field quote-field-customer contract-lead-select-field">
            <span>{text.customer}</span>
            <DashboardSelect
              ariaLabel={text.customer}
              menuClassName="contract-lead-select-menu"
              onValueChange={applyLeadData}
              options={(leads.data ?? []).map((lead) => ({
                label: String(lead.company_name ?? lead.name ?? lead.id),
                value: String(lead.id),
              }))}
              placeholder=""
              searchable
              searchPlaceholder={text.customerSearch}
              value={leadId}
            />
            {!selectedLead ? <small className="quote-duration-hint">{text.noCustomerData}</small> : null}
          </label>
          <label className="quote-field"><span>{text.companyName} <b className="required-mark">*</b></span><input onChange={(event) => setCompanyName(event.target.value)} value={companyName} /></label>
          <label className="quote-field"><span>{text.brandName}</span><input onChange={(event) => setBrandName(event.target.value)} value={brandName} /></label>
          <label className="quote-field"><span>{text.contactName} <b className="required-mark">*</b></span><input onChange={(event) => setContactName(event.target.value)} value={contactName} /></label>
          <label className="quote-field"><span>{text.mobile}</span><input inputMode="tel" onChange={(event) => setMobile(event.target.value)} value={mobile} /></label>
          <label className="quote-field"><span>{text.email}</span><input onChange={(event) => setEmail(event.target.value)} type="email" value={email} /></label>
          <label className="quote-field"><span>{text.website}</span><input onChange={(event) => setWebsite(event.target.value)} value={website} /></label>
          <label className="quote-field"><span>{text.phone}</span><input inputMode="tel" onChange={(event) => setPhone(event.target.value)} value={phone} /></label>
          <label className="quote-field"><span>{text.standNumber}</span><input onChange={(event) => setStandNumber(event.target.value)} value={standNumber} /></label>
          <label className="quote-field">
            <span>{text.sponsorshipCategory} <b className="required-mark">*</b></span>
            <DashboardSelect
              ariaLabel={text.sponsorshipCategory}
              onValueChange={setSponsorshipCategory}
              options={[
                {label: text.platinum, value: "platinum"},
                {label: text.gold, value: "gold"},
                {label: text.silver, value: "silver"},
                {label: text.partner, value: "partner"},
              ]}
              value={sponsorshipCategory}
            />
          </label>
          <label className="quote-field">
            <span>{text.packageType}</span>
            <DashboardSelect
              ariaLabel={text.packageType}
              onValueChange={setPackageType}
              options={[
                {label: text.sponsorshipParticipation, value: "sponsorship_participation"},
                {label: text.sponsorshipOnly, value: "sponsorship_only"},
              ]}
              value={packageType}
            />
          </label>
          {showParticipationFields ? (
            <>
              <label className="quote-field"><span>{text.spaceSqm}</span><input inputMode="decimal" min="0" onChange={(event) => setSpaceSqm(event.target.value)} type="number" value={spaceSqm} /></label>
              <label className="quote-field"><span>{text.pricePerSqm}</span><input inputMode="decimal" min="0" onChange={(event) => setPricePerSqm(event.target.value)} type="number" value={pricePerSqm} /></label>
            </>
          ) : null}
          <label className="quote-field"><span>{text.sponsorshipAmount}</span><input inputMode="decimal" min="0" onChange={(event) => setSponsorshipAmount(event.target.value)} type="number" value={sponsorshipAmount} /></label>
          <label className="quote-field"><span>{text.registrationFee}</span><input inputMode="decimal" min="0" onChange={(event) => setRegistrationFee(event.target.value)} type="number" value={registrationFee} /></label>
          <label className="quote-field"><span>{text.otherServicesAmount}</span><input inputMode="decimal" min="0" onChange={(event) => setOtherServicesAmount(event.target.value)} type="number" value={otherServicesAmount} /></label>
          <label className="quote-field"><span>{text.vatAmount}</span><input readOnly value={amounts.vat.toLocaleString(NUMBER_LOCALE)} /></label>
          <label className="quote-field"><span>{text.contractDate}</span><input onChange={(event) => setContractDate(event.target.value)} type="date" value={contractDate} /></label>
          <label className="quote-field"><span>{text.city}</span><input onChange={(event) => setCity(event.target.value)} value={city} /></label>
          <label className="quote-field"><span>{text.country}</span><input onChange={(event) => setCountry(event.target.value)} value={country} /></label>
        </div>
        <label className="quote-details-field"><span>{text.address}</span><textarea onChange={(event) => setAddress(event.target.value)} value={address} /></label>
        <label className="quote-details-field"><span>{text.notes}</span><textarea onChange={(event) => setNotes(event.target.value)} value={notes} /></label>
        <div className="quote-action-row">
          <button className="button button-primary" onClick={() => void saveContract()} type="button">
            {editingContractId ? text.update : text.save}
          </button>
          {saveStatus ? <p className="quote-validation">{saveStatus}</p> : null}
        </div>
      </article>

      <article className="quote-card quote-history-card">
        <div className="card-title">
          <div>
            <h3>{text.listTitle}</h3>
            <span>{text.listSubtitle}</span>
          </div>
        </div>
        <div className="contract-summary-grid">
          <div className="contract-summary-card">
            <span className="contract-summary-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
            </span>
            <div>
              <span>{isArabic ? "إجمالي عقود الرعاية" : "Total sponsorship contracts"}</span>
              <strong>{sponsorshipContractStats.total.toLocaleString(NUMBER_LOCALE)}</strong>
            </div>
          </div>
          <div className="contract-summary-card">
            <span className="contract-summary-icon success">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M12 9v6" /><path d="M8 12h8" /></svg>
            </span>
            <div>
              <span>{isArabic ? "القيمة الإجمالية" : "Total value"}</span>
              <strong>{formatMoney(sponsorshipContractStats.value, "SAR")}</strong>
            </div>
          </div>
          <div className="contract-summary-card">
            <span className="contract-summary-icon warning">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5" /><path d="M12 16h.01" /></svg>
            </span>
            <div>
              <span>{isArabic ? "بانتظار الاعتماد والتوقيع" : "Pending approval and signature"}</span>
              <strong>{sponsorshipContractStats.pending.toLocaleString(NUMBER_LOCALE)}</strong>
            </div>
          </div>
        </div>
        <div className="contract-smart-filter-row">
          <div className="contract-smart-search">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="10.8" cy="10.8" r="6.2" />
              <path d="m15.5 15.5 4 4" />
            </svg>
            <input
              onChange={(event) => setSponsorshipSearch(event.target.value)}
              placeholder={isArabic ? "\\u0627\\u0628\\u062d\\u062b \\u0628\\u0627\\u0644\\u0627\\u0633\\u0645\\u060c \\u0627\\u0644\\u0634\\u0631\\u0643\\u0629\\u060c \\u0627\\u0644\\u062c\\u0648\\u0627\\u0644..." : "Search by name, company, mobile..."}
              type="search"
              value={sponsorshipSearch}
            />
            <strong>{filteredSponsorshipContracts.length.toLocaleString(NUMBER_LOCALE)}</strong>
          </div>
          <div className="contract-smart-select">
            <DashboardSelect
              ariaLabel={text.sponsorshipCategory}
              onValueChange={setSponsorshipCategoryFilter}
              options={[
                {label: isArabic ? "جميع أنواع الرعاية" : "All sponsorship types", value: "all"},
                {label: text.platinum, value: "platinum"},
                {label: text.gold, value: "gold"},
                {label: text.silver, value: "silver"},
                {label: text.partner, value: "partner"},
              ]}
              value={sponsorshipCategoryFilter}
            />
          </div>
          <div className="contract-smart-select">
            <DashboardSelect
              ariaLabel={text.packageType}
              onValueChange={setSponsorshipContractTypeFilter}
              options={[
                {label: isArabic ? "كل أنواع العقد" : "All contract types", value: "all"},
                {label: text.sponsorshipParticipation, value: "sponsorship_participation"},
                {label: text.sponsorshipOnly, value: "sponsorship_only"},
              ]}
              value={sponsorshipContractTypeFilter}
            />
          </div>
          <button className="contract-smart-reset" onClick={resetSponsorshipFilters} type="button">
            {isArabic ? "إعادة تعيين" : "Reset"}
          </button>
        </div>
        <div className="quote-history-table">
          <table>
            <thead>
              <tr>
                <th>{isArabic ? "\\u0631\\u0642\\u0645 \\u0627\\u0644\\u0639\\u0642\\u062f" : "Contract #"}</th>
                <th>{text.customer}</th>
                <th>{text.companyName}</th>
                <th>{text.packageType}</th>
                <th>{text.sponsorshipCategory}</th>
                <th>{text.grandTotal}</th>
                <th>{isArabic ? "\\u0627\\u0644\\u062d\\u0627\\u0644\\u0629" : "Status"}</th>
                <th>{text.contractDate}</th>
                <th>{text.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredSponsorshipContracts.map((contract) => {
                const categoryValue = String(contract.sponsorship_category ?? "");
                const packageValue = String(contract.package_type ?? "sponsorship_participation");
                const statusValue = String(contract.status ?? "draft");
                return (
                  <tr key={contract.id}>
                    <td>{String(contract.contract_number ?? contract.id)}</td>
                    <td>{String(contract.customer_name ?? "-")}</td>
                    <td>{String(contract.company_name ?? "-")}</td>
                    <td>{packageLabels[packageValue] ?? packageValue}</td>
                    <td>{categoryLabels[categoryValue] ?? categoryValue}</td>
                    <td>{formatMoney(contract.grand_total, String(contract.currency ?? "SAR"))}</td>
                    <td><span className={`quote-status ${statusValue}`}>{statusLabels[statusValue] ?? statusValue}</span></td>
                    <td>{cleanDate(contract.contract_date)}</td>
                    <td>
                      <div className="contract-table-actions">
                        <button aria-label={text.edit} className="contract-table-action icon" onClick={() => editContract(contract)} title={text.edit} type="button"><ContractActionIcon type="edit" /></button>
                        <button aria-label={text.print} className="contract-table-action primary icon" onClick={() => printContract(contract)} title={text.print} type="button"><ContractActionIcon type="print" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!contracts.loading && !filteredSponsorshipContracts.length ? (
                <tr><td className="quote-history-empty" colSpan={9}>{text.noContracts}</td></tr>
              ) : null}
              {contracts.loading ? (
                <tr><td className="quote-history-empty" colSpan={9}>{isArabic ? "جاري التحميل..." : "Loading..."}</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

export function SalesOrdersPanel({locale}: {locale: string}) {
  const isArabic = locale === "ar";
  const orders = useBackend<BackendRow[]>("/api/v1/data/sales-orders");
  const leads = useBackend<BackendRow[]>("/api/v1/data/leads");
  const [leadId, setLeadId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Saudi Arabia");
  const [exhibitionName, setExhibitionName] = useState("Rawnaq Elegance Expo - Dec 2026");
  const [standNumber, setStandNumber] = useState("");
  const [itemDescription, setItemDescription] = useState("Space Only");
  const [uom, setUom] = useState("SQM");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [orderDate, setOrderDate] = useState(() => dateAfterDays(0));
  const [notes, setNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);

  const text = isArabic
    ? {
        formTitle: "إضافة بيانات أمر البيع",
        formSubtitle: "بيانات أمر البيع مرتبطة بالعملاء المهتمين",
        listTitle: "قائمة أوامر البيع",
        listSubtitle: "أوامر البيع التي تم إدخالها من حسابك",
        customer: "العميل المهتم",
        customerPlaceholder: "اختر العميل المهتم",
        customerSearch: "ابحث باسم العميل أو الشركة",
        companyName: "اسم الشركة",
        contactName: "الشخص المسؤول",
        email: "البريد الإلكتروني",
        phone: "الهاتف",
        address: "العنوان",
        city: "المدينة",
        country: "الدولة",
        exhibitionName: "المعرض",
        standNumber: "رقم الجناح",
        itemDescription: "الوصف",
        uom: "الوحدة",
        unitPrice: "سعر الوحدة",
        quantity: "الكمية",
        subtotal: "الإجمالي قبل الضريبة",
        vatAmount: "ضريبة 15%",
        grandTotal: "الإجمالي شامل الضريبة",
        orderDate: "تاريخ الأمر",
        notes: "ملاحظات",
        save: "حفظ أمر البيع",
        update: "تحديث أمر البيع",
        edit: "تعديل",
        print: "طباعة",
        actions: "الإجراءات",
        saving: "جاري الحفظ...",
        saved: "تم حفظ أمر البيع",
        updated: "تم تحديث أمر البيع",
        failed: "تعذر حفظ أمر البيع",
        validation: "أدخل اسم الشركة، الشخص المسؤول، والوصف",
        noCustomerData: "اختر عميلاً مهتماً لتعبئة بيانات الشركة تلقائياً",
        noOrders: "لا توجد أوامر بيع حتى الآن",
        draft: "مسودة",
        sent: "مرسل",
        approved: "معتمد",
        cancelled: "ملغي",
      }
    : {
        formTitle: "Add sales order details",
        formSubtitle: "Sales order details linked to interested customers",
        listTitle: "Sales orders list",
        listSubtitle: "Sales orders entered from your account",
        customer: "Interested customer",
        customerPlaceholder: "Select interested customer",
        customerSearch: "Search by customer or company",
        companyName: "Company name",
        contactName: "Contact person",
        email: "Email",
        phone: "Phone",
        address: "Address",
        city: "City",
        country: "Country",
        exhibitionName: "Exhibition",
        standNumber: "Stand number",
        itemDescription: "Description",
        uom: "UOM",
        unitPrice: "Unit price",
        quantity: "Quantity",
        subtotal: "Total before VAT",
        vatAmount: "VAT 15%",
        grandTotal: "Grand total with VAT",
        orderDate: "Order date",
        notes: "Notes",
        save: "Save sales order",
        update: "Update sales order",
        edit: "Edit",
        print: "Print",
        actions: "Actions",
        saving: "Saving...",
        saved: "Sales order saved",
        updated: "Sales order updated",
        failed: "Unable to save sales order",
        validation: "Enter company name, contact person, and description",
        noCustomerData: "Select an interested customer to fill company details automatically",
        noOrders: "No sales orders yet",
        draft: "Draft",
        sent: "Sent",
        approved: "Approved",
        cancelled: "Cancelled",
      };

  const amounts = useMemo(() => {
    const subtotal = roundMoney(Number(unitPrice || 0) * Number(quantity || 0));
    const vat = roundMoney(subtotal * 0.15);
    return {subtotal, vat, grandTotal: roundMoney(subtotal + vat)};
  }, [quantity, unitPrice]);
  const selectedLead = (leads.data ?? []).find((lead) => String(lead.id) === leadId);
  const statusLabels: Record<string, string> = {
    draft: text.draft,
    sent: text.sent,
    approved: text.approved,
    cancelled: text.cancelled,
  };

  function applyLeadData(nextLeadId: string) {
    setLeadId(nextLeadId);
    const lead = (leads.data ?? []).find((item) => String(item.id) === nextLeadId);
    if (!lead) return;
    setCompanyName(String(lead.company_name ?? lead.name ?? ""));
    setContactName(String(lead.name ?? ""));
    setEmail(String(lead.email ?? ""));
    setPhone(String(lead.phone ?? ""));
    setAddress(String(lead.address ?? ""));
  }

  function resetOrderForm() {
    setEditingOrderId(null);
    setLeadId("");
    setCompanyName("");
    setContactName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCity("");
    setCountry("Saudi Arabia");
    setExhibitionName("Rawnaq Elegance Expo - Dec 2026");
    setStandNumber("");
    setItemDescription("Space Only");
    setUom("SQM");
    setUnitPrice("");
    setQuantity("1");
    setOrderDate(dateAfterDays(0));
    setNotes("");
  }

  function editOrder(order: BackendRow) {
    setEditingOrderId(Number(order.id));
    setLeadId(order.lead_id ? String(order.lead_id) : "");
    setCompanyName(String(order.company_name ?? ""));
    setContactName(String(order.contact_name ?? ""));
    setEmail(String(order.email ?? ""));
    setPhone(String(order.phone ?? ""));
    setAddress(String(order.address ?? ""));
    setCity(String(order.city ?? ""));
    setCountry(String(order.country ?? "Saudi Arabia"));
    setExhibitionName(String(order.exhibition_name ?? "Rawnaq Elegance Expo - Dec 2026"));
    setStandNumber(String(order.stand_number ?? ""));
    setItemDescription(String(order.item_description ?? "Space Only"));
    setUom(String(order.uom ?? "SQM"));
    setUnitPrice(order.unit_price == null ? "" : String(order.unit_price));
    setQuantity(order.quantity == null ? "1" : String(order.quantity));
    setOrderDate(cleanDate(order.order_date) === "—" ? dateAfterDays(0) : cleanDate(order.order_date));
    setNotes(String(order.notes ?? ""));
    window.scrollTo({top: 0, behavior: "smooth"});
  }

  function escapePrintValue(value: unknown) {
    return String(value ?? "—")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function printOrder(order: BackendRow) {
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) return;
    const currency = String(order.currency ?? "SAR");
    const unit = Number(order.unit_price ?? 0);
    const qty = Number(order.quantity ?? 0);
    const subtotal = Number(order.subtotal ?? unit * qty);
    const vat = Number(order.vat_amount ?? subtotal * 0.15);
    const grandTotal = Number(order.grand_total ?? subtotal + vat);
    const money = (value: number) => `${value.toLocaleString(NUMBER_LOCALE)} ${currency}`;

    printWindow.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>أمر بيع - ${escapePrintValue(order.order_number)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Montserrat:wght@400;600;700&display=swap');
    * { box-sizing: border-box; }
    @page { size: A4 portrait; margin: 0; }
    body { font-family: 'Cairo', Arial, sans-serif; font-size: 11px; color: #2b2b2b; line-height: 1.5; background: #f5f7fa; margin: 0; }
    .en-text { font-family: 'Montserrat', Arial, sans-serif; direction: ltr; text-align: left; }
    .invoice-card { width: 210mm; height: 297mm; padding: 18mm 14mm; margin: 0 auto; background: #fff; position: relative; overflow: hidden; }
    .header-container { display: table; width: 100%; margin-bottom: 22px; border-bottom: 2px solid #a88734; padding-bottom: 14px; }
    .header-row { display: table-row; }
    .header-cell { display: table-cell; vertical-align: top; }
    .logo-area { width: 35%; }
    .logo-title-ar { font-size: 16px; font-weight: 700; color: #1a2a3a; margin-bottom: 2px; }
    .logo-title-en { font-family: 'Montserrat', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #7f8c8d; text-transform: uppercase; }
    .header-meta { width: 30%; text-align: center; vertical-align: middle; }
    .order-badge { background: #1a2a3a; color: #fff; padding: 8px 16px; font-size: 14px; font-weight: 700; border-radius: 4px; display: inline-block; }
    .header-info-right { width: 35%; text-align: left; font-size: 10px; color: #555; }
    .info-grid { display: table; width: 100%; margin-bottom: 20px; border: 1px solid #e2e8f0; background: #fcfdfd; }
    .info-row { display: table-row; }
    .info-cell { display: table-cell; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    .info-row:last-child .info-cell { border-bottom: none; }
    .info-cell.label, .info-cell.label-left { background: #f8fafc; font-weight: 600; color: #4a5568; width: 18%; }
    .info-cell.label { border-left: 1px solid #e2e8f0; }
    .info-cell.label-left { border-right: 1px solid #e2e8f0; border-left: 1px solid #e2e8f0; }
    .items-table { width: 100%; border-collapse: collapse; margin: 15px 0 20px; }
    .items-table th { background: #1a2a3a; color: #fff; font-size: 10px; font-weight: 600; padding: 8px; border: 1px solid #1a2a3a; text-align: center; }
    .items-table td { border: 1px solid #e2e8f0; padding: 8px; text-align: center; font-size: 10.5px; }
    .items-table td.desc { text-align: right; font-weight: 600; }
    .totals-table { width: 45%; float: left; border-collapse: collapse; margin-bottom: 22px; }
    .totals-table td { border: 1px solid #e2e8f0; padding: 6px 10px; font-size: 10.5px; }
    .totals-table td.label { background: #f8fafc; font-weight: 600; text-align: right; width: 60%; }
    .totals-table tr.grand-total { font-weight: 700; background: #f0fdf4; color: #15803d; border: 2px solid #15803d; }
    .clear { clear: both; }
    .payment-instruction { border: 1px solid #cbd5e1; border-radius: 4px; background: #fafbfc; padding: 12px; margin-bottom: 18px; }
    .payment-title { font-weight: 700; color: #a88734; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; font-size: 11.5px; }
    .bank-details-table { width: 100%; border-collapse: collapse; margin-top: 8px; background: #fff; }
    .bank-details-table td { border: 1px solid #e2e8f0; padding: 6px 10px; font-size: 10px; }
    .bank-details-table td.label { background: #f1f5f9; font-weight: 600; width: 22%; }
    .note-box { font-size: 9px; color: #ef4444; background: #fef2f2; border: 1px dashed #fca5a5; padding: 8px; border-radius: 4px; margin-top: 8px; line-height: 1.4; }
    .footer { position: absolute; right: 14mm; left: 14mm; bottom: 13mm; border-top: 1px solid #cbd5e1; padding-top: 10px; text-align: center; font-size: 8.5px; color: #64748b; line-height: 1.6; }
    @media print { body { background: #fff; } .invoice-card { margin: 0; } }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header-container">
      <div class="header-row">
        <div class="header-cell logo-area">
          <div class="logo-title-ar">السوسن للمعارض والمؤتمرات</div>
          <div class="logo-title-en">alsawsan exhibitions & conferences</div>
          <div style="margin-top:5px; font-size:9.5px; color:#64748b;">س ت: 7053346115<br>الرقم الضريبي: 314557638500003</div>
        </div>
        <div class="header-cell header-meta"><div class="order-badge">أمر بيع / Sales Order</div></div>
        <div class="header-cell header-info-right en-text">
          <strong>CR:</strong> 7053346115<br>
          <strong>VAT No.:</strong> 314557638500003<br>
          <strong>Email:</strong> salma.alhunaiti@ree-expo.com<br>
          <strong>Web:</strong> www.ree-expo.com
        </div>
      </div>
    </div>
    <div class="info-grid">
      <div class="info-row"><div class="info-cell label">العميل<br><span class="en-text">Customer</span></div><div class="info-cell" style="font-weight:600; font-size:12px;" colspan="3">${escapePrintValue(order.company_name)}</div></div>
      <div class="info-row">
        <div class="info-cell label">المعرض<br><span class="en-text">Exhibition</span></div><div class="info-cell" style="font-weight:600;">${escapePrintValue(order.exhibition_name)}</div>
        <div class="info-cell label-left">تاريخ الأمر<br><span class="en-text">Order Date</span></div><div class="info-cell">${escapePrintValue(cleanDate(order.order_date))}</div>
      </div>
      <div class="info-row">
        <div class="info-cell label">رقم الأمر<br><span class="en-text">Order No.</span></div><div class="info-cell">${escapePrintValue(order.order_number)}</div>
        <div class="info-cell label-left">رقم الجناح<br><span class="en-text">Stand Number</span></div><div class="info-cell">${escapePrintValue(order.stand_number)}</div>
      </div>
      <div class="info-row">
        <div class="info-cell label">التواصل<br><span class="en-text">Contact</span></div><div class="info-cell">${escapePrintValue(order.contact_name)} - ${escapePrintValue(order.phone)}</div>
        <div class="info-cell label-left">البريد<br><span class="en-text">Email</span></div><div class="info-cell">${escapePrintValue(order.email)}</div>
      </div>
    </div>
    <table class="items-table">
      <thead>
        <tr>
          <th style="width:35%;">الوصف<br><span class="en-text">Desc.</span></th>
          <th style="width:10%;">الوحدة<br><span class="en-text">UOM</span></th>
          <th style="width:15%;">سعر الوحدة<br><span class="en-text">Unit Price</span></th>
          <th style="width:10%;">الكمية<br><span class="en-text">QTY</span></th>
          <th style="width:15%;">الإجمالي الفرعي<br><span class="en-text">Sub-Total</span></th>
          <th style="width:15%;">الضرائب 15%<br><span class="en-text">Taxes</span></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="desc">${escapePrintValue(order.item_description)}</td>
          <td>${escapePrintValue(order.uom)}</td>
          <td>${money(unit)}</td>
          <td>${qty.toLocaleString(NUMBER_LOCALE)}</td>
          <td>${money(subtotal)}</td>
          <td class="en-text" style="color:#7f8c8d;">VAT 15%</td>
        </tr>
        <tr><td class="desc" style="color:#ccc;">&nbsp;</td><td></td><td></td><td></td><td></td><td></td></tr>
        <tr><td class="desc" style="color:#ccc;">&nbsp;</td><td></td><td></td><td></td><td></td><td></td></tr>
      </tbody>
    </table>
    <table class="totals-table">
      <tr><td class="label">الإجمالي الخاضع للضريبة<br><span class="en-text">Total Before VAT 15%</span></td><td style="text-align:center; font-weight:600;">${money(subtotal)}</td></tr>
      <tr><td class="label">ضريبة القيمة المضافة 15%<br><span class="en-text">VAT 15%</span></td><td style="text-align:center; font-weight:600;">${money(vat)}</td></tr>
      <tr class="grand-total"><td class="label" style="background:transparent; color:#15803d;">الإجمالي شامل القيمة المضافة<br><span class="en-text">Grand Total with VAT 15%</span></td><td style="text-align:center; font-size:12px;">${money(grandTotal)}</td></tr>
    </table>
    <div class="clear"></div>
    <div class="payment-instruction">
      <div class="payment-title">طريقة وتعليمات الدفع / METHOD OF PAYMENT & INSTRUCTION</div>
      <p>• <strong>الدفعة الأولى عند التوقيع:</strong> 50% من إجمالي المبلغ شامل الضريبة.<br><span class="en-text" style="display:block; font-size:9.5px; color:#555;">First installment upon signature: 50% of the total amount.</span></p>
      <p>• <strong>الدفعة النهائية:</strong> 50% المتبقية حسب تاريخ الفاتورة.<br><span class="en-text" style="display:block; font-size:9.5px; color:#555;">Final installment: remaining 50% as per invoice due date.</span></p>
      <div class="payment-title" style="margin-top:12px;">تفاصيل الحساب البنكي / Bank Details</div>
      <table class="bank-details-table">
        <tr><td class="label">اسم المستفيد<br><span class="en-text">Beneficiary Name</span></td><td>Alsawsan Exhibitions & Conferences</td></tr>
        <tr><td class="label">ملاحظات<br><span class="en-text">Notes</span></td><td>${escapePrintValue(order.notes)}</td></tr>
      </table>
      <div class="note-box">يرجى ذكر رقم أمر البيع عند التحويل. Please mention the sales order number when making payment.</div>
    </div>
    <div class="footer">Alsawsan Exhibitions & Conferences - Sales Order ${escapePrintValue(order.order_number)}</div>
  </div>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`);
    printWindow.document.close();
  }

  async function saveOrder() {
    if (!companyName.trim() || !contactName.trim() || !itemDescription.trim()) {
      setSaveStatus(text.validation);
      return;
    }
    setSaveStatus(text.saving);
    const payload = {
      lead_id: leadId ? Number(leadId) : null,
      company_name: companyName.trim(),
      contact_name: contactName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      country: country.trim() || null,
      exhibition_name: exhibitionName.trim() || "Rawnaq Elegance Expo - Dec 2026",
      stand_number: standNumber.trim() || null,
      item_description: itemDescription.trim(),
      uom: uom.trim() || "SQM",
      unit_price: unitPrice ? Number(unitPrice) : 0,
      quantity: quantity ? Number(quantity) : 1,
      subtotal: amounts.subtotal,
      vat_amount: amounts.vat,
      grand_total: amounts.grandTotal,
      order_date: orderDate || null,
      notes: notes.trim() || null,
    };
    try {
      if (editingOrderId) {
        await updateBackend("sales-orders", editingOrderId, payload);
        setSaveStatus(text.updated);
      } else {
        await createBackend("sales-orders", payload);
        setSaveStatus(text.saved);
      }
      resetOrderForm();
      await orders.reload();
    } catch {
      setSaveStatus(text.failed);
    }
    window.setTimeout(() => setSaveStatus(""), 2200);
  }

  return (
    <div className="quotes-page-grid">
      <article className="quote-card quote-form-card">
        <div className="card-title">
          <h3>{text.formTitle}</h3>
          <span>{text.formSubtitle}</span>
        </div>
        <div className="form-grid">
          <label className="quote-field quote-field-customer">
            <span>{text.customer}</span>
            <DashboardSelect
              ariaLabel={text.customer}
              onValueChange={applyLeadData}
              options={(leads.data ?? []).map((lead) => ({
                label: String(lead.company_name ?? lead.name ?? lead.id),
                value: String(lead.id),
              }))}
              placeholder={text.customerPlaceholder}
              searchable
              searchPlaceholder={text.customerSearch}
              value={leadId}
            />
            {!selectedLead ? <small className="quote-duration-hint">{text.noCustomerData}</small> : null}
          </label>
          <label className="quote-field rental-compact-label"><span>{text.companyName} <b className="required-mark">*</b></span><input onChange={(event) => setCompanyName(event.target.value)} value={companyName} /></label>
          <label className="quote-field rental-compact-label"><span>{text.contactName} <b className="required-mark">*</b></span><input onChange={(event) => setContactName(event.target.value)} value={contactName} /></label>
          <label className="quote-field"><span>{text.email}</span><input onChange={(event) => setEmail(event.target.value)} type="email" value={email} /></label>
          <label className="quote-field"><span>{text.phone}</span><input inputMode="tel" onChange={(event) => setPhone(event.target.value)} value={phone} /></label>
          <label className="quote-field"><span>{text.exhibitionName}</span><input onChange={(event) => setExhibitionName(event.target.value)} value={exhibitionName} /></label>
          <label className="quote-field"><span>{text.standNumber}</span><input onChange={(event) => setStandNumber(event.target.value)} value={standNumber} /></label>
          <label className="quote-field"><span>{text.itemDescription} <b className="required-mark">*</b></span><input onChange={(event) => setItemDescription(event.target.value)} value={itemDescription} /></label>
          <label className="quote-field"><span>{text.uom}</span><input onChange={(event) => setUom(event.target.value)} value={uom} /></label>
          <label className="quote-field"><span>{text.unitPrice}</span><input inputMode="decimal" min="0" onChange={(event) => setUnitPrice(event.target.value)} type="number" value={unitPrice} /></label>
          <label className="quote-field"><span>{text.quantity}</span><input inputMode="decimal" min="0" onChange={(event) => setQuantity(event.target.value)} type="number" value={quantity} /></label>
          <label className="quote-field"><span>{text.subtotal}</span><input readOnly value={amounts.subtotal.toLocaleString(NUMBER_LOCALE)} /></label>
          <label className="quote-field"><span>{text.vatAmount}</span><input readOnly value={amounts.vat.toLocaleString(NUMBER_LOCALE)} /></label>
          <label className="quote-field"><span>{text.grandTotal}</span><input readOnly value={amounts.grandTotal.toLocaleString(NUMBER_LOCALE)} /></label>
          <label className="quote-field"><span>{text.orderDate}</span><input onChange={(event) => setOrderDate(event.target.value)} type="date" value={orderDate} /></label>
          <label className="quote-field"><span>{text.city}</span><input onChange={(event) => setCity(event.target.value)} value={city} /></label>
          <label className="quote-field"><span>{text.country}</span><input onChange={(event) => setCountry(event.target.value)} value={country} /></label>
        </div>
        <label className="quote-details-field"><span>{text.address}</span><textarea onChange={(event) => setAddress(event.target.value)} value={address} /></label>
        <label className="quote-details-field"><span>{text.notes}</span><textarea onChange={(event) => setNotes(event.target.value)} value={notes} /></label>
        <div className="quote-action-row">
          <button className="button button-primary" onClick={() => void saveOrder()} type="button">
            {editingOrderId ? text.update : text.save}
          </button>
          {saveStatus ? <p className="quote-validation">{saveStatus}</p> : null}
        </div>
      </article>

      <article className="quote-card quote-history-card">
        <div className="card-title">
          <div>
            <h3>{text.listTitle}</h3>
            <span>{text.listSubtitle}</span>
          </div>
        </div>
        <div className="quote-history-table">
          <table>
            <thead>
              <tr>
                <th>{isArabic ? "رقم الأمر" : "Order #"}</th>
                <th>{text.customer}</th>
                <th>{text.companyName}</th>
                <th>{text.itemDescription}</th>
                <th>{text.grandTotal}</th>
                <th>{isArabic ? "\\u0627\\u0644\\u062d\\u0627\\u0644\\u0629" : "Status"}</th>
                <th>{text.orderDate}</th>
                <th>{text.actions}</th>
              </tr>
            </thead>
            <tbody>
              {(orders.data ?? []).map((order) => {
                const statusValue = String(order.status ?? "draft");
                return (
                  <tr key={order.id}>
                    <td>{String(order.order_number ?? order.id)}</td>
                    <td>{String(order.customer_name ?? "—")}</td>
                    <td>{String(order.company_name ?? "—")}</td>
                    <td>{String(order.item_description ?? "—")}</td>
                    <td>{formatMoney(order.grand_total, String(order.currency ?? "SAR"))}</td>
                    <td><span className={`quote-status ${statusValue}`}>{statusLabels[statusValue] ?? statusValue}</span></td>
                    <td>{cleanDate(order.order_date)}</td>
                    <td>
                      <div className="contract-table-actions">
                        <button aria-label={text.edit} className="contract-table-action icon" onClick={() => editOrder(order)} title={text.edit} type="button"><ContractActionIcon type="edit" /></button>
                        <button aria-label={text.print} className="contract-table-action primary icon" onClick={() => printOrder(order)} title={text.print} type="button"><ContractActionIcon type="print" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!orders.loading && !(orders.data ?? []).length ? (
                <tr><td className="quote-history-empty" colSpan={8}>{text.noOrders}</td></tr>
              ) : null}
              {orders.loading ? (
                <tr><td className="quote-history-empty" colSpan={8}>{isArabic ? "جاري التحميل..." : "Loading..."}</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

export function RentalContractsPanel({locale}: {locale: string}) {
  const isArabic = locale === "ar";
  const contracts = useBackend<BackendRow[]>("/api/v1/data/rental-contracts");
  const rentalBooths = useBackend<BackendRow[]>("/api/v1/data/rental-booths");
  const boothCatalog = useBackend<BackendRow[]>("/api/v1/data/booths");
  const leads = useBackend<BackendRow[]>("/api/v1/data/leads");
  const [contractNumber, setContractNumber] = useState("");
  const [leadId, setLeadId] = useState("");
  const [eventName, setEventName] = useState(isArabic ? "المعرض الدولي لصناع القهوة والشوكولاتة" : "International Coffee and Chocolate Makers Exhibition");
  const [eventDates, setEventDates] = useState(isArabic ? "8-10 أكتوبر 2026م (27-29 ربيع الآخر 1448هـ)" : "8-10 October 2026");
  const [eventLocation, setEventLocation] = useState(isArabic ? "فندق جدة هيلتون - القاعة الكبرى" : "Jeddah Hilton Hotel - Grand Hall");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Saudi Arabia");
  const [lessorName, setLessorName] = useState(isArabic ? "شركة نطاق الأعمال لتنظيم المعارض والمؤتمرات" : "Netaq Al Aamal Exhibitions & Conferences");
  const [firstPartyCr, setFirstPartyCr] = useState("");
  const [firstPartyRepresentative, setFirstPartyRepresentative] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [secondPartyCr, setSecondPartyCr] = useState("");
  const [secondPartyRepresentative, setSecondPartyRepresentative] = useState("");
  const [boothNumber, setBoothNumber] = useState("");
  const [participationCategory, setParticipationCategory] = useState(isArabic ? "كلاسيك (Classic)" : "Classic");
  const [boothSize, setBoothSize] = useState(isArabic ? "3x3 متر" : "3x3 m");
  const [rentalItem, setRentalItem] = useState(isArabic ? "\u0645\u0633\u0627\u062d\u0629 / \u062c\u0646\u0627\u062d \u062a\u0623\u062c\u064a\u0631\u064a" : "Rental space / booth");
  const [rentalLocation, setRentalLocation] = useState("");
  const [leaseStartDate, setLeaseStartDate] = useState(() => dateAfterDays(0));
  const [leaseEndDate, setLeaseEndDate] = useState(() => dateAfterDays(3));
  const [unitPrice, setUnitPrice] = useState("6500");
  const [quantity, setQuantity] = useState("1");
  const [contractDate, setContractDate] = useState(() => dateAfterDays(0));
  const [notes, setNotes] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending_payment");
  const [contractStatus, setContractStatus] = useState("draft");
  const [search, setSearch] = useState("");
  const [boothPickerOpen, setBoothPickerOpen] = useState(false);
  const [boothMapQuery, setBoothMapQuery] = useState("");
  const [boothMapZone, setBoothMapZone] = useState("all");
  const [saveStatus, setSaveStatus] = useState("");
  const [editingContractId, setEditingContractId] = useState<number | null>(null);

  const text = isArabic
    ? {
        formTitle: "\u0625\u0636\u0627\u0641\u0629 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0639\u0642\u062f \u0627\u0644\u062a\u0623\u062c\u064a\u0631\u064a",
        formSubtitle: "\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0639\u0642\u062f \u0645\u0631\u062a\u0628\u0637\u0629 \u0628\u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0627\u0644\u0645\u0647\u062a\u0645\u064a\u0646",
        listTitle: "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0639\u0642\u0648\u062f \u0627\u0644\u062a\u0623\u062c\u064a\u0631\u064a\u0629",
        listSubtitle: "\u0627\u0644\u0639\u0642\u0648\u062f \u0627\u0644\u062a\u0623\u062c\u064a\u0631\u064a\u0629 \u0627\u0644\u062a\u064a \u062a\u0645 \u0625\u062f\u062e\u0627\u0644\u0647\u0627 \u0645\u0646 \u062d\u0633\u0627\u0628\u0643",
        customer: "\u0627\u0644\u0639\u0645\u064a\u0644 \u0627\u0644\u0645\u0647\u062a\u0645",
        customerPlaceholder: "\u0627\u062e\u062a\u0631 \u0627\u0644\u0639\u0645\u064a\u0644 \u0627\u0644\u0645\u0647\u062a\u0645",
        customerSearch: "\u0627\u0628\u062d\u062b \u0628\u0627\u0633\u0645 \u0627\u0644\u0639\u0645\u064a\u0644 \u0623\u0648 \u0627\u0644\u0634\u0631\u0643\u0629",
        lessorName: "\u0627\u0644\u0645\u0624\u062c\u0631",
        tenantName: "\u0627\u0644\u0645\u0633\u062a\u0623\u062c\u0631",
        companyName: "\u0627\u0633\u0645 \u0627\u0644\u0634\u0631\u0643\u0629 / \u0627\u0644\u0645\u0624\u0633\u0633\u0629 \u0644\u0644\u0637\u0631\u0641 \u0627\u0644\u062b\u0627\u0646\u064a",
        contactName: "\u0627\u0633\u0645 \u0627\u0644\u0634\u062e\u0635 \u0627\u0644\u0645\u0633\u0624\u0648\u0644",
        email: "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a",
        phone: "\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644",
        address: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646",
        city: "\u0627\u0644\u0645\u062f\u064a\u0646\u0629",
        country: "\u0627\u0644\u062f\u0648\u0644\u0629",
        rentalItem: "\u0627\u0644\u0639\u064a\u0646 \u0627\u0644\u0645\u0624\u062c\u0631\u0629 / \u0627\u0644\u0648\u0635\u0641",
        rentalLocation: "\u0645\u0648\u0642\u0639 \u0627\u0644\u062a\u0623\u062c\u064a\u0631",
        leaseStartDate: "\u0628\u062f\u0627\u064a\u0629 \u0645\u062f\u0629 \u0627\u0644\u0625\u064a\u062c\u0627\u0631",
        leaseEndDate: "\u0646\u0647\u0627\u064a\u0629 \u0645\u062f\u0629 \u0627\u0644\u0625\u064a\u062c\u0627\u0631",
        unitPrice: "\u0642\u064a\u0645\u0629 \u0627\u0644\u0625\u064a\u062c\u0627\u0631 \u0645\u0639 \u0627\u0644\u0636\u0631\u064a\u0628\u0629",
        quantity: "\u0627\u0644\u0643\u0645\u064a\u0629 / \u0627\u0644\u0645\u062f\u0629",
        subtotal: "\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a \u0642\u0628\u0644 \u0627\u0644\u0636\u0631\u064a\u0628\u0629",
        vatAmount: "\u0636\u0631\u064a\u0628\u0629 \u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0645\u0636\u0627\u0641\u0629 15%",
        paymentStatus: "حالة السداد",
        pendingPayment: "بانتظار الدفع",
        paid: "تم الدفع",
        status: "الحالة",
        contractDate: "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0639\u0642\u062f",
        notes: "\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0648\u0634\u0631\u0648\u0637",
        save: "\u062d\u0641\u0638 \u0627\u0644\u0639\u0642\u062f",
        update: "\u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0639\u0642\u062f",
        edit: "\u062a\u0639\u062f\u064a\u0644",
        print: "\u0637\u0628\u0627\u0639\u0629",
        actions: "\u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a",
        saving: "\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638...",
        saved: "\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0639\u0642\u062f",
        updated: "\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0639\u0642\u062f",
        failed: "\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u0627\u0644\u0639\u0642\u062f",
        validation: "\u0623\u062f\u062e\u0644 \u0627\u0633\u0645 \u0627\u0644\u0634\u0631\u0643\u0629\u060c \u0627\u0644\u0634\u062e\u0635 \u0627\u0644\u0645\u0633\u0624\u0648\u0644\u060c \u0648\u0648\u0635\u0641 \u0627\u0644\u0639\u064a\u0646 \u0627\u0644\u0645\u0624\u062c\u0631\u0629",
        noCustomerData: "\u0627\u062e\u062a\u0631 \u0639\u0645\u064a\u0644\u0627\u064b \u0645\u0647\u062a\u0645\u0627\u064b \u0644\u062a\u0639\u0628\u0626\u0629 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0634\u0631\u0643\u0629 \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b",
        noContracts: "\u0644\u0627 \u062a\u0648\u062c\u062f \u0639\u0642\u0648\u062f \u062a\u0623\u062c\u064a\u0631\u064a\u0629 \u062d\u062a\u0649 \u0627\u0644\u0622\u0646",
        contractNumber: "رقم العقد",
        eventName: "اسم الفعالية",
        eventDates: "تاريخ المعرض",
        eventLocation: "مكان المعرض",
        firstPartyCr: "السجل التجاري للطرف الأول",
        firstPartyRepresentative: "ممثل الطرف الأول",
        secondPartyCr: "السجل التجاري للطرف الثاني",
        secondPartyRepresentative: "ممثل الطرف الثاني",
        boothNumber: "رقم البوث",
        participationCategory: "فئة المشاركة",
        boothSize: "مساحة البوث",
        draft: "\u0645\u0633\u0648\u062f\u0629",
        sent: "\u0645\u0631\u0633\u0644",
        signed: "\u0645\u0648\u0642\u0639",
        cancelled: "\u0645\u0644\u063a\u064a",
      }    : {
        formTitle: "Add rental contract details",
        formSubtitle: "Rental contract details linked to interested customers",
        listTitle: "Rental contracts list",
        listSubtitle: "Rental contracts entered from your account",
        customer: "Interested customer",
        customerPlaceholder: "Select interested customer",
        customerSearch: "Search by customer or company",
        lessorName: "Lessor",
        tenantName: "Tenant",
        companyName: "Company name",
        contactName: "Contact person",
        email: "Email",
        phone: "Phone",
        address: "Address",
        city: "City",
        country: "Country",
        rentalItem: "Leased item / description",
        rentalLocation: "Rental location",
        leaseStartDate: "Lease start",
        leaseEndDate: "Lease end",
        unitPrice: "Rental value with VAT",
        quantity: "Quantity / period",
        subtotal: "Total before VAT",
        vatAmount: "VAT 15%",
        paymentStatus: "Payment status",
        pendingPayment: "Pending payment",
        paid: "Paid",
        status: "Status",
        contractDate: "Contract date",
        notes: "Notes and terms",
        save: "Save contract",
        update: "Update contract",
        edit: "Edit",
        print: "Print",
        actions: "Actions",
        saving: "Saving...",
        saved: "Contract saved",
        updated: "Contract updated",
        failed: "Unable to save contract",
        validation: "Enter company name, contact person, and leased item",
        noCustomerData: "Select an interested customer to fill company details automatically",
        noContracts: "No rental contracts yet",
        contractNumber: "Contract number",
        eventName: "Event name",
        eventDates: "Event date",
        eventLocation: "Event location",
        firstPartyCr: "First party CR",
        firstPartyRepresentative: "First party representative",
        secondPartyCr: "Second party CR",
        secondPartyRepresentative: "Second party representative",
        boothNumber: "Booth number",
        participationCategory: "Participation category",
        boothSize: "Booth size",
        draft: "Draft",
        sent: "Sent",
        signed: "Signed",
        cancelled: "Cancelled",
      };

  const amounts = useMemo(() => {
    const grandTotal = roundMoney(Number(unitPrice || 0) * Number(quantity || 0));
    const subtotal = roundMoney(grandTotal / 1.15);
    const vat = roundMoney(grandTotal - subtotal);
    return {subtotal, vat, grandTotal};
  }, [quantity, unitPrice]);
  const rentalContractAmounts = (contract: BackendRow) => {
    const unit = Number(contract.unit_price ?? 0);
    const qty = Number(contract.quantity ?? 1);
    const grandTotal = roundMoney(
      Number.isFinite(unit) && Number.isFinite(qty)
        ? unit * qty
        : Number(contract.grand_total ?? 0),
    );
    const subtotal = roundMoney(grandTotal / 1.15);
    const vat = roundMoney(grandTotal - subtotal);
    return {subtotal, vat, grandTotal};
  };
  const selectedLead = (leads.data ?? []).find((lead) => String(lead.id) === leadId);
  const statusLabels: Record<string, string> = {
    draft: text.draft,
    sent: text.sent,
    signed: text.signed,
    cancelled: text.cancelled,
  };
  const filteredContracts = useMemo(
    () => {
      const query = search.trim().toLocaleLowerCase();
      if (!query) return contracts.data ?? [];
      return (contracts.data ?? []).filter((contract) =>
        [
          contract.contract_number,
          contract.customer_name,
          contract.company_name,
          contract.contact_name,
          contract.rental_item,
          contract.phone,
        ].some((value) =>
          String(value ?? "").toLocaleLowerCase().includes(query),
        ),
      );
    },
    [contracts.data, search],
  );
  const boothReservationStatuses = useMemo(() => {
    const booths = new Map<string, string>();
    for (const booth of rentalBooths.data ?? []) {
      if (editingContractId && Number(booth.rental_contract_id) === editingContractId) continue;
      const value = String(booth.booth_number ?? "").trim().toUpperCase();
      const status = String(booth.status ?? "pending_payment").toLowerCase();
      if (value && ["pending_payment", "booked"].includes(status)) booths.set(value, status);
    }
    for (const contract of contracts.data ?? []) {
      if (editingContractId && Number(contract.id) === editingContractId) continue;
      if (String(contract.status ?? "").toLowerCase() === "cancelled") continue;
      const value = String(contract.booth_number ?? "").trim().toUpperCase();
      if (value && !booths.has(value)) {
        booths.set(
          value,
            String(contract.payment_status ?? "pending_payment") === "paid"
            ? "booked"
            : "pending_payment",
        );
      }
    }
    return booths;
  }, [contracts.data, editingContractId, rentalBooths.data]);
  const boothGroups = useMemo(() => {
    const boothMap = new Map<string, {id: string; area: string}>();
    for (const booth of RENTAL_BOOTH_POSITIONS) {
      boothMap.set(booth.id.toUpperCase(), {id: booth.id.toUpperCase(), area: booth.area});
    }
    for (const booth of boothCatalog.data ?? []) {
      if (String(booth.status ?? "available").toLowerCase() === "inactive") continue;
      const id = String(booth.booth_number ?? "").trim().toUpperCase();
      if (!id) continue;
      boothMap.set(id, {id, area: String(booth.booth_size ?? boothMap.get(id)?.area ?? "")});
    }
    const grouped = new Map<string, Array<{id: string; area: string}>>();
    for (const booth of boothMap.values()) {
      const label = booth.id.match(/^[A-Z]+/)?.[0] ?? "OTHER";
      const group = grouped.get(label) ?? [];
      group.push(booth);
      grouped.set(label, group);
    }
    const labels = [
      ...RENTAL_BOOTH_GROUP_LABELS,
      ...Array.from(grouped.keys()).filter((label) => !RENTAL_BOOTH_GROUP_LABELS.includes(label as (typeof RENTAL_BOOTH_GROUP_LABELS)[number])),
    ];
    return labels
      .map((label) => ({
        label,
        booths: (grouped.get(label) ?? []).sort((first, second) =>
          first.id.localeCompare(second.id, "en", {numeric: true}),
        ),
      }))
      .filter((group) => group.booths.length > 0);
  }, [boothCatalog.data]);
  const boothCatalogByNumber = useMemo(() => {
    const boothMap = new Map<string, BackendRow>();
    for (const booth of boothCatalog.data ?? []) {
      const id = String(booth.booth_number ?? "").trim().toUpperCase();
      if (id) boothMap.set(id, booth);
    }
    return boothMap;
  }, [boothCatalog.data]);
  const visibleBoothMapLayout = useMemo(() => {
    const queryValue = boothMapQuery.trim().toUpperCase();
    return PPT_BOOTH_LAYOUT.filter((booth) => {
      if (boothMapZone !== "all" && floorMapZoneForBooth(booth.id) !== boothMapZone) return false;
      if (!queryValue) return true;
      const boothId = booth.id.toUpperCase();
      const catalogBooth = boothCatalogByNumber.get(boothId);
      return [
        boothId,
        String(catalogBooth?.booth_size ?? ""),
        String(catalogBooth?.booth_dimensions ?? ""),
      ].some((value) => value.toUpperCase().includes(queryValue));
    });
  }, [boothCatalogByNumber, boothMapQuery, boothMapZone]);
  function selectBooth(nextBooth: string) {
    const normalizedBooth = nextBooth.trim().toUpperCase();
    if (boothReservationStatuses.has(normalizedBooth)) {
      setSaveStatus(isArabic ? "هذا البوث غير متاح حالياً" : "This booth is not available now");
      window.setTimeout(() => setSaveStatus(""), 2200);
      return;
    }
    const booth =
      boothGroups.flatMap((group) => group.booths).find((item) => item.id.toUpperCase() === normalizedBooth) ??
      RENTAL_BOOTH_POSITIONS.find((item) => item.id.toUpperCase() === normalizedBooth);
    setBoothNumber(normalizedBooth);
    if (booth?.area) setBoothSize(booth.area);
  }

  function applyLeadData(nextLeadId: string) {
    setLeadId(nextLeadId);
    const lead = (leads.data ?? []).find((item) => String(item.id) === nextLeadId);
    if (!lead) return;
    const company = String(lead.company_name ?? lead.name ?? "");
    setCompanyName(company);
    setTenantName(company);
    setContactName(String(lead.name ?? ""));
    setSecondPartyRepresentative(String(lead.name ?? ""));
    setEmail(String(lead.email ?? ""));
    setPhone(String(lead.phone ?? ""));
    setAddress(String(lead.address ?? ""));
  }

  function resetContractForm() {
    setEditingContractId(null);
    setContractNumber("");
    setLeadId("");
    setEventName(isArabic ? "المعرض الدولي لصناع القهوة والشوكولاتة" : "International Coffee and Chocolate Makers Exhibition");
    setEventDates(isArabic ? "8-10 أكتوبر 2026م (27-29 ربيع الآخر 1448هـ)" : "8-10 October 2026");
    setEventLocation(isArabic ? "فندق جدة هيلتون - القاعة الكبرى" : "Jeddah Hilton Hotel - Grand Hall");
    setCompanyName("");
    setContactName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCity("");
    setCountry("Saudi Arabia");
    setLessorName(isArabic ? "شركة نطاق الأعمال لتنظيم المعارض والمؤتمرات" : "Netaq Al Aamal Exhibitions & Conferences");
    setFirstPartyCr("");
    setFirstPartyRepresentative("");
    setTenantName("");
    setSecondPartyCr("");
    setSecondPartyRepresentative("");
    setBoothNumber("");
    setParticipationCategory(isArabic ? "كلاسيك (Classic)" : "Classic");
    setBoothSize(isArabic ? "3x3 متر" : "3x3 m");
    setRentalItem(isArabic ? "\u0645\u0633\u0627\u062d\u0629 / \u062c\u0646\u0627\u062d \u062a\u0623\u062c\u064a\u0631\u064a" : "Rental space / booth");
    setRentalLocation("");
    setLeaseStartDate(dateAfterDays(0));
    setLeaseEndDate(dateAfterDays(3));
    setUnitPrice("6500");
    setQuantity("1");
    setContractDate(dateAfterDays(0));
    setNotes("");
    setPaymentStatus("pending_payment");
    setContractStatus("draft");
  }

  function editContract(contract: BackendRow) {
    setEditingContractId(Number(contract.id));
    setContractNumber(String(contract.contract_number ?? ""));
    setLeadId(contract.lead_id ? String(contract.lead_id) : "");
    setEventName(String(contract.event_name ?? (isArabic ? "المعرض الدولي لصناع القهوة والشوكولاتة" : "International Coffee and Chocolate Makers Exhibition")));
    setEventDates(String(contract.event_dates ?? (isArabic ? "8-10 أكتوبر 2026م (27-29 ربيع الآخر 1448هـ)" : "8-10 October 2026")));
    setEventLocation(String(contract.event_location ?? (isArabic ? "فندق جدة هيلتون - القاعة الكبرى" : "Jeddah Hilton Hotel - Grand Hall")));
    setCompanyName(String(contract.company_name ?? ""));
    setContactName(String(contract.contact_name ?? ""));
    setEmail(String(contract.email ?? ""));
    setPhone(String(contract.phone ?? ""));
    setAddress(String(contract.address ?? ""));
    setCity(String(contract.city ?? ""));
    setCountry(String(contract.country ?? "Saudi Arabia"));
    setLessorName(String(contract.lessor_name ?? (isArabic ? "شركة نطاق الأعمال لتنظيم المعارض والمؤتمرات" : "Netaq Al Aamal Exhibitions & Conferences")));
    setFirstPartyCr(String(contract.first_party_cr ?? ""));
    setFirstPartyRepresentative(String(contract.first_party_representative ?? ""));
    setTenantName(String(contract.tenant_name ?? contract.company_name ?? ""));
    setSecondPartyCr(String(contract.second_party_cr ?? ""));
    setSecondPartyRepresentative(String(contract.second_party_representative ?? ""));
    setBoothNumber(String(contract.booth_number ?? "RL13"));
    setParticipationCategory(String(contract.participation_category ?? (isArabic ? "كلاسيك (Classic)" : "Classic")));
    setBoothSize(String(contract.booth_size ?? (isArabic ? "3x3 متر" : "3x3 m")));
    setRentalItem(String(contract.rental_item ?? ""));
    setRentalLocation(String(contract.rental_location ?? ""));
    setLeaseStartDate(cleanDate(contract.lease_start_date) === "—" ? dateAfterDays(0) : cleanDate(contract.lease_start_date));
    setLeaseEndDate(cleanDate(contract.lease_end_date) === "—" ? dateAfterDays(3) : cleanDate(contract.lease_end_date));
    setUnitPrice(contract.unit_price == null ? "" : String(contract.unit_price));
    setQuantity(contract.quantity == null ? "1" : String(contract.quantity));
    setContractDate(cleanDate(contract.contract_date) === "—" ? dateAfterDays(0) : cleanDate(contract.contract_date));
    setNotes(String(contract.notes ?? ""));
    setPaymentStatus(String(contract.payment_status ?? "pending_payment"));
    setContractStatus(String(contract.status ?? "draft"));
    window.scrollTo({top: 0, behavior: "smooth"});
  }

  function escapePrintValue(value: unknown) {
    return String(value ?? "—")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function printContract(contract: BackendRow) {
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) return;
    const currency = String(contract.currency ?? "SAR");
    const {subtotal, vat, grandTotal} = rentalContractAmounts(contract);
    const money = (value: number) => `${value.toLocaleString(NUMBER_LOCALE)} ${currency}`;
    const contractDate = cleanDate(contract.contract_date);
    const lessorName =
      String(contract.lessor_name ?? "").trim() ||
      "شركة نطاق الأعمال لتنظيم المعارض والمؤتمرات";
    const tenantName = String(contract.tenant_name ?? contract.company_name ?? "").trim();
    const representative = String(contract.contact_name ?? "").trim();
    const rentalItem = String(contract.rental_item ?? "").trim();
    const rentalLocation = String(contract.rental_location ?? "").trim();
    const leaseStart = cleanDate(contract.lease_start_date);
    const leaseEnd = cleanDate(contract.lease_end_date);
    const quantity = Number(contract.quantity ?? 1);
    const displayValue = (value: unknown) => {
      const textValue = String(value ?? "").trim();
      return textValue || "-";
    };
    const leasePeriod = [leaseStart, leaseEnd].filter(Boolean).join(" - ") || "-";
    printWindow.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>عقد مشاركة</title><style>
      *{box-sizing:border-box;}
      @page{size:Letter portrait;margin:0;}
      html,body{width:100%;min-height:100%;margin:0;padding:0;background:#fff;}
      body{direction:rtl;font-family:Arial,Tahoma,sans-serif;text-align:right;color:#000;font-size:13px;line-height:1.75;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .page{position:relative;width:100%;max-width:none;min-height:0;margin:0;padding:0;background:#fff;overflow:visible;box-shadow:none;}
      .contract-inner{padding:clamp(12px,2vw,28px);}
      .top-strip{width:100vw;height:12mm;margin-inline:calc(50% - 50vw);margin-bottom:10mm;background:#0b0537;}
      .logos{display:flex;align-items:flex-start;justify-content:space-between;margin:0 4mm 5mm;}
      .event-logo{width:52mm;height:auto;object-fit:contain;}
      .netaq-logo{width:72mm;height:auto;object-fit:contain;}
      .title{text-align:center;font-size:28px;font-weight:900;line-height:1.35;margin:2mm 0 2.5mm;}
      .subtitle{text-align:center;font-size:16px;font-weight:800;line-height:1.7;margin-bottom:4.5mm;}
      .contract-number{text-align:center;font-weight:900;font-size:15px;margin-bottom:7mm;direction:ltr;}
      .intro{text-align:right;font-size:16px;font-weight:700;margin:0 12mm 5mm 0;}
      h2.section-heading{font-size:16px;font-weight:800;text-align:right;margin:0 0 3mm;}
      .party-box{border:1px solid #111;min-height:auto;padding:4mm 5mm;margin-bottom:5mm;text-align:right;break-inside:avoid;page-break-inside:avoid;}
      .party-box h3{font-size:16px;font-weight:800;margin:0 0 3mm;}
      .party-box p{margin:1.7mm 0;font-size:12.5px;line-height:1.45;}
      .center-section{text-align:center;margin-top:8mm;}
      .section-title{font-size:17px;font-weight:800;margin:4mm 0 2mm;text-align:right;break-after:avoid;page-break-after:avoid;}
      .preamble{font-size:12.5px;text-align:justify;text-align-last:right;line-height:1.75;margin:0 2mm 2.6mm;}
      table{width:100%;border-collapse:collapse;margin:2.5mm 0 4mm;break-inside:avoid;page-break-inside:avoid;}
      tr,thead,tbody{break-inside:avoid;page-break-inside:avoid;}
      th,td{border:1px solid #111;padding:2.2mm 2mm;text-align:center;font-size:11.6px;line-height:1.35;}
      th{font-weight:800;background:#f6f6f6;}
      ul,ol{margin:0 7mm 3mm 0;padding:0;font-size:12.2px;line-height:1.65;}
      li{margin-bottom:1mm;}
      .signature{display:grid;grid-template-columns:1fr 1fr;gap:26mm;margin-top:12mm;text-align:center;font-size:12px;break-inside:avoid;page-break-inside:avoid;}
      .signature div{min-height:35mm;}
      .ltr{direction:ltr;text-align:left;}
      .footer-page{display:none;}
      .page-break{break-before:auto;page-break-before:auto;}
      p,li,td,th,.party-box{overflow-wrap:anywhere;}
      @media print{html,body{width:216mm;height:auto;}.page{width:216mm;min-height:auto;margin:0;padding:0;break-after:auto;}.top-strip{width:216mm;margin-inline:0;margin-bottom:7mm;}.contract-inner{padding:9mm 13mm 8mm;}.section-title{break-after:avoid;page-break-after:avoid;}.preamble,table,ul,ol{break-before:avoid;page-break-before:avoid;}.party-box,table,.signature{break-inside:avoid;page-break-inside:avoid;}.page-break{break-before:auto;page-break-before:auto;}}
    </style></head><body>
    <div class="page">
      <div class="top-strip"></div>
      <div class="contract-inner">
      <div class="logos">
        <img class="event-logo" src="/contract-assets/jazli-event-logo.png" alt="">
        <img class="netaq-logo" src="/contract-assets/jazli-netaq-logo.png" alt="">
      </div>
      <div class="title">عقد مشاركة في المعرض الدولي لصناع القهوة والشوكولاتة</div>
      <div class="subtitle">${escapePrintValue(displayValue(contract.event_dates ?? "8-10 أكتوبر 2026م (27-29 ربيع الآخر 1448هـ)"))}<br>${escapePrintValue(displayValue(contract.event_location ?? "فندق جدة هيلتون - القاعة الكبرى"))}</div>
      <div class="contract-number">${escapePrintValue(displayValue(contract.contract_number ?? ""))}</div>
      <p class="intro">تم بعون الله وتوفيقه إبرام هذا العقد بتاريخ ${escapePrintValue(displayValue(contractDate))}، بين كل من:</p>
      <h2 class="section-heading">أولاً: بيانات الأطراف</h2>
      <div class="party-box"><h3>الطرف الأول</h3><p>${escapePrintValue(displayValue(lessorName))}</p><p>رقم السجل التجاري: ${escapePrintValue(displayValue(contract.first_party_cr ?? "4030216503"))}</p><p>العنوان: ${escapePrintValue(displayValue(contract.event_location ?? rentalLocation ?? "فندق جدة هيلتون - القاعة الكبرى"))}</p><p>يمثلها: ${escapePrintValue(displayValue(contract.first_party_representative ?? "سهيل بن بكر الطيار"))} - الرئيس التنفيذي</p><p>الصفة: الرئيس التنفيذي</p></div>
      <div class="party-box"><h3>الطرف الثاني</h3><p>${escapePrintValue(displayValue(tenantName))}</p><p>رقم السجل التجاري: ${escapePrintValue(displayValue(contract.second_party_cr))}</p><p>العنوان: ${escapePrintValue(displayValue(contract.address ?? contract.city))}</p><p>يمثلها: ${escapePrintValue(displayValue(contract.second_party_representative ?? representative))}</p><p>الصفة: المدير</p></div>
      <div class="section-title">التمهيد</div>
      <p class="preamble">حيث إن الطرف الأول يقوم بتنظيم المعرض الدولي لصناع القهوة والشوكولاتة بمحافظة جدة، وحيث إن الطرف الثاني لديه الرغبة بالمشاركة في المعرض، فقد اتفق الطرفان بكامل أهليتهما الشرعية والنظامية على ما يلي.</p>
      <p class="preamble">ويعد هذا التمهيد جزءاً لا يتجزأ من هذا العقد ومكملاً له.</p>
      <div class="section-title">ثانياً: مدة العقد</div>
      <p class="preamble">يسري هذا العقد من تاريخ توقيعه وحتى انتهاء المعرض بتاريخ ${escapePrintValue(displayValue(leaseEnd || contract.event_dates))}.</p>
      </div>
      <div class="footer-page">1</div>
    </div>
    <div class="page">
      <div class="contract-inner">
      <div class="section-title">ثالثاً: قيمة المشاركة</div>
      <table><tbody><tr><th>رقم البوث</th><th>الفئة</th><th>المساحة</th><th>السعر</th><th>الضريبة</th><th>الإجمالي</th></tr><tr><td>${escapePrintValue(displayValue(contract.booth_number ?? rentalItem))}</td><td>${escapePrintValue(displayValue(contract.participation_category ?? "---"))}</td><td>${escapePrintValue(displayValue(contract.booth_size))}</td><td>${escapePrintValue(money(subtotal))}</td><td>${escapePrintValue(money(vat))}</td><td>${escapePrintValue(money(grandTotal))}</td></tr></tbody></table>
      <p class="preamble">* السعر غير شامل تنفيذ أو تجهيز البوث.</p>
      <div class="section-title">رابعاً: مميزات المشاركة</div>
      <ul><li>تخصيص مساحة ${escapePrintValue(displayValue(contract.booth_size))} للطرف الثاني داخل المعرض.</li><li>إدراج شعار المشارك في المطبوعات والإعلانات الخاصة بالمعرض.</li><li>منح بطاقات لدخول المعرض.</li><li>إبراز مشاركة الطرف الثاني ضمن الحملات التسويقية الخاصة بالفعالية.</li></ul>
      <div class="section-title">خامساً: الفسخ</div>
      <ol><li>إخلال أحد الطرفين بأي بند من بنود العقد.</li><li>مخالفة الالتزامات أو الإقرارات الواردة في العقد.</li><li>اتفاق الطرفين على إنهاء العقد.</li><li>عدم الالتزام بسداد المستحقات المالية.</li><li>انسحاب الطرف الثاني بعد توقيع العقد، ويحق للطرف الأول تطبيق الشرط الجزائي وفق ما نص عليه العقد.</li><li>في حال إلغاء المعرض من قبل الطرف الأول يحق للطرف الثاني استعادة المبلغ أو قبول التأجيل.</li></ol>
      <div class="section-title">سادساً: آلية السداد</div>
      <p class="preamble">يتم سداد قيمة المشاركة كاملة عند توقيع العقد، وذلك بالتحويل البنكي إلى الحساب التالي:</p>
      <table><tbody><tr><th>اسم الحساب</th><th>رقم الحساب</th><th>IBAN</th><th>SWIFT</th></tr><tr><td>شركة نطاق الأعمال لتنظيم المعارض والمؤتمرات</td><td>79800001590310</td><td class="ltr">SA1410000079800001590310</td><td class="ltr">NCBKSAJE</td></tr></tbody></table>
      <p class="preamble">في حال عدم السداد يحق للطرف الأول إلغاء العقد دون إشعار مسبق.</p>
      </div>
      <div class="footer-page">2</div>
    </div>
    <div class="page">
      <div class="contract-inner">
      <div class="section-title">سابعاً: القوة القاهرة</div>
      <p class="preamble">لا يكون أي من الطرفين مسؤولاً عن التأخير أو عدم تنفيذ التزاماته إذا كان ذلك نتيجة قوة قاهرة خارجة عن الإرادة، مثل الكوارث الطبيعية أو الحروب أو الأوبئة أو القرارات الحكومية أو أي ظرف يمنع تنفيذ العقد.</p>
      <div class="section-title">ثامناً: القانون المطبق</div>
      <p class="preamble">يخضع هذا العقد لأنظمة المملكة العربية السعودية، وتختص المحاكم السعودية بالنظر في أي نزاع ينشأ عنه.</p>
      <div class="section-title">تاسعاً: الإشعارات والمراسلات</div>
      <p class="preamble">تعد جميع الإشعارات المرسلة إلى العناوين أو البريد الإلكتروني أو وسائل التواصل المعتمدة بين الطرفين صحيحة ومنتجة لآثارها النظامية، ويلتزم كل طرف بإبلاغ الطرف الآخر بأي تغيير في بياناته.</p>
      <div class="signature"><div>_________________<br>الطرف الأول<br>الاسم<br>التوقيع<br>الختم</div><div>_________________<br>الطرف الثاني<br>الاسم<br>التوقيع<br>الختم</div></div>
      </div>
      <div class="footer-page">3</div>
    </div>
    <script>window.onload = () => window.print();</script></body></html>`);
    printWindow.document.close();
  }

  async function saveContract() {
    if (!companyName.trim() || !contactName.trim() || !rentalItem.trim()) {
      setSaveStatus(text.validation);
      return;
    }
    const normalizedBooth = boothNumber.trim().toUpperCase();
    if (normalizedBooth && boothReservationStatuses.has(normalizedBooth)) {
      setSaveStatus(isArabic ? "هذا البوث غير متاح حالياً" : "This booth is not available now");
      window.setTimeout(() => setSaveStatus(""), 2200);
      return;
    }
    setSaveStatus(text.saving);
    const payload = {
      contract_number: contractNumber.trim() || null,
      lead_id: leadId ? Number(leadId) : null,
      event_name: eventName.trim() || null,
      event_dates: eventDates.trim() || null,
      event_location: eventLocation.trim() || null,
      lessor_name: lessorName.trim() || null,
      first_party_cr: firstPartyCr.trim() || null,
      first_party_representative: firstPartyRepresentative.trim() || null,
      tenant_name: tenantName.trim() || companyName.trim(),
      second_party_cr: secondPartyCr.trim() || null,
      second_party_representative: secondPartyRepresentative.trim() || null,
      company_name: companyName.trim(),
      contact_name: contactName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      country: country.trim() || null,
      booth_number: boothNumber.trim() || null,
      participation_category: participationCategory.trim() || null,
      booth_size: boothSize.trim() || null,
      rental_item: rentalItem.trim(),
      rental_location: rentalLocation.trim() || null,
      lease_start_date: leaseStartDate || null,
      lease_end_date: leaseEndDate || null,
      unit_price: unitPrice ? Number(unitPrice) : 0,
      quantity: quantity ? Number(quantity) : 1,
      subtotal: roundMoney(amounts.subtotal),
      vat_amount: roundMoney(amounts.vat),
      grand_total: roundMoney(amounts.grandTotal),
      payment_status: paymentStatus,
      contract_date: contractDate || null,
      status: contractStatus,
      notes: notes.trim() || null,
    };
    try {
      if (editingContractId) {
        await updateBackend("rental-contracts", editingContractId, payload);
        setSaveStatus(text.updated);
      } else {
        await createBackend("rental-contracts", payload);
        setSaveStatus(text.saved);
      }
      resetContractForm();
      await contracts.reload();
      await rentalBooths.reload();
    } catch {
      setSaveStatus(text.failed);
    }
    window.setTimeout(() => setSaveStatus(""), 2200);
  }

  return (
    <div className="quotes-page-grid">
      <article className="quote-card quote-form-card rental-contract-form-card">
        <div className="card-title"><h3>{text.formTitle}</h3><span>{text.formSubtitle}</span></div>
        <div className="form-grid">
          <label className="quote-field"><span>{text.contractNumber}</span><input onChange={(event) => setContractNumber(event.target.value)} placeholder={isArabic ? "تلقائياً" : "Automatic"} value={contractNumber} /></label>
          <label className="quote-field"><span>{text.eventName}</span><input onChange={(event) => setEventName(event.target.value)} value={eventName} /></label>
          <label className="quote-field"><span>{text.eventDates}</span><input onChange={(event) => setEventDates(event.target.value)} value={eventDates} /></label>
          <label className="quote-field"><span>{text.eventLocation}</span><input onChange={(event) => setEventLocation(event.target.value)} value={eventLocation} /></label>
          <label className="quote-field rental-compact-label"><span>{text.firstPartyCr}</span><input inputMode="numeric" onChange={(event) => setFirstPartyCr(event.target.value)} value={firstPartyCr} /></label>
          <label className="quote-field rental-compact-label"><span>{text.firstPartyRepresentative}</span><input onChange={(event) => setFirstPartyRepresentative(event.target.value)} value={firstPartyRepresentative} /></label>
          <label className="quote-field quote-field-customer contract-lead-select-field">
            <span>{text.customer}</span>
            <DashboardSelect
              ariaLabel={text.customer}
              menuClassName="contract-lead-select-menu"
              onValueChange={applyLeadData}
              options={(leads.data ?? []).map((lead) => ({
                label: String(lead.company_name ?? lead.name ?? lead.id),
                value: String(lead.id),
              }))}
              placeholder=""
              searchable
              searchPlaceholder={text.customerSearch}
              value={leadId}
            />
            {!selectedLead ? <small className="quote-duration-hint">{text.noCustomerData}</small> : null}
          </label>
          <label className="quote-field"><span>{text.lessorName}</span><input onChange={(event) => setLessorName(event.target.value)} value={lessorName} /></label>
          <label className="quote-field rental-tenant-name-field"><span>{text.tenantName}</span><input onChange={(event) => setTenantName(event.target.value)} value={tenantName} /></label>
          <label className="quote-field rental-compact-label"><span>{text.secondPartyCr}</span><input inputMode="numeric" onChange={(event) => setSecondPartyCr(event.target.value)} value={secondPartyCr} /></label>
          <label className="quote-field rental-compact-label"><span>{text.secondPartyRepresentative}</span><input onChange={(event) => setSecondPartyRepresentative(event.target.value)} value={secondPartyRepresentative} /></label>
          <label className="quote-field"><span>{text.companyName} <b className="required-mark">*</b></span><input onChange={(event) => setCompanyName(event.target.value)} value={companyName} /></label>
          <label className="quote-field"><span>{text.contactName} <b className="required-mark">*</b></span><input onChange={(event) => setContactName(event.target.value)} value={contactName} /></label>
          <label className="quote-field"><span>{text.email}</span><input onChange={(event) => setEmail(event.target.value)} type="email" value={email} /></label>
          <label className="quote-field"><span>{text.phone}</span><input inputMode="tel" onChange={(event) => setPhone(event.target.value)} value={phone} /></label>
          <label className="quote-field rental-booth-number-field">
            <span>{text.boothNumber}</span>
            <button className="rental-booth-open-map" onClick={() => setBoothPickerOpen(true)} type="button">
              <strong>{boothNumber || (isArabic ? "اختيار البوث" : "Choose booth")}</strong>
              <span>{isArabic ? "خريطة" : "Map"}</span>
            </button>
          </label>
          {boothPickerOpen ? (
            <div className="rental-booth-modal-backdrop" role="presentation">
              <section className="rental-booth-modal" aria-modal="true" role="dialog">
                <div className="rental-booth-modal-head">
                  <div>
                    <span>{isArabic ? "اختيار بوث العقد" : "Contract booth selection"}</span>
                    <h3>{isArabic ? "خريطة البوثات" : "Booth Layout"}</h3>
                  </div>
                  <button aria-label={isArabic ? "إغلاق" : "Close"} onClick={() => setBoothPickerOpen(false)} type="button">
                    ×
                  </button>
                </div>
                <div className="rental-booth-modal-toolbar">
                  <div className="admin-record-search-bar search-box">
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <circle cx="10.8" cy="10.8" r="6.2" />
                      <path d="m15.5 15.5 4 4" />
                    </svg>
                    <input
                      onChange={(event) => setBoothMapQuery(event.target.value)}
                      placeholder={isArabic ? "ابحث برقم البوث أو المساحة..." : "Search booth number or size..."}
                      type="search"
                      value={boothMapQuery}
                    />
                  </div>
                  <div className="admin-booth-map-legend" aria-label={isArabic ? "دليل ألوان البوثات" : "Booth color legend"}>
                    <span>{isArabic ? "مختار" : "Selected"}<i className="selected" aria-hidden="true" /></span>
                    <span>{isArabic ? "متاح" : "Available"}<i className="available" aria-hidden="true" /></span>
                    <span>{isArabic ? "بانتظار الدفع" : "Pending payment"}<i className="pending-payment" aria-hidden="true" /></span>
                    <span>{isArabic ? "محجوز" : "Booked"}<i className="booked" aria-hidden="true" /></span>
                  </div>
                </div>
                <div className="admin-booth-zone-filter rental-booth-modal-zone-filter" role="listbox" aria-label={isArabic ? "فلترة الأقسام" : "Zone filter"}>
                  {FLOOR_MAP_ZONES.map((zone) => (
                    <button
                      aria-selected={boothMapZone === zone.key}
                      className={boothMapZone === zone.key ? "active" : ""}
                      key={zone.key}
                      onClick={() => setBoothMapZone(zone.key)}
                      type="button"
                    >
                      {isArabic ? zone.labelAr : zone.labelEn}
                    </button>
                  ))}
                </div>
                <div className="rental-booth-modal-map">
                  <div className="admin-floor-map-canvas">
                    <div className="admin-floor-map-label top" dir={isArabic ? "rtl" : "ltr"}>
                      {isArabic ? "قاعة ما قبل الفعالية" : "Pre-Function Hall"}
                    </div>
                    <div className="admin-floor-map-label entrance">{isArabic ? "بوابة الدخول" : "Entrance"}</div>
                    <div className="admin-floor-map-label exit">{isArabic ? "بوابة الخروج" : "Exit"}</div>
                    {FLOOR_MAP_ZONES.filter((zone) => zone.key !== "all").map((zone) => (
                      <div
                        className={`admin-floor-zone-container ${zone.key}`}
                        key={zone.key}
                        style={{
                          left: `${zone.left}%`,
                          top: `${zone.top}%`,
                          width: `${zone.width}%`,
                          height: `${zone.height}%`,
                        }}
                      />
                    ))}
                    {FLOOR_MAP_AREA_LABELS.map((area) => (
                      <div
                        className={`admin-floor-map-area-label ${area.key}`}
                        dir={isArabic ? "rtl" : "ltr"}
                        key={area.key}
                        style={{
                          left: `${area.left}%`,
                          top: `${area.top}%`,
                          width: `${area.width}%`,
                          height: `${area.height}%`,
                        }}
                      >
                        {isArabic ? area.labelAr : area.labelEn}
                      </div>
                    ))}
                    {visibleBoothMapLayout.map((layoutBooth) => {
                      const normalizedBooth = layoutBooth.id.toUpperCase();
                      const catalogBooth = boothCatalogByNumber.get(normalizedBooth);
                      const reservationStatus = boothReservationStatuses.get(normalizedBooth);
                      const isBooked = reservationStatus === "booked";
                      const isPendingPayment = reservationStatus === "pending_payment";
                      const isSelected = boothNumber.trim().toUpperCase() === normalizedBooth;
                      const boothSizeText = String(
                        catalogBooth?.booth_size ??
                        (layoutBooth.id === "ACADEMY" ? "100m" : layoutBooth.id === "GLASS HOUSE" ? "60m" : ""),
                      ).trim();
                      const isFeatureArea = layoutBooth.id === "ACADEMY" || layoutBooth.id === "GLASS HOUSE";
                      const boothMapLabel =
                        layoutBooth.id === "ACADEMY"
                          ? isArabic ? "الأكاديمية" : "Academy"
                          : layoutBooth.id === "GLASS HOUSE"
                            ? isArabic ? "جلاس هاوس" : "Glass House"
                            : layoutBooth.id;
                      return (
                        <button
                          aria-pressed={isSelected}
                          className={`admin-booth-map-tile ${isFeatureArea ? "is-feature-area" : ""} ${isPendingPayment ? "is-pending-payment" : ""} ${isBooked ? "is-booked" : ""} ${isSelected ? "is-selected" : ""}`}
                          disabled={Boolean(reservationStatus)}
                          dir="ltr"
                          key={layoutBooth.id}
                          onClick={() => {
                            selectBooth(layoutBooth.id);
                            if (!reservationStatus) setBoothPickerOpen(false);
                          }}
                          style={{
                            left: `${layoutBooth.left}%`,
                            top: `${layoutBooth.top}%`,
                            width: `${layoutBooth.width}%`,
                            height: `${layoutBooth.height}%`,
                          }}
                          type="button"
                        >
                          <strong>{boothMapLabel}</strong>
                          {boothSizeText ? <span>{boothSizeText}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          ) : null}
          <label className="quote-field"><span>{text.participationCategory}</span><input onChange={(event) => setParticipationCategory(event.target.value)} value={participationCategory} /></label>
          <label className="quote-field"><span>{text.boothSize}</span><input onChange={(event) => setBoothSize(event.target.value)} value={boothSize} /></label>
          <label className="quote-field"><span>{text.rentalItem} <b className="required-mark">*</b></span><input onChange={(event) => setRentalItem(event.target.value)} value={rentalItem} /></label>
          <label className="quote-field"><span>{text.rentalLocation}</span><input onChange={(event) => setRentalLocation(event.target.value)} value={rentalLocation} /></label>
          <label className="quote-field"><span>{text.leaseStartDate}</span><input onChange={(event) => setLeaseStartDate(event.target.value)} type="date" value={leaseStartDate} /></label>
          <label className="quote-field"><span>{text.leaseEndDate}</span><input onChange={(event) => setLeaseEndDate(event.target.value)} type="date" value={leaseEndDate} /></label>
          <label className="quote-field"><span>{text.contractDate}</span><input onChange={(event) => setContractDate(event.target.value)} type="date" value={contractDate} /></label>
          <label className="quote-field">
            <span>{text.paymentStatus}</span>
            <DashboardSelect
              ariaLabel={text.paymentStatus}
              onValueChange={setPaymentStatus}
              options={[
                {value: "pending_payment", label: text.pendingPayment},
                {value: "paid", label: text.paid},
              ]}
              value={paymentStatus}
            />
          </label>
          <label className="quote-field">
            <span>{text.status}</span>
            <DashboardSelect
              ariaLabel={text.status}
              onValueChange={setContractStatus}
              options={[
                {value: "draft", label: text.draft},
                {value: "sent", label: text.sent},
                {value: "signed", label: text.signed},
                {value: "cancelled", label: text.cancelled},
              ]}
              value={contractStatus}
            />
          </label>
          <label className="quote-field"><span>{text.quantity}</span><input inputMode="decimal" min="0" onChange={(event) => setQuantity(event.target.value)} type="number" value={quantity} /></label>
          <label className="quote-field"><span>{text.subtotal}</span><input readOnly value={amounts.subtotal.toLocaleString(NUMBER_LOCALE)} /></label>
          <label className="quote-field"><span>{text.vatAmount}</span><input readOnly value={amounts.vat.toLocaleString(NUMBER_LOCALE)} /></label>
          <label className="quote-field"><span>{text.unitPrice}</span><input inputMode="decimal" min="0" onChange={(event) => setUnitPrice(event.target.value)} type="number" value={unitPrice} /></label>
          <label className="quote-field"><span>{text.city}</span><input onChange={(event) => setCity(event.target.value)} value={city} /></label>
          <label className="quote-field"><span>{text.country}</span><input onChange={(event) => setCountry(event.target.value)} value={country} /></label>
        </div>
        <label className="quote-details-field"><span>{text.address}</span><textarea onChange={(event) => setAddress(event.target.value)} value={address} /></label>
        <label className="quote-details-field"><span>{text.notes}</span><textarea onChange={(event) => setNotes(event.target.value)} value={notes} /></label>
        <div className="quote-action-row"><button className="button button-primary" onClick={() => void saveContract()} type="button">{editingContractId ? text.update : text.save}</button>{saveStatus ? <p className="quote-validation">{saveStatus}</p> : null}</div>
      </article>

      <article className="quote-card quote-history-card">
        <div className="card-title"><div><h3>{text.listTitle}</h3><span>{text.listSubtitle}</span></div></div>
        <div className="contract-smart-filter-row"><div className="contract-smart-search"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.2" /><path d="m15.5 15.5 4 4" /></svg><input onChange={(event) => setSearch(event.target.value)} placeholder={isArabic ? "\u0627\u0628\u062d\u062b \u0628\u0627\u0644\u0627\u0633\u0645\u060c \u0627\u0644\u0634\u0631\u0643\u0629\u060c \u0627\u0644\u062c\u0648\u0627\u0644..." : "Search by name, company, mobile..."} type="search" value={search} /><strong>{filteredContracts.length.toLocaleString(NUMBER_LOCALE)}</strong></div></div>
        <div className="quote-history-table"><table><thead><tr><th>{isArabic ? "\u0631\u0642\u0645 \u0627\u0644\u0639\u0642\u062f" : "Contract #"}</th><th>{text.customer}</th><th>{text.companyName}</th><th>{text.rentalItem}</th><th>{text.paymentStatus}</th><th>{text.contractDate}</th><th>{text.actions}</th></tr></thead><tbody>
          {filteredContracts.map((contract) => {
            const paymentValue = String(contract.payment_status ?? "pending_payment");
            const paymentLabel =
              paymentValue === "paid"
                ? text.paid
                : text.pendingPayment;
            return (
              <tr key={contract.id}>
                <td>{String(contract.contract_number ?? contract.id)}</td>
                <td>{String(contract.customer_name ?? "-")}</td>
                <td>{String(contract.company_name ?? "-")}</td>
                <td>{String(contract.rental_item ?? "-")}</td>
                <td>
                  <div className="rental-payment-cell">
                    <span className={`quote-status ${paymentValue}`}>{paymentLabel}</span>
                  </div>
                </td>
                <td>{cleanDate(contract.contract_date)}</td>
                <td>
                  <div className="contract-table-actions">
                    <button aria-label={text.edit} className="contract-table-action icon" onClick={() => editContract(contract)} title={text.edit} type="button"><ContractActionIcon type="edit" /></button>
                    <button aria-label={text.print} className="contract-table-action primary icon" onClick={() => printContract(contract)} title={text.print} type="button"><ContractActionIcon type="print" /></button>
                  </div>
                </td>
              </tr>
            );
          })}
          {!contracts.loading && !filteredContracts.length ? <tr><td className="quote-history-empty" colSpan={7}>{text.noContracts}</td></tr> : null}
          {contracts.loading ? <tr><td className="quote-history-empty" colSpan={7}>{isArabic ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644..." : "Loading..."}</td></tr> : null}
        </tbody></table></div>
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
              <th>{isArabic ? "\\u0627\\u0644\\u062d\\u0627\\u0644\\u0629" : "Status"}</th>
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
  const ticketTypes = useBackend<BackendRow[]>("/api/v1/data/support-ticket-types");
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
  const fallbackCategoryOptions = [
    { value: "مشكلة عمولة", label: isArabic ? "مشكلة عمولة" : "Commission Issue" },
    { value: "دعم الحساب", label: isArabic ? "دعم الحساب" : "Account Support" },
    { value: "مشكلة تقنية", label: isArabic ? "مشكلة تقنية" : "Technical Issue" },
  ];
  const categoryOptions =
    (ticketTypes.data ?? [])
      .filter((type) => String(type.status ?? "active") === "active")
      .map((type) => ({
        value: String(type.name_ar ?? type.name_en ?? ""),
        label: isArabic
          ? String(type.name_ar ?? type.name_en ?? "")
          : String(type.name_en ?? type.name_ar ?? ""),
      }))
      .filter((option) => option.value.trim()) || [];
  const availableCategoryOptions = categoryOptions.length ? categoryOptions : fallbackCategoryOptions;
  const categoryLabel = (value: unknown) => {
    const rawCategory = String(value ?? "");
    return availableCategoryOptions.find((option) => option.value === rawCategory)?.label || rawCategory || "—";
  };
  useEffect(() => {
    if (!availableCategoryOptions.length) return;
    if (!availableCategoryOptions.some((option) => option.value === category)) {
      setCategory(availableCategoryOptions[0].value);
    }
  }, [availableCategoryOptions, category]);
  const filteredTickets = useMemo(
    () =>
      (tickets.data ?? []).filter((ticket) => {
        const status = String(ticket.status ?? "open");
        if (advancedTicketFilter && !["open", "in_progress"].includes(status)) {
          return false;
        }
        return ticketFilter === "all" || status === ticketFilter;
      }),
    [advancedTicketFilter, ticketFilter, tickets.data],
  );

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
            options={availableCategoryOptions}
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

