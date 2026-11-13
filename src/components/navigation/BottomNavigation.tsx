import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { colors, elevation } from '@/theme/tokens';
import { Icon } from '../ui/Icon';
import { T } from '../ui/core';
import { TKey, useT } from '@/i18n';
import { useApp } from '@/store/useApp';

export const STUDENT_TABS: Record<string, { icon: string; label: TKey }> = {
  index: { icon: 'home', label: 'tab.home' }, bookings: { icon: 'calendar', label: 'tab.bookings' }, messages: { icon: 'chat', label: 'tab.messages' }, profile: { icon: 'user', label: 'tab.profile' },
};
export const TEACHER_TABS: Record<string, { icon: string; label: TKey }> = {
  index: { icon: 'home', label: 'tab.home' }, desk: { icon: 'desk', label: 'tab.desk' }, clients: { icon: 'users', label: 'tab.clients' }, finance: { icon: 'wallet', label: 'tab.finance' }, profile: { icon: 'user', label: 'tab.profile' },
};

/** Floating pill navigation (translucent on iOS/web, solid fallback on Android). Neutral icons; selection shown by colour + weight + tint. */
export function BottomNavigation({ state, navigateToTab, tabs }: BottomTabBarProps & { tabs: Record<string, { icon: string; label: TKey }> }) {
  const insets = useSafeAreaInsets(); const t = useT();
  const unread = useApp((s) => s.db.threads.filter((th) => th.studentAccountId === s.accountId).reduce((a, th) => a + th.unreadStudent, 0));
  return (
    <View style={[n.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={[n.bar, Platform.OS === 'android' ? { backgroundColor: '#fff' } : null]} accessibilityRole="tablist">
        {state.routes.map((r, i) => {
          const cfg = tabs[r.name]; if (!cfg) return null;
          const active = state.index === i;
          return (
            <Pressable key={r.key} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={t(cfg.label)} onPress={() => navigateToTab(r.key)} style={[n.item, active && n.active]}>
              <View>
                <Icon name={cfg.icon} size={22} color={active ? colors.forest : colors.ink} fill={active && cfg.icon === 'home' ? colors.mintTint : undefined} strokeWidth={active ? 2.1 : 1.8} />
                {r.name === 'messages' && unread ? <View style={n.dot} /> : null}
              </View>
              <T v="caption" numberOfLines={1} color={active ? colors.forest : colors.ink} style={{ fontSize: 11, fontFamily: active ? 'Inter_700Bold' : 'Inter_500Medium' }}>{t(cfg.label)}</T>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
const n = StyleSheet.create({
  wrap: { backgroundColor: colors.surface, paddingHorizontal: 14, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.line },
  bar: { flexDirection: 'row', borderRadius: 30, padding: 5, backgroundColor: 'rgba(255,255,255,0.94)', borderWidth: 1, borderColor: colors.line, ...elevation },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 54, borderRadius: 26 },
  active: { backgroundColor: '#F1F7F3' },
  dot: { position: 'absolute', right: -3, top: -1, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green, borderWidth: 1.5, borderColor: '#fff' },
});
