import { NextRequest, NextResponse } from "next/server";
import { Invoice } from "@/types";
import fs from "fs";
import path from "path";
import {
  isMongoConfigured,
  fetchInvoicesFromMongo,
  saveInvoiceToMongo,
  deleteInvoiceFromMongo,
} from "@/lib/mongodb";

const DATA_FILE = path.join(process.cwd(), "src/data/invoices-live.json");
const TMP_FILE = "/tmp/rse_invoices_live.json";

function loadStoredInvoices(): Invoice[] {
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

function saveInvoices(invoices: Invoice[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(invoices, null, 2), "utf-8");
  } catch (_) {}
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(invoices, null, 2), "utf-8");
  } catch (_) {}
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

// GET /api/invoices -> returns all synchronized invoices from MongoDB Atlas
export async function GET() {
  if (isMongoConfigured()) {
    try {
      const mongoInvoices = await fetchInvoicesFromMongo();
      if (mongoInvoices && Array.isArray(mongoInvoices)) {
        saveInvoices(mongoInvoices);
        return NextResponse.json(
          { invoices: mongoInvoices, count: mongoInvoices.length, source: "mongodb" },
          { headers: CORS_HEADERS }
        );
      }
    } catch (_) {}
  }

  const local = loadStoredInvoices();
  return NextResponse.json(
    { invoices: local, count: local.length, source: "local" },
    { headers: CORS_HEADERS }
  );
}

// POST /api/invoices -> create or update an invoice
export async function POST(req: NextRequest) {
  try {
    const invoice: Invoice = await req.json();
    if (!invoice || !invoice.id || !invoice.invoiceNumber) {
      return NextResponse.json(
        { error: "Invalid invoice data. ID and invoiceNumber required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!invoice.createdAt) {
      invoice.createdAt = new Date().toISOString();
    }
    invoice.updatedAt = new Date().toISOString();

    let savedToMongo = false;
    if (isMongoConfigured()) {
      try {
        savedToMongo = await saveInvoiceToMongo(invoice);
      } catch (_) {}
    }

    const current = loadStoredInvoices();
    const idx = current.findIndex((i) => i.id === invoice.id);
    if (idx >= 0) {
      current[idx] = invoice;
    } else {
      current.unshift(invoice);
    }
    saveInvoices(current);

    return NextResponse.json(
      { success: true, invoice, savedToMongo },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to save invoice" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// DELETE /api/invoices?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400, headers: CORS_HEADERS });
    }

    let deletedFromMongo = false;
    if (isMongoConfigured()) {
      try {
        deletedFromMongo = await deleteInvoiceFromMongo(id);
      } catch (_) {}
    }

    const current = loadStoredInvoices();
    const updated = current.filter((i) => i.id !== id);
    saveInvoices(updated);

    return NextResponse.json(
      { success: true, id, deletedFromMongo },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete invoice" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
