import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, elevation } from '@/theme/tokens';
import { Card, DemoLabel, Gap, ListRow, Notice, Row, Screen, ScreenHeader, SecondaryButton, SectionHeader, SkillChip, T, Toggle } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { useApp } from '@/store/useApp';
import * as api from '@/mocks/services/api';
import { fmtDateTime, HOUR, MIN, DAY } from '@/lib/time';

/** Discreet developer entry: a small tab on the right edge. Not part of the product UI. */
export function LabFab() {
  const authed = useApp((s) => s.authed); const path = usePathname(); const insets = useSafeAreaInsets();
  if (!authed || path === '/lab') return null;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Open Prototype Lab (developer)" onPress={() => router.push('/lab')} style={[f.fab, { top: insets.top + 150 }]}>
      <Icon name="flask" size={12} color="#fff" />
    </Pressable>
  );
}
const f = StyleSheet.create({ fab: { position: 'absolute', right: 0, width: 20, height: 34, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, backgroundColor: 'rgba(16,37,27,0.35)', alignItems: 'center', justifyContent: 'center', zIndex: 900, ...elevation } });

const SCREENS: [string, [string, string][]][] = [
  ['Entry', [['A01 Welcome', '/welcome'], ['A02 Language', '/language'], ['A03 Sign in', '/sign-in'], ['A04 Register', '/register'], ['A05 Role', '/role'], ['A06 Verify', '/verify'], ['A07 Recovery', '/recover'], ['A08 Account setup', '/account-setup'], ['A09 Location permission', '/location-permission']]],
  ['Student discovery', [['B01–B05 Map Home', '/student'], ['B06 Search', '/search'], ['B07 Categories', '/categories'], ['B08 Filters', '/filters'], ['B09 Location', '/location'], ['C01 Provider: Mei Ling', '/provider/p_meiling'], ['D04 Posts', '/posts/p_meiling']]],
  ['Booking', [['C11 My Bookings', '/student/bookings'], ['C12 Booking details (upcoming)', '/booking/b3'], ['C15 Session completed', '/booking/b4'], ['C13 Cancel', '/booking/cancel/b3'], ['C16 Review', '/booking/review/b4'], ['C17 Lesson Space', '/lesson-space/p_ravi__l_amira'], ['C18 Open dispute', '/booking/dispute/b4'], ['C20 Refund', '/refund/b2']]],
  ['Student account', [['D01 Messages', '/student/messages'], ['D02 Conversation', '/conversation/t_weijie'], ['D03 Activity', '/notifications'], ['D05 Profile', '/student/profile'], ['D06 Learners', '/learners'], ['D08 Addresses', '/addresses'], ['D10 Payment methods', '/payment-methods'], ['D11 Saved', '/saved'], ['D12 Settings', '/settings'], ['D13 Help', '/help'], ['D14 Report', '/report?target=provider&id=p_daniel'], ['D16 Delete account', '/delete-account']]],
  ['Teacher (switch to Mei Ling first)', [['E01 Setup', '/t/setup'], ['E02 Profile editor', '/t/profile-edit'], ['E03 Services', '/t/services'], ['E06 Availability', '/t/availability'], ['E07 Submit', '/t/submit'], ['E08 Approval', '/t/approval'], ['E09 Teacher Home', '/teacher'], ['E10 My Desk', '/teacher/desk'], ['E11 Requests', '/t/requests'], ['E12 Session', '/t/session/b5'], ['E13 Tasks', '/t/tasks'], ['E14 Calendar', '/t/calendar'], ['F01 Clients', '/teacher/clients'], ['F02 Client', '/t/client/l_ethan'], ['F03 Lesson Space', '/t/lesson-space/p_meiling__l_ethan'], ['G01 Finance', '/teacher/finance'], ['G02 Ledger', '/t/ledger'], ['G03 Payout onboarding', '/t/payout-onboarding'], ['G04 Request payout', '/t/payout'], ['G05 Payout history', '/t/payout-history'], ['G06 Settlement', '/t/settlement/b8'], ['H01 Teacher profile', '/teacher/profile'], ['H03 Posts', '/t/posts'], ['H05 Reviews', '/t/reviews'], ['H06 Growth', '/t/growth'], ['H07 Messages', '/t/messages']]],
];

export default function Lab() {
  const st = useApp(); const db = st.db;
  const act = (accountId: string, role: 'student' | 'teacher') => { st.signIn(accountId, role); router.replace(role === 'teacher' ? '/teacher' : '/student'); };
  const mine = db.bookings.filter((b) => b.studentAccountId === st.accountId).sort((a, b) => b.history[0].at - a.history[0].at);
  const focus = mine.find((b) => b.providerId === 'p_meiling') ?? mine[0];
  const myProvider = db.accounts.find((a) => a.id === st.accountId)?.providerId;
  const next = db.bookings.filter((b) => ['confirmed', 'pending_confirmation'].includes(b.status) && b.start > st.now && (b.studentAccountId === st.accountId || b.providerId === myProvider)).sort((a, b) => a.start - b.start)[0];
  const forceStatus = (to: string) => {
    if (!focus) return st.showToast('No booking to change', 'error');
    st.run((d, now) => {
      const b = d.bookings.find((x) => x.id === focus.id)!;
      if (to === 'pending' && b.status === 'awaiting_payment') api.pay(d, now, b.id, true, 'Visa •• 4242');
      if (to === 'confirmed') { if (b.status === 'awaiting_payment') api.pay(d, now, b.id, true, 'Visa •• 4242'); if (b.status === 'pending_confirmation') api.teacherConfirm(d, now, b.id); }
      if (to === 'completed') {
        if (b.status === 'awaiting_payment') api.pay(d, now, b.id, true, 'Visa •• 4242');
        if (b.status === 'pending_confirmation') api.teacherConfirm(d, now, b.id);
        if (b.status === 'confirmed') { b.checkInStudent = b.start - 2 * MIN; b.checkInTeacher = b.start - 5 * MIN; b.status = 'in_progress'; b.history.push({ status: 'in_progress', at: b.start }); }
        if (b.status === 'in_progress') { const t = Math.max(now, b.start + b.durationMin * MIN); api.checkOut(d, t, b.id); }
      }
      if (to === 'cancelled') api.cancelBooking(d, now, b.id, 'student', 'Demo cancellation');
      if (to === 'disputed') api.openDispute(d, Math.max(now, b.completedAt ?? now), b.id, 'Session not as described', 'Demo dispute opened from Prototype Lab.', []);
    }, `Booking ${focus.ref} → ${to}`);
  };
  return (
    <Screen header={<ScreenHeader title="Prototype Lab" sub="Developer tools · not part of the product" />}>
      <DemoLabel text="DEMO ONLY · ALL CONTROLS BELOW ARE SIMULATIONS" />
      <Gap h={8} />
      <Card><T v="caption">Demo clock (Malaysia time)</T><T v="screenTitle">{fmtDateTime(st.now)}</T><T v="caption">Signed in as {db.accounts.find((a) => a.id === st.accountId)?.name} · {st.role}</T></Card>

      <SectionHeader title="Role & account" />
      <Row gap={8} wrap>
        <SkillChip label="Aisyah · Student" active={st.accountId === 'acc_aisyah' && st.role === 'student'} onPress={() => act('acc_aisyah', 'student')} />
        <SkillChip label="Mei Ling · Teacher" active={st.accountId === 'acc_meiling'} onPress={() => act('acc_meiling', 'teacher')} />
        <SkillChip label="Hakim · Teacher (pending)" active={st.accountId === 'acc_hakim'} onPress={() => act('acc_hakim', 'teacher')} />
        <SkillChip label="Michelle · Student" active={st.accountId === 'acc_tan'} onPress={() => act('acc_tan', 'student')} />
        <SkillChip label="Haziq · Student" active={st.accountId === 'acc_haziq'} onPress={() => act('acc_haziq', 'student')} />
      </Row>
      <T v="caption" style={{ marginTop: 6 }}>Default learner for new bookings</T>
      <Row gap={8} wrap style={{ marginTop: 6 }}>{db.learners.filter((l) => l.accountId === st.accountId).map((l) => <SkillChip key={l.id} label={l.name} active={(st.defaultLearnerId ?? db.learners.find((x) => x.accountId === st.accountId && x.relation === 'self')?.id) === l.id} onPress={() => st.set({ defaultLearnerId: l.id })} />)}</Row>

      <SectionHeader title="Discovery" />
      <Card pad={8}><View style={{ paddingHorizontal: 6 }}>
        <Toggle label="Location permission granted" value={st.locationPermission === 'granted'} onChange={(v) => st.set({ locationPermission: v ? 'granted' : 'denied' })} />
        <Toggle label="Nearby providers empty" value={st.demo.emptyNearby} onChange={(v) => st.set({ demo: { ...st.demo, emptyNearby: v } })} />
        <Toggle label="Simulate network failure" value={st.demo.networkFail} onChange={(v) => st.set({ demo: { ...st.demo, networkFail: v } })} />
        <Toggle label="Online filter" value={st.filters.online} onChange={(v) => st.setFilters({ online: v })} />
        <Toggle label="Reduce motion (marker)" value={st.demo.reduceMotion} onChange={(v) => st.set({ demo: { ...st.demo, reduceMotion: v } })} />
      </View></Card>

      <SectionHeader title={`Booking state${focus ? ` · ${focus.ref}` : ''}`} />
      {focus ? <T v="caption" style={{ marginBottom: 6 }}>Target: latest booking of this student{focus.providerId === 'p_meiling' ? ' with Mei Ling' : ''} · now {focus.status}</T> : <Notice text="Sign in as a student with a booking." />}
      <Row gap={8} wrap>{['pending', 'confirmed', 'completed', 'cancelled', 'disputed'].map((s) => <SkillChip key={s} label={s} onPress={() => forceStatus(s)} />)}</Row>
      <Gap h={8} />
      <Toggle label="Next payment fails" value={st.demo.nextPaymentFails} onChange={(v) => st.set({ demo: { ...st.demo, nextPaymentFails: v } })} />
      <Row gap={8} wrap>
        <SecondaryButton small title="Add upcoming booking" onPress={() => st.run((d, now) => { const s = api.nextOpen(d, 'p_farah', now)!; const k = api.providerPackages(d, 'p_farah').find((x) => !x.trial)!; const b = api.createBooking(d, now, 'acc_aisyah', { providerId: 'p_farah', packageId: k.id, serviceId: k.serviceId, learnerId: 'l_aisyah', mode: 'provider', slotId: s.id }); api.pay(d, now, b.id, true, 'Visa •• 4242'); api.teacherConfirm(d, now, b.id); }, 'Confirmed yoga booking added')} />
        <SecondaryButton small danger title="Remove all bookings" onPress={() => st.run((d) => { d.bookings.filter((b) => b.studentAccountId === st.accountId).forEach((b) => { const sl = d.slots.find((x) => x.id === b.slotId); if (sl && sl.start > st.now) { sl.state = 'open'; sl.bookingId = undefined; } }); d.bookings = d.bookings.filter((b) => b.studentAccountId !== st.accountId); }, 'Bookings removed (demo)')} />
      </Row>
      {db.disputes.some((d) => d.status !== 'resolved') ? <Row gap={8} wrap style={{ marginTop: 8 }}>
        <SecondaryButton small title="Resolve dispute · refund 100%" onPress={() => st.run((d, now) => api.resolveDispute(d, now, d.disputes.find((x) => x.status !== 'resolved')!.id, 100), 'Dispute resolved')} />
        <SecondaryButton small title="Resolve · no refund" onPress={() => st.run((d, now) => api.resolveDispute(d, now, d.disputes.find((x) => x.status !== 'resolved')!.id, 0), 'Dispute resolved')} />
      </Row> : null}

      <SectionHeader title="Teacher" />
      <Row gap={8} wrap>
        <SecondaryButton small title="Approve Hakim" onPress={() => st.run((d, now) => api.setApproval(d, now, 'p_hakim', 'approved'), 'Hakim approved — now discoverable')} />
        {myProvider ? <SecondaryButton small title="Approve me" onPress={() => st.run((d, now) => api.setApproval(d, now, myProvider, 'approved'), 'Approved')} /> : null}
        <SecondaryButton small title="Fail latest payout" onPress={() => st.run((d, now) => api.failLatestPayout(d, now, myProvider ?? 'p_meiling'), 'Payout failed · funds returned')} />
        <SecondaryButton small title="Payout onboarding incomplete" onPress={() => st.run((d) => { d.providers.find((p) => p.id === (myProvider ?? 'p_meiling'))!.payoutOnboarding = 'incomplete'; }, 'Onboarding set to incomplete')} />
      </Row>

      <SectionHeader title="Demo clock" />
      <Row gap={8} wrap>
        <SkillChip label="+1 hour" onPress={() => st.advance(HOUR)} />
        <SkillChip label="+1 day" onPress={() => st.advance(DAY)} />
        <SkillChip label="+73 h (past dispute window)" onPress={() => st.advance(73 * HOUR)} />
        {next ? <SkillChip label={`Jump to 10 min before next (${next.ref})`} onPress={() => st.setNow(next.start - 10 * MIN)} /> : null}
        {focus && focus.start > st.now && focus.id !== next?.id ? <SkillChip label={`Jump to 10 min before ${focus.ref}`} onPress={() => st.setNow(focus.start - 10 * MIN)} /> : null}
        {(() => { const tb = db.bookings.filter((b) => b.providerId === 'p_meiling' && b.studentAccountId === 'acc_aisyah' && b.start > st.now).sort((a, b) => a.start - b.start)[0];
          return tb && tb.id !== focus?.id ? <SkillChip label={`Jump to 10 min before Aisyah × Mei Ling (${tb.ref})`} onPress={() => st.setNow(tb.start - 10 * MIN)} /> : null; })()}
      </Row>

      <SectionHeader title="Reset" />
      <SecondaryButton danger title="Reset all mock data" icon="refresh" onPress={() => { st.reset(); st.showToast('Mock data reset'); router.replace('/student'); }} />

      <SectionHeader title="Screen directory" />
      {SCREENS.map(([g, items]) => (
        <View key={g} style={{ marginBottom: 12 }}>
          <T v="caption" style={{ marginBottom: 4 }}>{g.toUpperCase()}</T>
          <Card pad={0}>{items.map(([l, h], i) => <ListRow key={h} label={l} sub={h} onPress={() => router.push(h as never)} last={i === items.length - 1} />)}</Card>
        </View>
      ))}
      <Notice text="Demo journey: Home → Music → Mei Ling → Regular 60-min → Wed 18 Nov 10:30 → Pay → switch to Mei Ling → Requests → Confirm → switch back → jump clock → Check In → Mei Ling checks out → review → +73 h → payout." />
      <Gap h={4} />
      <T v="caption" color={colors.muted}>Teacher journey shortcut: use “Mei Ling · Teacher” above.</T>
    </Screen>
  );
}
