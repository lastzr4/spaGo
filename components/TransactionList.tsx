import Link from "next/link";
import { WalletIcon } from "@/components/icons";

type Transaction = { id: string; customerName: string; serviceName: string; date: string; amount: number };

const WEEKDAY = ["Ahd", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"];
const MONTH = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];

function formatDate(d: string) {
  const date = new Date(d + "T00:00:00");
  return `${WEEKDAY[date.getDay()]}, ${date.getDate()} ${MONTH[date.getMonth()]}`;
}

export default function TransactionList({ token, transactions }: { token: string; transactions: Transaction[] }) {
  if (transactions.length === 0) return null;

  return (
    <div className="mb-6 animate-fade-in">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-[color:var(--text-muted)]">Transaksi Terkini</h2>
        <Link href={`/dashboard/${token}/bookings?status=COMPLETED`} className="text-xs font-semibold text-brand-500 active:opacity-60">
          Lihat semua
        </Link>
      </div>
      <div className="card flex flex-col divide-y divide-[color:var(--border)] p-0">
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--surface-2)] text-emerald-400">
              <WalletIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[color:var(--text-primary)]">{t.customerName}</p>
              <p className="truncate text-xs text-[color:var(--text-secondary)]">
                {t.serviceName} &middot; {formatDate(t.date)}
              </p>
            </div>
            <span className="shrink-0 text-sm font-bold text-emerald-400">+RM{t.amount.toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
