// mobile/app/(tabs)/profile/_layout.tsx
import { Stack } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';

export default function ProfileLayout() {
  const { theme } = useTheme();
  const { isStaff, isSuperuser } = useAuth();

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
          title: 'Profile',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="stores"
        options={{
          title: 'Preferred Stores',
        }}
      />
      <Stack.Screen
        name="change-password"
        options={{
          title: 'Change Password',
        }}
      />

      {/* Admin Routes */}
      {(isStaff || isSuperuser) && (
        <>
          {/* Admin Dashboard */}
          <Stack.Screen
            name="admin"
            options={{
              title: 'Admin Dashboard',
            }}
          />

          {/* ===================== PRODUCTS ===================== */}
          <Stack.Screen
            name="admin/products/index"
            options={{
              title: 'Product Management',
            }}
          />
          <Stack.Screen
            name="admin/products/[id]"
            options={{
              title: 'Product Details',
            }}
          />
          <Stack.Screen
            name="admin/products/create"
            options={{
              title: 'Create Product',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="admin/products/edit/[id]"
            options={{
              title: 'Edit Product',
            }}
          />

          {/* ===================== CATEGORIES ===================== */}
          <Stack.Screen
            name="admin/categories/index"
            options={{
              title: 'Category Management',
            }}
          />
          <Stack.Screen
            name="admin/categories/[id]"
            options={{
              title: 'Category Details',
            }}
          />
          <Stack.Screen
            name="admin/categories/create"
            options={{
              title: 'Create Category',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="admin/categories/edit/[id]"
            options={{
              title: 'Edit Category',
            }}
          />

          {/* ===================== STORES ===================== */}
          <Stack.Screen
            name="admin/stores/index"
            options={{
              title: 'Store Management',
            }}
          />
          <Stack.Screen
            name="admin/stores/[id]"
            options={{
              title: 'Store Details',
            }}
          />
          <Stack.Screen
            name="admin/stores/create"
            options={{
              title: 'Create Store',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="admin/stores/edit/[id]"
            options={{
              title: 'Edit Store',
            }}
          />

          {/* ===================== PRICES ===================== */}
          <Stack.Screen
            name="admin/prices/index"
            options={{
              title: 'Price History Management',
            }}
          />
          <Stack.Screen
            name="admin/prices/[id]"
            options={{
              title: 'Price Details',
            }}
          />
          <Stack.Screen
            name="admin/prices/create"
            options={{
              title: 'Create Price',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="admin/prices/edit/[id]"
            options={{
              title: 'Edit Price',
            }}
          />

          {/* ===================== APPROVALS ===================== */}
          <Stack.Screen
            name="admin/approvals/index"
            options={{
              title: 'Pending Approvals',
            }}
          />

          {/* ===================== USERS (SUPERUSER ONLY) ===================== */}
          {isSuperuser && (
            <>
              <Stack.Screen
                name="admin/users/index"
                options={{
                  title: 'User Management',
                }}
              />
              <Stack.Screen
                name="admin/users/[id]"
                options={{
                  title: 'User Details',
                }}
              />
              <Stack.Screen
                name="admin/users/create"
                options={{
                  title: 'Create User',
                  presentation: 'modal',
                }}
              />
              <Stack.Screen
                name="admin/users/edit/[id]"
                options={{
                  title: 'Edit User',
                }}
              />
            </>
          )}
        </>
      )}
    </Stack>
  );
}