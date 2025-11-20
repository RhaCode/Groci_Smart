// mobile/app/(tabs)/home/_layout.tsx
import { Stack } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';

export default function HomeLayout() {
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
          title: 'Dashboard',
          headerShown: true,
        }}
      />
    </Stack>
  );
}