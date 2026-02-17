/**
 * EngagePhase — Phase 3: AI NPC practice conversation.
 *
 * State machine:
 *   1. NPC turn: TTS + NpcBubble
 *   2. User turn: ChoiceInput / FillBlankInput / FreeInput based on visitCount
 *   3. After choice in voice mode: play model answer TTS
 *   4. Repeat for all dialogue turns, then complete
 *
 * Input difficulty:
 *   visitCount <= 2  -> ChoiceInput only
 *   visitCount 3~4   -> FillBlankInput
 *   visitCount >= 5  -> FreeInput
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import * as Speech from "expo-speech";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";
import type {
  KeyExpression,
  ModelLine,
  EngagePerformance,
  SessionMode,
  FuriganaSegment,
} from "../../types";

import ChoiceInput from "./inputs/ChoiceInput";
import FillBlankInput from "./inputs/FillBlankInput";
import FreeInput from "./inputs/FreeInput";

interface EngagePhaseProps {
  keyExpressions: KeyExpression[];
  modelDialogue: ModelLine[];
  inputMode: SessionMode;
  visitCount: number;
  onComplete: (performance: EngagePerformance) => void;
}

type TurnPhase = "npc_speaking" | "user_input" | "user_shadowing" | "done";

interface ConversationMessage {
  speaker: "npc" | "user";
  textJa: string;
  textKo: string;
  furigana?: FuriganaSegment[];
  isCorrect?: boolean;
}

/**
 * Generate 3 choices: 1 correct + 2 distractors from other user lines.
 */
function buildChoices(
  correctLine: ModelLine,
  allLines: ModelLine[]
): { textJa: string; isCorrect: boolean }[] {
  const otherUserLines = allLines.filter(
    (l) => l.speaker === "user" && l.textJa !== correctLine.textJa
  );

  const shuffled = [...otherUserLines].sort(() => Math.random() - 0.5);
  const distractors = shuffled.slice(0, 2).map((l) => ({
    textJa: l.textJa,
    isCorrect: false,
  }));

  // If not enough distractors, create grammatically valid variations
  while (distractors.length < 2) {
    distractors.push({
      textJa: correctLine.textJa + "か",
      isCorrect: false,
    });
  }

  const choices = [
    { textJa: correctLine.textJa, isCorrect: true },
    ...distractors,
  ];
  return choices.sort(() => Math.random() - 0.5);
}

/**
 * Build fill-blank data from a user line.
 * Picks first ~3 chars as the blank portion.
 */
function buildFillBlank(textJa: string) {
  const blankLen = Math.min(3, Math.ceil(textJa.length / 2));
  const blankWord = textJa.slice(0, blankLen);

  const hiragana =
    "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";
  const distractors: string[] = [];
  while (distractors.length < 2) {
    let fake = "";
    for (let i = 0; i < blankLen; i++) {
      fake += hiragana[Math.floor(Math.random() * hiragana.length)];
    }
    if (fake !== blankWord && !distractors.includes(fake)) {
      distractors.push(fake);
    }
  }

  return {
    fullText: textJa,
    blankWord,
    wordChoices: [blankWord, ...distractors].sort(() => Math.random() - 0.5),
  };
}

export default function EngagePhase({
  keyExpressions,
  modelDialogue,
  inputMode,
  visitCount,
  onComplete,
}: EngagePhaseProps) {
  const [turnIndex, setTurnIndex] = useState(0);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>("npc_speaking");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [revealedTranslations, setRevealedTranslations] = useState<
    Set<number>
  >(new Set());
  const scrollRef = useRef<ScrollView>(null);

  // Use refs for mutable counters to avoid stale closures
  const correctRef = useRef(0);
  const incorrectRef = useRef(0);

  const currentLine = modelDialogue[turnIndex] ?? null;
  const totalTurns = modelDialogue.length;
  const userTurnCount = modelDialogue.filter(
    (l) => l.speaker === "user"
  ).length;

  const getInputType = (): "choice" | "fillblank" | "free" => {
    if (visitCount <= 2) return "choice";
    if (visitCount <= 4) return "fillblank";
    return "free";
  };

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, turnPhase]);

  // NPC auto-play on turn change
  useEffect(() => {
    if (!currentLine || turnPhase === "done") return;

    if (currentLine.speaker === "npc" && turnPhase === "npc_speaking") {
      setMessages((prev) => [
        ...prev,
        {
          speaker: "npc",
          textJa: currentLine.textJa,
          textKo: currentLine.textKo,
          furigana: currentLine.furigana,
        },
      ]);

      setIsSpeaking(true);
      Speech.speak(currentLine.textJa, {
        language: "ja-JP",
        rate: 0.8,
        onDone: () => {
          setIsSpeaking(false);
          moveAfterNpc();
        },
        onError: () => {
          setIsSpeaking(false);
          moveAfterNpc();
        },
      });
    } else if (
      currentLine.speaker === "user" &&
      turnPhase === "npc_speaking"
    ) {
      setTurnPhase("user_input");
    }
  }, [turnIndex, turnPhase]);

  const moveAfterNpc = () => {
    const nextIdx = turnIndex + 1;
    if (nextIdx >= totalTurns) {
      finishPhase();
      return;
    }
    const nextLine = modelDialogue[nextIdx];
    setTurnIndex(nextIdx);
    setTurnPhase(nextLine?.speaker === "user" ? "user_input" : "npc_speaking");
  };

  const handleUserAnswer = (correct: boolean, chosenText: string) => {
    setMessages((prev) => [
      ...prev,
      {
        speaker: "user",
        textJa: chosenText,
        textKo: currentLine?.textKo ?? "",
        isCorrect: correct,
      },
    ]);

    if (correct) {
      correctRef.current += 1;
      setCorrectCount(correctRef.current);
    } else {
      incorrectRef.current += 1;
      setIncorrectCount(incorrectRef.current);
    }

    // In voice mode, play model answer TTS before advancing
    if (inputMode === "voice" && currentLine) {
      setTurnPhase("user_shadowing");
      setIsSpeaking(true);
      Speech.speak(currentLine.textJa, {
        language: "ja-JP",
        rate: 0.8,
        onDone: () => {
          setIsSpeaking(false);
          advanceToNext();
        },
        onError: () => {
          setIsSpeaking(false);
          advanceToNext();
        },
      });
    } else {
      advanceToNext();
    }
  };

  const handleFreeAnswer = (userText: string) => {
    const expected = currentLine?.textJa ?? "";
    const norm = userText.replace(/\s/g, "");
    const expNorm = expected.replace(/\s/g, "");
    const correct = norm === expNorm || norm.includes(expNorm);
    handleUserAnswer(correct, userText);
  };

  const advanceToNext = () => {
    const nextIdx = turnIndex + 1;
    if (nextIdx >= totalTurns) {
      setTimeout(() => finishPhase(), 400);
      return;
    }
    setTurnIndex(nextIdx);
    setTurnPhase("npc_speaking");
  };

  const finishPhase = () => {
    setTurnPhase("done");
    onComplete({
      totalTurns,
      userTurns: userTurnCount,
      correctCount: correctRef.current,
      incorrectCount: incorrectRef.current,
    });
  };

  const speakText = (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    Speech.speak(text, {
      language: "ja-JP",
      rate: 0.8,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const toggleTranslation = (index: number) => {
    setRevealedTranslations((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
    setTimeout(() => {
      setRevealedTranslations((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }, 3000);
  };

  const renderUserInput = () => {
    if (turnPhase !== "user_input" || !currentLine) return null;

    const inputType = getInputType();

    switch (inputType) {
      case "choice":
        return (
          <ChoiceInput
            npcQuestion={modelDialogue[turnIndex - 1]?.textJa ?? ""}
            choices={buildChoices(currentLine, modelDialogue)}
            onAnswer={handleUserAnswer}
          />
        );

      case "fillblank": {
        const { fullText, blankWord, wordChoices } = buildFillBlank(
          currentLine.textJa
        );
        return (
          <FillBlankInput
            fullText={fullText}
            blankWord={blankWord}
            wordChoices={wordChoices}
            onAnswer={handleUserAnswer}
          />
        );
      }

      case "free":
        return (
          <FreeInput
            expectedText={currentLine.textJa}
            inputMode={inputMode}
            onAnswer={handleFreeAnswer}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>실전 대화</Text>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((turnIndex + 1) / totalTurns) * 100}%` },
          ]}
        />
      </View>

      {/* Chat */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg, i) => {
          if (msg.speaker === "npc") {
            return (
              <View key={i} style={styles.npcMessage}>
                <View style={styles.npcBubble}>
                  <View style={styles.npcTextRow}>
                    <Text style={styles.npcText}>{msg.textJa}</Text>
                    <TouchableOpacity onPress={() => speakText(msg.textJa)}>
                      <MaterialIcons
                        name="volume-up"
                        size={20}
                        color={isSpeaking ? colors.primary : colors.textLight}
                      />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => toggleTranslation(i)}>
                    {revealedTranslations.has(i) ? (
                      <Text style={styles.npcTranslation}>{msg.textKo}</Text>
                    ) : (
                      <View style={styles.translationBlur}>
                        <Text style={styles.translationBlurText}>?</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          return (
            <View key={i} style={styles.userMessage}>
              <View style={styles.userBubble}>
                <Text style={styles.userText}>{msg.textJa}</Text>
              </View>
            </View>
          );
        })}

        {turnPhase === "user_input" && (
          <View style={styles.inputArea}>{renderUserInput()}</View>
        )}

        {turnPhase === "user_shadowing" && (
          <View style={styles.shadowingArea}>
            <MaterialIcons name="hearing" size={20} color={colors.primary} />
            <Text style={styles.shadowingText}>잘 들어보세요...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.border,
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
  },
  npcMessage: {
    alignItems: "flex-start",
    marginBottom: 12,
  },
  npcBubble: {
    maxWidth: "80%",
    backgroundColor: colors.npcBubble,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  npcTextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  npcText: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.textDark,
    flex: 1,
    lineHeight: 26,
  },
  npcTranslation: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
  },
  translationBlur: {
    backgroundColor: colors.borderLight,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  translationBlurText: {
    fontSize: 13,
    color: colors.textLight,
  },
  userMessage: {
    alignItems: "flex-end",
    marginBottom: 12,
  },
  userBubble: {
    maxWidth: "80%",
    backgroundColor: colors.primary,
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 14,
  },
  userText: {
    fontSize: 17,
    color: colors.surface,
    lineHeight: 24,
  },
  inputArea: {
    marginTop: 8,
    marginBottom: 16,
  },
  shadowingArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 20,
  },
  shadowingText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "500",
  },
});
