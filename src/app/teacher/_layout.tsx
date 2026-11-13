import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { BottomNavigation, TEACHER_TABS } from '@/components/navigation/BottomNavigation';
import { useApp } from '@/store/useApp';

export default function TeacherTabs() {
  const authed = useApp((s) => s.authed);
  if (!authed) return <Redirect href="/welcome" />;
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BottomNavigation {...props} tabs={TEACHER_TABS} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="desk" />
      <Tabs.Screen name="clients" />
      <Tabs.Screen name="finance" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
