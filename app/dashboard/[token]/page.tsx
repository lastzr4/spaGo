import { notFound } from "next/navigation";
import { getTherapistByToken } from "@/lib/dashboard";
import TopBar from "@/components/TopBar";
import BottomTabBar from "@/components/BottomTabBar";
import ProfileForm from "@/components/ProfileForm";
import DashboardStats from "@/components/DashboardStats";
import { getDashboardStats, getNextUpcomingBooking } from "@/lib/dashboardStats";
import { CalendarIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage({ params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) notFound();

  const [stats, nextBooking] = await Promise.all([
    getDashboardStats(therapist.id),
    getNextUpcomingBooking(therapist.id),
  ]);

  return (
    <>
      <TopBar title="Dashboard Terapis" />
      <main className="flex-1 overflow-y-auto px-5 py-5">
        <p className="mb-5 animate-fade-in text-[15px] text-gray-500">
          Hai, <span className="font-semibold text-brand-900">{therapist.name}</span> 👋
        </p>

        <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-gray-400">Ringkasan</h2>
        <div className="mb-6 animate-fade-in">
          <DashboardStats token={params.token} {...stats} />
        </div>

        {nextBooking && (
          <div className="mb-6 flex animate-fade-in items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Tempahan Seterusnya</p>
              <p className="truncate text-sm font-semibold text-brand-900">
                {nextBooking.customerName} &middot; {nextBooking.serviceName}
              </p>
              <p className="text-xs text-gray-500">{nextBooking.date}, {nextBooking.startTime}</p>
            </div>
          </div>
        )}

        <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-gray-400">Profil Saya</h2>
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

        <p className="mt-5 text-center text-xs text-gray-400">
          Simpan pautan ini untuk akses dashboard anda pada bila-bila masa.
        </p>
      </main>
      <BottomTabBar token={params.token} />
    </>
  );
}
