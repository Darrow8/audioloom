import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import createError from 'http-errors';
import bodyParser from 'body-parser';
import cors from 'cors';
import records from "./routes/record.js";
import * as jwt from 'express-jwt';
import * as jwksRsa from 'jwks-rsa';




const app = express();
const port = process.env.PORT;
// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(cors());
app.use("/record", records);


// const checkJwt = jwt.expressjwt({
//     secret: jwksRsa.expressJwtSecret({
//     cache: true,
//     rateLimit: true,
//     jwksRequestsPerMinute: 5,
//     jwksUri: 'https://YOUR_DOMAIN/.well-known/jwks.json'
//   }) as jwt.GetVerificationKey,
//   audience: 'YOUR_API_IDENTIFIER',
//   issuer: 'https://YOUR_DOMAIN/',
//   algorithms: ['RS256']
// });
  
//   app.use(checkJwt);


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});