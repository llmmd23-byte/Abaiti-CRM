import Image from "next/image";
import type {ReactNode} from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {cn, Eyebrow, theme} from "@/components/ui";
import {Link} from "@/i18n/navigation";

export function PublicHeader({nav, action}: {nav: ReactNode; action?: ReactNode}) {
  return (
    <header className="sticky top-0 z-20 grid grid-cols-[minmax(96px,1fr)_auto_minmax(132px,1fr)] items-center gap-4 border-b border-[#dde6ee]/80 bg-[#f8fcfd]/80 px-[clamp(18px,4vw,56px)] py-[18px] shadow-[0_10px_40px_rgba(11,31,58,0.06)] backdrop-blur-[22px] md:grid-cols-[minmax(180px,1fr)_auto_minmax(180px,1fr)]">
      <div className="col-start-1 row-start-1 flex items-center gap-3 justify-self-start">
        <LanguageSwitcher />
        {action}
      </div>
      <nav className="col-start-2 row-start-1 flex items-center gap-6 justify-self-center text-center text-sm font-medium text-[#647280]">
        {nav}
      </nav>
      <Link className="col-start-3 row-start-1 inline-flex items-center justify-self-end" href="/" aria-label="Middar home">
        <Image
          className="block h-auto w-[clamp(168px,20vw,258px)] object-contain"
          src="/middar-logo-transparent-v2.png"
          alt="Middar logo"
          width={747}
          height={211}
          priority
          unoptimized
        />
      </Link>
    </header>
  );
}

export function HeroLayout({
  eyebrow,
  title,
  subtitle,
  copy,
  trust,
  panel,
  id,
  affiliate = false
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  copy: ReactNode;
  trust: ReactNode[];
  panel: ReactNode;
  id?: string;
  affiliate?: boolean;
}) {
  return (
    <section
      className={cn(
        "grid min-h-[calc(100vh-76px)] items-center gap-[clamp(28px,5vw,72px)] overflow-hidden px-[clamp(18px,5vw,72px)] py-[clamp(34px,7vw,96px)] text-white",
        "lg:grid-cols-[minmax(0,1fr)_minmax(320px,460px)] rtl:lg:grid-cols-[minmax(320px,460px)_minmax(0,1fr)]",
        "bg-[linear-gradient(135deg,rgba(7,22,38,0.96),rgba(11,31,58,0.9)),radial-gradient(circle_at_70%_20%,rgba(32,184,181,0.26),transparent_30%),radial-gradient(circle_at_18%_76%,rgba(255,255,255,0.12),transparent_30%),#071626]",
        affiliate && "min-h-[620px]"
      )}
      id={id}
    >
      <div className="order-1 rtl:lg:order-2">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="m-0 mb-6 grid max-w-[780px] gap-3.5 text-5xl font-black leading-[1.15] text-white md:text-6xl lg:text-7xl">
          <span>{title}</span>
          {subtitle ? (
            <small className="block max-w-[720px] text-[clamp(30px,4.4vw,60px)] font-extrabold leading-[1.18] text-slate-200/90">
              {subtitle}
            </small>
          ) : null}
        </h1>
        <p className="m-0 max-w-2xl text-sm font-normal leading-[1.625] text-slate-300/90 md:text-base lg:text-lg">{copy}</p>
        <div className="mt-7 flex flex-wrap gap-3" aria-label="Trust indicators">
          {trust.map((item, index) => (
            <span className="rounded-lg border border-[#20b8b5]/30 px-3 py-2.5 text-[13px] text-[#e8fbfa]" key={index}>
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="order-2 rtl:lg:order-1">{panel}</div>
    </section>
  );
}

export function LeadPanel({tag, title, children, id}: {tag: ReactNode; title: ReactNode; children: ReactNode; id?: string}) {
  return (
    <aside
      className={cn(
        "rounded-lg border border-[#dde6ee]/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.62)),rgba(255,255,255,0.72)] p-7 text-[#0b1f3a] shadow-[0_24px_70px_rgba(11,31,58,0.12)] backdrop-blur-[18px]",
        theme.card
      )}
      id={id}
    >
      <div className="flex items-center gap-2.5 text-[13px] font-normal text-[#647280]">
        <span className="size-[9px] rounded-full bg-[#20b8b5]" />
        <span>{tag}</span>
      </div>
      <h2 className="mb-5 mt-4 text-3xl font-bold leading-tight text-[#0b1f3a]">{title}</h2>
      {children}
    </aside>
  );
}

export const formControl =
  "min-h-11 w-full rounded-lg border border-[#dde6ee] bg-white/60 px-3 py-2 text-[#0b1f3a] outline-none transition focus:border-[#22b8b8] focus:shadow-[0_0_0_4px_rgba(34,184,184,0.14)]";

export const formLabel = "grid gap-2 text-[13px] font-medium leading-relaxed text-[#647280]";
