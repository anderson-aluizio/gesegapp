import { Stack } from "expo-router"
import { SQLiteProvider } from "expo-sqlite"
import { StatusBar } from "expo-status-bar"

import { safeInitializeDatabase } from "@/database/databaseSchema"
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { AuthProvider } from "@/contexts/AuthContext"
import { UpdateProvider } from "@/contexts/UpdateContext"
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext"
import { BackgroundSyncProvider } from "@/contexts/BackgroundSyncContext"

function AppContent() {
  const { isDark, colors } = useTheme();

  const paperTheme = isDark
    ? {
      ...MD3DarkTheme,
      colors: {
        ...MD3DarkTheme.colors,
        primary: colors.primary,
        background: colors.background,
        surface: colors.surface,
        error: colors.error,
      },
    }
    : {
      ...MD3LightTheme,
      colors: {
        ...MD3LightTheme.colors,
        primary: colors.primary,
        background: colors.background,
        surface: colors.surface,
        error: colors.error,
      },
    };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <UpdateProvider>
        <SQLiteProvider databaseName="myDatabase.db" onInit={safeInitializeDatabase}>
          <AuthProvider>
            <BackgroundSyncProvider>
            <PaperProvider theme={paperTheme}>
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: colors.surface },
                  headerTintColor: colors.text,
                  headerTitleStyle: { color: colors.text },
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="checklist/duplicate/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
            </PaperProvider>
            </BackgroundSyncProvider>
          </AuthProvider>
        </SQLiteProvider>
      </UpdateProvider>
    </SafeAreaView>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
