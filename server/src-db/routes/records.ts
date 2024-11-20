import express from "express";
import { User } from "@shared/user.js";
// This help convert the id from string to ObjectId for the _id.
  import { ObjectId } from "bson";
import { client } from "../mongo_interface.js";
import { authCheck } from "../../server.js";


// router is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /record.
export const router = express.Router();

export async function routerFunctions() {
  // This section will help you get a single record by id
  router.get("/:col/:id", authCheck, async (req, res) => {
    let collection = client.db("RivetAudio").collection(req.params.col);
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).send("Invalid ID format");
    }
    let query = { _id: new ObjectId(req.params.id) };
    let result = await collection.findOne(query);

    if (!result) res.send("Not found").status(404);
    else res.send(result).status(200);
  });

  // This section will help you create a new record.
  router.post("/:col", authCheck, async (req, res) => {
    try {
      let newDocument : any = req.body as User;
      console.log('newDocument', newDocument);
      let obj_id = new ObjectId();
      if (!ObjectId.isValid(obj_id)) {
        return res.status(400).send("Invalid ID format");
      }
      newDocument._id = obj_id;
      let collection = client.db("RivetAudio").collection(req.params.col);

      let result = await collection.insertOne(newDocument);
      res.send(result).status(204);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error adding record");
    }
  });

  // This section will help you update a record by id.
  router.patch("/:col/:id", authCheck, async (req, res) => {
    try {
      let obj_id = new ObjectId(req.params.id);
      if (!ObjectId.isValid(obj_id)) {
        return res.status(400).send("Invalid ID format");
      }
      const query = { _id: obj_id };
      let data = req.body as User;
      const updates = {
        $set: data,
      };
      let collection = client.db("RivetAudio").collection(req.params.col);
      let result = await collection.updateOne(query, updates);
      res.send(result).status(200);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error updating record");
    }
  });

  // This section will help you delete a record
  router.delete("/:col/:id", authCheck, async (req, res) => {
    try {
      let obj_id = new ObjectId(req.params.id);
      if (!ObjectId.isValid(obj_id)) {
        return res.status(400).send("Invalid ID format");
      }
      const query = { _id: obj_id };

      let collection = client.db("RivetAudio").collection(req.params.col);
      let result = await collection.deleteOne(query);

      res.send(result).status(200);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error deleting record");
    }
  });

  // This section will help you get a record by a field parameter
  router.get("/:col", authCheck, async (req, res) => {
    try {
      const { col } = req.params;
      const { field, value } = req.query;

      if (!field || !value) {
        return res.status(400).send("Missing field or value query parameter");
      }

      const query = { [field as string]: value };

      let collection = client.db("RivetAudio").collection(col);
      let result = await collection.findOne(query);

      if (result) {
        res.json(result).status(200);
      } else {
        res.status(404).send("Record not found");
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Error retrieving record");
    }
  });
  return new Promise((resolve, reject) => {
    resolve(true);
  });
}

export default router;