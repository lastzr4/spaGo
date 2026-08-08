// National area list, grouped by state/federal territory, so coverage-area
// pickers can group ~100+ towns instead of showing one giant flat wall.
//
// Important: the original 15 Klang Valley entries (Bangi, Kajang, Shah Alam,
// Petaling Jaya, Subang Jaya, Puchong, Cheras, Ampang, Kepong, Setapak,
// Cyberjaya, Putrajaya, Klang, Rawang, Kuala Lumpur) are kept byte-for-byte
// identical to before — existing therapists already have these exact strings
// saved in their `coverageAreas` array in the database, and search matching
// (`coverageAreas: { has: area }`) is exact-string. Renaming or removing any
// of them would silently break existing therapists' search visibility.
export const AREAS_BY_STATE: Record<string, string[]> = {
  Selangor: [
    "Shah Alam",
    "Petaling Jaya",
    "Subang Jaya",
    "Puchong",
    "Klang",
    "Kajang",
    "Bangi",
    "Rawang",
    "Cyberjaya",
    "Sepang",
    "Kuala Selangor",
    "Semenyih",
  ],
  "Kuala Lumpur": [
    "Kuala Lumpur",
    "Cheras",
    "Ampang",
    "Kepong",
    "Setapak",
    "Wangsa Maju",
    "Bukit Bintang",
    "Bangsar",
    "Sentul",
  ],
  Putrajaya: ["Putrajaya"],
  Johor: [
    "Johor Bahru",
    "Iskandar Puteri",
    "Skudai",
    "Kulai",
    "Batu Pahat",
    "Muar",
    "Kluang",
    "Segamat",
    "Pontian",
  ],
  Kedah: [
    "Alor Setar",
    "Sungai Petani",
    "Kulim",
    "Jitra",
    "Langkawi",
    "Baling",
    "Pendang",
  ],
  Kelantan: ["Kota Bharu", "Pasir Mas", "Tanah Merah", "Gua Musang", "Tumpat"],
  Melaka: ["Melaka Bandaraya", "Ayer Keroh", "Alor Gajah", "Jasin"],
  "Negeri Sembilan": ["Seremban", "Nilai", "Port Dickson", "Bahau", "Kuala Pilah"],
  Pahang: ["Kuantan", "Temerloh", "Bentong", "Raub", "Cameron Highlands", "Jerantut"],
  Perak: ["Ipoh", "Taiping", "Teluk Intan", "Sitiawan", "Kampar", "Batu Gajah", "Lumut"],
  Perlis: ["Kangar", "Arau", "Padang Besar"],
  "Pulau Pinang": ["George Town", "Bayan Lepas", "Bukit Mertajam", "Butterworth", "Nibong Tebal"],
  Sabah: ["Kota Kinabalu", "Sandakan", "Tawau", "Lahad Datu", "Keningau", "Papar"],
  Sarawak: ["Kuching", "Miri", "Sibu", "Bintulu", "Limbang"],
  Terengganu: ["Kuala Terengganu", "Kemaman", "Dungun", "Marang"],
  Labuan: ["Labuan"],
};

export const STATES = Object.keys(AREAS_BY_STATE);

// Flat list — kept for existing code that just needs "all valid area
// strings" (e.g. exact-match search filtering) without caring about grouping.
export const AREAS = Object.values(AREAS_BY_STATE).flat();

export type Area = (typeof AREAS)[number];
