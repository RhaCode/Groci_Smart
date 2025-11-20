// mobile/app/(tabs)/products/_layout.tsx
import { Stack } from 'expo-router';

export default function ProductsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1f2937', // surface
        },
        headerTintColor: '#f9fafb', // text-primary
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: '#111827', // background
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
