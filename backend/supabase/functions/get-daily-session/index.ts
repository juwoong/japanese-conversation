// get-daily-session/index.ts
// Composes daily learning session with review cards and new content

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SessionLine {
  id: number;
  line_order: number;
  speaker: string;
  text_ja: string;
  text_ja_male: string | null;
  text_ja_female: string | null;
  pronunciation_ko: string;
  text_ko: string;
  grammar_hint: string | null;
  situation_id: number;
  situation_name: string;
}

interface DailySessionResponse {
  reviewCards: any[];
  newLines: SessionLine[];
  totalCount: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    // 1. Get due review cards
    const { data: dueCards } = await supabase
      .from("srs_cards")
      .select(`
        *,
        lines (
          id,
          line_order,
          speaker,
          text_ja,
          text_ja_male,
          text_ja_female,
          pronunciation_ko,
          text_ko,
          grammar_hint,
          situation_id,
          situations (name_ko)
        )
      `)
      .eq("user_id", user.id)
      .lte("due_date", today)
      .neq("state", "new")
      .order("due_date")
      .limit(20);

    // 2. Get user's primary persona
    const { data: userPersona } = await supabase
      .from("user_personas")
      .select("persona_id")
      .eq("user_id", user.id)
      .eq("is_primary", true)
      .single();

    // 3. Get available situations (not locked)
    const { data: availableSituations } = await supabase
      .from("user_situation_progress")
      .select("situation_id")
      .eq("user_id", user.id)
      .in("status", ["available", "in_progress"]);

    const situationIds = availableSituations?.map((s) => s.situation_id) || [];

    // 4. Get new lines from available situations (lines not yet in SRS)
    let newLines: SessionLine[] = [];

    if (situationIds.length > 0) {
      // Get lines that user hasn't seen yet
      const { data: existingCards } = await supabase
        .from("srs_cards")
        .select("line_id")
        .eq("user_id", user.id);

      const existingLineIds = existingCards?.map((c) => c.line_id) || [];

      const { data: lines } = await supabase
        .from("lines")
        .select(`
          id,
          line_order,
          speaker,
          text_ja,
          text_ja_male,
          text_ja_female,
          pronunciation_ko,
          text_ko,
          grammar_hint,
          situation_id,
          situations (name_ko)
        `)
        .in("situation_id", situationIds)
        .order("situation_id")
        .order("line_order");

      if (lines) {
        newLines = lines
          .filter((l) => !existingLineIds.includes(l.id))
          .slice(0, 10)
          .map((l) => ({
            ...l,
            situation_name: l.situations?.name_ko || "",
          }));
      }
    }

    // 5. Compose session (70% review, 30% new - approximately)
    const reviewCount = dueCards?.length || 0;
    const newCount = newLines.length;

    const response: DailySessionResponse = {
      reviewCards: dueCards || [],
      newLines,
      totalCount: reviewCount + newCount,
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-daily-session:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
