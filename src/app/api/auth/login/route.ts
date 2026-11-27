import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { STAFF as SEED_STAFF } from "@/data/seed";
import { fetchStaffFromMongo, isMongoConfigured, syncAllStaffToMongo } from "@/lib/mongodb";
import { StaffMember } from "@/types";

export const dynamic = "force-dynamic";

const DATA_FILE = path.join(process.cwd(), "src", "data", "staff-live.json");
const TMP_FILE = "/tmp/rse_staff_live.json";

function readLocalStaffFallback(): StaffMember[] {
  for (const file of [TMP_FILE, DATA_FILE]) {
    try {
      if (fs.existsSync(file)) {
        const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore invalid JSON fallback
    }
  }
  return SEED_STAFF;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawEmail = typeof body?.email === "string" ? body.email : "";
    const rawPassword = typeof body?.password === "string" ? body.password : "";

    const cleanEmail = rawEmail.trim().toLowerCase();
    if (!cleanEmail || !rawPassword) {
      return NextResponse.json(
        { success: false, error: "⚠️ કૃપા કરીને ઈમેઈલ અને પાસવર્ડ બંને દાખલ કરો." },
        { status: 400 }
      );
    }

    let staffList: StaffMember[] | null = null;
    if (isMongoConfigured()) {
      staffList = await fetchStaffFromMongo();
      if (staffList && staffList.length === 0) {
        await syncAllStaffToMongo(SEED_STAFF);
        staffList = SEED_STAFF;
      }
    }

    if (!staffList || staffList.length === 0) {
      staffList = readLocalStaffFallback();
    }

    const found = staffList.find(
      (s) =>
        s.email.trim().toLowerCase() === cleanEmail &&
        (s.password === rawPassword || s.password === rawPassword.trim())
    );

    if (!found) {
      return NextResponse.json(
        { success: false, error: "ઈમેઈલ અથવા પાસવર્ડ ખોટો છે." },
        { status: 401 }
      );
    }

    if (!found.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "તમારું ખાતું બંધ (Deactivated) કરેલ છે. એડમિનનો સંપર્ક કરો.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: found,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `લોગિન સર્વર એરર: ${String(error)}` },
      { status: 500 }
    );
  }
}
