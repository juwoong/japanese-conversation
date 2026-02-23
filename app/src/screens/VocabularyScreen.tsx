import React, { useState, useEffect, useRef, useCallback } from "react";
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
import type { RootStackParamList, FuriganaSegment } from "../types";
import { colors } from "../constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import LoadingScreen from "../components/LoadingScreen";
import BackHeader from "../components/BackHeader";
import FuriganaText from "../components/FuriganaText";

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

// 품사별 색상
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

// JLPT 레벨별 색상
const JLPT_COLORS: Record<string, string> = {
  "N5": colors.success,
  "N4": colors.secondary,
  "N3": colors.warning,
  "N2": colors.primary,
  "N1": colors.danger,
};

const JLPT_LEVELS = ["N5", "N4", "N3"];

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

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
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

  const posTags = Array.from(new Set(words.map((w) => w.pos)));

  const filteredWords = words.filter((word) => {
    if (selectedJlpt && word.jlpt_target !== selectedJlpt) return false;
    if (selectedPos && word.pos !== selectedPos) return false;
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

  const speakWord = useCallback((text: string, id: number) => {
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
  }, [speakingId]);

  const getPosColor = (pos: string): string => POS_COLORS[pos] ?? POS_DEFAULT_COLOR;
  const getJlptColor = (level: string | null): string => JLPT_COLORS[level ?? ""] ?? colors.textMuted;

  const handleRevealMeaning = useCallback((id: number) => {
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
  }, [revealFadeAnim]);

  // 한자가 포함된 단어 → FuriganaSegment 변환
  const makeFuriganaSegments = (wordJa: string, reading: string): FuriganaSegment[] => {
    const hasKanji = /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(wordJa);
    if (hasKanji) {
      return [{ text: wordJa, reading }];
    }
    // 히라가나/카타카나만 → reading 없이
    return [{ text: wordJa }];
  };

  const renderItem = ({ item }: { item: VocabWord }) => {
    const furiganaSegments = makeFuriganaSegments(item.word_ja, item.reading_hiragana);
    const jlptColor = getJlptColor(item.jlpt_target);
    const posColor = getPosColor(item.pos);

    return (
      <View style={styles.wordCard}>
        {/* 상단: 후리가나 + 배지 + 스피커 */}
        <View style={styles.cardTop}>
          <View style={styles.wordSection}>
            <FuriganaText
              segments={furiganaSegments}
              fontSize={26}
              color={colors.textDark}
              highlightColor={colors.textDark}
              readingColor={colors.primary}
              showReading={true}
            />
            <Text style={styles.readingKo}>{item.reading_ko}</Text>
          </View>

          <View style={styles.cardRight}>
            <View style={styles.badgeRow}>
              {/* JLPT 배지 */}
              {item.jlpt_target && (
                <View style={[styles.jlptBadge, { backgroundColor: jlptColor + "18" }]}>
                  <Text style={[styles.jlptText, { color: jlptColor }]}>{item.jlpt_target}</Text>
                </View>
              )}
              {/* 품사 배지 */}
              <View style={[styles.posBadge, { backgroundColor: posColor + "18" }]}>
                <Text style={[styles.posText, { color: posColor }]}>{item.pos}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => speakWord(item.word_ja, item.id)}
              hitSlop={8}
              style={styles.speakerButton}
            >
              <MaterialIcons
                name="volume-up"
                size={22}
                color={speakingId === item.id ? colors.primary : colors.textLight}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 하단: 뜻 보기 */}
        <View style={styles.cardBottom}>
          {revealedId === item.id ? (
            <Animated.Text style={[styles.meaningKo, { opacity: revealFadeAnim }]}>
              {item.meaning_ko}
            </Animated.Text>
          ) : (
            <TouchableOpacity onPress={() => handleRevealMeaning(item.id)} style={styles.meaningHintButton}>
              <MaterialIcons name="visibility" size={16} color={colors.textLight} />
              <Text style={styles.meaningHintText}>뜻 보기</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 상황 라벨 */}
        <Text style={styles.situationLabel}>{item.situation_name}</Text>
      </View>
    );
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <BackHeader title="표현 모음" onBack={() => navigation.goBack()} />

      {/* 검색 바 */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputWrapper}>
          <MaterialIcons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
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
      </View>

      {/* 통계 */}
      <View style={styles.statsBar}>
        <Text style={styles.totalCount}>
          전체 {words.length}개
          {filteredWords.length !== words.length && ` · ${filteredWords.length}개 표시`}
        </Text>
        <Text style={styles.jlptSummary}>
          {JLPT_LEVELS.map(
            (level) => `${level} ${words.filter((w) => w.jlpt_target === level).length}`
          ).join(" / ")}
        </Text>
      </View>

      {/* JLPT 필터 */}
      <View style={styles.filterScroll}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[null, ...JLPT_LEVELS]}
          keyExtractor={(item) => item ?? "all-jlpt"}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item: level }) => {
            const isActive = level === null ? selectedJlpt === null : selectedJlpt === level;
            const chipColor = level ? getJlptColor(level) : colors.primary;
            return (
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  isActive && { backgroundColor: chipColor, borderColor: chipColor },
                ]}
                onPress={() => setSelectedJlpt(level)}
              >
                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                  {level ?? "전체"}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* 품사 필터 */}
      <View style={styles.filterScroll}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[null, ...posTags]}
          keyExtractor={(item) => item ?? "all-pos"}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item: pos }) => {
            const isActive = pos === null ? selectedPos === null : selectedPos === pos;
            const chipColor = pos ? getPosColor(pos) : colors.primary;
            return (
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  isActive && { backgroundColor: chipColor, borderColor: chipColor },
                ]}
                onPress={() => setSelectedPos(pos)}
              >
                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                  {pos ?? "전체"}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* 단어 리스트 */}
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
  // 검색
  searchBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textDark,
  },
  // 통계
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  totalCount: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  jlptSummary: {
    fontSize: 12,
    color: colors.textLight,
  },
  // 필터
  filterScroll: {
    backgroundColor: colors.background,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textMuted,
  },
  filterTabTextActive: {
    color: colors.surface,
    fontWeight: "600",
  },
  // 카드
  listContent: {
    padding: 16,
    gap: 10,
  },
  wordCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  wordSection: {
    flex: 1,
    marginRight: 12,
  },
  readingKo: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 4,
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
  },
  jlptBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  jlptText: {
    fontSize: 11,
    fontWeight: "700",
  },
  posBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  posText: {
    fontSize: 11,
    fontWeight: "600",
  },
  speakerButton: {
    padding: 4,
  },
  // 뜻
  cardBottom: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  meaningKo: {
    fontSize: 15,
    color: colors.textMedium,
    fontWeight: "500",
  },
  meaningHintButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  meaningHintText: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: "500",
  },
  situationLabel: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 8,
  },
  // 빈 상태
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
