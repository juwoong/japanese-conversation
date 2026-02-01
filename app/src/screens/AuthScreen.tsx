import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import type { RootStackParamList } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;

type AuthMode = "login" | "signup";

export default function AuthScreen({ navigation }: Props) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data?.user) {
          // 회원가입 성공 - 온보딩으로 이동
          navigation.replace("Onboarding");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data?.user) {
          // 로그인 성공 - 온보딩 완료 여부 확인
          const { data: userPersona } = await supabase
            .from("user_personas")
            .select("id")
            .eq("user_id", data.user.id)
            .limit(1)
            .single();

          if (userPersona) {
            navigation.replace("Home");
          } else {
            navigation.replace("Onboarding");
          }
        }
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
          <Text style={styles.logo}>🇯🇵</Text>
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
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {mode === "signup" && (
            <TextInput
              style={styles.input}
              placeholder="비밀번호 확인"
              placeholderTextColor="#94a3b8"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
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
    backgroundColor: "#f8fafc",
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
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1e293b",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  button: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
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
    color: "#64748b",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366f1",
  },
});
