import React, { useState, useEffect, useCallback } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from "./src/lib/supabase";
import type { RootStackParamList } from "./src/types";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { AuthContext } from "./src/contexts/AuthContext";
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
  PitchTestScreen,
} from "./src/screens";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  const checkOnboarding = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", userId)
        .single();

      if (profile?.onboarding_completed) {
        setHasCompletedOnboarding(true);
        return;
      }

      // Fallback: check if user has a persona (old onboarding flow)
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

  useEffect(() => {
    // Fallback timeout — if onAuthStateChange never fires (e.g. network down)
    const timeout = setTimeout(() => setIsLoading(false), 5000);

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          // Check onboarding BEFORE setting isLoggedIn
          // so conditional rendering shows the correct screen immediately
          await checkOnboarding(session.user.id);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          setHasCompletedOnboarding(false);
        }
        clearTimeout(timeout);
        setIsLoading(false);
      }
    );

    return () => {
      clearTimeout(timeout);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const onOnboardingComplete = useCallback(() => {
    setHasCompletedOnboarding(true);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ onOnboardingComplete }}>
    <SafeAreaProvider>
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        >
          {!isLoggedIn ? (
            <Stack.Screen name="Auth" component={AuthScreen} />
          ) : !hasCompletedOnboarding ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : (
            <>
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
              <Stack.Screen name="PitchTest" component={PitchTestScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
    </SafeAreaProvider>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
});
