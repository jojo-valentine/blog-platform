// config/db.ts
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    let uri;
    if (process.env.NODE_ENV === "test") {
      uri = process.env.MONGO_URI_TEST || process.env.MONGODB_URI;
    } else if (process.env.NODE_ENV === "production") {
      uri = process.env.MONGO_URI_PROD;
    } else {
      uri = process.env.MONGO_URI_DEV;
    }

    await mongoose.connect(uri as string);
    console.log(`✅ MongoDB connected: ${process.env.NODE_ENV}`);
  } catch (err) {
    console.error("❌ Failed to connect:", err);
    process.exit(1);
  }
};

export default connectDB;