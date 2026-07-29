import {redirect} from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";
import {getSession, isAdminSession} from "@/lib/auth";

const validAdminSections = new Set([
  "dashboard",
  "tickets",
  "accounts",
  "teams",
  "products",
  "booths",
  "tags",
  "activity",
  "content",
  "permissions",
]);

const observerSections = new Set(["dashboard", "accounts", "booths", "tags"]);

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams?: Promise<{section?: string}>;
}) {
  const {locale} = await params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/signin`);
  if (!isAdminSession(session)) redirect(`/${locale}/dashboard`);
  const query = await searchParams;
  const isObserver = String(session.role ?? "").toLowerCase() === "observer";
  const sectionSet = isObserver ? observerSections : validAdminSections;
  const requestedSection = String(query?.section ?? "dashboard");
  if (isObserver && !sectionSet.has(requestedSection)) {
    redirect(`/${locale}/admin?section=dashboard`);
  }
  const initialSection = sectionSet.has(requestedSection)
    ? (String(query?.section ?? "dashboard") as
        | "dashboard"
        | "tickets"
        | "accounts"
        | "teams"
        | "products"
        | "booths"
        | "tags"
        | "activity"
        | "content"
        | "permissions")
    : "dashboard";
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .admin-shell .service-ticket-toolbar-v2 {
              display: flex !important;
              align-items: center !important;
              justify-content: flex-start !important;
              flex-wrap: nowrap !important;
              gap: 8px !important;
              column-gap: 8px !important;
              row-gap: 8px !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .admin-shell .service-ticket-toolbar-v2 > * {
              margin: 0 !important;
            }

            .admin-shell .service-ticket-search-v2 {
              flex: 0 1 320px !important;
              width: 320px !important;
              min-width: 260px !important;
              max-width: 320px !important;
              margin: 0 !important;
            }

            .admin-shell .service-ticket-filter-v2,
            .admin-shell .service-ticket-status-v2,
            .admin-shell .service-ticket-types-v2,
            .admin-shell .service-ticket-types-v2 > .btn-types,
            .admin-shell .service-ticket-status-v2 .dashboard-select-trigger {
              flex: 0 0 128px !important;
              width: 128px !important;
              min-width: 128px !important;
              max-width: 128px !important;
              margin: 0 !important;
            }

            .admin-shell[dir="rtl"] .service-ticket-status-v2 {
              margin-inline-start: auto !important;
            }

            .admin-shell .service-ticket-toolbar-v2 .service-ticket-filter-v2,
            .admin-shell .service-ticket-toolbar-v2 .service-ticket-status-v2,
            .admin-shell .service-ticket-toolbar-v2 .service-ticket-types-v2 {
              flex: 0 0 166px !important;
              flex-basis: 166px !important;
              inline-size: 166px !important;
              width: 166px !important;
              min-width: 166px !important;
              max-width: 166px !important;
            }

            .admin-shell .service-ticket-toolbar-v2 .service-ticket-filter-v2,
            .admin-shell .service-ticket-toolbar-v2 .service-ticket-status-v2 .dashboard-select,
            .admin-shell .service-ticket-toolbar-v2 .service-ticket-status-v2 .dashboard-select-trigger,
            .admin-shell .service-ticket-toolbar-v2 .service-ticket-types-v2 > .btn-types {
              box-sizing: border-box !important;
              flex: 0 0 166px !important;
              flex-basis: 166px !important;
              inline-size: 166px !important;
              width: 166px !important;
              min-width: 166px !important;
              max-width: 166px !important;
              justify-content: center !important;
              text-align: center !important;
            }

            .admin-shell .service-ticket-toolbar-v2 .service-ticket-status-v2 .dashboard-select-value,
            .admin-shell .service-ticket-toolbar-v2 .service-ticket-status-v2 .dashboard-select-placeholder,
            .admin-shell .service-ticket-toolbar-v2 .service-ticket-types-v2 > .btn-types,
            .admin-shell .service-ticket-toolbar-v2 .service-ticket-filter-v2 {
              text-align: center !important;
            }
          `,
        }}
      />
      <AdminDashboard
        initialSection={initialSection}
        currentAccount={{
          name: session.name,
          email: session.email,
          role: session.role,
        }}
        isReadOnly={isObserver}
      />
    </>
  );
}
