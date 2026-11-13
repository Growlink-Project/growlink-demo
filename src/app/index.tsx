import { Redirect } from 'expo-router';
import { useApp } from '@/store/useApp';

export default function Index() {
  const authed = useApp((s) => s.authed); const role = useApp((s) => s.role);
  if (!authed) return <Redirect href="/welcome" />;
  return <Redirect href={role === 'teacher' ? '/teacher' : '/student'} />;
}
