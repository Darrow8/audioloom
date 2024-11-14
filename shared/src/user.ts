import { ObjectId } from 'mongodb';

// Class that Mongo Accepts
export class User {
    _id: string; // mongo ID
    name: string;
    pods: string[];
    articles: string[];
    user_id: string; // auth0 ID
    created_at: string;
    email: string;
    email_verified: boolean;
    sub: string;

    updated_at?: string;
    last_ip?: string;
    last_login?: string;
    logins_count?: number;
    blocked_for?: any[];
    guardian_authenticators?: any[];
    passkeys?: any[];
    picture?: string;
    user_metadata?: UserMetadata;

    constructor(data: {
        _id: string;
        name: string;
        pods: string[];
        user_id: string;
        articles: string[];
        created_at: string;
        email: string;
        email_verified: boolean;
        sub: string;
    }) {
        this._id = (data._id);
        this.name = data.name;
        this.pods = data.pods;
        this.user_id = data.user_id;
        this.articles = data.articles;
        this.created_at = data.created_at;
        this.email = data.email;
        this.email_verified = data.email_verified;
        this.sub = data.sub;

    }
}

export interface Identity {
    provider: string;
    user_id: string;
    connection: string;
    isSocial: boolean;
}

export interface UserState {
    user: User | undefined;
    isLoggedIn: boolean;
}

export const initialState: UserState = {
    user: undefined,
    isLoggedIn: false,
};

export interface UserState {
    user: User | undefined;
    isLoggedIn: boolean;
}
export interface UserMetadata {
    account_type?: string;
    reference_channel?: string;
    logins_count?: number;
    initial_login?: boolean;
}