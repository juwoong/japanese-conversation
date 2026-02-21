/**
 * EngagePhase — Phase 3: AI NPC practice conversation.
 *
 * State machine:
 *   1. NPC turn: TTS + NpcBubble
 *   2. User turn: ChoiceInput / FillBlankInput / FreeInput based on visitCount
 *   3. NPC feedback: recast / clarification / meta_hint / none
 *   4. After choice in voice mode: play model answer TTS
 *   5. Repeat for all dialogue turns, then complete
 *
 * Input difficulty:
 *   visitCount <= 2  -> ChoiceInput only
 *   visitCount 3~4   -> FillBlankInput
 *   visitCount >= 5  -> FreeInput
 *
 * Feedback (NPC stays in character):
 *   - recast: NPC restates with correct form highlighted
 *   - clarification: NPC asks user to repeat (in Japanese)
 *   - meta_hint: collapsible Korean hint card after 2+ same-type errors
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import * as Speech from "expo-speech";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";
import type {
  KeyExpression,
  ModelLine,
  EngagePerformance,
  TurnRecord,
  SessionMode,
  FuriganaSegment,
} from "../../types";
import { generateNpcResponse, buildErrorEntry } from "../../lib/npcEngine";
import { classifyErrorType, type FeedbackType } from "../../lib/feedbackLayer";

import FuriganaText from "../FuriganaText";
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

type TurnPhase =
  | "npc_speaking"
  | "user_input"
  | "npc_responding"
  | "user_shadowing"
  | "done";

interface ConversationMessage {
  speaker: "npc" | "user";
  textJa: string;
  textKo: string;
  furigana?: FuriganaSegment[];
  feedbackType?: FeedbackType;
  recastHighlight?: string;
  metaHint?: string;
}

/**
 * Generate 3 choices: 1 correct + 2 distractors from other user lines.
 */
function buildChoices(
  correctLine: ModelLine,
  allLines: ModelLine[]
): { textJa: string; isCorrect: boolean; furigana?: FuriganaSegment[] }[] {
  const otherUserLines = allLines.filter(
    (l) => l.speaker === "user" && l.textJa !== correctLine.textJa
  );

  const shuffled = [...otherUserLines].sort(() => Math.random() - 0.5);
  const distractors = shuffled.slice(0, 2).map((l) => ({
    textJa: l.textJa,
    isCorrect: false,
    furigana: l.furigana,
  }));

  while (distractors.length < 2) {
    distractors.push({
      textJa: correctLine.textJa + "か",
      isCorrect: false,
      furigana: undefined,
    });
  }

  const choices = [
    { textJa: correctLine.textJa, isCorrect: true, furigana: correctLine.furigana },
    ...distractors,
  ];
  return choices.sort(() => Math.random() - 0.5);
}

/**
 * Build fill-blank data from a user line.
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
  const [revealedTranslations, setRevealedTranslations] = useState<Set<number>>(
    new Set()
  );
  const [expandedHints, setExpandedHints] = useState<Set<number>>(new Set());
  const scrollRef = useRef<ScrollView>(null);
  const messagesRef = useRef<ConversationMessage[]>([]);

  // Mutable refs to avoid stale closures
  const correctRef = useRef(0);
  const incorrectRef = useRef(0);
  const errorHistoryRef = useRef<{ text: string; type: string }[]>([]);
  const turnRecordsRef = useRef<TurnRecord[]>([]);

  // Typing indicator animation
  const typingDots = useRef(new Animated.Value(0)).current;

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

  // Keep messagesRef in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, turnPhase]);

  // Typing indicator animation loop
  useEffect(() => {
    if (turnPhase !== "npc_responding") {
      typingDots.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(typingDots, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(typingDots, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [turnPhase]);

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

  /**
   * Find the next NPC line in the model dialogue after the current turn.
   */
  const findNextNpcLine = (): string | undefined => {
    for (let i = turnIndex + 1; i < modelDialogue.length; i++) {
      if (modelDialogue[i].speaker === "npc") {
        return modelDialogue[i].textJa;
      }
    }
    return undefined;
  };

  const handleUserAnswer = async (correct: boolean, chosenText: string) => {
    // Find furigana for the chosen text from model dialogue
    const matchedFurigana = modelDialogue.find(
      (l) => l.textJa === chosenText
    )?.furigana;

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        speaker: "user",
        textJa: chosenText,
        textKo: currentLine?.textKo ?? "",
        furigana: matchedFurigana,
      },
    ]);

    if (correct) {
      correctRef.current += 1;
      setCorrectCount(correctRef.current);
    } else {
      incorrectRef.current += 1;
      setIncorrectCount(incorrectRef.current);
    }

    const inputType = getInputType();
    const expectedText = currentLine?.textJa ?? "";

    // Record turn data for ReviewPhase
    const matchedKe = keyExpressions.find(
      (ke) => expectedText.includes(ke.textJa) || ke.textJa.includes(expectedText)
    )?.textJa;

    const turnRecord: TurnRecord = {
      userText: chosenText,
      expectedText,
      correct,
      feedbackType: 'none',
      errorType: correct ? undefined : classifyErrorType(chosenText, expectedText),
      keyExpressionJa: matchedKe,
    };
    if (inputType === "free" && currentLine) {
      setTurnPhase("npc_responding");

      const npcResponse = await generateNpcResponse({
        situation: "",
        userMessage: chosenText,
        expectedResponse: currentLine.textJa,
        errorHistory: errorHistoryRef.current,
        turnNumber: turnIndex,
        nextNpcLine: findNextNpcLine(),
        totalTurns,
      });

      // Update turn record with actual feedback type
      turnRecord.feedbackType = npcResponse.feedbackType;
      turnRecord.recastHighlight = npcResponse.recastHighlight;

      // Track error if there was feedback
      if (npcResponse.feedbackType !== "none") {
        errorHistoryRef.current = [
          ...errorHistoryRef.current,
          buildErrorEntry(chosenText, currentLine.textJa),
        ];
      }

      // Handle clarification: don't advance, let user retry
      if (npcResponse.feedbackType === "clarification") {
        turnRecordsRef.current.push(turnRecord);
        setMessages((prev) => [
          ...prev,
          {
            speaker: "npc",
            textJa: npcResponse.text,
            textKo: "",
            feedbackType: "clarification",
          },
        ]);
        setTurnPhase("user_input");
        return;
      }

      turnRecordsRef.current.push(turnRecord);

      // Add NPC feedback response
      if (npcResponse.feedbackType !== "none") {
        setMessages((prev) => [
          ...prev,
          {
            speaker: "npc",
            textJa: npcResponse.text,
            textKo: "",
            feedbackType: npcResponse.feedbackType,
            recastHighlight: npcResponse.recastHighlight,
            metaHint: npcResponse.metaHint,
          },
        ]);

        // Speak the NPC feedback
        setIsSpeaking(true);
        Speech.speak(npcResponse.text, {
          language: "ja-JP",
          rate: 0.8,
          onDone: () => {
            setIsSpeaking(false);
            if (npcResponse.shouldEnd) {
              finishPhase();
            } else {
              advanceToNext();
            }
          },
          onError: () => {
            setIsSpeaking(false);
            if (npcResponse.shouldEnd) {
              finishPhase();
            } else {
              advanceToNext();
            }
          },
        });
        return;
      }

      // No feedback needed — fall through to normal advance
      setTurnPhase("npc_speaking");
    }

    // For choice/fillblank: record with feedbackType based on correctness
    if (inputType !== "free") {
      turnRecord.feedbackType = correct ? 'none' : 'recast';
      turnRecordsRef.current.push(turnRecord);
    }

    // In voice mode, play model answer TTS before advancing
    if (inputMode === "voice" && currentLine && inputType !== "free") {
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
    } else if (inputType !== "free") {
      advanceToNext();
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
      finishPhase();
      return;
    }
    setTurnIndex(nextIdx);
    setTurnPhase("npc_speaking");
  };

  const finishPhase = () => {
    setTurnPhase("done");

    // Build error breakdown from error history
    const errorBreakdown: Record<string, number> = {};
    for (const entry of errorHistoryRef.current) {
      errorBreakdown[entry.type] = (errorBreakdown[entry.type] ?? 0) + 1;
    }

    // Read latest messages from ref (avoids calling onComplete inside setState)
    const conversationLog = messagesRef.current
      .filter((m) => m.feedbackType !== "clarification")
      .map((m) => ({
        speaker: m.speaker,
        textJa: m.textJa,
        textKo: m.textKo,
        feedbackType: m.feedbackType,
      }));

    onComplete({
      totalTurns,
      userTurns: userTurnCount,
      correctCount: correctRef.current,
      incorrectCount: incorrectRef.current,
      turnRecords: turnRecordsRef.current,
      errorBreakdown,
      conversationLog,
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

  const toggleHint = (index: number) => {
    setExpandedHints((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
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

  /**
   * Render NPC message bubble with feedback styling.
   */
  const renderNpcMessage = (msg: ConversationMessage, index: number) => {
    const hasRecast = msg.feedbackType === "recast" || msg.feedbackType === "meta_hint";
    const hasMetaHint = msg.feedbackType === "meta_hint" && msg.metaHint;

    return (
      <View key={index} style={styles.npcMessage}>
        <View style={[styles.npcBubble, hasRecast && styles.npcBubbleRecast]}>
          <View style={styles.npcTextRow}>
            {hasRecast && msg.recastHighlight ? (
              <Text style={styles.npcText}>
                {renderRecastText(msg.textJa, msg.recastHighlight)}
              </Text>
            ) : msg.furigana && msg.furigana.length > 0 ? (
              <View style={{ flex: 1 }}>
                <FuriganaText
                  segments={msg.furigana}
                  fontSize={18}
                  color={colors.textDark}
                  highlightColor={colors.primary}
                  readingColor="#E8636F80"
                  speakOnTap
                />
              </View>
            ) : (
              <Text style={styles.npcText}>{msg.textJa}</Text>
            )}
            <TouchableOpacity onPress={() => speakText(msg.textJa)}>
              <MaterialIcons
                name="volume-up"
                size={20}
                color={isSpeaking ? colors.primary : colors.textLight}
              />
            </TouchableOpacity>
          </View>

          {msg.textKo ? (
            <TouchableOpacity onPress={() => toggleTranslation(index)}>
              {revealedTranslations.has(index) ? (
                <Text style={styles.npcTranslation}>{msg.textKo}</Text>
              ) : (
                <View style={styles.translationBlur}>
                  <Text style={styles.translationBlurText}>?</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : null}

          {hasMetaHint && (
            <TouchableOpacity
              style={styles.hintToggle}
              onPress={() => toggleHint(index)}
              activeOpacity={0.7}
            >
              <View style={styles.hintToggleRow}>
                <Text style={styles.hintToggleIcon}>{'*'}</Text>
                <Text style={styles.hintToggleText}>힌트 보기</Text>
              </View>
              {expandedHints.has(index) && (
                <View style={styles.hintContent}>
                  <Text style={styles.hintContentText}>{msg.metaHint}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  /**
   * Highlight the recast portion within NPC text.
   * Returns a React element with the corrected form highlighted.
   */
  const renderRecastText = (
    fullText: string,
    highlight: string
  ): React.ReactNode => {
    if (!highlight) return fullText;

    const idx = fullText.indexOf(highlight);
    if (idx === -1) return fullText;

    const before = fullText.slice(0, idx);
    const after = fullText.slice(idx + highlight.length);

    return (
      <>
        {before}
        <Text style={styles.recastHighlight}>{highlight}</Text>
        {after}
      </>
    );
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
            return renderNpcMessage(msg, i);
          }

          return (
            <View key={i} style={styles.userMessage}>
              <View style={styles.userBubble}>
                {msg.furigana && msg.furigana.length > 0 ? (
                  <FuriganaText
                    segments={msg.furigana}
                    fontSize={17}
                    color={colors.surface}
                    highlightColor="#FFFFFF"
                    dimColor="rgba(255,255,255,0.6)"
                    readingColor="rgba(255,255,255,0.5)"
                    speakOnTap
                  />
                ) : (
                  <Text style={styles.userText}>{msg.textJa}</Text>
                )}
              </View>
            </View>
          );
        })}

        {/* Typing indicator */}
        {turnPhase === "npc_responding" && (
          <View style={styles.npcMessage}>
            <Animated.View
              style={[styles.typingBubble, { opacity: typingDots }]}
            >
              <Text style={styles.typingDots}>...</Text>
            </Animated.View>
          </View>
        )}

        {turnPhase === "user_input" && (
          <View style={styles.userMessage}>
            <View style={[styles.userBubble, styles.userInputBubble]}>
              {renderUserInput()}
            </View>
          </View>
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
  npcBubbleRecast: {
    borderColor: colors.secondary,
    borderWidth: 1.5,
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
  recastHighlight: {
    backgroundColor: colors.secondaryLight,
    color: colors.secondary,
    fontWeight: "600",
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
  hintToggle: {
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  hintToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hintToggleIcon: {
    fontSize: 14,
    color: colors.warning,
  },
  hintToggleText: {
    fontSize: 13,
    color: colors.warning,
    fontWeight: "500",
  },
  hintContent: {
    backgroundColor: colors.warningLight,
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  hintContentText: {
    fontSize: 13,
    color: colors.textMedium,
    lineHeight: 18,
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
  typingBubble: {
    backgroundColor: colors.npcBubble,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typingDots: {
    fontSize: 24,
    color: colors.textLight,
    letterSpacing: 4,
    lineHeight: 28,
  },
  userInputBubble: {
    maxWidth: "100%",
    width: "100%",
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "stretch",
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
