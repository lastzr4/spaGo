export function buildWhatsAppBookingMessage(params: {
  customerName: string;
  serviceName: string;
  durationMinutes: number;
  date: string;
  startTime: string;
  address: string;
  depositInfo?: string;
  extraChargesNote?: string;
}) {
  const { customerName, serviceName, durationMinutes, date, startTime, address, depositInfo, extraChargesNote } = params;
  const lines = [
    `Salam SpaGo! Tempahan Baru daripada ${customerName}.`,
    `Servis: ${serviceName} (${durationMinutes} min).`,
    `Tarikh: ${date}, ${startTime}.`,
    `Alamat: ${address}.`,
  ];
  if (depositInfo) lines.push(`Deposit: ${depositInfo}.`);
  if (extraChargesNote) lines.push(`Caj tambahan: ${extraChargesNote}.`);
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
