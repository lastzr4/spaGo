import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/adminAuth";
import { seedDemoData, deleteDemoData } from "@/lib/demoSeed";

export async function POST() {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const result = await seedDemoData();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[seed-demo] Failed:", err);
    return NextResponse.json({ error: "SEED_FAILED" }, { status: 500 });
  }
}

export async function DELETE() {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const result = await deleteDemoData();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[seed-demo] Delete failed:", err);
    return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
  }
}
