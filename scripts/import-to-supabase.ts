/**
 * Supabase 데이터 임포트 스크립트
 *
 * 사용법:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npx tsx import-to-supabase.ts
 *
 * 필수 환경변수:
 *   - SUPABASE_URL: Supabase 프로젝트 URL
 *   - SUPABASE_SERVICE_KEY: Service Role Key (RLS 우회용)
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============ Types ============

interface Line {
  line_order: number;
  speaker: "npc" | "user";
  text_ja: string;
  text_ja_male?: string | null;
  text_ja_female?: string | null;
  pronunciation_ko: string;
  text_ko: string;
  grammar_hint?: string | null;
  key_expressions: string[];
}

interface GeneratedContent {
  situation_slug: string;
  lines: Line[];
}

interface Situation {
  persona: string;
  persona_ko: string;
  slug: string;
  name_ko: string;
  location_ko: string;
  difficulty: number;
  context: string;
}

// ============ Supabase Client ============

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============ Import Functions ============

async function getPersonaId(slug: string): Promise<number> {
  const { data, error } = await supabase
    .from("personas")
    .select("id")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    throw new Error(`Persona not found: ${slug}`);
  }
  return data.id;
}

async function insertSituation(
  situation: Situation,
  personaId: number
): Promise<number> {
  const { data, error } = await supabase
    .from("situations")
    .upsert(
      {
        persona_id: personaId,
        slug: situation.slug,
        name_ko: situation.name_ko,
        location_ko: situation.location_ko,
        difficulty: situation.difficulty,
        sort_order: 0,
      },
      { onConflict: "persona_id,slug" }
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert situation: ${situation.slug} - ${error?.message}`);
  }
  return data.id;
}

async function insertLine(
  line: Line,
  situationId: number
): Promise<number> {
  const { data, error } = await supabase
    .from("lines")
    .upsert(
      {
        situation_id: situationId,
        line_order: line.line_order,
        speaker: line.speaker,
        text_ja: line.text_ja,
        text_ja_male: line.text_ja_male || null,
        text_ja_female: line.text_ja_female || null,
        pronunciation_ko: line.pronunciation_ko,
        text_ko: line.text_ko,
        grammar_hint: line.grammar_hint || null,
      },
      { onConflict: "situation_id,line_order" }
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert line: ${error?.message}`);
  }
  return data.id;
}

async function insertExpression(
  textJa: string,
  textKo: string = ""
): Promise<number> {
  // First check if expression exists
  const { data: existing } = await supabase
    .from("expressions")
    .select("id")
    .eq("text_ja", textJa)
    .single();

  if (existing) {
    return existing.id;
  }

  // Insert new expression
  const { data, error } = await supabase
    .from("expressions")
    .insert({
      text_ja: textJa,
      text_ko: textKo,
      pronunciation_ko: "",
      tags: [],
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert expression: ${textJa} - ${error?.message}`);
  }
  return data.id;
}

async function linkLineExpression(
  lineId: number,
  expressionId: number
): Promise<void> {
  const { error } = await supabase
    .from("line_expressions")
    .upsert(
      { line_id: lineId, expression_id: expressionId },
      { onConflict: "line_id,expression_id" }
    );

  if (error) {
    console.warn(`Failed to link line ${lineId} to expression ${expressionId}: ${error.message}`);
  }
}

// ============ Main ============

async function main() {
  console.log("📥 Starting import to Supabase...\n");

  // Load situations metadata
  const situationsPath = path.join(__dirname, "situations.json");
  const situationsData = JSON.parse(fs.readFileSync(situationsPath, "utf-8"));
  const situationsMeta: Situation[] = situationsData.situations;

  // Load generated content
  const outputDir = path.join(__dirname, "output");
  const files = fs.readdirSync(outputDir).filter((f) => f.endsWith(".json"));

  console.log(`📋 Found ${files.length} situation files\n`);

  let totalLines = 0;
  let totalExpressions = 0;
  const errors: string[] = [];

  for (const file of files) {
    const slug = file.replace(".json", "");
    const situationMeta = situationsMeta.find((s) => s.slug === slug);

    if (!situationMeta) {
      console.warn(`⚠️  No metadata for ${slug}, skipping`);
      continue;
    }

    try {
      console.log(`📝 Processing: ${situationMeta.name_ko} (${slug})`);

      // Get persona ID
      const personaId = await getPersonaId(situationMeta.persona);

      // Insert situation
      const situationId = await insertSituation(situationMeta, personaId);

      // Load generated content
      const contentPath = path.join(outputDir, file);
      const content: GeneratedContent = JSON.parse(
        fs.readFileSync(contentPath, "utf-8")
      );

      // Insert lines and expressions
      for (const line of content.lines) {
        const lineId = await insertLine(line, situationId);
        totalLines++;

        // Insert expressions and link
        for (const expr of line.key_expressions) {
          const expressionId = await insertExpression(expr);
          await linkLineExpression(lineId, expressionId);
          totalExpressions++;
        }
      }

      console.log(`   ✅ ${content.lines.length} lines imported`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`   ❌ Error: ${message}`);
      errors.push(`${slug}: ${message}`);
    }
  }

  // Summary
  console.log("\n========== Summary ==========");
  console.log(`✅ Total lines: ${totalLines}`);
  console.log(`✅ Total expressions: ${totalExpressions}`);
  console.log(`❌ Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log("\nErrors:");
    errors.forEach((e) => console.log(`  - ${e}`));
  }
}

main().catch(console.error);
