/**
 * 페르소나별 맵 설정 + D-Day 학습 페이스
 */

export interface MapSituationConfig {
  slug: string;
  label: string;
  emoji: string;
  color: string;
}

// ============ 페르소나별 여행 루트 ============

const TOURIST_MAP: MapSituationConfig[] = [
  { slug: "convenience_store", label: "편의점", emoji: "🏪", color: "#FF9800" },
  { slug: "cafe", label: "카페", emoji: "☕", color: "#795548" },
  { slug: "restaurant", label: "식당", emoji: "🍜", color: "#FF5722" },
  { slug: "train_station", label: "전철", emoji: "🚃", color: "#4CAF50" },
  { slug: "hotel_checkin", label: "호텔", emoji: "🏨", color: "#D2B48C" },
  { slug: "ask_directions", label: "길 묻기", emoji: "🗺️", color: "#E53935" },
  { slug: "taxi", label: "택시", emoji: "🚕", color: "#1976D2" },
];

const BUSINESS_MAP: MapSituationConfig[] = [
  { slug: "airport_pickup", label: "공항 마중", emoji: "✈️", color: "#87CEEB" },
  { slug: "business_card", label: "명함 교환", emoji: "🤝", color: "#607D8B" },
  { slug: "office_guide", label: "회의실", emoji: "🏢", color: "#78909C" },
  { slug: "meeting_response", label: "회의 응답", emoji: "💬", color: "#5C6BC0" },
  { slug: "business_taxi", label: "택시", emoji: "🚕", color: "#1976D2" },
  { slug: "business_dinner", label: "식사 접대", emoji: "🍶", color: "#FF5722" },
  { slug: "farewell", label: "작별 인사", emoji: "👋", color: "#9C27B0" },
];

const WORKINGHOLIDAY_MAP: MapSituationConfig[] = [
  { slug: "supermarket", label: "슈퍼", emoji: "🛒", color: "#4CAF50" },
  { slug: "neighbor_greeting", label: "이웃 인사", emoji: "🏠", color: "#8BC34A" },
  { slug: "post_office", label: "우체국", emoji: "📮", color: "#F44336" },
  { slug: "phone_contract", label: "휴대폰", emoji: "📱", color: "#2196F3" },
  { slug: "hospital", label: "병원", emoji: "🏥", color: "#E91E63" },
  { slug: "bank_account", label: "은행", emoji: "🏦", color: "#FFC107" },
  { slug: "real_estate", label: "부동산", emoji: "🔑", color: "#795548" },
  { slug: "part_time_interview", label: "면접", emoji: "💼", color: "#FF9800" },
];

export function getMapSituations(personaSlug: string): MapSituationConfig[] {
  switch (personaSlug) {
    case "business":
      return BUSINESS_MAP;
    case "workingholiday":
      return WORKINGHOLIDAY_MAP;
    default:
      return TOURIST_MAP;
  }
}

/**
 * D-Day 기반 학습 페이스 계산
 * @returns 하루 추천 상황 수 (null = 출발일 미설정 또는 이미 지남)
 */
export function getDailyPace(
  departureDate: string | null,
  totalSituations: number,
  completedCount: number,
): number | null {
  if (!departureDate) return null;

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dep = new Date(departureDate);
  const depMidnight = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate());
  const daysLeft = Math.round(
    (depMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft <= 0) return null;

  const remaining = totalSituations - completedCount;
  if (remaining <= 0) return 0;

  return Math.max(1, Math.ceil(remaining / daysLeft));
}
