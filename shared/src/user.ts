import { ObjectId } from 'mongodb';

// Class that Mongo Accepts
export class User {
    _id: ObjectId; // mongo ID
    name: string;
    pods: string[];
    articles: string[];
    user_id: string; // auth0 ID


    constructor(data: {
        _id: string;
        name: string;
        pods: string[];
        user_id: string;
        articles: string[];
    }) {
        this._id = new ObjectId(data._id);
        this.name = data.name;
        this.pods = data.pods;
        this.user_id = data.user_id;
        this.articles = data.articles;
    }
}
