// this is the standard way to represent a step in the processing pipeline
export type ProcessingStep = {
    step: string,
    status: ProcessingStatus,
    message: string,
    payload?: any,
    [key: string]: any
}

export enum ProcessingStatus {
    SUCCESS = "success", // aka in progress
    ERROR = "error",
    COMPLETED = "completed"
}