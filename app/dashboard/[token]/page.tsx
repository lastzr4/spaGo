import { notFound } from "next/navigation";
import { getTherapistByToken } from "@/lib/dashboard";
import TopBar from "@/components/TopBar";
import BottomTabBar from "@/components/BottomTabBar";
import ProfileForm from "@/components/ProfileForm";
import DashboardStats from "@/components/DashboardStats";
import { getDashboardStats, getUpcomingQueue, getScheduleConflicts } from "@/lib/dashboardStats";
import PendingAlertBanner from "@/components/PendingAlertBanner";
import UpcomingQueue from "@/components/UpcomingQueue";
import ScheduleConflictBanner from "@/components/ScheduleConflictBanner";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage({ params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) notFound();

  const [stats, upcomingQueue, scheduleConflicts] = await Promise.all([
    getDashboardStats(therapist.id),
    getUpcomingQueue(therapist.id),
    getScheduleConflicts(therapist.id),
  ]);

  return (
    <>
      <TopBar title="Dashboard Terapis" />
      <main className="flex-1 overflow-y-auto px-5 py-5">
        <p className="mb-5 animate-fade-in text-[15px] text-[color:var(--text-secondary)]">
          Hai, <span className="font-semibold text-[color:var(--text-primary)]">{therapist.name}</span> 👋
        </p>

        <PendingAlertBanner token={params.token} pendingCount={stats.pendingCount} />
        <ScheduleConflictBanner token={params.token} conflicts={scheduleConflicts} />

        <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[color:var(--text-muted)]">Ringkasan</h2>
        <div className="mb-6 animate-fade-in">
          <DashboardStats token={params.token} {...stats} />
        </div>

        <UpcomingQueue bookings={upcomingQueue} token={params.token} />

        <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[color:var(--text-muted)]">Profil Saya</h2>
        <div className="card animate-fade-in">
          <ProfileForm
            token={params.token}
            slug={therapist.slug}
            therapist={{
              name: therapist.name,
              phone: therapist.phone,
              gender: therapist.gender,
              clientGenderPolicy: therapist.clientGenderPolicy,
              coverageAreas: therapist.coverageAreas,
              bio: therapist.bio ?? "",
              active: therapist.active,
              photoUrl: therapist.photoUrl,
              username: therapist.username,
              depositRequired: therapist.depositRequired,
              depositAmount: therapist.depositAmount ? therapist.depositAmount.toString() : null,
              paymentMethod: therapist.paymentMethod,
              qrCodeUrl: therapist.qrCodeUrl,
              extraChargesNote: therapist.extraChargesNote,
              socialInstagram: therapist.socialInstagram,
              socialTiktok: therapist.socialTiktok,
              socialThreads: therapist.socialThreads,
              socialX: therapist.socialX,
              specialties: therapist.specialties,
              yearsExperience: therapist.yearsExperience,
              workingHoursNote: therapist.workingHoursNote,
              galleryPhotos: therapist.galleryPhotos,
            }}
          />
        </div>

        <p className="mt-5 text-center text-xs text-[color:var(--text-muted)]">
          Simpan pautan ini untuk akses dashboard anda pada bila-bila masa.
        </p>
      </main>
      <BottomTabBar token={params.token} pendingCount={stats.pendingCount} />
    </>
  );
}
