import { NextRequest, NextResponse } from "next/server";
import { Client } from "@/types";
import { SEED_CLIENTS } from "@/data/seed";
import fs from "fs";
import path from "path";
import {
  isMongoConfigured,
  fetchClientsFromMongo,
  saveClientToMongo,
} from "@/lib/mongodb";

const DATA_FILE = path.join(process.cwd(), "src/data/clients-live.json");
const TMP_FILE = "/tmp/rse_clients_live.json";

function loadStoredClients(): Client[] {
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

  return [...SEED_CLIENTS];
}

function saveClients(clientsList: Client[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(clientsList, null, 2), "utf-8");
  } catch (_) {}
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(clientsList, null, 2), "utf-8");
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

// GET /api/clients -> returns all permanent client records from MongoDB Atlas
export async function GET() {
  if (isMongoConfigured()) {
    try {
      const mongoClients = await fetchClientsFromMongo();
      if (mongoClients && Array.isArray(mongoClients) && mongoClients.length > 0) {
        saveClients(mongoClients);
        return NextResponse.json(
          { clients: mongoClients, count: mongoClients.length, source: "mongodb" },
          { headers: CORS_HEADERS }
        );
      }
    } catch (_) {}
  }

  const local = loadStoredClients();
  return NextResponse.json(
    { clients: local, count: local.length, source: "local" },
    { headers: CORS_HEADERS }
  );
}

// POST /api/clients -> add or update permanent client record
export async function POST(req: NextRequest) {
  try {
    const client: Client = await req.json();
    if (!client || !client.id || !client.contactPerson) {
      return NextResponse.json(
        { error: "Invalid client data. ID and contactPerson required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    let savedToMongo = false;
    if (isMongoConfigured()) {
      try {
        savedToMongo = await saveClientToMongo(client);
      } catch (_) {}
    }

    const current = loadStoredClients();
    const idx = current.findIndex((c) => c.id === client.id);
    if (idx >= 0) {
      current[idx] = client;
    } else {
      current.push(client);
    }
    saveClients(current);

    return NextResponse.json(
      { success: true, client, savedToMongo },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to save client" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
