import { Intent } from "../types/intent.ts";

export type IntentPattern = { pattern: RegExp; score: number };

export const INTENT_PATTERNS: Record<
  Exclude<Intent, "general">,
  IntentPattern[]
> = {
  expenses: [
    // Phrases (score 3)
    { pattern: /how much did i spend/i, score: 3 },
    { pattern: /what did i spend/i, score: 3 },
    { pattern: /my expenses/i, score: 3 },
    { pattern: /total spending/i, score: 3 },
    { pattern: /biggest (?:spend|expense)/i, score: 3 },
    { pattern: /top (?:spend|expense)/i, score: 3 },
    { pattern: /spend(?:ing)? categor/i, score: 3 },
    { pattern: /where (?:do i|am i) spend/i, score: 3 },
    { pattern: /most (?:expensive|i spend)/i, score: 3 },
    { pattern: /highest (?:expense|spend)/i, score: 3 },
    // Natural conversational spending questions
    { pattern: /what did i buy/i, score: 3 },
    { pattern: /where did my money go/i, score: 3 },
    { pattern: /what am i spending on/i, score: 3 },
    { pattern: /what am i buying/i, score: 3 },
    { pattern: /how much did i use/i, score: 3 },
    { pattern: /what are my expenses/i, score: 3 },
    { pattern: /show my spending/i, score: 3 },

    // Overspending behavior
    { pattern: /am i overspending/i, score: 3 },
    { pattern: /why am i spending so much/i, score: 3 },
    { pattern: /why is my spending high/i, score: 3 },

    // Category exploration
    { pattern: /spending breakdown/i, score: 3 },
    { pattern: /expense breakdown/i, score: 3 },
    { pattern: /spending by category/i, score: 3 },

    // Partial phrases (score 2)
    { pattern: /spent on/i, score: 2 },
    { pattern: /paying for/i, score: 2 },
    { pattern: /cost me/i, score: 2 },
    { pattern: /paid for/i, score: 2 },
    // Partial conversational
    { pattern: /what i spent/i, score: 2 },
    { pattern: /i spent on/i, score: 2 },
    { pattern: /money went to/i, score: 2 },
    // Keywords (score 1)
    { pattern: /spend/i, score: 1 },
    { pattern: /expense/i, score: 1 },
    { pattern: /spent/i, score: 1 },
    { pattern: /purchase/i, score: 1 },
    { pattern: /bought/i, score: 1 },
    { pattern: /buy/i, score: 1 },
  ],

  income: [
    // Phrases (score 3)
    { pattern: /how much did i earn/i, score: 3 },
    { pattern: /how much i make/i, score: 3 },
    { pattern: /my income/i, score: 3 },
    // Real-world phrasing
    { pattern: /how much did i get paid/i, score: 3 },
    { pattern: /what did i earn/i, score: 3 },
    { pattern: /how much came in/i, score: 3 },
    { pattern: /money i made/i, score: 3 },
    { pattern: /total earnings/i, score: 3 },

    // Job-related phrasing
    { pattern: /my salary this month/i, score: 3 },
    { pattern: /paycheck amount/i, score: 3 },

    // Partial phrases (score 2)
    { pattern: /salary/i, score: 2 },
    { pattern: /paycheck/i, score: 2 },
    { pattern: /earned/i, score: 2 },
    // Conversational
    { pattern: /how much money did i get/i, score: 2 },
    { pattern: /what came in/i, score: 2 },
    // Keywords (score 1)
    { pattern: /income/i, score: 1 },
    { pattern: /earn/i, score: 1 },
    { pattern: /revenue/i, score: 1 },
  ],

  budget: [
    // Phrases (score 3)
    { pattern: /am i on track/i, score: 3 },
    { pattern: /can i afford/i, score: 3 },
    { pattern: /(?:be able to|will i) afford/i, score: 3 },
    { pattern: /how much can i save/i, score: 3 },
    { pattern: /saving enough/i, score: 3 },
    { pattern: /(?:current|total|my)\s+(?:account\s+)?balance/i, score: 3 },
    { pattern: /what(?:'s| is) my balance/i, score: 3 },
    { pattern: /how much (?:do i have|money do i have)/i, score: 3 },
    // Affordability + survival language
    { pattern: /can i still afford/i, score: 3 },
    { pattern: /am i okay financially/i, score: 3 },
    { pattern: /am i doing okay/i, score: 3 },
    { pattern: /can i survive/i, score: 3 },
    { pattern: /will i have enough/i, score: 3 },

    // Balance interpretation (IMPORTANT edge case)
    { pattern: /is my balance enough/i, score: 3 },
    { pattern: /do i have enough money/i, score: 3 },

    // Planning behavior
    { pattern: /how should i budget/i, score: 3 },
    { pattern: /budget planning/i, score: 3 },
    { pattern: /help me save/i, score: 3 },

    // Anxiety / uncertainty signals
    { pattern: /i feel like i am spending too much/i, score: 3 },
    { pattern: /i think i am broke/i, score: 3 },

    // Partial phrases (score 2)
    { pattern: /financial health/i, score: 2 },
    { pattern: /budget for/i, score: 2 },
    { pattern: /monthly budget/i, score: 2 },
    { pattern: /afford a/i, score: 2 },
    { pattern: /monthly (?:rent|loan|payment|bill)/i, score: 2 },
    // Weak budget signals
    { pattern: /should i spend/i, score: 2 },
    { pattern: /is it okay to buy/i, score: 2 },
    // Keywords (score 1)
    { pattern: /save/i, score: 1 },
    { pattern: /budget/i, score: 1 },
    { pattern: /afford/i, score: 1 },
    { pattern: /goal/i, score: 1 },
    { pattern: /balance/i, score: 1 },
  ],
};
