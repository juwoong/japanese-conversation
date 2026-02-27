/**
 * Hook for managing the 4-phase learning session:
 * Watch -> Catch -> Engage -> Review
 *
 * Wraps useSession and adds phase management on top.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useSession } from "./useSession";
import { getVariationData } from "../lib/variationEngine";
import { supabase } from "../lib/supabase";
import type { SessionPhase, SessionMode, ModelLine, KeyExpression, Line } from "../types";

interface FourPhaseState {
  phase: SessionPhase;
  inputMode: SessionMode;
  visitCount: number;
}

export interface VariationInfo {
  slug: string;
  newExpressions: string[];
  reusedFromBase: string[];
}

interface UseFourPhaseSessionReturn {
  // Underlying session data
  loading: boolean;
  error: string | null;
  situation: ReturnType<typeof useSession>["situation"];
  lines: Line[];

  // Phase state
  phase: SessionPhase;
  inputMode: SessionMode;
  visitCount: number;

  // Persona
  personaSlug: string;

  // Variation
  variationInfo: VariationInfo | null;

  // Derived data
  modelDialogue: ModelLine[];
  keyExpressions: KeyExpression[];

  // Actions
  setInputMode: (mode: SessionMode) => void;
  advancePhase: () => void;

  // Pass-through from useSession for Engage phase
  session: ReturnType<typeof useSession>;
}

export function useFourPhaseSession(
  situationId: number,
  variationSlug?: string,
): UseFourPhaseSessionReturn {
  const session = useSession(situationId);

  // 페르소나 슬러그 — 경어/반말 톤 분기용
  const [personaSlug, setPersonaSlug] = useState<string>("tourist");

  useEffect(() => {
    if (session.situation?.persona_id) {
      supabase
        .from("personas")
        .select("slug")
        .eq("id", session.situation.persona_id)
        .single()
        .then(({ data }) => {
          if (data?.slug) setPersonaSlug(data.slug);
        });
    }
  }, [session.situation?.persona_id]);

  // 변주 시나리오 메타데이터
  // TODO: 현재 MVP는 메타데이터 오버레이만 — Watch/Engage는 base 대화 그대로 재생.
  //       실제 변주 대사를 보여주려면 DB에 variation별 situation + lines 레코드 필요.
  //       SRS도 variation 신규 표현은 line_id가 없어 grading 스킵됨.
  const variationInfo = useMemo<VariationInfo | null>(() => {
    if (!variationSlug) return null;
    const data = getVariationData(variationSlug);
    if (!data) return null;
    return {
      slug: variationSlug,
      newExpressions: data.newExpressions,
      reusedFromBase: data.reusedFromBase,
    };
  }, [variationSlug]);

  const [state, setState] = useState<FourPhaseState>({
    phase: "watch",
    inputMode: "voice",
    visitCount: 1,
  });

  // Convert DB lines to ModelLine format for Watch phase
  const modelDialogue = useMemo<ModelLine[]>(() => {
    return session.lines.map((line, index) => ({
      lineIndex: index,
      speaker: line.speaker,
      textJa: line.text_ja,
      textKo: line.text_ko,
      furigana: line.furigana,
      isKeyExpression: line.speaker === "user",
      audioPlayed: false,
      branches: line.branches,
    }));
  }, [session.lines]);

  // Extract key expressions (user lines + all branch options for Catch exposure)
  const keyExpressions = useMemo<KeyExpression[]>(() => {
    const expressions: KeyExpression[] = [];
    for (const line of session.lines) {
      if (line.speaker !== "user") continue;
      const idx = session.lines.indexOf(line);
      let npcPrompt = "";
      for (let j = idx - 1; j >= 0; j--) {
        if (session.lines[j].speaker === "npc") {
          npcPrompt = session.lines[j].text_ja;
          break;
        }
      }
      // Base expression (default path)
      expressions.push({
        textJa: line.text_ja,
        textKo: line.text_ko,
        furigana: line.furigana,
        npcPrompt,
      });
      // Branch expressions (extra vocab exposure for Catch)
      if (line.branches) {
        for (const branch of line.branches) {
          // Skip if same as base text
          if (branch.text_ja === line.text_ja) continue;
          expressions.push({
            textJa: branch.text_ja,
            textKo: branch.text_ko,
            furigana: branch.furigana,
            npcPrompt,
          });
        }
      }
    }
    return expressions;
  }, [session.lines]);

  const setInputMode = useCallback((mode: SessionMode) => {
    setState((s) => ({ ...s, inputMode: mode }));
  }, []);

  const advancePhase = useCallback(() => {
    setState((s) => {
      const order: SessionPhase[] = ["watch", "catch", "engage", "review"];
      const currentIdx = order.indexOf(s.phase);
      if (currentIdx < order.length - 1) {
        return { ...s, phase: order[currentIdx + 1] };
      }
      // After review, cycle back to watch with incremented visit
      return { ...s, phase: "watch", visitCount: s.visitCount + 1 };
    });
  }, []);

  return {
    loading: session.loading,
    error: session.error,
    situation: session.situation,
    lines: session.lines,
    phase: state.phase,
    inputMode: state.inputMode,
    visitCount: state.visitCount,
    personaSlug,
    variationInfo,
    modelDialogue,
    keyExpressions,
    setInputMode,
    advancePhase,
    session,
  };
}
