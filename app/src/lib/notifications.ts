/**
 * notifications.ts — Travel narrative notification system.
 *
 * All notifications use a "Tokyo travel" metaphor.
 * BANNED: guilt-based messaging, streak pressure, "놓치지 마세요", "목표 미달성", "스트릭이 끊겼습니다".
 */

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- Storage keys ---

const DAILY_NOTIFICATION_ID_KEY = "notification_daily_id";
const RETURN_NOTIFICATION_ID_KEY = "notification_return_id";

// --- Notification channel (Android) ---

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// --- Daily message templates ---

const DAILY_MESSAGES_GENERIC: string[] = [
  "오늘의 도쿄 산책, 어디로 가볼까요?",
  "도쿄 골목길에 새로운 이야기가 기다려요",
  "오늘도 도쿄 하루가 시작됩니다",
  "도쿄의 아침이에요. 잠깐 나가볼까요?",
];

const DAILY_MESSAGES_WITH_NEXT: string[] = [
  "{situation}에서 새로운 만남이 기다리고 있어요",
  "{situation}에 가볼 시간이에요",
  "오늘은 {situation}에서 이야기해볼까요?",
];

// --- Streak (travel-day) messages ---

const STREAK_MESSAGES: Record<string, string[]> = {
  early: [
    "{days}일째 도쿄 여행 중!",
    "도쿄 {days}일차, 슬슬 익숙해지는 느낌",
  ],
  mid: [
    "{days}일째 도쿄 생활! 단골 가게가 생길 때쯤이에요",
    "벌써 {days}일째, 도쿄가 편해지고 있어요",
  ],
  long: [
    "{days}일째, 이제 도쿄 현지인 같아요",
    "도쿄 {days}일차. 동네 사람들이 알아보기 시작했어요",
  ],
};

// --- Return messages (light/casual, never guilt) ---

const RETURN_MESSAGES: string[] = [
  "도쿄가 그리워요. 잠깐 들러볼까요?",
  "도쿄 골목에 바람이 불어요. 산책하러 갈까요?",
  "도쿄의 거리가 조용하네요. 다시 놀러 올 때가 됐어요",
  "도쿄에서 기다리고 있을게요. 편할 때 오세요",
];

// --- Helpers ---

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(template: string, replacements: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(`{${key}}`, value);
  }
  return result;
}

// --- Public API ---

/**
 * Request notification permission from the user.
 * Returns true if permission was granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return false;

  // Android notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("travel", {
      name: "도쿄 여행",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return true;
}

/**
 * Schedule a daily notification at the given hour (default 9 AM).
 * Replaces any previously scheduled daily notification.
 */
export async function scheduleDailyNotification(hour: number = 9): Promise<void> {
  // Cancel previous daily notification
  const prevId = await AsyncStorage.getItem(DAILY_NOTIFICATION_ID_KEY);
  if (prevId) {
    await Notifications.cancelScheduledNotificationAsync(prevId);
  }

  const trigger: Notifications.DailyTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute: 0,
  };
  if (Platform.OS === "android") {
    trigger.channelId = "travel";
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "도쿄 여행",
      body: pick(DAILY_MESSAGES_GENERIC),
    },
    trigger,
  });

  await AsyncStorage.setItem(DAILY_NOTIFICATION_ID_KEY, id);
}

/**
 * Schedule a one-time return notification for users who have been inactive.
 * Only fires if daysSinceLastStudy >= 3.
 */
export async function scheduleReturnNotification(daysSinceLastStudy: number): Promise<void> {
  if (daysSinceLastStudy < 3) return;

  // Cancel previous return notification
  const prevId = await AsyncStorage.getItem(RETURN_NOTIFICATION_ID_KEY);
  if (prevId) {
    await Notifications.cancelScheduledNotificationAsync(prevId);
  }

  const trigger: Notifications.TimeIntervalTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: 60, // fire soon — caller determines when to schedule
  };
  if (Platform.OS === "android") {
    trigger.channelId = "travel";
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "도쿄에서 온 편지",
      body: generateReturnMessage(daysSinceLastStudy),
    },
    trigger,
  });

  await AsyncStorage.setItem(RETURN_NOTIFICATION_ID_KEY, id);
}

/**
 * Generate a daily notification message body.
 * Uses completed situations for context and next situation for specificity.
 */
export function generateDailyMessage(
  completedSituations: string[],
  nextSituation?: string,
): string {
  if (nextSituation) {
    return fillTemplate(pick(DAILY_MESSAGES_WITH_NEXT), { situation: nextSituation });
  }

  if (completedSituations.length === 0) {
    return "첫 번째 도쿄 산책을 시작해볼까요?";
  }

  return pick(DAILY_MESSAGES_GENERIC);
}

/**
 * Generate a streak message framed as "도쿄 여행 N일차".
 * Never uses pressure language.
 */
export function generateStreakMessage(consecutiveDays: number): string {
  let bucket: string[];
  if (consecutiveDays <= 3) {
    bucket = STREAK_MESSAGES.early;
  } else if (consecutiveDays <= 10) {
    bucket = STREAK_MESSAGES.mid;
  } else {
    bucket = STREAK_MESSAGES.long;
  }
  return fillTemplate(pick(bucket), { days: String(consecutiveDays) });
}

/**
 * Generate a return message. Light and casual — no guilt.
 */
export function generateReturnMessage(_daysSinceLastStudy: number): string {
  return pick(RETURN_MESSAGES);
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.multiRemove([DAILY_NOTIFICATION_ID_KEY, RETURN_NOTIFICATION_ID_KEY]);
}
