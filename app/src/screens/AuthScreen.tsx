import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import type { RootStackParamList } from "../types";
import { colors } from "../constants/theme";
import { MaterialIcons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;

type AuthMode = "login" | "signup";

function ValidationItem({ label, met }: { label: string; met: boolean }) {
  return (
    <View style={styles.validationItem}>
      <MaterialIcons
        name={met ? "check-circle" : "radio-button-unchecked"}
        size={14}
        color={met ? colors.success : colors.textLight}
      />
      <Text style={[styles.validationText, met && styles.validationTextMet]}>
        {label}
      </Text>
    </View>
  );
}

export default function AuthScreen({ navigation }: Props) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("오류", "이메일과 비밀번호를 입력해주세요.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
      return;
    }

    if (mode === "signup" && password.length < 6) {
      Alert.alert("오류", "비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        // 성공 — onAuthStateChange가 화면 전환을 처리합니다
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        // 성공 — onAuthStateChange가 화면 전환을 처리합니다
      }
    } catch (error: any) {
      let message = "오류가 발생했습니다.";

      if (error.message?.includes("Invalid login credentials")) {
        message = "이메일 또는 비밀번호가 올바르지 않습니다.";
      } else if (error.message?.includes("User already registered")) {
        message = "이미 가입된 이메일입니다.";
      } else if (error.message?.includes("Invalid email")) {
        message = "올바른 이메일 형식이 아닙니다.";
      }

      Alert.alert("오류", message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setConfirmPassword("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>話</Text>
          </View>
          <Text style={styles.title}>일본어 회화</Text>
          <Text style={styles.subtitle}>
            {mode === "login" ? "다시 만나서 반가워요!" : "함께 일본어를 배워봐요"}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="이메일"
            placeholderTextColor={colors.textLight}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="비밀번호"
              placeholderTextColor={colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {mode === "signup" && (
            <>
              <View style={styles.validationList}>
                <ValidationItem label="6자 이상" met={password.length >= 6} />
                <ValidationItem label="영문 포함" met={/[a-zA-Z]/.test(password)} />
                <ValidationItem label="숫자 포함" met={/[0-9]/.test(password)} />
              </View>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="비밀번호 확인"
                  placeholderTextColor={colors.textLight}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <MaterialIcons name={showConfirmPassword ? "visibility-off" : "visibility"} size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {confirmPassword.length > 0 && (
                <View style={styles.matchRow}>
                  <MaterialIcons
                    name={password === confirmPassword ? "check-circle" : "cancel"}
                    size={16}
                    color={password === confirmPassword ? colors.success : colors.danger}
                  />
                  <Text style={[
                    styles.matchText,
                    { color: password === confirmPassword ? colors.success : colors.danger },
                  ]}>
                    {password === confirmPassword ? "비밀번호가 일치합니다" : "비밀번호가 일치하지 않습니다"}
                  </Text>
                </View>
              )}
            </>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === "login" ? "로그인" : "회원가입"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Toggle */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {mode === "login" ? "아직 계정이 없으신가요?" : "이미 계정이 있으신가요?"}
          </Text>
          <TouchableOpacity onPress={toggleMode}>
            <Text style={styles.toggleText}>
              {mode === "login" ? "회원가입" : "로그인"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.surface,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: colors.textDark,
  },
  eyeButton: {
    padding: 12,
  },
  validationList: {
    flexDirection: "row",
    gap: 12,
  },
  validationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  validationText: {
    fontSize: 13,
    color: colors.textLight,
  },
  validationTextMet: {
    color: colors.success,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  matchText: {
    fontSize: 13,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.surface,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
});
