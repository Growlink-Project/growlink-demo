import React, { ReactNode, useEffect, useRef } from 'react';
import {
  ActivityIndicator, Animated, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextInput,
  TextInputProps, TextStyle, View, ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, elevation, hitSlop, radius, space } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';
import { IMG } from '@/assets';
import { Icon } from './Icon';
import { useApp } from '@/store/useApp';
import type { BookingStatus } from '@/mocks/types';
import { useT } from '@/i18n';

// ---------- Text ----------
type TV = keyof typeof type;
export function T({ v = 'body', style, children, color, numberOfLines, center, ...rest }: { v?: TV; style?: StyleProp<TextStyle>; children?: ReactNode; color?: string; numberOfLines?: number; center?: boolean; accessibilityRole?: 'header' | 'text' }) {
  return <Text {...rest} numberOfLines={numberOfLines} maxFontSizeMultiplier={1.4} style={[type[v], color ? { color } : null, center && { textAlign: 'center' }, style]}>{children}</Text>;
}

// ---------- Layout ----------
export function Screen({ children, scroll = true, footer, bg = colors.canvas, header, pad = true, keyboard }: { children: ReactNode; scroll?: boolean; footer?: ReactNode; bg?: string; header?: ReactNode; pad?: boolean; keyboard?: boolean }) {
  const insets = useSafeAreaInsets();
  const body = scroll ? (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[pad && { paddingHorizontal: space.screen }, { paddingBottom: footer ? 24 : insets.bottom + 32, paddingTop: 4 }]} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : <View style={[{ flex: 1 }, pad && { paddingHorizontal: space.screen }]}>{children}</View>;
  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
      {header}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} enabled={keyboard !== false}>
        {body}
        {footer ? <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </View>
  );
}
export function ScreenHeader({ title, right, onBack, sub, back = true }: { title?: string; right?: ReactNode; onBack?: () => void; sub?: string; back?: boolean }) {
  const t = useT();
  return (
    <View style={s.header}>
      {back ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={hitSlop} onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))} style={s.iconBtn}>
          <Icon name="back" size={22} />
        </Pressable>
      ) : <View style={{ width: 8 }} />}
      <View style={{ flex: 1, marginHorizontal: 6 }}>
        {title ? <T v="screenTitle" numberOfLines={1} accessibilityRole="header">{title}</T> : null}
        {sub ? <T v="caption" numberOfLines={1}>{sub}</T> : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }}>{right}</View>
    </View>
  );
}
export function IconButton({ name, onPress, label, badge, size = 22, tone = 'plain', color }: { name: string; onPress: () => void; label: string; badge?: boolean | number; size?: number; tone?: 'plain' | 'soft' | 'surface'; color?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={hitSlop} onPress={onPress}
      style={({ pressed }) => [s.iconBtn, tone === 'soft' && { backgroundColor: colors.soft }, tone === 'surface' && { backgroundColor: colors.surface, ...elevation }, pressed && { opacity: 0.6 }]}>
      <Icon name={name} size={size} color={color} />
      {badge ? <View style={s.badgeDot} accessibilityLabel="unread" /> : null}
    </Pressable>
  );
}
export const Row = ({ children, style, gap = 8, wrap }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number; wrap?: boolean }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, wrap && { flexWrap: 'wrap' }, style]}>{children}</View>
);
export const Gap = ({ h = 12 }: { h?: number }) => <View style={{ height: h }} />;
export const Divider = ({ m = 12 }: { m?: number }) => <View style={{ height: 1, backgroundColor: colors.line, marginVertical: m }} />;
export function Card({ children, style, onPress, pad = 14, label }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; pad?: number; label?: string }) {
  const base = [s.card, { padding: pad }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.85 }]}>{children}</Pressable>;
}

// ---------- Buttons ----------
export function PrimaryButton({ title, onPress, disabled, loading, icon, style, small }: { title: string; onPress: () => void; disabled?: boolean; loading?: boolean; icon?: string; style?: StyleProp<ViewStyle>; small?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: !!disabled, busy: !!loading }} disabled={disabled || loading} onPress={onPress}
      style={({ pressed }) => [s.btn, small && s.btnSmall, { backgroundColor: disabled ? '#9AAEA4' : colors.forest }, pressed && { opacity: 0.88 }, style]}>
      {loading ? <ActivityIndicator color="#fff" /> : <Row gap={8}>{icon ? <Icon name={icon} size={18} color="#fff" /> : null}<T v="button" color="#fff" numberOfLines={1}>{title}</T></Row>}
    </Pressable>
  );
}
export function SecondaryButton({ title, onPress, icon, disabled, style, small, danger }: { title: string; onPress: () => void; icon?: string; disabled?: boolean; style?: StyleProp<ViewStyle>; small?: boolean; danger?: boolean }) {
  const c = danger ? colors.danger : colors.ink;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [s.btn, small && s.btnSmall, s.btnOutline, disabled && { opacity: 0.45 }, pressed && { backgroundColor: colors.soft }, style]}>
      <Row gap={8}>{icon ? <Icon name={icon} size={18} color={c} /> : null}<T v="button" color={c} numberOfLines={1}>{title}</T></Row>
    </Pressable>
  );
}
export function TextLink({ title, onPress, icon, color = colors.link, style }: { title: string; onPress: () => void; icon?: string; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="link" hitSlop={hitSlop} onPress={onPress} style={[{ minHeight: 32, justifyContent: 'center' }, style]}>
      <Row gap={4}><T v="strong" color={color} style={{ fontSize: 13.5 }}>{title}</T>{icon ? <Icon name={icon} size={15} color={color} /> : null}</Row>
    </Pressable>
  );
}

// ---------- Chips ----------
export function FilterChip({ label, active, onPress, icon, iconColor, count }: { label: string; active?: boolean; onPress: () => void; icon?: string; iconColor?: string; count?: number }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!active }} accessibilityLabel={label} onPress={onPress}
      style={[s.chip, active ? { backgroundColor: colors.forest, borderColor: colors.forest } : null]}>
      {icon ? <Icon name={icon} size={16} color={active ? '#fff' : iconColor ?? colors.ink} /> : null}
      <T v="strong" style={{ fontSize: 13.5 }} color={active ? '#fff' : colors.ink}>{label}</T>
      {count ? <View style={[s.count, active && { backgroundColor: 'rgba(255,255,255,0.22)' }]}><T v="caption" color={active ? '#fff' : colors.muted}>{count}</T></View> : null}
      {active && icon !== 'grid' ? <View accessibilityElementsHidden><Icon name="check" size={14} color="#fff" /></View> : null}
    </Pressable>
  );
}
export const SkillChip = ({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) => (
  <Pressable disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityState={{ selected: !!active }} onPress={onPress}
    style={[s.skill, active && { backgroundColor: colors.mintTint, borderColor: colors.green }]}>
    <T v="body" style={{ fontFamily: fonts.inter500 }} color={active ? colors.link : colors.ink}>{label}{active ? '  ✓' : ''}</T>
  </Pressable>
);
export function CategoryChip({ label, icon, tint, fg, onPress, small }: { label: string; icon: string; tint: string; fg: string; onPress: () => void; small?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ alignItems: 'center', width: small ? 72 : 80, gap: 6 }}>
      <View style={[s.catIcon, { backgroundColor: tint }]}><Icon name={icon} size={24} color={fg} /></View>
      <T v="caption" color={colors.ink} center numberOfLines={2} style={{ fontSize: 11.5 }}>{label}</T>
    </Pressable>
  );
}
export function CategoryTag({ label, icon, tint, fg }: { label: string; icon: string; tint: string; fg: string }) {
  return <View style={[s.tag, { backgroundColor: tint }]}><Icon name={icon} size={11} color={fg} /><T v="caption" color={fg} style={{ fontFamily: fonts.inter600 }}>{label}</T></View>;
}

// ---------- Status ----------
const STATUS: Record<string, { bg: string; fg: string; icon: string }> = {
  awaiting_payment: { bg: colors.warnTint, fg: colors.warn, icon: 'card' }, payment_failed: { bg: colors.dangerTint, fg: colors.danger, icon: 'close' },
  pending_confirmation: { bg: colors.warnTint, fg: colors.warn, icon: 'clock' }, confirmed: { bg: colors.mintTint, fg: colors.link, icon: 'check' },
  in_progress: { bg: colors.infoTint, fg: colors.info, icon: 'dot' }, completed: { bg: colors.soft, fg: colors.ink, icon: 'check' },
  cancelled: { bg: colors.soft, fg: colors.muted, icon: 'close' }, declined: { bg: colors.soft, fg: colors.muted, icon: 'close' }, refunded: { bg: colors.infoTint, fg: colors.info, icon: 'refresh' },
  disputed: { bg: colors.dangerTint, fg: colors.danger, icon: 'flag' }, no_show_review: { bg: colors.warnTint, fg: colors.warn, icon: 'info' },
};
export function StatusBadge({ status, label }: { status: BookingStatus | string; label?: string }) {
  const t = useT();
  const st = STATUS[status] ?? { bg: colors.soft, fg: colors.ink, icon: 'info' };
  const text = label ?? t(`status.${status}` as never);
  return <View style={[s.tag, { backgroundColor: st.bg, paddingVertical: 4 }]} accessibilityLabel={`Status: ${text}`}><Icon name={st.icon} size={12} color={st.fg} strokeWidth={2.2} /><T v="caption" color={st.fg} style={{ fontFamily: fonts.inter600 }}>{text}</T></View>;
}
export function Pill({ text, tone = 'soft', icon }: { text: string; tone?: 'soft' | 'mint' | 'warn' | 'danger' | 'info' | 'dark'; icon?: string }) {
  const m = { soft: [colors.soft, colors.ink], mint: [colors.mintTint, colors.link], warn: [colors.warnTint, colors.warn], danger: [colors.dangerTint, colors.danger], info: [colors.infoTint, colors.info], dark: [colors.forest, '#fff'] }[tone];
  return <View style={[s.tag, { backgroundColor: m[0] }]}>{icon ? <Icon name={icon} size={12} color={m[1]} /> : null}<T v="caption" color={m[1]} style={{ fontFamily: fonts.inter600 }}>{text}</T></View>;
}
export function SectionHeader({ title, action, onAction, style }: { title: string; action?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Row style={[{ justifyContent: 'space-between', marginTop: 18, marginBottom: 10 }, style]}>
      <T v="section" accessibilityRole="header" style={{ flexShrink: 1 }}>{title}</T>
      {action && onAction ? <TextLink title={action} icon="chevron-right" onPress={onAction} /> : null}
    </Row>
  );
}
export function Stars({ value, size = 14, onChange }: { value: number; size?: number; onChange?: (n: number) => void }) {
  return (
    <Row gap={onChange ? 10 : 2} >
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable key={i} disabled={!onChange} onPress={() => onChange?.(i)} accessibilityRole={onChange ? 'button' : undefined} accessibilityLabel={`${i} star${i > 1 ? 's' : ''}`} hitSlop={4}>
          <Icon name="star" size={size} color={colors.star} fill={i <= Math.round(value) ? colors.star : 'none'} strokeWidth={1.5} />
        </Pressable>
      ))}
    </Row>
  );
}
export const Rating = ({ rating, count }: { rating: number; count?: number }) => (
  <Row gap={4}><Icon name="star" size={13} color={colors.star} fill={colors.star} strokeWidth={1.2} /><T v="strong" style={{ fontSize: 13 }}>{rating ? rating.toFixed(1) : 'New'}</T>{count != null ? <T v="bodyMuted">({count})</T> : null}</Row>
);

// ---------- Avatars & Growly ----------
export function Avatar({ photo, initials, size = 44, rounded = 'full' }: { photo?: string; initials?: string; size?: number; rounded?: 'full' | 'tile' }) {
  const r = rounded === 'full' ? size / 2 : Math.min(14, size / 4);
  if (photo && IMG[photo]) return <Image source={IMG[photo]} style={{ width: size, height: size, borderRadius: r, backgroundColor: colors.soft }} accessibilityIgnoresInvertColors />;
  return <View style={{ width: size, height: size, borderRadius: r, backgroundColor: colors.mintTint, alignItems: 'center', justifyContent: 'center' }}><T v="strong" color={colors.forest} style={{ fontSize: size * 0.36 }}>{initials ?? '?'}</T></View>;
}
/** Uses the supplied approved Growly mark — never redrawn. Mood is conveyed with a contextual accent, not a new character. */
export function GrowlyIllustration({ size = 120, mood = 'happy', ring = true }: { size?: number; mood?: 'happy' | 'thinking' | 'excited' | 'calm'; ring?: boolean }) {
  const accent = { happy: 'sparkle', thinking: 'help', excited: 'sparkle', calm: 'heart' }[mood];
  return (
    <View style={{ width: size * 1.25, height: size * 1.25, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Growly, the Growlink bear">
      {ring ? <View style={{ position: 'absolute', width: size * 1.22, height: size * 1.22, borderRadius: size, borderWidth: 1, borderColor: colors.mintTint, backgroundColor: 'rgba(230,244,234,0.35)' }} /> : null}
      <Image source={IMG.growly} style={{ width: size, height: size }} />
      {mood !== 'calm' ? <View style={{ position: 'absolute', right: size * 0.04, top: size * 0.06 }}><Icon name={accent} size={size * 0.2} color={mood === 'thinking' ? colors.muted : colors.green} /></View> : null}
      {mood === 'excited' ? <View style={{ position: 'absolute', left: size * 0.05, bottom: size * 0.16 }}><Icon name="sparkle" size={size * 0.15} color={colors.star} /></View> : null}
    </View>
  );
}
export const BearLogo = ({ size = 34 }: { size?: number }) => <Image source={IMG.bear} style={{ width: size, height: size * 1.2 }} resizeMode="contain" accessibilityLabel="Growlink" />;

// ---------- States ----------
export function EmptyState({ title, body, actions, mood = 'thinking', growly = true }: { title: string; body?: string; actions?: { label: string; onPress: () => void; primary?: boolean }[]; mood?: 'happy' | 'thinking' | 'calm'; growly?: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 22, paddingHorizontal: 10, gap: 8 }}>
      {growly ? <GrowlyIllustration size={78} mood={mood} /> : <View style={[s.catIcon, { backgroundColor: colors.soft, width: 56, height: 56 }]}><Icon name="info" size={24} color={colors.muted} /></View>}
      <T v="section" center>{title}</T>
      {body ? <T v="bodyMuted" center style={{ maxWidth: 300 }}>{body}</T> : null}
      {actions?.length ? <Row gap={8} wrap style={{ justifyContent: 'center', marginTop: 6 }}>
        {actions.map((a) => a.primary ? <PrimaryButton key={a.label} small title={a.label} onPress={a.onPress} /> : <SecondaryButton key={a.label} small title={a.label} onPress={a.onPress} />)}
      </Row> : null}
    </View>
  );
}
export function ErrorState({ title = 'Something went wrong', body, onRetry }: { title?: string; body?: string; onRetry: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 22, gap: 8 }} accessibilityRole="alert">
      <View style={[s.catIcon, { backgroundColor: colors.dangerTint }]}><Icon name="refresh" size={24} color={colors.danger} /></View>
      <T v="section" center>{title}</T>{body ? <T v="bodyMuted" center>{body}</T> : null}
      <SecondaryButton small title="Retry" icon="refresh" onPress={onRetry} />
    </View>
  );
}
export function Notice({ text, tone = 'info', icon }: { text: string; tone?: 'info' | 'warn' | 'danger' | 'mint'; icon?: string }) {
  const m = { info: [colors.infoTint, colors.info, 'info'], warn: [colors.warnTint, colors.warn, 'info'], danger: [colors.dangerTint, colors.danger, 'flag'], mint: [colors.mintTint, colors.link, 'shield'] }[tone];
  return <Row gap={10} style={{ backgroundColor: m[0], padding: 12, borderRadius: radius.tile, alignItems: 'flex-start' }}><Icon name={icon ?? m[2]} size={18} color={m[1]} /><T v="body" color={m[1]} style={{ flex: 1 }}>{text}</T></Row>;
}
export const DemoLabel = ({ text = 'DEMO ONLY · simulated' }: { text?: string }) => <View style={s.demo}><Icon name="flask" size={12} color={colors.warn} /><T v="caption" color={colors.warn} style={{ fontFamily: fonts.inter700, letterSpacing: 0.4 }}>{text}</T></View>;

// ---------- Form ----------
export function FormField({ label, error, hint, right, multiline, ...props }: TextInputProps & { label: string; error?: string; hint?: string; right?: ReactNode }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <T v="strong" style={{ fontSize: 13, marginBottom: 6 }}>{label}</T>
      <View style={[s.field, multiline && { minHeight: 96, alignItems: 'flex-start' }, !!error && { borderColor: colors.danger }]}>
        <TextInput placeholderTextColor="#8D9A93" accessibilityLabel={label} multiline={multiline} style={[s.input, multiline && { textAlignVertical: 'top', paddingTop: 12 }]} {...props} />
        {right}
      </View>
      {error ? <T v="caption" color={colors.danger} style={{ marginTop: 4 }}>⚠ {error}</T> : hint ? <T v="caption" style={{ marginTop: 4 }}>{hint}</T> : null}
    </View>
  );
}
export function Toggle({ value, onChange, label, sub }: { value: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label} onPress={() => onChange(!value)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12, minHeight: 48 }}>
      <View style={{ flex: 1 }}><T v="strong" style={{ fontSize: 14 }}>{label}</T>{sub ? <T v="bodyMuted">{sub}</T> : null}</View>
      <View style={[s.switch, value && { backgroundColor: colors.green }]}><View style={[s.knob, value && { transform: [{ translateX: 18 }] }]} /></View>
    </Pressable>
  );
}
export function Segmented<K extends string>({ options, value, onChange }: { options: { key: K; label: string; count?: number }[]; value: K; onChange: (k: K) => void }) {
  return (
    <View style={s.seg} accessibilityRole="tablist">
      {options.map((o) => (
        <Pressable key={o.key} accessibilityRole="tab" accessibilityState={{ selected: value === o.key }} onPress={() => onChange(o.key)} style={[s.segItem, value === o.key && s.segActive]}>
          <T v="strong" style={{ fontSize: 13 }} color={value === o.key ? colors.ink : colors.muted} numberOfLines={1}>{o.label}{o.count ? ` (${o.count})` : ''}</T>
        </Pressable>
      ))}
    </View>
  );
}
export function Radio({ selected, label, sub, onPress, right, icon }: { selected: boolean; label: string; sub?: string; onPress: () => void; right?: ReactNode; icon?: string }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={label} onPress={onPress} style={[s.radio, selected && { borderColor: colors.forest, backgroundColor: '#F4FAF6' }]}>
      {icon ? <View style={[s.catIcon, { width: 40, height: 40, backgroundColor: selected ? colors.mintTint : colors.soft }]}><Icon name={icon} size={20} color={selected ? colors.forest : colors.ink} /></View> : null}
      <View style={{ flex: 1 }}><T v="strong">{label}</T>{sub ? <T v="bodyMuted">{sub}</T> : null}</View>
      {right}
      <View style={[s.radioDot, selected && { borderColor: colors.forest }]}>{selected ? <View style={s.radioInner} /> : null}</View>
    </Pressable>
  );
}
export function ListRow({ icon, label, sub, onPress, right, danger, last }: { icon?: string; label: string; sub?: string; onPress?: () => void; right?: ReactNode; danger?: boolean; last?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={!onPress} onPress={onPress} style={({ pressed }) => [s.listRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.line }, pressed && { backgroundColor: colors.soft }]}>
      {icon ? <Icon name={icon} size={20} color={danger ? colors.danger : colors.ink} /> : null}
      <View style={{ flex: 1 }}><T v="strong" style={{ fontSize: 14 }} color={danger ? colors.danger : colors.ink}>{label}</T>{sub ? <T v="bodyMuted" numberOfLines={2}>{sub}</T> : null}</View>
      {right ?? (onPress ? <Icon name="chevron-right" size={18} color={colors.muted} /> : null)}
    </Pressable>
  );
}
export function KV({ k, v, strong }: { k: string; v: ReactNode; strong?: boolean }) {
  return <Row style={{ justifyContent: 'space-between', paddingVertical: 6, alignItems: 'flex-start' }}><T v="bodyMuted" style={{ flexShrink: 0, marginRight: 12 }}>{k}</T>{typeof v === 'string' ? <T v={strong ? 'strong' : 'body'} style={{ flex: 1, textAlign: 'right' }}>{v}</T> : v}</Row>;
}

// ---------- Dialog & Toast ----------
export function ConfirmationDialog({ visible, title, body, confirm, onConfirm, onCancel, danger, children }: { visible: boolean; title: string; body?: string; confirm: string; onConfirm: () => void; onCancel: () => void; danger?: boolean; children?: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.overlay}>
        <View style={s.dialog} accessibilityViewIsModal>
          <T v="screenTitle" accessibilityRole="header">{title}</T>
          {body ? <T v="bodyMuted" style={{ marginTop: 6 }}>{body}</T> : null}
          {children}
          <Row gap={10} style={{ marginTop: 18 }}>
            <SecondaryButton title="Cancel" onPress={onCancel} style={{ flex: 1 }} />
            {danger ? <SecondaryButton danger title={confirm} onPress={onConfirm} style={{ flex: 1, borderColor: colors.danger }} /> : <PrimaryButton title={confirm} onPress={onConfirm} style={{ flex: 1 }} />}
          </Row>
        </View>
      </View>
    </Modal>
  );
}
export function Toast() {
  const toast = useApp((s) => s.toast);
  const insets = useSafeAreaInsets();
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!toast) return;
    a.setValue(0);
    Animated.sequence([Animated.timing(a, { toValue: 1, duration: 180, useNativeDriver: true }), Animated.delay(2600), Animated.timing(a, { toValue: 0, duration: 220, useNativeDriver: true })]).start();
  }, [toast?.id]);
  if (!toast) return null;
  return (
    <Animated.View pointerEvents="none" style={[s.toast, { top: insets.top + 8, opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] }, toast.kind === 'error' && { backgroundColor: colors.danger }]} accessibilityLiveRegion="polite" accessibilityRole="alert">
      <Icon name={toast.kind === 'error' ? 'info' : 'check'} size={16} color="#fff" /><T v="strong" color="#fff" style={{ fontSize: 13, flex: 1 }}>{toast.text}</T>
    </Animated.View>
  );
}
export function Loading({ label = 'Loading…' }: { label?: string }) {
  return <View style={{ padding: 24, alignItems: 'center', gap: 8 }} accessibilityLabel={label}><ActivityIndicator color={colors.forest} /><T v="caption">{label}</T></View>;
}
export function Timeline({ items }: { items: { label: string; at?: string; note?: string; done: boolean; current?: boolean }[] }) {
  return (
    <View>
      {items.map((it, i) => (
        <Row key={i} gap={12} style={{ alignItems: 'flex-start' }}>
          <View style={{ alignItems: 'center', width: 18 }}>
            <View style={[s.tlDot, it.done && { backgroundColor: colors.green, borderColor: colors.green }, it.current && { borderColor: colors.warn, backgroundColor: colors.warnTint }]}>{it.done ? <Icon name="check" size={10} color="#fff" strokeWidth={3} /> : null}</View>
            {i < items.length - 1 ? <View style={[s.tlLine, it.done && { backgroundColor: colors.green }]} /> : null}
          </View>
          <View style={{ flex: 1, paddingBottom: 14 }}>
            <T v="strong" style={{ fontSize: 13.5 }} color={it.done || it.current ? colors.ink : colors.muted}>{it.label}{it.current ? ' · current' : ''}</T>
            {it.at ? <T v="caption">{it.at}</T> : null}{it.note ? <T v="bodyMuted">{it.note}</T> : null}
          </View>
        </Row>
      ))}
    </View>
  );
}

export const s = StyleSheet.create({
  footer: { paddingHorizontal: space.screen, paddingTop: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, minHeight: 52 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  badgeDot: { position: 'absolute', top: 10, right: 11, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.green, borderWidth: 1.5, borderColor: '#fff' },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, ...elevation },
  btn: { minHeight: 52, borderRadius: radius.card, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  btnSmall: { minHeight: 44, paddingHorizontal: 14, borderRadius: 12 },
  btnOutline: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  count: { minWidth: 18, paddingHorizontal: 5, height: 18, borderRadius: 9, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  skill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.soft, borderWidth: 1, borderColor: 'transparent', minHeight: 36, justifyContent: 'center' },
  catIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  demo: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: colors.warnTint, borderWidth: 1, borderColor: '#EAD3A2' },
  field: { flexDirection: 'row', alignItems: 'center', minHeight: 50, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 14 },
  input: { flex: 1, fontFamily: fonts.inter400, fontSize: 15, color: colors.ink, paddingVertical: 10, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}) },
  switch: { width: 44, height: 26, borderRadius: 13, backgroundColor: '#CBD5CF', padding: 3 },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  seg: { flexDirection: 'row', backgroundColor: colors.soft, borderRadius: radius.card, padding: 4 },
  segItem: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingHorizontal: 4 },
  segActive: { backgroundColor: colors.surface, ...elevation },
  radio: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, marginBottom: 10, minHeight: 56 },
  radioDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#B9C5BE', alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.forest },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 14, minHeight: 56 },
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 380, backgroundColor: colors.surface, borderRadius: radius.hero, padding: 20 },
  toast: { position: 'absolute', left: 18, right: 18, zIndex: 999, backgroundColor: colors.forest, borderRadius: radius.card, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, ...elevation },
  tlDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#C6D2CB', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tlLine: { width: 2, flex: 1, minHeight: 18, backgroundColor: colors.line },
});
