import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { isMongoConfigured, getMongoDb, syncLocalBookingsToMongo } from "@/lib/mongodb";
import { SEED_BOOKINGS } from "@/data/seed";
import { Booking } from "@/types";

const ENV_PATH = path.join(process.cwd(), ".env.local");
const DATA_FILE = path.join(process.cwd(), "src/data/bookings-live.json");

function getLocalBookings(): Booking[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return [...SEED_BOOKINGS];
}

// GET /api/database-config -> Check live DB status
export async function GET() {
  const isConfigured = isMongoConfigured();
  if (!isConfigured) {
    return NextResponse.json({
      configured: false,
      connected: false,
      type: "local_file_sync",
      message: "હાલમાં લોકલ ફાઈલ & 2-Way સર્વર બ્રિજ સક્રિય છે (MongoDB કનેક્ટ કરી શકાય છે)",
    });
  }

  try {
    const db = await getMongoDb();
    if (!db) throw new Error("Database unavailable");
    const count = await db.collection("bookings").countDocuments();
    return NextResponse.json({
      configured: true,
      connected: true,
      type: "mongodb_atlas",
      totalBookingsInCloud: count,
      message: "🟢 MongoDB Atlas ક્લાઉડ ડેટાબેઝ સક્રિય & કનેક્ટેડ છે",
    });
  } catch (err: any) {
    return NextResponse.json({
      configured: true,
      connected: false,
      type: "mongodb_atlas",
      error: err?.message || "કનેક્શન અસફળ",
      message: "⚠️ MongoDB કન્ફિગર કરેલ છે પણ કનેક્શનમાં ક્ષતિ છે",
    });
  }
}

// POST /api/database-config -> Connect new MongoDB URI
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uri } = body;

    if (!uri || typeof uri !== "string" || !uri.startsWith("mongodb")) {
      return NextResponse.json(
        { success: false, error: "અમાન્ય MongoDB URI. તે 'mongodb://' અથવા 'mongodb+srv://' થી શરૂ થવું જોઈએ." },
        { status: 400 }
      );
    }

    // 1. Test connection with 5-second timeout
    const testClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 6000,
    });
    await testClient.connect();
    const testDb = testClient.db("rse_studio");
    await testDb.command({ ping: 1 });

    // 2. Migrate existing local bookings to MongoDB
    const localList = getLocalBookings();
    const collection = testDb.collection("bookings");
    let migratedCount = 0;
    for (const b of localList) {
      if (b.id) {
        await collection.updateOne({ id: b.id }, { $set: b }, { upsert: true });
        migratedCount++;
      }
    }

    await testClient.close();

    // 3. Update .env.local permanently
    process.env.MONGODB_URI = uri;
    let envContent = "";
    if (fs.existsSync(ENV_PATH)) {
      envContent = fs.readFileSync(ENV_PATH, "utf-8");
    }

    if (envContent.includes("MONGODB_URI=")) {
      envContent = envContent.replace(/MONGODB_URI=.*/g, `MONGODB_URI=${uri}`);
    } else {
      envContent = `${envContent.trim()}\nMONGODB_URI=${uri}\n`;
    }
    fs.writeFileSync(ENV_PATH, envContent, "utf-8");

    return NextResponse.json({
      success: true,
      message: `🎉 MongoDB Atlas સફળતાપૂર્વક જોડાયું! ${migratedCount} સ્લોટ્સ ક્લાઉડમાં સિન્ક થયા.`,
      migratedCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: `MongoDB કનેક્શન નિષ્ફળ: ${err?.message || "ચકાસો કે પાસવર્ડ અને IP વ્હાઇટલિસ્ટ (0.0.0.0/0) સાચું છે."}`,
      },
      { status: 500 }
    );
  }
}
