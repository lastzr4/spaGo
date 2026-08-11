// Canonical health-declaration (e-consent) text shown to the customer
// before they can submit a booking. This is the single source of truth for
// both the on-screen display and the snapshot stored on the Booking row —
// the server always regenerates the snapshot from this file rather than
// trusting whatever text the client posted, so a customer can't tamper
// with what they're recorded as having agreed to.
export const CONSENT_VERSION = "1.0";

export function buildHealthDeclarationStatements(customerGender: "MALE" | "FEMALE"): string[] {
  const statements = [
    "Saya mengesahkan tiada masalah tulang, sendi, atau kecederaan serius yang menghalang saya daripada menerima urutan.",
    "Saya mengesahkan tiada penyakit kronik (jantung, tekanan darah tinggi/rendah, kencing manis tak terkawal) yang memerlukan kelulusan doktor sebelum urutan.",
  ];
  if (customerGender === "FEMALE") {
    statements.push("Saya mengesahkan saya TIDAK hamil.");
  }
  statements.push("Saya faham risiko am urutan dan bersetuju secara sukarela menjalani sesi ini.");
  return statements;
}

export function buildHealthDeclarationText(customerGender: "MALE" | "FEMALE"): string {
  const statements = buildHealthDeclarationStatements(customerGender);
  return [`Pengisytiharan Kesihatan (v${CONSENT_VERSION})`, ...statements.map((s, i) => `${i + 1}. ${s}`)].join("\n");
}
