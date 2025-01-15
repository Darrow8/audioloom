import { MongoClient, ServerApiVersion, ObjectId, Db } from "mongodb";
import { app } from '../server.js'
import { Server, Socket } from 'socket.io';
import { watchDocuments, watchDocument } from './mongo_methods.js';
import { io } from '../server.js';
export let client: MongoClient = undefined
export let uri: string = undefined;



export async function mongo_startup() {
  uri = process.env.ATLAS_URI;
  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    connectTimeoutMS: 30000,     // Increased to 30 seconds
    socketTimeoutMS: 45000,      // 45 seconds
    // Retry settings
    retryWrites: true,
    retryReads: true,
    // TLS settings
    tls: true,
    tlsAllowInvalidCertificates: false,
    // Additional reliability options
    maxPoolSize: 50,
    minPoolSize: 0,
    maxIdleTimeMS: 120000,
    waitQueueTimeoutMS: 30000,
    
  });
  try {
    // Connect the client to the server
    await client.connect();
    console.log("Successfully connected to MongoDB Atlas");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    console.log("Check if you have the IP connection setup properly in the MongoDB Atlas UI")
    // Optionally, you might want to rethrow the error or handle it in a way that's appropriate for your application
    throw error;
  }
}

export function getMode(socket: Socket){
  const mode = socket.handshake.query.env_mode;
  if(mode != "dev" && mode != "prod") {
    throw new Error("Invalid mode");
  }
  return mode;
}



export function watchDocumentPods(socket: Socket) {
  const mode = getMode(socket);
  socket.on('watchDocumentsPods', (documentIds: ObjectId[]) => {
    let emit_name = 'pods';
    watchDocuments(socket, 'pods', documentIds, emit_name, mode, (changeStream) => {
      // Listen for changes
      changeStream.on('change', (change) => {
        socket.emit(`${emit_name}Change`, change);
      });

      socket.data.changeStream = changeStream;
    });
  });
}

export function watchDocumentUser(socket: Socket) {
  const mode = getMode(socket);
  socket.on('watchDocumentUser', (documentId: ObjectId) => {
    let emit_name = 'user';
    watchDocument(socket, 'users', documentId, emit_name, mode, (changeStream) => {
      // Listen for changes
      changeStream.on('change', (change) => {
        socket.emit(`${emit_name}Change`, change);
      });

      socket.data.changeStream = changeStream;
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
