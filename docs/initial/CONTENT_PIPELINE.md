# 콘텐츠 생성 파이프라인

AI(Claude)로 대사를 생성하고 검수하는 워크플로우.

---

## 생성 단위

| 단위 | 설명 |
|------|------|
| Situation (상황) | 22개, 이미 정의됨 |
| Line (대사) | 상황당 5개 = 110개 |
| Expression (표현) | 대사에서 추출, 크로스 해금용 |

---

## 생성 프롬프트 v1

### 상황 대사 생성

```markdown
## Task
일본어 회화 학습 앱의 대화 스크립트를 생성해주세요.

## Context
- 학습자: 한국인, 일본어 초보~중급
- 목적: 실제 상황에서 바로 쓸 수 있는 실용 회화
- 형식: NPC와 사용자의 대화 (총 5턴)

## Situation
- 페르소나: {persona}
- 상황: {situation_name}
- 장소: {location}
- 난이도: {difficulty} (1=입문, 2=초급, 3=중급)

## Requirements

### 대화 구조
1. NPC 먼저 시작 (인사 또는 질문)
2. User 응답
3. NPC 반응/추가 질문
4. User 응답
5. NPC 마무리 (or User 감사 인사)

### 대사 형식 (각 대사마다)
- speaker: "npc" 또는 "user"
- text_ja: 일본어 (히라가나/가타카나/한자)
- text_ja_male: 남성 버전 (다를 경우만)
- text_ja_female: 여성 버전 (다를 경우만)
- pronunciation_ko: 한글 발음
- text_ko: 한국어 번역
- grammar_hint: 문법 설명 (선택)
- key_expressions: 이 대사의 핵심 표현 리스트

### 난이도별 지침
- 난이도 1: 단어 중심, 짧은 문장, 기본 경어
- 난이도 2: 완전한 문장, 조사 정확히, 다양한 표현
- 난이도 3: 자연스러운 구어체, 상황별 뉘앙스, 경어 변형

### 성별 처리
- 기본(text_ja): 중성적 표현
- 남성(text_ja_male): 僕 사용, 남성적 어미 (필요시)
- 여성(text_ja_female): 私 사용, 여성적 어미 (필요시)
- 대부분의 대사는 성별 차이 없음 → text_ja만 작성

## Output Format (JSON)
```json
{
  "situation_slug": "convenience_store",
  "lines": [
    {
      "line_order": 1,
      "speaker": "npc",
      "text_ja": "いらっしゃいませ",
      "pronunciation_ko": "이랏샤이마세",
      "text_ko": "어서오세요",
      "key_expressions": ["いらっしゃいませ"]
    },
    {
      "line_order": 2,
      "speaker": "user",
      "text_ja": "これをください",
      "text_ja_male": null,
      "text_ja_female": null,
      "pronunciation_ko": "코레오 쿠다사이",
      "text_ko": "이것 주세요",
      "grammar_hint": "を는 목적어를 나타내는 조사입니다",
      "key_expressions": ["これ", "ください"]
    }
    // ... 3, 4, 5
  ]
}
```
```

---

## 생성 워크플로우

```
1. 상황 정보 입력
   ↓
2. 프롬프트 + 상황 정보 → Claude API
   ↓
3. JSON 응답 파싱
   ↓
4. 검증
   - 대사 5개 맞는지
   - speaker 교차 확인
   - 필수 필드 존재
   ↓
5. 수동 검수 (선택)
   - 일본어 자연스러움
   - 난이도 적절성
   - 발음 표기 정확성
   ↓
6. DB 저장
```

---

## 실행 가이드 (Claude Code용)

스크립트 위치: `scripts/`

### Step 1: 설치
```bash
cd scripts
npm install
```

### Step 2: 테스트 - 단일 상황
```bash
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY npx ts-node generate-lines.ts --situation=convenience_store
cat output/convenience_store.json
```

### Step 3: 전체 생성 (22개)
```bash
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY npx ts-node generate-lines.ts
```

### Step 4: 검증
```bash
# 파일 개수
ls output/*.json | wc -l  # 예상: 22

# 대사 개수 확인
for f in output/*.json; do
  count=$(jq '.lines | length' "$f")
  echo "$f: $count lines"
done

# 요약
echo "총 대사: $(jq -s '[.[].lines[]] | length' output/*.json)"
echo "총 표현: $(jq -s '[.[].lines[].key_expressions[]] | unique | length' output/*.json)"
```

---

## 스크립트 구조

```
scripts/
├── generate-lines.ts   ← 메인 스크립트
├── situations.json     ← 22개 상황 입력 데이터
├── package.json
└── output/             ← 생성 결과 (JSON)
```

---

## 표현(Expression) 추출

대사 생성 후, key_expressions에서 표현 추출:

```
1. 모든 대사의 key_expressions 수집
   ↓
2. 중복 제거 + 빈도 계산
   ↓
3. expressions 테이블에 저장
   ↓
4. line_expressions 연결 테이블 생성
```

### 추출 예시

| 대사 | key_expressions |
|------|-----------------|
| これをください | これ, ください |
| コーヒーをください | コーヒー, ください |
| お会計お願いします | お会計, お願いします |

→ `ください`가 여러 대사에서 등장 → expressions 테이블에 1번만 저장, 여러 line과 연결

---

## 품질 체크리스트

### 자동 검증
- [ ] 대사 개수 = 5
- [ ] speaker 교차 (npc-user-npc-user-npc or 유사)
- [ ] 필수 필드 존재 (text_ja, text_ko, pronunciation_ko)
- [ ] JSON 파싱 성공

### 수동 검증
- [ ] 일본어 문법 정확성
- [ ] 실제 상황에서 자연스러운지
- [ ] 난이도에 맞는 표현인지
- [ ] 한글 발음이 실제 발음과 일치하는지
- [ ] 번역이 의미를 잘 전달하는지

---

## 열린 질문

1. 생성된 대사의 일본어 검수: 네이티브 검수 필요? vs AI 자체 검증?
2. 발음 표기 규칙: 장음 표기 (おう → 오우? 오오? 오-?)
3. TTS 생성 시점: 대사 생성 직후? vs 사용자 요청 시 실시간?
