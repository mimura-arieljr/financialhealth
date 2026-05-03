import { classifyIntentWithLLM } from "./classifyIntentWithLLM.ts"
import { Intent } from "../types/intent.ts"
import { INTENT_PATTERNS } from "./intentPatterns.ts"

const CONFIDENCE_THRESHOLD = 2
const AMBIGUITY_MARGIN = 1

function scoreKeywords(question: string): Record<Exclude<Intent, "general">, number> {
  const scores = { expenses: 0, income: 0, budget: 0 }

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS) as [Exclude<Intent, "general">, typeof INTENT_PATTERNS[Exclude<Intent, "general">]][]) {
    for (const { pattern, score } of patterns) {
      if (pattern.test(question)) scores[intent] += score
    }
  }

  return scores
}

export async function detectIntent(question: string, geminiApiKey: string): Promise<Intent> {
  const scores = scoreKeywords(question)

  const ranked = (Object.entries(scores) as [Exclude<Intent, "general">, number][])
    .sort((a, b) => b[1] - a[1])

  const [top, second] = ranked
  const isConfident = top[1] >= CONFIDENCE_THRESHOLD &&
    (top[1] - (second?.[1] ?? 0)) > AMBIGUITY_MARGIN

  if (!isConfident) {
    console.log("Intent not detected manually. Falling back to LLM:", { scores, question })
  }

  if (isConfident){
    console.log(`Intent detected by keyword scoring: ${top[0]} (score: ${top[1]}, second: ${second?.[0]} (score: ${second?.[1] ?? 0}))`)
    return top[0]
  }

  return await classifyIntentWithLLM(question, geminiApiKey)
}
