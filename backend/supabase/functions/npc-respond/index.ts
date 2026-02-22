// npc-respond/index.ts
// Claude API를 사용해 NPC 응답 생성

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NpcRespondRequest {
  userText: string;
  expectedText: string;
  situation: string;
  nextNpcLine?: string;
  errorHistory: { text: string; type: string }[];
}

interface NpcRespondResponse {
  npcText: string;
  feedbackType: "none" | "recast" | "clarification" | "meta_hint";
  errorType?: string;
  recastHighlight?: string;
  metaHint?: string;
}

function buildPrompt(req: NpcRespondRequest): string {
  const errorSummary =
    req.errorHistory.length > 0
      ? `\n학습자 오류 이력: ${req.errorHistory.map((e) => `"${e.text}" (${e.type})`).join(", ")}`
      : "";

  return `당신은 일본어 회화 연습 상대(NPC)입니다. 자연스러운 일본어로 응답하세요.

상황: ${req.situation || "일상 대화"}
학습자가 말한 문장: "${req.userText}"
기대했던 문장: "${req.expectedText}"
${req.nextNpcLine ? `다음 NPC 대사 (대화 흐름용): "${req.nextNpcLine}"` : ""}${errorSummary}

규칙:
1. 학습자의 문장과 기대 문장을 비교하세요.
2. 완전히 맞거나 거의 맞으면 feedbackType: "none"으로 대화를 이어가세요.
3. 의미는 통하지만 문법/표현이 다르면 feedbackType: "recast"로 올바른 표현을 자연스럽게 되풀이하세요.
4. 의미를 알 수 없으면 feedbackType: "clarification"으로 다시 말해달라고 요청하세요.
5. 같은 유형의 오류가 2회 이상 반복되면 feedbackType: "meta_hint"로 한국어 힌트를 제공하세요.

JSON으로만 응답하세요:
{
  "npcText": "NPC의 일본어 응답",
  "feedbackType": "none|recast|clarification|meta_hint",
  "recastHighlight": "교정된 부분 (recast/meta_hint일 때만)",
  "metaHint": "한국어 학습 힌트 (meta_hint일 때만)"
}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: NpcRespondRequest = await req.json();

    if (!body.userText || !body.expectedText) {
      return new Response(
        JSON.stringify({ error: "userText and expectedText are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: "Anthropic API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const prompt = buildPrompt(body);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Claude API call failed" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await response.json();
    const textContent = result.content?.[0]?.text ?? "";

    // Claude 응답에서 JSON 파싱
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to parse Claude response:", textContent);
      return new Response(
        JSON.stringify({ error: "Invalid Claude response format" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const parsed: NpcRespondResponse = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in npc-respond:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
