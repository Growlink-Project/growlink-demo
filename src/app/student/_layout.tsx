import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { BottomNavigation, STUDENT_TABS } from '@/components/navigation/BottomNavigation';
import { useApp } from '@/store/useApp';

export default function StudentTabs() {
  const authed = useApp((s) => s.authed);
  if (!authed) return <Redirect href="/welcome" />;
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BottomNavigation {...props} tabs={STUDENT_TABS} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
