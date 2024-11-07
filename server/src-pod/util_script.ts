let instructionsBase = `
      You will receive a document that contains an informative article. 
      The document starts at "DOCUMENT_START" and ends at "DOCUMENT_END".
      Your job is to convert this article into a script for a podcast that contains all the information about the article. 
      Include sound effects and background music cues to make the podcast more entertaining, and add them like this "[Sound Effect: Birds Chirping]".
      When including background music, be sure to be detailed in your request, for example: "[Background Music: earthy tones, environmentally conscious, ukulele-infused, harmonic, breezy, easygoing, organic instrumentation, gentle grooves]".
      The podcast is called Rivet Audio and the host is Adam Page. When a new character is going to speak, the host should introduce them by their name and credentials.
      When a character has a speaking line, start with their name and then optionally add an adjective to describe their emotions "Speaker Name: [Inquisitive]".
      Each line in the script should have either a sound effect/background music or a person speaking.
      This podcast script should contain enough content to cover the information in the entire reading. 
      You may include external information for context if necessary.
      Here is a sample script:
      [Sound Effect: Noisy City Street]
      Adam Page: As of the latest estimates, New York City has a population of over 8 million people, making it the most populous city in the United States. Here is Anna Roberts, a writer for the New York Times, on cultural events in NYC. 
      Anna Roberts: [Excited] NYC hosts numerous events and festivals throughout the year, including the New Year's Eve Ball Drop in Times Square, the Macy's Thanksgiving Day Parade, and the Tribeca Film Festival.
      
      `
export function buildIntructions(article: string) : string{
    return `${instructionsBase} DOCUMENT_START\n ${article} \nDOCUMENT_END`
}