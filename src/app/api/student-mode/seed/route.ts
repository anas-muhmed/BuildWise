import { NextRequest, NextResponse } from "next/server";
import { seedTestData, clearAllData } from "@/lib/student-mode/seed";

export async function POST(req: NextRequest) {
  const { action } = await req.json();

  if (action === "seed") {
    seedTestData();
    return NextResponse.json({ message: "Test data seeded" });
  }

  if (action === "clear") {
    clearAllData();
    return NextResponse.json({ message: "Data cleared" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
