# SpaGo

Mobile spa / urut booking PWA — cari terapis ikut kawasan & jantina, tempah slot, terus ke WhatsApp.

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (responsive, mobile-first)
- Prisma + PostgreSQL
- next-pwa (installable, offline shell)

## Local dev
```bash
cp .env.example .env   # set DATABASE_URL
npm install
npx prisma migrate dev --name init
npm run dev
```

## Deploy (Railway)
1. Attach a PostgreSQL service to this project and set `DATABASE_URL`.
2. Run `npx prisma migrate deploy` (or use Railway's deploy hook) against the production database.
3. Push to `main` — Railway auto-deploys via the connected GitHub repo.

## Flows implemented (MVP / Fasa 1)
- Customer: pick area + gender -> browse matching therapists -> view services & live slot calendar -> book -> redirected to WhatsApp with a pre-filled message to the therapist.
- Therapist: self-register -> get a private dashboard link (`/dashboard/[token]`) -> manage profile, services, availability slots, and view bookings.
- Strict gender-matching safety rule enforced both in the listing filter and at booking time (see `lib/gender.ts`).
