/**
 * 어휘 JLPT 레벨 태깅 스크립트
 *
 * 사용법:
 *   npx tsx tag-jlpt-vocabulary.ts
 *   npx tsx tag-jlpt-vocabulary.ts --dry-run     (변경 없이 통계만 출력)
 *
 * 51개 시나리오 JSON 파일의 vocabulary에 jlpt_level 필드를 추가합니다.
 * analyze-jlpt-gap.py의 N5/N4 단어 리스트를 기반으로 매칭합니다.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============ JLPT 단어 리스트 ============
// analyze-jlpt-gap.py에서 가져온 N5/N4 회화 필수 어휘

const N5_WORDS = new Set([
  // 인사·기본표현
  "おはよう", "おはようございます", "こんにちは", "こんばんは",
  "さようなら", "ありがとう", "ありがとうございます", "すみません",
  "ごめんなさい", "いただきます", "ごちそうさま", "お願いします",
  "はじめまして", "よろしく", "お元気ですか", "大丈夫",
  // 쇼핑·주문
  "ください", "いくら", "高い", "安い", "円", "お金",
  "買う", "売る", "買い物", "店", "お菓子", "果物",
  "お茶", "コーヒー", "お弁当", "お酒", "飲み物",
  "美味しい", "甘い", "辛い", "不味い",
  // 이동·교통
  "行く", "来る", "帰る", "歩く", "走る", "乗る", "降りる",
  "駅", "電車", "バス", "タクシー", "飛行機", "自転車", "車",
  "地下鉄", "切符", "道", "橋", "交差点", "信号",
  "右", "左", "真っ直ぐ", "曲がる", "近い", "遠い",
  "北", "南", "東", "西", "地図",
  // 장소
  "学校", "病院", "銀行", "郵便局", "交番", "公園",
  "図書館", "映画館", "デパート", "スーパー", "レストラン",
  "喫茶店", "ホテル", "アパート", "家", "部屋", "台所",
  "お風呂", "トイレ", "玄関", "庭", "プール",
  // 시간·날짜
  "今日", "明日", "昨日", "今", "朝", "昼", "夜", "晩",
  "午前", "午後", "時間", "月曜日", "火曜日", "水曜日",
  "木曜日", "金曜日", "土曜日", "日曜日",
  "来週", "先週", "今週", "来月", "先月", "今月",
  "春", "夏", "秋", "冬", "休み", "夏休み",
  // 사람·가족
  "人", "男", "女", "子供", "友達", "先生", "学生",
  "お父さん", "お母さん", "お兄さん", "お姉さん", "弟", "妹",
  "父", "母", "兄", "姉", "両親", "家族", "奥さん",
  // 일상동사
  "食べる", "飲む", "見る", "聞く", "読む", "書く", "話す",
  "起きる", "寝る", "洗う", "作る", "持つ", "使う", "待つ",
  "立つ", "座る", "入る", "出る", "出かける", "開ける", "閉める",
  "付ける", "消す", "遊ぶ", "泳ぐ", "教える", "習う",
  "覚える", "忘れる", "分かる", "知る", "思う", "言う",
  "答える", "呼ぶ", "借りる", "貸す", "返す", "渡す",
  "勉強する", "練習する", "掃除する", "洗濯する", "散歩する",
  "質問する", "電話する", "結婚する",
  // 형용사·상태
  "大きい", "小さい", "長い", "短い", "新しい", "古い",
  "広い", "狭い", "明るい", "暗い", "重い", "軽い",
  "多い", "少ない", "早い", "遅い", "速い", "太い", "細い",
  "忙しい", "暇", "楽しい", "面白い", "難しい", "易しい",
  "暑い", "寒い", "暖かい", "涼しい", "痛い",
  "綺麗", "静か", "賑やか", "便利", "不便", "上手", "下手",
  "好き", "嫌い", "大好き", "元気", "丈夫", "大切",
  // 물건·의류
  "本", "新聞", "雑誌", "辞書", "ノート", "鉛筆", "ペン",
  "かばん", "傘", "時計", "眼鏡", "カメラ", "電話",
  "テレビ", "冷蔵庫", "洗濯機", "エアコン",
  "靴", "帽子", "服", "シャツ", "ネクタイ",
  "椅子", "机", "テーブル", "ベッド", "ドア", "窓",
  // 음식
  "ご飯", "パン", "卵", "肉", "魚", "野菜", "果物",
  "牛肉", "豚肉", "鶏肉", "牛乳", "砂糖", "塩",
  "朝ご飯", "昼ご飯", "晩ご飯", "料理",
  // 자연·날씨
  "天気", "雨", "雪", "風", "空", "山", "川", "海",
  "花", "木", "晴れ", "曇り",
  // 의문사·접속
  "何", "誰", "どこ", "いつ", "どう", "どれ", "どの",
  "どちら", "いくつ", "なぜ", "どうして",
  "でも", "だから", "そして", "それから", "まだ", "もう",
  "とても", "ちょっと", "たくさん", "少し", "全部",
  "いつも", "時々", "よく", "多分", "本当",
]);

const N4_WORDS = new Set([
  // 비즈니스·사회
  "会議", "会社", "社長", "部長", "課長",
  "アルバイト", "仕事", "経験", "紹介", "挨拶",
  "連絡", "相談", "準備", "説明", "案内",
  "予定", "予約", "約束", "関係",
  // 일상생활_확장
  "引っ越す", "届ける", "届く", "届け出",
  "払う", "足りる", "足す", "増える", "減る",
  "捨てる", "拾う", "片付ける", "壊れる", "壊す",
  "運ぶ", "集める", "集まる", "決める", "決まる",
  "続ける", "続く", "変わる", "変える",
  "育てる", "生きる", "亡くなる",
  // 감정·의견
  "嬉しい", "悲しい", "寂しい", "恥ずかしい",
  "怖い", "酷い", "優しい", "厳しい", "珍しい",
  "素晴らしい", "美しい", "正しい",
  "安心", "安全", "危険", "簡単", "複雑",
  "特別", "普通", "自由", "必要",
  "意見", "気持ち", "興味", "趣味",
  // 의료·건강
  "歯医者", "怪我", "熱", "血", "注射",
  "入院", "退院", "お見舞い",
  // 주거·생활
  "家賃", "布団", "畳", "壁", "階段",
  "ガス", "水道", "暖房", "冷房",
  "ゴミ", "洗濯物",
  // 이동_확장
  "空港", "飛行場", "港", "坂", "島",
  "急行", "特急", "乗り換え",
  "通う", "通る", "進む", "戻る",
  // 경어·존경
  "いらっしゃる", "召し上がる", "ご覧になる",
  "おっしゃる", "くださる", "差し上がる",
  "参る", "致す", "伺う", "拝見する",
  "ご主人", "ご存じ",
]);

// ============ Types ============

interface VocabItem {
  word_ja: string;
  reading_hiragana: string;
  reading_ko: string;
  meaning_ko: string;
  pos: string;
  appears_in_lines: number[];
  jlpt_level?: string | null;
}

interface SituationFile {
  situation_slug: string;
  lines: unknown[];
  vocabulary?: VocabItem[];
}

// ============ JLPT 매칭 ============

function getJlptLevel(wordJa: string): string | null {
  if (N5_WORDS.has(wordJa)) return "N5";
  if (N4_WORDS.has(wordJa)) return "N4";
  return null;
}

// ============ Main ============

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  const outputDir = path.join(__dirname, "output");
  const files = fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith(".json") && f !== "vocabulary_insert.sql");

  let totalVocab = 0;
  let taggedN5 = 0;
  let taggedN4 = 0;
  let untagged = 0;

  for (const file of files) {
    const filePath = path.join(outputDir, file);
    const data: SituationFile = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    if (!data.vocabulary || data.vocabulary.length === 0) continue;

    for (const vocab of data.vocabulary) {
      totalVocab++;
      const level = getJlptLevel(vocab.word_ja);
      vocab.jlpt_level = level;

      if (level === "N5") taggedN5++;
      else if (level === "N4") taggedN4++;
      else untagged++;
    }

    if (!dryRun) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    }
  }

  console.log(`\n========== JLPT 태깅 결과 ==========`);
  console.log(`전체 단어: ${totalVocab}`);
  console.log(`N5: ${taggedN5} (${((taggedN5 / totalVocab) * 100).toFixed(1)}%)`);
  console.log(`N4: ${taggedN4} (${((taggedN4 / totalVocab) * 100).toFixed(1)}%)`);
  console.log(`미태깅 (N3+): ${untagged} (${((untagged / totalVocab) * 100).toFixed(1)}%)`);

  if (dryRun) {
    console.log("\n(--dry-run: 파일 변경 없음)");
  } else {
    console.log(`\n${files.length}개 파일 업데이트 완료`);
  }
}

main();
