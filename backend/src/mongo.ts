import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from 'dotenv';

dotenv.config();

export let db = undefined;

export async function init(){
    const URI = process.env.ATLAS_URI || "";
    const client = new MongoClient(URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
    });

    try {
        // Connect the client to the server
        client.connect();
        // Send a ping to confirm a successful connection
        client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        } catch (err) {
        console.error(err);
    }


    db = client.db("fullData");
}
export interface Pod {
    readings: string[];
    audio: string[];
}
// Class that Mongo Accepts
export class MongoUser {
    _id: string; // mongo ID
    name: string;
    pod: Pod;
    user_id: string; // auth0 ID


    constructor(data: {
        _id: string;
        name: string;
        pod: Pod;
        user_id: string;
    }) {
        this._id = data._id;
        this.name = data.name;
        this.pod = data.pod;
        this.user_id = data.user_id;
    }
}