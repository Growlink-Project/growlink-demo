import React, { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/theme/tokens';
import { Avatar, Card, ConfirmationDialog, Divider, EmptyState, FormField, Gap, GrowlyIllustration, IconButton, KV, Notice, Pill, PrimaryButton, Radio, Row, Screen, ScreenHeader, SecondaryButton, Segmented, SectionHeader, SkillChip, StatusBadge, Stars, T, TextLink, Timeline } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { BookingCard, PriceBreakdown } from '@/components/cards';
import { useApp } from '@/store/useApp';
import * as api from '@/mocks/services/api';
import { POLICY } from '@/mocks/services/config';
import { fmtDateLong, fmtDateTime, fmtTime, HOUR, rm, until } from '@/lib/time';
import { firstName } from '@/lib/time';
import { bookingView, isCancelled, isUpcoming, modeLabel } from '@/hooks/lookup';
import { useT } from '@/i18n';
import type { Booking } from '@/mocks/types';

const HIST_LABEL: Record<string, string> = {
  created: 'Booking created', trial_requested: 'Free trial requested', payment_succeeded: 'Payment received', payment_failed: 'Payment failed', confirmed: 'Confirmed by teacher',
  checkin_student: 'Student checked in', checkin_teacher: 'Teacher checked in', in_progress: 'Session started', completed: 'Session completed', cancelled: 'Cancelled', declined: 'Declined by teacher',
  refund_processing: 'Refund processing', refunded: 'Refund completed', disputed: 'Dispute opened', dispute_resolved: 'Dispute resolved', no_show_review: 'Attendance under review',
};
export const historyItems = (b: Booking) => b.history.map((h, i) => ({ label: HIST_LABEL[h.status] ?? h.status, at: fmtDateTime(h.at), note: h.note, done: true, current: i === b.history.length - 1 }));

function nextAction(b: Booking, now: number): { label: string; href: string } | undefined {
  if (b.status === 'awaiting_payment' || b.status === 'payment_failed') return { label: b.status === 'payment_failed' ? 'Retry payment' : 'Complete payment', href: `/book/payment?bookingId=${b.id}` };
  const w = api.checkInWindow(b);
  if ((b.status === 'confirmed' || b.status === 'in_progress') && now >= w.opens && now <= w.closes && !b.checkInStudent) return { label: 'Check in now', href: `/booking/checkin/${b.id}` };
  if (b.status === 'completed' && !b.reviewId) return { label: 'Leave a review', href: `/booking/review/${b.id}` };
  if (b.status === 'disputed' && b.disputeId) return { label: 'View dispute', href: `/dispute/${b.disputeId}` };
  if (b.refund) return { label: 'Refund details', href: `/refund/${b.id}` };
  if (b.status === 'no_show_review') return { label: 'View attendance case', href: `/refund/${b.id}` };
}

export function MyBookings() {
  const t = useT(); const st = useApp(); const [tab, setTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const mine = st.db.bookings.filter((b) => b.studentAccountId === st.accountId);
  const lists = {
    upcoming: mine.filter((b) => isUpcoming(b, st.now)).sort((a, b) => a.start - b.start),
    past: mine.filter((b) => !isUpcoming(b, st.now) && !isCancelled(b)).sort((a, b) => b.start - a.start),
    cancelled: mine.filter((b) => isCancelled(b)).sort((a, b) => b.start - a.start),
  };
  return (
    <Screen scroll={false} header={<View style={{ paddingHorizontal: 18, paddingTop: 8 }}><T v="h1">{t('bookings.title')}</T><Gap h={12} />
      <Segmented value={tab} onChange={setTab} options={[{ key: 'upcoming', label: t('bookings.upcoming'), count: lists.upcoming.length }, { key: 'past', label: t('bookings.past') }, { key: 'cancelled', label: t('bookings.cancelled') }]} /><Gap h={12} /></View>}>
      <FlatList data={lists[tab]} keyExtractor={(b) => b.id} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}
        renderItem={({ item }) => { const a = nextAction(item, st.now); return <BookingCard b={item} onPress={() => router.push(`/booking/${item.id}`)} action={a ? { label: a.label, onPress: () => router.push(a.href as never) } : undefined} />; }}
        ListEmptyComponent={<EmptyState mood={tab === 'upcoming' ? 'happy' : 'calm'} title={tab === 'upcoming' ? 'No upcoming bookings' : tab === 'past' ? 'No past sessions yet' : 'Nothing cancelled'}
          body={tab === 'upcoming' ? 'Find a teacher or service nearby and book your first session.' : undefined} actions={tab === 'upcoming' ? [{ label: 'Explore nearby', onPress: () => router.push('/student'), primary: true }] : undefined} />} />
    </Screen>
  );
}

export function BookingDetails() {
  const { id } = useLocalSearchParams<{ id: string }>(); const st = useApp(); const db = st.db;
  const b = db.bookings.find((x) => x.id === id);
  if (!b) return <Screen header={<ScreenHeader />}><EmptyState title="Booking not found" /></Screen>;
  const v = bookingView(db, b);
  const thread = db.threads.find((t) => t.providerId === b.providerId && t.studentAccountId === b.studentAccountId);
  const w = api.checkInWindow(b);
  const canCancel = ['awaiting_payment', 'payment_failed', 'pending_confirmation', 'confirmed'].includes(b.status) && b.start > st.now;
  const canDispute = b.status === 'completed' && !!b.completedAt && st.now <= b.completedAt + POLICY.disputeWindowHours * HOUR;
  const review = db.reviews.find((r) => r.id === b.reviewId);
  const canEditReview = review && review.editableUntil && st.now <= review.editableUntil;
  const blocked = st.blocked.includes(b.providerId);
  const openChat = () => { if (thread) router.push(`/conversation/${thread.id}`); else { const r = st.run((d) => { const t = { id: api.uid('t'), providerId: b.providerId, studentAccountId: b.studentAccountId, bookingId: b.id, origin: 'booking' as const, messages: [], unreadStudent: 0, unreadTeacher: 0 }; d.threads.unshift(t); return t.id; }); if (r.ok) router.push(`/conversation/${r.value}`); } };
  const done = b.status === 'completed' || b.status === 'disputed';
  return (
    <Screen header={<ScreenHeader title={done ? 'Session completed' : 'Booking details'} sub={b.ref} />}>
      {done ? <Card style={{ backgroundColor: colors.mintTint, borderColor: colors.mintTint, marginBottom: 12 }}>
        <Row gap={10}><Icon name="trophy" size={22} color={colors.forest} /><View style={{ flex: 1 }}><T v="strong">Session completed</T><T v="bodyMuted">Checked in {b.checkInTeacher ? fmtTime(Math.min(b.checkInTeacher, b.checkInStudent ?? Infinity)) : '—'} · checked out {b.checkOut ? fmtTime(b.checkOut) : '—'}</T></View></Row>
      </Card> : null}
      <Card>
        <Row style={{ justifyContent: 'space-between' }}><StatusBadge status={b.status} />{b.status === 'confirmed' ? <T v="caption">{until(b.start, st.now)}</T> : null}</Row>
        <T v="screenTitle" style={{ marginTop: 10 }}>{v.pkg.label}</T>
        <T v="bodyMuted">{v.service.title}</T>
        <Divider />
        <Pressable accessibilityRole="link" onPress={() => router.push(`/provider/${v.provider.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar photo={v.provider.photo} initials={v.provider.initials} size={44} /><View style={{ flex: 1 }}><T v="strong">{v.provider.name}</T><T v="bodyMuted">{v.provider.headline}</T></View><Icon name="chevron-right" size={18} color={colors.muted} />
        </Pressable>
        <Divider />
        <KV k="Learner" v={v.learner.name} /><KV k="Date" v={fmtDateLong(b.start)} /><KV k="Time" v={`${fmtTime(b.start)} · ${b.durationMin} min`} /><KV k="Mode" v={modeLabel(b.mode)} />
        {b.mode === 'provider' ? <KV k="Location" v={b.status === 'confirmed' || done || b.status === 'in_progress' ? `No. 8, Jalan SS 9A/2, ${v.provider.area}` : `${v.provider.area} (full address after confirmation)`} /> : null}
        {b.mode === 'student' && v.address ? <KV k="Location" v={`${v.address.label}: ${v.address.line1}, ${v.address.area}`} /> : null}
        {b.mode === 'online' ? <KV k="Meeting link" v={b.status === 'confirmed' || b.status === 'in_progress' ? 'meet.growlink.my/' + b.ref.toLowerCase() : 'Shared after confirmation'} /> : null}
        {b.meetingNote ? <KV k="Meeting notes" v={b.meetingNote} /> : null}
        {b.notes ? <KV k="Your notes" v={b.notes} /> : null}
      </Card>
      <Gap />
      <Row gap={10}>
        <SecondaryButton title="Message" icon="chat" onPress={openChat} disabled={blocked} style={{ flex: 1 }} />
        {done || b.status === 'in_progress' ? <SecondaryButton title="Lesson Space" icon="doc" onPress={() => router.push(`/lesson-space/${b.providerId}__${b.learnerId}`)} style={{ flex: 1 }} /> : null}
      </Row>
      <Gap />
      {(b.status === 'confirmed' || b.status === 'in_progress') ? (
        st.now >= w.opens && st.now <= w.closes ? <PrimaryButton title={b.checkInStudent ? 'View check-in' : 'Check In'} icon="checkin" onPress={() => router.push(`/booking/checkin/${b.id}`)} />
          : st.now < w.opens ? <Notice icon="checkin" text={`Check-in opens ${fmtDateTime(w.opens)}.`} /> : null
      ) : null}
      {b.status === 'awaiting_payment' || b.status === 'payment_failed' ? <PrimaryButton title={b.status === 'payment_failed' ? 'Retry payment' : 'Complete payment'} onPress={() => router.push(`/book/payment?bookingId=${b.id}`)} /> : null}
      {b.status === 'pending_confirmation' ? <Notice tone="warn" icon="clock" text={`${v.pkg.trial ? 'Free trial request submitted' : 'Payment received'} — waiting for ${firstName(v.provider.name)} to confirm.`} /> : null}
      {b.status === 'completed' ? (
        <View style={{ gap: 10 }}>
          {!review ? <PrimaryButton title="Leave Review" icon="star" onPress={() => router.push(`/booking/review/${b.id}`)} />
            : <Card><Row style={{ justifyContent: 'space-between' }}><T v="strong">Your review</T><Stars value={review.rating} /></Row>{review.text ? <T v="body" style={{ marginTop: 6 }}>{review.text}</T> : null}
              {canEditReview ? <TextLink title="Edit review" onPress={() => router.push(`/booking/review/${b.id}`)} /> : <T v="caption">Edit period ended</T>}</Card>}
          {canDispute ? <TextLink title={`Report a problem · open dispute (within ${POLICY.disputeWindowHours} h)`} color={colors.danger} onPress={() => router.push(`/booking/dispute/${b.id}`)} /> : null}
        </View>
      ) : null}
      {b.status === 'disputed' && b.disputeId ? <><Notice tone="danger" text="Dispute open — settlement is frozen until the case is resolved." /><Gap h={8} /><SecondaryButton title="View dispute" onPress={() => router.push(`/dispute/${b.disputeId}`)} /></> : null}
      {b.refund || b.status === 'no_show_review' ? <SecondaryButton title={b.status === 'no_show_review' ? 'Attendance case' : 'Refund details'} icon="refresh" onPress={() => router.push(`/refund/${b.id}`)} /> : null}
      <SectionHeader title="Payment" />
      <Card>
        <PriceBreakdown pricing={b.pricing} title="Summary" />
        <Gap h={6} /><KV k="Payment" v={b.payment.status === 'free' ? 'Free trial · no charge' : `${b.payment.status.replace('_', ' ')}${b.payment.method ? ' · ' + b.payment.method : ''}`} />
        {b.refund ? <KV k="Refund" v={`${rm(b.refund.amount)} · ${b.refund.status}`} /> : null}
      </Card>
      <SectionHeader title="Status timeline" />
      <Timeline items={historyItems(b)} />
      {canCancel ? <SecondaryButton title="Cancel booking" danger onPress={() => router.push(`/booking/cancel/${b.id}`)} /> : null}
    </Screen>
  );
}

const CANCEL_REASONS = ['Schedule conflict', 'Booked by mistake', 'Found another provider', 'Learner unwell', 'Other'];
export function CancelBooking() {
  const { id } = useLocalSearchParams<{ id: string }>(); const st = useApp();
  const [reason, setReason] = useState<string>(); const [confirm, setConfirm] = useState(false); const [done, setDone] = useState(false);
  const b = st.db.bookings.find((x) => x.id === id);
  if (!b) return <Redirect href="/student/bookings" />;
  const q = api.cancelQuote(st.db, st.now, b.id, 'student'); // server-calculated
  if (done) return (
    <Screen header={<ScreenHeader back={false} title="Booking cancelled" />} footer={<PrimaryButton title="Back to bookings" onPress={() => router.replace('/student/bookings')} />}>
      <EmptyState growly={false} title="Your booking has been cancelled" body={b.refund ? `${rm(b.refund.amount)} (${b.cancellation?.refundPct}%) is being refunded to ${b.refund.method}. Refunds usually arrive in 5–10 business days.` : 'No refund applies to this cancellation.'} />
      {b.refund ? <SecondaryButton title="Refund details" onPress={() => router.replace(`/refund/${b.id}`)} /> : null}
    </Screen>
  );
  return (
    <Screen header={<ScreenHeader title="Cancel booking" />} footer={<SecondaryButton danger title="Cancel booking" disabled={!reason} onPress={() => setConfirm(true)} />}>
      <T v="strong" style={{ marginBottom: 10 }}>Why are you cancelling?</T>
      {CANCEL_REASONS.map((r) => <Radio key={r} selected={reason === r} label={r} onPress={() => setReason(r)} />)}
      <SectionHeader title="Refund estimate" />
      <Card>
        <KV k="Session starts" v={`${fmtDateTime(b.start)} (${Math.max(0, q.hours).toFixed(1)} h away)`} />
        <KV k="Policy window" v={b.status === 'pending_confirmation' ? 'Not yet confirmed' : q.window} />
        <KV k="Amount paid" v={rm(q.paid)} />
        <Divider />
        <KV k={`Refund (${q.pct}%)`} v={<T v="price">{rm(q.amount)}</T>} />
      </Card>
      <Gap h={10} />
      <Notice text=">24 h: 100% · 2–24 h: 50% · <2 h: 0%. Unconfirmed requests are always fully refunded. Calculated by Growlink, not your device." />
      <ConfirmationDialog visible={confirm} danger title="Cancel this booking?" body={`You'll receive ${rm(q.amount)}. This can't be undone.`} confirm="Yes, cancel" onCancel={() => setConfirm(false)}
        onConfirm={() => { const r = st.run((d, now) => api.cancelBooking(d, now, b.id, 'student', reason!)); setConfirm(false); if (r.ok) setDone(true); }} />
    </Screen>
  );
}

export function CheckIn() {
  const { id } = useLocalSearchParams<{ id: string }>(); const st = useApp();
  const b = st.db.bookings.find((x) => x.id === id);
  if (!b) return <Redirect href="/student/bookings" />;
  const v = bookingView(st.db, b); const w = api.checkInWindow(b);
  const eligible = ['confirmed', 'in_progress'].includes(b.status) && st.now >= w.opens && st.now <= w.closes && !b.checkInStudent;
  return (
    <Screen header={<ScreenHeader title="Check in" />} footer={eligible ? <PrimaryButton title="Check In" icon="checkin" onPress={() => st.run((d, now) => api.checkIn(d, now, b.id, 'student'), 'Checked in')} /> : <SecondaryButton title="Booking details" onPress={() => router.push(`/booking/${b.id}`)} />}>
      <Card>
        <T v="caption">{b.ref}</T><T v="screenTitle">{v.pkg.label}</T><T v="bodyMuted">{v.provider.name} · {v.learner.name}</T>
        <Divider /><KV k="Session" v={`${fmtDateTime(b.start)} · ${b.durationMin} min`} /><KV k="Check-in window" v={`${fmtTime(w.opens)} – ${fmtTime(w.closes)}`} /><KV k="Status" v={<StatusBadge status={b.status} />} />
      </Card>
      <SectionHeader title="Attendance" />
      <Card>
        <Row style={{ justifyContent: 'space-between', paddingVertical: 6 }}><Row gap={8}><Icon name="user" size={18} /><T v="strong">You</T></Row>{b.checkInStudent ? <Pill tone="mint" icon="check" text={`Checked in ${fmtTime(b.checkInStudent)}`} /> : <Pill text="Not checked in" />}</Row>
        <Row style={{ justifyContent: 'space-between', paddingVertical: 6 }}><Row gap={8}><Icon name="academic" size={18} /><T v="strong">{firstName(v.provider.name)}</T></Row>{b.checkInTeacher ? <Pill tone="mint" icon="check" text={`Checked in ${fmtTime(b.checkInTeacher)}`} /> : <Pill text="Not yet" />}</Row>
      </Card>
      <Gap />
      {!eligible && !b.checkInStudent ? <Notice tone="warn" text={st.now < w.opens ? `Check-in opens at ${fmtDateTime(w.opens)}. (Use Prototype Lab → Advance time to jump ahead.)` : 'Check-in is not available for this booking.'} /> : null}
      {b.status === 'in_progress' ? <Notice tone="mint" text="Session in progress. The teacher checks out when the session ends." /> : null}
    </Screen>
  );
}

const TAGS = ['Patient', 'Clear explanations', 'Punctual', 'Friendly', 'Great with kids', 'Well prepared'];
export function SubmitReview() {
  const { id } = useLocalSearchParams<{ id: string }>(); const st = useApp();
  const b = st.db.bookings.find((x) => x.id === id);
  const existing = st.db.reviews.find((r) => r.id === b?.reviewId);
  const [rating, setRating] = useState(existing?.rating ?? 0); const [tags, setTags] = useState<string[]>(existing?.tags ?? []); const [text, setText] = useState(existing?.text ?? '');
  const [done, setDone] = useState(false);
  if (!b) return <Redirect href="/student/bookings" />;
  const v = bookingView(st.db, b);
  if (b.status !== 'completed' && b.status !== 'disputed') return <Screen header={<ScreenHeader title="Review" />}><EmptyState title="Reviews open after completion" body="Only completed bookings can be reviewed." /></Screen>;
  if (done) return <Screen header={<ScreenHeader back={false} />} footer={<PrimaryButton title="Done" onPress={() => router.replace(`/booking/${b.id}`)} />}><View style={{ alignItems: 'center', paddingTop: 20 }}><GrowlyIllustration size={110} mood="happy" /><T v="h1" center style={{ marginTop: 10 }}>Thanks for your review!</T><T v="bodyMuted" center>You can edit it for {POLICY.reviewEditDays} days after the session.</T></View></Screen>;
  return (
    <Screen header={<ScreenHeader title={existing ? 'Edit review' : 'Leave a review'} />} footer={<PrimaryButton title={existing ? 'Update review' : 'Submit review'} disabled={!rating || text.length > POLICY.reviewMaxChars} onPress={() => { const r = st.run((d, now) => api.submitReview(d, now, b.id, rating, tags, text)); if (r.ok) setDone(true); }} />}>
      <Row gap={12}><Avatar photo={v.provider.photo} initials={v.provider.initials} size={52} /><View><T v="strong">{v.provider.name}</T><T v="bodyMuted">{v.pkg.label} · {fmtDateTime(b.start)}</T></View></Row>
      <SectionHeader title="Your rating" />
      <Stars value={rating} onChange={setRating} size={36} />
      <SectionHeader title="What stood out? (optional)" />
      <Row gap={8} wrap>{TAGS.map((tg) => <SkillChip key={tg} label={tg} active={tags.includes(tg)} onPress={() => setTags(tags.includes(tg) ? tags.filter((x) => x !== tg) : [...tags, tg])} />)}</Row>
      <Gap />
      <FormField label="Your review (optional)" multiline value={text} onChangeText={setText} maxLength={POLICY.reviewMaxChars + 20} hint={`${text.length}/${POLICY.reviewMaxChars}`} error={text.length > POLICY.reviewMaxChars ? 'Too long' : undefined} />
      <Notice text="Reviews are public and show your first name and initial." />
    </Screen>
  );
}

const DISPUTE_REASONS = ['Teacher did not attend', 'Session not as described', 'Safety/conduct concern', 'Incorrect amount', 'Online technical failure'];
export function OpenDispute() {
  const { id } = useLocalSearchParams<{ id: string }>(); const st = useApp();
  const [reason, setReason] = useState<string>(); const [details, setDetails] = useState(''); const [files, setFiles] = useState<string[]>([]); const [confirm, setConfirm] = useState(false);
  const b = st.db.bookings.find((x) => x.id === id);
  if (!b) return <Redirect href="/student/bookings" />;
  const v = bookingView(st.db, b);
  return (
    <Screen header={<ScreenHeader title="Open a dispute" />} footer={<SecondaryButton danger title="Submit Dispute" disabled={!reason || details.length < 10} onPress={() => setConfirm(true)} />}>
      <Card><T v="strong">{v.pkg.label}</T><T v="bodyMuted">{v.provider.name} · {fmtDateTime(b.start)} · {rm(b.pricing.total)}</T></Card>
      <SectionHeader title="What went wrong?" />
      {DISPUTE_REASONS.map((r) => <Radio key={r} selected={reason === r} label={r} onPress={() => setReason(r)} />)}
      <FormField label="Explain what happened" multiline value={details} onChangeText={setDetails} error={details && details.length < 10 ? 'Please add a little more detail' : undefined} />
      <T v="strong" style={{ marginBottom: 8 }}>Evidence (optional)</T>
      <Row gap={8} wrap>{files.map((f) => <Pill key={f} icon="clip" text={f} />)}<SecondaryButton small icon="clip" title="Attach file" onPress={() => setFiles([...files, `evidence-${files.length + 1}.jpg`])} /></Row>
      <Gap />
      <Notice tone="warn" text="Opening a dispute freezes settlement for this session until Growlink support resolves it." />
      <ConfirmationDialog visible={confirm} title="Submit dispute?" body="Our team will review the case and contact both parties." confirm="Submit" onCancel={() => setConfirm(false)}
        onConfirm={() => { const r = st.run((d, now) => api.openDispute(d, now, b.id, reason!, details, files)); setConfirm(false); if (r.ok) router.replace(`/dispute/${r.value}`); }} />
    </Screen>
  );
}

export function DisputeDetails() {
  const { id } = useLocalSearchParams<{ id: string }>(); const st = useApp();
  const d = st.db.disputes.find((x) => x.id === id);
  if (!d) return <Redirect href="/student/bookings" />;
  const b = st.db.bookings.find((x) => x.id === d.bookingId)!; const v = bookingView(st.db, b);
  return (
    <Screen header={<ScreenHeader title="Dispute" sub={b.ref} />}>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}><T v="strong">Case status</T><Pill tone={d.status === 'resolved' ? 'mint' : 'danger'} icon={d.status === 'resolved' ? 'check' : 'flag'} text={d.status.replace('_', ' ')} /></Row>
        <Divider /><KV k="Opened" v={fmtDateTime(d.openedAt)} /><KV k="Reason" v={d.reason} /><KV k="Session" v={`${v.pkg.label} · ${fmtDateTime(b.start)}`} />
        <KV k="Settlement" v={d.status === 'resolved' ? 'Released per outcome' : 'Frozen'} />
      </Card>
      <SectionHeader title="Your explanation" /><Card><T v="body">{d.details}</T></Card>
      <SectionHeader title="Evidence" />
      {d.evidence.length ? <Row gap={8} wrap>{d.evidence.map((f) => <Pill key={f} icon="clip" text={f} />)}</Row> : <T v="bodyMuted">No attachments.</T>}
      <SectionHeader title="Outcome" />
      <Card>{d.status === 'resolved' ? <><T v="strong">{d.outcome}</T>{d.refundAmount ? <KV k="Refund" v={rm(d.refundAmount)} /> : null}</> : <T v="bodyMuted">Under review by Growlink support. Typical resolution: 3–5 business days.</T>}</Card>
      <Gap /><SecondaryButton title="Contact support" icon="help" onPress={() => router.push('/help')} />
    </Screen>
  );
}

export function RefundDetails() {
  const { id } = useLocalSearchParams<{ id: string }>(); const st = useApp();
  const b = st.db.bookings.find((x) => x.id === id);
  if (!b) return <Redirect href="/student/bookings" />;
  const v = bookingView(st.db, b);
  const neutral = b.status === 'no_show_review';
  return (
    <Screen header={<ScreenHeader title={neutral ? 'Attendance review' : 'Refund details'} sub={b.ref} />}>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}><T v="strong">{v.pkg.label}</T><StatusBadge status={b.status} /></Row>
        <T v="bodyMuted">{v.provider.name} · {fmtDateTime(b.start)}</T>
      </Card>
      <SectionHeader title="Attendance" />
      <Card>
        <KV k="Student check-in" v={b.checkInStudent ? fmtTime(b.checkInStudent) : 'Not recorded'} />
        <KV k="Teacher check-in" v={b.checkInTeacher ? fmtTime(b.checkInTeacher) : 'Not recorded'} />
        {b.cancellation ? <KV k="Cancelled" v={`${fmtDateTime(b.cancellation.at)} by ${b.cancellation.by} · ${b.cancellation.reason}`} /> : null}
      </Card>
      {neutral ? <><Gap /><Notice tone="warn" text="Neither party checked in. This case is under neutral review — no fault has been assigned. Support will contact both parties before any refund decision." /></> : null}
      <SectionHeader title="Refund" />
      {b.refund ? (
        <Card>
          <KV k="Amount" v={<T v="price">{rm(b.refund.amount)}</T>} /><KV k="Method" v={b.refund.method} /><KV k="Requested" v={fmtDateTime(b.refund.at)} />
          <Gap h={8} />
          <Timeline items={[{ label: 'Refund requested', done: true }, { label: 'Processing', done: b.refund.status !== 'requested', current: b.refund.status === 'processing' }, { label: 'Completed', done: b.refund.status === 'completed' }]} />
        </Card>
      ) : <T v="bodyMuted">{neutral ? 'Pending review outcome.' : 'No refund applies.'}</T>}
      <Gap /><SecondaryButton title="Contact support" icon="help" onPress={() => router.push('/help?topic=payment')} />
    </Screen>
  );
}
export { IconButton };
