import { ObjectId } from 'mongodb';
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