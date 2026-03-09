import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function TurnoEquipeLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Turnos de Equipe',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Abertura de Turno',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
