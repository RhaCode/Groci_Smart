// mobile/app/(tabs)/products/_layout.tsx
import { Stack } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';

export default function ProductsLayout() {
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
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Products',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Product Details',
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          title: 'Search Products',
        }}
      />
      <Stack.Screen
        name="compare"
        options={{
          title: 'Compare Prices',
        }}
      />
    </Stack>
  );
}