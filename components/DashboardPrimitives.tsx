import type {ComponentPropsWithoutRef, ReactNode} from "react";
import {cn, theme} from "@/components/ui";

export function DashboardCard({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & ComponentPropsWithoutRef<"article">) {
  return <article className={cn("grid gap-4 p-6", theme.card, className)} {...props}>{children}</article>;
}

export function CardTitle({
  title,
  subtitle,
  className
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="grid gap-1">
        <h3 className="m-0 text-lg font-extrabold leading-snug text-[#0b1f3a]">{title}</h3>
        {subtitle ? <span className="text-[13px] font-medium leading-relaxed text-[#647280]">{subtitle}</span> : null}
      </div>
    </div>
  );
}

export function StatusBadge({children, tone}: {children: ReactNode; tone?: string}) {
  const normalized = (tone ?? "").toLowerCase();
  const isPaid = normalized.includes("paid") || normalized.includes("active") || normalized.includes("success");
  const isPending = normalized.includes("pending") || normalized.includes("warning");
  const isDraft = normalized.includes("draft") || normalized.includes("muted");

  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center justify-center rounded-full px-3 text-xs font-extrabold leading-none",
        isPaid && "bg-emerald-50 text-emerald-700",
        isPending && "bg-amber-50 text-amber-700",
        isDraft && "bg-slate-100 text-slate-600",
        !isPaid && !isPending && !isDraft && "bg-[#e0f8f8] text-[#168f97]"
      )}
    >
      {children}
    </span>
  );
}

export function ResponsiveTable({
  headers,
  rows
}: {
  headers: ReactNode[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-[18px] border border-slate-200 bg-white">
      <table className="min-w-full border-collapse text-start">
        <thead>
          <tr className="bg-slate-50 text-xs font-extrabold uppercase text-slate-500">
            {headers.map((header, index) => (
              <th className="whitespace-nowrap px-4 py-3 text-start" key={index}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, rowIndex) => (
            <tr className="text-sm font-medium text-slate-700" key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td className="whitespace-nowrap px-4 py-4" key={cellIndex}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TabButton({
  active,
  title,
  subtitle,
  onClick
}: {
  active: boolean;
  title: ReactNode;
  subtitle: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "grid gap-1 rounded-2xl border border-transparent px-4 py-3.5 text-start text-[#647280] transition hover:-translate-y-px hover:border-[#00a19d]/25 hover:bg-[#e6f6f6] hover:text-[#00a19d] hover:shadow-[0_14px_28px_rgba(34,184,184,0.1)]",
        active && "border-[#00a19d]/25 bg-[#e6f6f6] text-[#00a19d] shadow-[0_14px_28px_rgba(34,184,184,0.1)]"
      )}
      onClick={onClick}
      role="tab"
      type="button"
    >
      <strong className={cn("text-[15px] font-black leading-snug text-[#0b1f3a]", active && "text-[#00a19d]")}>
        {title}
      </strong>
      <span className="text-xs font-semibold leading-relaxed">{subtitle}</span>
    </button>
  );
}

export const dashboardField =
  "min-h-12 w-full rounded-xl border border-[#d7e2ec] bg-white/85 px-3.5 py-3 text-sm text-[#0b1f3a] outline-none transition focus:border-[#22b8b8]/70 focus:shadow-[0_0_0_4px_rgba(34,184,184,0.14)]";

export const dashboardLabel = "grid gap-1.5 text-[13px] font-semibold text-[#354252]";
