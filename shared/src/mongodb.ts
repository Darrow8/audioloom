import { Document, Collection } from 'mongodb';
import { Socket } from 'socket.io';
import { ObjectId } from 'bson';

export interface WatchOptions<T extends MongoDocument> {
  collection: string;
  filter?: Partial<T>;
  sortBy?: {
    [K in keyof T]?: 1 | -1;
  };
  limit?: number;
}

export interface UseMongoDBWatchResult<T extends MongoDocument> {
  documents: T[];
  isLoading: boolean;
  error: Error | null;
}

// config/mongodb.ts
export interface MongoConfig {
  uri: string;
  dbName: string;
}


export interface MongoDocument extends Document {
  _id: ObjectId;
  [key: string]: any;
}

export interface ChangeStreamUpdate {
  operationType: 'insert' | 'update' | 'delete' | 'replace';
  documentKey: {
    _id: ObjectId;
  };
  fullDocument?: MongoDocument;
}

export interface ClientToServerEvents {
  watchDocuments: (documentIds: string[]) => void;
}

export interface ServerToClientEvents {
  documentChange: (change: ChangeStreamUpdate) => void;
  initialDocuments: (docs: MongoDocument[]) => void;
  error: (message: string) => void;
}

export interface SocketData {
  changeStream?: any; // MongoDB ChangeStream type
}

export interface MongoChangeStreamData {
  _id: {
    _data: string;
  };
  clusterTime: {
    $timestamp: string;
  };
  documentKey: {
    _id: ObjectId;
  };
  fullDocument: {
    _id: ObjectId;
    author: string;
    created_at: string;
    status: string;
    title: string;
    [key: string]: any; // For any additional fields
  };
  ns: {
    coll: string;
    db: string;
  };
  operationType: 'insert' | 'update' | 'delete' | 'replace';
  updateDescription: {
    removedFields: string[];
    truncatedArrays: any[];
    updatedFields: {
      [key: string]: any;
    };
  };
  wallTime: string;
}

export interface DocumentCreated {
  acknowledged: boolean;
  insertedId: string;
}