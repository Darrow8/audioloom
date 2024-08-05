import express from "express";

// This will help us connect to the database
import { init, db, MongoUser } from "../mongo";
// This help convert the id from string to ObjectId for the _id.
import { ObjectId } from "mongodb";

// router is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /record.
const router = express.Router();

init();

// This section will help you get a list of all the records.
router.get("/:col", async (req, res) => {
  let collection = await db.collection(req.params.col);
  let results = await collection.find({}).toArray();
  res.send(results).status(200);
});

// This section will help you get a single record by id
router.get("/:col/:id", async (req, res) => {
  let collection = await db.collection(req.params.col);
  let query = { _id: new ObjectId(req.params.id) };
  let result = await collection.findOne(query);

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// This section will help you create a new record.
router.post("/:col", async (req, res) => {
  try {
    let newDocument = req.body as Omit<MongoUser, '_id'>;
    let collection = db.collection(req.params.col);
    let result = await collection.insertOne(newDocument);
    res.status(204).send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding record");
  }
});

// This section will help you update a record by id.
router.patch("/:col/:id", async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    let data = req.body as MongoUser;
    const updates = {
      $set: data,
    };

    let collection = await db.collection(req.params.col);
    let result = await collection.updateOne(query, updates);
    res.send(result).status(200);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating record");
  }
});

// This section will help you delete a record
router.delete("/:col/:id", async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };

    let collection = await db.collection(req.params.col);
    let result = await collection.deleteOne(query);

    res.send(result).status(200);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting record");
  }
});

export default router;