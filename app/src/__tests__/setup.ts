// Global mocks for React Native / Expo modules
// These are applied before each test suite via jest setupFiles

jest.mock("expo-speech", () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
}));

jest.mock("expo-av", () => ({
  Audio: {
    Recording: jest.fn(),
    setAudioModeAsync: jest.fn(),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  },
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn((callback: any) => {
    callback({ isConnected: true });
    return jest.fn();
  }),
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
}));

jest.mock("../lib/audio", () => ({
  startRecording: jest.fn().mockResolvedValue(undefined),
  stopRecording: jest.fn().mockResolvedValue({ uri: "file://test.m4a" }),
  cancelRecording: jest.fn().mockResolvedValue(undefined),
  getRecordingStatus: jest.fn().mockResolvedValue(null),
}));

jest.mock("../lib/stt", () => ({
  transcribeAudio: jest.fn().mockResolvedValue({ text: "テスト" }),
}));

// Suppress console.error in tests
jest.spyOn(console, "error").mockImplementation(() => {});

export {};
