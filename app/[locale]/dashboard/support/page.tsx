import {setRequestLocale} from "next-intl/server";
import DashboardHeaderBanner from "@/components/DashboardHeaderBanner";
import {HelpDeskPanel} from "@/components/DashboardSections";
import {requireUserPageAccess} from "@/lib/user-page-access";

export default async function DashboardSupportPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  await requireUserPageAccess("page.user.support", locale);
  setRequestLocale(locale);

  return (
    <>
      <DashboardHeaderBanner section="support" />
      <div className="w-full">
        <HelpDeskPanel expanded />
      </div>
    </>
  );
}
