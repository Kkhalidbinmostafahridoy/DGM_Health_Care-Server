import OpenAI from "openai";
import config from "../../config";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: config.openRouter_Api_Key,
  defaultHeaders: {
    "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
    "X-OpenRouter-Title": "DGM Care",
  },
});

export const getOpenRouterCompletion = async (prompt: string) => {
  try {
    const response = await openai.chat.completions.create({
      model: "nvidia/nemotron-3-ultra-550b-a55b:free",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "You are a medical specialty routing assistant. You do not diagnose diseases or prescribe medicine.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return response.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("OpenRouter Error:", error);
    return null;
  }
};
