import { ObjectId, Document } from 'mongodb';
import { Socket } from 'socket.io';

export interface Pod {
    readings: string[];
    audio: string[];
}
// Class that Mongo Accepts
export class User {
    _id: ObjectId; // mongo ID
    name: string;
    pods: string[];
    articles: string[]
    user_id: string; // auth0 ID


    constructor(data: {
        _id: string;
        name: string;
        pods: string[];
        user_id: string;
    }) {
        this._id = new ObjectId(data._id);
        this.name = data.name;
        this.pods = data.pods;
        this.user_id = data.user_id;
    }
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
