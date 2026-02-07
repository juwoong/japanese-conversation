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

interface VocabWord {
  id: number;
  word_ja: string;
  reading_hiragana: string;
  reading_ko: string;
  meaning_ko: string;
  pos: string;
  situation_name: string;
}

const POS_COLORS: Record<string, string> = {
  "명사": "#6366f1",
  "동사": "#10b981",
  "형용사": "#f59e0b",
  "부사": "#ec4899",
  "조사": "#8b5cf6",
  "접속사": "#06b6d4",
  "감탄사": "#f97316",
  "조동사": "#14b8a6",
};

const POS_DEFAULT_COLOR = "#64748b";

export default function VocabularyScreen({ navigation }: Props) {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPos, setSelectedPos] = useState<string | null>(null);

  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("vocabulary")
      .select(`
        id,
        word_ja,
        reading_hiragana,
        reading_ko,
        meaning_ko,
        pos,
        situations!inner ( name_ko )
      `)
      .order("id", { ascending: true });

    if (error) {
      console.error("Error loading vocabulary:", error);
      setLoading(false);
      return;
    }

    const vocabWords: VocabWord[] = (data || []).map((row: any) => ({
      id: row.id,
      word_ja: row.word_ja,
      reading_hiragana: row.reading_hiragana,
      reading_ko: row.reading_ko,
      meaning_ko: row.meaning_ko,
      pos: row.pos,
      situation_name: row.situations.name_ko,
    }));

    setWords(vocabWords);
    setLoading(false);
  };

  // Collect unique POS tags for filter
  const posTags = Array.from(new Set(words.map((w) => w.pos)));

  const filteredWords = words.filter((word) => {
    // POS filter
    if (selectedPos && word.pos !== selectedPos) return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return (
        word.word_ja.toLowerCase().includes(q) ||
        word.reading_hiragana.toLowerCase().includes(q) ||
        word.reading_ko.toLowerCase().includes(q) ||
        word.meaning_ko.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const speakWord = (text: string, id: number) => {
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

  const getPosColor = (pos: string): string => POS_COLORS[pos] ?? POS_DEFAULT_COLOR;

  const renderItem = ({ item }: { item: VocabWord }) => (
    <TouchableOpacity
      style={styles.wordCard}
      onPress={() => speakWord(item.word_ja, item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <View style={styles.wordSection}>
          <Text style={styles.wordJa}>{item.word_ja}</Text>
          <Text style={styles.readingHiragana}>{item.reading_hiragana}</Text>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.posBadge, { backgroundColor: getPosColor(item.pos) + "18" }]}>
            <Text style={[styles.posText, { color: getPosColor(item.pos) }]}>{item.pos}</Text>
          </View>
          <Text style={styles.speakerIcon}>
            {speakingId === item.id ? "🔊" : "🔈"}
          </Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <Text style={styles.readingKo}>{item.reading_ko}</Text>
        <Text style={styles.meaningKo}>{item.meaning_ko}</Text>
      </View>

      <Text style={styles.situationLabel}>{item.situation_name}</Text>
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
          placeholder="단어, 읽기, 뜻으로 검색..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <Text style={styles.totalCount}>
          전체 {words.length}개 단어
          {filteredWords.length !== words.length && ` (${filteredWords.length}개 표시)`}
        </Text>
      </View>

      {/* POS Filter Tabs */}
      <View style={styles.filterScroll}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[null, ...posTags]}
          keyExtractor={(item) => item ?? "all"}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item: pos }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                (pos === null ? selectedPos === null : selectedPos === pos) && styles.filterTabActive,
              ]}
              onPress={() => setSelectedPos(pos)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  (pos === null ? selectedPos === null : selectedPos === pos) && styles.filterTabTextActive,
                ]}
              >
                {pos ?? "전체"}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Word List */}
      {filteredWords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyText}>
            {searchQuery.trim()
              ? "검색 결과가 없습니다."
              : "아직 등록된 단어가 없습니다."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredWords}
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  totalCount: {
    fontSize: 14,
    color: colors.textMuted,
  },
  filterScroll: {
    backgroundColor: colors.background,
  },
  filterContent: {
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
  wordCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    ...shadows.md,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  wordSection: {
    flex: 1,
  },
  wordJa: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textDark,
  },
  readingHiragana: {
    fontSize: 15,
    color: colors.primary,
    marginTop: 2,
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  posBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  posText: {
    fontSize: 12,
    fontWeight: "600",
  },
  speakerIcon: {
    fontSize: 20,
  },
  cardBottom: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  readingKo: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 4,
  },
  meaningKo: {
    fontSize: 15,
    color: colors.textMuted,
  },
  situationLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 10,
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
