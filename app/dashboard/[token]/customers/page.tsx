import { notFound } from "next/navigation";
import { getTherapistByToken } from "@/lib/dashboard";
import { getCustomerSummaries } from "@/lib/customers";
import { getPendingBookingCount } from "@/lib/dashboardStats";
import TopBar from "@/components/TopBar";
import BottomTabBar from "@/components/BottomTabBar";
import CustomerList from "@/components/CustomerList";

export const dynamic = "force-dynamic";

export default async function DashboardCustomersPage({ params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) notFound();

  const [customers, pendingCount] = await Promise.all([
    getCustomerSummaries(therapist.id),
    getPendingBookingCount(therapist.id),
  ]);

  return (
    <>
      <TopBar title="Pelanggan" />
      <main className="flex-1 overflow-y-auto px-5 py-5">
        <CustomerList customers={customers} token={params.token} therapistName={therapist.name} />
      </main>
      <BottomTabBar token={params.token} pendingCount={pendingCount} />
    </>
  );
}
