import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/slug";
import { hashPin } from "@/lib/pin";

type Gender = "MALE" | "FEMALE";
type ClientGenderPolicy = "FEMALE_ONLY" | "MALE_ONLY" | "BOTH";

type DemoServiceTemplate = { name: string; durationMinutes: number; priceRange: [number, number] };

const SERVICE_POOL: DemoServiceTemplate[] = [
  { name: "Urut Badan Tradisional", durationMinutes: 60, priceRange: [80, 100] },
  { name: "Urut Kaki & Refleksologi", durationMinutes: 45, priceRange: [55, 70] },
  { name: "Urut Ibu Mengandung", durationMinutes: 60, priceRange: [100, 120] },
  { name: "Lymphatic Drainage", durationMinutes: 75, priceRange: [130, 160] },
  { name: "Urut Sukan (Deep Tissue)", durationMinutes: 60, priceRange: [110, 140] },
  { name: "Aromaterapi Relaxation", durationMinutes: 90, priceRange: [150, 180] },
];

const BIO_POOL = [
  "Berpengalaman 5 tahun dalam urutan tradisional & refleksologi. Sabar dan mesra pelanggan.",
  "Pakar urut ibu mengandung dan lymphatic drainage. Selesa datang ke rumah anda.",
  "Terapis bertauliah, fokus pada urutan sukan dan pemulihan otot.",
  "Urutan lembut dan menenangkan, sesuai untuk yang pertama kali cuba.",
  "10 tahun pengalaman, mahir pelbagai teknik urutan tradisional Melayu.",
  "Fokus kepada keselesaan pelanggan, sentiasa tepat masa dan profesional.",
  "Menyediakan servis urut mobile ke rumah, pejabat atau hotel.",
  "Terapis wanita bertauliah SPA Malaysia, sijil kesihatan lengkap.",
  "Suka membantu pelanggan yang penat bekerja untuk relaks sepenuhnya.",
  "Pengalaman luas dengan pelanggan warga emas dan ibu mengandung.",
];

const REVIEW_COMMENTS = [
  "Sangat profesional dan tepat masa. Urutan sangat berkesan!",
  "Terapis peramah, teknik bagus. Akan book lagi.",
  "Okay je, boleh improve sikit dari segi ketepatan masa.",
  "Best sangat! Badan terus rasa ringan lepas urut.",
  "Servis memuaskan, harga berpatutan.",
  "Sangat berpengalaman, urut ikut keperluan badan saya.",
  "Bilik... eh maksud saya rumah saya sendiri, servis mobile sangat senang.",
  "Akan recommend kepada kawan-kawan saya.",
  "Lambat sikit sampai tapi urutan tetap best.",
  null,
];

const REVIEWER_NAMES = [
  "Aisyah", "Wan Farid", "Chong Mei Ling", "Ravi Kumar", "Nurul Izzati",
  "Tan Wei Jie", "Hafiz Osman", "Puteri Sofea", "Alia Hana", "Danial Haqim",
];

const SLOT_TIMES = ["09:00", "11:00", "14:00", "16:00", "19:00"];

type DemoTherapistTemplate = {
  name: string;
  gender: Gender;
  clientGenderPolicy: ClientGenderPolicy;
  areas: [string, string];
  reviewCount: number;
};

const THERAPIST_POOL: DemoTherapistTemplate[] = [
  { name: "Aina Zulkifli", gender: "FEMALE", clientGenderPolicy: "FEMALE_ONLY", areas: ["Shah Alam", "Petaling Jaya"], reviewCount: 4 },
  { name: "Farah Adila", gender: "FEMALE", clientGenderPolicy: "FEMALE_ONLY", areas: ["Bangi", "Kajang"], reviewCount: 0 },
  { name: "Siti Nurhaliza", gender: "FEMALE", clientGenderPolicy: "BOTH", areas: ["Puchong", "Subang Jaya"], reviewCount: 5 },
  { name: "Amirul Hakim", gender: "MALE", clientGenderPolicy: "MALE_ONLY", areas: ["Cheras", "Kuala Lumpur"], reviewCount: 3 },
  { name: "Danish Iskandar", gender: "MALE", clientGenderPolicy: "MALE_ONLY", areas: ["Ampang", "Setapak"], reviewCount: 0 },
  { name: "Nadia Rahman", gender: "FEMALE", clientGenderPolicy: "FEMALE_ONLY", areas: ["Klang", "Shah Alam"], reviewCount: 2 },
  { name: "Haziq Rosli", gender: "MALE", clientGenderPolicy: "BOTH", areas: ["Cyberjaya", "Putrajaya"], reviewCount: 3 },
  { name: "Mira Syafiqah", gender: "FEMALE", clientGenderPolicy: "FEMALE_ONLY", areas: ["Kepong", "Kuala Lumpur"], reviewCount: 0 },
  { name: "Firdaus Azman", gender: "MALE", clientGenderPolicy: "MALE_ONLY", areas: ["Rawang", "Kepong"], reviewCount: 4 },
  { name: "Elisya Batrisyia", gender: "FEMALE", clientGenderPolicy: "BOTH", areas: ["Kajang", "Bangi"], reviewCount: 2 },
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function usernameFromName(name: string): string {
  return `demo_${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}`.slice(0, 20);
}

function profilePhotoUrl(gender: Gender, seed: number): string {
  return `https://xsgames.co/randomusers/avatar.php?g=${gender === "MALE" ? "male" : "female"}&key=${seed}`;
}

function servicePhotoUrl(seed: string): string {
  return `https://picsum.photos/seed/${seed}/400/300`;
}

export async function seedDemoData() {
  const demoPinHash = hashPin("1234");
  const created: string[] = [];

  for (let i = 0; i < THERAPIST_POOL.length; i++) {
    const t = THERAPIST_POOL[i];
    const slug = await generateUniqueSlug(t.name);
    const username = usernameFromName(t.name) + (i > 0 ? `${i}` : "");

    const serviceCount = randInt(2, 3);
    const services = Array.from({ length: serviceCount }).map((_, idx) => {
      const tmpl = pick(SERVICE_POOL, i + idx);
      const [min, max] = tmpl.priceRange;
      return {
        name: tmpl.name,
        durationMinutes: tmpl.durationMinutes,
        price: randInt(min, max),
        active: true,
        photoUrl: servicePhotoUrl(`spago-${slug}-${idx}`),
      };
    });

    const slotDates: { date: Date; startTime: string; endTime: string }[] = [];
    for (let d = 1; d <= 7; d += 2) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      date.setHours(0, 0, 0, 0);
      const startTime = pick(SLOT_TIMES, i + d);
      const [h] = startTime.split(":").map(Number);
      const endTime = `${String(h + 1).padStart(2, "0")}:00`;
      slotDates.push({ date, startTime, endTime });
    }

    const therapist = await prisma.therapist.create({
      data: {
        name: t.name,
        phone: `01${randInt(10, 79)}${randInt(1000000, 9999999)}`,
        gender: t.gender,
        slug,
        username,
        pinHash: demoPinHash,
        clientGenderPolicy: t.clientGenderPolicy,
        coverageAreas: t.areas,
        bio: pick(BIO_POOL, i),
        photoUrl: profilePhotoUrl(t.gender, i),
        isDemo: true,
        services: { create: services },
        slots: { create: slotDates },
      },
    });
    created.push(therapist.id);

    for (let r = 0; r < t.reviewCount; r++) {
      const rating = r === t.reviewCount - 1 && t.reviewCount > 2 ? 3 : randInt(4, 5);
      await prisma.review.create({
        data: {
          therapistId: therapist.id,
          customerName: pick(REVIEWER_NAMES, i + r),
          rating,
          comment: pick(REVIEW_COMMENTS, i * 3 + r),
          hidden: r === 0 && t.reviewCount >= 4, // demonstrate moderation on one therapist
        },
      });
    }
  }

  return { createdCount: created.length };
}

export async function deleteDemoData() {
  const result = await prisma.therapist.deleteMany({ where: { isDemo: true } });
  return { deletedCount: result.count };
}
