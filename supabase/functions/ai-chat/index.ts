import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "@supabase/supabase-js"

import { buildFinancialContext } from "./helpers/buildFinancialContext.ts"
import { extractQueryParams } from "./helpers/extractQueryParams.ts"
import { buildPromptForUserNeeds } from "./helpers/promptBuilder.ts"
import { detectIntent } from "./helpers/detectIntent.ts"

// Inject this by `supabase secrets set GEMINI_API_KEY=your_actual_key_here`
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")
// Automatically injected by supabase runtime
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders })
    }

    const { question } = await req.json()
    if (!question) {
      return new Response(JSON.stringify({ error: "Missing question" }), { status: 400, headers: corsHeaders })
    }

    const intent = await detectIntent(question, GEMINI_API_KEY!)
    const params = extractQueryParams(question)
    const context = await buildFinancialContext(supabase, user.id, intent, params)
    const prompt = buildPromptForUserNeeds(context, question)

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )

    const geminiData = await geminiRes.json()
    const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I could not generate a response."

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})

