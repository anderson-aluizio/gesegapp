import { Stack } from 'expo-router';

export default function TurnoEquipeLayout() {
  return (
    <Stack>
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
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Detalhes do Turno',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
