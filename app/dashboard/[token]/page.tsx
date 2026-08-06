import { notFound } from "next/navigation";
import { getTherapistByToken } from "@/lib/dashboard";
import TopBar from "@/components/TopBar";
import BottomTabBar from "@/components/BottomTabBar";
import ProfileForm from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage({ params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) notFound();

  return (
    <>
      <TopBar title="Dashboard Terapis" />
      <main className="flex-1 overflow-y-auto px-5 py-5">
        <p className="mb-5 animate-fade-in text-[15px] text-gray-500">
          Hai, <span className="font-semibold text-brand-900">{therapist.name}</span> 👋
        </p>

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
