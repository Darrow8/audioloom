import { ObjectId } from "mongodb";

export interface Pod {
    _id: ObjectId;
    title: string;
    author: string;
    status: PodStatus;
    created_at: Date;
    audio_key: string;
}

export enum PodStatus {
    READY = "ready",
    PENDING = "pending",
    ERROR = "error",
}

export enum StatusToIcon {
    READY = "check",
    PENDING = "loading",
    ERROR = "error",
}

