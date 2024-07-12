import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import createError from 'http-errors';
import bodyParser from 'body-parser';
import cors from 'cors';
import * as mongo from './mongo.js';
import dotenv from 'dotenv';

dotenv.config();


const app = express();
const port = process.env.PORT;
// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(cors());

// Callback route
app.get('/callback', (req, res) => {
    const data = req.body;

    // Handle the data from the callback
    console.log('Received callback data:', data);

    // Respond to the callback request
    res.status(200).json({ message: 'Callback received successfully' });
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/api/auth', (req, res) => {
    res.send({"data" : "wowza!"});
})

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
