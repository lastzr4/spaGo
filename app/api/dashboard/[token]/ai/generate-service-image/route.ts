import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTherapistByToken } from "@/lib/dashboard";
import { generateServiceImage } from "@/lib/gemini";

// Generates an AI photo for a service/package from its name (+ optional
// description), and saves it directly onto the service if a serviceId is
// given (the therapist can still replace it with a manual upload anytime —
// this never overwrites an existing photo unless they explicitly ask for a
// fresh one). Fails open: a Gemini hiccup just means no photo, never a
// broken request.
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const therapist = await getTherapistByToken(params.token);
  if (!therapist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const { serviceId, name, description, isPackage } = body ?? {};
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  if (serviceId) {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || service.therapistId !== therapist.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const photoUrl = await generateServiceImage({
    serviceName: name,
    description: typeof description === "string" ? description : null,
    isPackage: Boolean(isPackage),
  });

  if (!photoUrl) {
    return NextResponse.json({ error: "GENERATION_FAILED" }, { status: 502 });
  }

  if (serviceId) {
    await prisma.service.update({ where: { id: serviceId }, data: { photoUrl } });
  }

  return NextResponse.json({ photoUrl });
}
