import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/theme/tokens';
import { Avatar, Card, DemoLabel, Divider, EmptyState, FormField, Gap, GrowlyIllustration, KV, Notice, Pill, PrimaryButton, Radio, Rating, Row, Screen, ScreenHeader, SecondaryButton, SectionHeader, T, TextLink, Timeline } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { DateSelector, ModeSelector, PriceBreakdown, TimeSlotSelector } from '@/components/cards';
import { useAccount, useApp } from '@/store/useApp';
import * as api from '@/mocks/services/api';
import { POLICY } from '@/mocks/services/config';
import { fmtDateLong, fmtDateTime, fmtTime, rm, sameDay, startOfDay } from '@/lib/time';
import { firstName } from '@/lib/time';
import { bookingView, modeLabel } from '@/hooks/lookup';
import { useT } from '@/i18n';

function useDraft() {
  const draft = useApp((s) => s.draft); const db = useApp((s) => s.db);
  const p = draft ? db.providers.find((x) => x.id === draft.providerId) : undefined;
  const pkg = db.packages.find((k) => k.id === draft?.packageId);
  const svc = db.services.find((s) => s.id === (draft?.serviceId ?? pkg?.serviceId));
  return { draft, p, pkg, svc, update: (d: Partial<api.Draft>) => useApp.getState().set({ draft: { ...useApp.getState().draft!, ...d } }) };
}
function Step({ n, title }: { n: number; title: string }) {
  const { p } = useDraft();
  return (
    <View>
      <ScreenHeader title={title} sub={`Step ${n} of 5`} />
      <View style={{ height: 3, backgroundColor: colors.line, marginHorizontal: 18 }}><View style={{ width: `${(n / 5) * 100}%`, height: 3, backgroundColor: colors.green }} /></View>
      {p ? <Row gap={12} style={{ paddingHorizontal: 18, paddingVertical: 12 }}>
        <Avatar photo={p.photo} initials={p.initials} size={52} rounded="tile" />
        <View style={{ flex: 1 }}><T v="strong" style={{ fontSize: 16 }}>{p.name}</T><T v="bodyMuted">{p.headline}</T></View>
        <View style={{ backgroundColor: colors.soft, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}><Rating rating={p.rating} /></View>
      </Row> : null}
    </View>
  );
}

export function PackageSelect() {
  const { draft, p, update } = useDraft(); const db = useApp((s) => s.db);
  if (!draft || !p) return <Redirect href="/student" />;
  const services = api.servicesOf(db, p.id);
  const learnerIds = db.learners.filter((l) => l.accountId === useApp.getState().accountId).map((l) => l.id);
  const trialAvailable = learnerIds.some((l) => !api.trialUsed(db, l, p.id));
  return (
    <Screen header={<Step n={1} title="Choose a package" />} footer={<PrimaryButton title="Continue" disabled={!draft.packageId} onPress={() => router.push('/book/learner')} />}>
      {services.map((s) => (
        <View key={s.id}>
          <SectionHeader title={s.title} style={{ marginTop: 6 }} />
          <T v="bodyMuted" style={{ marginBottom: 10 }}>{s.description}</T>
          {api.packagesOf(db, s.id).map((k) => {
            const disabled = k.trial && !trialAvailable;
            return (
              <Radio key={k.id} selected={draft.packageId === k.id} onPress={() => !disabled && update({ serviceId: s.id, packageId: k.id, mode: s.modes.length === 1 ? s.modes[0] : undefined })}
                label={`${k.label}${disabled ? ' · used' : ''}`} sub={`${k.durationMin} min · ${s.modes.map((m) => modeLabel(m)).join(' / ')}\n${k.description}`}
                right={<View style={{ alignItems: 'flex-end' }}><T v="price">{k.trial ? 'RM 0' : `RM ${k.price}`}</T>{k.trial ? <Pill tone="mint" text="Free trial" /> : null}</View>} />
            );
          })}
        </View>
      ))}
      <Notice tone="mint" text="Trial lessons are always free (RM 0). One trial per learner with each teacher." />
    </Screen>
  );
}

export function LearnerSelect() {
  const { draft, p, pkg, update } = useDraft(); const db = useApp((s) => s.db); const acc = useAccount();
  const learners = db.learners.filter((l) => l.accountId === acc.id);
  const preferred = useApp((s) => s.defaultLearnerId);
  useEffect(() => { if (draft && !draft.learnerId) update({ learnerId: learners.find((l) => l.id === preferred)?.id ?? learners.find((l) => l.relation === 'self')?.id }); }, []);
  if (!draft || !p || !pkg) return <Redirect href="/student" />;
  return (
    <Screen header={<Step n={2} title="Who is this for?" />} footer={<PrimaryButton title="Continue" disabled={!draft.learnerId || (pkg.trial && api.trialUsed(db, draft.learnerId, p.id))} onPress={() => router.push('/book/mode')} />}>
      {learners.map((l) => {
        const used = pkg.trial && api.trialUsed(db, l.id, p.id);
        return <Radio key={l.id} icon={l.relation === 'self' ? 'user' : 'users'} selected={draft.learnerId === l.id} label={l.relation === 'self' ? `Myself (${firstName(l.name)})` : l.name}
          sub={used ? 'Free trial already used with this teacher' : l.relation === 'child' ? 'Child profile · you manage messages and bookings' : 'Booking for myself'} onPress={() => update({ learnerId: l.id })} />;
      })}
      <SecondaryButton title="Add learner" icon="plus" onPress={() => router.push('/learner-edit')} />
      <Gap />
      <Notice text="Children don't have their own login. You communicate with the teacher on their behalf." />
    </Screen>
  );
}

export function ModeSelect() {
  const { draft, svc, pkg, update } = useDraft(); const db = useApp((s) => s.db); const acc = useAccount();
  const addresses = db.addresses.filter((a) => a.accountId === acc.id);
  useEffect(() => { if (draft?.mode === 'student' && !draft.addressId) update({ addressId: addresses.find((a) => a.isDefault)?.id }); }, [draft?.mode]);
  if (!draft || !svc || !pkg) return <Redirect href="/student" />;
  const ok = !!draft.mode && (draft.mode !== 'student' || !!draft.addressId);
  const q = draft.mode ? api.quote(db, pkg.id, draft.mode, draft.addressId) : undefined;
  const p = db.providers.find((x) => x.id === svc.providerId)!;
  return (
    <Screen header={<Step n={3} title="Lesson mode & location" />} footer={<PrimaryButton title="Continue" disabled={!ok} onPress={() => router.push('/book/datetime')} />}>
      <T v="strong" style={{ marginBottom: 10 }}>Lesson Mode</T>
      <ModeSelector modes={svc.modes} value={draft.mode} onChange={(m) => update({ mode: m })} />
      {draft.mode === 'provider' ? <><Gap /><Card><T v="caption">Meeting location</T><T v="strong">{firstName(p.name)}'s studio · {p.area}</T><T v="bodyMuted">Full address is shared after the teacher confirms.</T></Card></> : null}
      {draft.mode === 'online' ? <><Gap /><Notice text="You'll receive a meeting link in the booking once it's confirmed. (In-app video is not part of this release.)" /></> : null}
      {draft.mode === 'student' ? (
        <>
          <SectionHeader title="Session address" />
          {addresses.map((a) => <Radio key={a.id} icon="pin" selected={draft.addressId === a.id} label={a.label} sub={`${a.line1}, ${a.area}`} onPress={() => update({ addressId: a.id })} />)}
          <SecondaryButton icon="plus" title="Add Address" onPress={() => router.push('/address-edit')} />
          <Gap />
          <FormField label="Meeting notes (optional)" value={draft.meetingNote} onChangeText={(v) => update({ meetingNote: v })} placeholder="e.g. Block B, guard house will call up" />
          {q?.transport ? <Notice tone="info" text={`Transport fee ${rm(q.transport)} — ${q.lines.find((l) => l.label === 'Transport fee')?.note}`} /> : null}
        </>
      ) : null}
    </Screen>
  );
}

export function DateTimeSelect() {
  const { draft, p, update } = useDraft(); const db = useApp((s) => s.db); const now = useApp((s) => s.now);
  const all = p ? db.slots.filter((s) => s.providerId === p.id && s.start > now - 86400000).sort((a, b) => a.start - b.start) : [];
  const firstOpen = all.find((s) => s.state === 'open' && s.start > now);
  const selSlot = db.slots.find((s) => s.id === draft?.slotId);
  const [day, setDay] = useState(startOfDay(selSlot?.start ?? firstOpen?.start ?? now));
  if (!draft || !p) return <Redirect href="/student" />;
  const daySlots = all.filter((s) => sameDay(s.start, day));
  return (
    <Screen header={<Step n={4} title="Date & time" />} footer={<PrimaryButton title="Continue" disabled={!selSlot || selSlot.state !== 'open'} onPress={() => router.push('/book/review')} />}>
      <T v="strong" style={{ marginBottom: 4 }}>Select Date</T>
      {!firstOpen ? <EmptyState title="No open availability" body={`${firstName(p.name)} has no open slots in the next 30 days.`} actions={[{ label: 'Message provider', onPress: () => router.back() }]} /> : (
        <>
          <DateSelector slots={all} value={day} now={now} onChange={(d) => { setDay(d); update({ slotId: undefined }); }} />
          <Divider m={16} />
          <T v="strong" style={{ marginBottom: 10 }}>Select Time</T>
          <TimeSlotSelector slots={daySlots} value={draft.slotId} onChange={(id) => update({ slotId: id })} now={now} />
          <Gap h={14} />
          <Row gap={6}><Icon name="globe" size={14} color={colors.muted} /><T v="caption">Times shown in Malaysia Time (GMT+8)</T></Row>
          {selSlot ? <><Gap h={10} /><Notice tone="mint" text={`${fmtDateLong(selSlot.start)} at ${fmtTime(selSlot.start)}`} icon="calendar" /></> : null}
        </>
      )}
    </Screen>
  );
}

export function BookingReview() {
  const { draft, p, pkg, svc, update } = useDraft(); const st = useApp(); const db = st.db; const t = useT();
  if (!draft || !p || !pkg || !svc || !draft.slotId || !draft.mode) return <Redirect href="/student" />;
  const slot = db.slots.find((s) => s.id === draft.slotId)!;
  const learner = db.learners.find((l) => l.id === draft.learnerId)!;
  const address = db.addresses.find((a) => a.id === draft.addressId);
  const pricing = api.quote(db, pkg.id, draft.mode, draft.addressId); // authoritative mock-server quote
  const acc = db.accounts.find((a) => a.id === st.accountId)!;
  const submit = () => {
    const r = st.run((d, now) => api.createBooking(d, now, st.accountId, draft));
    if (!r.ok) return;
    st.set({ draft: undefined });
    router.replace(pkg.trial ? `/book/pending/${r.value.id}` : `/book/payment?bookingId=${r.value.id}`);
  };
  return (
    <Screen header={<Step n={5} title={t('book.review')} />} footer={<>
      {!acc.verified ? <Notice tone="warn" text="Verify your email to place bookings." /> : null}
      <PrimaryButton title={pkg.trial ? t('book.trial') : `${t('book.pay')} · ${rm(pricing.total)}`} onPress={submit} disabled={!acc.verified} />
      {!acc.verified ? <TextLink title="Verify email" onPress={() => router.push('/verify')} style={{ alignSelf: 'center' }} /> : <Row gap={6} style={{ justifyContent: 'center' }}><Icon name="shield" size={14} color={colors.link} /><T v="caption" color={colors.link}>Secure payments. Pay only through Growlink.</T></Row>}
    </>}>
      <Card>
        <KV k="Service" v={svc.title} /><KV k="Package" v={pkg.label} /><KV k="Learner" v={learner.relation === 'self' ? `${learner.name} (you)` : learner.name} />
        <KV k="Date" v={fmtDateLong(slot.start)} /><KV k="Time" v={`${fmtTime(slot.start)} · ${pkg.durationMin} min`} /><KV k="Mode" v={modeLabel(draft.mode)} />
        {address ? <KV k="Location" v={`${address.label} · ${address.line1}`} /> : draft.mode === 'provider' ? <KV k="Location" v={p.area} /> : null}
      </Card>
      <Gap />
      <FormField label="Notes for the teacher (optional)" multiline value={draft.notes} onChangeText={(v) => update({ notes: v })} placeholder="Goals, level, anything they should know" />
      <Card><PriceBreakdown pricing={pricing} /></Card>
      <SectionHeader title="Cancellation policy" />
      <Card>
        <T v="body">• More than 24 h before: 100% refund{'\n'}• 2–24 h before: 50% refund{'\n'}• Less than 2 h: no refund{'\n'}• If the teacher cancels: 100% refund</T>
      </Card>
      <Gap h={10} />
      <Notice text={pkg.trial ? 'Free trial requests are sent to the teacher to confirm. Nothing is charged.' : 'Your booking is confirmed only after the teacher accepts. If they decline, you get a full refund.'} />
    </Screen>
  );
}

export function Payment() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>(); const st = useApp(); const db = st.db;
  const b = db.bookings.find((x) => x.id === bookingId);
  const methods = db.paymentMethods.filter((m) => m.accountId === st.accountId);
  const [method, setMethod] = useState(methods.find((m) => m.isDefault)?.id ?? methods[0]?.id);
  const [phase, setPhase] = useState<'idle' | 'processing'>('idle');
  if (!b) return <Redirect href="/student/bookings" />;
  const v = bookingView(db, b);
  const failed = b.status === 'payment_failed';
  const pay = () => {
    setPhase('processing');
    setTimeout(() => {
      const fail = st.demo.nextPaymentFails;
      const m = methods.find((x) => x.id === method)!;
      const r = st.run((d, now) => api.pay(d, now, b.id, !fail, `${m.brand} •• ${m.last4}`));
      if (fail) st.set({ demo: { ...st.demo, nextPaymentFails: false } });
      setPhase('idle');
      if (r.ok && !fail) router.replace(`/book/pending/${b.id}`);
    }, 1300);
  };
  if (b.status === 'pending_confirmation' || b.status === 'confirmed') return <Redirect href={`/book/pending/${b.id}`} />;
  return (
    <Screen header={<ScreenHeader title="Payment" onBack={() => router.replace(`/booking/${b.id}`)} />} footer={<>
      <PrimaryButton title={failed ? `Retry payment · ${rm(b.pricing.total)}` : `Pay ${rm(b.pricing.total)}`} loading={phase === 'processing'} disabled={!method} onPress={pay} />
      <T v="caption" center>Prototype mode — no real card is charged.</T>
    </>}>
      <DemoLabel text="SIMULATED TRANSACTION · PROTOTYPE MODE" />
      <Gap h={12} />
      {failed ? <><Notice tone="danger" text="Payment failed: the card was declined (simulated). Your slot is still held — try again or choose another method." /><Gap /></> : null}
      <Card>
        <T v="strong">{v.pkg.label}</T><T v="bodyMuted">{v.provider.name} · {fmtDateTime(b.start)}</T>
        <Divider />
        <PriceBreakdown pricing={b.pricing} title="Amount (MYR)" />
      </Card>
      <SectionHeader title="Payment method" />
      {methods.map((m) => <Radio key={m.id} icon="card" selected={method === m.id} label={`${m.brand} •••• ${m.last4}`} sub={`Expires ${m.expiry}`} onPress={() => setMethod(m.id)} />)}
      <SecondaryButton icon="plus" title="Add payment method" onPress={() => router.push('/payment-methods')} />
      {phase === 'processing' ? <View style={{ alignItems: 'center', marginTop: 20, gap: 8 }}><ActivityIndicator color={colors.forest} /><T v="bodyMuted">Processing payment securely…</T></View> : null}
      <Gap />
      <Card style={{ backgroundColor: colors.soft, borderColor: colors.soft }}>
        <T v="caption">DEMO ONLY</T>
        <Radio selected={st.demo.nextPaymentFails} label="Make the next payment fail" onPress={() => st.set({ demo: { ...st.demo, nextPaymentFails: !st.demo.nextPaymentFails } })} />
      </Card>
    </Screen>
  );
}

export function PendingConfirmation() {
  const { id } = useLocalSearchParams<{ id: string }>(); const db = useApp((s) => s.db);
  const b = db.bookings.find((x) => x.id === id);
  if (!b) return <Redirect href="/student/bookings" />;
  if (b.status === 'confirmed') return <Redirect href={`/book/confirmed/${b.id}`} />;
  const v = bookingView(db, b); const trial = v.pkg.trial;
  return (
    <Screen header={<ScreenHeader back={false} title={trial ? 'Trial requested' : 'Payment received'} right={<TextLink title="Done" onPress={() => router.replace('/student/bookings')} />} />}
      footer={<><PrimaryButton title="View Booking" onPress={() => router.replace(`/booking/${b.id}`)} /><SecondaryButton title="Back to Home" onPress={() => router.replace('/student')} /></>}>
      <View style={{ alignItems: 'center', paddingVertical: 14 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.warnTint, alignItems: 'center', justifyContent: 'center' }}><Icon name="clock" size={34} color={colors.warn} /></View>
        <T v="h1" center style={{ marginTop: 12 }}>Waiting for {firstName(v.provider.name)} to confirm</T>
        <T v="bodyMuted" center style={{ marginTop: 6, maxWidth: 320 }}>{trial ? 'Your free trial request was submitted. Nothing is charged.' : `We've received ${rm(b.pricing.total)}. This is not a confirmed booking yet — if the teacher declines, you'll get a full refund.`}</T>
      </View>
      <Card>
        <KV k="Booking" v={b.ref} /><KV k="Package" v={v.pkg.label} /><KV k="Learner" v={v.learner.name} /><KV k="When" v={fmtDateTime(b.start)} /><KV k="Mode" v={modeLabel(b.mode)} />
      </Card>
      <SectionHeader title="Status" />
      <Timeline items={[
        { label: 'Booking created', done: true },
        { label: trial ? 'Free trial requested' : 'Payment received', done: true },
        { label: 'Teacher confirmation', done: false, current: true, note: 'Most teachers respond within a few hours.' },
        { label: 'Session', done: false },
      ]} />
      <Notice icon="bell" text="We'll notify you in Activity as soon as the teacher responds." />
    </Screen>
  );
}

export function BookingConfirmed() {
  const { id } = useLocalSearchParams<{ id: string }>(); const db = useApp((s) => s.db);
  const b = db.bookings.find((x) => x.id === id);
  if (!b) return <Redirect href="/student/bookings" />;
  if (b.status !== 'confirmed' && b.status !== 'in_progress') return <Redirect href={`/booking/${b.id}`} />; // never celebrate an unconfirmed booking
  const v = bookingView(db, b);
  return (
    <Screen header={<ScreenHeader back={false} right={<TextLink title="Close" onPress={() => router.replace('/student')} />} />} footer={<PrimaryButton title="View Booking" onPress={() => router.replace(`/booking/${b.id}`)} />}>
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <GrowlyIllustration size={130} mood="excited" />
        <T v="hero" center style={{ marginTop: 8 }}>You're booked!</T>
        <T v="bodyMuted" center style={{ marginTop: 6 }}>{v.provider.name} confirmed your session.</T>
      </View>
      <Gap />
      <Card>
        <Row gap={12} style={{ marginBottom: 8 }}><Avatar photo={v.provider.photo} initials={v.provider.initials} size={48} /><View style={{ flex: 1 }}><T v="strong">{v.provider.name}</T><T v="bodyMuted">{v.pkg.label}</T></View><Pill tone="mint" icon="check" text="Confirmed" /></Row>
        <Divider m={8} />
        <KV k="Learner" v={v.learner.name} /><KV k="Date" v={fmtDateLong(b.start)} /><KV k="Time" v={`${fmtTime(b.start)} · ${b.durationMin} min`} /><KV k="Mode" v={modeLabel(b.mode)} />
        <KV k="Location" v={b.mode === 'online' ? 'Meeting link in booking' : v.address ? `${v.address.line1}, ${v.address.area}` : `No. 8, Jalan SS 9A/2, ${v.provider.area}`} />
      </Card>
      <Gap />
      <Notice text={`Check in from ${POLICY.checkInOpensMinBefore} minutes before your session.`} icon="checkin" />
    </Screen>
  );
}
export { SecondaryButton };
