"use client";

import {useLocale} from "next-intl";
import {useEffect, useMemo, useState, type CSSProperties, type ReactNode} from "react";
import {DemoView} from "@/components/DashboardNewSections";
import PdfPreviewFrame from "@/components/PdfPreviewFrame";
import {useBackend} from "@/lib/client-backend";
import {subscribeMarketingAssetsChanged} from "@/lib/marketing-assets-sync";

type ProductWorkspaceView = "catalog" | "form";
type MarketingTab = "sectors" | "social" | "library";
type AssetFilter = "all" | "images" | "videos";
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
  title: {ar: string; en: string};
  subtitle: {ar: string; en: string};
  url: string;
  externalUrl?: string;
};
type BackendRow = Record<string, unknown> & {id: number};

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

const DEFAULT_PUBLIC_BROCHURE_URL =
  "/api/v1/landing-brochure#toolbar=0&navpanes=0";
const industryLinks = {
  EVENTS_EXHIBITIONS: DEFAULT_PUBLIC_BROCHURE_URL
} as const;

function publicBrochureUrl(value: unknown) {
  const raw = String(value ?? "").trim();
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  if (
    !raw ||
    raw.startsWith("/api/v1/landing-brochure") ||
    raw.startsWith("/marketing-library/") ||
    raw.startsWith("/landing-pages/")
  ) {
    return DEFAULT_PUBLIC_BROCHURE_URL;
  }
  return DEFAULT_PUBLIC_BROCHURE_URL;
}

const industriesData: Industry[] = [
  {
    id: "events-exhibitions",
    icon: "events",
    url: industryLinks.EVENTS_EXHIBITIONS,
    title: {
      ar: "\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0645\u0639\u0627\u0631\u0636 \u0648\u0627\u0644\u0641\u0639\u0627\u0644\u064a\u0627\u062a",
      en: "Exhibitions and Event Systems",
    },
    subtitle: {
      ar: "\u062d\u0644 \u0645\u062a\u0643\u0627\u0645\u0644 \u0644\u0625\u062f\u0627\u0631\u0629 \u0648\u062a\u0646\u0638\u064a\u0645 \u0627\u0644\u0645\u0639\u0627\u0631\u0636 \u0648\u0627\u0644\u0645\u0624\u062a\u0645\u0631\u0627\u062a \u0648\u062d\u062c\u0632 \u0627\u0644\u0623\u062c\u0646\u062d\u0629 \u0648\u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0627\u0644\u0644\u0648\u062c\u0633\u062a\u064a\u0629 \u0631\u0642\u0645\u064a\u0627\u064b \u0628\u0627\u0644\u0643\u0627\u0645\u0644.",
      en: "An integrated solution for managing exhibitions and conferences, booth booking, and logistics digitally end to end.",
    },
  }
];

const marketingCopy = {
  ar: {
    eyebrow: "\u0645\u0631\u0643\u0632 \u0627\u0644\u062a\u0633\u0648\u064a\u0642",
    heading: "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062d\u0645\u0644\u0627\u062a \u0627\u0644\u062a\u0633\u0648\u064a\u0642\u064a\u0629",
    subheading: "\u0645\u0633\u0627\u062d\u0629 \u0645\u0648\u062d\u062f\u0629 \u0644\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0642\u0637\u0627\u0639\u0627\u062a\u060c \u0642\u0646\u0648\u0627\u062a \u0627\u0644\u0633\u0648\u0634\u0644 \u0645\u064a\u062f\u064a\u0627\u060c \u0648\u0627\u0644\u0623\u0635\u0648\u0644 \u0627\u0644\u062a\u0633\u0648\u064a\u0642\u064a\u0629 \u0627\u0644\u062c\u0627\u0647\u0632\u0629 \u0644\u0644\u0645\u0633\u0648\u0642\u064a\u0646.",
    tabLabel: "\u062a\u0628\u0648\u064a\u0628\u0627\u062a \u0645\u0631\u0643\u0632 \u0627\u0644\u062a\u0633\u0648\u064a\u0642",
    copied: "\u062a\u0645 \u0627\u0644\u0646\u0633\u062e! \u2713",
    copyLink: "\u0646\u0633\u062e \u0627\u0644\u0631\u0627\u0628\u0637",
    prepareCampaign: "\u062a\u062c\u0647\u064a\u0632 \u062d\u0645\u0644\u0629",
  },
  en: {
    eyebrow: "Marketing Center",
    heading: "Marketing Campaign Management",
    subheading: "A unified workspace for sector landing links, social media channels, and ready-to-use marketing assets.",
    tabLabel: "Marketing center tabs",
    copied: "Copied! \u2713",
    copyLink: "Copy link",
    prepareCampaign: "Prepare campaign",
  },
};

const marketingTabs: Array<{id: MarketingTab; label: {ar: string; en: string}; hint: {ar: string; en: string}}> = [
  {
    id: "sectors",
    label: {ar: "\u0635\u0641\u062d\u0627\u062a \u0627\u0644\u0647\u0628\u0648\u0637 \u0648\u0627\u0644\u0642\u0637\u0627\u0639\u0627\u062a", en: "Landing Pages and Sectors"},
    hint: {ar: "\u0631\u0648\u0627\u0628\u0637 \u062c\u0627\u0647\u0632\u0629 \u0644\u0644\u0646\u0633\u062e \u0648\u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629", en: "Ready links for copying and sharing"},
  },
  {
    id: "social",
    label: {ar: "\u0645\u0646\u0635\u0627\u062a \u0627\u0644\u0633\u0648\u0634\u0644 \u0645\u064a\u062f\u064a\u0627", en: "Social Media Platforms"},
    hint: {ar: "\u0642\u0646\u0648\u0627\u062a \u0646\u0634\u0631 \u0648\u0645\u0624\u0634\u0631\u0627\u062a \u0623\u062f\u0627\u0621", en: "Publishing channels and performance metrics"},
  },
  {
    id: "library",
    label: {ar: "\u0627\u0644\u0645\u0643\u062a\u0628\u0629 \u0627\u0644\u062a\u0633\u0648\u064a\u0642\u064a\u0629", en: "Marketing Library"},
    hint: {ar: "\u0635\u0648\u0631 \u0648\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u062c\u0627\u0647\u0632\u0629", en: "Ready images and videos"},
  }
];

const socialPlatforms = [
  {name: {ar: "\u062a\u064a\u0643 \u062a\u0648\u0643", en: "TikTok"}, handle: "middar@", reach: "62.4K", engagement: "9.4%", accent: "#00F2EA", logo: "tiktok" as SocialLogo},
  {name: {ar: "\u0633\u0646\u0627\u0628 \u0634\u0627\u062a", en: "Snapchat"}, handle: "Middar Official", reach: "31.6K", engagement: "6.1%", accent: "#FFFC00", logo: "snapchat" as SocialLogo},
  {name: {ar: "\u0625\u0646\u0633\u062a\u063a\u0631\u0627\u0645", en: "Instagram"}, handle: "middar.sa@", reach: "48.2K", engagement: "7.8%", accent: "#E1306C", logo: "instagram" as SocialLogo},
  {name: {ar: "\u0645\u0646\u0635\u0629 X", en: "X Platform"}, handle: "@MiddarHQ", reach: "18.9K", engagement: "4.6%", accent: "#0F172A", logo: "x" as SocialLogo}
];

function SocialLogoIcon({logo}: {logo: SocialLogo}) {
  if (logo === "instagram") {
    return (
      <span className="social-platform-logo social-platform-logo-instagram" aria-hidden="true">
        <svg viewBox="0 0 48 48">
          <rect x="11" y="11" width="26" height="26" rx="8" />
          <circle cx="24" cy="24" r="7" />
          <circle cx="32" cy="16" r="2.2" />
        </svg>
      </span>
    );
  }

  if (logo === "snapchat") {
    return (
      <span className="social-platform-logo social-platform-logo-snapchat" aria-hidden="true">
        <svg viewBox="0 0 48 48">
          <path d="M24 9c5.9 0 9.1 4.4 9.1 9.6 0 1.2-.2 2.8-.2 4.2 0 .8.4 1.2 1.2 1.2 1.5 0 2.5-.7 3.3-.7.9 0 1.7.6 1.7 1.5 0 1.7-3.8 2.5-4.6 3.2.2 2.1 3.6 6.3 7.3 7 .8.2 1.2.7 1.2 1.4 0 1.4-3.4 2.2-5.4 2.5-.6.2-.8 2.1-2.1 2.1-1.1 0-2.9-.8-5-.8-2.3 0-3.4 2.8-6.5 2.8s-4.2-2.8-6.5-2.8c-2.1 0-3.9.8-5 .8-1.3 0-1.5-1.9-2.1-2.1-2-.3-5.4-1.1-5.4-2.5 0-.7.4-1.2 1.2-1.4 3.7-.7 7.1-4.9 7.3-7-.8-.7-4.6-1.5-4.6-3.2 0-.9.8-1.5 1.7-1.5.8 0 1.8.7 3.3.7.8 0 1.2-.4 1.2-1.2 0-1.4-.2-3-.2-4.2C14.9 13.4 18.1 9 24 9Z" />
        </svg>
      </span>
    );
  }

  if (logo === "tiktok") {
    return (
      <span className="social-platform-logo social-platform-logo-tiktok" aria-hidden="true">
        <svg viewBox="0 0 48 48">
          <path className="tiktok-shadow-cyan" d="M29 10c.7 5.1 3.5 8.4 8.4 9v6.3c-2.9.1-5.6-.8-8.1-2.5v11.1c0 6.4-4.2 10-9.6 10-5.2 0-9.2-3.6-9.2-8.6 0-5.4 4.2-8.7 10-8.7.5 0 1 .1 1.5.2v6.6c-.5-.2-1-.3-1.6-.3-2 0-3.4 1.1-3.4 2.8 0 1.6 1.3 2.8 3 2.8 2.1 0 3.2-1.3 3.2-3.7V10h5.8Z" />
          <path className="tiktok-shadow-magenta" d="M31 10c.7 5.1 3.5 8.4 8.4 9v6.3c-2.9.1-5.6-.8-8.1-2.5v11.1c0 6.4-4.2 10-9.6 10-5.2 0-9.2-3.6-9.2-8.6 0-5.4 4.2-8.7 10-8.7.5 0 1 .1 1.5.2v6.6c-.5-.2-1-.3-1.6-.3-2 0-3.4 1.1-3.4 2.8 0 1.6 1.3 2.8 3 2.8 2.1 0 3.2-1.3 3.2-3.7V10H31Z" />
          <path className="tiktok-note" d="M30 10c.7 5.1 3.5 8.4 8.4 9v6.3c-2.9.1-5.6-.8-8.1-2.5v11.1c0 6.4-4.2 10-9.6 10-5.2 0-9.2-3.6-9.2-8.6 0-5.4 4.2-8.7 10-8.7.5 0 1 .1 1.5.2v6.6c-.5-.2-1-.3-1.6-.3-2 0-3.4 1.1-3.4 2.8 0 1.6 1.3 2.8 3 2.8 2.1 0 3.2-1.3 3.2-3.7V10H30Z" />
        </svg>
      </span>
    );
  }

  return (
    <span className="social-platform-logo social-platform-logo-x" aria-hidden="true">
      <svg viewBox="0 0 48 48">
        <path d="M28.2 21.2 39.6 8h-5.1l-8.6 10-6.8-10H8l12.1 17.7L7.8 40h5.1l9.5-11 7.5 11H41L28.2 21.2Zm-3.4 3.9-1.4-2L14.8 11.8h2.4l7 10.2 1.4 2 9.2 12.2h-2.4l-7.6-11.1Z" />
      </svg>
    </span>
  );
}

const assetFilters: Array<{id: AssetFilter; ar: string; en: string}> = [
  {id: "all", ar: "\u0627\u0644\u0643\u0644", en: "All"},
  {id: "images", ar: "\u0645\u0643\u062a\u0628\u0629 \u0627\u0644\u0635\u0648\u0631", en: "Photo Library"},
  {id: "videos", ar: "\u0627\u0644\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u0627\u0644\u062a\u0633\u0648\u064a\u0642\u064a\u0629", en: "Marketing Videos"}
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
      <svg {...iconProps}>{glyphs[shape]}</svg>
    </span>
  );
}

export default function ProductsWorkspace({initialView = "catalog"}: {initialView?: ProductWorkspaceView}) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const copy = isArabic ? catalogCopy.ar : catalogCopy.en;
  const marketing = isArabic ? marketingCopy.ar : marketingCopy.en;
  const [copiedSectorId, setCopiedSectorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MarketingTab>("sectors");
  const [activeAssetFilter, setActiveAssetFilter] = useState<AssetFilter>("all");
  const {data: liveIndustries} = useBackend<Array<Record<string, unknown> & {id: number}>>("/api/v1/data/industries");
  const {
    data: marketingAssetsData,
    loading: marketingAssetsLoading,
    reload: reloadMarketingAssets,
  } = useBackend<BackendRow[]>("/api/v1/data/marketing-assets");

  useEffect(
    () =>
      subscribeMarketingAssetsChanged(() => {
        void reloadMarketingAssets();
      }),
    [reloadMarketingAssets],
  );

  const displayedIndustries: Industry[] = useMemo(
    () =>
      industriesData.map((industry) => {
        const live = liveIndustries?.find((row) => row.slug === industry.id);
        return live
          ? {
              ...industry,
              title: {
                ...industry.title,
                ar: String(live.name ?? industry.title.ar),
              },
              subtitle: {
                ...industry.subtitle,
                ar: String(live.description ?? industry.subtitle.ar),
              },
              url:
                industry.id === "events-exhibitions"
                  ? publicBrochureUrl(live.landing_url)
                  : industry.url,
              externalUrl: String(live.external_url ?? "").trim() || undefined,
            }
          : industry;
      }),
    [liveIndustries],
  );
  const primaryIndustry = displayedIndustries[0] ?? industriesData[0];
  const primaryExternalUrl = primaryIndustry.externalUrl;
  const visibleMarketingAssets = useMemo(
    () =>
      (marketingAssetsData ?? []).filter((asset) => {
        const hasStoredFile =
          Number(asset.file_data_size ?? 0) > 0 ||
          Number(asset.file_size ?? 0) > 0 ||
          String(asset.file_path ?? "").trim().length > 0;
        if (!hasStoredFile) return false;
        if (String(asset.status ?? "active") !== "active") return false;
        if (activeAssetFilter === "all") return true;
        if (activeAssetFilter === "images") return String(asset.asset_type) === "image";
        return String(asset.asset_type) === "video";
      }),
    [activeAssetFilter, marketingAssetsData],
  );

  async function handleCopyLink(url: string, sectorId: string) {
    await navigator.clipboard.writeText(url);
    setCopiedSectorId(sectorId);
    window.setTimeout(() => setCopiedSectorId(null), 2000);
  }

  function formatFileSize(value: unknown) {
    const size = Number(value ?? 0);
    if (!Number.isFinite(size) || size <= 0) return "\u2014";
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function cleanAssetDate(value: unknown) {
    return String(value ?? "").slice(0, 10) || "\u2014";
  }

  function assetTypeLabel(value: unknown) {
    const key = String(value ?? "other");
    const labels: Record<string, {ar: string; en: string}> = {
      image: {ar: "\u0635\u0648\u0631\u0629", en: "Image"},
      video: {ar: "\u0641\u064a\u062f\u064a\u0648", en: "Video"},
      document: {ar: "\u0645\u0644\u0641", en: "Document"},
      other: {ar: "\u0645\u0644\u0641 \u0622\u062e\u0631", en: "Other"},
    };
    return labels[key]?.[isArabic ? "ar" : "en"] ?? key;
  }

  function marketingAssetUrl(asset: BackendRow, action: "view" | "download") {
    return `/api/v1/marketing-assets/${action}/${encodeURIComponent(String(asset.id))}`;
  }

  function marketingAssetFileName(asset: BackendRow) {
    return String(asset.original_name ?? asset.title ?? "marketing-file").replace(/[\r\n]/g, "");
  }

  function handleMarketingAssetAction(asset: BackendRow, action: "view" | "download") {
    const url = marketingAssetUrl(asset, action);
    if (action === "view") {
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) window.location.href = url;
      return;
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = marketingAssetFileName(asset);
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  if (initialView === "form") {
    return <DemoView />;
  }

  return (
    <section className="products-workspace" dir={isArabic ? "rtl" : "ltr"}>
      {activeTab !== "sectors" ? (
      <div className="marketing-hub-hero bg-white border border-slate-100 shadow-sm rounded-2xl p-6 mb-6 w-full flex items-center justify-between">
        <div className="marketing-hub-copy flex flex-col gap-1 text-right">
          <p className="eyebrow text-[#00b4d8] text-xs font-semibold mb-1">{marketing.eyebrow}</p>
          <h2 className="text-[#0f2942] text-xl font-bold md:text-2xl">{marketing.heading}</h2>
          <p className="marketing-hub-subtitle text-slate-500 text-sm">{marketing.subheading}</p>
        </div>
        <span className="growth-hub-chip bg-cyan-50/60 text-[#00b4d8] border border-cyan-100/50 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide">
          {marketing.eyebrow}
        </span>
      </div>
      ) : null}

      <div className="marketing-tabs" role="tablist" aria-label={marketing.tabLabel}>
        {marketingTabs.map((tab) => (
          <button
            className={activeTab === tab.id ? "active" : ""}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            type="button"
          >
            <strong>{tab.label[isArabic ? "ar" : "en"]}</strong>
            <span>{tab.hint[isArabic ? "ar" : "en"]}</span>
          </button>
        ))}
      </div>

      <div className="marketing-tab-panel">
        {activeTab === "sectors" ? (
          <div className={`landing-sector-card ${isArabic ? "rtl" : "ltr"}`}>
            <div className="landing-sector-heading">
              {primaryExternalUrl ? (
                <div className="landing-sector-actions">
                  <a
                    className="landing-sector-control"
                    href={primaryExternalUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{isArabic ? "\u0641\u062a\u062d \u0627\u0644\u0645\u0648\u0642\u0639" : "Open site"}</span>
                  </a>
                  <button
                    className="landing-sector-control"
                    onClick={() =>
                      void handleCopyLink(
                        primaryExternalUrl,
                        primaryIndustry.id,
                      )
                    }
                    type="button"
                  >
                    <span>
                      {copiedSectorId === primaryIndustry.id
                        ? isArabic
                          ? "\u062a\u0645 \u0627\u0644\u0646\u0633\u062e"
                          : "Copied"
                        : isArabic
                          ? "\u0646\u0633\u062e \u0627\u0644\u0631\u0627\u0628\u0637"
                          : "Copy link"}
                    </span>
                  </button>
                </div>
              ) : null}
              <div className="landing-sector-copy">
                <h2
                  dir={isArabic ? "rtl" : "ltr"}
                  lang={isArabic ? "ar" : "en"}
                  style={{
                    direction: isArabic ? "rtl" : "ltr",
                    textAlign: isArabic ? "right" : "left",
                  }}
                >
                  {primaryIndustry.title[isArabic ? "ar" : "en"]}
                </h2>
                <p>
                  {primaryIndustry.subtitle[isArabic ? "ar" : "en"]}
                </p>
              </div>
            </div>

            <div className="landing-sector-frame">
              <div className="landing-sector-frame-stack">
                <PdfPreviewFrame
                  className="landing-sector-pdf-preview"
                  minHeight={560}
                  src={primaryIndustry.url}
                  title={primaryIndustry.title[isArabic ? "ar" : "en"]}
                />
                <a href={primaryIndustry.url} target="_blank" rel="noreferrer">
                  {isArabic ? "فتح بروشور صفحة الهبوط" : "Open landing brochure"}
                </a>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "social" ? (
          <div className="social-platform-grid">
            {socialPlatforms.map((platform) => (
              <article className="social-platform-card" key={platform.logo} style={{"--platform-accent": platform.accent} as CSSProperties}>
                <div className="social-platform-head">
                  <SocialLogoIcon logo={platform.logo} />
                  <div>
                    <h3>{platform.name[isArabic ? "ar" : "en"]}</h3>
                    <p>{platform.handle}</p>
                  </div>
                </div>
                <div className="social-stat-grid">
                  <div>
                    <span>{"Reach"}</span>
                    <strong>{platform.reach}</strong>
                  </div>
                  <div>
                    <span>{"Engagement"}</span>
                    <strong>{platform.engagement}</strong>
                  </div>
                </div>
                <button type="button">{marketing.prepareCampaign}</button>
              </article>
            ))}
          </div>
        ) : null}

        {activeTab === "library" ? (
          <div className="marketing-library">
            <div className="asset-filter-row">
              {assetFilters.map((filter) => (
                <button
                  aria-pressed={activeAssetFilter === filter.id}
                  className={activeAssetFilter === filter.id ? "active" : ""}
                  key={filter.id}
                  onClick={() => setActiveAssetFilter(filter.id)}
                  type="button"
                >
                  {isArabic ? filter.ar : filter.en}
                </button>
              ))}
            </div>

            <div className="marketing-assets-table">
              <table>
                <thead>
                  <tr>
                    <th>{isArabic ? "\u0627\u0633\u0645 \u0627\u0644\u0645\u0644\u0641" : "File name"}</th>
                    <th>{isArabic ? "\u0627\u0644\u0646\u0648\u0639" : "Type"}</th>
                    <th>{isArabic ? "\u0627\u0644\u062d\u062c\u0645" : "Size"}</th>
                    <th>{isArabic ? "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0631\u0641\u0639" : "Uploaded at"}</th>
                    <th>{isArabic ? "\u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleMarketingAssets
                    .map((asset) => (
                      <tr key={asset.id}>
                        <td>
                          <strong>{String(asset.title ?? asset.original_name ?? "\u2014")}</strong>
                          <span>{String(asset.description ?? asset.original_name ?? "")}</span>
                        </td>
                        <td>{assetTypeLabel(asset.asset_type)}</td>
                        <td>{formatFileSize(asset.file_size)}</td>
                        <td>{cleanAssetDate(asset.created_at)}</td>
                        <td>
                          <div className="actions-wrapper marketing-asset-actions">
                            <button
                              className="action-btn btn-view"
                              onClick={() => void handleMarketingAssetAction(asset, "view")}
                              type="button"
                            >
                              {isArabic ? "\u0627\u0644\u0639\u0631\u0636" : "View"}
                            </button>
                            <button
                              className="action-btn btn-download"
                              onClick={() => void handleMarketingAssetAction(asset, "download")}
                              type="button"
                            >
                              {isArabic ? "\u062a\u0646\u0632\u064a\u0644" : "Download"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {!marketingAssetsLoading && !visibleMarketingAssets.length ? (
                    <tr>
                      <td colSpan={5}>
                        {(marketingAssetsData ?? []).length
                          ? isArabic
                            ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0644\u0641\u0627\u062a \u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u0641\u0644\u062a\u0631"
                            : "No files match this filter"
                          : isArabic
                            ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0644\u0641\u0627\u062a \u0641\u064a \u0627\u0644\u0645\u0643\u062a\u0628\u0629 \u062d\u062a\u0649 \u0627\u0644\u0622\u0646"
                            : "No files in the library yet"}
                      </td>
                    </tr>
                  ) : null}
                  {marketingAssetsLoading ? (
                    <tr>
                      <td colSpan={5}>{isArabic ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644..." : "Loading..."}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      {/*
      <section className="dashboard-lead-request" dir="rtl">
        <div className="dashboard-lead-request-inner">
          <div className="dashboard-lead-request-card">
            <h2>{"\u0637\u0644\u0628 \u0639\u0631\u0636 \u062a\u062c\u0631\u064a\u0628\u064a \u0644\u0644\u0645\u0646\u0634\u0622\u062a"}</h2>

            <form className="dashboard-lead-request-form" onSubmit={(event) => void submitLeadRequest(event)}>
              <div className="dashboard-lead-request-grid">
                <div className="dashboard-lead-request-stack">
                  <div>
                    <label>{"\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u0634\u0623\u0629"}</label>
                    <input onChange={(event) => setLeadRequest((current) => ({...current, companyName: event.target.value}))} required type="text" value={leadRequest.companyName} placeholder={"\u0623\u062f\u062e\u0644 \u0627\u0633\u0645 \u0627\u0644\u0634\u0631\u0643\u0629 \u0623\u0648 \u0627\u0644\u0645\u0624\u0633\u0633\u0629"} />
                  </div>
                  <div>
                    <label>{"\u0646\u0648\u0639 \u0627\u0644\u0646\u0634\u0627\u0637"}</label>
                    <DashboardSelect
                      ariaLabel={"\u0646\u0648\u0639 \u0627\u0644\u0646\u0634\u0627\u0637"}
                      onValueChange={(value) => setLeadRequest((current) => ({...current, industryId: value}))}
                      options={(liveIndustries ?? [])
                        .filter((industry) => String(industry.status ?? "active") === "active")
                        .map((industry) => ({label: String(industry.name ?? "\u2014"), value: String(industry.id)}))}
                      placeholder={"\u0627\u062e\u062a\u0631 \u0646\u0648\u0639 \u0627\u0644\u0646\u0634\u0627\u0637"}
                      value={leadRequest.industryId}
                    />
                  </div>
                  <div>
                    <label>{"\u0627\u0644\u0639\u0646\u0648\u0627\u0646"}</label>
                    <input onChange={(event) => setLeadRequest((current) => ({...current, address: event.target.value}))} type="text" value={leadRequest.address} placeholder={"\u0627\u0644\u0645\u062f\u064a\u0646\u0629\u060c \u0627\u0644\u062d\u064a"} />
                  </div>
                </div>

                <div className="dashboard-lead-request-stack">
                  <div>
                    <label>{"\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644"}</label>
                    <input onChange={(event) => setLeadRequest((current) => ({...current, fullName: event.target.value}))} required type="text" value={leadRequest.fullName} placeholder={"\u0623\u062f\u062e\u0644 \u0627\u0633\u0645\u0643 \u0627\u0644\u062b\u0644\u0627\u062b\u064a"} />
                  </div>
                  <div>
                    <label>{"\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a"}</label>
                    <input dir="ltr" onChange={(event) => setLeadRequest((current) => ({...current, email: event.target.value}))} type="email" value={leadRequest.email} placeholder="name@company.com" />
                  </div>
                  <div>
                    <label>{"\u0631\u0642\u0645 \u0627\u0644\u062c\u0648\u0627\u0644"}</label>
                    <input dir="ltr" onChange={(event) => setLeadRequest((current) => ({...current, phone: event.target.value}))} required type="tel" value={leadRequest.phone} placeholder="+966 5X XXX XXXX" />
                  </div>
                </div>
              </div>

              <div>
                <label>{"\u0627\u0644\u0645\u062a\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0625\u0636\u0627\u0641\u064a\u0629"}</label>
                <textarea onChange={(event) => setLeadRequest((current) => ({...current, requirements: event.target.value}))} rows={3} value={leadRequest.requirements} placeholder={"\u0627\u0630\u0643\u0631 \u0623\u064a \u0645\u062a\u0637\u0644\u0628\u0627\u062a \u062e\u0627\u0635\u0629 \u0623\u0648 \u062a\u0641\u0627\u0635\u064a\u0644 \u0625\u0636\u0627\u0641\u064a\u0629..."} />
              </div>

              <button type="submit">{"\u0625\u0631\u0633\u0627\u0644 \u0637\u0644\u0628 \u0639\u0631\u0636"}</button>
              {leadRequestStatus ? <p className="dashboard-lead-request-status" role="status">{leadRequestStatus}</p> : null}
            </form>
          </div>
        </div>
      </section>
      */}
    </section>
  );
}
