import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import type { SessionMode } from "../types";
import { colors } from "../constants/theme";

interface Props {
  visible: boolean;
  onSelect: (mode: SessionMode) => void;
}

export default function SessionModeSelector({ visible, onSelect }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>지금 말할 수 있는 환경인가요?</Text>

          <TouchableOpacity
            style={styles.voiceButton}
            onPress={() => onSelect("voice")}
          >
            <Text style={styles.voiceButtonText}>🎤 네, 말할 수 있어요</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.silentButton}
            onPress={() => onSelect("silent")}
          >
            <Text style={styles.silentButtonText}>🔇 지금은 조용히 할게요</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textDark,
    textAlign: "center",
    marginBottom: 24,
  },
  voiceButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  voiceButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  silentButton: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
  },
  silentButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textMedium,
  },
});
