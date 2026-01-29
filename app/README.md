# Expo 앱

React Native + Expo 기반 일본어 회화 학습 앱

---

## 셋업

### 1. 환경 변수

```bash
cp .env.example .env
```

필수 값:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

선택 값:

- `EXPO_PUBLIC_ELEVENLABS_API_KEY` (TTS용, expo-speech 사용 시 불필요)

### 2. 설치 및 실행

```bash
npm install
npx expo start
```

---

## 테스트

### 빌드 테스트

```bash
# 에러 없이 빌드되는지 확인
npx expo export
```

### 단위 테스트

```bash
npm test                    # 전체
npm test -- --watch         # watch 모드
npm test scoring.test.ts    # 특정 파일
```

### 수동 테스트 체크리스트

**온보딩**

- [ ] 앱이 크래시 없이 실행
- [ ] 언어 선택 화면 표시
- [ ] 페르소나 선택 가능
- [ ] 홈 화면 진입

**학습 세션**

- [ ] 상황 목록 표시
- [ ] 상황 진입 → 대사 표시
- [ ] TTS 재생 (일본어 음성)
- [ ] 녹음 버튼 동작
- [ ] STT 변환 결과 표시
- [ ] 채점 결과 표시 (정확/부분/오답)
- [ ] 세션 완료 화면

**SRS**

- [ ] FSRS 스케줄 업데이트
- [ ] 홈에서 복습 예정 확인
- [ ] Daily 리워드 표시

---

## 테스트 작성 규칙

```typescript
// __tests__/scoring.test.ts
describe("채점 로직", () => {
  it("Lv.1: 핵심 단어만 있으면 정답", () => {
    const result = scoreAnswer("코레 쿠다사이", "これをください", 1);
    expect(result.isCorrect).toBe(true);
  });

  it("Lv.2: 조사 빠지면 오답", () => {
    const result = scoreAnswer("これください", "これをください", 2);
    expect(result.isCorrect).toBe(false);
  });
});
```

---

## 폴더 구조 (예정)

```
app/
├── src/
│   ├── screens/        # 화면 컴포넌트
│   ├── components/     # 재사용 컴포넌트
│   ├── hooks/          # 커스텀 훅
│   ├── lib/            # Supabase, FSRS 등
│   └── types/          # TypeScript 타입
├── __tests__/          # 테스트
└── app.json            # Expo 설정
```
