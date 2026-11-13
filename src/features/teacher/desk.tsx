import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, radius } from '@/theme/tokens';
import { Avatar, Card, ConfirmationDialog, EmptyState, FilterChip, FormField, Gap, IconButton, KV, ListRow, Notice, Pill, PrimaryButton, Radio, Row, Screen, ScreenHeader, SecondaryButton, Segmented, SectionHeader, SkillChip, StatusBadge, Stars, T, TextLink, Timeline } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { DateSelector, SearchField, SessionCard } from '@/components/cards';
import { useAccount, useApp } from '@/store/useApp';
import * as api from '@/mocks/services/api';
import { DAY, dayNum, fmtDate, fmtDateLong, fmtDateTime, fmtTime, HOUR, MIN, relative, rm, sameDay, startOfDay, startOfWeek, until, weekday } from '@/lib/time';
import { firstName } from '@/lib/time';
import { bookingView, modeIcon, modeLabel } from '@/hooks/lookup';
import { ApprovalBanner, NeedTeacher, useTeacher } from './onboarding';
import { historyItems } from '../booking/manage';
import { useT } from '@/i18n';

const ACTIVE = ['pending_confirmation', 'confirmed', 'in_progress'];
function useTeacherBookings() {
  const p = useTeacher(); const db = useApp((s) => s.db);
  return p ? db.bookings.filter((b) => b.providerId === p.id) : [];
}

export function TeacherHome() {
  const t = useT(); const p = useTeacher(); const st = useApp(); const acc = useAccount();
  const all = useTeacherBookings();
  if (!p) return <NeedTeacher />;
  const upcoming = all.filter((b) => ['confirmed', 'in_progress'].includes(b.status) && b.start + b.durationMin * MIN > st.now).sort((a, b) => a.start - b.start);
  const next = upcoming[0];
  const pending = all.filter((b) => b.status === 'pending_confirmation');
  const today = all.filter((b) => sameDay(b.start, st.now) && ACTIVE.concat('completed').includes(b.status)).sort((a, b) => a.start - b.start);
  const unread = st.db.threads.filter((th) => th.providerId === p.id).reduce((a, th) => a + th.unreadTeacher, 0);
  const tasks = st.db.tasks.filter((x) => x.providerId === p.id && !x.done && x.due < st.now + 2 * DAY);
  const unreadN = st.db.notifications.some((n) => n.accountId === acc.id && n.role === 'teacher' && !n.read);
  const hour = new Date(st.now + 8 * HOUR).getUTCHours();
  const actions = [
    pending.length && { icon: 'calendar', label: `${pending.length} booking request${pending.length > 1 ? 's' : ''} to confirm`, href: '/t/requests', tone: 'warn' },
    unread && { icon: 'chat', label: `${unread} unread message${unread > 1 ? 's' : ''}`, href: '/t/messages' },
    p.approval !== 'approved' && { icon: 'shield', label: 'Approval required before you can be booked', href: '/t/approval', tone: 'warn' },
    p.payoutOnboarding !== 'complete' && { icon: 'bank', label: 'Finish payout onboarding', href: '/t/payout-onboarding' },
    tasks.length && { icon: 'check', label: `${tasks.length} task${tasks.length > 1 ? 's' : ''} due soon`, href: '/t/tasks' },
  ].filter(Boolean) as { icon: string; label: string; href: string; tone?: string }[];
  return (
    <Screen header={
      <Row style={{ paddingHorizontal: 18, paddingVertical: 8, justifyContent: 'space-between' }}>
        <Row gap={10}><Avatar photo={p.photo} initials={p.initials} size={42} /><View><T v="caption">{hour < 12 ? t('teacher.greeting') : hour < 18 ? 'Good afternoon' : 'Good evening'}</T><T v="screenTitle">{firstName(p.name)}</T></View></Row>
        <Row gap={0}><IconButton name="chat" label="Messages" badge={unread > 0} onPress={() => router.push('/t/messages')} /><IconButton name="bell" label="Notifications" badge={unreadN} onPress={() => router.push('/notifications')} /></Row>
      </Row>}>
      <ApprovalBanner />
      <SectionHeader title={t('teacher.next')} style={{ marginTop: 8 }} />
      {next ? (() => { const v = bookingView(st.db, next); return (
        <View style={{ backgroundColor: colors.forest, borderRadius: radius.hero, padding: 18 }}>
          <Row style={{ justifyContent: 'space-between' }}><T v="caption" color="#B9D5C6">{fmtDate(next.start).toUpperCase()} · {until(next.start, st.now).toUpperCase()}</T><StatusBadge status={next.status} /></Row>
          <T v="hero" color="#fff" style={{ fontSize: 26, marginTop: 6 }}>{fmtTime(next.start)}</T>
          <T v="strong" color="#fff" style={{ marginTop: 4 }}>{v.learner.name}{v.learner.relation === 'child' ? ` · via ${v.student.name}` : ''}</T>
          <T v="body" color="#CFE3D8">{v.pkg.label}</T>
          <Row gap={6} style={{ marginTop: 6 }}><Icon name={modeIcon(next.mode)} size={14} color="#CFE3D8" /><T v="body" color="#CFE3D8">{modeLabel(next.mode, true)}</T></Row>
          <Pressable accessibilityRole="button" onPress={() => router.push(`/t/session/${next.id}`)} style={{ marginTop: 14, backgroundColor: '#fff', borderRadius: radius.card, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><T v="button" color={colors.forest}>View Session</T></Pressable>
        </View>); })() : <Card><T v="bodyMuted">No upcoming confirmed sessions.</T></Card>}
      <SectionHeader title={t('teacher.action')} />
      {actions.length ? <Card pad={0}>{actions.map((a, i) => <ListRow key={a.label} icon={a.icon} label={a.label} onPress={() => router.push(a.href as never)} last={i === actions.length - 1} right={a.tone === 'warn' ? <Pill tone="warn" text="Now" /> : undefined} />)}</Card> : <Notice tone="mint" text="You're all caught up." />}
      <SectionHeader title={t('teacher.today')} action="Calendar" onAction={() => router.push('/t/calendar')} />
      {today.length ? today.map((b) => <SessionCard key={b.id} b={b} onPress={() => router.push(`/t/session/${b.id}`)} />) : <T v="bodyMuted">No sessions today.</T>}
      <SectionHeader title={t('teacher.shortcuts')} />
      <Row gap={10} wrap>
        {[['desk', 'My Desk', '/teacher/desk'], ['layers', 'Manage Services', '/t/services'], ['calendar', 'Availability', '/t/availability'], ['wallet', 'Finance', '/teacher/finance']].map(([i, l, h]) => (
          <Pressable key={l} accessibilityRole="button" onPress={() => router.push(h as never)} style={{ width: '48%', flexGrow: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.card, padding: 14, gap: 8, minHeight: 80 }}>
            <Icon name={i} size={22} /><T v="strong" style={{ fontSize: 14 }}>{l}</T>
          </Pressable>
        ))}
      </Row>
    </Screen>
  );
}

export function MyDesk() {
  const p = useTeacher(); const st = useApp(); const all = useTeacherBookings();
  const [view, setView] = useState<'day' | 'week'>('day'); const [day, setDay] = useState(startOfDay(st.now));
  if (!p) return <NeedTeacher />;
  const ws = startOfWeek(day);
  const completed = all.filter((b) => b.status === 'completed'); const week = all.filter((b) => b.start >= startOfWeek(st.now) && b.start < startOfWeek(st.now) + 7 * DAY && ACTIVE.concat('completed').includes(b.status));
  const tasks = st.db.tasks.filter((x) => x.providerId === p.id && !x.done);
  return (
    <Screen header={<View style={{ paddingHorizontal: 18, paddingTop: 8 }}><T v="h1">My Desk</T></View>}>
      <Gap h={10} />
      <Row gap={10}>
        {[['This week', `${week.length}`, 'sessions'], ['Requests', `${all.filter((b) => b.status === 'pending_confirmation').length}`, 'pending'], ['Rating', p.rating.toFixed(1), `${p.reviewCount} reviews`]].map(([k, v, s]) => (
          <Card key={k} style={{ flex: 1 }} pad={12}><T v="caption">{k}</T><T v="h1" style={{ fontSize: 22 }}>{v}</T><T v="caption">{s}</T></Card>
        ))}
      </Row>
      <SectionHeader title="Calendar" action="Month" onAction={() => router.push('/t/calendar')} />
      <Segmented value={view} onChange={setView} options={[{ key: 'day', label: 'Daily' }, { key: 'week', label: 'Weekly' }]} />
      <Gap h={10} />
      {view === 'day' ? (
        <>
          <Card pad={10}><DateSelector slots={st.db.slots.filter((s) => s.providerId === p.id)} value={day} now={st.now - 7 * DAY} onChange={setDay} /></Card>
          <Gap h={10} /><Agenda providerId={p.id} day={day} />
        </>
      ) : (
        <View>
          {Array.from({ length: 7 }, (_, i) => ws + i * DAY).map((d) => {
            const items = all.filter((b) => sameDay(b.start, d) && ACTIVE.concat('completed').includes(b.status)).sort((a, b) => a.start - b.start);
            const open = st.db.slots.filter((s) => s.providerId === p.id && sameDay(s.start, d) && s.state === 'open').length;
            return (
              <Pressable key={d} accessibilityRole="button" onPress={() => { setDay(d); setView('day'); }} style={{ flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                <View style={{ width: 44, alignItems: 'center' }}><T v="caption">{weekday(d)}</T><T v="strong" style={{ fontSize: 18 }} color={sameDay(d, st.now) ? colors.green : colors.ink}>{dayNum(d)}</T></View>
                <View style={{ flex: 1, gap: 4 }}>
                  {items.map((b) => <Row key={b.id} gap={6}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: b.status === 'pending_confirmation' ? colors.star : colors.green }} /><T v="body">{fmtTime(b.start)} · {bookingView(st.db, b).learner.name}</T></Row>)}
                  <T v="caption">{open} open slot{open === 1 ? '' : 's'}{!items.length ? ' · no sessions' : ''}</T>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
      <SectionHeader title="Availability" action="Manage" onAction={() => router.push('/t/availability')} />
      <Card onPress={() => router.push('/t/availability')}><Row gap={10}><Icon name="calendar" size={20} /><T v="body" style={{ flex: 1 }}>{api.openSlots(st.db, p.id, st.now).length} open slots in the next 30 days</T><Icon name="chevron-right" size={18} color={colors.muted} /></Row></Card>
      <SectionHeader title={`Tasks (${tasks.length})`} action="All tasks" onAction={() => router.push('/t/tasks')} />
      {tasks.slice(0, 3).map((x) => <ListRow key={x.id} icon="square" label={x.title} sub={`Due ${fmtDateTime(x.due)}`} onPress={() => router.push('/t/tasks')} />)}
      <SectionHeader title="Performance overview" action="Growth" onAction={() => router.push('/t/growth')} />
      <Card><KV k="Completed sessions" v={`${p.completedSessions + completed.length}`} /><KV k="Reliability score" v={`${p.reliability}%`} /><KV k="Response rate" v={`${p.responseRate}%`} /><KV k="Current tier" v={p.tier} /></Card>
    </Screen>
  );
}

function Agenda({ providerId, day }: { providerId: string; day: number }) {
  const st = useApp();
  const items = st.db.bookings.filter((b) => b.providerId === providerId && sameDay(b.start, day) && ACTIVE.concat('completed').includes(b.status)).sort((a, b) => a.start - b.start);
  const slots = st.db.slots.filter((s) => s.providerId === providerId && sameDay(s.start, day) && (s.state === 'open' || s.state === 'blocked')).sort((a, b) => a.start - b.start);
  return (
    <View>
      <T v="strong" style={{ marginBottom: 8 }}>{fmtDateLong(day)}</T>
      {items.map((b) => <SessionCard key={b.id} b={b} onPress={() => router.push(`/t/session/${b.id}`)} />)}
      {slots.length ? <Row gap={6} wrap style={{ marginTop: 4 }}>{slots.map((s) => <Pill key={s.id} tone={s.state === 'open' ? 'mint' : 'soft'} text={`${fmtTime(s.start)} ${s.state}`} />)}</Row> : null}
      {!items.length && !slots.length ? <T v="bodyMuted">Nothing scheduled.</T> : null}
    </View>
  );
}

export function TeacherCalendar() {
  const p = useTeacher(); const st = useApp(); const [month, setMonth] = useState(0); const [sel, setSel] = useState(startOfDay(st.now));
  if (!p) return <NeedTeacher />;
  const base = new Date(st.now + 8 * HOUR); const y = base.getUTCFullYear(); const m = base.getUTCMonth() + month;
  const first = Date.UTC(y, m, 1) - 8 * HOUR; const firstWd = (new Date(first + 8 * HOUR).getUTCDay() + 6) % 7; const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const cells = Array.from({ length: firstWd + days }, (_, i) => (i < firstWd ? null : first + (i - firstWd) * DAY));
  const label = new Date(first + 8 * HOUR).toLocaleString('en-MY', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return (
    <Screen header={<ScreenHeader title="Calendar" />}>
      <Row style={{ justifyContent: 'space-between' }}><IconButton name="chevron-left" label="Previous month" onPress={() => setMonth(month - 1)} /><T v="section">{label}</T><IconButton name="chevron-right" label="Next month" onPress={() => setMonth(month + 1)} /></Row>
      <Row gap={0}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <T key={i} v="caption" center style={{ flex: 1 }}>{d}</T>)}</Row>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={{ width: '14.28%', height: 48 }} />;
          const sessions = st.db.bookings.filter((b) => b.providerId === p.id && sameDay(b.start, d) && ACTIVE.concat('completed').includes(b.status)).length;
          const open = st.db.slots.filter((s) => s.providerId === p.id && sameDay(s.start, d) && s.state === 'open').length;
          const blocked = st.db.slots.some((s) => s.providerId === p.id && sameDay(s.start, d) && s.state === 'blocked');
          const isSel = sameDay(d, sel);
          return (
            <Pressable key={i} accessibilityRole="button" accessibilityLabel={`${fmtDate(d)}, ${sessions} sessions, ${open} open`} onPress={() => setSel(d)} style={{ width: '14.28%', height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: isSel ? colors.forest : 'transparent' }}>
              <T v="strong" color={isSel ? '#fff' : blocked ? '#A9B4AE' : colors.ink} style={{ fontSize: 14, textDecorationLine: blocked ? 'line-through' : 'none' }}>{dayNum(d)}</T>
              <Row gap={2}>{sessions ? <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isSel ? '#fff' : colors.green }} /> : null}{open ? <View style={{ width: 5, height: 5, borderRadius: 3, borderWidth: 1, borderColor: isSel ? '#fff' : colors.green }} /> : null}</Row>
            </Pressable>
          );
        })}
      </View>
      <Row gap={14} style={{ marginVertical: 10 }}><Row gap={4}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green }} /><T v="caption">Session</T></Row><Row gap={4}><View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: colors.green }} /><T v="caption">Open slot</T></Row><T v="caption">Struck-through = blocked</T></Row>
      <Agenda providerId={p.id} day={sel} />
    </Screen>
  );
}

const DECLINE = ['Not available at this time', 'Outside my service area', 'Level not suitable', 'Other'];
export function BookingRequests() {
  const p = useTeacher(); const st = useApp(); const all = useTeacherBookings(); const [decline, setDecline] = useState<string>(); const [reason, setReason] = useState(DECLINE[0]);
  if (!p) return <NeedTeacher />;
  const pending = all.filter((b) => b.status === 'pending_confirmation').sort((a, b) => a.start - b.start);
  return (
    <Screen header={<ScreenHeader title="Booking requests" />}>
      {pending.map((b) => {
        const v = bookingView(st.db, b);
        return (
          <Card key={b.id} style={{ marginBottom: 12 }}>
            <Row style={{ justifyContent: 'space-between' }}><Pill tone={v.pkg.trial ? 'info' : 'mint'} icon={v.pkg.trial ? 'sparkle' : 'card'} text={v.pkg.trial ? 'Free trial' : `Payment received · ${rm(b.pricing.total)}`} /><T v="caption">{relative(b.history[0].at, st.now)}</T></Row>
            <T v="screenTitle" style={{ marginTop: 10 }}>{v.learner.name}</T>
            <T v="bodyMuted">{v.learner.relation === 'child' ? `Child of ${v.student.name}` : 'Booking for themselves'}</T>
            <Gap h={8} />
            <KV k="Package" v={v.pkg.label} /><KV k="When" v={fmtDateTime(b.start)} /><KV k="Mode" v={modeLabel(b.mode, true)} />
            {v.address ? <KV k="Address" v={`${v.address.line1}, ${v.address.area}`} /> : null}
            {b.notes ? <KV k="Notes" v={b.notes} /> : null}
            <Row gap={10} style={{ marginTop: 12 }}>
              <SecondaryButton title="Decline" onPress={() => setDecline(b.id)} style={{ flex: 1 }} />
              <PrimaryButton title="Confirm" onPress={() => st.run((d, now) => api.teacherConfirm(d, now, b.id), 'Booking confirmed — student notified')} style={{ flex: 1.4 }} />
            </Row>
            <TextLink title="View details" onPress={() => router.push(`/t/session/${b.id}`)} />
          </Card>
        );
      })}
      {!pending.length ? <EmptyState mood="calm" title="No pending requests" body="New booking requests will appear here." /> : null}
      <ConfirmationDialog visible={!!decline} danger title="Decline this request?" body="The student receives a 100% refund." confirm="Decline" onCancel={() => setDecline(undefined)}
        onConfirm={() => { st.run((d, now) => api.cancelBooking(d, now, decline!, 'teacher', reason), 'Request declined · student refunded'); setDecline(undefined); }}>
        <Gap h={10} />{DECLINE.map((r) => <Radio key={r} selected={reason === r} label={r} onPress={() => setReason(r)} />)}
      </ConfirmationDialog>
    </Screen>
  );
}

export function TeacherSession() {
  const { id } = useLocalSearchParams<{ id: string }>(); const st = useApp(); const [cancel, setCancel] = useState(false); const [checkoutConfirm, setCheckoutConfirm] = useState(false);
  const b = st.db.bookings.find((x) => x.id === id);
  if (!b) return <Screen header={<ScreenHeader />}><EmptyState title="Session not found" /></Screen>;
  const v = bookingView(st.db, b); const w = api.checkInWindow(b);
  const thread = st.db.threads.find((t) => t.providerId === b.providerId && t.studentAccountId === b.studentAccountId);
  const canCheckIn = ['confirmed', 'in_progress'].includes(b.status) && !b.checkInTeacher && st.now >= w.opens && st.now <= w.closes;
  const canRate = (b.status === 'completed' || b.status === 'no_show_review') && !b.learnerRating;
  const earning = st.db.ledger.find((e) => e.bookingId === b.id && e.type === 'earning');
  return (
    <Screen header={<ScreenHeader title="Session" sub={b.ref} />}>
      {b.status === 'pending_confirmation' ? <><Notice tone="warn" text="This request needs your confirmation." /><Gap h={8} /><PrimaryButton title="Confirm booking" onPress={() => st.run((d, now) => api.teacherConfirm(d, now, b.id), 'Booking confirmed')} /><Gap /></> : null}
      <Card>
        <Row style={{ justifyContent: 'space-between' }}><StatusBadge status={b.status} /><T v="caption">{fmtDate(b.start)}</T></Row>
        <T v="screenTitle" style={{ marginTop: 8 }}>{v.pkg.label}</T>
        <Gap h={6} />
        <KV k="Student account" v={v.student.name} /><KV k="Learner" v={`${v.learner.name}${v.learner.relation === 'child' ? ' (child)' : ''}`} />
        <KV k="Date & time" v={`${fmtDateLong(b.start)} · ${fmtTime(b.start)}`} /><KV k="Duration" v={`${b.durationMin} min`} /><KV k="Mode" v={modeLabel(b.mode, true)} />
        {v.address ? <KV k="Address" v={`${v.address.line1}, ${v.address.line2 ?? ''} ${v.address.area}`} /> : null}
        {b.meetingNote ? <KV k="Meeting notes" v={b.meetingNote} /> : null}
        {b.notes ? <KV k="Student notes" v={b.notes} /> : null}
        {v.learner.notes ? <KV k="Learner notes" v={v.learner.notes} /> : null}
      </Card>
      <SectionHeader title="Attendance" />
      <Card>
        <KV k="Teacher check-in" v={b.checkInTeacher ? fmtTime(b.checkInTeacher) : '—'} /><KV k="Student check-in" v={b.checkInStudent ? fmtTime(b.checkInStudent) : '—'} /><KV k="Check-out" v={b.checkOut ? fmtTime(b.checkOut) : '—'} />
        <Gap h={8} />
        {canCheckIn ? <PrimaryButton title="Check In" icon="checkin" onPress={() => st.run((d, now) => api.checkIn(d, now, b.id, 'teacher'), 'Checked in · session started')} /> : null}
        {b.status === 'in_progress' ? <PrimaryButton title="Check Out & complete" icon="check" onPress={() => setCheckoutConfirm(true)} /> : null}
        {b.status === 'confirmed' && st.now < w.opens ? <T v="caption">Check-in opens {fmtDateTime(w.opens)}</T> : null}
      </Card>
      {b.status === 'completed' ? <><Gap /><Card style={{ backgroundColor: colors.mintTint, borderColor: colors.mintTint }}><T v="strong">Completed · earnings {earning ? rm(earning.amount) : '—'}</T><T v="bodyMuted">{earning?.status === 'pending' ? `Pending until ${fmtDateTime(earning.releaseAt!)} (72 h dispute window)` : earning?.status === 'held' ? 'On hold — dispute open' : 'Available for payout'}</T><TextLink title="Settlement details" onPress={() => router.push(`/t/settlement/${b.id}`)} /></Card></> : null}
      <Gap />
      <Row gap={10}>
        <SecondaryButton title="Message" icon="chat" style={{ flex: 1 }} onPress={() => thread ? router.push(`/conversation/${thread.id}`) : st.showToast('No conversation yet')} />
        <SecondaryButton title="Lesson Space" icon="doc" style={{ flex: 1 }} onPress={() => router.push(`/t/lesson-space/${b.providerId}__${b.learnerId}`)} />
      </Row>
      {canRate ? <><Gap h={10} /><SecondaryButton title="Rate learner (private)" icon="star" onPress={() => router.push(`/t/learner-rating/${b.id}`)} /></> : null}
      <SectionHeader title="Timeline" />
      <Timeline items={historyItems(b)} />
      {['pending_confirmation', 'confirmed'].includes(b.status) && b.start > st.now ? <SecondaryButton danger title="Cancel session" onPress={() => setCancel(true)} /> : null}
      <ConfirmationDialog visible={cancel} danger title="Cancel this session?" body="Teacher cancellations refund the student 100% and may affect your reliability score." confirm="Cancel session" onCancel={() => setCancel(false)}
        onConfirm={() => { st.run((d, now) => api.cancelBooking(d, now, b.id, 'teacher', 'Teacher unavailable'), 'Session cancelled · student refunded'); setCancel(false); }} />
      <ConfirmationDialog visible={checkoutConfirm} title="Complete this session?" body="Earnings move to Pending and release after the 72-hour dispute window." confirm="Check out" onCancel={() => setCheckoutConfirm(false)}
        onConfirm={() => { st.run((d, now) => api.checkOut(d, now, b.id), 'Session completed'); setCheckoutConfirm(false); }} />
    </Screen>
  );
}

export function Tasks() {
  const p = useTeacher(); const st = useApp(); const [f, setF] = useState<'pending' | 'done'>('pending'); const [edit, setEdit] = useState<{ id?: string; title: string; days: number }>();
  if (!p) return <NeedTeacher />;
  const list = st.db.tasks.filter((x) => x.providerId === p.id && (f === 'done' ? x.done : !x.done)).sort((a, b) => a.due - b.due);
  return (
    <Screen header={<ScreenHeader title="Tasks" right={<IconButton name="plus" label="Add task" onPress={() => setEdit({ title: '', days: 1 })} />} />}>
      <Segmented value={f} onChange={setF} options={[{ key: 'pending', label: 'Pending' }, { key: 'done', label: 'Completed' }]} />
      <Gap />
      {list.map((x) => (
        <Row key={x.id} gap={12} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line }}>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: x.done }} accessibilityLabel={x.title} onPress={() => st.run((db) => { const t = db.tasks.find((y) => y.id === x.id)!; t.done = !t.done; })}
            style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: x.done ? colors.green : '#B9C5BE', backgroundColor: x.done ? colors.green : '#fff', alignItems: 'center', justifyContent: 'center' }}>{x.done ? <Icon name="check" size={16} color="#fff" strokeWidth={3} /> : null}</Pressable>
          <Pressable style={{ flex: 1 }} onPress={() => setEdit({ id: x.id, title: x.title, days: Math.max(0, Math.round((x.due - st.now) / DAY)) })}>
            <T v="strong" style={{ fontSize: 14, textDecorationLine: x.done ? 'line-through' : 'none' }}>{x.title}</T>
            <T v="caption" color={!x.done && x.due < st.now ? colors.danger : colors.muted}>{!x.done && x.due < st.now ? 'Overdue · ' : 'Due '}{fmtDateTime(x.due)}</T>
          </Pressable>
          <IconButton name="trash" size={18} label="Delete task" color={colors.danger} onPress={() => st.run((db) => { db.tasks = db.tasks.filter((y) => y.id !== x.id); }, 'Task deleted')} />
        </Row>
      ))}
      {!list.length ? <EmptyState growly={false} title={f === 'done' ? 'Nothing completed yet' : 'No pending tasks'} /> : null}
      <T v="caption" style={{ marginTop: 12 }}>Tasks use isolated prototype storage.</T>
      <ConfirmationDialog visible={!!edit} title={edit?.id ? 'Edit task' : 'New task'} confirm="Save" onCancel={() => setEdit(undefined)}
        onConfirm={() => { if (!edit?.title.trim()) return st.showToast('Enter a title', 'error'); st.run((db, now) => { const due = startOfDay(now) + edit.days * DAY + 17 * HOUR; if (edit.id) Object.assign(db.tasks.find((y) => y.id === edit.id)!, { title: edit.title, due }); else db.tasks.push({ id: api.uid('tk'), providerId: p.id, title: edit.title, due, done: false }); }, 'Task saved'); setEdit(undefined); }}>
        <Gap h={10} /><FormField label="Title" value={edit?.title} onChangeText={(v) => setEdit({ ...edit!, title: v })} />
        <T v="caption">Due</T><Row gap={6} wrap style={{ marginTop: 6 }}>{[[0, 'Today'], [1, 'Tomorrow'], [3, 'In 3 days'], [7, 'Next week']].map(([d, l]) => <SkillChip key={l} label={l as string} active={edit?.days === d} onPress={() => setEdit({ ...edit!, days: d as number })} />)}</Row>
      </ConfirmationDialog>
    </Screen>
  );
}

export function Clients() {
  const p = useTeacher(); const st = useApp(); const [q, setQ] = useState('');
  if (!p) return <NeedTeacher />;
  // a learner relationship originates only from a legitimate booking
  const map = new Map<string, { learnerId: string; done: number; upcoming: number; last: number }>();
  for (const b of st.db.bookings.filter((x) => x.providerId === p.id && !['payment_failed', 'awaiting_payment', 'declined'].includes(x.status))) {
    const c = map.get(b.learnerId) ?? { learnerId: b.learnerId, done: 0, upcoming: 0, last: 0 };
    if (b.status === 'completed') c.done++; if (ACTIVE.includes(b.status)) c.upcoming++; c.last = Math.max(c.last, b.history[b.history.length - 1].at); map.set(b.learnerId, c);
  }
  const list = [...map.values()].map((c) => ({ ...c, l: st.db.learners.find((x) => x.id === c.learnerId)! })).filter((c) => !q || c.l.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.last - a.last);
  return (
    <Screen header={<View style={{ paddingHorizontal: 18, paddingTop: 8 }}><T v="h1">Clients</T></View>}>
      <Gap h={10} /><SearchField value={q} onChangeText={setQ} placeholder="Search clients" /><Gap h={8} />
      {list.map((c) => {
        const owner = st.db.accounts.find((a) => a.id === c.l.accountId)!;
        return (
          <Card key={c.learnerId} style={{ marginBottom: 10 }} onPress={() => router.push(`/t/client/${c.learnerId}`)} label={c.l.name}>
            <Row gap={12}><Avatar initials={c.l.name.split(' ').map((x) => x[0]).join('').slice(0, 2)} size={46} />
              <View style={{ flex: 1 }}><T v="strong">{c.l.name}</T><T v="bodyMuted">{c.l.relation === 'child' ? `via ${owner.name}` : 'Self learner'}</T><T v="caption">{c.done} completed · {c.upcoming} upcoming · active {relative(c.last, st.now)}</T></View>
              <Icon name="chevron-right" size={18} color={colors.muted} /></Row>
          </Card>
        );
      })}
      {!list.length ? <EmptyState mood="calm" title="No clients yet" body="Clients appear after their first booking with you." /> : null}
    </Screen>
  );
}

export function ClientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(); const p = useTeacher(); const st = useApp();
  if (!p) return <NeedTeacher />;
  const l = st.db.learners.find((x) => x.id === id)!; const owner = st.db.accounts.find((a) => a.id === l.accountId)!;
  const bookings = st.db.bookings.filter((b) => b.providerId === p.id && b.learnerId === id).sort((a, b) => b.start - a.start);
  const thread = st.db.threads.find((t) => t.providerId === p.id && t.studentAccountId === owner.id);
  const notes = st.db.materials.filter((m) => m.providerId === p.id && m.learnerId === id && m.kind === 'progress');
  return (
    <Screen header={<ScreenHeader title={l.name} sub={l.relation === 'child' ? `Managed by ${owner.name}` : 'Self learner'} />}>
      <Card>
        <KV k="Account" v={owner.name} /><KV k="Learner" v={l.name} />{l.dob ? <KV k="Date of birth" v={l.dob} /> : null}{l.notes ? <KV k="Notes from parent" v={l.notes} /> : null}
      </Card>
      <Gap />
      <Row gap={10}>
        <SecondaryButton title={`Message ${firstName(owner.name)}`} icon="chat" style={{ flex: 1 }} onPress={() => thread ? router.push(`/conversation/${thread.id}`) : st.showToast('No conversation yet')} />
        <PrimaryButton title="Lesson Space" icon="doc" style={{ flex: 1 }} onPress={() => router.push(`/t/lesson-space/${p.id}__${l.id}`)} />
      </Row>
      <SectionHeader title="Progress notes" />
      {notes.length ? notes.map((n) => <Card key={n.id} style={{ marginBottom: 8 }}><T v="body">{n.body}</T><T v="caption">{relative(n.at, st.now)}</T></Card>) : <T v="bodyMuted">No notes yet.</T>}
      <SectionHeader title="Booking history" />
      {bookings.map((b) => <SessionCard key={b.id} b={b} onPress={() => router.push(`/t/session/${b.id}`)} />)}
    </Screen>
  );
}

export function AddMaterial() {
  const { learner } = useLocalSearchParams<{ learner?: string }>(); const p = useTeacher(); const st = useApp();
  const learners = p ? [...new Set(st.db.bookings.filter((b) => b.providerId === p.id).map((b) => b.learnerId))].map((id) => st.db.learners.find((l) => l.id === id)!) : [];
  const [lid, setLid] = useState(learner ?? learners[0]?.id); const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [att, setAtt] = useState<string>(); const [kind, setKind] = useState<'material' | 'progress' | 'session_note'>('material');
  const sessions = st.db.bookings.filter((b) => b.providerId === p?.id && b.learnerId === lid && b.status === 'completed');
  const [bid, setBid] = useState<string | undefined>(sessions[0]?.id);
  if (!p) return <NeedTeacher />;
  const publish = () => {
    const l = st.db.learners.find((x) => x.id === lid)!;
    st.run((db, now) => { db.materials.unshift({ id: api.uid('mt'), providerId: p.id, learnerId: lid!, bookingId: bid, title: title || (kind === 'progress' ? 'Progress' : 'Session note'), body, attachment: att, at: now, kind });
      api.notify(db, now, l.accountId, 'student', 'updates', 'materials', 'New class material', `${p.name} added "${title || kind}" for ${l.name}.`, `/lesson-space/${p.id}__${l.id}`); }, 'Published to Lesson Space');
    router.back();
  };
  return (
    <Screen header={<ScreenHeader title="Add class material" />} footer={<PrimaryButton title="Publish" disabled={!lid || body.length < 5 || (kind === 'material' && title.length < 3)} onPress={publish} />}>
      <T v="strong" style={{ marginBottom: 8 }}>Type</T>
      <Segmented value={kind} onChange={setKind} options={[{ key: 'material', label: 'Material' }, { key: 'progress', label: 'Progress' }, { key: 'session_note', label: 'Session note' }]} />
      <Gap /><T v="strong" style={{ marginBottom: 8 }}>Target learner</T>
      <Row gap={8} wrap>{learners.map((l) => <SkillChip key={l.id} label={l.name} active={lid === l.id} onPress={() => { setLid(l.id); setBid(undefined); }} />)}</Row>
      <Gap /><T v="strong" style={{ marginBottom: 8 }}>Related completed session</T>
      <Row gap={8} wrap>{sessions.map((b) => <SkillChip key={b.id} label={fmtDate(b.start)} active={bid === b.id} onPress={() => setBid(b.id)} />)}{!sessions.length ? <T v="bodyMuted">None yet</T> : null}</Row>
      <Gap />
      {kind === 'material' ? <FormField label="Title" value={title} onChangeText={setTitle} /> : null}
      <FormField label="Content / notes" multiline value={body} onChangeText={setBody} />
      <Row gap={8}>{att ? <Pill icon="clip" text={att} /> : null}<SecondaryButton small icon="clip" title={att ? 'Replace file' : 'Attach file'} onPress={() => setAtt(`worksheet-${Date.now() % 100}.pdf`)} /></Row>
      <Gap /><Notice text="Visible only to this learner's owning Student account." />
    </Screen>
  );
}

export function LearnerRating() {
  const { id } = useLocalSearchParams<{ id: string }>(); const st = useApp(); const b = st.db.bookings.find((x) => x.id === id);
  const [r, setR] = useState({ reliability: 0, punctuality: 0, respect: 0 });
  if (!b) return <EmptyState title="Not found" />;
  const eligible = b.status === 'completed' || b.status === 'no_show_review';
  const v = bookingView(st.db, b);
  return (
    <Screen header={<ScreenHeader title="Private learner rating" />} footer={<PrimaryButton title="Save privately" disabled={!eligible || !r.reliability || !r.punctuality || !r.respect} onPress={() => { st.run((db) => { db.bookings.find((x) => x.id === b.id)!.learnerRating = r; }, 'Saved privately'); router.back(); }} />}>
      <Notice icon="lock" text="Private ratings are never shown publicly. They help Growlink keep the community reliable." />
      <Gap /><T v="strong">{v.learner.name} · {fmtDateTime(b.start)}</T>
      {!eligible ? <><Gap /><Notice tone="warn" text="Available after completion or a student no-show." /></> : (['reliability', 'punctuality', 'respect'] as const).map((k) => <View key={k} style={{ marginTop: 18 }}><T v="strong" style={{ marginBottom: 8, textTransform: 'capitalize' }}>{k}</T><Stars value={r[k]} onChange={(n) => setR({ ...r, [k]: n })} size={30} /></View>)}
    </Screen>
  );
}
export { FilterChip, ScrollView };
