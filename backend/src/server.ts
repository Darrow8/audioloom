import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import bodyParser from 'body-parser';
import cors from 'cors';
import records from "./routes/record.js";
// import * as process_pod from './process_pod.js';




const app = express();
const port = process.env.PORT;
// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(cors());
app.use("/record", records);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
