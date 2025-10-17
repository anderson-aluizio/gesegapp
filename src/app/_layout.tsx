import { Slot, Stack } from "expo-router"
import { SQLiteProvider } from "expo-sqlite"

import { initializeDatabase, safeInitializeDatabase } from "@/database/databaseSchema"
import { PaperProvider } from "react-native-paper"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { AuthProvider } from "@/contexts/AuthContext"
import { AutocompleteDropdownContextProvider } from 'react-native-autocomplete-dropdown'
import TurnoGuard from "@/components/TurnoGuard"

export default function Layout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <AutocompleteDropdownContextProvider>
          <AuthProvider>
            <SQLiteProvider databaseName="myDatabase.db" onInit={safeInitializeDatabase}>
              <PaperProvider>
                <TurnoGuard>
                  <Stack>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="login" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                </TurnoGuard>
                <StatusBar style="auto" />
              </PaperProvider>
            </SQLiteProvider>
          </AuthProvider>
        </AutocompleteDropdownContextProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}
