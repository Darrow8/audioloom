import { usefulTrack } from './music.js';
import { z } from "zod";

// Base Line schema
export const LineSchema = z.object({
  id: z.string(),
  order: z.number(),
});

// CharLine schema with discriminator 
export const CharLineSchema = z.object({
  kind: z.literal("character"),
//   id: z.string(),
//   order: z.number(),
  character: z.string(),
  dialogue: z.string(),
  adjective: z.string(),
});

// MusicLine schema with discriminator
export const MusicLineSchema = z.object({
  kind: z.literal("music"),
//   id: z.string(), 
//   order: z.number(),
  type: z.enum(["Background Music", "Sound Effect"]),
  music_description: z.string(),
});

// Union type for Line types (now using 'kind' as discriminator)
export const LineUnionSchema = z.discriminatedUnion("kind", [
  CharLineSchema,
  MusicLineSchema
]);

export class Line {
    id: string;
    order: number;
    kind: LineKind;

    constructor(order: number, id: string, kind: LineKind) {
        this.order = order;
        this.id = id;
        this.kind = kind;
    }
}

export class CharLine extends Line {
    character: string;
    dialogue: string;
    adjective: string;

    constructor(dialogue: string, character: string, adjective: string, order: number, id: string, kind: LineKind.CHARACTER) {
        super(order, id, kind);
        this.dialogue = dialogue;
        this.character = character;
        this.adjective = adjective;
    }
}

export class Clip {
    audio: AudioFile;
    line: MusicLine | CharLine;
    id: string;

    constructor(audio: AudioFile, line: MusicLine | CharLine, id: string) {
        this.audio = audio;
        this.line = line;
        this.id = id;
    }
}

export function createClips(audios: AudioFile[], lines: MusicLine[] | CharLine[]) {
    let clip_arr : Clip[] = [];
    for (let line of lines) {
        let filtered_audios = audios.filter(aud => aud.id == line.id);
        if (filtered_audios.length == 0) {
            console.error("error, no corresponding AudioFile for line", line)
            continue;
        }
        let audio = filtered_audios[0];
        clip_arr.push(createClip(audio, line));
    }
    return clip_arr;
}

export function createClip(audio: AudioFile, line: MusicLine | CharLine): Clip {
    return new Clip(audio,line,line.id);
}

export class AudioFile {
    id: string;
    url: string;
    rawDuration?: number;
    duration: number;
    start: number;
    constructor(id: string, url: string, start: number, duration:number, rawDuration?: number,) {
        this.id = id;
        this.url = url;
        this.rawDuration = rawDuration;
        this.duration = duration;
        this.start = start;
    }
}

export enum MusicType {
    BMusic = "Background Music",
    SFX = "Sound Effect"
}

export enum LineKind {
    CHARACTER = "character",
    MUSIC = "music"
}

export class MusicLine extends Line {
    type: MusicType;
    music_description: string;

    constructor(type: MusicType, music_description: string, order: number, id: string, kind: LineKind.MUSIC) {
        super(order, id, kind);
        this.type = type;
        this.music_description = music_description;
    }
}