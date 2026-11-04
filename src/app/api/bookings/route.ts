import { NextRequest, NextResponse } from "next/server";
import { SEED_BOOKINGS } from "@/data/seed";
import { Booking } from "@/types";
import { generateBookingCode } from "@/lib/bookingCode";
import fs from "fs";
import path from "path";
import {
  isMongoConfigured,
  fetchBookingsFromMongo,
  saveBookingToMongo,
  deleteBookingFromMongo,
  syncLocalBookingsToMongo,
} from "@/lib/mongodb";

const DATA_FILE = path.join(process.cwd(), "src/data/bookings-live.json");
const TMP_FILE = "/tmp/rse_bookings_live.json";

function loadStoredBookings(): Booking[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (_) {}

  try {
    if (fs.existsSync(TMP_FILE)) {
      const data = fs.readFileSync(TMP_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (_) {}

  saveBookings([...SEED_BOOKINGS]);
  return [...SEED_BOOKINGS];
}

function saveBookings(bookings: Booking[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(bookings, null, 2), "utf-8");
  } catch (_) {}

  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(bookings, null, 2), "utf-8");
  } catch (_) {}
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

const REMOTE_BOOKINGS_URL = "https://book.rsegnr.in/api/bookings";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

// GET /api/bookings -> returns all synchronized bookings with automatic 2-way cloud sync
export async function GET(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const isLocalServer = !host.includes("book.rsegnr.in");

  // 1. If local server, ALWAYS poll remote book.rsegnr.in to pull newly submitted client forms
  let remoteBookings: Booking[] = [];
  if (isLocalServer) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(REMOTE_BOOKINGS_URL, {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data?.bookings && Array.isArray(data.bookings) && data.bookings.length > 0) {
          remoteBookings = data.bookings;
        }
      }
    } catch (_) {
      // Offline fallback: continue with cloud / local data
    }
  }

  // 2. Try MongoDB Atlas if configured
  if (isMongoConfigured()) {
    try {
      let mongoBookings = (await fetchBookingsFromMongo()) || [];

      // Auto-ingest any new bookings discovered on remote live website into MongoDB Atlas
      if (remoteBookings.length > 0) {
        const mongoMap = new Map<string, Booking>();
        for (const b of mongoBookings) {
          if (b.id) mongoMap.set(b.id, b);
        }

        let hasNew = false;
        for (const rb of remoteBookings) {
          if (rb.id && !mongoMap.has(rb.id)) {
            // Ensure format RSE/<MONTH>/<SEQ> and uniqueness
            const existingCodes = new Set(Array.from(mongoMap.values()).map((x) => (x.code || "").toUpperCase()));
            const isInvalidFormat = !rb.code || !/^RSE\/[A-Z]{3}\/\d{3}$/.test(rb.code);
            if (isInvalidFormat || existingCodes.has(rb.code.toUpperCase())) {
              rb.code = generateBookingCode(rb.slotDate || rb.eventDate, Array.from(mongoMap.values()));
            }

            mongoMap.set(rb.id, rb);
            await saveBookingToMongo(rb);
            hasNew = true;
          }
        }

        if (hasNew) {
          mongoBookings = Array.from(mongoMap.values()).sort(
            (a, b) => new Date(a.slotDate || 0).getTime() - new Date(b.slotDate || 0).getTime()
          );
        }
      }

      if (mongoBookings.length > 0) {
        saveBookings(mongoBookings); // Local backup
        return NextResponse.json(
          {
            success: true,
            count: mongoBookings.length,
            bookings: mongoBookings,
            source: "mongodb_atlas",
          },
          { headers: CORS_HEADERS }
        );
      } else if (mongoBookings.length === 0) {
        const local = loadStoredBookings();
        await syncLocalBookingsToMongo(local);
        return NextResponse.json(
          {
            success: true,
            count: local.length,
            bookings: local,
            source: "mongodb_atlas_seeded",
          },
          { headers: CORS_HEADERS }
        );
      }
    } catch (_) {
      // Fallback to local file
    }
  }

  // 3. Fallback: Local file + 2-Way Live Sync with book.rsegnr.in
  let current = loadStoredBookings();
  if (remoteBookings.length > 0) {
    const map = new Map<string, Booking>();
    for (const b of remoteBookings) {
      if (b.id) map.set(b.id, b);
    }
    for (const b of current) {
      if (b.id) {
        const remoteMatch = map.get(b.id);
        map.set(b.id, remoteMatch ? { ...remoteMatch, ...b } : b);
      }
    }
    current = Array.from(map.values()).sort(
      (a, b) => new Date(a.slotDate || 0).getTime() - new Date(b.slotDate || 0).getTime()
    );
    saveBookings(current);
  }

  return NextResponse.json(
    { success: true, count: current.length, bookings: current, source: "live_synced" },
    { headers: CORS_HEADERS }
  );
}

// POST /api/bookings -> creates or syncs a new booking
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = loadStoredBookings();

    // Only match existing by unique id
    const exists = current.find((b) => body.id && b.id === body.id);

    let finalBooking: Booking;
    let updatedList = [...current];

    if (exists) {
      finalBooking = { ...exists, ...body };
      updatedList = updatedList.map((b) =>
        b.id === exists.id ? finalBooking : b
      );
    } else {
      // For a new booking, ensure code is uniquely generated in RSE/<MONTH>/<SEQ> format
      let assignedCode = body.code;
      const isCodeTaken =
        !assignedCode ||
        current.some((b) => b.code.toUpperCase() === String(assignedCode).toUpperCase());
      const isInvalidFormat = !assignedCode || !/^RSE\/[A-Z]{3}\/\d{3}$/.test(assignedCode);

      if (isCodeTaken || isInvalidFormat) {
        assignedCode = generateBookingCode(body.slotDate || body.eventDate, current);
      }

      finalBooking = {
        ...body,
        id: body.id || `b_${Date.now()}`,
        code: assignedCode,
        createdAt: body.createdAt || new Date().toISOString(),
      };
      updatedList = [finalBooking, ...updatedList];
    }

    saveBookings(updatedList);

    // Save to MongoDB if available
    if (isMongoConfigured()) {
      saveBookingToMongo(finalBooking).catch(() => {});
    }

    // Forward to remote live website if local
    const host = req.headers.get("host") || "";
    if (!host.includes("book.rsegnr.in")) {
      fetch(REMOTE_BOOKINGS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalBooking),
      }).catch(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        message: "Booking synchronized successfully",
        booking: finalBooking,
        totalBookings: updatedList.length,
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sync booking" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// DELETE /api/bookings?id=<id> -> deletes a booking by id
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing booking id" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const current = loadStoredBookings();
    const updatedList = current.filter((b) => b.id !== id);
    saveBookings(updatedList);

    if (isMongoConfigured()) {
      deleteBookingFromMongo(id).catch(() => {});
    }

    return NextResponse.json(
      { success: true, message: "Booking deleted successfully", totalBookings: updatedList.length },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete booking" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
