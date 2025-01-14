import { readFile } from "fs/promises";

import { writeFile } from "fs/promises";

interface CleaningOptions {
    removeTOC?: boolean;
    removeReferences?: boolean;
    removeBlankLines?: boolean;
    removeHeaders?: boolean;
    preserveNewlines?: boolean;
}

export function cleanText(text: string, options: CleaningOptions = {}): string {
    const {
        removeTOC = true,
        removeReferences = true,
        removeBlankLines = true,
        removeHeaders = true,
        preserveNewlines = false
    } = options;

    // Remove document structure markers
    let cleanedText = text.replace(/^<.*>$/gm, '');

    // Remove headers if specified
    if (removeHeaders) {
        cleanedText = cleanedText
            // Remove section headers
            .replace(/^(Part \d+:|Prologue|Preface|Introduction|Conclusion)$/gm, '')
            // Remove dates at the start of sections
            .replace(/^\w+ \d{1,2}, \d{4}$/gm, '');
    }

    // Remove references and citations
    if (removeReferences) {
        cleanedText = cleanedText
            // Remove superscript citations
            .replace(/[ⁱⁱⁱᵛᵛⁱ]/g, '')
            // Remove numbered references with bullet points
            .replace(/^\d+\s*▪.*$/gm, '')
            // Remove citation blocks
            .replace(/\(\d+\)/g, '')
            // Remove footnote markers
            .replace(/\[\d+\]/g, '')
            // Remove general citations
            .replace(/\([^)]+\d{4}[^)]*\)/g, '')
            // Remove URLs
            .replace(/https?:\/\/\S+/g, '')
            // Remove bullet points
            .replace(/^▪\s*/gm, '');
    }

    // Remove table of contents if specified
    if (removeTOC) {
        cleanedText = cleanedText
            // Remove TOC sections
            .replace(/Table of Contents[\s\S]*?\n(?=\n|[A-Z])/gi, '')
            // Remove numbered sections in TOC format
            .replace(/^\s*\d+\.\d*\s+.*$/gm, '');
    }

    // Clean up whitespace and formatting
    if (removeBlankLines) {
        cleanedText = cleanedText
            // Replace multiple blank lines
            .replace(/\n\s*\n\s*\n/g, preserveNewlines ? '\n\n' : '\n')
            // Remove spaces at line starts
            .replace(/^\s+/gm, '')
            // Remove page numbers
            .replace(/^\d+$/gm, '')
            // Normalize single spaces
            .replace(/\s+/g, ' ')
            // Restore newlines if preserving
            .replace(/\. /g, preserveNewlines ? '.\n' : '. ')
            .trim();
    }

    return cleanedText;
}

/**
 * Clean a text file and return the cleaned text
 * @param filePath 
 * @param options 
 * @returns 
 */
export async function cleanTextFile(filePath: string, options?: CleaningOptions): Promise<string> {
    try {
        const text = await readFile(filePath, 'utf8');
        return cleanText(text, options);
    } catch (error) {
        throw new Error(`Error cleaning text file: ${error.message}`);
    }
}

// Helper function to write cleaned text to a new file
export async function saveCleanedText(inputPath: string, outputPath: string, options?: CleaningOptions): Promise<void> {
    try {
        const cleanedText = await cleanTextFile(inputPath, options);
        await writeFile(outputPath, cleanedText);
    } catch (error) {
        throw new Error(`Error saving cleaned text: ${error.message}`);
    }
}