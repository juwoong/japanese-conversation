import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from "react-native";
import * as Speech from "expo-speech";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import type { RootStackParamList } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Vocabulary">;

type FilterType = "all" | "weak" | "mastered";

interface VocabItem {
  id: number;
  line_id: number;
  text_ja: string;
  text_ko: string;
  pronunciation_ko: string | null;
  reps: number;
  state: string;
  accuracy: number | null;
  situation_name: string;
}

export default function VocabularyScreen({ navigation }: Props) {
  const [items, setItems] = useState<VocabItem[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [speakingId, setSpeakingId] = useState<number | null>(null);

  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get all learned lines from srs_cards
    const { data: cards, error } = await supabase
      .from("srs_cards")
      .select(`
        id,
        line_id,
        reps,
        state,
        lines!inner (
          id,
          text_ja,
          text_ko,
          pronunciation_ko,
          speaker,
          situations!inner (
            name_ko
          )
        )
      `)
      .eq("user_id", user.id)
      .gt("reps", 0)
      .order("reps", { ascending: false });

    if (error) {
      console.error("Error loading vocabulary:", error);
      setLoading(false);
      return;
    }

    // Get accuracy from attempts
    const { data: attempts } = await supabase
      .from("user_attempts")
      .select("line_id, accuracy")
      .eq("user_id", user.id)
      .order("attempted_at", { ascending: false });

    // Build accuracy map (latest attempt per line)
    const accuracyMap: Record<number, number> = {};
    attempts?.forEach((a) => {
      if (!(a.line_id in accuracyMap)) {
        accuracyMap[a.line_id] = a.accuracy;
      }
    });

    // Transform data
    const vocabItems: VocabItem[] = (cards || [])
      .filter((card: any) => card.lines?.speaker === "user")
      .map((card: any) => ({
        id: card.id,
        line_id: card.line_id,
        text_ja: card.lines.text_ja,
        text_ko: card.lines.text_ko,
        pronunciation_ko: card.lines.pronunciation_ko,
        reps: card.reps,
        state: card.state,
        accuracy: accuracyMap[card.line_id] ?? null,
        situation_name: card.lines.situations.name_ko,
      }));

    setItems(vocabItems);
    setLoading(false);
  };

  const filteredItems = items.filter((item) => {
    switch (filter) {
      case "weak":
        return item.accuracy !== null && item.accuracy < 0.7;
      case "mastered":
        return item.state === "review" && (item.accuracy ?? 0) >= 0.9;
      default:
        return true;
    }
  });

  const speakText = async (text: string, id: number) => {
    if (speakingId === id) {
      Speech.stop();
      setSpeakingId(null);
      return;
    }

    setSpeakingId(id);
    Speech.speak(text, {
      language: "ja-JP",
      rate: 0.8,
      onDone: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  };

  const getStateLabel = (state: string): string => {
    switch (state) {
      case "new": return "새로운";
      case "learning": return "학습중";
      case "review": return "복습";
      case "relearning": return "재학습";
      default: return state;
    }
  };

  const getStateColor = (state: string): string => {
    switch (state) {
      case "new": return "#6366f1";
      case "learning": return "#f59e0b";
      case "review": return "#10b981";
      case "relearning": return "#ef4444";
      default: return "#64748b";
    }
  };

  const renderItem = ({ item }: { item: VocabItem }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => speakText(item.text_ja, item.id)}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.japaneseText}>{item.text_ja}</Text>
        <Text style={styles.speakerIcon}>
          {speakingId === item.id ? "🔊" : "🔈"}
        </Text>
      </View>

      {item.pronunciation_ko && (
        <Text style={styles.pronunciationText}>{item.pronunciation_ko}</Text>
      )}

      <Text style={styles.koreanText}>{item.text_ko}</Text>

      <View style={styles.itemFooter}>
        <View style={styles.tagContainer}>
          <View style={[styles.stateTag, { backgroundColor: getStateColor(item.state) + "20" }]}>
            <Text style={[styles.stateText, { color: getStateColor(item.state) }]}>
              {getStateLabel(item.state)}
            </Text>
          </View>
          <Text style={styles.situationText}>{item.situation_name}</Text>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>연습 {item.reps}회</Text>
          {item.accuracy !== null && (
            <Text style={[
              styles.accuracyText,
              { color: item.accuracy >= 0.8 ? "#10b981" : item.accuracy >= 0.5 ? "#f59e0b" : "#ef4444" }
            ]}>
              {Math.round(item.accuracy * 100)}%
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>단어장</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <Text style={styles.totalCount}>배운 표현: {items.length}개</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {[
          { key: "all", label: "전체" },
          { key: "weak", label: "약한 표현" },
          { key: "mastered", label: "마스터" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
            onPress={() => setFilter(tab.key as FilterType)}
          >
            <Text style={[styles.filterTabText, filter === tab.key && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyText}>
            {filter === "all"
              ? "아직 학습한 표현이 없습니다.\n학습을 시작해보세요!"
              : filter === "weak"
              ? "약한 표현이 없습니다.\n잘하고 계세요!"
              : "마스터한 표현이 없습니다.\n계속 연습해보세요!"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    fontSize: 16,
    color: "#6366f1",
    fontWeight: "500",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
  statsBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  totalCount: {
    fontSize: 14,
    color: "#64748b",
  },
  filterTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
  },
  filterTabActive: {
    backgroundColor: "#6366f1",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  filterTabTextActive: {
    color: "#fff",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  japaneseText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
  },
  speakerIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  pronunciationText: {
    fontSize: 14,
    color: "#6366f1",
    marginTop: 4,
  },
  koreanText: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 8,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  tagContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stateTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stateText: {
    fontSize: 12,
    fontWeight: "600",
  },
  situationText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statsText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  accuracyText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
});
