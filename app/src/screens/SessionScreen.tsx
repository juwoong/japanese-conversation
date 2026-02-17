import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../constants/theme";
import { useFourPhaseSession } from "../hooks/useFourPhaseSession";
import LoadingScreen from "../components/LoadingScreen";
import SessionModeSelector from "../components/SessionModeSelector";
import WatchPhase from "../components/phases/WatchPhase";
import CatchPhase from "../components/phases/CatchPhase";
import EngagePhase from "../components/phases/EngagePhase";
import ReviewPhase from "../components/phases/ReviewPhase";
import type { RootStackParamList, SessionPhase, EngagePerformance } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Session">;

const PHASE_LABELS: Record<SessionPhase, string> = {
  watch: "관찰",
  catch: "포착",
  engage: "실전",
  review: "정리",
};

export default function SessionScreen({ navigation, route }: Props) {
  const { situationId } = route.params;
  const fourPhase = useFourPhaseSession(situationId);

  const [showModeSelector, setShowModeSelector] = useState(true);
  const [engagePerformance, setEngagePerformance] = useState<EngagePerformance | null>(null);

  // Phase transition animation
  const phaseOpacity = useRef(new Animated.Value(1)).current;

  const handlePhaseTransition = () => {
    // Fade out -> advance -> fade in
    Animated.timing(phaseOpacity, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      fourPhase.advancePhase();
      Animated.timing(phaseOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleComplete = () => {
    navigation.goBack();
  };

  const handleExit = () => {
    Alert.alert("학습 종료", "학습을 종료하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "종료", onPress: () => navigation.goBack() },
    ]);
  };

  // --- Loading / Error states ---

  if (fourPhase.loading) {
    return <LoadingScreen />;
  }

  if (fourPhase.error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={colors.textLight} />
          <Text style={styles.errorText}>{fourPhase.error}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (fourPhase.lines.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="inbox" size={48} color={colors.textLight} />
          <Text style={styles.errorText}>이 상황에 대사가 없습니다.</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- Phase rendering ---

  const renderPhase = () => {
    switch (fourPhase.phase) {
      case "watch":
        return (
          <WatchPhase
            modelDialogue={fourPhase.modelDialogue}
            inputMode={fourPhase.inputMode}
            onComplete={handlePhaseTransition}
          />
        );
      case "catch":
        return (
          <CatchPhase
            keyExpressions={fourPhase.keyExpressions}
            inputMode={fourPhase.inputMode}
            visitCount={fourPhase.visitCount}
            situationEmoji="🍽"
            onComplete={handlePhaseTransition}
          />
        );
      case "engage":
        return (
          <EngagePhase
            keyExpressions={fourPhase.keyExpressions}
            modelDialogue={fourPhase.modelDialogue}
            inputMode={fourPhase.inputMode}
            visitCount={fourPhase.visitCount}
            onComplete={(perf) => {
              setEngagePerformance(perf);
              handlePhaseTransition();
            }}
          />
        );
      case "review":
        return (
          <ReviewPhase
            keyExpressions={fourPhase.keyExpressions}
            performance={engagePerformance ?? undefined}
            situationName={fourPhase.situation?.name_ko}
            inputMode={fourPhase.inputMode}
            onComplete={handleComplete}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={styles.situationTitle} numberOfLines={1}>
          {fourPhase.situation?.name_ko}
        </Text>
        <Text style={styles.phaseLabel}>
          {PHASE_LABELS[fourPhase.phase]}
        </Text>
      </View>

      {/* Phase progress dots */}
      <View style={styles.phaseProgressRow}>
        {(["watch", "catch", "engage", "review"] as SessionPhase[]).map((p) => (
          <View
            key={p}
            style={[
              styles.phaseDot,
              fourPhase.phase === p && styles.phaseDotActive,
              (["watch", "catch", "engage", "review"] as SessionPhase[]).indexOf(p) <
                (["watch", "catch", "engage", "review"] as SessionPhase[]).indexOf(fourPhase.phase) &&
                styles.phaseDotDone,
            ]}
          />
        ))}
      </View>

      {/* Phase content with fade transition */}
      <Animated.View style={[styles.phaseContent, { opacity: phaseOpacity }]}>
        {renderPhase()}
      </Animated.View>

      {/* Mode selector modal */}
      <SessionModeSelector
        visible={showModeSelector}
        onSelect={(mode) => {
          fourPhase.setInputMode(mode);
          setShowModeSelector(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  situationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  phaseLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },

  // Phase progress dots
  phaseProgressRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 8,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  phaseDotActive: {
    backgroundColor: colors.primary,
    width: 20,
    borderRadius: 4,
  },
  phaseDotDone: {
    backgroundColor: colors.success,
  },

  // Phase content
  phaseContent: {
    flex: 1,
  },

  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  errorButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.surface,
  },
});
