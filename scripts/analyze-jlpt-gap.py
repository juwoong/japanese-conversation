#!/usr/bin/env python3
"""JLPT N5/N4 어휘 vs 기존 대화 콘텐츠 갭 분석

기존 22개 상황의 어휘를 JLPT N5/N4 리스트와 비교하여
- 이미 커버된 단어
- 대화에서 빠진 중요 단어
- 변형 시나리오에서 추가할 수 있는 단어 그룹
을 분석합니다.
"""

import json
import glob
import os

# ── 1. 기존 대화 콘텐츠에서 어휘 추출 ──────────────────────
def extract_existing_vocab(output_dir):
    """scripts/output/*.json에서 모든 어휘와 표현을 추출"""
    existing = set()
    by_situation = {}

    for f in sorted(glob.glob(os.path.join(output_dir, '*.json'))):
        name = os.path.basename(f).replace('.json', '')
        data = json.load(open(f, encoding='utf-8'))
        words = set()

        # vocabulary 배열에서
        for v in data.get('vocabulary', []):
            w = v.get('word_ja', '')
            if w:
                existing.add(w)
                words.add(w)

        # lines의 key_expressions에서
        for line in data.get('lines', []):
            for expr in line.get('key_expressions', []):
                existing.add(expr)
                words.add(expr)

            # 대사 텍스트에서도 주요 단어 확인
            text = line.get('text_ja', '')
            # text는 나중에 매칭에 사용

        by_situation[name] = words

    return existing, by_situation


# ── 2. JLPT N5 회화 필수 어휘 (대화에서 자주 쓰이는 것 중심) ──
# jlptsensei.com에서 수집한 644개 중 회화에 핵심적인 단어를 카테고리별로 정리
# (숫자 읽기, 한자 읽기 등 시험 전용 항목은 제외)

N5_CONVERSATION = {
    "인사·기본표현": [
        "おはよう", "おはようございます", "こんにちは", "こんばんは",
        "さようなら", "ありがとう", "ありがとうございます", "すみません",
        "ごめんなさい", "いただきます", "ごちそうさま", "お願いします",
        "はじめまして", "よろしく", "お元気ですか", "大丈夫",
    ],
    "쇼핑·주문": [
        "ください", "いくら", "高い", "安い", "円", "お金",
        "買う", "売る", "買い物", "店", "お菓子", "果物",
        "お茶", "コーヒー", "お弁当", "お酒", "飲み物",
        "美味しい", "甘い", "辛い", "不味い",
    ],
    "이동·교통": [
        "行く", "来る", "帰る", "歩く", "走る", "乗る", "降りる",
        "駅", "電車", "バス", "タクシー", "飛行機", "自転車", "車",
        "地下鉄", "切符", "道", "橋", "交差点", "信号",
        "右", "左", "真っ直ぐ", "曲がる", "近い", "遠い",
        "北", "南", "東", "西", "地図",
    ],
    "장소": [
        "学校", "病院", "銀行", "郵便局", "交番", "公園",
        "図書館", "映画館", "デパート", "スーパー", "レストラン",
        "喫茶店", "ホテル", "アパート", "家", "部屋", "台所",
        "お風呂", "トイレ", "玄関", "庭", "プール",
    ],
    "시간·날짜": [
        "今日", "明日", "昨日", "今", "朝", "昼", "夜", "晩",
        "午前", "午後", "時間", "月曜日", "火曜日", "水曜日",
        "木曜日", "金曜日", "土曜日", "日曜日",
        "来週", "先週", "今週", "来月", "先月", "今月",
        "春", "夏", "秋", "冬", "休み", "夏休み",
    ],
    "사람·가족": [
        "人", "男", "女", "子供", "友達", "先生", "学生",
        "お父さん", "お母さん", "お兄さん", "お姉さん", "弟", "妹",
        "父", "母", "兄", "姉", "両親", "家族", "奥さん",
    ],
    "일상동사": [
        "食べる", "飲む", "見る", "聞く", "読む", "書く", "話す",
        "起きる", "寝る", "洗う", "作る", "持つ", "使う", "待つ",
        "立つ", "座る", "入る", "出る", "出かける", "開ける", "閉める",
        "付ける", "消す", "遊ぶ", "泳ぐ", "教える", "習う",
        "覚える", "忘れる", "分かる", "知る", "思う", "言う",
        "答える", "呼ぶ", "借りる", "貸す", "返す", "渡す",
        "勉強する", "練習する", "掃除する", "洗濯する", "散歩する",
        "質問する", "電話する", "結婚する",
    ],
    "형용사·상태": [
        "大きい", "小さい", "長い", "短い", "新しい", "古い",
        "広い", "狭い", "明るい", "暗い", "重い", "軽い",
        "多い", "少ない", "早い", "遅い", "速い", "太い", "細い",
        "忙しい", "暇", "楽しい", "面白い", "難しい", "易しい",
        "暑い", "寒い", "暖かい", "涼しい", "痛い",
        "綺麗", "静か", "賑やか", "便利", "不便", "上手", "下手",
        "好き", "嫌い", "大好き", "元気", "丈夫", "大切",
    ],
    "물건·의류": [
        "本", "新聞", "雑誌", "辞書", "ノート", "鉛筆", "ペン",
        "かばん", "傘", "時計", "眼鏡", "カメラ", "電話",
        "テレビ", "冷蔵庫", "洗濯機", "エアコン",
        "靴", "帽子", "服", "シャツ", "ネクタイ",
        "椅子", "机", "テーブル", "ベッド", "ドア", "窓",
    ],
    "음식": [
        "ご飯", "パン", "卵", "肉", "魚", "野菜", "果物",
        "牛肉", "豚肉", "鶏肉", "牛乳", "砂糖", "塩",
        "朝ご飯", "昼ご飯", "晩ご飯", "料理",
    ],
    "자연·날씨": [
        "天気", "雨", "雪", "風", "空", "山", "川", "海",
        "花", "木", "晴れ", "曇り",
    ],
    "의문사·접속": [
        "何", "誰", "どこ", "いつ", "どう", "どれ", "どの",
        "どちら", "いくつ", "なぜ", "どうして",
        "でも", "だから", "そして", "それから", "まだ", "もう",
        "とても", "ちょっと", "たくさん", "少し", "全部",
        "いつも", "時々", "よく", "多分", "本当",
    ],
}

# ── 3. JLPT N4 추가 회화 어휘 ──
N4_CONVERSATION = {
    "비즈니스·사회": [
        "会議", "会社", "社長", "部長", "課長",
        "アルバイト", "仕事", "経験", "紹介", "挨拶",
        "連絡", "相談", "準備", "説明", "案内",
        "予定", "予約", "約束", "関係",
    ],
    "일상생활_확장": [
        "引っ越す", "届ける", "届く", "届け出",
        "払う", "足りる", "足す", "増える", "減る",
        "捨てる", "拾う", "片付ける", "壊れる", "壊す",
        "運ぶ", "集める", "集まる", "決める", "決まる",
        "続ける", "続く", "変わる", "変える",
        "育てる", "生きる", "亡くなる",
    ],
    "감정·의견": [
        "嬉しい", "悲しい", "寂しい", "恥ずかしい",
        "怖い", "酷い", "優しい", "厳しい", "珍しい",
        "素晴らしい", "美しい", "正しい",
        "安心", "安全", "危険", "簡単", "複雑",
        "特別", "普通", "自由", "必要",
        "意見", "気持ち", "興味", "趣味",
    ],
    "의료·건강": [
        "歯医者", "怪我", "熱", "血", "注射",
        "入院", "退院", "お見舞い",
    ],
    "주거·생활": [
        "家賃", "布団", "畳", "壁", "階段",
        "ガス", "水道", "暖房", "冷房",
        "ゴミ", "洗濯物",
    ],
    "이동_확장": [
        "空港", "飛行場", "港", "坂", "島",
        "急行", "特急", "乗り換え",
        "通う", "通る", "進む", "戻る",
    ],
    "경어·존경": [
        "いらっしゃる", "召し上がる", "ご覧になる",
        "おっしゃる", "くださる", "差し上がる",
        "参る", "致す", "伺う", "拝見する",
        "ご主人", "ご存じ",
    ],
}


def flatten_dict(d):
    """카테고리별 딕셔너리를 flat set으로"""
    result = set()
    for words in d.values():
        result.update(words)
    return result


def analyze_gap(existing, jlpt_words, label):
    """기존 어휘와 JLPT 리스트 비교"""
    covered = existing & jlpt_words
    missing = jlpt_words - existing
    return {
        "label": label,
        "total_jlpt": len(jlpt_words),
        "covered": len(covered),
        "missing": len(missing),
        "coverage_pct": round(len(covered) / len(jlpt_words) * 100, 1),
        "covered_words": sorted(covered),
        "missing_words": sorted(missing),
    }


def categorize_missing(missing_words, category_dict):
    """빠진 단어를 카테고리별로 분류"""
    result = {}
    categorized = set()
    for cat, words in category_dict.items():
        cat_missing = [w for w in words if w in missing_words]
        if cat_missing:
            result[cat] = cat_missing
            categorized.update(cat_missing)
    uncategorized = sorted(set(missing_words) - categorized)
    if uncategorized:
        result["기타"] = uncategorized
    return result


def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(base, 'scripts', 'output')

    # 1. 기존 어휘 추출
    existing, by_situation = extract_existing_vocab(output_dir)
    print(f"기존 대화 콘텐츠: {len(existing)}개 고유 어휘, {len(by_situation)}개 상황")

    # 2. JLPT 어휘
    n5_words = flatten_dict(N5_CONVERSATION)
    n4_words = flatten_dict(N4_CONVERSATION)
    all_jlpt = n5_words | n4_words

    print(f"JLPT N5 회화 어휘: {len(n5_words)}개")
    print(f"JLPT N4 회화 어휘: {len(n4_words)}개")
    print(f"합계: {len(all_jlpt)}개")
    print()

    # 3. 갭 분석
    n5_gap = analyze_gap(existing, n5_words, "N5")
    n4_gap = analyze_gap(existing, n4_words, "N4")

    print(f"=== N5 커버리지 ===")
    print(f"커버: {n5_gap['covered']}/{n5_gap['total_jlpt']} ({n5_gap['coverage_pct']}%)")
    print(f"빠진 단어: {n5_gap['missing']}개")
    print()

    print(f"=== N4 커버리지 ===")
    print(f"커버: {n4_gap['covered']}/{n4_gap['total_jlpt']} ({n4_gap['coverage_pct']}%)")
    print(f"빠진 단어: {n4_gap['missing']}개")
    print()

    # 4. 빠진 단어를 카테고리별로
    n5_missing_cats = categorize_missing(set(n5_gap['missing_words']), N5_CONVERSATION)
    n4_missing_cats = categorize_missing(set(n4_gap['missing_words']), N4_CONVERSATION)

    print("=== N5 빠진 단어 (카테고리별) ===")
    for cat, words in n5_missing_cats.items():
        print(f"  {cat}: {', '.join(words[:10])}" + (f" (+{len(words)-10}개)" if len(words) > 10 else ""))
    print()

    print("=== N4 빠진 단어 (카테고리별) ===")
    for cat, words in n4_missing_cats.items():
        print(f"  {cat}: {', '.join(words[:10])}" + (f" (+{len(words)-10}개)" if len(words) > 10 else ""))

    # 5. 변형 시나리오 제안
    print()
    print("=== 변형 시나리오 제안 ===")
    suggestions = suggest_variations(n5_missing_cats, n4_missing_cats, by_situation)
    for s in suggestions:
        print(f"\n📝 {s['name']}")
        print(f"   기반: {s['base_situation']}")
        print(f"   추가 어휘: {', '.join(s['new_words'][:8])}")
        print(f"   이유: {s['reason']}")

    # 6. 결과 저장
    result = {
        "summary": {
            "existing_vocab": len(existing),
            "situations": len(by_situation),
            "n5_total": len(n5_words),
            "n5_covered": n5_gap['covered'],
            "n5_coverage_pct": n5_gap['coverage_pct'],
            "n4_total": len(n4_words),
            "n4_covered": n4_gap['covered'],
            "n4_coverage_pct": n4_gap['coverage_pct'],
        },
        "n5_missing_by_category": n5_missing_cats,
        "n4_missing_by_category": n4_missing_cats,
        "variation_suggestions": suggestions,
    }

    out_path = os.path.join(base, 'data', 'gap_analysis.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"\n결과 저장: {out_path}")


def suggest_variations(n5_missing, n4_missing, by_situation):
    """빠진 단어를 기반으로 변형 시나리오 제안"""
    suggestions = []

    # 1. 편의점 v2: 음식 관련 + 날씨 소재
    convenience_missing = []
    for cat in ["음식", "쇼핑·주문"]:
        convenience_missing.extend(n5_missing.get(cat, []))
    if convenience_missing:
        suggestions.append({
            "name": "convenience_store_v2 — 도시락·음식 고르기",
            "base_situation": "convenience_store",
            "new_words": convenience_missing[:10],
            "reason": "기존은 단순 구매. 음식 이름(卵, 肉, 野菜)과 맛 표현(甘い, 辛い) 추가",
            "jlpt": "N5",
        })

    # 2. 카페 v2: 날씨 이야기 + 형용사
    cafe_missing = []
    for cat in ["자연·날씨", "형용사·상태"]:
        cafe_missing.extend(n5_missing.get(cat, []))
    if cafe_missing:
        suggestions.append({
            "name": "cafe_v2 — 날씨 이야기하면서 주문",
            "base_situation": "cafe",
            "new_words": cafe_missing[:10],
            "reason": "주문 전 스몰토크: 날씨(暑い, 寒い, 涼しい)와 감상(綺麗, 静か)",
            "jlpt": "N5",
        })

    # 3. 길 묻기 v2: 장소 관련 어휘 확장
    directions_missing = []
    for cat in ["이동·교통", "장소"]:
        directions_missing.extend(n5_missing.get(cat, []))
    if directions_missing:
        suggestions.append({
            "name": "ask_directions_v2 — 전철 환승 물어보기",
            "base_situation": "ask_directions",
            "new_words": directions_missing[:10],
            "reason": "기존은 단순 방향. 전철역, 지하철, 환승 관련 어휘 추가",
            "jlpt": "N5",
        })

    # 4. 식당 v2: 가족·사람 + 음식 확장
    restaurant_missing = []
    for cat in ["사람·가족", "음식"]:
        restaurant_missing.extend(n5_missing.get(cat, []))
    if restaurant_missing:
        suggestions.append({
            "name": "restaurant_v2 — 가족과 함께 식사 주문",
            "base_situation": "restaurant",
            "new_words": restaurant_missing[:10],
            "reason": "가족(お父さん, 子供)과 함께 먹을 것 고르며 사람·음식 어휘 통합",
            "jlpt": "N5",
        })

    # 5. 병원 v2 (N4): 의료 어휘 확장
    hospital_missing = n4_missing.get("의료·건강", [])
    if hospital_missing:
        suggestions.append({
            "name": "hospital_v2 — 치과/부상 설명",
            "base_situation": "hospital",
            "new_words": hospital_missing,
            "reason": "기존은 일반 진료. 치과(歯医者), 부상(怪我), 주사(注射) 등 N4 의료 어휘",
            "jlpt": "N4",
        })

    # 6. 부동산 v2 (N4): 주거 어휘 확장
    housing_missing = n4_missing.get("주거·생활", [])
    if housing_missing:
        suggestions.append({
            "name": "real_estate_v2 — 입주 후 생활 설명",
            "base_situation": "real_estate",
            "new_words": housing_missing,
            "reason": "기존은 집 구경. 입주 후 가스(ガス), 수도(水道), 쓰레기(ゴミ) 등 생활 어휘",
            "jlpt": "N4",
        })

    # 7. 비즈니스 회의 v2 (N4): 경어 + 비즈니스 확장
    biz_missing = []
    for cat in ["경어·존경", "비즈니스·사회"]:
        biz_missing.extend(n4_missing.get(cat, []))
    if biz_missing:
        suggestions.append({
            "name": "meeting_response_v2 — 프레젠 후 질의응답",
            "base_situation": "meeting_response",
            "new_words": biz_missing[:10],
            "reason": "경어(いらっしゃる, 召し上がる)와 비즈니스 어휘(会議, 説明, 相談) 활용",
            "jlpt": "N4",
        })

    return suggestions


if __name__ == "__main__":
    main()
