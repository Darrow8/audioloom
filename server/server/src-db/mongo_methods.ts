import { MongoClient, ServerApiVersion, ObjectId, Db } from "mongodb";
import { app } from '../server.js'
import { User, Pod, MongoDocument, ChangeStreamUpdate } from './utils.js';
import { db } from './mongo_interface.js';
import { Socket } from 'socket.io';
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

 export async function watchDocuments(socket: Socket, collectionName: string, documentIds: string[]): Promise<void> {
    try {
        // Validate IDs
        if (!documentIds.every(id => ObjectId.isValid(id))) {
            socket.emit('error', 'Invalid document IDs');
            return;
        }
        const collection = db.collection<MongoDocument>(collectionName);
        const objectIds = documentIds.map(id => new ObjectId(id));

        // Set up change stream pipeline
        const pipeline = [{
            $match: {
                $and: [
                    { "documentKey._id": { $in: objectIds } },
                    { operationType: { $in: ['insert', 'update', 'delete', 'replace'] } }
                ]
            }
        }];

        // Create change stream
        const changeStream = collection.watch<ChangeStreamUpdate>(pipeline, {
            fullDocument: 'updateLookup'
        });

        // Listen for changes
        changeStream.on('change', (change) => {
            socket.emit('documentChange', change);
        });

        // Fetch initial documents
        const initialDocs = await collection
            .find({ _id: { $in: objectIds } })
            .toArray();
        
        socket.emit('initialDocuments', initialDocs);

        // Store change stream reference for cleanup
        socket.data.changeStream = changeStream;

    } catch (err) {
        console.error('Error setting up change stream:', err);
        socket.emit('error', 'Failed to watch documents');
    }
}