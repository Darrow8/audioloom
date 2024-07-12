import { MongoClient } from "mongodb";

export async function main() {
    const uri = "mongodb+srv://<user>:<pass>@serverlessinstance0.z64b0z0.mongodb.net/?retryWrites=true&w=majority&appName=ServerlessInstance0";
    const client = new MongoClient(uri);
    await client.connect();
    await listDatabases(client);
    try {
        await client.connect();
    
        await listDatabases(client);
     
    } catch (e) {
        console.error(e);
    }finally {
        await client.close();
    }
}



async function listDatabases(client){
    let databasesList = await client.db().admin().listDatabases();
 
    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};
 