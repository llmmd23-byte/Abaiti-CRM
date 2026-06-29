# Middar Platform — Chat Context Summary

> Last updated: 2026-06-24
>
> This file records the project decisions, implemented areas, and the current outstanding request. It intentionally does **not** include database credentials or other secrets.

## Project

- Application: Middar sales and affiliate SaaS platform.
- Stack: Next.js 16 (App Router), TypeScript, MySQL.
- Workspace: `C:\Users\asus\Documents\Market place`.
- Primary interface direction: premium minimalist SaaS styling, dark navy, white cards, bright cyan/teal accents, rounded controls, Arabic RTL support and English support.
- The project uses the `sales1_system` database configured locally through environment variables.

## Global UX decisions

- Arabic pages must render RTL, with navigation on the right when a side navigation is used.
- Static labels, headings, and non-interactive blank areas should not show a text-selection cursor (`user-select: none; cursor: default`). Inputs and text areas remain selectable/editable.
- Statuses use coloured pills/controls consistently. Arabic labels should be shown in Arabic across administrative lists.
- Search and status filters should reset when switching between administrative data lists.
- Dropdowns should be custom styled rather than relying on browser-native select menus where the design requires a popup.

## Authentication and user model

- Login and access rules were adjusted so users can enter when their account is allowed, independently of their business-status label.
- An admin role exists; `/[locale]/admin` checks the active session role and redirects non-admin users.
- User-related database/UI work requested and implemented over the conversation includes:
  - SHA-256 password handling for the originally requested seeded user flow.
  - Unique phone-number requirement.
  - `level` field and levels: `مبتدئ`, `نشيط`, `منجز`, `محترف`, `محترف فضي`, `محترف ذهبي`, `محترف ماسي`.
  - Host fields (`host_id`, `host_name`, `host_number`) and read-only host display.
  - User status connected to account status.
  - Company code connected to `companyid`.
  - Skills/profile fields for experience, courses, and proof uploads.
  - Social-account and payout-method integrations.

## Team hierarchy

- Team-member data is scoped to the logged-in user through `team_members.user_id`.
- Adding a member initially creates an inactive/pending relationship.
- Registration looks for a matching `team_members` phone number. When found, it links the new user to the host account and copies host ID/name/phone inside a database transaction.
- The Team Data screen and add-member modal were redesigned for parent → user → team-member hierarchy, with RTL styling and mandatory name/phone inputs.

## Help desk / service tickets

- Past/open ticket layout and ticket-status colours were refined.
- Ticket categories have distinctive colours; closed is red.
- Ticket creation includes a subject field in addition to category and details.
- Ticket data shows creation information in the intended time-zone format where applicable.
- Admin service-tickets view supports search, status filtering, status editing, notes, and ticket details. `support_tickets.note` was added for ticket notes.
- Ticket detail text is intended to display in the same row after the category in the admin list.

## Leads, customers, demos, and quotes

- Lead request form fields are connected to `leads`: customer/company data, phone, email, industry/activity, address, and requirements.
- `industries` is the source for activity selection. The obsolete `assigned_user_id` and direct `activity` lead fields were removed.
- Customer lists were reworked with search, inline stage controls, coloured stages, notes, and a Kanban view with movement between stages.
- Notes appear beneath a customer row when present and can be removed cleanly.
- A customer added by a user sets the lead source to `تمت أضافة العميل من قبل المستخدم`.
- Demo lists include filtering, inline status changes, expiry dates, status colours, and linked customer search.
- Quotes:
  - Product replaces package terminology.
  - Quote amount comes from the selected product and is view-only.
  - Quote details save to `quotes.note` and are optional; other quote fields are required.
  - Default validity is 14 days with a 30-day maximum.
  - WhatsApp/email sending is optional.
  - A customer cannot receive more than one quote.
  - Quote history supports status filtering and row-level status editing.

## Affiliate settings

- Marketing licence type/status and attachment fields were connected to the database.
- Licence status and attachment controls hide when “no licence” is selected.
- Social media settings connect to `affiliate_social_accounts`, including Instagram and improved RTL layout.
- Payout settings connect to `affiliate_payout_methods` and support multiple bank accounts, with a default account option.

## Administrative dashboard

- The administrator dashboard was built/refined with Arabic RTL and English language switching.
- Navigation was redesigned to match the user dashboard’s dark navy/teal visual system, then changed to a top-bar approach as requested.
- Main dashboard includes metric cards, a selected-metric chart, date-range filtering (day/week/month/year), and supporting lists for users, clients, demos, quotes, and sales.
- Dashboard includes open demos, open quotes, open tickets, today’s activity, and unapproved commissions.
- A prior duplicate React key issue in the admin management list was fixed.
- A prior commissions `reduce` crash caused by undefined data was fixed through safe handling.

## Admin management lists

- Products and industries have search, add, edit, delete, confirmation modal, and page-preserving refresh behaviour.
- “Activities” wording was changed to `الأنشطة` for industries.
- Management lists received consistent search/filter/edit controls, Arabic statuses, coloured status badges, and improved dropdown overflow/scrolling.
- The Accounts page now focuses on account financial data rather than the previous generic accounts-management table.

## Admin Accounts financial workflow

### Quotes section

- Contains a quotes table with quote number, customer, product, amount, status, user, date, and actions.
- Existing “إنشاء فاتورة مبيعات” (Create sales invoice) is disabled until a quote has payment status `paid`.
- Creating a sales invoice opens a modal with sale details and, after confirmation, adds a record to Sales List.
- Backend blocks duplicate sales invoices for the same quote.

### Sales List

- Contains sales number, customer, product, amount, status, user, quote number, date, and commission action.
- “إنشاء العمولات” is available per sale.
- The action is disabled immediately after successful commission creation and remains unavailable when a commission already exists for that sale.
- Backend prevents duplicate commission creation.

### Commissions List

- Contains ID, sales number, user, amount, percentage, status, invoice date, approval date, payment date, and approval action.
- “تعميد العمولات” changes a pending commission to `approved` and writes the approval date.
- Commission percentage is automatically determined from the affiliate level:
  - مبتدئ: 20%
  - نشيط: 21%
  - منجز: 22%
  - محترف: 24%
  - محترف فضي: 26%
  - محترف ذهبي: 28%
  - محترف ماسي: 30%
- Level progression uses sales volume: first tiers progress every 10 sales, and professional tiers progress every 20 sales, as reflected in the backend level thresholds.

## Key current files

- `components/AdminDashboard.tsx` — primary admin UI, accounts financial sections, modals and actions.
- `app/globals.css` — shared and admin styling.
- `app/api/v1/admin/management/route.ts` — management data for admin lists, including quotes, sales and commissions.
- `app/api/v1/admin/sales/route.ts` — creates sales invoices from paid quotes and blocks duplicates.
- `app/api/v1/admin/commissions/route.ts` — creates commissions and calculates level/percentage server-side.
- `app/api/v1/admin/commissions/[id]/approve/route.ts` — approves a pending commission.

## Current outstanding request

Add a second action in the **Admin Accounts → Quotes** table:

1. Label: `تعميد الدفع`.
2. The action is enabled only when the quote status is `accepted` / `مقبول`.
3. Clicking it opens a modal to attach a payment receipt.
4. Submitting the modal uploads/saves the receipt and changes the quote status from `accepted` to `paid` / `مدفوع`.
5. The implementation should validate the upload, prevent invalid state transitions, refresh the affected UI, and preserve the existing sales-invoice rule (sales invoices are only possible after payment).

## Recommended next implementation steps

1. Inspect the existing quote schema and any existing upload mechanism.
2. Add a receipt field/migration only if it does not already exist.
3. Add an admin-only payment-approval API that accepts the receipt and atomically updates an accepted quote to paid.
4. Add the row action and upload modal to `AdminDashboard.tsx`.
5. Add matching CSS and run a production build.
