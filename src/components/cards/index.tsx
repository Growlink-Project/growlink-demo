import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { colors, elevation, radius } from '@/theme/tokens';
import { fonts } from '@/theme/typography';
import { IMG } from '@/assets';
import { Icon } from '../ui/Icon';
import { Avatar, Card, CategoryTag, IconButton, Pill, Rating, Row, StatusBadge, Stars, T } from '../ui/core';
import { useApp } from '@/store/useApp';
import { categoryOf, Result, skillOf, wallet as walletOf } from '@/mocks/services/api';
import type { Booking, Mode, Notification, Pricing, Review, Slot } from '@/mocks/types';
import { dayNum, dist, fmtDate, fmtTime, relative, rm, rm0, sameDay, startOfDay, weekday, DAY, monthLabel } from '@/lib/time';
import { bookingView, modeIcon, modeLabel } from '@/hooks/lookup';

// ---------- Search ----------
export function SearchField({ value, onChangeText, placeholder, onFocusPress, onFilter, filterCount, autoFocus, onSubmit }: { value?: string; onChangeText?: (s: string) => void; placeholder: string; onFocusPress?: () => void; onFilter?: () => void; filterCount?: number; autoFocus?: boolean; onSubmit?: () => void }) {
  const inner = (
    <View style={c.search}>
      <Icon name="search" size={20} color={colors.muted} />
      {onFocusPress ? <T v="body" color="#7C8983" style={{ flex: 1, fontSize: 14 }} numberOfLines={1}>{value || placeholder}</T> : (
        <TextInput autoFocus={autoFocus} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#7C8983" returnKeyType="search" onSubmitEditing={onSubmit}
          accessibilityLabel={placeholder} style={c.searchInput} />
      )}
      {!onFocusPress && value ? <IconButton name="close" size={16} label="Clear search" onPress={() => onChangeText?.('')} /> : null}
      {onFilter ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Filters${filterCount ? `, ${filterCount} active` : ''}`} onPress={onFilter} hitSlop={8} style={c.filterBtn}>
          <Icon name="sliders" size={20} color={colors.ink} />
          {filterCount ? <View style={c.filterCount}><T v="caption" color="#fff" style={{ fontSize: 9.5, fontFamily: fonts.inter700 }}>{filterCount}</T></View> : null}
        </Pressable>
      ) : null}
    </View>
  );
  return onFocusPress ? <Pressable accessibilityRole="search" accessibilityLabel={placeholder} onPress={onFocusPress}>{inner}</Pressable> : inner;
}

// ---------- Providers ----------
function Thumb({ photo, initials, size }: { photo?: string; initials: string; size: number }) {
  return <Avatar photo={photo} initials={initials} size={size} rounded="tile" />;
}
export function ProviderCard({ r, selected, onPress, showNext = true }: { r: Result; selected?: boolean; onPress: () => void; showNext?: boolean }) {
  const p = r.provider; const cat = categoryOf(p.categoryId)!;
  const saved = useApp((s) => s.saved.includes(p.id)); const toggle = useApp((s) => s.toggle);
  return (
    <Card onPress={onPress} label={`${p.name}, ${p.headline}`} pad={12} style={[{ marginBottom: 10 }, selected && { borderColor: colors.green, borderWidth: 1.5 }]}>
      <Row gap={12} style={{ alignItems: 'flex-start' }}>
        <Thumb photo={p.photo} initials={p.initials} size={96} />
        <View style={{ flex: 1, gap: 3 }}>
          <CategoryTag label={cat.short} icon={cat.icon} tint={cat.tint} fg={cat.fg} />
          <T v="strong" style={{ fontSize: 16 }} numberOfLines={1}>{p.name}</T>
          <T v="bodyMuted" numberOfLines={1}>{p.headline}</T>
          <Row gap={8}><Rating rating={p.rating} count={p.reviewCount} /><T v="bodyMuted">· {dist(r.distance)}</T></Row>
          <Row gap={8} wrap>
            {r.from != null ? <T v="strong" style={{ fontSize: 13 }}>from {rm0(r.from)}</T> : null}
            {r.modes.includes('online') ? <Pill text="Online" icon="monitor" /> : null}
          </Row>
          {showNext && r.next ? <T v="caption" color={colors.link}>● Next: {fmtDate(r.next.start)}, {fmtTime(r.next.start)}</T> : null}
        </View>
        <IconButton name="heart" label={saved ? 'Unsave' : 'Save'} tone="soft" size={18} color={saved ? colors.green : colors.ink} onPress={() => toggle('saved', p.id)} />
      </Row>
    </Card>
  );
}
export function CompactProviderCard({ r, selected, onPress }: { r: Result; selected?: boolean; onPress: () => void }) {
  const p = r.provider; const cat = categoryOf(p.categoryId)!;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${p.name}, ${p.headline}, ${dist(r.distance)}`} onPress={onPress} style={[c.compact, selected && { borderColor: colors.green, borderWidth: 1.5 }]}>
      <Thumb photo={p.photo} initials={p.initials} size={84} />
      <View style={{ flex: 1, gap: 2 }}>
        <CategoryTag label={cat.short} icon={cat.icon} tint={cat.tint} fg={cat.fg} />
        <T v="strong" numberOfLines={1} style={{ fontSize: 15 }}>{p.name}</T>
        <T v="bodyMuted" numberOfLines={1}>{p.headline}</T>
        <Row gap={6}><Rating rating={p.rating} count={p.reviewCount} /><T v="bodyMuted">· {dist(r.distance)}</T></Row>
        {r.from != null ? <T v="caption" color={colors.ink}>from <T v="caption" color={colors.ink} style={{ fontFamily: fonts.inter700 }}>{rm0(r.from)}</T></T> : null}
      </View>
    </Pressable>
  );
}

// ---------- Booking ----------
export function BookingCard({ b, onPress, action }: { b: Booking; onPress: () => void; action?: { label: string; onPress: () => void } }) {
  const db = useApp((s) => s.db); const v = bookingView(db, b);
  return (
    <Card onPress={onPress} label={`${v.service.title} with ${v.provider.name}`} style={{ marginBottom: 10 }}>
      <Row gap={12} style={{ alignItems: 'flex-start' }}>
        <View style={c.dateBox}><T v="caption" color={colors.muted}>{weekday(b.start)}</T><T v="h1" style={{ fontSize: 22, lineHeight: 26 }}>{dayNum(b.start)}</T></View>
        <View style={{ flex: 1, gap: 3 }}>
          <StatusBadge status={b.status} />
          <T v="strong" numberOfLines={1}>{v.pkg.label}</T>
          <T v="bodyMuted" numberOfLines={1}>{v.provider.name} · for {v.learner.relation === 'self' ? 'you' : v.learner.name}</T>
          <Row gap={6}><Icon name="clock" size={13} color={colors.muted} /><T v="bodyMuted">{fmtTime(b.start)} · {b.durationMin} min</T><Icon name={modeIcon(b.mode)} size={13} color={colors.muted} /><T v="bodyMuted" numberOfLines={1} style={{ flexShrink: 1 }}>{modeLabel(b.mode)}</T></Row>
        </View>
        <Icon name="chevron-right" size={18} color={colors.muted} />
      </Row>
      {action ? <Pressable accessibilityRole="button" onPress={action.onPress} style={c.cardAction}><T v="strong" color={colors.link} style={{ fontSize: 13.5 }}>{action.label}</T><Icon name="arrow" size={15} color={colors.link} /></Pressable> : null}
    </Card>
  );
}
export function SessionCard({ b, onPress, compact }: { b: Booking; onPress: () => void; compact?: boolean }) {
  const db = useApp((s) => s.db); const v = bookingView(db, b);
  return (
    <Card onPress={onPress} label={`Session ${fmtTime(b.start)} ${v.learner.name}`} pad={12} style={{ marginBottom: 8 }}>
      <Row gap={12}>
        <View style={{ width: 62 }}><T v="strong" style={{ fontSize: 13.5 }}>{fmtTime(b.start)}</T><T v="caption">{b.durationMin} min</T></View>
        <View style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: b.status === 'confirmed' ? colors.green : b.status === 'pending_confirmation' ? colors.star : colors.line }} />
        <View style={{ flex: 1, gap: 2 }}>
          <T v="strong" numberOfLines={1}>{v.learner.name}{v.learner.relation === 'child' ? ` · via ${v.student.name.split(' ')[0]}` : ''}</T>
          <T v="bodyMuted" numberOfLines={1}>{v.pkg.label}</T>
          {!compact ? <Row gap={6}><Icon name={modeIcon(b.mode)} size={13} color={colors.muted} /><T v="caption">{modeLabel(b.mode, true)}</T></Row> : null}
        </View>
        <StatusBadge status={b.status} />
      </Row>
    </Card>
  );
}
export function PriceBreakdown({ pricing, title = 'Fee Breakdown' }: { pricing: Pricing; title?: string }) {
  return (
    <View accessibilityLabel={`${title}. Total ${rm(pricing.total)}`}>
      <T v="strong" style={{ marginBottom: 8 }}>{title}</T>
      {pricing.lines.map((l) => (
        <View key={l.label} style={{ paddingVertical: 4 }}>
          <Row style={{ justifyContent: 'space-between' }}><T v="body" style={{ fontSize: 14 }}>{l.label}</T><T v="body" style={{ fontSize: 14, fontVariant: ['tabular-nums'] }}>{l.amount === 0 ? 'RM 0.00 · Free' : rm(l.amount)}</T></Row>
          {l.note ? <T v="caption">{l.note}</T> : null}
        </View>
      ))}
      <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 10 }} />
      <Row style={{ justifyContent: 'space-between' }}><T v="strong" style={{ fontSize: 16 }}>Total</T><T v="price" style={{ fontSize: 18 }}>{rm(pricing.total)}</T></Row>
    </View>
  );
}
export function DateSelector({ slots, value, onChange, now }: { slots: Slot[]; value: number; onChange: (d: number) => void; now: number }) {
  const [offset, setOffset] = React.useState(() => Math.max(0, Math.floor((startOfDay(value) - startOfDay(now)) / DAY / 7)) * 7);
  const days = Array.from({ length: 7 }, (_, i) => startOfDay(now) + (offset + i) * DAY);
  return (
    <View>
      <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <T v="strong">{monthLabel(days[0])}</T>
        <Row gap={2}>
          <IconButton name="chevron-left" label="Previous week" size={18} onPress={() => setOffset(Math.max(0, offset - 7))} />
          <IconButton name="chevron-right" label="Next week" size={18} onPress={() => setOffset(Math.min(21, offset + 7))} />
        </Row>
      </Row>
      <Row gap={4} style={{ justifyContent: 'space-between' }}>
        {days.map((d) => {
          const has = slots.some((s) => sameDay(s.start, d) && s.state === 'open' && s.start > now);
          const sel = sameDay(d, value);
          return (
            <Pressable key={d} accessibilityRole="button" accessibilityState={{ selected: sel, disabled: !has }} accessibilityLabel={`${fmtDate(d)}${has ? '' : ', no availability'}`} onPress={() => onChange(d)}
              style={[c.day, sel && { backgroundColor: colors.forest }]}>
              <T v="caption" color={sel ? '#fff' : colors.muted}>{weekday(d)}</T>
              <T v="strong" style={{ fontSize: 17 }} color={sel ? '#fff' : has ? colors.ink : '#A9B4AE'}>{dayNum(d)}</T>
              <View style={[c.dot, { backgroundColor: has ? (sel ? '#fff' : colors.green) : 'transparent' }]} />
            </Pressable>
          );
        })}
      </Row>
    </View>
  );
}
export function TimeSlotSelector({ slots, value, onChange, now }: { slots: Slot[]; value?: string; onChange: (id: string) => void; now: number }) {
  if (!slots.length) return <T v="bodyMuted">No sessions on this day. Try another date.</T>;
  return (
    <Row gap={8} wrap>
      {slots.map((s) => {
        const disabled = s.state !== 'open' || s.start <= now; const sel = value === s.id;
        const why = s.start <= now ? 'passed' : s.state === 'held' ? 'on hold' : s.state === 'booked' ? 'booked' : s.state === 'blocked' ? 'unavailable' : '';
        return (
          <Pressable key={s.id} disabled={disabled} accessibilityRole="button" accessibilityState={{ selected: sel, disabled }} accessibilityLabel={`${fmtTime(s.start)}${why ? ', ' + why : ''}`} onPress={() => onChange(s.id)}
            style={[c.slot, sel && { backgroundColor: colors.forest, borderColor: colors.forest }, disabled && { backgroundColor: colors.soft, borderColor: colors.soft }]}>
            <T v="strong" style={{ fontSize: 13.5, textDecorationLine: disabled ? 'line-through' : 'none' }} color={sel ? '#fff' : disabled ? '#9AA6A0' : colors.ink}>{fmtTime(s.start)}</T>
            {why ? <T v="caption" style={{ fontSize: 9.5 }} color="#9AA6A0">{why}</T> : null}
          </Pressable>
        );
      })}
    </Row>
  );
}
export function ModeSelector({ modes, value, onChange }: { modes: Mode[]; value?: Mode; onChange: (m: Mode) => void }) {
  const sub = { provider: "At teacher's location", student: 'Teacher comes to you', online: 'Live session' } as const;
  const title = { provider: 'In-Person', student: 'At My Location', online: 'Online' } as const;
  return (
    <View style={{ gap: 8 }}>
      {modes.map((m) => {
        const sel = value === m;
        return (
          <Pressable key={m} accessibilityRole="radio" accessibilityState={{ checked: sel }} accessibilityLabel={`${title[m]}, ${sub[m]}`} onPress={() => onChange(m)} style={[c.mode, sel && { backgroundColor: colors.forest, borderColor: colors.forest }]}>
            <Icon name={modeIcon(m)} size={22} color={sel ? '#fff' : colors.ink} />
            <View style={{ flex: 1 }}><T v="strong" color={sel ? '#fff' : colors.ink}>{title[m]}</T><T v="caption" color={sel ? '#D5E7DD' : colors.muted}>{sub[m]}{m === 'student' ? ' · transport fee applies' : ''}</T></View>
            {sel ? <Icon name="check" size={18} color="#fff" /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
export function ReviewCard({ r, onReport }: { r: Review; onReport?: () => void }) {
  const now = useApp((s) => s.now);
  return (
    <Card style={{ marginBottom: 10 }}>
      <Row gap={10}>
        <Avatar initials={r.author.split(' ').map((x) => x[0]).join('')} size={38} />
        <View style={{ flex: 1 }}><T v="strong">{r.author}</T><T v="caption">{relative(r.at, now)}</T></View>
        <Stars value={r.rating} size={15} />
        {onReport ? <IconButton name="more-v" size={18} label="Report review" onPress={onReport} /> : null}
      </Row>
      {r.text ? <T v="body" style={{ marginTop: 10, fontSize: 13.5, lineHeight: 20 }}>{r.text}</T> : null}
      {r.tags.length ? <Row gap={6} wrap style={{ marginTop: 8 }}>{r.tags.map((t) => <Pill key={t} text={t} />)}</Row> : null}
    </Card>
  );
}
const NICON: Record<string, string> = { message: 'chat', reminder: 'clock', materials: 'doc', review_request: 'star', review: 'star', post: 'image', refund: 'refresh', created: 'calendar', payment: 'card', payment_failed: 'card', confirmed: 'check', cancelled: 'close', checkin: 'checkin', completed: 'trophy', dispute: 'flag', payout: 'bank', earning: 'wallet', approval: 'shield', request: 'calendar' };
export function NotificationRow({ n, onPress }: { n: Notification; onPress: () => void }) {
  const now = useApp((s) => s.now);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${n.read ? '' : 'Unread. '}${n.title}. ${n.body}`} onPress={onPress} style={({ pressed }) => [c.notif, !n.read && { backgroundColor: '#F3FAF5' }, pressed && { opacity: 0.8 }]}>
      <View style={[c.nIcon, { backgroundColor: n.kind === 'payment_failed' || n.kind === 'dispute' ? colors.dangerTint : colors.mintTint }]}>
        <Icon name={NICON[n.kind] ?? 'bell'} size={18} color={n.kind === 'payment_failed' || n.kind === 'dispute' ? colors.danger : colors.forest} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Row style={{ justifyContent: 'space-between' }}><T v="strong" style={{ fontSize: 14, flex: 1 }} numberOfLines={1}>{n.title}</T><T v="caption">{relative(n.at, now)}</T></Row>
        <T v="bodyMuted" numberOfLines={2}>{n.body}</T>
      </View>
      {!n.read ? <View style={c.unread} accessibilityLabel="unread" /> : null}
    </Pressable>
  );
}
export function WalletSummary({ providerId }: { providerId: string }) {
  const ledger = useApp((s) => s.db.ledger); const w = walletOf(ledger, providerId);
  return (
    <View style={c.wallet}>
      <T v="caption" color="#B9D5C6">AVAILABLE TO WITHDRAW</T>
      <T v="money" color="#fff" style={{ fontSize: 32, lineHeight: 38, marginTop: 2 }}>{rm(w.available)}</T>
      <Row style={{ marginTop: 14 }} gap={0}>
        {[['Pending', w.pending, w.held ? `${rm(w.held)} on hold` : '72h dispute window'], ['Withdrawn', w.withdrawn, w.inFlight ? `${rm(w.inFlight)} in transit` : 'All time']].map(([k, v, sub], i) => (
          <View key={k as string} style={[{ flex: 1 }, i === 1 && { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.15)', paddingLeft: 14 }]}>
            <T v="caption" color="#B9D5C6">{k as string}</T>
            <T v="price" color="#fff" style={{ fontSize: 17 }}>{rm(v as number)}</T>
            <T v="caption" color="#9DBFAE" style={{ fontSize: 10.5 }}>{sub as string}</T>
          </View>
        ))}
      </Row>
    </View>
  );
}
export function HScroll({ children, gap = 10 }: { children: React.ReactNode; gap?: number }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap, paddingHorizontal: 18 }} style={{ marginHorizontal: -18 }} nestedScrollEnabled>{children}</ScrollView>;
}
export { IMG, Image };

const c = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, borderRadius: radius.card, backgroundColor: colors.soft, paddingLeft: 14, paddingRight: 6 },
  searchInput: { flex: 1, fontFamily: fonts.inter400, fontSize: 15, color: colors.ink, height: 48 },
  filterBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  filterCount: { position: 'absolute', top: 3, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  compact: { width: 300, flexDirection: 'row', gap: 12, padding: 12, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, ...elevation },
  dateBox: { width: 52, height: 58, borderRadius: radius.tile, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  cardAction: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line, minHeight: 36 },
  day: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.tile, gap: 2, minHeight: 64 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  slot: { minWidth: 96, alignItems: 'center', paddingVertical: 9, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, minHeight: 44, justifyContent: 'center' },
  mode: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, minHeight: 60 },
  notif: { flexDirection: 'row', gap: 12, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: colors.line },
  nIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  unread: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green, marginTop: 6 },
  wallet: { backgroundColor: colors.forest, borderRadius: radius.hero, padding: 20 },
});
