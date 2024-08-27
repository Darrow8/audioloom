import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import { User, Pod } from './utils.js';
import dotenv from 'dotenv';

dotenv.config();

let uri = process.env.ATLAS_URI;

export let client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 45000, // 45 seconds
  // TLS settings
  tls: true,
  tlsAllowInvalidCertificates: false, // Change to true only for testing if you're having certificate issues
});

export async function run() {
  console.log("Attempting to connect to MongoDB Atlas");
  try {
    // Connect the client to the server
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB Atlas");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    // Optionally, you might want to rethrow the error or handle it in a way that's appropriate for your application
    throw error;
  }
}

// Graceful shutdown function
export async function closeMongoConnection() {
  try {
    await client.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error closing MongoDB connection:", error);
  }
}

// Implement graceful shutdown
process.on('SIGINT', async () => {
  await closeMongoConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeMongoConnection();
  process.exit(0);
});

export async function createMongoUser(user: User) {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('fullData');
  const collection = db.collection('users');
  await collection.insertOne(user);
  await client.close();
}

export async function getMongoUserByAuth0Id(user_id: string) {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('fullData');
  const collection = db.collection('users');
  const user = await collection.findOne({ user_id: user_id });
  await client.close();
  return user;
}

export async function getMongoUserBy_Id(id: ObjectId) {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('fullData');
  const collection = db.collection('users');
  const user = await collection.findOne({ _id: id });
  await client.close();
  return user;
}
