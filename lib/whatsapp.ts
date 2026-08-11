export function buildWhatsAppBookingMessage(params: {
  customerName: string;
  serviceName: string;
  durationMinutes: number;
  date: string;
  startTime: string;
  address: string;
  depositInfo?: string;
  extraChargesNote?: string;
  referralCode?: string;
  // Straight-line estimate (haversine, free — no geocoding API involved)
  // and a Google Maps link the therapist can tap for the real driving
  // route. Both are optional: only present when we have GPS coords for
  // both the therapist's base location and the customer.
  distanceKm?: number;
  mapsUrl?: string;
  // Dynamic travel fee (see lib/geo.ts computeTravelFee) — already shown to
  // and explicitly agreed to by the customer before this message is built,
  // included here as the therapist's own record of what was agreed.
  travelFee?: number;
}) {
  const { customerName, serviceName, durationMinutes, date, startTime, address, depositInfo, extraChargesNote, referralCode, distanceKm, mapsUrl, travelFee } = params;
  const lines = [
    `Salam SpaGo! Tempahan Baru daripada ${customerName}.`,
    `Servis: ${serviceName} (${durationMinutes} min).`,
    `Tarikh: ${date}, ${startTime}.`,
    `Alamat: ${address}.`,
  ];
  if (distanceKm != null) lines.push(`Jarak anggaran: ${distanceKm.toFixed(1)} km dari lokasi anda.`);
  if (mapsUrl) lines.push(`Peta & jarak sebenar: ${mapsUrl}`);
  if (travelFee != null && travelFee > 0) lines.push(`Caj perjalanan: RM${travelFee} (dipersetujui pelanggan semasa tempahan).`);
  if (depositInfo) lines.push(`Deposit: ${depositInfo}.`);
  if (extraChargesNote) lines.push(`Caj tambahan: ${extraChargesNote}.`);
  if (referralCode) lines.push(`Kod rujukan digunakan: ${referralCode}.`);
  lines.push(`Status: Menunggu Pengesahan.`);
  return lines.join("\n");
}

export function normalizePhoneForWhatsApp(phone: string) {
  // Expect Malaysian numbers; normalize to 60XXXXXXXXX with no symbols.
  let digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) digits = "6" + digits;
  if (!digits.startsWith("60")) digits = "60" + digits;
  return digits;
}

export function buildWhatsAppLink(phone: string, message: string) {
  const number = normalizePhoneForWhatsApp(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppReminderMessage(params: {
  customerName: string;
  serviceName: string;
  startTime: string;
  address: string;
}) {
  const { customerName, serviceName, startTime, address } = params;
  return [
    `Hai ${customerName}! Peringatan mesra dari SpaGo 😊`,
    `Tempahan ${serviceName} anda dijadualkan jam ${startTime} sebentar lagi.`,
    `Alamat: ${address}.`,
    `Sila bersedia ya, jumpa sekejap lagi!`,
  ].join("\n");
}

export function buildWhatsAppFollowUpMessage(params: { customerName: string; therapistName: string; referralCode: string }) {
  const { customerName, therapistName, referralCode } = params;
  return [
    `Hai ${customerName}! Ini ${therapistName} dari SpaGo 😊`,
    `Dah agak lama tak jumpa — nak tempah sesi urut lagi?`,
    `Bawa kawan dan guna kod ${referralCode} untuk diskaun istimewa (tertakluk budi bicara saya ya).`,
  ].join("\n");
}
