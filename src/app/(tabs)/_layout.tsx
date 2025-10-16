import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Icon } from 'react-native-paper';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  const showTurnoEquipe = user.is_operacao == true;

  return (
    <ProtectedRoute>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
            },
            default: {},
          }),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Início',
            tabBarIcon: ({ color }) => <Icon source="home" color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="sync-data"
          options={{
            title: 'Sincronizar',
            tabBarIcon: ({ color }) => <Icon source="sync" color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="turno-equipe"
          options={{
            title: 'Turnos',
            tabBarIcon: ({ color }) => <Icon source="clock-outline" color={color} size={20} />,
            href: !showTurnoEquipe ? null : '/turno-equipe',
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
