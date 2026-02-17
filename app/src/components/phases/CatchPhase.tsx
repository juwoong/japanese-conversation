import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { colors, borderRadius } from "../../constants/theme";
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
  situationEmoji: string;
  onComplete: () => void;
}

/** Minimal pair bank — common confusable Japanese words */
const MINIMAL_PAIRS: { wordA: string; wordB: string; emojiA: string; emojiB: string }[] = [
  { wordA: "おばさん", wordB: "おばあさん", emojiA: "👩", emojiB: "👵" },
  { wordA: "びょういん", wordB: "びよういん", emojiA: "🏥", emojiB: "💇" },
  { wordA: "おじさん", wordB: "おじいさん", emojiA: "👨", emojiB: "👴" },
  { wordA: "きって", wordB: "きて", emojiA: "📮", emojiB: "👋" },
  { wordA: "かわ", wordB: "かわ", emojiA: "🏞", emojiB: "🧶" },
];

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
  // Shuffle
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

/** Pick a minimal pair — either from the bank or create a same-word pair */
function makeMinimalPair(expression: KeyExpression) {
  const useDifferentPair = Math.random() > 0.5;
  if (useDifferentPair && MINIMAL_PAIRS.length > 0) {
    const pair = MINIMAL_PAIRS[Math.floor(Math.random() * MINIMAL_PAIRS.length)];
    return { ...pair, isSame: false };
  }
  return {
    wordA: expression.textJa,
    wordB: expression.textJa,
    emojiA: expression.emoji || "🔊",
    emojiB: expression.emoji || "🔊",
    isSame: true,
  };
}

export default function CatchPhase({
  keyExpressions,
  inputMode,
  visitCount,
  situationEmoji,
  onComplete,
}: Props) {
  const activities = useMemo(() => buildActivities(visitCount), [visitCount]);
  const [exprIndex, setExprIndex] = useState(0);
  const [actIndex, setActIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentExpr = keyExpressions[exprIndex];
  const currentActivity = activities[actIndex];

  const totalSteps = keyExpressions.length * activities.length;
  const currentStep = exprIndex * activities.length + actIndex + 1;

  const advance = useCallback(() => {
    // Fade out, update state, fade in
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
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
          return;
        }
      }
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [actIndex, activities.length, exprIndex, keyExpressions.length, onComplete, fadeAnim]);

  // Skip sound distinction on revisits
  const shouldSkipSound = currentActivity === "sound" && visitCount !== 1;

  useEffect(() => {
    if (shouldSkipSound) {
      advance();
    }
  }, [shouldSkipSound, advance]);

  if (!currentExpr || shouldSkipSound) {
    return null;
  }

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

      {/* Expert skip button */}
      {visitCount >= 3 && (
        <TouchableOpacity style={styles.skipButton} onPress={onComplete}>
          <Text style={styles.skipText}>바로 대화로 →</Text>
        </TouchableOpacity>
      )}

      {/* Activity content with fade */}
      <Animated.View style={[styles.activityContainer, { opacity: fadeAnim }]}>
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
            pair={makeMinimalPair(currentExpr)}
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
            situationEmoji={situationEmoji}
            inputMode={inputMode}
            onComplete={advance}
          />
        )}
      </Animated.View>
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
  skipButton: {
    alignSelf: "flex-end",
    marginRight: 16,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.sm,
  },
  skipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  activityContainer: {
    flex: 1,
  },
});
