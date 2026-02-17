import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../constants/theme";

const abilityMap: Record<string, string> = {
  airport_pickup: "공항에서 안내를 받을 수",
  train_station: "전철을 탈 수",
  hotel_checkin: "호텔에 체크인할 수",
  convenience_store: "편의점에서 물건을 살 수",
  restaurant: "식당에서 주문할 수",
  sightseeing: "관광지에서 도움을 요청할 수",
  shopping_market: "쇼핑할 수",
  emergency: "긴급 상황에 대처할 수",
  cafe: "카페에서 주문할 수",
  ask_directions: "길을 물어볼 수",
  taxi: "택시를 탈 수",
};

interface AbilityStatementProps {
  completedSlugs: string[];
}

export default function AbilityStatement({ completedSlugs }: AbilityStatementProps) {
  const abilities = completedSlugs
    .map((slug) => abilityMap[slug])
    .filter(Boolean);

  let statement: string;
  if (abilities.length === 0) {
    statement = "도쿄 여행을 시작해볼까요?";
  } else if (abilities.length === 1) {
    statement = `혼자 ${abilities[0]} 있습니다`;
  } else {
    const last = abilities[abilities.length - 1];
    const rest = abilities.slice(0, -1).join(", ");
    statement = `혼자 ${rest}, ${last} 있습니다`;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{statement}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.secondaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
