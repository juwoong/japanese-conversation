import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import type { RootStackParamList } from "../types";
import { colors } from "../constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
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
  jlpt_target: string | null;
}

const POS_COLORS: Record<string, string> = {
  "명사": colors.primary,
  "동사": colors.success,
  "형용사": colors.warning,
  "부사": "#C76B8A",
  "조사": colors.secondary,
  "접속사": "#5A9EBF",
  "감탄사": "#D98A5B",
  "조동사": "#6BAA8A",
};

const POS_DEFAULT_COLOR = colors.textMuted;

export default function VocabularyScreen({ navigation }: Props) {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPos, setSelectedPos] = useState<string | null>(null);
  const [selectedJlpt, setSelectedJlpt] = useState<string | null>(null);
  const [revealedId, setRevealedId] = useState<number | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealFadeAnim = useRef(new Animated.Value(1)).current;

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
        situations!inner ( name_ko, jlpt_target )
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
      jlpt_target: row.situations.jlpt_target,
    }));

    setWords(vocabWords);
    setLoading(false);
  };

  // Collect unique POS tags for filter
  const posTags = Array.from(new Set(words.map((w) => w.pos)));

  const JLPT_LEVELS = ["N5", "N4", "N3"];

  const filteredWords = words.filter((word) => {
    // JLPT filter
    if (selectedJlpt && word.jlpt_target !== selectedJlpt) return false;

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

  const handleRevealMeaning = (id: number) => {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    setRevealedId(id);
    revealFadeAnim.setValue(1);
    revealTimerRef.current = setTimeout(() => {
      Animated.timing(revealFadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setRevealedId(null));
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, []);

  const renderItem = ({ item }: { item: VocabWord }) => (
    <View style={styles.wordCard}>
      <View style={styles.cardTop}>
        <View style={styles.wordSection}>
          <Text style={styles.wordJa}>{item.word_ja}</Text>
          <Text style={styles.readingHiragana}>{item.reading_hiragana}</Text>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.posBadge, { backgroundColor: getPosColor(item.pos) + "18" }]}>
            <Text style={[styles.posText, { color: getPosColor(item.pos) }]}>{item.pos}</Text>
          </View>
          <TouchableOpacity onPress={() => speakWord(item.word_ja, item.id)} hitSlop={8}>
            <MaterialIcons
              name="volume-up"
              size={22}
              color={speakingId === item.id ? colors.primary : colors.textLight}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardBottom}>
        {revealedId === item.id ? (
          <Animated.Text style={[styles.meaningKo, { opacity: revealFadeAnim }]}>
            {item.meaning_ko}
          </Animated.Text>
        ) : (
          <TouchableOpacity onPress={() => handleRevealMeaning(item.id)} style={styles.meaningHintButton}>
            <Text style={styles.meaningHintText}>[?] 뜻 보기</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.situationLabel}>{item.situation_name}</Text>
    </View>
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <BackHeader title="표현 모음" onBack={() => navigation.goBack()} />

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
          {" · "}
          {JLPT_LEVELS.map(
            (level) => `${level} ${words.filter((w) => w.jlpt_target === level).length}`
          ).join(" / ")}
        </Text>
      </View>

      {/* JLPT Filter Tabs */}
      <View style={styles.filterScroll}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[null, ...JLPT_LEVELS]}
          keyExtractor={(item) => item ?? "all-jlpt"}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item: level }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                (level === null ? selectedJlpt === null : selectedJlpt === level) && styles.filterTabActive,
              ]}
              onPress={() => setSelectedJlpt(level)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  (level === null ? selectedJlpt === null : selectedJlpt === level) && styles.filterTabTextActive,
                ]}
              >
                {level ?? "전체"}
              </Text>
            </TouchableOpacity>
          )}
        />
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
          <MaterialIcons name="library-books" size={64} color={colors.textLight} style={{ marginBottom: 16 }} />
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
          extraData={revealedId}
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
    backgroundColor: colors.backgroundAlt,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textDark,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
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
    borderWidth: 1,
    borderColor: colors.border,
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
  cardBottom: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  meaningKo: {
    fontSize: 15,
    color: colors.textMuted,
  },
  meaningHintButton: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  meaningHintText: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: "500",
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
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
  },
});
