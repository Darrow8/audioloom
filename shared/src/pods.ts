import { ObjectId } from 'bson';

export interface Pod {
    _id: ObjectId;
    title: string;
    author: string;
    status: PodStatus;
    created_at: Date;
    audio_key: string;
    article_key?: string;
    script_key?: string;
    clean_article_key?: string;
    processing_time?: number;
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

