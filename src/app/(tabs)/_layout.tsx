import { Stack, Redirect } from 'expo-router';
import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthenticatedLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <ProtectedRoute>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}>
        <Stack.Screen
          name="home"
          options={{
            title: 'Início',
          }}
        />
        <Stack.Screen
          name="checklist-list"
          options={{
            title: 'Checklists',
          }}
        />
        <Stack.Screen
          name="sync-data"
          options={{
            title: 'Sincronização',
          }}
        />
        <Stack.Screen
          name="turno-equipe"
          options={{
            title: 'Turnos',
          }}
        />
      </Stack>
    </ProtectedRoute>
  );
}
