import { notFound } from "next/navigation";
import { getTherapistByToken } from "@/lib/dashboard";
import DashboardNav from "@/components/DashboardNav";
import ProfileForm from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage({ params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) notFound();

  return (
    <main className="flex flex-1 flex-col px-6 py-8">
      <p className="mb-1 text-sm font-medium uppercase tracking-wide text-brand-500">Dashboard Terapis</p>
      <h1 className="mb-6 text-xl font-semibold text-brand-900">Hai, {therapist.name}</h1>

      <DashboardNav token={params.token} active="home" />

      <div className="card">
        <ProfileForm
          token={params.token}
          therapist={{
            name: therapist.name,
            phone: therapist.phone,
            gender: therapist.gender,
            clientGenderPolicy: therapist.clientGenderPolicy,
            coverageAreas: therapist.coverageAreas,
            bio: therapist.bio ?? "",
            active: therapist.active,
            photoUrl: therapist.photoUrl,
          }}
        />
      </div>

      <p className="mt-6 text-center text-xs text-gray-400">
        Simpan pautan ini untuk akses dashboard anda pada bila-bila masa.
      </p>
    </main>
  );
}
