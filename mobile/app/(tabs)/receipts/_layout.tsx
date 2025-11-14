// mobile/app/(tabs)/receipts/_layout.tsx
import { Stack } from 'expo-router';

export default function ReceiptsLayout() {
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
          title: 'Receipts',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Receipt Details',
        }}
      />
      <Stack.Screen
        name="upload"
        options={{
          title: 'Upload Receipt',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}