// mobile/app/(tabs)/lists/_layout.tsx
import { Stack } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';

export default function ListsLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors['text-primary'],
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
            backgroundColor: theme.colors.surface,
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
            backgroundColor: theme.colors.surface,
          },
        }}
      />
      <Stack.Screen
        name="edit-item/[id]"
        options={{
          title: 'Edit Item',
          presentation: 'modal',
          headerStyle: {
            backgroundColor: theme.colors.surface,
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