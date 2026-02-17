import React, { useState, useMemo, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../constants/theme";
import type { KeyExpression, SessionMode } from "../../types";
import ChunkCatch from "./activities/ChunkCatch";
import WordCatch from "./activities/WordCatch";
import SoundDistinction from "./activities/SoundDistinction";
import ShadowSpeak from "./activities/ShadowSpeak";
import PictureSpeak from "./activities/PictureSpeak";

type ActivityType = "chunk" | "word" | "sound" | "shadow" | "picture";

interface Props {
  keyExpressions: KeyExpression[];
  inputMode: SessionMode;
  visitCount: number;
  onComplete: () => void;
}

function buildActivities(visitCount: number): ActivityType[] {
  if (visitCount === 1) return ["chunk", "word", "sound", "shadow", "picture"];
  if (visitCount === 2) return ["shadow", "picture"];
  return ["shadow", "picture"];
}

/** Generate chunk-catch choices for an expression */
function makeChunkChoices(
  expression: KeyExpression,
  allExpressions: KeyExpression[],
): { emoji: string; label: string; isCorrect: boolean }[] {
  const correctEmoji = expression.emoji || "🗣";
  const correctLabel = expression.textKo;

  // Pick 2 distractors from other expressions, or use generic fallbacks
  const distractors = allExpressions
    .filter((e) => e.textJa !== expression.textJa)
    .slice(0, 2)
    .map((e) => ({
      emoji: e.emoji || "❓",
      label: e.textKo,
      isCorrect: false,
    }));

  const genericDistractors = [
    { emoji: "💬", label: "인사하기", isCorrect: false },
    { emoji: "📦", label: "물건 사기", isCorrect: false },
    { emoji: "🚶", label: "길 묻기", isCorrect: false },
  ];
  while (distractors.length < 2) {
    distractors.push(genericDistractors[distractors.length]);
  }

  const choices = [
    { emoji: correctEmoji, label: correctLabel, isCorrect: true },
    distractors[0],
    distractors[1],
  ];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

/** Generate word-catch emoji choices */
function makeWordChoices(
  expression: KeyExpression,
  allExpressions: KeyExpression[],
): { emoji: string; isCorrect: boolean }[] {
  const correct = expression.emoji || "🗣";
  const others = allExpressions
    .filter((e) => e.textJa !== expression.textJa)
    .map((e) => e.emoji || "❓")
    .slice(0, 2);

  const fallbacks = ["🏪", "🚃", "💰"];
  while (others.length < 2) {
    others.push(fallbacks[others.length]);
  }

  const choices = [
    { emoji: correct, isCorrect: true },
    { emoji: others[0], isCorrect: false },
    { emoji: others[1], isCorrect: false },
  ];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

export default function CatchPhase({
  keyExpressions,
  inputMode,
  visitCount,
  onComplete,
}: Props) {
  const activities = useMemo(() => buildActivities(visitCount), [visitCount]);

  const [exprIndex, setExprIndex] = useState(0);
  const [actIndex, setActIndex] = useState(0);

  const currentExpr = keyExpressions[exprIndex];
  const currentActivity = activities[actIndex];

  const advance = useCallback(() => {
    const nextAct = actIndex + 1;
    if (nextAct < activities.length) {
      setActIndex(nextAct);
    } else {
      const nextExpr = exprIndex + 1;
      if (nextExpr < keyExpressions.length) {
        setExprIndex(nextExpr);
        setActIndex(0);
      } else {
        onComplete();
      }
    }
  }, [actIndex, activities.length, exprIndex, keyExpressions.length, onComplete]);

  // Skip sound distinction if visitCount !== 1
  const shouldSkipSound =
    currentActivity === "sound" && visitCount !== 1;

  React.useEffect(() => {
    if (shouldSkipSound) {
      advance();
    }
  }, [shouldSkipSound, advance]);

  if (!currentExpr || shouldSkipSound) {
    return null;
  }

  const totalSteps = keyExpressions.length * activities.length;
  const currentStep = exprIndex * activities.length + actIndex + 1;

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(currentStep / totalSteps) * 100}%` },
          ]}
        />
      </View>

      <Text style={styles.phaseLabel}>
        포착 {currentStep}/{totalSteps}
      </Text>

      {currentActivity === "chunk" && (
        <ChunkCatch
          key={`chunk-${exprIndex}`}
          expression={currentExpr}
          choices={makeChunkChoices(currentExpr, keyExpressions)}
          onComplete={advance}
        />
      )}

      {currentActivity === "word" && (
        <WordCatch
          key={`word-${exprIndex}`}
          expression={currentExpr}
          choices={makeWordChoices(currentExpr, keyExpressions)}
          onComplete={advance}
        />
      )}

      {currentActivity === "sound" && (
        <SoundDistinction
          key={`sound-${exprIndex}`}
          pair={{
            wordA: currentExpr.textJa,
            wordB: currentExpr.textJa,
            emojiA: currentExpr.emoji || "🔊",
            emojiB: currentExpr.emoji || "🔊",
            isSame: true,
          }}
          onComplete={advance}
        />
      )}

      {currentActivity === "shadow" && (
        <ShadowSpeak
          key={`shadow-${exprIndex}`}
          expression={currentExpr}
          inputMode={inputMode}
          onComplete={advance}
        />
      )}

      {currentActivity === "picture" && (
        <PictureSpeak
          key={`picture-${exprIndex}`}
          expression={currentExpr}
          npcPrompt={currentExpr.textJa}
          situationEmoji={currentExpr.emoji || "🏪"}
          inputMode={inputMode}
          onComplete={advance}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    marginHorizontal: 16,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  phaseLabel: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
  },
});
