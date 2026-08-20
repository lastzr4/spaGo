import { isAdminAuthed } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminNav from "@/components/AdminNav";
import AdminTherapistList from "@/components/AdminTherapistList";
import AdminAddTherapistForm from "@/components/AdminAddTherapistForm";

export const dynamic = "force-dynamic";

export default async function AdminTherapistsPage() {
  if (!isAdminAuthed()) {
    return <AdminLoginForm />;
  }

  const therapists = await prisma.therapist.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bookings: true, reviews: true } } },
  });

  return (
    <main className="flex-1 overflow-y-auto">
      <AdminNav />
      <div className="flex flex-col gap-4 px-5 py-5">
        <AdminAddTherapistForm />
        <AdminTherapistList
          initialTherapists={therapists.map((t) => ({
            id: t.id,
            name: t.name,
            phone: t.phone,
            username: t.username,
            gender: t.gender,
            coverageAreas: t.coverageAreas,
            active: t.active,
            isDemo: t.isDemo,
            dashboardToken: t.dashboardToken,
            bookingCount: t._count.bookings,
            reviewCount: t._count.reviews,
          }))}
        />
      </div>
    </main>
  );
}
