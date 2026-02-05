import React, { useState, useEffect } from "react";
import { ActivityIndicator, View, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from "./src/lib/supabase";
import type { RootStackParamList } from "./src/types";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { useNetworkStatus } from "./src/hooks/useNetworkStatus";
import {
  AuthScreen,
  OnboardingScreen,
  HomeScreen,
  SessionScreen,
  SituationListScreen,
  SettingsScreen,
  HistoryScreen,
  VocabularyScreen,
  FlashcardScreen,
} from "./src/screens";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const isConnected = useNetworkStatus();

  useEffect(() => {
    checkAuth();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setIsLoggedIn(true);
          await checkOnboarding(session.user.id);
        } else {
          setIsLoggedIn(false);
          setHasCompletedOnboarding(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setIsLoggedIn(true);
        await checkOnboarding(session.user.id);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkOnboarding = async (userId: string) => {
    try {
      const { data: userPersona } = await supabase
        .from("user_personas")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .single();

      setHasCompletedOnboarding(!!userPersona);
    } catch {
      setHasCompletedOnboarding(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>오프라인 상태입니다</Text>
        </View>
      )}
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
          initialRouteName={
            !isLoggedIn ? "Auth" : hasCompletedOnboarding ? "Home" : "Onboarding"
          }
        >
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="Session"
            component={SessionScreen}
            options={{
              animation: "slide_from_bottom",
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="SituationList" component={SituationListScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="Vocabulary" component={VocabularyScreen} />
          <Stack.Screen name="Flashcard" component={FlashcardScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  offlineBanner: {
    backgroundColor: "#ef4444",
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  offlineText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
