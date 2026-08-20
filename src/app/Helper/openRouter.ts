import OpenAI from "openai";
import httpStatus from "http-status";
import config from "../../config";
import ApiErrorHandler from "../error/apiErrorHandler";

const openai = new OpenAI({
  apiKey: config.openRouter_Api_Key,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "DGM Care",
  },
});

const CANDIDATE_MODELS = [
  "meta-llama/llama-3.1-8b-instruct",
  "deepseek/deepseek-r1:free",
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen-2.5-coder-32b-instruct:free",
  "mistralai/mistral-small-24b-instruct-2501:free"
];

export const getOpenRouterCompletion = async (prompt: string) => {
  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      console.log(`Trying OpenRouter model: ${modelName}`);
      const completion = await openai.chat.completions.create({
        model: modelName,
        temperature: 0,
        messages: [
          {
            role: "system",
            content: `
You are a medical specialty routing AI for DGM Care.

Your ONLY responsibility is to identify the most appropriate
medical specialty based on the patient's symptoms.

You MUST NOT:
- diagnose diseases
- prescribe medicines
- recommend medicines
- invent specialties
- invent specialty IDs
- choose a specialty simply because it is available

You must analyze the symptoms independently first.

If the medically appropriate specialty exists in the provided
AVAILABLE SPECIALTIES list, return MATCH with its exact database ID.

If the appropriate specialty does not exist in the available list,
return NO_MATCH.

NEVER substitute an unrelated specialty just because it is available.

Return ONLY valid JSON.
Do not return markdown.
Do not return \`\`\`json.
`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const message = completion.choices?.[0]?.message;
      if (message && message.content) {
        return message;
      }
    } catch (err: any) {
      console.warn(`Model ${modelName} failed, trying next candidate...`, err?.message || err);
      lastError = err;
    }
  }

  console.error("========== ALL OPENROUTER MODELS FAILED ==========", lastError);
  throw new ApiErrorHandler(
    httpStatus.INTERNAL_SERVER_ERROR,
    "AI service is currently unavailable!",
  );
};
