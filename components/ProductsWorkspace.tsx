"use client";

import {useLocale} from "next-intl";
import {useState, type CSSProperties, type ReactNode} from "react";
import {CardTitle, DashboardCard, TabButton, dashboardField, dashboardLabel} from "@/components/DashboardPrimitives";
import {DemoView} from "@/components/DashboardNewSections";
import {cn, Eyebrow, theme} from "@/components/ui";

type ProductWorkspaceView = "catalog" | "form";
type MarketingTab = "sectors" | "social" | "library";
type SocialLogo = "instagram" | "snapchat" | "tiktok" | "x";
type IconShape =
  | "home"
  | "resort"
  | "car"
  | "spa"
  | "vet"
  | "health"
  | "restaurant"
  | "fitness"
  | "education"
  | "tourism"
  | "studio"
  | "install"
  | "consulting"
  | "events"
  | "maintenance"
  | "retail";

type Industry = {
  id: string;
  icon: IconShape;
  title: string;
  subtitle: string;
  url: string;
};

const catalogCopy = {
  ar: {
    eyebrow: "\u0642\u0637\u0627\u0639\u0627\u062a \u0645\u064a\u062f\u0627\u0631",
    heading: "\u0623\u0646\u0638\u0645\u0629 \u0645\u064a\u062f\u0627\u0631 \u0644\u0644\u0642\u0637\u0627\u0639\u0627\u062a",
    subheading: "\u0645\u0646\u0638\u0648\u0645\u0629 \u062d\u0644\u0648\u0644 SaaS \u0645\u062a\u062e\u0635\u0635\u0629 \u062a\u063a\u0637\u064a \u0627\u0644\u0642\u0637\u0627\u0639\u0627\u062a \u0627\u0644\u062a\u0634\u063a\u064a\u0644\u064a\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0629\u060c \u062c\u0627\u0647\u0632\u0629 \u0644\u0644\u062a\u0647\u064a\u0626\u0629 \u0648\u0627\u0644\u0628\u064a\u0639 \u0639\u0628\u0631 \u0634\u0628\u0643\u0629 \u0627\u0644\u0645\u0633\u0648\u0642\u064a\u0646.",
    explore: "\u0627\u0633\u062a\u0643\u0634\u0641 \u0627\u0644\u062d\u0644 \u2190"
  },
  en: {
    eyebrow: "Middar industries",
    heading: "Middar Industry Systems",
    subheading: "Specialized SaaS systems for operational sectors, ready for configuration and affiliate-led sales.",
    explore: "Explore solution ->"
  }
};

const industryLinks = {
  HOME_SERVICES: "https://www.middar.com/ar/home-services",
  MIDDAR_CHALETS: "https://www.middar.com/ar/chalets",
  CAR_WASH: "https://www.middar.com/ar/car-wash",
  MIDDAR_SALON: "https://www.middar.com/ar/salons",
  VET_CLINICS: "https://www.middar.com/ar/vet-clinics",
  HEALTH_CARE: "https://www.middar.com/ar/healthcare",
  RESTAURANTS: "https://www.middar.com/ar/restaurants",
  MIDDAR_GYMS: "https://www.middar.com/ar/gyms",
  EDUCATION: "https://www.middar.com/ar/education",
  TOURISM: "https://www.middar.com/ar/tourism",
  STUDIOS: "https://www.middar.com/ar/studios",
  TECHNICAL_INSTALLATIONS: "https://www.middar.com/ar/technical-installations",
  CONSULTING: "https://www.middar.com/ar/consulting",
  ENTERTAINMENT: "https://www.middar.com/ar/entertainment",
  MAINTENANCE_CLEANING: "https://www.middar.com/ar/maintenance",
  RETAIL: "https://www.middar.com/ar/retail"
} as const;

const industriesData: Industry[] = [
  {
    id: "home-services",
    icon: "home",
    url: industryLinks.HOME_SERVICES,
    title: "\u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0627\u0644\u0645\u0646\u0632\u0644\u064a\u0629",
    subtitle: "\u062d\u0644 \u0645\u062a\u0643\u0627\u0645\u0644 \u0644\u0645\u0632\u0648\u062f\u064a \u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0627\u0644\u0645\u0646\u0632\u0644\u064a\u0629"
  },
  {
    id: "chalets-resorts",
    icon: "resort",
    url: industryLinks.MIDDAR_CHALETS,
    title: "\u0627\u0644\u0634\u0627\u0644\u064a\u0647\u0627\u062a \u0648\u0627\u0644\u0645\u0646\u062a\u062c\u0639\u0627\u062a",
    subtitle: "\u0646\u0638\u0627\u0645 \u0645\u062a\u0643\u0627\u0645\u0644 \u0644\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0634\u0627\u0644\u064a\u0647\u0627\u062a \u0648\u0627\u0644\u0645\u0646\u062a\u062c\u0639\u0627\u062a"
  },
  {
    id: "car-wash",
    icon: "car",
    url: industryLinks.CAR_WASH,
    title: "\u0645\u063a\u0627\u0633\u0644 \u0627\u0644\u0633\u064a\u0627\u0631\u0627\u062a",
    subtitle: "\u0646\u0638\u0627\u0645 \u0645\u062a\u0643\u0627\u0645\u0644 \u0644\u0645\u063a\u0627\u0633\u0644 \u0627\u0644\u0633\u064a\u0627\u0631\u0627\u062a"
  },
  {
    id: "salon-spa",
    icon: "spa",
    url: industryLinks.MIDDAR_SALON,
    title: "\u0635\u0627\u0644\u0648\u0646\u0627\u062a \u0648\u0633\u0628\u0627",
    subtitle: "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0635\u0627\u0644\u0648\u0646\u0627\u062a \u0648\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u062a\u062c\u0645\u064a\u0644"
  },
  {
    id: "veterinary",
    icon: "vet",
    url: industryLinks.VET_CLINICS,
    title: "\u0627\u0644\u0639\u064a\u0627\u062f\u0627\u062a \u0627\u0644\u0628\u064a\u0637\u0631\u064a\u0629",
    subtitle: "\u062d\u0644 \u0645\u062a\u0643\u0627\u0645\u0644 \u0644\u0644\u0639\u064a\u0627\u062f\u0627\u062a \u0627\u0644\u0628\u064a\u0637\u0631\u064a\u0629"
  },
  {
    id: "healthcare",
    icon: "health",
    url: industryLinks.HEALTH_CARE,
    title: "\u0627\u0644\u0631\u0639\u0627\u064a\u0629 \u0627\u0644\u0635\u062d\u064a\u0629",
    subtitle: "\u062d\u0644 \u0645\u062a\u0643\u0627\u0645\u0644 \u0644\u0644\u0639\u064a\u0627\u062f\u0627\u062a \u0648\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u0631\u0639\u0627\u064a\u0629"
  },
  {
    id: "restaurants-cafes",
    icon: "restaurant",
    url: industryLinks.RESTAURANTS,
    title: "\u0627\u0644\u0645\u0637\u0627\u0639\u0645 \u0648\u0627\u0644\u0643\u0627\u0641\u064a\u0647\u0627\u062a",
    subtitle: "\u0646\u0638\u0627\u0645 \u0645\u062a\u0643\u0627\u0645\u0644 \u0644\u0644\u0645\u0637\u0627\u0639\u0645 \u0648\u0627\u0644\u0643\u0627\u0641\u064a\u0647\u0627\u062a"
  },
  {
    id: "sports-clubs",
    icon: "fitness",
    url: industryLinks.MIDDAR_GYMS,
    title: "\u0627\u0644\u0623\u0646\u062f\u064a\u0629 \u0627\u0644\u0631\u064a\u0627\u0636\u064a\u0629",
    subtitle: "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0623\u0646\u062f\u064a\u0629 \u0648\u0627\u0644\u0635\u0627\u0644\u0627\u062a \u0627\u0644\u0631\u064a\u0627\u0636\u064a\u0629"
  },
  {
    id: "training-education",
    icon: "education",
    url: industryLinks.EDUCATION,
    title: "\u0627\u0644\u062a\u062f\u0631\u064a\u0628 \u0648\u0627\u0644\u062a\u0639\u0644\u064a\u0645",
    subtitle: "\u062d\u0644 \u0645\u062a\u0643\u0627\u0645\u0644 \u0644\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u062a\u062f\u0631\u064a\u0628"
  },
  {
    id: "tourism-trips",
    icon: "tourism",
    url: industryLinks.TOURISM,
    title: "\u0627\u0644\u0633\u064a\u0627\u062d\u0629 \u0648\u0627\u0644\u0631\u062d\u0644\u0627\u062a",
    subtitle: "\u0646\u0638\u0627\u0645 \u0645\u062a\u0643\u0627\u0645\u0644 \u0644\u0645\u0646\u0638\u0645\u064a \u0627\u0644\u0631\u062d\u0644\u0627\u062a"
  },
  {
    id: "studios",
    icon: "studio",
    url: industryLinks.STUDIOS,
    title: "\u0627\u0644\u0627\u0633\u062a\u0648\u062f\u064a\u0648\u0647\u0627\u062a",
    subtitle: "\u0625\u062f\u0627\u0631\u0629 \u0627\u0633\u062a\u0648\u062f\u064a\u0648\u0647\u0627\u062a \u0627\u0644\u062a\u0635\u0648\u064a\u0631 \u0648\u0627\u0644\u0625\u0646\u062a\u0627\u062c"
  },
  {
    id: "technical-installations",
    icon: "install",
    url: industryLinks.TECHNICAL_INSTALLATIONS,
    title: "\u0627\u0644\u062a\u0631\u0643\u064a\u0628\u0627\u062a \u0627\u0644\u0641\u0646\u064a\u0629",
    subtitle: "\u062d\u0644 \u0645\u062a\u0643\u0627\u0645\u0644 \u0644\u0634\u0631\u0643\u0627\u062a \u0627\u0644\u062a\u0631\u0643\u064a\u0628\u0627\u062a"
  },
  {
    id: "consulting",
    icon: "consulting",
    url: industryLinks.CONSULTING,
    title: "\u0627\u0644\u0627\u0633\u062a\u0634\u0627\u0631\u0627\u062a",
    subtitle: "\u062d\u0644 \u0645\u062a\u0643\u0627\u0645\u0644 \u0644\u0645\u0643\u0627\u062a\u0628 \u0627\u0644\u0627\u0633\u062a\u0634\u0627\u0631\u0627\u062a"
  },
  {
    id: "entertainment-events",
    icon: "events",
    url: industryLinks.ENTERTAINMENT,
    title: "\u0627\u0644\u062a\u0631\u0641\u064a\u0647 \u0648\u0627\u0644\u0641\u0639\u0627\u0644\u064a\u0627\u062a",
    subtitle: "\u0646\u0638\u0627\u0645 \u0645\u062a\u0643\u0627\u0645\u0644 \u0644\u0645\u0646\u0638\u0645\u064a \u0627\u0644\u0641\u0639\u0627\u0644\u064a\u0627\u062a"
  },
  {
    id: "maintenance-cleaning",
    icon: "maintenance",
    url: industryLinks.MAINTENANCE_CLEANING,
    title: "\u0627\u0644\u0635\u064a\u0627\u0646\u0629 \u0648\u0627\u0644\u062a\u0646\u0638\u064a\u0641",
    subtitle: "\u062d\u0644 \u0645\u062a\u0643\u0627\u0645\u0644 \u0644\u0634\u0631\u0643\u0627\u062a \u0627\u0644\u0635\u064a\u0627\u0646\u0629 \u0648\u0627\u0644\u062a\u0646\u0638\u064a\u0641"
  },
  {
    id: "retail",
    icon: "retail",
    url: industryLinks.RETAIL,
    title: "\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u062a\u062c\u0632\u0626\u0629",
    subtitle: "\u062d\u0644 \u0645\u062a\u0643\u0627\u0645\u0644 \u0644\u0645\u062a\u0627\u062c\u0631 \u0627\u0644\u062a\u062c\u0632\u0626\u0629"
  }
];

const marketingTabs: Array<{id: MarketingTab; label: string; hint: string}> = [
  {
    id: "sectors",
    label: "\u0635\u0641\u062d\u0627\u062a \u0627\u0644\u0647\u0628\u0648\u0637 \u0648\u0627\u0644\u0642\u0637\u0627\u0639\u0627\u062a",
    hint: "\u0631\u0648\u0627\u0628\u0637 \u062c\u0627\u0647\u0632\u0629 \u0644\u0644\u0646\u0633\u062e \u0648\u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629"
  },
  {
    id: "social",
    label: "\u0645\u0646\u0635\u0627\u062a \u0627\u0644\u0633\u0648\u0634\u0644 \u0645\u064a\u062f\u064a\u0627",
    hint: "\u0642\u0646\u0648\u0627\u062a \u0646\u0634\u0631 \u0648\u0645\u0624\u0634\u0631\u0627\u062a \u0623\u062f\u0627\u0621"
  },
  {
    id: "library",
    label: "\u0627\u0644\u0645\u0643\u062a\u0628\u0629 \u0627\u0644\u062a\u0633\u0648\u064a\u0642\u064a\u0629",
    hint: "\u0635\u0648\u0631 \u0648\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u062c\u0627\u0647\u0632\u0629"
  }
];

const socialPlatforms = [
  {name: "\u062a\u064a\u0643 \u062a\u0648\u0643", handle: "middar@", reach: "62.4K", engagement: "9.4%", accent: "#00F2EA", logo: "tiktok" as SocialLogo},
  {name: "\u0633\u0646\u0627\u0628 \u0634\u0627\u062a", handle: "Middar Official", reach: "31.6K", engagement: "6.1%", accent: "#FFFC00", logo: "snapchat" as SocialLogo},
  {name: "\u0625\u0646\u0633\u062a\u063a\u0631\u0627\u0645", handle: "middar.sa@", reach: "48.2K", engagement: "7.8%", accent: "#E1306C", logo: "instagram" as SocialLogo},
  {name: "\u0645\u0646\u0635\u0629 X", handle: "@MiddarHQ", reach: "18.9K", engagement: "4.6%", accent: "#0F172A", logo: "x" as SocialLogo}
];

function SocialLogoIcon({logo}: {logo: SocialLogo}) {
  if (logo === "instagram") {
    return (
      <span className="grid size-12 place-items-center rounded-2xl bg-[#E1306C]/10 text-[#E1306C]" aria-hidden="true">
        <svg className="size-8 fill-none stroke-current stroke-2" viewBox="0 0 48 48">
          <rect x="11" y="11" width="26" height="26" rx="8" />
          <circle cx="24" cy="24" r="7" />
          <circle cx="32" cy="16" r="2.2" />
        </svg>
      </span>
    );
  }

  if (logo === "snapchat") {
    return (
      <span className="grid size-12 place-items-center rounded-2xl bg-[#FFFC00]/20 text-[#d4a400]" aria-hidden="true">
        <svg className="size-8 fill-current" viewBox="0 0 48 48">
          <path d="M24 9c5.9 0 9.1 4.4 9.1 9.6 0 1.2-.2 2.8-.2 4.2 0 .8.4 1.2 1.2 1.2 1.5 0 2.5-.7 3.3-.7.9 0 1.7.6 1.7 1.5 0 1.7-3.8 2.5-4.6 3.2.2 2.1 3.6 6.3 7.3 7 .8.2 1.2.7 1.2 1.4 0 1.4-3.4 2.2-5.4 2.5-.6.2-.8 2.1-2.1 2.1-1.1 0-2.9-.8-5-.8-2.3 0-3.4 2.8-6.5 2.8s-4.2-2.8-6.5-2.8c-2.1 0-3.9.8-5 .8-1.3 0-1.5-1.9-2.1-2.1-2-.3-5.4-1.1-5.4-2.5 0-.7.4-1.2 1.2-1.4 3.7-.7 7.1-4.9 7.3-7-.8-.7-4.6-1.5-4.6-3.2 0-.9.8-1.5 1.7-1.5.8 0 1.8.7 3.3.7.8 0 1.2-.4 1.2-1.2 0-1.4-.2-3-.2-4.2C14.9 13.4 18.1 9 24 9Z" />
        </svg>
      </span>
    );
  }

  if (logo === "tiktok") {
    return (
      <span className="grid size-12 place-items-center rounded-2xl bg-slate-950 text-white" aria-hidden="true">
        <svg className="size-8" viewBox="0 0 48 48">
          <path className="fill-[#00F2EA]" d="M29 10c.7 5.1 3.5 8.4 8.4 9v6.3c-2.9.1-5.6-.8-8.1-2.5v11.1c0 6.4-4.2 10-9.6 10-5.2 0-9.2-3.6-9.2-8.6 0-5.4 4.2-8.7 10-8.7.5 0 1 .1 1.5.2v6.6c-.5-.2-1-.3-1.6-.3-2 0-3.4 1.1-3.4 2.8 0 1.6 1.3 2.8 3 2.8 2.1 0 3.2-1.3 3.2-3.7V10h5.8Z" />
          <path className="fill-[#FF0050]" d="M31 10c.7 5.1 3.5 8.4 8.4 9v6.3c-2.9.1-5.6-.8-8.1-2.5v11.1c0 6.4-4.2 10-9.6 10-5.2 0-9.2-3.6-9.2-8.6 0-5.4 4.2-8.7 10-8.7.5 0 1 .1 1.5.2v6.6c-.5-.2-1-.3-1.6-.3-2 0-3.4 1.1-3.4 2.8 0 1.6 1.3 2.8 3 2.8 2.1 0 3.2-1.3 3.2-3.7V10H31Z" />
          <path className="fill-white" d="M30 10c.7 5.1 3.5 8.4 8.4 9v6.3c-2.9.1-5.6-.8-8.1-2.5v11.1c0 6.4-4.2 10-9.6 10-5.2 0-9.2-3.6-9.2-8.6 0-5.4 4.2-8.7 10-8.7.5 0 1 .1 1.5.2v6.6c-.5-.2-1-.3-1.6-.3-2 0-3.4 1.1-3.4 2.8 0 1.6 1.3 2.8 3 2.8 2.1 0 3.2-1.3 3.2-3.7V10H30Z" />
        </svg>
      </span>
    );
  }

  return (
    <span className="grid size-12 place-items-center rounded-2xl bg-slate-950 text-white" aria-hidden="true">
      <svg className="size-8 fill-current" viewBox="0 0 48 48">
        <path d="M28.2 21.2 39.6 8h-5.1l-8.6 10-6.8-10H8l12.1 17.7L7.8 40h5.1l9.5-11 7.5 11H41L28.2 21.2Zm-3.4 3.9-1.4-2L14.8 11.8h2.4l7 10.2 1.4 2 9.2 12.2h-2.4l-7.6-11.1Z" />
      </svg>
    </span>
  );
}

const assetFilters = [
  "\u0645\u0643\u062a\u0628\u0629 \u0627\u0644\u0635\u0648\u0631",
  "\u0627\u0644\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u0627\u0644\u062a\u0633\u0648\u064a\u0642\u064a\u0629"
];

const imageAssets = [
  "\u062d\u0645\u0644\u0629 \u0627\u0644\u0634\u0627\u0644\u064a\u0647\u0627\u062a",
  "\u0628\u0627\u0642\u0629 \u0627\u0644\u0635\u0627\u0644\u0648\u0646\u0627\u062a",
  "\u0647\u0648\u064a\u0629 \u0627\u0644\u0645\u063a\u0627\u0633\u0644"
];

const videoAssets = [
  "\u0631\u064a\u0644 \u062a\u0639\u0631\u064a\u0641\u064a \u0644\u0644\u0642\u0637\u0627\u0639\u0627\u062a",
  "\u0641\u064a\u062f\u064a\u0648 \u0634\u0631\u062d \u0644\u0644\u0645\u0633\u0648\u0642\u064a\u0646",
  "\u0644\u0642\u0637\u0627\u062a \u0627\u0644\u0645\u0646\u062a\u062c \u0627\u0644\u0633\u0631\u064a\u0639\u0629"
];

function IndustryIcon({shape, className}: {shape: IconShape; className: string}) {
  const iconProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true
  };

  const glyphs: Record<IconShape, ReactNode> = {
    home: (
      <>
        <path d="M4 11.5 12 5l8 6.5" />
        <path d="M6.5 10.5V19h11v-8.5" />
        <path d="M10 19v-5h4v5" />
      </>
    ),
    resort: (
      <>
        <path d="M4 17.5c3-1.4 5-1.4 8 0s5 1.4 8 0" />
        <path d="M6 13.5 12 6l6 7.5" />
        <path d="M9 13h6" />
        <path d="M12 6v13" />
      </>
    ),
    car: (
      <>
        <path d="M6 16h12" />
        <path d="m7.5 12 1.4-3.4h6.2l1.4 3.4" />
        <path d="M5.5 12h13l1 2.2V17h-15v-2.8z" />
        <circle cx="8" cy="17" r="1.3" />
        <circle cx="16" cy="17" r="1.3" />
      </>
    ),
    spa: (
      <>
        <path d="M12 19c0-4.4-3.2-8-7.2-8 0 4.4 3.2 8 7.2 8Z" />
        <path d="M12 19c0-4.4 3.2-8 7.2-8 0 4.4-3.2 8-7.2 8Z" />
        <path d="M12 13c-2.4-2-2.4-4.8 0-7 2.4 2.2 2.4 5 0 7Z" />
      </>
    ),
    vet: (
      <>
        <circle cx="12" cy="14" r="3.4" />
        <circle cx="7.5" cy="10" r="1.6" />
        <circle cx="10.2" cy="7" r="1.5" />
        <circle cx="13.8" cy="7" r="1.5" />
        <circle cx="16.5" cy="10" r="1.6" />
      </>
    ),
    health: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
        <rect x="4.5" y="4.5" width="15" height="15" rx="4" />
      </>
    ),
    restaurant: (
      <>
        <path d="M7 5v14" />
        <path d="M5 5v5a2 2 0 0 0 4 0V5" />
        <path d="M16 5v14" />
        <path d="M16 5c2.2 1.6 3.1 4.6 0 7" />
      </>
    ),
    fitness: (
      <>
        <path d="M5 9v6" />
        <path d="M19 9v6" />
        <path d="M8 8v8" />
        <path d="M16 8v8" />
        <path d="M8 12h8" />
      </>
    ),
    education: (
      <>
        <path d="M4 8.5 12 5l8 3.5-8 3.5z" />
        <path d="M7 11v4.2c3 2 7 2 10 0V11" />
        <path d="M20 9v5" />
      </>
    ),
    tourism: (
      <>
        <path d="M5 18 9 6l4 9 3-5 3 8" />
        <path d="M5 18h14" />
        <path d="M9 6h5" />
      </>
    ),
    studio: (
      <>
        <rect x="4.5" y="7" width="15" height="11" rx="3" />
        <path d="M8 7l1.4-2h5.2L16 7" />
        <circle cx="12" cy="12.5" r="3" />
      </>
    ),
    install: (
      <>
        <path d="M14.5 5.5 18 9l-9 9H5.5v-3.5z" />
        <path d="m13 7 4 4" />
        <path d="M5 20h14" />
      </>
    ),
    consulting: (
      <>
        <path d="M6 6h12v12H6z" />
        <path d="M9 10h6" />
        <path d="M9 14h4" />
        <path d="M6 6 4.5 4.5" />
        <path d="M18 6l1.5-1.5" />
      </>
    ),
    events: (
      <>
        <path d="M7 6h10v13H7z" />
        <path d="M9 4v4" />
        <path d="M15 4v4" />
        <path d="M7 10h10" />
        <path d="m10 15 1.4 1.4L15 13" />
      </>
    ),
    maintenance: (
      <>
        <path d="M14.5 6.5a4 4 0 0 0 5 5L12 19 5 12l7.5-7.5a4 4 0 0 0 2 2Z" />
        <path d="m6.5 13.5 4 4" />
      </>
    ),
    retail: (
      <>
        <path d="M6 9h12l-1 10H7z" />
        <path d="M8 9a4 4 0 0 1 8 0" />
        <path d="M9 13h6" />
      </>
    )
  };

  return (
    <span className={className} aria-hidden="true">
      <svg className="size-7" {...iconProps}>{glyphs[shape]}</svg>
    </span>
  );
}

export default function ProductsWorkspace({initialView = "catalog"}: {initialView?: ProductWorkspaceView}) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const copy = isArabic ? catalogCopy.ar : catalogCopy.en;
  const [copiedSectorId, setCopiedSectorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MarketingTab>("sectors");

  async function handleCopyLink(url: string, sectorId: string) {
    await navigator.clipboard.writeText(url);
    setCopiedSectorId(sectorId);
    window.setTimeout(() => setCopiedSectorId(null), 2000);
  }

  if (initialView === "form") {
    return <DemoView />;
  }

  return (
    <section className="grid gap-[18px]" dir={isArabic ? "rtl" : "ltr"}>
      <div className="flex flex-col items-start justify-between gap-5 rounded-[22px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#f8fcfd)] p-6 shadow-[0_18px_42px_rgba(15,23,42,0.055)] lg:flex-row">
        <div>
          <Eyebrow>{"\u0645\u0631\u0643\u0632 \u0627\u0644\u062a\u0633\u0648\u064a\u0642"}</Eyebrow>
          <h2 className="m-0 text-[clamp(28px,3.2vw,44px)] font-black leading-tight text-[#0b1f3a]">{"\u062a\u0633\u0648\u064a\u0642 \u0645\u064a\u062f\u0627\u0631 \u0648\u0625\u062f\u0627\u0631\u0629 \u0642\u0646\u0648\u0627\u062a \u0627\u0644\u0646\u0645\u0648"}</h2>
          <p className="m-0 mt-3 max-w-3xl text-sm leading-7 text-[#647280]">{"\u0645\u0633\u0627\u062d\u0629 \u0645\u0648\u062d\u062f\u0629 \u0644\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0642\u0637\u0627\u0639\u0627\u062a\u060c \u0642\u0646\u0648\u0627\u062a \u0627\u0644\u0633\u0648\u0634\u0644 \u0645\u064a\u062f\u064a\u0627\u060c \u0648\u0627\u0644\u0623\u0635\u0648\u0644 \u0627\u0644\u062a\u0633\u0648\u064a\u0642\u064a\u0629 \u0627\u0644\u062c\u0627\u0647\u0632\u0629 \u0644\u0644\u0645\u0633\u0648\u0642\u064a\u0646."}</p>
        </div>
        <span className="rounded-full bg-[#e0f8f8] px-4 py-2 text-xs font-black text-[#168f97]">{"Growth Hub"}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-[20px] border border-slate-200/90 bg-white/80 p-2.5 shadow-[0_18px_42px_rgba(15,23,42,0.05)] lg:grid-cols-3" role="tablist" aria-label={"\u062a\u0628\u0648\u064a\u0628\u0627\u062a \u0645\u0631\u0643\u0632 \u0627\u0644\u062a\u0633\u0648\u064a\u0642"}>
        {marketingTabs.map((tab) => (
          <TabButton active={activeTab === tab.id} key={tab.id} onClick={() => setActiveTab(tab.id)} title={tab.label} subtitle={tab.hint} />
        ))}
      </div>

      <div>
        {activeTab === "sectors" ? (
          <>
            <div className="mb-5 grid gap-2">
              <Eyebrow>{copy.eyebrow}</Eyebrow>
              <h2 className="m-0 text-[clamp(26px,3vw,40px)] font-black leading-tight text-[#0b1f3a]">{copy.heading}</h2>
              <p className="m-0 max-w-3xl text-sm leading-7 text-[#647280]">{copy.subheading}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {industriesData.map((industry) => (
                <article
                  className={cn("grid min-h-[220px] cursor-pointer gap-4 rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.055)] transition hover:-translate-y-0.5 hover:border-[#22b8b8]/35 hover:shadow-[0_20px_46px_rgba(34,184,184,0.12)]")}
                  key={industry.id}
                  onClick={() => {
                    window.open(industry.url, "_blank", "noopener,noreferrer");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      window.open(industry.url, "_blank", "noopener,noreferrer");
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-start justify-between gap-3">
                    <IndustryIcon className="grid size-12 place-items-center rounded-2xl bg-[#e0f8f8] text-[#168f97]" shape={industry.icon} />
                    <button
                      className={cn(
                        "rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-[#0b1f3a] transition hover:bg-slate-50",
                        copiedSectorId === industry.id && "border-[#22b8b8]/40 bg-[#e0f8f8] text-[#168f97]"
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleCopyLink(industry.url, industry.id);
                      }}
                      type="button"
                    >
                      {copiedSectorId === industry.id
                        ? "\u062a\u0645 \u0627\u0644\u0646\u0633\u062e! \u2713"
                        : "\u0646\u0633\u062e \u0627\u0644\u0631\u0627\u0628\u0637"}
                    </button>
                  </div>
                  <div className="grid gap-3">
                    <div>
                      <h3 className="m-0 text-base font-black leading-snug text-[#0b1f3a]">{industry.title}</h3>
                      <p className="m-0 mt-2 text-sm leading-7 text-[#647280]">{industry.subtitle}</p>
                    </div>
                    <strong className="text-sm font-black text-[#168f97]">{copy.explore}</strong>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}

        {activeTab === "social" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {socialPlatforms.map((platform) => (
              <DashboardCard className="rounded-[18px]" key={platform.name} style={{"--platform-accent": platform.accent} as CSSProperties}>
                <div className="flex items-center gap-3">
                  <SocialLogoIcon logo={platform.logo} />
                  <div>
                    <h3 className="m-0 text-base font-black text-[#0b1f3a]">{platform.name}</h3>
                    <p className="m-0 text-xs font-semibold text-[#647280]">{platform.handle}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <span className="text-xs font-semibold text-[#647280]">{"Reach"}</span>
                    <strong className="block text-lg font-black text-[#0b1f3a]">{platform.reach}</strong>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <span className="text-xs font-semibold text-[#647280]">{"Engagement"}</span>
                    <strong className="block text-lg font-black text-[#0b1f3a]">{platform.engagement}</strong>
                  </div>
                </div>
                <button className={theme.darkButton} type="button">{"\u062a\u062c\u0647\u064a\u0632 \u062d\u0645\u0644\u0629"}</button>
              </DashboardCard>
            ))}
          </div>
        ) : null}

        {activeTab === "library" ? (
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {assetFilters.map((filter) => (
                <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-[#0b1f3a]" key={filter} type="button">{filter}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {imageAssets.map((asset, index) => (
                <DashboardCard className="rounded-[18px]" key={asset}>
                  <span className="text-sm font-black text-[#22b8b8]">{`0${index + 1}`}</span>
                  <h3 className="m-0 text-base font-black text-[#0b1f3a]">{asset}</h3>
                  <p className="m-0 text-sm leading-7 text-[#647280]">{"\u0635\u0648\u0631 \u062a\u0631\u0648\u064a\u062c\u064a\u0629 \u0639\u0627\u0644\u064a\u0629 \u0627\u0644\u062f\u0642\u0629 \u062c\u0627\u0647\u0632\u0629 \u0644\u0644\u0645\u0634\u0627\u0631\u0643\u0629."}</p>
                  <button className={theme.primaryButton} type="button">{"\u062a\u0646\u0632\u064a\u0644"}</button>
                </DashboardCard>
              ))}
              {videoAssets.map((asset, index) => (
                <DashboardCard className="rounded-[18px]" key={asset}>
                  <span className="text-sm font-black text-[#22b8b8]">{`0${index + 1}`}</span>
                  <h3 className="m-0 text-base font-black text-[#0b1f3a]">{asset}</h3>
                  <p className="m-0 text-sm leading-7 text-[#647280]">{"\u0645\u0639\u0627\u064a\u0646\u0629 \u0633\u064a\u0646\u0645\u0627\u0626\u064a\u0629 \u0645\u062e\u062a\u0635\u0631\u0629 \u0644\u0644\u0625\u0639\u0644\u0627\u0646\u0627\u062a \u0648\u0627\u0644\u0631\u064a\u0644\u0632."}</p>
                  <button className={theme.primaryButton} type="button">{"\u0645\u0634\u0627\u0631\u0643\u0629"}</button>
                </DashboardCard>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <section className="py-8" dir="rtl">
        <DashboardCard className="rounded-[22px]">
            <h2 className="m-0 text-[clamp(24px,3vw,38px)] font-black leading-tight text-[#0b1f3a]">{"\u0637\u0644\u0628 \u0639\u0631\u0636 \u062a\u062c\u0631\u064a\u0628\u064a \u0644\u0644\u0645\u0646\u0634\u0622\u062a"}</h2>

            <form className="grid gap-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="grid gap-3.5">
                  <div>
                    <label className={dashboardLabel}>{"\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u0634\u0623\u0629"}</label>
                    <input className={dashboardField} type="text" placeholder={"\u0623\u062f\u062e\u0644 \u0627\u0633\u0645 \u0627\u0644\u0634\u0631\u0643\u0629 \u0623\u0648 \u0627\u0644\u0645\u0624\u0633\u0633\u0629"} />
                  </div>
                  <div>
                    <label className={dashboardLabel}>{"\u0646\u0648\u0639 \u0627\u0644\u0645\u0646\u0634\u0623\u0629"}</label>
                    <select className={dashboardField}>
                      <option>{"\u0634\u0627\u0644\u064a\u0647\u0627\u062a \u0648\u0645\u0646\u062a\u062c\u0639\u0627\u062a"}</option>
                      <option>{"\u0635\u0627\u0644\u0648\u0646\u0627\u062a \u0648\u0633\u0628\u0627"}</option>
                      <option>{"\u0645\u063a\u0627\u0633\u0644 \u0633\u064a\u0627\u0631\u0627\u062a"}</option>
                      <option>{"\u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0627\u0644\u0645\u0646\u0632\u0644\u064a\u0629"}</option>
                      <option>{"\u0623\u062e\u0631\u0649"}</option>
                    </select>
                  </div>
                  <div>
                    <label className={dashboardLabel}>{"\u0627\u0644\u0639\u0646\u0648\u0627\u0646"}</label>
                    <input className={dashboardField} type="text" placeholder={"\u0627\u0644\u0645\u062f\u064a\u0646\u0629\u060c \u0627\u0644\u062d\u064a"} />
                  </div>
                </div>

                <div className="grid gap-3.5">
                  <div>
                    <label className={dashboardLabel}>{"\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644"}</label>
                    <input className={dashboardField} type="text" placeholder={"\u0623\u062f\u062e\u0644 \u0627\u0633\u0645\u0643 \u0627\u0644\u062b\u0644\u0627\u062b\u064a"} />
                  </div>
                  <div>
                    <label className={dashboardLabel}>{"\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a"}</label>
                    <input className={dashboardField} dir="ltr" type="email" placeholder="name@company.com" />
                  </div>
                  <div>
                    <label className={dashboardLabel}>{"\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644"}</label>
                    <input className={dashboardField} dir="ltr" type="tel" placeholder="+966 5X XXX XXXX" />
                  </div>
                </div>
              </div>

              <div>
                <label className={dashboardLabel}>{"\u0627\u0644\u0645\u062a\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0625\u0636\u0627\u0641\u064a\u0629"}</label>
                <textarea className={cn(dashboardField, "min-h-[110px] resize-y")} rows={3} placeholder={"\u0627\u0630\u0643\u0631 \u0623\u064a \u0645\u062a\u0637\u0644\u0628\u0627\u062a \u062e\u0627\u0635\u0629 \u0623\u0648 \u062a\u0641\u0627\u0635\u064a\u0644 \u0625\u0636\u0627\u0641\u064a\u0629..."} />
              </div>

              <button className={theme.primaryButton} type="button">{"\u0625\u0631\u0633\u0627\u0644 \u0637\u0644\u0628 \u0639\u0631\u0636"}</button>
            </form>
        </DashboardCard>
      </section>
    </section>
  );
}
