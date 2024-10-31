export interface MongoDocument {
    _id: string | number;
    [key: string]: any;
  }
  
  export interface WatchOptions<T extends MongoDocument> {
    collection: string;
    filter?: Partial<T>;
    sortBy?: {
      [K in keyof T]?: 1 | -1;
    };
    limit?: number;
  }
  
  export interface UseMongoDBWatchResult<T extends MongoDocument> {
    documents: T[];
    isLoading: boolean;
    error: Error | null;
  }
  
  // config/mongodb.ts
  export interface MongoConfig {
    uri: string;
    dbName: string;
  }
  
  export const serverConfig: MongoConfig = {
    uri: 'mongodb+srv://your-connection-string',
    dbName: 'your-database-name'
  };