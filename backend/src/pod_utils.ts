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

/**
 * Represents a basic line in the script.
 */
export class Line {
    raw_string: string;
    order: number;

    /**
     * Creates an instance of the Line class.
     * @param raw_string - The raw string from the script.
     * @param order - The order of the line in the script.
     */
    constructor(raw_string: string, order: number) {
        this.raw_string = raw_string;
        this.order = order;
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
    constructor(raw_string: string, order: number) {
        super(raw_string, order);
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


export enum MusicType {
    BMusic = "Background Music",
    SFX = "Sound Effect"
}
/**
 * Represents a music line in the script.
 * Inherits from Line.
 */
export class MusicLine extends Line {
    type: MusicType;
    music_description: string;

    /**
     * Creates an instance of the MusicLine class.
     * @param raw_string - The raw string from the script.
     * @param order - The order of the line in the script.
     */
    constructor(raw_string: string, order: number) {
        super(raw_string, order);
        let msg = removeFirstAndLastBrackets(raw_string);
        let i = msg.indexOf(':');
        let raw_type = (msg.slice(0, i)).trim();
        this.type = raw_type as MusicType;
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
