import { NextRequest, NextResponse } from "next/server";
import { StaffMember } from "@/types";
import { STAFF as SEED_STAFF } from "@/data/seed";
import fs from "fs";
import path from "path";
import {
  isMongoConfigured,
  fetchStaffFromMongo,
  saveStaffMemberToMongo,
  syncAllStaffToMongo,
} from "@/lib/mongodb";

const DATA_FILE = path.join(process.cwd(), "src/data/staff-live.json");
const TMP_FILE = "/tmp/rse_staff_live.json";

function loadStoredStaff(): StaffMember[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}

  try {
    if (fs.existsSync(TMP_FILE)) {
      const data = fs.readFileSync(TMP_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}

  return [...SEED_STAFF];
}

function saveStaff(staffList: StaffMember[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(staffList, null, 2), "utf-8");
  } catch (_) {}
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(staffList, null, 2), "utf-8");
  } catch (_) {}
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

// GET /api/staff -> returns all staff members with salaries from MongoDB Atlas
export async function GET() {
  if (isMongoConfigured()) {
    try {
      let mongoStaff = await fetchStaffFromMongo();
      if (!mongoStaff || mongoStaff.length === 0) {
        // Seed initial official team into MongoDB Atlas
        await syncAllStaffToMongo(SEED_STAFF);
        mongoStaff = SEED_STAFF;
      }
      if (mongoStaff && Array.isArray(mongoStaff) && mongoStaff.length > 0) {
        saveStaff(mongoStaff);
        return NextResponse.json(
          { staff: mongoStaff, count: mongoStaff.length, source: "mongodb" },
          { headers: CORS_HEADERS }
        );
      }
    } catch (_) {}
  }

  const local = loadStoredStaff();
  return NextResponse.json(
    { staff: local, count: local.length, source: "local" },
    { headers: CORS_HEADERS }
  );
}

// POST /api/staff -> update staff member, salary, or add new staff
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Support either single member or bulk array
    if (Array.isArray(body)) {
      let savedToMongo = false;
      if (isMongoConfigured()) {
        try {
          savedToMongo = await syncAllStaffToMongo(body);
        } catch (_) {}
      }
      saveStaff(body);
      return NextResponse.json({ success: true, count: body.length, savedToMongo }, { headers: CORS_HEADERS });
    }

    const member: StaffMember = body;
    if (!member || !member.id || !member.name) {
      return NextResponse.json(
        { error: "Invalid staff member. ID and name required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    let savedToMongo = false;
    if (isMongoConfigured()) {
      try {
        savedToMongo = await saveStaffMemberToMongo(member);
      } catch (_) {}
    }

    const current = loadStoredStaff();
    const idx = current.findIndex((s) => s.id === member.id);
    if (idx >= 0) {
      current[idx] = member;
    } else {
      current.push(member);
    }
    saveStaff(current);

    return NextResponse.json(
      { success: true, member, savedToMongo },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to save staff member" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
