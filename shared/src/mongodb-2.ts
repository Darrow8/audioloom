import { ObjectId, Document } from 'mongodb';
import { Socket } from 'socket.io';

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
