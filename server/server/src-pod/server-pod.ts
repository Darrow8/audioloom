import { Request, Response } from 'express';
import { app, authCheck } from '../server.js';
import { Request as JWTRequest } from 'express-jwt';

export const podRoutes = () => {
  // Public route should be defined first
  app.get('/pod/public', (req: Request, res: Response) => {
    res.send('Hello from the /pod!');
  });

  // Pod route
  app.get('/pod', authCheck, (req: JWTRequest, res: Response) => {
    res.send('Hello from /pod!');
  });

  // Example of a POST route
  app.post('/pod', authCheck, (req: JWTRequest, res: Response) => {
    // Here you would typically process the pod data
    res.json({ message: 'Pod data received', data: req.body });
  });

  // Catch-all route for /pod should be last
  app.use('/pod', authCheck, (req: JWTRequest, res: Response) => {
    res.send(`Pod Server: You accessed ${req.method} ${req.path}`);
  });
}