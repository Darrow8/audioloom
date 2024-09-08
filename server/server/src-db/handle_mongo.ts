import { MongoClient, ServerApiVersion, ObjectId, Db } from "mongodb";
import { User, Pod } from './utils.js';



export let client : MongoClient = undefined
export let uri:string = undefined;
export let db: Db = undefined;

export async function run() {
  uri = process.env.ATLAS_URI;
  client = new MongoClient(uri, {
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
  try {
    // Connect the client to the server
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    db = client.db('fullData');
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

export async function createMongoData(collectionName: string, data: any) {
  try {
    const collection = db.collection(collectionName);
    const result = await collection.insertOne(data);
    console.log(`Successfully inserted document with _id: ${result.insertedId}`);
    return result;
  } catch (error) {
    console.error(`Error creating data in ${collectionName}:`, error);
    throw error;
  }
}

export async function getMongoDataById(collectionName: string, id: ObjectId) {
  try {
    const collection = db.collection(collectionName);
    const data = await collection.findOne({ _id: id });
    if (!data) {
      console.log(`No document found with _id: ${id} in ${collectionName}`);
    }
    return data;
  } catch (error) {
    console.error(`Error getting data from ${collectionName}:`, error);
    throw error;
  }
}

export async function updateMongoData(collectionName: string, data: any) {
  try {
    const collection = db.collection(collectionName);
    const result = await collection.updateOne({ _id: data._id }, { $set: data });
    if (result.matchedCount === 0) {
      console.log(`No document found with _id: ${data._id} in ${collectionName}`);
    } else {
      console.log(`Successfully updated document with _id: ${data._id}`);
    }
    return result;
  } catch (error) {
    console.error(`Error updating data in ${collectionName}:`, error);
    throw error;
  }
}

export async function updateMongoArrayDoc<T extends Document>(collectionName: string, documentId: string,  arrayField: any,
  newItem: any){
  const collection = db.collection(collectionName);

    const result = await collection.updateOne(
      { _id: new ObjectId(documentId) },
      { $push: { [arrayField]: newItem } as any }
    );

    console.log(`Updated ${result.modifiedCount} document`);
    return result;
}