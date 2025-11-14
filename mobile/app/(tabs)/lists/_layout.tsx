// mobile/app/(tabs)/lists/_layout.tsx
import { Stack } from 'expo-router';

export default function ListsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#111827',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Shopping Lists',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'List Details',
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Create List',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}