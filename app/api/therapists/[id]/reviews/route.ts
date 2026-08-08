import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { askClaude } from "@/lib/anthropic";

// Light AI moderation — fails open (never blocks/hides on error, only on an explicit FLAG).
async function isFlaggedByAi(comment: string): Promise<boolean> {
  const result = await askClaude({
    system: [
      "Anda menyemak ulasan pelanggan untuk perkhidmatan urut/spa mudah alih di Malaysia.",
      "Balas HANYA dengan satu perkataan: FLAG jika ulasan mengandungi bahasa lucah teruk, ugutan, kandungan seksual eksplisit, ujaran kebencian, spam/iklan tidak berkaitan, atau maklumat peribadi sensitif (nombor telefon/alamat orang lain).",
      "Balas OK jika ulasan adalah maklum balas perkhidmatan biasa, walaupun negatif atau mengkritik.",
      "Jangan tambah apa-apa penjelasan lain.",
    ].join("\n"),
    prompt: comment,
    maxTokens: 5,
  });
  return result?.trim().toUpperCase().startsWith("FLAG") ?? false;
}

// GET /api/therapists/:id/reviews - public, visible reviews only
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const reviews = await prisma.review.findMany({
    where: { therapistId: params.id, hidden: false },
    orderBy: { createdAt: "desc" },
  });

  const count = reviews.length;
  const average = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : null;

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      customerName: r.customerName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
    average,
    count,
  });
}

// POST /api/therapists/:id/reviews - public submission
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const therapist = await prisma.therapist.findUnique({ where: { id: params.id } });
  if (!therapist || !therapist.active) {
    return NextResponse.json({ error: "Therapist not found" }, { status: 404 });
  }

  const body = await req.json();
  const { customerName, rating, comment } = body ?? {};

  if (!customerName || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "customerName and rating (1-5) required" }, { status: 400 });
  }

  const trimmedComment = comment ? String(comment).slice(0, 500) : null;
  const flagged = trimmedComment ? await isFlaggedByAi(trimmedComment) : false;

  const review = await prisma.review.create({
    data: {
      therapistId: params.id,
      customerName: String(customerName).slice(0, 80),
      rating: Math.round(rating),
      comment: trimmedComment,
      hidden: flagged,
      aiFlagged: flagged,
    },
  });

  return NextResponse.json({ review }, { status: 201 });
}
