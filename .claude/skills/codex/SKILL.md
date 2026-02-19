# Codex — 코드 작업 위임

명확하게 코드 작업만 남은 단계에서 Codex CLI inline 모드를 호출하여 코드 변경을 수행한다.

## 사용 조건

다음 조건을 **모두** 만족할 때만 호출:

1. **변경할 파일과 내용이 구체적으로 확정됨** — 무엇을 어떻게 바꿀지 한 줄로 설명 가능
2. **설계 판단이 더 이상 필요 없음** — 구조, API, 타입 등이 이미 결정됨
3. **탐색이 완료됨** — 관련 코드를 이미 읽고 이해한 상태

## Arguments

- `<prompt>`: Codex에 전달할 코드 작업 지시 (영어 또는 한국어)

## Instructions

1. 먼저 변경 대상 파일과 작업 내용을 사용자에게 한 줄씩 나열하고 승인을 받는다.
2. 승인 후, Bash로 Codex CLI를 inline 모드로 실행한다:

```bash
codex --approval-mode full-auto "<prompt>"
```

### 주의사항

- Codex CLI가 설치되어 있어야 한다 (`npm install -g @openai/codex`)
- `OPENAI_API_KEY` 환경변수가 설정되어 있어야 한다
- `full-auto` 모드는 파일 쓰기/실행을 자동 승인하므로, 반드시 프롬프트가 구체적이고 범위가 좁아야 한다
- Codex 실행 후 변경된 파일을 확인하고 `git diff`로 결과를 사용자에게 보여준다
