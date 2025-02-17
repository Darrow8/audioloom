// // Type definitions for messages between main thread and worker
// type WorkerMessage = {
//     type: 'PROCESS_DATA';
//     payload: number[];
// } | {
//     type: 'TERMINATE';
// };

// type MainThreadMessage = {
//     type: 'RESULT';
//     payload: number;
// } | {
//     type: 'ERROR';
//     payload: string;
// };

// // Worker context
// self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
//     try {
//         switch (event.data.type) {
//             case 'PROCESS_DATA':
//                 // Simulate CPU-intensive work
//                 const result = await processLargeDataSet(event.data.payload);
//                 self.postMessage({ type: 'RESULT', payload: result });
//                 break;
            
//             case 'TERMINATE':
//                 self.close();
//                 break;
                
//             default:
//                 throw new Error('Unknown message type');
//         }
//     } catch (error) {
//         self.postMessage({
//             type: 'ERROR',
//             payload: error instanceof Error ? error.message : 'Unknown error'
//         });
//     }
// };

// // CPU-intensive function
// async function processLargeDataSet(data: number[]): Promise<number> {
//     return new Promise((resolve) => {
//         // Simulate heavy computation
//         const sum = data.reduce((acc, curr) => acc + curr, 0);
//         resolve(sum);
//     });
// }

// // main.ts
// // Worker pool manager for handling multiple workers
// class WorkerPool {
//     private workers: Worker[] = [];
//     private queue: Array<{
//         data: number[],
//         resolve: (value: number) => void,
//         reject: (reason: any) => void
//     }> = [];
//     private activeWorkers: Set<Worker> = new Set();
//     private readonly maxWorkers: number;

//     constructor(maxWorkers: number = navigator.hardwareConcurrency || 4) {
//         this.maxWorkers = maxWorkers;
//     }

//     async processData(data: number[]): Promise<number> {
//         return new Promise((resolve, reject) => {
//             // Add task to queue
//             this.queue.push({ data, resolve, reject });
//             this.processQueue();
//         });
//     }

//     private processQueue(): void {
//         // Process as many items as we can with available workers
//         while (this.queue.length > 0 && this.activeWorkers.size < this.maxWorkers) {
//             const task = this.queue.shift();
//             if (!task) continue;

//             const worker = this.getWorker();
//             this.activeWorkers.add(worker);

//             const { data, resolve, reject } = task;

//             // Set up message handling for this task
//             const messageHandler = (event: MessageEvent<MainThreadMessage>) => {
//                 switch (event.data.type) {
//                     case 'RESULT':
//                         resolve(event.data.payload);
//                         this.releaseWorker(worker, messageHandler);
//                         break;
                    
//                     case 'ERROR':
//                         reject(new Error(event.data.payload));
//                         this.releaseWorker(worker, messageHandler);
//                         break;
//                 }
//             };

//             worker.addEventListener('message', messageHandler);
//             worker.postMessage({ type: 'PROCESS_DATA', payload: data });
//         }
//     }

//     private getWorker(): Worker {
//         // Reuse existing worker or create new one
//         const worker = this.workers.find(w => !this.activeWorkers.has(w)) 
//             || new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
        
//         if (!this.workers.includes(worker)) {
//             this.workers.push(worker);
//         }

//         return worker;
//     }

//     private releaseWorker(worker: Worker, messageHandler: (event: MessageEvent) => void): void {
//         worker.removeEventListener('message', messageHandler);
//         this.activeWorkers.delete(worker);
//         this.processQueue();
//     }

//     terminate(): void {
//         // Clean up all workers
//         this.workers.forEach(worker => {
//             worker.postMessage({ type: 'TERMINATE' });
//         });
//         this.workers = [];
//         this.activeWorkers.clear();
//         this.queue = [];
//     }
// }

// // Usage example
// async function main() {
//     const pool = new WorkerPool();
    
//     try {
//         // Process multiple data sets concurrently
//         const results = await Promise.all([
//             pool.processData([1, 2, 3, 4, 5]),
//             pool.processData([6, 7, 8, 9, 10]),
//             pool.processData([11, 12, 13, 14, 15])
//         ]);
        
//         console.log('Results:', results);
//     } catch (error) {
//         console.error('Error processing data:', error);
//     } finally {
//         pool.terminate();
//     }
// }

// main();