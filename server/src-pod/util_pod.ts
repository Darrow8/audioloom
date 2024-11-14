import { usefulTrack } from './util_music';

/**
 * Represents a script containing various lines, a title, and authors.
 */
export class Script {
    lines: Line[];
    title: string;
    authors: string[];
    lineCount: number;

    /**
     * Creates an instance of the Script class.
     * @param lines - An array of Line objects that make up the script.
     * @param title - The title of the script.
     * @param authors - An array of authors of the script.
     */
    constructor(lines: Line[], title: string, authors: string[]) {
        this.lines = lines;
        this.title = title;
        this.authors = authors;
        this.lineCount = lines.length;
    }

    /**
     * Gets all music lines from the script.
     * @returns An array of MusicLine objects.
     */
    getMusicLines(): MusicLine[] {
        return this.lines.filter(obj => obj instanceof MusicLine) as MusicLine[];
    }

    /**
     * Gets all character lines from the script.
     * @returns An array of CharLine objects.
     */
    getCharLines(): CharLine[] {
        return this.lines.filter(obj => obj instanceof CharLine) as CharLine[];
    }
}


// TODO: delete and replace with @shared/pod.js
export class InternalPod {
    clips: Clip[];
    title: string;
    authors: string[]
    /**
     * Creates an instance of the Script class.
     * @param title - The title of the script.
     * @param authors - An array of authors of the script.
     */
    constructor(title: string, authors: string[], clips: Clip[]) {
        this.clips = clips;
        this.title = title;
        this.authors = authors;
    }
}

/**
 * Represents a basic line in the script.
 */
export class Line {
    id: string;
    raw_string: string;
    order: number;

    /**
     * Creates an instance of the Line class.
     * @param raw_string - The raw string from the script.
     * @param order - The order of the line in the script.
     */
    constructor(raw_string: string, order: number, id: string) {
        this.raw_string = raw_string;
        this.order = order;
        this.id = id;
    }
}

/**
 * Represents a character line in the script.
 * Inherits from Line.
 */
export class CharLine extends Line {
    character: string;
    raw_dialogue: string;
    dialogue: string;
    adjective: string;

    /**
     * Creates an instance of the CharLine class.
     * @param raw_string - The raw string from the script.
     * @param order - The order of the line in the script.
     */
    constructor(raw_string: string, order: number, id: string) {
        super(raw_string, order, id);
        let i = raw_string.indexOf(':');
        this.character = (raw_string.slice(0, i)).trim();
        this.raw_dialogue = (raw_string.slice(i + 1)).trim();
        if (this.raw_dialogue.includes('[')) {
            let contents = separateString(this.raw_dialogue);
            this.dialogue = contents.dialogue;
            this.adjective = contents.adjective;
        } else {
            this.dialogue = this.raw_dialogue;
            this.adjective = "";
        }
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

/**
 * createClips
 * For either Music or Char lines, create clips and save them from audiofiles
 */
export function createClips(audios: AudioFile[], lines: MusicLine[] | CharLine[]) {
    let clip_arr : Clip[] = [];
    for (let line of lines) {
        let filtered_audios = audios.filter(aud => aud.id == line.id);
        if (filtered_audios.length == 0) {
            console.error("error, no corresponding AudioFile for line", line)
            continue;
        }
        let audio = filtered_audios[0]; // get first audio, should only be 1
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
    rawDuration?: number; // raw duration is the duration of the audio file, but it may be too long for what we want
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

/**
 * Represents a music line in the script.
 * Inherits from Line.
 */
export class MusicLine extends Line {
    type: string;
    music_description: string;

    /**
     * Creates an instance of the MusicLine class.
     * @param raw_string - The raw string from the script.
     * @param order - The order of the line in the script.
     */
    constructor(raw_string: string, order: number, id: string) {
        super(raw_string, order, id);
        let msg = removeFirstAndLastBrackets(raw_string);
        let i = msg.indexOf(':');
        let raw_type = (msg.slice(0, i)).trim();
        if (raw_type == "Background Music") {
            this.type = MusicType.BMusic;
        } else if (raw_type == "Sound Effect") {
            this.type = MusicType.SFX;
        } else {
            throw new Error(`Unknown music type: ${raw_type}`);
        }
        this.music_description = (msg.slice(i + 1)).trim();
    }
}

/**
 * Removes the first and last brackets from a string if they exist.
 * @param input - The input string.
 * @returns The string without the first and last brackets.
 */
function removeFirstAndLastBrackets(input: string): string {
    if (input.startsWith('[') && input.endsWith(']')) {
        return input.slice(1, -1);
    }
    return input;
}

/**
 * Separates a string into dialogue and adjective components.
 * @param input - The input string containing dialogue and optional adjective in brackets.
 * @returns An object containing the dialogue and adjective.
 */
function separateString(input: string): { adjective: string, dialogue: string } {
    const startIndex = input.indexOf('[');
    const endIndex = input.indexOf(']');

    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        const adjective = input.substring(startIndex + 1, endIndex);
        const dialogue = input.substring(endIndex + 1).trim();
        return { adjective, dialogue };
    }

    return { adjective: '', dialogue: input };
}

