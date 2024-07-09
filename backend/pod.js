
/** all of the lines of the script */
export class Script {
    constructor(lines, title, authors){
        this.lines = lines;
        this.title = title;
        this.authors = authors;
    }

    getMusicLines(){
        return this.lines.filter(obj => obj instanceof MusicLine);

    }

    getCharLines(){
        return this.lines.filter(obj => obj instanceof CharLine);

    }
}


/**
 * Basic Line 
 * raw_string -- output from raw script
 * order -- what order this line is in the raw script
 */
export class Line {
    constructor(raw_string, order){
        this.raw_string = raw_string.trim(); // raw string from script
        this.order = order;
    }
}

/**
 * CharLine
 * raw_string -- from Line
 * order -- from Line
 * character -- the person who will be speaking
 * raw_dialogue -- dialogue that is unprocessed
 * dialogue -- processed dialogue
 * adjective -- how the author is going to deliver the line (could be empty)
 */
export class CharLine extends Line {
    constructor(raw_string, order){
        super(raw_string);
        super(order);
        // from https://stackoverflow.com/questions/2878703/split-string-once-in-javascript
        let i = raw_string.indexOf(':');
        this.character = (raw_string.slice(0,i)).trim();
        this.raw_dialogue = (raw_string.slice(i+1)).trim();
        if(this.raw_dialogue.includes('[')){
            let contents = separateString(this.raw_dialogue);
            this.dialogue = contents.dialogue;
            this.adjective = contents.adjective;
        }else{
            this.dialogue = this.raw_dialogue;
            this.adjective = "";
        }
    }
    
}

/**
 * MusicLine
 * raw_string -- from Line
 * order -- from Line
 * type -- "Background Music" or "Sound Effect"
 * music_description -- the requested music description wanted
 */
export class MusicLine extends Line {
    constructor(raw_string, order){
        super(raw_string);
        super(order);
        let msg = removeFirstAndLastBrackets(raw_string);
        let i = msg.indexOf(':');
        this.type = (msg.slice(0,i)).trim();
        this.music_description = (msg.slice(i+1)).trim();

    }
}

function removeFirstAndLastBrackets(input) {
    if (input.startsWith('[') && input.endsWith(']')) {
        return input.slice(1, -1);
    }
    return input;
}

function separateString(input) {
    const startIndex = input.indexOf('[');
    const endIndex = input.indexOf(']');
    
    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        const adjective = input.substring(startIndex + 1, endIndex);
        const dialogue = input.substring(endIndex + 1).trim();
        return { adjective, dialogue };
    }
    
    return { adjective: '', dialogue: input };
}