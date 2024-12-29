import { MongoClient, ServerApiVersion, ObjectId, Db, ChangeStream, PullOperator } from "mongodb";
import { app } from '../server.js'
import { MongoDocument, ChangeStreamUpdate } from '../../shared/src/mongodb.js';
import { db } from './mongo_interface.js';
import { Socket } from 'socket.io';
import { Document } from 'bson';


/**
 * Checks if a document with the given _id exists in the specified collection
 * @param collectionName - Name of the MongoDB collection
 * @param id - The _id to check (can be string or ObjectId)
 * @returns Promise<boolean> - True if document exists, false otherwise
 */
export async function doesIdExist(collectionName: string, id: ObjectId): Promise<boolean> {
  try {
    // Convert string ID to ObjectId if necessary

    const collection = db.collection(collectionName);
    const document = await collection.findOne({ _id: id }, { projection: { _id: 1 } });

    return document !== null;
  } catch (error) {
    console.error(`Error checking if _id exists in ${collectionName}:`, error);
    throw error;
  }
}

export async function doesSubExist(collectionName: string, sub: string): Promise<boolean> {
  try {
    // Convert string ID to ObjectId if necessary

    const collection = db.collection(collectionName);
    const document = await collection.findOne({ sub: sub }, { projection: { sub: 1 } });

    return document !== null;
  } catch (error) {
    console.error(`Error checking if sub exists in ${collectionName}:`, error);
    throw error;
  }
}

export async function createMongoData(collectionName: string, data: Document) {
  try {
    if (collectionName == 'users') {
      let pods = addPodsToUser(data);
      data.pods = pods;
    }
    console.log('data', data);
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

export async function updateMongoData(collectionName: string, data: Document) {
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

export async function updateMongoArrayDoc<T extends Document>(collectionName: string, documentId: ObjectId, arrayField: any,
  newItem: any) {
  const collection = db.collection(collectionName);

  const result = await collection.updateOne(
    { _id: documentId },
    { $push: { [arrayField]: newItem } as any }
  );

  console.log(`Updated ${result.modifiedCount} document`);
  return result;
}
/**
 * Watch multiple documents in a collection
 * @param socket 
 * @param collectionName 
 * @param documentIds 
 * @param emit_name 
 * @returns 
 */
export async function watchDocuments(socket: Socket, collectionName: string, documentIds: ObjectId[], emit_name: string, callback?: (change: ChangeStream<ChangeStreamUpdate>) => void): Promise<void> {
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

    callback && callback(changeStream);


  } catch (err) {
    console.error('Error setting up change stream:', err);
    socket.emit(`${emit_name}Error`, 'Failed to watch documents');
  }
}

/**
 * Watch a single document in a collection
 * @param socket 
 * @param collectionName 
 * @param documentId 
 * @param emit_name 
 * @returns 
 */
export async function watchDocument(socket: Socket, collectionName: string, documentId: ObjectId, emit_name: string, callback?: (change: ChangeStream<ChangeStreamUpdate>) => void): Promise<void> {
  try {
    // Validate ID
    if (!ObjectId.isValid(documentId)) {
      socket.emit('error', 'Invalid document ID');
      return;
    }
    const collection = db.collection<MongoDocument>(collectionName);
    const objectId = new ObjectId(documentId);

    // Set up change stream pipeline
    const pipeline = [{
      $match: {
        $and: [
          { "documentKey._id": objectId },
          { operationType: { $in: ['insert', 'update', 'delete', 'replace'] } }
        ]
      }
    }];

    // Create change stream
    const changeStream = collection.watch<ChangeStreamUpdate>(pipeline, {
      fullDocument: 'updateLookup'
    });

    callback && callback(changeStream);

    // Store change stream reference for cleanup
    socket.data.changeStream = changeStream;

  } catch (err) {
    console.error('Error setting up change stream:', err);
    socket.emit(`${emit_name}Error`, 'Failed to watch document');
  }
}

export async function removeFromMongoArray(
  collectionName: string,
  documentId: ObjectId,
  arrayField: string,
  itemToRemove: any
) {
  try {
    const collection = db.collection(collectionName);

    const pullOperation = {
      [arrayField]: itemToRemove
    } as PullOperator<MongoDocument>;

    const result = await collection.updateOne(
      { _id: documentId },
      { $pull: pullOperation }
    );

    if (result.matchedCount === 0) {
      console.log(`No document found with _id: ${documentId} in ${collectionName}`);
    } else {
      console.log(`Removed item from array in document with _id: ${documentId}`);
    }

    return result;
  } catch (error) {
    console.error(`Error removing item from array in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Temporary function to add pods to user
 * @param data 
 * @returns 
 */
export function addPodsToUser(data: any) {
  if (process.env.NODE_ENV == 'production') {
    console.log('creating user with additional pods');
    let intro_pod = new ObjectId('6727006b22da058cbd4d4665');
    let humanities_pod = new ObjectId('676f5ad4ecf2e78fe10012dc');
    let science_pod = new ObjectId('676f5880aa561fca5b4a5bd7');
    return [intro_pod, humanities_pod, science_pod];
  } else {
    console.log('not in production');
    return [];
  }
}