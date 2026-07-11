import Mistral from "@mistralai/mistralai";

const mistral = new Mistral(
  process.env.NEXT_PUBLIC_MISTRAL_API_KEY || ""
);

export const PRICING: Record<string, { input: number; output: number }> = {
  "mistral-tiny": { input: 0.00025, output: 0.00025 },
  "mistral-small": { input: 0.001, output: 0.001 },
  "mistral-medium": { input: 0.0025, output: 0.0025 },
};

export async function callMistral(model: string, messages: any[], options: any = {}) {
  const startTime = Date.now();
  try {
    const response = await mistral.chat({
      model,
      messages,
      ...options,
    });
    const latency = (Date.now() - startTime) / 1000;
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const cost = (inputTokens * PRICING[model]?.input + outputTokens * PRICING[model]?.output) / 1000;

    return {
      success: true,
      response: response.choices[0]?.message?.content || "",
      cost,
      latency,
      model,
      inputTokens,
      outputTokens,
      prompt: messages[messages.length - 1]?.content || "",
    };
  } catch (error: any) {
    const latency = (Date.now() - startTime) / 1000;
    return {
      success: false,
      error: error.message,
      cost: 0,
      latency,
      model,
      inputTokens: 0,
      outputTokens: 0,
      prompt: messages[messages.length - 1]?.content || "",
    };
  }
}