import OpenAI from "openai";

const openai = new OpenAI();

async function scriptwriter() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: "You are a helpful assistant." }],
    model: "gpt-4-turbo",
  });

  console.log(completion.choices[0]);
}


async function trimmer() {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: "You will receive a .txt file that may be poorly formatted. Your job is to trim the contents of this article to just include the useful information about this article." }],
      model: "gpt-4-turbo",
    });
  
    console.log(completion.choices[0]);
  }