import { isAdminAuthed } from "@/lib/adminAuth";
import { getSiteSettings } from "@/lib/siteSettings";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminSettingsForm from "@/components/AdminSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = isAdminAuthed();

  if (!authed) {
    return <AdminLoginForm />;
  }

  const settings = await getSiteSettings();

  return (
    <main className="flex-1 overflow-y-auto">
      <AdminSettingsForm initialThemeColor={settings.themeColor} initialBackgroundColor={settings.backgroundColor} />
    </main>
  );
}
