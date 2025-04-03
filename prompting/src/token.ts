import { encoding_for_model, TiktokenModel } from '@dqbd/tiktoken';

/**
 * Counts the number of tokens in a given text for a specific OpenAI model
 * @param text The text to count tokens for
 * @param model The OpenAI model to use for tokenization (default: "gpt-4")
 * @returns The number of tokens
 */
export function countTokens(text: string, model: string = "gpt-4"): number {
    try {
        const enc = encoding_for_model(model as TiktokenModel);
        const tokens = enc.encode(text);
        return tokens.length;
    } catch (error) {
        console.error("Error counting tokens:", error);
        throw error;
    }
}

/**
 * Estimates the cost of processing a given number of tokens
 * @param numTokens Number of tokens
 * @param model The OpenAI model to use for pricing (default: "gpt-4")
 * @returns The estimated cost in USD
 */
export function estimateCost(numTokens: number, model: string = "gpt-4"): number {
    const prices: { [key: string]: { input: number; output: number } } = {
        "gpt-4": { input: 0.03, output: 0.06 },
        "gpt-4-turbo": { input: 0.01, output: 0.03 },
        "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 }
    };

    const price = prices[model] || prices["gpt-4"];
    return (numTokens / 1000) * price.input;
}
