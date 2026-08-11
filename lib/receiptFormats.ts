// Reference guide of known Malaysian bank/e-wallet payment-receipt
// conventions — fed into the AI verification prompt (lib/anthropic.ts) so
// it can compare an uploaded receipt against real, known formats instead of
// reasoning generically. Malaysia has a small, well-known set of banks and
// e-wallets, so a compact static reference like this covers the vast
// majority of receipts a therapist will ever receive.
//
// This is general public knowledge about each app's UI conventions (brand
// colours, terminology, typical field layout) — not proprietary data, and
// deliberately kept as plain text rather than real screenshots (using an
// actual customer's bank receipt as a reference image would be a privacy
// problem; a written description is not).
//
// Code-based by design (not DB-backed): these formats change rarely, and a
// static file is simpler to reason about and ship than an admin-editable
// table for something this stable.
export const RECEIPT_FORMAT_REFERENCE = `
Panduan format resit/bukti pemindahan bank & e-wallet popular di Malaysia:

BANK (perbankan internet/app rasmi):
- Maybank2u / MAE: tema kuning & hitam, logo harimau Maybank. Skrin kejayaan biasa ada "Transaction Successful" atau "Berjaya", nombor rujukan bermula huruf+nombor, nama penerima & 4 digit terakhir akaun sahaja dipaparkan (baki digit disamarkan dengan *).
- CIMB Clicks / OCTO by CIMB: tema merah CIMB, logo CIMB merah. Terma "Successful"/"Transaction Completed", ada "Reference No" dan "Recipient Reference" berasingan.
- Public Bank (PBe / PB engage): tema merah maroon, logo burung Public Bank. Ada "Transaction Reference Number" panjang, status "Successful".
- RHB (RHB Now / RHB Reflex): tema biru RHB. Terma "Transaction Successful", ada "Trace Number".
- Hong Leong Connect: tema merah Hong Leong, logo HL. Terma "Successful", "Transaction ID".
- Bank Islam (Be U / GO by BIMB): tema hijau/biru, terma "Berjaya"/"Successful", selaras prinsip syariah dalam sesetengah wording.
- AmBank AmOnline: tema merah/oren AmBank.
- Semua bank di atas biasanya papar: nama penerima (atau nombor akaun bertopeng), jumlah (RM), tarikh & masa transaksi, status jelas ("Successful"/"Berjaya"/"Completed"), dan nombor rujukan unik. Resit yang TIADA nombor rujukan/tarikh-masa langsung, atau status kosong/tiada, adalah tanda mencurigakan.

DUITNOW QR (merentasi bank — QR generik yang boleh diimbas dari mana-mana bank/e-wallet):
- Skrin kejayaan DuitNow biasanya bertema biru/ungu gradient dengan logo "DuitNow", papar nama penerima, jumlah, dan "Successful"/"Payment Successful", serta rujukan transaksi.

E-WALLET:
- Touch 'n Go eWallet: tema biru TNG, logo burung TNG. Terma "Successful", papar baki eWallet selepas transaksi, nombor rujukan transaksi.
- GrabPay: tema hijau Grab. Terma "Successful"/"Payment Successful".
- Boost: tema oren/merah Boost. Terma "Successful".
- ShopeePay: tema oren Shopee. Terma "Payment Successful".

TANDA-TANDA MENCURIGAKAN UMUM (tidak kira platform):
- Font/saiz teks tidak konsisten dalam satu skrin (tanda tampal/edit).
- Logo/warna tema tidak sepadan dengan bank/e-wallet yang didakwa (cth: papar logo Maybank tapi warna/susunan macam CIMB).
- Status menunjukkan "Pending", "Processing", "Failed", atau "Unsuccessful" — bukan kejayaan sebenar.
- Tiada nombor rujukan/ID transaksi langsung, atau formatnya tidak kena dengan corak biasa bank berkenaan.
- Tarikh/masa tidak munasabah (jauh lampau, masa depan, atau tidak sepadan dengan "baru sahaja bayar").
- Jumlah RM tidak sepadan dengan jumlah deposit yang dijangka.
- Resolusi/kualiti imej kelihatan seperti tangkapan skrin dari tangkapan skrin lain (kabur, artifak mampatan berlebihan) berbanding tangkapan skrin asli aplikasi bank yang biasanya tajam.
`.trim();
