const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

const uri = "mongodb+srv://hello_db_user:eHLAlnmRk566RQ8l@cluster0.iapkt4g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function clearAllDummyBookings() {
  console.log("Starting database cleanup...");

  // 1. Clear MongoDB Atlas collection
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("rse_studio");
    const res = await db.collection("bookings").deleteMany({});
    console.log(`Deleted ${res.deletedCount} dummy bookings from MongoDB Atlas.`);
  } catch (err) {
    console.error("Atlas error:", err);
  } finally {
    await client.close();
  }

  // 2. Clear local JSON files
  const dataFile = path.join(__dirname, "../src/data/bookings-live.json");
  const tmpFile = "/tmp/rse_bookings_live.json";

  try {
    fs.writeFileSync(dataFile, JSON.stringify([], null, 2), "utf-8");
    console.log("Cleaned src/data/bookings-live.json -> []");
  } catch (e) {
    console.error(e);
  }

  try {
    if (fs.existsSync(tmpFile)) {
      fs.writeFileSync(tmpFile, JSON.stringify([], null, 2), "utf-8");
      console.log("Cleaned /tmp/rse_bookings_live.json -> []");
    }
  } catch (e) {}

  console.log("All dummy bookings completely purged. Ready for original bookings!");
}

clearAllDummyBookings();
