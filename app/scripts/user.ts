export interface Identity {
    provider: string;
    user_id: string;
    connection: string;
    isSocial: boolean;
}

export interface Pod {
    readings: string[];
    audio: string[];
}

export class MongoUser {
    _id: string; // mongo ID
    name: string;
    pod: Pod;
    user_id: string; // auth0 ID


    constructor(data: {
        _id: string;
        name: string;
        pod: Pod;
        user_id: string;
    }) {
        this._id = data._id;
        this.name = data.name;
        this.pod = data.pod;
        this.user_id = data.user_id;
    }
}


export class FullUser {
    created_at: string;
    email: string;
    email_verified: boolean;
    family_name: string;
    given_name: string;
    identities: Identity[];
    name: string;
    nickname: string;
    picture: string;
    updated_at: string;
    user_id: string;
    last_ip: string;
    last_login: string;
    logins_count: number;
    blocked_for: any[];
    guardian_authenticators: any[];
    passkeys: any[];
    pod: Pod;

    constructor(data: {
        created_at: string;
        email: string;
        email_verified: boolean;
        family_name: string;
        given_name: string;
        identities: Identity[];
        name: string;
        nickname: string;
        picture: string;
        updated_at: string;
        user_id: string;
        last_ip: string;
        last_login: string;
        logins_count: number;
        blocked_for: any[];
        guardian_authenticators: any[];
        passkeys: any[];
        pod: Pod;
    }) {
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
        this.user_id = data.user_id;
        this.last_ip = data.last_ip;
        this.last_login = data.last_login;
        this.logins_count = data.logins_count;
        this.blocked_for = data.blocked_for;
        this.guardian_authenticators = data.guardian_authenticators;
        this.passkeys = data.passkeys;
        this.pod = data.pod;
    }
}
