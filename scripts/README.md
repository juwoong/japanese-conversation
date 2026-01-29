# 콘텐츠 생성 스크립트

Claude API를 사용해서 22개 상황의 대사를 자동 생성합니다.

---

## Claude Code 실행 가이드

아래 명령어를 순서대로 실행하면 됩니다.

### Step 1: 설치

```bash
cd /path/to/japanese-conversations/scripts
npm install
```

### Step 2: 프롬프트 미리보기 (선택, API 호출 없이)

```bash
npx ts-node generate-lines.ts --dry-run
```

### Step 3: 테스트 - 단일 상황 생성

```bash
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY npx ts-node generate-lines.ts --situation=convenience_store
```

생성 후 확인:
```bash
cat output/convenience_store.json
```

### Step 4: 전체 생성 (22개)

```bash
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY npx ts-node generate-lines.ts
```

### Step 5: 결과 검증

```bash
# 생성된 파일 개수 확인
ls -la output/*.json | wc -l
# 예상: 22

# 각 파일의 대사 개수 확인
for f in output/*.json; do
  count=$(jq '.lines | length' "$f")
  echo "$f: $count lines"
done
```

### Step 6: 요약 리포트

```bash
echo "=== 생성 결과 요약 ==="
echo "총 파일: $(ls output/*.json | wc -l)"
echo "총 대사: $(jq -s '[.[].lines[]] | length' output/*.json)"
echo "총 표현: $(jq -s '[.[].lines[].key_expressions[]] | unique | length' output/*.json)"
```

---

## 트러블슈팅

### API 키 오류
```
Error: ANTHROPIC_API_KEY not set
```
→ 환경변수 설정 확인: `echo $ANTHROPIC_API_KEY`

### JSON 파싱 오류
```
Failed to parse JSON
```
→ `output/` 폴더의 해당 파일 삭제 후 다시 실행

### Rate Limit
→ 스크립트에 1초 딜레이 내장됨. 그래도 발생시 `--situation=` 옵션으로 하나씩 실행

---

## 수동 사용법

## 출력

생성된 파일은 `output/` 폴더에 저장됩니다:

```
output/
├── convenience_store.json
├── cafe.json
├── restaurant.json
└── ...
```

## JSON 구조

```json
{
  "situation_slug": "convenience_store",
  "lines": [
    {
      "line_order": 1,
      "speaker": "npc",
      "text_ja": "いらっしゃいませ",
      "text_ja_male": null,
      "text_ja_female": null,
      "pronunciation_ko": "이랏샤이마세",
      "text_ko": "어서오세요",
      "grammar_hint": null,
      "key_expressions": ["いらっしゃいませ"]
    }
  ]
}
```

## 검증

스크립트는 자동으로 다음을 검증합니다:
- 대사 개수 = 5개
- speaker 교차 (npc → user → npc → user → npc)
- 필수 필드 존재

## 다음 단계

1. 생성된 JSON 검토
2. 필요시 수동 수정
3. DB에 import (추후 스크립트 추가 예정)
