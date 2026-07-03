import DashboardShell from "@/components/DashboardShell";
import {DashboardHeader} from "@/components/DashboardSections";
import {EducationalHubView} from "@/components/DashboardNewSections";
import {requireUserPageAccess} from "@/lib/user-page-access";

export default async function EducationalHubPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  await requireUserPageAccess("page.user.education", locale);
  return (
    <DashboardShell active="education">
      <DashboardHeader
        eyebrow={"\u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u062a\u0639\u0644\u064a\u0645\u064a"}
        title={"\u0645\u0631\u0643\u0632 \u0627\u0644\u0645\u0639\u0631\u0641\u0629 \u0648\u0627\u0644\u0645\u0648\u0627\u062f \u0627\u0644\u062a\u062f\u0631\u064a\u0628\u064a\u0629."}
      />
      <EducationalHubView />
    </DashboardShell>
  );
}
