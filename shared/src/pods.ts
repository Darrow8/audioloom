export interface Pod {
    _id: string;
    title: string;
    author: string;
    status: Status;
    created_at: Date;
}

export enum Status {
    READY = "ready",
    PENDING = "pending",
    ERROR = "error",
}

export enum StatrusToIcon {
    READY = "check",
    PENDING = "loading",
    ERROR = "error",
}

