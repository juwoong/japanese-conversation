/**
 * 어휘 자동 추출 스크립트
 *
 * 사용법:
 *   ANTHROPIC_API_KEY=your_key npx ts-node generate-vocabulary.ts
 *
 * 옵션:
 *   --situation=cafe    특정 상황만 생성
 *   --dry-run          API 호출 없이 프롬프트만 출력
 */

import Anthropic from "@anthropic-ai/sdk";
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
  text_ko: string;
  pronunciation_ko: string;
  grammar_hint?: string | null;
  key_expressions: string[];
}

interface VocabItem {
  word_ja: string;
  reading_hiragana: string;
  reading_ko: string;
  meaning_ko: string;
  pos: string;
  appears_in_lines: number[];
}

interface SituationFile {
  situation_slug: string;
  lines: Line[];
  vocabulary?: VocabItem[];
}

const VALID_POS = ["명사", "동사", "형용사", "부사", "표현", "접속사", "감탄사"];

// ============ Prompt Builder ============

function buildPrompt(lines: Line[]): string {
  const linesList = lines
    .map((l) => `  - line_order ${l.line_order} (${l.speaker}): ${l.text_ja}`)
    .join("\n");

  return `## Task
일본어 회화 대사에서 학습 가치가 있는 개별 단어/표현을 추출해주세요.

## Input Lines
${linesList}

## Extraction Rules
- 각 대사에서 학습할 만한 단어와 표현을 추출
- 조사(は、が、を、に 등)는 단독으로 추출하지 않음
- 접속사(そして、でも 등)는 학습 가치가 있으면 포함
- 동사는 사전형(辞書形)으로 변환 (例: 食べます → 食べる)
- 한 상황당 10~20개 정도가 적당
- 중복 단어는 한 번만 추출하되 appears_in_lines에 모든 등장 라인 번호 포함

## 발음 표기 규칙
- 장음: "오오" 대신 "오-"로 표기 (例: とうきょう → 토-쿄-)
- 촉음: 작은 っ는 다음 자음을 겹쳐서 (例: きって → 킷테)
- ん: 받침 ㄴ으로 (例: かんこく → 칸코쿠)

## pos values
명사, 동사, 형용사, 부사, 표현, 접속사, 감탄사

## Output Format (JSON only, no other text)
{
  "vocabulary": [
    {
      "word_ja": "ご注文",
      "reading_hiragana": "ごちゅうもん",
      "reading_ko": "고츄-몬",
      "meaning_ko": "주문",
      "pos": "명사",
      "appears_in_lines": [1]
    }
  ]
}`;
}

// ============ API Call ============

async function extractVocabulary(
  client: Anthropic,
  slug: string,
  lines: Line[]
): Promise<VocabItem[]> {
  const prompt = buildPrompt(lines);

  console.log(`\n📝 Extracting vocabulary: ${slug}`);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  // Extract text from response
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text in response");
  }

  // Parse JSON from response
  const jsonMatch = textBlock.text.match(/```json\n?([\s\S]*?)\n?```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : textBlock.text;

  try {
    const parsed = JSON.parse(jsonStr) as { vocabulary: VocabItem[] };
    return parsed.vocabulary;
  } catch (e) {
    console.error("Failed to parse JSON:", jsonStr);
    throw e;
  }
}

// ============ Validation ============

function validateVocabulary(
  vocabulary: VocabItem[],
  lines: Line[]
): string[] {
  const warnings: string[] = [];
  const validLineOrders = lines.map((l) => l.line_order);

  vocabulary.forEach((item, i) => {
    if (!item.word_ja) {
      warnings.push(`Vocab ${i}: missing word_ja`);
    }
    if (!item.reading_hiragana) {
      warnings.push(`Vocab ${i}: missing reading_hiragana`);
    }
    if (!item.reading_ko) {
      warnings.push(`Vocab ${i}: missing reading_ko`);
    }
    if (!item.meaning_ko) {
      warnings.push(`Vocab ${i}: missing meaning_ko`);
    }
    if (!item.pos || !VALID_POS.includes(item.pos)) {
      warnings.push(
        `Vocab ${i} (${item.word_ja}): invalid pos "${item.pos}"`
      );
    }
    if (!Array.isArray(item.appears_in_lines) || item.appears_in_lines.length === 0) {
      warnings.push(
        `Vocab ${i} (${item.word_ja}): appears_in_lines is empty or missing`
      );
    } else {
      item.appears_in_lines.forEach((lineNum) => {
        if (!validLineOrders.includes(lineNum)) {
          warnings.push(
            `Vocab ${i} (${item.word_ja}): invalid line_order ${lineNum}`
          );
        }
      });
    }
  });

  return warnings;
}

// ============ Main ============

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const situationFilter = args
    .find((a) => a.startsWith("--situation="))
    ?.split("=")[1];

  const outputDir = path.join(__dirname, "output");

  // Find all JSON files in output/
  let slugs = fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));

  // Filter if specified
  if (situationFilter) {
    slugs = slugs.filter((s) => s === situationFilter);
    if (slugs.length === 0) {
      console.error(`Situation not found: ${situationFilter}`);
      process.exit(1);
    }
  }

  console.log(`📋 Total situations: ${slugs.length}`);

  if (dryRun) {
    // Just print the prompt for the first situation
    const firstFile = path.join(outputDir, `${slugs[0]}.json`);
    const data = JSON.parse(fs.readFileSync(firstFile, "utf-8")) as SituationFile;
    console.log("\n--- DRY RUN: Prompt Preview ---\n");
    console.log(buildPrompt(data.lines));
    return;
  }

  // Initialize Anthropic client
  const client = new Anthropic();

  const results: { success: string[]; failed: string[] } = {
    success: [],
    failed: [],
  };

  for (const slug of slugs) {
    try {
      const filePath = path.join(outputDir, `${slug}.json`);
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as SituationFile;

      const vocabulary = await extractVocabulary(client, slug, data.lines);

      // Validate
      const warnings = validateVocabulary(vocabulary, data.lines);
      if (warnings.length > 0) {
        console.warn(`⚠️  Validation warnings for ${slug}:`);
        warnings.forEach((w) => console.warn(`   - ${w}`));
      }

      // Merge vocabulary into existing data and save
      data.vocabulary = vocabulary;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      console.log(
        `✅ Saved ${vocabulary.length} vocab items: ${filePath}`
      );

      results.success.push(slug);

      // Rate limiting - wait 1 second between calls
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Failed: ${slug}`, error);
      results.failed.push(slug);
    }
  }

  // Summary
  console.log("\n========== Summary ==========");
  console.log(`✅ Success: ${results.success.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  if (results.failed.length > 0) {
    console.log(`Failed situations: ${results.failed.join(", ")}`);
  }
}

main().catch(console.error);
