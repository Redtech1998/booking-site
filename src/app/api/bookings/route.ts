import { NextRequest, NextResponse } from "next/server";
import { SEED_BOOKINGS } from "@/data/seed";
import { Booking } from "@/types";
import fs from "fs";
import path from "path";

// In-memory server cache
let serverBookings: Booking[] = [...SEED_BOOKINGS];
const DATA_FILE = path.join(process.cwd(), "src/data/bookings-live.json");
const TMP_FILE = "/tmp/rse_bookings_live.json";

function loadStoredBookings(): Booking[] {
  try {
    // Try persistent data file first
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        serverBookings = parsed;
        return serverBookings;
      }
    }
  } catch (_) {}

  try {
    // Fallback to /tmp for serverless runtime
    if (fs.existsSync(TMP_FILE)) {
      const data = fs.readFileSync(TMP_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        serverBookings = parsed;
        return serverBookings;
      }
    }
  } catch (_) {}

  return serverBookings;
}

function saveBookings(bookings: Booking[]) {
  serverBookings = bookings;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(bookings, null, 2), "utf-8");
  } catch (_) {}

  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(bookings, null, 2), "utf-8");
  } catch (_) {}
}

// Initial load
loadStoredBookings();

// GET /api/bookings -> returns all synchronized bookings
export async function GET() {
  const current = loadStoredBookings();
  return NextResponse.json(
    { success: true, count: current.length, bookings: current },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

// POST /api/bookings -> creates or syncs a new booking (from internal OS or web)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = loadStoredBookings();

    // Check if booking already exists (by id or code)
    const exists = current.find(
      (b) => (body.id && b.id === body.id) || (body.code && b.code === body.code)
    );

    let updatedList = [...current];

    if (exists) {
      // Update existing
      updatedList = updatedList.map((b) =>
        b.id === exists.id ? { ...b, ...body } : b
      );
    } else {
      // Add new booking
      const newBooking: Booking = {
        ...body,
        id: body.id || `b_${Date.now()}`,
        code: body.code || `RSE-${String(current.length + 1).padStart(3, "0")}`,
        createdAt: body.createdAt || new Date().toISOString(),
      };
      updatedList = [newBooking, ...updatedList];
    }

    saveBookings(updatedList);

    return NextResponse.json(
      {
        success: true,
        message: "Booking synchronized successfully",
        booking: body,
        totalBookings: updatedList.length,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sync booking" },
      { status: 500 }
    );
  }
}
