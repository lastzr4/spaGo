import { isAdminAuthed } from "@/lib/adminAuth";
import { getSiteSettings } from "@/lib/siteSettings";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminNav from "@/components/AdminNav";
import AdminSettingsForm from "@/components/AdminSettingsForm";
import AdminServiceImageBackfill from "@/components/AdminServiceImageBackfill";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  if (!isAdminAuthed()) {
    return <AdminLoginForm />;
  }

  const settings = await getSiteSettings();

  return (
    <main className="flex-1 overflow-y-auto">
      <AdminNav />
      <AdminSettingsForm
        initialThemeColor={settings.themeColor}
        initialBackgroundColor={settings.backgroundColor}
        initialHeroTitle={settings.heroTitle}
        initialHeroSubtitle={settings.heroSubtitle}
        initialHeroBackgroundImage={settings.heroBackgroundImage}
        initialAdminEmail={settings.adminEmail}
      />
      <div className="px-5 pb-8">
        <AdminServiceImageBackfill />
      </div>
    </main>
  );
}
