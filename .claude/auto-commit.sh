#!/bin/bash
# Stop hook: 변경 사항이 있으면 자동 커밋

# 변경 사항 확인
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  # 변경된 파일 목록
  CHANGED_FILES=$(git status --porcelain | head -5 | awk '{print $2}' | tr '\n' ', ' | sed 's/,$//')

  # 파일 수
  FILE_COUNT=$(git status --porcelain | wc -l | tr -d ' ')

  # 커밋 메시지 생성
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M')

  # 스테이징 및 커밋
  git add -A
  git commit -m "chore: auto-commit at ${TIMESTAMP}

Files changed: ${FILE_COUNT}
Includes: ${CHANGED_FILES}

Co-Authored-By: Claude <noreply@anthropic.com>" 2>/dev/null

  if [ $? -eq 0 ]; then
    echo "[AUTO-COMMIT] ${FILE_COUNT}개 파일 커밋 완료"
  fi
fi
