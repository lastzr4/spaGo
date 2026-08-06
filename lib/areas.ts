// MVP area list for Klang Valley. Extend as coverage grows.
export const AREAS = [
  "Bangi",
  "Kajang",
  "Shah Alam",
  "Petaling Jaya",
  "Subang Jaya",
  "Puchong",
  "Cheras",
  "Ampang",
  "Kepong",
  "Setapak",
  "Cyberjaya",
  "Putrajaya",
  "Klang",
  "Rawang",
  "Kuala Lumpur",
] as const;

export type Area = (typeof AREAS)[number];
