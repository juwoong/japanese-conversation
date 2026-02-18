import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import * as Speech from "expo-speech";
import { colors, borderRadius } from "../../constants/theme";
import FuriganaText from "../FuriganaText";
import type { KeyExpression, SessionMode } from "../../types";
import ChunkCatch from "./activities/ChunkCatch";
import WordCatch from "./activities/WordCatch";
import SoundDistinction from "./activities/SoundDistinction";
import ShadowSpeak from "./activities/ShadowSpeak";
import PictureSpeak from "./activities/PictureSpeak";

type ActivityType = "chunk" | "word" | "sound" | "shadow" | "picture";
type CatchStep = "intro" | "present" | "activities";

interface Props {
  keyExpressions: KeyExpression[];
  inputMode: SessionMode;
  visitCount: number;
  situationEmoji: string;
  situationName: string;
  locationName: string;
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

/** Generate word-catch emoji choices with Korean labels */
function makeWordChoices(
  expression: KeyExpression,
  allExpressions: KeyExpression[],
): { emoji: string; label: string; isCorrect: boolean }[] {
  const correct = expression.emoji || "🗣";
  const correctLabel = expression.textKo;

  const others = allExpressions
    .filter((e) => e.textJa !== expression.textJa)
    .slice(0, 2);

  const fallbackChoices = [
    { emoji: "🏪", label: "가게" },
    { emoji: "🚃", label: "전철" },
    { emoji: "💰", label: "돈" },
  ];

  const distractors: { emoji: string; label: string; isCorrect: boolean }[] = others.map((e) => ({
    emoji: e.emoji || "❓",
    label: e.textKo,
    isCorrect: false,
  }));

  while (distractors.length < 2) {
    const fb = fallbackChoices[distractors.length];
    distractors.push({ emoji: fb.emoji, label: fb.label, isCorrect: false });
  }

  const choices = [
    { emoji: correct, label: correctLabel, isCorrect: true },
    distractors[0],
    distractors[1],
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

// --- Inline sub-components ---

function SituationIntro({
  emoji,
  situationName,
  locationName,
  onStart,
}: {
  emoji: string;
  situationName: string;
  locationName: string;
  onStart: () => void;
}) {
  return (
    <View style={introStyles.container}>
      <Text style={introStyles.emoji}>{emoji}</Text>
      {locationName ? (
        <Text style={introStyles.location}>{locationName}에서</Text>
      ) : null}
      <Text style={introStyles.name}>{situationName}</Text>
      <Text style={introStyles.description}>
        이 상황에서 쓸 표현을 배워볼게요
      </Text>
      <TouchableOpacity style={introStyles.button} onPress={onStart} activeOpacity={0.8}>
        <Text style={introStyles.buttonText}>시작하기</Text>
      </TouchableOpacity>
    </View>
  );
}

function VocabPresentation({
  expressions,
  currentIndex,
  onNext,
}: {
  expressions: KeyExpression[];
  currentIndex: number;
  onNext: () => void;
}) {
  const expr = expressions[currentIndex];
  const [isSpeaking, setIsSpeaking] = useState(false);

  const playTTS = useCallback(() => {
    setIsSpeaking(true);
    Speech.speak(expr.textJa, {
      language: "ja-JP",
      rate: 0.85,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [expr.textJa]);

  return (
    <View style={vocabStyles.container}>
      {/* Progress */}
      <Text style={vocabStyles.progress}>
        {currentIndex + 1} / {expressions.length}
      </Text>

      {/* Emoji */}
      {expr.emoji ? (
        <Text style={vocabStyles.emoji}>{expr.emoji}</Text>
      ) : null}

      {/* Japanese with furigana */}
      <View style={vocabStyles.japaneseRow}>
        {expr.furigana ? (
          <FuriganaText segments={expr.furigana} fontSize={28} color={colors.textDark} />
        ) : (
          <Text style={vocabStyles.japaneseText}>{expr.textJa}</Text>
        )}
      </View>

      {/* Korean meaning */}
      <Text style={vocabStyles.koreanText}>{expr.textKo}</Text>

      {/* TTS button */}
      <TouchableOpacity style={vocabStyles.ttsButton} onPress={playTTS} activeOpacity={0.7}>
        <Text style={vocabStyles.ttsIcon}>{isSpeaking ? "🔊" : "🔈"}</Text>
        <Text style={vocabStyles.ttsLabel}>발음 듣기</Text>
      </TouchableOpacity>

      {/* Next button */}
      <TouchableOpacity style={vocabStyles.nextButton} onPress={onNext} activeOpacity={0.8}>
        <Text style={vocabStyles.nextButtonText}>배웠어요 →</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- Main component ---

export default function CatchPhase({
  keyExpressions,
  inputMode,
  visitCount,
  situationEmoji,
  situationName,
  locationName,
  onComplete,
}: Props) {
  // On first visit, start with intro. On revisits, skip to activities.
  const initialStep: CatchStep = visitCount === 1 ? "intro" : "activities";
  const [catchStep, setCatchStep] = useState<CatchStep>(initialStep);
  const [vocabIndex, setVocabIndex] = useState(0);

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
  const shouldSkipSound = catchStep === "activities" && currentActivity === "sound" && visitCount !== 1;

  useEffect(() => {
    if (shouldSkipSound) {
      advance();
    }
  }, [shouldSkipSound, advance]);

  // --- Intro step ---
  if (catchStep === "intro") {
    return (
      <View style={styles.container}>
        <SituationIntro
          emoji={situationEmoji}
          situationName={situationName}
          locationName={locationName}
          onStart={() => setCatchStep("present")}
        />
      </View>
    );
  }

  // --- Present step ---
  if (catchStep === "present") {
    return (
      <View style={styles.container}>
        <VocabPresentation
          expressions={keyExpressions}
          currentIndex={vocabIndex}
          onNext={() => {
            if (vocabIndex + 1 < keyExpressions.length) {
              setVocabIndex(vocabIndex + 1);
            } else {
              setCatchStep("activities");
            }
          }}
        />
      </View>
    );
  }

  // --- Activities step (existing behavior) ---
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

// --- Styles ---

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

const introStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  location: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: colors.textMedium,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "bold",
    color: colors.surface,
  },
});

const vocabStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  progress: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 24,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  japaneseRow: {
    marginBottom: 12,
    alignItems: "center",
  },
  japaneseText: {
    fontSize: 28,
    fontWeight: "600",
    color: colors.textDark,
  },
  koreanText: {
    fontSize: 18,
    color: colors.textMedium,
    marginBottom: 32,
  },
  ttsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.md,
    marginBottom: 32,
  },
  ttsIcon: {
    fontSize: 24,
  },
  ttsLabel: {
    fontSize: 15,
    color: colors.textMedium,
    fontWeight: "500",
  },
  nextButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: "bold",
    color: colors.surface,
  },
});
