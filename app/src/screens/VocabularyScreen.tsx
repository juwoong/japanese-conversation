import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
} from "react-native";
import * as Speech from "expo-speech";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import type { RootStackParamList } from "../types";
import { colors, shadows } from "../constants/theme";
import LoadingScreen from "../components/LoadingScreen";
import BackHeader from "../components/BackHeader";

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
  const [searchQuery, setSearchQuery] = useState("");

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
    // Apply filter
    let passesFilter = true;
    switch (filter) {
      case "weak":
        passesFilter = item.accuracy !== null && item.accuracy < 0.7;
        break;
      case "mastered":
        passesFilter = item.state === "review" && (item.accuracy ?? 0) >= 0.9;
        break;
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        item.text_ja.toLowerCase().includes(q) ||
        item.text_ko.toLowerCase().includes(q) ||
        (item.pronunciation_ko?.toLowerCase().includes(q) ?? false);
      return passesFilter && matchesSearch;
    }

    return passesFilter;
  });

  const weakCount = items.filter((i) => i.accuracy !== null && i.accuracy < 0.7).length;

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
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <BackHeader title="단어장" onBack={() => navigation.goBack()} />

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="일본어 또는 한국어로 검색..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
      </View>

      {/* Stats + Practice Button */}
      <View style={styles.statsBar}>
        <Text style={styles.totalCount}>배운 표현: {items.length}개</Text>
        {weakCount > 0 && (
          <TouchableOpacity
            style={styles.practiceButton}
            onPress={() => navigation.navigate("Flashcard")}
          >
            <Text style={styles.practiceButtonText}>
              약한 표현 연습 ({weakCount})
            </Text>
          </TouchableOpacity>
        )}
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
            {searchQuery.trim()
              ? "검색 결과가 없습니다."
              : filter === "all"
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
    backgroundColor: colors.background,
  },
  searchBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  searchInput: {
    backgroundColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textDark,
  },
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  totalCount: {
    fontSize: 14,
    color: colors.textMuted,
  },
  practiceButton: {
    backgroundColor: colors.warning + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  practiceButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#92400e",
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
    backgroundColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textMuted,
  },
  filterTabTextActive: {
    color: colors.surface,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    ...shadows.md,
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
    color: colors.textDark,
    flex: 1,
  },
  speakerIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  pronunciationText: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
  },
  koreanText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 8,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
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
    color: colors.textLight,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statsText: {
    fontSize: 12,
    color: colors.textLight,
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
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
  },
});
