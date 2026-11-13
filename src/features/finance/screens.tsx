import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/theme/tokens';
import { Card, ConfirmationDialog, DemoLabel, EmptyState, FilterChip, FormField, Gap, KV, ListRow, Notice, Pill, PrimaryButton, Row, Screen, ScreenHeader, SecondaryButton, SectionHeader, T, TextLink, Timeline } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { WalletSummary } from '@/components/cards';
import { useApp } from '@/store/useApp';
import * as api from '@/mocks/services/api';
import { POLICY, PRICING } from '@/mocks/services/config';
import { fmtDateTime, fmtShort, rm } from '@/lib/time';
import { bookingView } from '@/hooks/lookup';
import { NeedTeacher, useTeacher } from '../teacher/onboarding';
import type { LedgerEntry } from '@/mocks/types';

const ENTRY: Record<string, { label: string; tone: 'mint' | 'warn' | 'danger' | 'info' | 'soft' }> = {
  pending: { label: 'Pending', tone: 'warn' }, available: { label: 'Released', tone: 'mint' }, held: { label: 'Dispute hold', tone: 'danger' }, reversed: { label: 'Refunded', tone: 'soft' },
  requested: { label: 'Requested', tone: 'info' }, processing: { label: 'Processing', tone: 'info' }, paid: { label: 'Paid', tone: 'mint' }, failed: { label: 'Failed · returned', tone: 'danger' }, under_review: { label: 'Under review', tone: 'warn' },
};
function LedgerRow({ e }: { e: LedgerEntry }) {
  const db = useApp((s) => s.db); const b = db.bookings.find((x) => x.id === e.bookingId);
  const title = e.type === 'payout' ? 'Payout' : e.type === 'refund_adjustment' ? 'Refund adjustment' : b ? `${bookingView(db, b).learner.name} · ${b.ref}` : e.note ?? 'Earnings';
  const sign = e.type === 'payout' || e.amount < 0 ? '−' : '+';
  const s = ENTRY[e.status];
  return (
    <Pressable accessibilityRole="button" disabled={!b} onPress={() => b && router.push(`/t/settlement/${b.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line }}>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}><Icon name={e.type === 'payout' ? 'bank' : e.type === 'refund_adjustment' ? 'refresh' : 'wallet'} size={18} /></View>
      <View style={{ flex: 1 }}><T v="strong" style={{ fontSize: 14 }} numberOfLines={1}>{title}</T><T v="caption">{fmtShort(e.at)} · {e.type.replace('_', ' ')}</T></View>
      <View style={{ alignItems: 'flex-end', gap: 3 }}><T v="price" style={{ fontSize: 14.5 }} color={e.status === 'failed' || e.status === 'reversed' ? colors.muted : colors.ink}>{sign}{rm(Math.abs(e.amount))}</T><Pill tone={s.tone} text={s.label} /></View>
    </Pressable>
  );
}

export function FinanceHome() {
  const p = useTeacher(); const st = useApp();
  if (!p) return <NeedTeacher />;
  const entries = st.db.ledger.filter((e) => e.providerId === p.id).sort((a, b) => b.at - a.at);
  const holds = entries.filter((e) => e.status === 'held'); const refunds = entries.filter((e) => e.type === 'refund_adjustment' || e.status === 'reversed');
  return (
    <Screen header={<View style={{ paddingHorizontal: 18, paddingTop: 8 }}><T v="h1">Finance</T></View>}>
      <Gap h={10} />
      <WalletSummary providerId={p.id} />
      <Gap />
      {p.payoutOnboarding !== 'complete' ? <><Notice tone="warn" icon="bank" text="Payout onboarding incomplete — finish it to withdraw funds." /><Gap h={8} /></> : null}
      <Row gap={10}>
        <PrimaryButton title="Request Payout" icon="bank" style={{ flex: 1.3 }} onPress={() => router.push(p.payoutOnboarding === 'complete' ? '/t/payout' : '/t/payout-onboarding')} />
        <SecondaryButton title="History" style={{ flex: 1 }} onPress={() => router.push('/t/payout-history')} />
      </Row>
      {holds.length ? <><SectionHeader title="Dispute holds" />{holds.map((e) => <LedgerRow key={e.id} e={e} />)}</> : null}
      {refunds.length ? <><SectionHeader title="Refund adjustments" />{refunds.map((e) => <LedgerRow key={e.id} e={e} />)}</> : null}
      <SectionHeader title="Recent earnings" action="All transactions" onAction={() => router.push('/t/ledger')} />
      {entries.filter((e) => e.type === 'earning').slice(0, 5).map((e) => <LedgerRow key={e.id} e={e} />)}
      <Gap />
      <Card style={{ backgroundColor: colors.soft, borderColor: colors.soft }}><T v="caption">How settlement works</T><T v="body">Earnings = package price − {PRICING.teacherCommissionRate * 100}% platform commission + any transport fee. They stay Pending for {POLICY.disputeWindowHours} h after check-out, then become Available. Wallet totals are derived from ledger entries.</T></Card>
    </Screen>
  );
}

export function Ledger() {
  const p = useTeacher(); const st = useApp(); const [f, setF] = useState<'all' | 'earning' | 'payout' | 'refund'>('all');
  if (!p) return <NeedTeacher />;
  const entries = st.db.ledger.filter((e) => e.providerId === p.id && (f === 'all' || (f === 'refund' ? e.type === 'refund_adjustment' || e.status === 'reversed' : e.type === f))).sort((a, b) => b.at - a.at);
  return (
    <Screen header={<ScreenHeader title="Transactions" />}>
      <Row gap={8} wrap>{(['all', 'earning', 'payout', 'refund'] as const).map((k) => <FilterChip key={k} label={k[0].toUpperCase() + k.slice(1)} active={f === k} onPress={() => setF(k)} />)}</Row>
      <Gap h={6} />
      {entries.map((e) => <LedgerRow key={e.id} e={e} />)}
      {!entries.length ? <EmptyState growly={false} title="No transactions" /> : null}
    </Screen>
  );
}

export function PayoutOnboarding() {
  const p = useTeacher(); const st = useApp();
  if (!p) return <NeedTeacher />;
  const done = p.payoutOnboarding === 'complete';
  return (
    <Screen header={<ScreenHeader title="Payout onboarding" />} footer={<>{!done ? <PrimaryButton title="Complete Demo Onboarding" onPress={() => st.run((db) => { db.providers.find((x) => x.id === p.id)!.payoutOnboarding = 'complete'; }, 'Payout account connected (demo)')} /> : null}<SecondaryButton title="Return to Finance" onPress={() => router.replace('/teacher/finance')} /></>}>
      <DemoLabel text="DEMO ONLY · simulated payment-provider onboarding" />
      <Gap />
      <Card><Row style={{ justifyContent: 'space-between' }}><T v="strong">Status</T><Pill tone={done ? 'mint' : 'warn'} icon={done ? 'check' : 'clock'} text={done ? 'Complete' : p.payoutOnboarding === 'incomplete' ? 'Incomplete' : 'Not started'} /></Row></Card>
      <SectionHeader title="Requirements" />
      {['Identity verification (MyKad / passport)', 'Malaysian bank account in your name', 'Tax residency declaration'].map((r) => <ListRow key={r} icon={done ? 'check' : 'square'} label={r} />)}
      <Gap /><Notice icon="lock" text="In production these steps happen on the payment provider's secure pages. Growlink never collects identity documents or bank credentials in the app." />
      {done ? <><Gap /><Card><KV k="Payout account" v="Maybank •• 8812" /><KV k="Schedule" v={`On request · ~${POLICY.payoutBusinessDays} business days`} /></Card></> : null}
    </Screen>
  );
}

export function RequestPayout() {
  const p = useTeacher(); const st = useApp(); const [amt, setAmt] = useState(''); const [confirm, setConfirm] = useState(false); const [done, setDone] = useState(false);
  if (!p) return <NeedTeacher />;
  const w = api.wallet(st.db.ledger, p.id); const n = parseFloat(amt);
  const err = !amt ? undefined : isNaN(n) ? 'Enter an amount' : n < POLICY.payoutMinimum ? `Minimum RM ${POLICY.payoutMinimum}` : n > w.available ? 'More than your available balance' : undefined;
  if (done) return <Screen header={<ScreenHeader back={false} title="Payout requested" />} footer={<PrimaryButton title="View payout history" onPress={() => router.replace('/t/payout-history')} />}><EmptyState growly={false} title={`${rm(n)} is on its way`} body={`Expected in about ${POLICY.payoutBusinessDays} business days to Maybank •• 8812.`} /></Screen>;
  return (
    <Screen header={<ScreenHeader title="Request payout" />} footer={<PrimaryButton title="Review request" disabled={!!err || !amt} onPress={() => setConfirm(true)} />}>
      <Card><T v="caption">Available to withdraw</T><T v="money">{rm(w.available)}</T><T v="caption">Pending {rm(w.pending)} is not withdrawable yet.</T></Card>
      <Gap />
      <FormField label="Amount (MYR)" keyboardType="decimal-pad" value={amt} onChangeText={setAmt} error={err} hint={`Minimum RM ${POLICY.payoutMinimum}`} right={<TextLink title="Max" onPress={() => setAmt(String(w.available))} />} />
      <Row gap={8} wrap>{[50, 100, 200].filter((x) => x <= w.available).map((x) => <FilterChip key={x} label={`RM ${x}`} active={n === x} onPress={() => setAmt(String(x))} />)}</Row>
      <Gap /><Card><KV k="To" v="Maybank •• 8812" /><KV k="Processing estimate" v={`T+${POLICY.payoutBusinessDays} business days`} /><KV k="Fee" v="RM 0.00" /></Card>
      <ConfirmationDialog visible={confirm} title={`Withdraw ${rm(n || 0)}?`} body="Funds are deducted from Available immediately. If the payout fails, they're returned." confirm="Confirm request" onCancel={() => setConfirm(false)}
        onConfirm={() => { const r = st.run((db, now) => api.requestPayout(db, now, p.id, n)); setConfirm(false); if (r.ok) setDone(true); }} />
    </Screen>
  );
}

export function PayoutHistory() {
  const p = useTeacher(); const st = useApp();
  if (!p) return <NeedTeacher />;
  const list = st.db.ledger.filter((e) => e.providerId === p.id && e.type === 'payout').sort((a, b) => b.at - a.at);
  return (
    <Screen header={<ScreenHeader title="Payout history" />}>
      {list.map((e) => (
        <Card key={e.id} style={{ marginBottom: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}><T v="price">{rm(e.amount)}</T><Pill tone={ENTRY[e.status].tone} text={ENTRY[e.status].label} /></Row>
          <T v="caption">{fmtDateTime(e.at)} · {e.note}</T>
          <Gap h={8} />
          <Timeline items={[{ label: 'Requested', done: true }, { label: 'Processing', done: e.status !== 'requested', current: e.status === 'processing' }, e.status === 'failed' ? { label: 'Failed — funds returned to Available', done: false, current: true } : e.status === 'under_review' ? { label: 'Under review', done: false, current: true } : { label: 'Paid', done: e.status === 'paid' }]} />
        </Card>
      ))}
      {!list.length ? <EmptyState growly={false} title="No payouts yet" /> : null}
    </Screen>
  );
}

export function Settlement() {
  const { id } = useLocalSearchParams<{ id: string }>(); const st = useApp(); const b = st.db.bookings.find((x) => x.id === id);
  if (!b) return <EmptyState title="Not found" />;
  const v = bookingView(st.db, b); const e = st.db.ledger.find((x) => x.bookingId === b.id && x.type === 'earning');
  const disputed = e?.status === 'held';
  return (
    <Screen header={<ScreenHeader title="Settlement" sub={b.ref} />}>
      <Card><T v="strong">{v.learner.name} · {v.pkg.label}</T><T v="bodyMuted">{fmtDateTime(b.start)}</T><Gap h={8} />
        <KV k="Package price" v={rm(b.pricing.base)} /><KV k={`Commission (${PRICING.teacherCommissionRate * 100}%)`} v={`−${rm(b.pricing.base * PRICING.teacherCommissionRate)}`} />{b.pricing.transport ? <KV k="Transport fee" v={`+${rm(b.pricing.transport)}`} /> : null}<KV k="Your earnings" v={<T v="price">{e ? rm(e.amount) : '—'}</T>} />
      </Card>
      <SectionHeader title="Lifecycle" />
      <Timeline items={[
        { label: 'Session completed', at: b.completedAt ? fmtDateTime(b.completedAt) : undefined, done: !!b.completedAt },
        { label: 'Earnings pending', note: `${POLICY.disputeWindowHours}-hour dispute window`, done: !!e, current: e?.status === 'pending' },
        disputed ? { label: 'Dispute open — release frozen', done: false, current: true } : { label: 'Available', at: e?.releaseAt ? `from ${fmtDateTime(e.releaseAt)}` : undefined, done: e?.status === 'available' },
        { label: 'Payout', note: 'Request any time from Finance (min RM50)', done: false },
      ]} />
      {disputed ? <Notice tone="danger" text="An open dispute prevents release. Funds stay on hold until Growlink support resolves the case." /> : null}
    </Screen>
  );
}
