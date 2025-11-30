import { MongoClient } from "mongodb";
import { configDotenv } from "dotenv";

configDotenv();

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.ugpmzsn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri);
let db;

export const connectToDatabase = async () => {
  try {
    await client.connect();
    db = client.db("artizans-mart");
    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.error("Could not connect to the database", error);
    process.exit(1);
  }
};

export const getDb = () => {
  if (!db) {
    throw new Error("Database not initialized. Call connectToDatabase first.");
  }
  return db;
};