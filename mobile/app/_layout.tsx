// mobile/app/_layout.tsx
import React, { useEffect } from "react";
import { Slot, SplashScreen, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import "./global.css";
import { ThemeProvider } from "@/context/ThemeContext";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const prepare = async () => {
      try {
        // Wait for auth state to load
        if (!isLoading) {
          // Small delay to ensure everything is stable
          await new Promise(resolve => setTimeout(resolve, 500));
          await SplashScreen.hideAsync();
        }
      } catch (e) {
        console.warn(e);
      }
    };

    prepare();
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)/home");
    }
  }, [isAuthenticated, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}