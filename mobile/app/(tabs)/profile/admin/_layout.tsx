// mobile/app/(tabs)/profile/admin/_layout.tsx
import { Stack, router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';

export default function AdminLayout() {
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
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Admin Dashboard',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ padding: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="arrow-back" 
                size={20} 
                color={theme.colors['text-primary']} 
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="products/index"
        options={{
          title: 'Product Management',
        }}
      />
      <Stack.Screen
        name="products/[id]"
        options={{
          title: 'Product Details',
        }}
      />
      <Stack.Screen
        name="products/create"
        options={{
          title: 'Create Product',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="products/edit/[id]"
        options={{
          title: 'Edit Product',
        }}
      />
      <Stack.Screen
        name="categories/index"
        options={{
          title: 'Category Management',
        }}
      />
      <Stack.Screen
        name="categories/[id]"
        options={{
          title: 'Category Details',
        }}
      />
      <Stack.Screen
        name="categories/create"
        options={{
          title: 'Create Category',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="categories/edit/[id]"
        options={{
          title: 'Edit Category',
        }}
      />
      <Stack.Screen
        name="stores/index"
        options={{
          title: 'Store Management',
        }}
      />
      <Stack.Screen
        name="stores/[id]"
        options={{
          title: 'Store Details',
        }}
      />
      <Stack.Screen
        name="stores/create"
        options={{
          title: 'Create Store',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="stores/edit/[id]"
        options={{
          title: 'Edit Store',
        }}
      />
      <Stack.Screen
        name="prices/index"
        options={{
          title: 'Price History Management',
        }}
      />
      <Stack.Screen
        name="prices/[id]"
        options={{
          title: 'Price Details',
        }}
      />
      <Stack.Screen
        name="prices/create"
        options={{
          title: 'Create Price',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="prices/edit/[id]"
        options={{
          title: 'Edit Price',
        }}
      />
      <Stack.Screen
        name="users/index"
        options={{
          title: 'User Management',
        }}
      />
      <Stack.Screen
        name="users/[id]"
        options={{
          title: 'User Details',
        }}
      />
      <Stack.Screen
        name="users/create"
        options={{
          title: 'Create User',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="users/edit/[id]"
        options={{
          title: 'Edit User',
        }}
      />
    </Stack>
  );
}