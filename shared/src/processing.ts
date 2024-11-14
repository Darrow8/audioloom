export type ProcessingStep = {
    step: string,
    status: ProcessingStatus,
    message?: string,
    [key: string]: any
}

export enum ProcessingStatus {
    IN_PROGRESS = "in progress",
    SUCCESS = "success",
    ERROR = "error",
    COMPLETED = "completed"
}