// npc-respond/index.ts
// Claude API를 사용해 NPC 응답 생성

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VALID_FEEDBACK_TYPES = new Set([
  "none",
  "recast",
  "clarification",
  "meta_hint",
]);

const MAX_INPUT_LENGTH = 200;
const CLAUDE_TIMEOUT_MS = 12_000;

interface NpcRespondRequest {
  userText: string;
  expectedText: string;
  situation: string;
  nextNpcLine?: string;
  errorHistory: { text: string; type: string }[];
  personaSlug?: string;
}

const PERSONA_TONE_RULES: Record<string, string> = {
  business:
    "학습자는 비즈니스 상황입니다. 경어(です/ます/敬語) 사용을 기대하세요. 반말을 쓰면 정중한 표현으로 부드럽게 교정(recast)하세요.",
  tourist:
    "학습자는 관광 중입니다. 기본 정중체(です/ます)를 사용하되, 약간 단순한 표현도 자연스럽게 허용하세요.",
  workingholiday:
    "학습자는 일상 생활에서 대화 중입니다. 친근한 표현이나 반말도 자연스럽게 받아들이세요. 경어를 쓰면 칭찬하되 강요하지 마세요.",
};

const BASE_SYSTEM_PROMPT = `당신은 일본어 회화 연습 상대(NPC)입니다. 자연스러운 일본어로 응답하세요.

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

function buildSystemPrompt(personaSlug?: string): string {
  const toneRule =
    PERSONA_TONE_RULES[personaSlug ?? "tourist"] ?? PERSONA_TONE_RULES.tourist;
  return `${BASE_SYSTEM_PROMPT}\n\n톤 규칙: ${toneRule}`;
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) : text;
}

function buildUserMessage(req: NpcRespondRequest): string {
  const errorSummary =
    req.errorHistory.length > 0
      ? `\n학습자 오류 이력: ${req.errorHistory.map((e) => `"${e.text}" (${e.type})`).join(", ")}`
      : "";

  return `상황: ${req.situation || "일상 대화"}
학습자가 말한 문장: "${truncate(req.userText, MAX_INPUT_LENGTH)}"
기대했던 문장: "${truncate(req.expectedText, MAX_INPUT_LENGTH)}"
${req.nextNpcLine ? `다음 NPC 대사 (대화 흐름용): "${req.nextNpcLine}"` : ""}${errorSummary}`;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // #1: Auth 검증 — submit-attempt 패턴과 동일
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return jsonResponse({ error: "Invalid token" }, 401);
    }

    const body: NpcRespondRequest = await req.json();

    if (!body.userText || !body.expectedText) {
      return jsonResponse(
        { error: "userText and expectedText are required" },
        400,
      );
    }

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return jsonResponse({ error: "Anthropic API key not configured" }, 500);
    }

    // #7: Fetch timeout via AbortController
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CLAUDE_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 400,
          system: buildSystemPrompt(body.personaSlug),
          messages: [{ role: "user", content: buildUserMessage(body) }],
        }),
        signal: controller.signal,
      });
    } catch (fetchError) {
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        console.error("Claude API timeout after", CLAUDE_TIMEOUT_MS, "ms");
        return jsonResponse({ error: "Claude API timeout" }, 504);
      }
      throw fetchError;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      return jsonResponse({ error: "Claude API call failed" }, 502);
    }

    const result = await response.json();
    const textContent = result.content?.[0]?.text ?? "";

    // Claude 응답에서 JSON 추출
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in Claude response:", textContent);
      return jsonResponse({ error: "Invalid Claude response format" }, 502);
    }

    // #2: JSON.parse 가드
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("JSON parse failed:", jsonMatch[0]);
      return jsonResponse({ error: "Malformed JSON from Claude" }, 502);
    }

    // #3: feedbackType 유효성 검증
    if (!parsed.npcText || !VALID_FEEDBACK_TYPES.has(parsed.feedbackType as string)) {
      console.error("Invalid response shape:", parsed);
      return jsonResponse({ error: "Invalid Claude response shape" }, 502);
    }

    return jsonResponse({
      npcText: parsed.npcText,
      feedbackType: parsed.feedbackType,
      recastHighlight: parsed.recastHighlight ?? undefined,
      metaHint: parsed.metaHint ?? undefined,
    });
  } catch (error) {
    console.error("Error in npc-respond:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
