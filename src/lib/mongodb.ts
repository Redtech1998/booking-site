import { MongoClient, Db } from "mongodb";
import { Booking } from "@/types";

const uri = process.env.MONGODB_URI || "";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function isMongoConfigured(): boolean {
  return !!process.env.MONGODB_URI && process.env.MONGODB_URI.startsWith("mongodb");
}

export async function getMongoClient(): Promise<MongoClient | null> {
  const currentUri = process.env.MONGODB_URI;
  if (!currentUri || !currentUri.startsWith("mongodb")) return null;

  try {
    if (process.env.NODE_ENV === "development") {
      if (!global._mongoClientPromise) {
        client = new MongoClient(currentUri, {
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
        });
        global._mongoClientPromise = client.connect();
      }
      return await global._mongoClientPromise;
    } else {
      if (!clientPromise) {
        client = new MongoClient(currentUri, {
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
        });
        clientPromise = client.connect();
      }
      const c = await clientPromise;
      return c;
    }
  } catch (err) {
    client = null;
    clientPromise = null;
    if (typeof global !== "undefined" && global._mongoClientPromise) {
      global._mongoClientPromise = undefined;
    }
    console.warn("MongoDB connection failed, falling back to local storage:", err);
    return null;
  }
}

export async function getMongoDb(dbName = "rse_studio"): Promise<Db | null> {
  const c = await getMongoClient();
  if (!c) return null;
  return c.db(dbName);
}

export async function fetchBookingsFromMongo(): Promise<Booking[] | null> {
  try {
    const db = await getMongoDb();
    if (!db) return null;
    const collection = db.collection<Booking>("bookings");
    const docs = await collection
      .find({})
      .sort({ slotDate: 1 })
      .toArray();

    // Strip MongoDB _id before returning
    return docs.map(({ _id, ...rest }: any) => rest as Booking);
  } catch (err) {
    console.warn("Error reading bookings from MongoDB:", err);
    return null;
  }
}

export async function saveBookingToMongo(booking: Booking): Promise<boolean> {
  try {
    const db = await getMongoDb();
    if (!db) return false;
    const collection = db.collection("bookings");
    await collection.updateOne(
      { id: booking.id },
      { $set: booking },
      { upsert: true }
    );
    return true;
  } catch (err) {
    console.warn("Error saving booking to MongoDB:", err);
    return false;
  }
}

export async function deleteBookingFromMongo(id: string): Promise<boolean> {
  try {
    const db = await getMongoDb();
    if (!db) return false;
    const collection = db.collection("bookings");
    await collection.deleteOne({ id });
    return true;
  } catch (err) {
    console.warn("Error deleting booking from MongoDB:", err);
    return false;
  }
}

export async function syncLocalBookingsToMongo(localList: Booking[]): Promise<number> {
  try {
    const db = await getMongoDb();
    if (!db) return 0;
    const collection = db.collection("bookings");
    let count = 0;
    for (const b of localList) {
      if (b.id) {
        await collection.updateOne(
          { id: b.id },
          { $set: b },
          { upsert: true }
        );
        count++;
      }
    }
    return count;
  } catch (err) {
    console.warn("Failed to bulk sync to MongoDB:", err);
    return 0;
  }
}
