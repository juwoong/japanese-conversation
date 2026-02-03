import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../constants/theme";

export default function BackHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backButton}>← 뒤로</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={{ width: 50 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
  },
});
