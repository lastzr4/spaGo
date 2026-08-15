import { prisma } from "@/lib/prisma";

export async function getTherapistByToken(token: string) {
  return prisma.therapist.findUnique({ where: { dashboardToken: token } });
}
