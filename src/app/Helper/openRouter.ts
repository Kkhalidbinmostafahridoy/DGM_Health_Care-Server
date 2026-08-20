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

export const getOpenRouterCompletion = async (prompt: string) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "nvidia/nemotron-3-ultra-550b-a55b:free",

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

For example:
If the symptoms are general flu-like symptoms and General Medicine
is not available, DO NOT select Cardiology simply because Cardiology
is available.

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

    if (!message) {
      throw new ApiErrorHandler(
        httpStatus.INTERNAL_SERVER_ERROR,
        "AI returned an empty response!",
      );
    }

    return message;
  } catch (error: any) {
    console.error("========== OPENROUTER ERROR ==========");
    console.error(error);

    if (error instanceof ApiErrorHandler) {
      throw error;
    }

    throw new ApiErrorHandler(
      httpStatus.INTERNAL_SERVER_ERROR,
      "AI service is currently unavailable!",
    );
  }
};
