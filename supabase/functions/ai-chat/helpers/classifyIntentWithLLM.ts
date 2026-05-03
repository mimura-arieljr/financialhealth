import { Intent } from "../types/intent.ts";
import { buildPromptForIntent } from "./promptBuilder.ts";

export async function classifyIntentWithLLM(
  question: string,
  geminiApiKey: string,
): Promise<Intent> {
  const prompt = buildPromptForIntent(question);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );

    const data = await res.json();
    const raw =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase() ??
        "";

    const valid: Intent[] = ["expenses", "income", "budget", "general"];
    const intent = valid.includes(raw as Intent) ? (raw as Intent) : "general";
    console.log(`Classified intent by LLM: ${intent} (raw: "${raw}")`);
    return intent;
  } catch {
    return "general";
  }
}
