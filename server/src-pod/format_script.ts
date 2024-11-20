export function fixScriptFormat(script: string): string {
    // Split the script into lines
    const lines = script.split('\n');

    // Regular expressions for detecting and fixing lines
    const soundEffectRegex = /^\[Sound Effect: .+?\]$/;
    const backgroundMusicRegex = /^\[Background Music: .+?\]$/;
    const speakerLineWithBracketRegex = /^([A-Za-z\s]+)\s(\[\w+?\]):(.*)$/; // Descriptor before colon
    const speakerLineWithoutBracketRegex = /^([A-Za-z\s]+):(.*)$/; // No descriptor

    // Process each line
    const fixedLines = lines.map(line => {
        const trimmedLine = line.trim();

        // Leave empty lines as is
        if (trimmedLine === '') return '';

        // If it's already correctly formatted, return it
        if (
            soundEffectRegex.test(trimmedLine) ||
            backgroundMusicRegex.test(trimmedLine) ||
            speakerLineWithoutBracketRegex.test(trimmedLine)
        ) {
            return trimmedLine;
        }

        // Fix speaker lines with descriptor before colon
        const matchWithBracket = trimmedLine.match(speakerLineWithBracketRegex);
        if (matchWithBracket) {
            const [_, name, descriptor, dialogue] = matchWithBracket;
            return `${name}${descriptor}: ${dialogue.trim()}`;
        }

        // Fix speaker lines without descriptor
        const matchWithoutBracket = trimmedLine.match(speakerLineWithoutBracketRegex);
        if (matchWithoutBracket) {
            const [_, name, dialogue] = matchWithoutBracket;
            return `${name}: ${dialogue.trim()}`;
        }

        // If the line is unrecognized, leave it unchanged (optional: throw an error instead)
        return trimmedLine;
    });

    // Join fixed lines back into a single string
    return fixedLines.join('\n');
}

export function validateScript(script: string): boolean {
    // Split the script into lines
    const lines = script.split('\n');

    // Regular expressions for the three valid line types
    const soundEffectRegex = /^\[Sound Effect: .+?\]$/;
    const backgroundMusicRegex = /^\[Background Music: .+?\]$/;
    const speakerLineRegex = /^[A-Za-z\s]+: (\[.+?\])?.*$/;

    // Check each line
    for (const line of lines) {
        // Allow empty lines
        if (line.trim() === '') continue;

        // Check if the line matches one of the valid formats
        if (
            !soundEffectRegex.test(line) &&
            !backgroundMusicRegex.test(line) &&
            !speakerLineRegex.test(line)
        ) {
            return false; // Invalid line found
        }
    }

    // All lines are valid
    return true;
}