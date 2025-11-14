// mobile/app/index.tsx
import { Redirect } from 'expo-router';

export default function Index() {
  // This will be handled by the root layout
  // Just redirect to auth for now
  return <Redirect href="/(auth)/login" />;
}