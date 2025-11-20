// mobile/app/(tabs)/lists/_layout.tsx
import { Stack } from 'expo-router';

export default function ListsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1f2937',
        },
        headerTintColor: '#f9fafb',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
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
          headerStyle: {
            backgroundColor: '#1f2937',
          },
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: 'Edit List',
        }}
      />
      <Stack.Screen
        name="add-item/[id]"
        options={{
          title: 'Add Item',
          presentation: 'modal',
          headerStyle: {
            backgroundColor: '#1f2937',
          },
        }}
      />
      <Stack.Screen
        name="compare/[id]"
        options={{
          title: 'Price Comparison',
        }}
      />
    </Stack>
  );
}