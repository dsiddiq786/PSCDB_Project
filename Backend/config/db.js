import mongoose from "mongoose";

let memoryServer = null;

/* Connects to MongoDB. In development, when MONGODB_URI is not set, an
   in-memory database is started so the app can run without a local install.
   Production always requires MONGODB_URI. */
export default async function connectDB() {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("MONGODB_URI is required in production.");
    }
    const { MongoMemoryReplSet } = await import("mongodb-memory-server");
    memoryServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    uri = memoryServer.getUri("pscdb");
    console.log("Using in-memory MongoDB for development. Data resets on restart.");
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
