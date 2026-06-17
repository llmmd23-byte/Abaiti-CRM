import type {ReactNode} from "react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const theme = {
  pageGradient:
    "bg-[radial-gradient(circle_at_18%_8%,rgba(32,184,181,0.12),transparent_28%),linear-gradient(180deg,#fbfcfd_0%,#f6f8fb_42%,#edf2f6_100%)]",
  dashboardBg: "bg-[linear-gradient(180deg,#f8fbfd,#edf3f6)]",
  darkPanel:
    "bg-[linear-gradient(180deg,rgba(7,22,38,0.98),rgba(11,31,58,0.96)),#071626]",
  card:
    "rounded-lg border border-[#dde6ee]/90 bg-white/80 shadow-[0_24px_70px_rgba(11,31,58,0.12)] backdrop-blur-[18px]",
  glass:
    "rounded-lg border border-[#dde6ee]/90 bg-white/75 shadow-[0_24px_70px_rgba(11,31,58,0.12)] backdrop-blur-[18px]",
  primaryButton:
    "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#22b8b8] px-[18px] font-medium text-white shadow-[0_14px_30px_rgba(32,184,181,0.22)] transition hover:bg-[#168f97]",
  darkButton:
    "inline-flex min-h-11 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#0b1f3a,#123457)] px-[18px] font-medium text-white transition hover:shadow-[0_14px_32px_rgba(11,31,58,0.18)]"
};

export function Eyebrow({children, className}: {children: ReactNode; className?: string}) {
  return (
    <p className={cn("mb-3 text-xs font-medium uppercase tracking-[0.08em] text-[#22b8b8]", className)}>
      {children}
    </p>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  children,
  className
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-7 max-w-[720px]", className)}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="m-0 text-[clamp(30px,4vw,50px)] font-bold leading-[1.12] text-[#0b1f3a]">
        {title}
      </h2>
      {children ? <div className="mt-3 text-[15px] leading-8 text-[#647280]">{children}</div> : null}
    </div>
  );
}
