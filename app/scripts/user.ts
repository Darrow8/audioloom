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

export class User {
    // necessary fields: _id, name, created_at, email, email_verified, pods
    _id: string;
    created_at: string;
    email: string;
    email_verified: boolean;
    pods: string[];
    articles: string[];
    name: string;
    sub: string;

    // optional fields:
    family_name?: string;
    given_name?: string;
    identities?: Identity[];
    nickname?: string;
    picture?: string;
    updated_at?: string;
    last_ip?: string;
    last_login?: string;
    logins_count?: number;
    blocked_for?: any[];
    guardian_authenticators?: any[];
    passkeys?: any[];

    constructor(data: {
        _id: string;
        name: string;
        created_at: string;
        email: string;
        email_verified: boolean;
        family_name?: string;
        given_name?: string;
        identities?: Identity[];
        nickname?: string;
        picture?: string;
        updated_at: string;
        last_ip?: string;
        last_login?: string;
        logins_count?: number;
        blocked_for?: any[];
        guardian_authenticators?: any[];
        passkeys?: any[];
        pods: string[];
        articles: string[];
        sub: string;
    }) {
        this._id = data._id;
        this.sub = data.sub;
        this.created_at = data.created_at;
        this.email = data.email;
        this.email_verified = data.email_verified;
        this.family_name = data.family_name;
        this.given_name = data.given_name;
        this.identities = data.identities;
        this.name = data.name;
        this.nickname = data.nickname;
        this.picture = data.picture;
        this.updated_at = data.updated_at;
        this.last_ip = data.last_ip;
        this.last_login = data.last_login;
        this.logins_count = data.logins_count;
        this.blocked_for = data.blocked_for;
        this.guardian_authenticators = data.guardian_authenticators;
        this.passkeys = data.passkeys;
        this.pods = data.pods;
        this.articles = data.articles;
    }
}