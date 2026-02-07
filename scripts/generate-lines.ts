/**
 * 대사 자동 생성 스크립트
 *
 * 사용법:
 *   GEMINI_API_KEY=your_key npx ts-node generate-lines.ts
 *
 * 옵션:
 *   --situation=cafe    특정 상황만 생성
 *   --dry-run          API 호출 없이 프롬프트만 출력
 */

import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env
config({ path: path.join(__dirname, "..", ".env") });

// ============ Types ============

interface Situation {
  persona: string;
  persona_ko: string;
  slug: string;
  name_ko: string;
  location_ko: string;
  difficulty: number;
  context: string;
}

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

// ============ Prompt Builder ============

function buildPrompt(situation: Situation): string {
  const difficultyGuide: Record<number, string> = {
    1: "입문 - 단어 중심, 짧은 문장, 기본 경어 (です/ます). 한 문장에 3-5단어.",
    2: "초급 - 완전한 문장, 조사 정확히, 다양한 표현. 한 문장에 5-8단어.",
    3: "중급 - 자연스러운 구어체, 상황별 뉘앙스, 경어 변형. 복잡한 표현 가능.",
  };

  return `## Task
일본어 회화 학습 앱의 대화 스크립트를 생성해주세요.

## Context
- 학습자: 한국인, 일본어 초보~중급
- 목적: 실제 상황에서 바로 쓸 수 있는 실용 회화
- 형식: NPC와 사용자의 대화 (총 5턴)

## Situation
- 페르소나: ${situation.persona_ko}
- 상황: ${situation.name_ko}
- 장소: ${situation.location_ko}
- 상황 설명: ${situation.context}
- 난이도: ${situation.difficulty} (${difficultyGuide[situation.difficulty]})

## Requirements

### 대화 구조
- 총 5개의 대사 (5턴)
- NPC가 먼저 시작
- speaker가 교차되어야 함 (npc → user → npc → user → npc)

### 난이도별 지침
${difficultyGuide[situation.difficulty]}

### 성별 처리
- 기본(text_ja): 중성적 표현
- 남성(text_ja_male): 僕 사용, 남성적 어미 (필요한 경우만, 아니면 null)
- 여성(text_ja_female): 私 사용, 여성적 어미 (필요한 경우만, 아니면 null)
- 대부분의 NPC 대사는 성별 차이 없음

### 발음 표기 규칙
- 장음: "오오" 대신 "오-"로 표기 (예: とうきょう → 토-쿄-)
- 촉음: 작은 っ는 다음 자음을 겹쳐서 (예: きって → 킷테)
- ん: 받침 ㄴ으로 (예: かんこく → 칸코쿠)

## Output Format
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력.

\`\`\`json
{
  "situation_slug": "${situation.slug}",
  "lines": [
    {
      "line_order": 1,
      "speaker": "npc",
      "text_ja": "일본어 대사",
      "text_ja_male": null,
      "text_ja_female": null,
      "pronunciation_ko": "한글 발음",
      "text_ko": "한국어 번역",
      "grammar_hint": "문법 설명 (선택, 없으면 null)",
      "key_expressions": ["핵심", "표현"]
    }
  ]
}
\`\`\``;
}

// ============ API Call ============

async function generateLines(
  model: GenerativeModel,
  situation: Situation
): Promise<GeneratedContent> {
  const prompt = buildPrompt(situation);

  console.log(`\n📝 Generating: ${situation.name_ko} (${situation.slug})`);

  const response = await model.generateContent(prompt);
  const text = response.response.text();

  // Parse JSON from response
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : text;

  try {
    const parsed = JSON.parse(jsonStr) as GeneratedContent;
    return parsed;
  } catch (e) {
    console.error("Failed to parse JSON:", jsonStr);
    throw e;
  }
}

// ============ Validation ============

function validateContent(content: GeneratedContent): string[] {
  const errors: string[] = [];

  if (content.lines.length !== 5) {
    errors.push(`Expected 5 lines, got ${content.lines.length}`);
  }

  const expectedSpeakers = ["npc", "user", "npc", "user", "npc"];
  content.lines.forEach((line, i) => {
    if (line.speaker !== expectedSpeakers[i]) {
      errors.push(
        `Line ${i + 1}: expected speaker ${expectedSpeakers[i]}, got ${line.speaker}`
      );
    }
    if (!line.text_ja) errors.push(`Line ${i + 1}: missing text_ja`);
    if (!line.text_ko) errors.push(`Line ${i + 1}: missing text_ko`);
    if (!line.pronunciation_ko)
      errors.push(`Line ${i + 1}: missing pronunciation_ko`);
  });

  return errors;
}

// ============ Main ============

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const situationFilter = args
    .find((a) => a.startsWith("--situation="))
    ?.split("=")[1];

  // Load situations
  const situationsPath = path.join(__dirname, "situations.json");
  const situationsData = JSON.parse(fs.readFileSync(situationsPath, "utf-8"));
  let situations: Situation[] = situationsData.situations;

  // Filter if specified
  if (situationFilter) {
    situations = situations.filter((s) => s.slug === situationFilter);
    if (situations.length === 0) {
      console.error(`Situation not found: ${situationFilter}`);
      process.exit(1);
    }
  }

  console.log(`📋 Total situations: ${situations.length}`);

  if (dryRun) {
    // Just print the prompt for the first situation
    console.log("\n--- DRY RUN: Prompt Preview ---\n");
    console.log(buildPrompt(situations[0]));
    return;
  }

  // Initialize Gemini client
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is required");
    process.exit(1);
  }
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: "gemini-2.0-flash",
  });

  const outputDir = path.join(__dirname, "output");
  const results: { success: string[]; failed: string[] } = {
    success: [],
    failed: [],
  };

  for (const situation of situations) {
    try {
      const content = await generateLines(model, situation);

      // Validate
      const errors = validateContent(content);
      if (errors.length > 0) {
        console.warn(`⚠️  Validation warnings for ${situation.slug}:`);
        errors.forEach((e) => console.warn(`   - ${e}`));
      }

      // Save to file
      const outputPath = path.join(outputDir, `${situation.slug}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(content, null, 2), "utf-8");
      console.log(`✅ Saved: ${outputPath}`);

      results.success.push(situation.slug);

      // Rate limiting - wait 1 second between calls
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Failed: ${situation.slug}`, error);
      results.failed.push(situation.slug);
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
