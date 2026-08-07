import { isAdminAuthed } from "@/lib/adminAuth";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminNav from "@/components/AdminNav";
import DemoDataPanel from "@/components/DemoDataPanel";

export const dynamic = "force-dynamic";

export default function AdminDemoPage() {
  if (!isAdminAuthed()) {
    return <AdminLoginForm />;
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <AdminNav />
      <div className="px-5 py-5">
        <DemoDataPanel />
      </div>
    </main>
  );
}
