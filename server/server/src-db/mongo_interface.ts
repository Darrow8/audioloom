import { MongoClient, ServerApiVersion, ObjectId, Db } from "mongodb";
import { app } from '../server.js'
import { User, Pod } from './utils.js';
import { Server } from 'socket.io';
import { watchDocuments } from './mongo_methods.js';
import { io } from '../server.js';

export let client: MongoClient = undefined
export let uri: string = undefined;
export let db: Db = undefined;



export async function mongo_startup() {
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
    // await client.db("admin").command({ ping: 1 });
    db = client.db('RivetAudio');
    console.log("Successfully connected to MongoDB Atlas");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    console.log("Check if you have the IP connection setup properly in the MongoDB Atlas UI")
    // Optionally, you might want to rethrow the error or handle it in a way that's appropriate for your application
    throw error;
  }

  
}

export function setupSocketIO() {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
  
    socket.on('watchDocuments', (collectionName: string, documentIds: string[]) => {
      console.log("watchDocuments: ", collectionName, documentIds);
      watchDocuments(socket, collectionName, documentIds);
    });
  
    socket.on('disconnect', async () => {
      // if (socket.data.changeStream) {
      //   await socket.data.changeStream.close();
      // }
      console.log('Client disconnected:', socket.id);
    });
  });
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
