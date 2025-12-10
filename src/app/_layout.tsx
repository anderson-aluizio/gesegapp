import { Stack } from "expo-router"
import { SQLiteProvider } from "expo-sqlite"

import { safeInitializeDatabase } from "@/database/databaseSchema"
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { AuthProvider } from "@/contexts/AuthContext"
import { UpdateProvider } from "@/contexts/UpdateContext"
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext"
import { AutocompleteDropdownContextProvider } from 'react-native-autocomplete-dropdown'

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
