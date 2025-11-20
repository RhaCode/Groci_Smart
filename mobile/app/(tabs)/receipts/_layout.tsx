// mobile/app/(tabs)/receipts/_layout.tsx
import { Stack } from "expo-router";
import { useTheme } from "../../../context/ThemeContext";

export default function ReceiptsLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors["text-primary"],
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Receipts",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Receipt Details",
        }}
      />
      <Stack.Screen
        name="upload"
        options={{
          title: "Upload Receipt",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: "Edit Receipt",
        }}
      />
      <Stack.Screen
        name="edit-item/[receiptId]/[itemId]"
        options={{
          title: "Edit Receipt Item",
        }}
      />
      <Stack.Screen
        name="add-item/[id]"
        options={{
          title: "Add Item",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
