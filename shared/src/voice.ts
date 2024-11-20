export class Character {
    name: string;
    bio: string;
    voice_model: string;
    constructor(name: string, bio: string, voice_model: string) {
        this.name = name;
        this.bio = bio;
        this.voice_model = voice_model;
    }
}

export interface Voices {
    masculine_voices: string[];
    feminine_voices: string[];
    host_voice: string;
}
