import { NextRequest, NextResponse } from "next/server";
import { AttendanceRecord } from "@/types";
import fs from "fs";
import path from "path";
import {
  isMongoConfigured,
  fetchAttendanceFromMongo,
  saveAttendanceRecordToMongo,
} from "@/lib/mongodb";

const DATA_FILE = path.join(process.cwd(), "src/data/attendance-live.json");
const TMP_FILE = "/tmp/rse_attendance_live.json";

function loadStoredAttendance(): AttendanceRecord[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}

  try {
    if (fs.existsSync(TMP_FILE)) {
      const data = fs.readFileSync(TMP_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}

  return [];
}

function saveAttendance(records: AttendanceRecord[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (_) {}
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (_) {}
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function GET() {
  if (isMongoConfigured()) {
    try {
      const mongoAttendance = await fetchAttendanceFromMongo();
      if (mongoAttendance) {
        saveAttendance(mongoAttendance);
        return NextResponse.json(
          { attendance: mongoAttendance, count: mongoAttendance.length, source: "mongodb" },
          { headers: CORS_HEADERS }
        );
      }
    } catch (_) {}
  }

  const local = loadStoredAttendance();
  return NextResponse.json(
    { attendance: local, count: local.length, source: "local" },
    { headers: CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  try {
    const record: AttendanceRecord = await req.json();
    if (!record || !record.id || !record.staffId) {
      return NextResponse.json({ error: "Invalid attendance record" }, { status: 400, headers: CORS_HEADERS });
    }

    let savedToMongo = false;
    if (isMongoConfigured()) {
      try {
        savedToMongo = await saveAttendanceRecordToMongo(record);
      } catch (_) {}
    }

    const current = loadStoredAttendance();
    const idx = current.findIndex((a) => a.id === record.id);
    if (idx >= 0) current[idx] = record;
    else current.unshift(record);
    saveAttendance(current);

    return NextResponse.json(
      { success: true, record, savedToMongo },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to save attendance" }, { status: 500, headers: CORS_HEADERS });
  }
}
