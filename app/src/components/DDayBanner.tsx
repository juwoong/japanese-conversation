import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, borderRadius } from "../constants/theme";

interface DDayBannerProps {
  departureDate: string | null; // ISO date string or null if not set
  onPress?: () => void; // Navigate to settings
}

/**
 * Calculates the number of days remaining until the departure date.
 * Returns negative if the departure date has passed.
 */
function getDaysRemaining(departureDateISO: string): number {
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const departure = new Date(departureDateISO);
  const departureMidnight = new Date(
    departure.getFullYear(),
    departure.getMonth(),
    departure.getDate()
  );
  const diffMs = departureMidnight.getTime() - todayMidnight.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function getBannerContent(daysRemaining: number): { text: string; sub: string | null } | null {
  if (daysRemaining < 0) {
    // Past departure: don't show banner
    return null;
  }
  if (daysRemaining === 0) {
    return { text: "오늘 출발!", sub: "준비 완료!" };
  }
  if (daysRemaining <= 7) {
    return {
      text: `\u2708 거의 다 왔어요! ${daysRemaining}일 남았습니다`,
      sub: null,
    };
  }
  if (daysRemaining <= 30) {
    return {
      text: `\u2708 출발까지 ${daysRemaining}일!`,
      sub: "핵심 상황을 연습해보세요",
    };
  }
  // 30+ days
  return {
    text: `출발까지 ${daysRemaining}일 \u2708`,
    sub: null,
  };
}

function getBannerColors(daysRemaining: number) {
  if (daysRemaining === 0) {
    return { bg: "#FFF8E1", border: "#FFD54F", text: "#E65100" };
  }
  if (daysRemaining <= 7) {
    return { bg: "#FFF3E0", border: "#FFB74D", text: "#E65100" };
  }
  if (daysRemaining <= 30) {
    return { bg: "#E8F5E9", border: "#A5D6A7", text: "#2E7D32" };
  }
  return { bg: "#E3F2FD", border: "#90CAF9", text: "#1565C0" };
}

export default function DDayBanner({ departureDate, onPress }: DDayBannerProps) {
  if (!departureDate) return null;

  const daysRemaining = getDaysRemaining(departureDate);
  const content = getBannerContent(daysRemaining);

  if (!content) return null;

  const bannerColors = getBannerColors(daysRemaining);
  const isDDay = daysRemaining === 0;

  return (
    <TouchableOpacity
      style={[
        styles.banner,
        { backgroundColor: bannerColors.bg, borderColor: bannerColors.border },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.content}>
        <Text style={[styles.mainText, { color: bannerColors.text }]}>
          {isDDay ? "\uD83C\uDF89 " : ""}
          {content.text}
        </Text>
        {content.sub && (
          <Text style={[styles.subText, { color: bannerColors.text }]}>
            {content.sub}
          </Text>
        )}
      </View>
      {onPress && (
        <Text style={[styles.dday, { color: bannerColors.text }]}>
          D{daysRemaining === 0 ? "-Day" : `-${daysRemaining}`}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  content: {
    flex: 1,
  },
  mainText: {
    fontSize: 15,
    fontWeight: "600",
  },
  subText: {
    fontSize: 13,
    fontWeight: "400",
    marginTop: 2,
    opacity: 0.8,
  },
  dday: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 12,
  },
});
