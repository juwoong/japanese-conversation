/**
 * Furigana 생성 스크립트
 *
 * 기존 output/*.json 파일의 각 line에 furigana 배열을 추가합니다.
 * Gemini API를 사용하여 정확한 furigana segmentation을 생성합니다.
 *
 * 사용법:
 *   GEMINI_API_KEY=your_key npx tsx add-furigana.ts
 *
 * 옵션:
 *   --dry-run    API 호출 없이 프롬프트만 출력
 *   --file=cafe  특정 파일만 처리
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, "..", ".env") });

// ============ Types ============

interface FuriganaSegment {
  text: string;
  reading?: string;
}

interface LineData {
  line_order: number;
  speaker: string;
  text_ja: string;
  text_ja_male: string | null;
  text_ja_female: string | null;
  furigana?: FuriganaSegment[];
  [key: string]: unknown;
}

interface SituationFile {
  situation_slug: string;
  lines: LineData[];
  [key: string]: unknown;
}

// ============ Prompt ============

function buildPrompt(lines: { text_ja: string }[]): string {
  const examples = lines.map((l) => l.text_ja).join("\n");

  return `You are a Japanese language expert. For each Japanese sentence below, produce a furigana segmentation as a JSON array.

Rules:
- Split text at kanji boundaries. Each segment is {text, reading?}.
- "reading" is hiragana, present ONLY when "text" contains kanji.
- Okurigana (hiragana suffixes of verbs/adjectives) must NOT be in the reading. Only the kanji part gets a reading.
  Example: "食べる" → [{"text":"食","reading":"た"},{"text":"べる"}]
- Compound kanji get a single reading: "注文" → {"text":"注文","reading":"ちゅうもん"}
- Honorific prefixes (ご, お) that are already hiragana are plain segments, not part of kanji reading.
  Example: "ご注文" → [{"text":"ご"},{"text":"注文","reading":"ちゅうもん"}]
- Katakana words: no reading needed. "アイスコーヒー" → {"text":"アイスコーヒー"}
- Punctuation stays with adjacent non-kanji text.
- Concatenating all segment "text" fields must exactly reproduce the original sentence.

Return a JSON object mapping each sentence to its furigana array:
{
  "results": [
    {"text_ja": "...", "furigana": [...]},
    ...
  ]
}

Sentences:
${examples}`;
}

// ============ Main ============

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const fileArg = args.find((a) => a.startsWith("--file="))?.split("=")[1];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey && !dryRun) {
    console.error("GEMINI_API_KEY is required. Set it in .env or pass as env var.");
    process.exit(1);
  }

  const outputDir = path.join(__dirname, "output");
  let files = fs.readdirSync(outputDir).filter((f) => f.endsWith(".json"));
  if (fileArg) {
    files = files.filter((f) => f.replace(".json", "") === fileArg);
  }

  console.log(`Processing ${files.length} files...`);

  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  const model = genAI?.getGenerativeModel({ model: "gemini-2.0-flash" });

  for (const file of files) {
    const filePath = path.join(outputDir, file);
    const data: SituationFile = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Collect all unique text_ja (including gender variants)
    const textsToProcess: { text_ja: string; lineIndex: number; variant: string }[] = [];

    data.lines.forEach((line, i) => {
      textsToProcess.push({ text_ja: line.text_ja, lineIndex: i, variant: "default" });
      if (line.text_ja_male) {
        textsToProcess.push({ text_ja: line.text_ja_male, lineIndex: i, variant: "male" });
      }
      if (line.text_ja_female) {
        textsToProcess.push({ text_ja: line.text_ja_female, lineIndex: i, variant: "female" });
      }
    });

    const prompt = buildPrompt(textsToProcess);

    if (dryRun) {
      console.log(`\n--- ${file} ---`);
      console.log(prompt);
      continue;
    }

    console.log(`  ${file}: ${textsToProcess.length} texts...`);

    try {
      const result = await model!.generateContent(prompt);
      const responseText = result.response.text();

      // Extract JSON from response (may be wrapped in ```json ... ```)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`  ${file}: Failed to parse response`);
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        results: { text_ja: string; furigana: FuriganaSegment[] }[];
      };

      // Map results back to lines
      const furiganaMap = new Map<string, FuriganaSegment[]>();
      for (const r of parsed.results) {
        furiganaMap.set(r.text_ja, r.furigana);
      }

      // Apply to lines (default text_ja only for now)
      let applied = 0;
      for (const line of data.lines) {
        const furigana = furiganaMap.get(line.text_ja);
        if (furigana) {
          // Validate: concatenated text must match original
          const concat = furigana.map((s) => s.text).join("");
          if (concat === line.text_ja) {
            line.furigana = furigana;
            applied++;
          } else {
            console.warn(
              `  ${file} line ${line.line_order}: concat mismatch "${concat}" vs "${line.text_ja}"`
            );
            line.furigana = furigana; // still set, but warn
            applied++;
          }
        }
      }

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
      console.log(`  ${file}: ${applied}/${data.lines.length} lines updated`);

      // Rate limiting
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  ${file}: API error:`, err);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
