import React, { useState, useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from "./src/lib/supabase";
import type { RootStackParamList } from "./src/types";
import {
  OnboardingScreen,
  HomeScreen,
  SessionScreen,
  SituationListScreen,
  SettingsScreen,
  HistoryScreen,
} from "./src/screens";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

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
        // For MVP, auto-create anonymous session
        await createAnonymousSession();
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createAnonymousSession = async () => {
    try {
      // Generate a random email for anonymous auth
      const randomId = Math.random().toString(36).substring(2, 15);
      const email = `${randomId}@anonymous.local`;
      const password = Math.random().toString(36).substring(2, 15);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (data?.user && !error) {
        setIsLoggedIn(true);
        // New user - hasn't completed onboarding
        setHasCompletedOnboarding(false);
      }
    } catch (error) {
      console.error("Anonymous auth error:", error);
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
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
        initialRouteName={
          isLoggedIn && hasCompletedOnboarding ? "Home" : "Onboarding"
        }
      >
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
      </Stack.Navigator>
    </NavigationContainer>
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
