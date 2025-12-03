import { Stack } from "expo-router"
import { SQLiteProvider } from "expo-sqlite"

import { safeInitializeDatabase } from "@/database/databaseSchema"
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { AuthProvider } from "@/contexts/AuthContext"
import { UpdateProvider } from "@/contexts/UpdateContext"
import { ThemeProvider, useTheme, lightColors, darkColors } from "@/contexts/ThemeContext"
import { AutocompleteDropdownContextProvider } from 'react-native-autocomplete-dropdown'

import * as Sentry from '@sentry/react-native';

// Only initialize Sentry in production, not in development/emulator
// if (!__DEV__) {
Sentry.init({
  dsn: 'https://3126b8211b8ed703c188bc1042486e98@o1215639.ingest.us.sentry.io/4510221608091648',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});
// }

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
      <AutocompleteDropdownContextProvider>
        <UpdateProvider>
          <SQLiteProvider databaseName="myDatabase.db" onInit={safeInitializeDatabase}>
            <AuthProvider>
              <PaperProvider theme={paperTheme}>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="login" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="checklist/duplicate/[id]" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="auto" />
              </PaperProvider>
            </AuthProvider>
          </SQLiteProvider>
        </UpdateProvider>
      </AutocompleteDropdownContextProvider>
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
