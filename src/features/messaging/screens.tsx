import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, radius } from '@/theme/tokens';
import { fonts } from '@/theme/typography';
import { Avatar, Card, ConfirmationDialog, EmptyState, FilterChip, Gap, IconButton, Notice, Pill, PrimaryButton, Row, Screen, ScreenHeader, SecondaryButton, T } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { NotificationRow, SearchField } from '@/components/cards';
import { useApp } from '@/store/useApp';
import * as api from '@/mocks/services/api';
import { fmtDateTime, fmtTime, relative } from '@/lib/time';
import { firstName } from '@/lib/time';
import { useT } from '@/i18n';
import type { NotifGroup } from '@/mocks/types';

export function Inbox({ teacher }: { teacher?: boolean }) {
  const t = useT(); const st = useApp(); const [q, setQ] = useState('');
  const myProvider = st.db.accounts.find((a) => a.id === st.accountId)?.providerId;
  const threads = st.db.threads.filter((th) => (teacher ? th.providerId === myProvider : th.studentAccountId === st.accountId))
    .map((th) => ({ th, p: st.db.providers.find((p) => p.id === th.providerId)!, other: st.db.accounts.find((a) => a.id === th.studentAccountId)!, last: th.messages[th.messages.length - 1] }))
    .filter(({ p, other }) => !q || (teacher ? other.name : p.name).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.last?.at ?? 0) - (a.last?.at ?? 0));
  return (
    <Screen scroll={false} header={teacher ? <ScreenHeader title="Messages" /> : <View style={{ paddingHorizontal: 18, paddingTop: 8 }}><T v="h1">{t('msg.title')}</T></View>}>
      <Gap h={10} />
      <SearchField value={q} onChangeText={setQ} placeholder={t('msg.search')} />
      <Gap h={8} />
      <FlatList data={threads} keyExtractor={(x) => x.th.id} contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item: { th, p, other, last } }) => {
          const unread = teacher ? th.unreadTeacher : th.unreadStudent;
          const b = st.db.bookings.find((x) => x.id === th.bookingId);
          return (
            <Pressable accessibilityRole="button" accessibilityLabel={`${teacher ? other.name : p.name}${unread ? `, ${unread} unread` : ''}`} onPress={() => router.push(`/conversation/${th.id}`)} style={{ flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line }}>
              <Avatar photo={teacher ? undefined : p.photo} initials={teacher ? other.name.split(' ').map((x) => x[0]).join('').slice(0, 2) : p.initials} size={50} />
              <View style={{ flex: 1, gap: 2 }}>
                <Row style={{ justifyContent: 'space-between' }}><T v="strong" style={{ flex: 1 }} numberOfLines={1}>{teacher ? other.name : p.name}</T><T v="caption">{last ? relative(last.at, st.now) : ''}</T></Row>
                <T v={unread ? 'body' : 'bodyMuted'} numberOfLines={1} style={unread ? { fontFamily: fonts.inter600 } : undefined}>{last ? (last.from === (teacher ? 'teacher' : 'student') ? 'You: ' : '') + last.text : 'Start the conversation'}</T>
                <Row gap={6}>{b ? <Pill icon="calendar" text={`Booking ${b.ref}`} /> : th.origin === 'inquiry' ? <Pill tone="info" text="Inquiry" /> : null}</Row>
              </View>
              {unread ? <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}><T v="caption" color="#fff" style={{ fontFamily: fonts.inter700 }}>{unread}</T></View> : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={<EmptyState mood="calm" title="No conversations yet" body={teacher ? 'Messages from clients appear here.' : 'Send a booking inquiry from a provider profile to start a conversation.'} />} />
    </Screen>
  );
}

export function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>(); const st = useApp();
  const th = st.db.threads.find((x) => x.id === id);
  const [text, setText] = useState(''); const [att, setAtt] = useState<string>(); const [menu, setMenu] = useState(false);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const side = st.role === 'teacher' ? 'teacher' : 'student';
  useEffect(() => { if (th && (side === 'student' ? th.unreadStudent : th.unreadTeacher)) st.run((d) => { const x = d.threads.find((y) => y.id === id)!; if (side === 'student') x.unreadStudent = 0; else x.unreadTeacher = 0; }); }, [id, th?.messages.length]);
  if (!th) return <Screen header={<ScreenHeader />}><EmptyState title="Conversation not found" /></Screen>;
  const p = st.db.providers.find((x) => x.id === th.providerId)!; const other = st.db.accounts.find((a) => a.id === th.studentAccountId)!;
  const b = st.db.bookings.find((x) => x.id === th.bookingId) ?? st.db.bookings.filter((x) => x.providerId === th.providerId && x.studentAccountId === th.studentAccountId).sort((a, c) => c.start - a.start)[0];
  const blocked = side === 'student' && st.blocked.includes(p.id);
  const locked = side === 'student' && api.inquiryLocked(st.db, th.id) && th.messages.some((m) => m.from === 'student');
  const send = () => {
    if (!text.trim() && !att) return;
    const r = st.run((d, now) => api.sendMessage(d, now, th.id, side, text.trim() || 'Attachment', att));
    if (r.ok) { setText(''); setAtt(undefined); if (r.value) st.showToast('Contact details were hidden to keep you protected'); setTimeout(() => scroll.current?.scrollToEnd(), 50); }
  };
  return (
    <Screen scroll={false} pad={false} header={<ScreenHeader title={side === 'student' ? p.name : other.name} sub={b ? `${b.ref} · ${fmtDateTime(b.start)}` : th.origin === 'inquiry' ? 'Booking inquiry' : undefined}
      right={<>{b ? <IconButton name="calendar" label="Booking details" onPress={() => router.push(side === 'teacher' ? `/t/session/${b.id}` : `/booking/${b.id}`)} /> : null}<IconButton name="more-v" label="Report or block" onPress={() => setMenu(true)} /></>} />}>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: 18, gap: 8 }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
        <Notice tone="mint" icon="shield" text="Keep payments and contact on Growlink. Phone numbers, emails and social handles are hidden automatically." />
        {th.messages.map((m) => {
          if (m.from === 'system') return <View key={m.id} style={{ alignSelf: 'center', paddingVertical: 4 }}><Pill text={m.text} icon="info" /></View>;
          const mine = m.from === side;
          return (
            <View key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
              <View style={{ backgroundColor: mine ? colors.forest : colors.surface, borderRadius: 16, borderBottomRightRadius: mine ? 4 : 16, borderBottomLeftRadius: mine ? 16 : 4, padding: 12, borderWidth: mine ? 0 : 1, borderColor: colors.line }}>
                <T v="body" color={mine ? '#fff' : colors.ink} style={{ fontSize: 14, lineHeight: 20 }}>{m.text}</T>
                {m.attachment ? <Row gap={6} style={{ marginTop: 6, backgroundColor: mine ? 'rgba(255,255,255,0.12)' : colors.soft, padding: 8, borderRadius: 8 }}><Icon name="doc" size={16} color={mine ? '#fff' : colors.ink} /><T v="caption" color={mine ? '#fff' : colors.ink}>{m.attachment}</T></Row> : null}
              </View>
              <T v="caption" style={{ alignSelf: mine ? 'flex-end' : 'flex-start', marginTop: 2, fontSize: 10 }}>{fmtTime(m.at)}{m.masked ? ' · details hidden' : ''}</T>
            </View>
          );
        })}
        {!th.messages.length ? <EmptyState growly={false} title="Say hello" body="Messages are linked to your booking." /> : null}
      </ScrollView>
      {blocked ? <View style={{ padding: 18 }}><Notice tone="danger" text="You blocked this provider. Unblock from their profile to message." /></View> :
        locked ? <View style={{ padding: 18 }}><Notice text="Inquiry sent. You can send more messages once the provider replies or you make a booking." /></View> : (
          <View style={{ borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.surface, padding: 10, paddingBottom: 14 }}>
            {att ? <Row gap={6} style={{ marginBottom: 8, marginLeft: 8 }}><Pill icon="clip" text={att} /><IconButton name="close" size={16} label="Remove attachment" onPress={() => setAtt(undefined)} /></Row> : null}
            <Row gap={6}>
              <IconButton name="clip" label="Attach file" onPress={() => setAtt(`photo-${Date.now() % 1000}.jpg`)} />
              <TextInput value={text} onChangeText={setText} placeholder="Message" placeholderTextColor="#8D9A93" accessibilityLabel="Message" multiline
                style={{ flex: 1, minHeight: 44, maxHeight: 110, backgroundColor: colors.soft, borderRadius: radius.card, paddingHorizontal: 14, paddingTop: 12, fontFamily: fonts.inter400, fontSize: 15, color: colors.ink }} />
              <IconButton name="send" label="Send" tone="soft" color={colors.forest} onPress={send} />
            </Row>
          </View>
        )}
      <ConfirmationDialog visible={menu} title="Conversation options" confirm="Report" danger onCancel={() => setMenu(false)} onConfirm={() => { setMenu(false); router.push(`/report?target=message&id=${th.id}`); }}>
        <Gap h={10} />
        {side === 'student' ? <SecondaryButton icon="block" title={blocked ? 'Unblock provider' : 'Block provider'} onPress={() => { st.toggle('blocked', p.id); setMenu(false); }} /> : <SecondaryButton icon="block" title="Report & block client" onPress={() => { setMenu(false); router.push(`/report?target=user&id=${th.id}`); }} />}
      </ConfirmationDialog>
    </Screen>
  );
}

export function Notifications() {
  const t = useT(); const st = useApp(); const [g, setG] = useState<'all' | NotifGroup>('all');
  const list = st.db.notifications.filter((n) => n.accountId === st.accountId && n.role === st.role && (g === 'all' || n.group === g)).sort((a, b) => b.at - a.at);
  const open = (id: string, href: string) => { st.run((d) => { d.notifications.find((n) => n.id === id)!.read = true; }); router.push(href as never); };
  return (
    <Screen scroll={false} pad={false} header={<ScreenHeader title={t('notif.title')} right={<IconButton name="check" label="Mark all as read" onPress={() => st.run((d) => d.notifications.forEach((n) => { if (n.accountId === st.accountId) n.read = true; }), 'All caught up')} />} />}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 18, paddingBottom: 10 }} style={{ flexGrow: 0 }}>
        {(['all', 'bookings', 'messages', 'updates'] as const).map((k) => <FilterChip key={k} label={t(`notif.${k}` as never)} active={g === k} onPress={() => setG(k)} count={st.db.notifications.filter((n) => n.accountId === st.accountId && n.role === st.role && !n.read && (k === 'all' || n.group === k)).length || undefined} />)}
      </ScrollView>
      <FlatList data={list} keyExtractor={(n) => n.id} renderItem={({ item }) => <NotificationRow n={item} onPress={() => open(item.id, item.href)} />}
        ListEmptyComponent={<EmptyState mood="calm" title="You're all caught up" body="Booking updates, messages and reminders will appear here." />} />
    </Screen>
  );
}

// ---------- Lesson Space ----------
export function LessonSpace({ teacher }: { teacher?: boolean }) {
  const { id } = useLocalSearchParams<{ id: string }>(); const st = useApp();
  const [providerId, learnerId] = (id ?? '').split('__');
  const p = st.db.providers.find((x) => x.id === providerId); const l = st.db.learners.find((x) => x.id === learnerId);
  // scope: only the owning student account or the teacher may view
  const allowed = p && l && (teacher ? st.db.accounts.find((a) => a.id === st.accountId)?.providerId === p.id : l.accountId === st.accountId);
  if (!allowed) return <Screen header={<ScreenHeader title="Lesson Space" />}><EmptyState growly={false} title="Not available" body="This Lesson Space is private to its learner and teacher." /></Screen>;
  const sessions = st.db.bookings.filter((b) => b.providerId === p.id && b.learnerId === l.id && (b.status === 'completed' || b.status === 'disputed')).sort((a, b) => b.start - a.start);
  const mats = st.db.materials.filter((m) => m.providerId === p.id && m.learnerId === l.id).sort((a, b) => b.at - a.at);
  const thread = st.db.threads.find((t) => t.providerId === p.id && t.studentAccountId === l.accountId);
  const owner = st.db.accounts.find((a) => a.id === l.accountId)!;
  return (
    <Screen header={<ScreenHeader title="Lesson Space" sub={`${p.name} · ${l.name}`} right={teacher ? <IconButton name="plus" label="Add material" onPress={() => router.push(`/t/material-add?learner=${l.id}`)} /> : undefined} />}>
      <Card style={{ backgroundColor: colors.mintTint, borderColor: colors.mintTint }}>
        <Row gap={12}><Avatar photo={p.photo} initials={p.initials} size={44} /><Icon name="swap" size={18} color={colors.muted} /><Avatar initials={l.name[0]} size={44} />
          <View style={{ flex: 1 }}><T v="strong">{l.name}</T><T v="caption">{l.relation === 'child' ? `Managed by ${owner.name}` : 'Self learner'} · {sessions.length} sessions</T></View></Row>
      </Card>
      {mats.filter((m) => m.kind === 'progress').slice(0, 1).map((m) => <View key={m.id}><Gap /><T v="section">Progress</T><Gap h={8} /><Card><T v="body" style={{ fontSize: 13.5 }}>{m.body}</T><T v="caption" style={{ marginTop: 6 }}>Updated {relative(m.at, st.now)}</T></Card></View>)}
      <Gap /><T v="section">Class materials</T><Gap h={8} />
      {mats.filter((m) => m.kind === 'material').map((m) => (
        <Card key={m.id} style={{ marginBottom: 8 }}>
          <Row gap={10} style={{ alignItems: 'flex-start' }}><Icon name="doc" size={20} color={colors.forest} /><View style={{ flex: 1 }}><T v="strong">{m.title}</T><T v="bodyMuted">{m.body}</T>
            {m.attachment ? <Pressable accessibilityRole="button" onPress={() => st.showToast('Opening attachment (simulated)')}><Row gap={6} style={{ marginTop: 6 }}><Icon name="clip" size={14} color={colors.link} /><T v="caption" color={colors.link}>{m.attachment}</T></Row></Pressable> : null}
            <T v="caption" style={{ marginTop: 4 }}>{relative(m.at, st.now)}</T></View></Row>
        </Card>
      ))}
      {!mats.some((m) => m.kind === 'material') ? <T v="bodyMuted">No materials yet.</T> : null}
      <Gap /><T v="section">Session timeline</T><Gap h={8} />
      {sessions.map((b) => {
        const note = mats.find((m) => m.bookingId === b.id && m.kind === 'session_note');
        return <Card key={b.id} style={{ marginBottom: 8 }} onPress={() => router.push(teacher ? `/t/session/${b.id}` : `/booking/${b.id}`)}><Row style={{ justifyContent: 'space-between' }}><T v="strong">{fmtDateTime(b.start)}</T><Pill tone="mint" text="Completed" icon="check" /></Row>{note ? <T v="bodyMuted" style={{ marginTop: 4 }}>📝 {note.body}</T> : null}</Card>;
      })}
      {!sessions.length ? <T v="bodyMuted">Completed sessions will appear here.</T> : null}
      <Gap />
      {thread ? <SecondaryButton title={teacher ? `Message ${firstName(owner.name)}` : 'Open conversation'} icon="chat" onPress={() => router.push(`/conversation/${thread.id}`)} /> : null}
      {teacher ? <><Gap h={10} /><PrimaryButton title="Add class material" icon="plus" onPress={() => router.push(`/t/material-add?learner=${l.id}`)} /></> : null}
    </Screen>
  );
}
export { PrimaryButton };
