import { Request, Response, Express } from 'express';
import { ProcessingStep } from '../../shared/src/processing.js';


export class SSEResponse {
    private res: Response;
  
    constructor(res: Response) {
      this.setupSSEHeaders(res);
      this.res = res;
    }
  
    private setupSSEHeaders(res: Response) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'  // Add CORS if needed
      });
    }
  
    send(data: ProcessingStep) {
      // Properly format SSE data
      this.res.write(`data: ${JSON.stringify(data)}\n\n`);
      // Force flush the response
      if ('flush' in this.res) {
        (this.res as any).flush();
      }
    }
    end() {
      this.res.end();
    }
  }