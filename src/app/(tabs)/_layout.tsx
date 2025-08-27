import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Icon } from 'react-native-paper';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TabLayout() {

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
      </Tabs>
    </ProtectedRoute>
  );
}
