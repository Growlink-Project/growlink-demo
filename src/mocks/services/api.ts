/**
 * Simulated authoritative backend operations.
 * UI never mutates bookings, money or availability directly — it calls these through the store.
 * Each mutator receives a draft copy of the DB plus the demo clock, and either mutates it or throws ServiceError.
 */
import { DAY, HOUR, MIN, fmtDateTime, rm } from '@/lib/time';
import type { DB } from '../data/seed';
import { CATEGORIES, SKILLS } from '../data/seed';
import type { Booking, BookingStatus, LedgerEntry, Mode, Notification, Pricing, Provider, Role, Slot } from '../types';
import { POLICY, PRICING } from './config';

export class ServiceError extends Error {}
const fail = (msg: string): never => { throw new ServiceError(msg); };
let seq = 1000;
export const uid = (p: string) => `${p}_${(seq++).toString(36)}`;

// ---------- lookups ----------
export const getProvider = (db: DB, id: string) => db.providers.find((p) => p.id === id);
export const servicesOf = (db: DB, pid: string, activeOnly = true) => db.services.filter((s) => s.providerId === pid && (!activeOnly || s.active));
export const packagesOf = (db: DB, sid: string, activeOnly = true) => db.packages.filter((k) => k.serviceId === sid && (!activeOnly || k.active));
export const providerPackages = (db: DB, pid: string) => servicesOf(db, pid).flatMap((s) => packagesOf(db, s.id));
export const startingPrice = (db: DB, pid: string) => { const p = providerPackages(db, pid).filter((k) => !k.trial).map((k) => k.price); return p.length ? Math.min(...p) : undefined; };
export const providerModes = (db: DB, pid: string): Mode[] => Array.from(new Set(servicesOf(db, pid).flatMap((s) => s.modes)));
export const openSlots = (db: DB, pid: string, now: number) => db.slots.filter((s) => s.providerId === pid && s.state === 'open' && s.start > now).sort((a, b) => a.start - b.start);
export const nextOpen = (db: DB, pid: string, now: number) => openSlots(db, pid, now)[0];
export const distanceM = (a: { dx: number; dy: number }, b: { dx: number; dy: number }) => Math.hypot(a.dx - b.dx, a.dy - b.dy);
export const categoryOf = (id?: string) => CATEGORIES.find((c) => c.id === id);
export const skillOf = (id?: string) => SKILLS.find((s) => s.id === id);

// ---------- discovery ----------
export interface SearchParams {
  center: { dx: number; dy: number }; userPos: { dx: number; dy: number }; radiusKm: number;
  categoryId?: string; skillId?: string; online: boolean; query: string; offeringType?: 'skill' | 'service';
  modes?: Mode[]; priceMax?: number; minRating?: number; availability: 'any' | 'today' | 'week' | 'weekend';
  sort: 'recommended' | 'distance' | 'rating' | 'price'; blocked: string[]; now: number;
}
export interface Result { provider: Provider; distance: number; from?: number; next?: Slot; modes: Mode[]; score: number }

/** v2.0 eligibility: approved, active, bookable, not suspended, matching offering, ≥1 future open slot. */
export function eligibleBase(db: DB, p: Provider, now: number) {
  return p.approval === 'approved' && p.active && p.bookable && !p.suspended && providerPackages(db, p.id).length > 0 && !!nextOpen(db, p.id, now);
}
export function searchProviders(db: DB, q: SearchParams): Result[] {
  const text = q.query.trim().toLowerCase();
  const out: Result[] = [];
  for (const p of db.providers) {
    if (q.blocked.includes(p.id)) continue;
    if (!eligibleBase(db, p, q.now)) continue;
    const d = distanceM(p, q.center);
    if (d > q.radiusKm * 1000) continue; // online results also stay within the selected geographic scope
    const svcs = servicesOf(db, p.id).filter((s) => packagesOf(db, s.id).length);
    const match = svcs.filter((s) =>
      (!q.categoryId || skillOf(s.skillId)?.categoryId === q.categoryId) &&
      (!q.skillId || s.skillId === q.skillId) &&
      (!q.offeringType || s.offeringType === q.offeringType) &&
      (!q.online || s.modes.includes('online')) &&
      (!q.modes?.length || s.modes.some((m) => q.modes!.includes(m))));
    if (!match.length) continue;
    if (text && !(`${p.name} ${p.headline} ${match.map((s) => s.title + ' ' + skillOf(s.skillId)?.label).join(' ')}`.toLowerCase().includes(text))) continue;
    const prices = match.flatMap((s) => packagesOf(db, s.id)).filter((k) => !k.trial).map((k) => k.price);
    const from = prices.length ? Math.min(...prices) : undefined;
    if (q.priceMax != null && from != null && from > q.priceMax) continue;
    if (q.minRating && p.rating < q.minRating) continue;
    const slots = openSlots(db, p.id, q.now);
    const day = 24 * HOUR;
    const avail = slots.filter((s) => q.availability === 'any' ? true : q.availability === 'today' ? s.start - q.now < day && new Date(s.start + 8 * HOUR).getUTCDate() === new Date(q.now + 8 * HOUR).getUTCDate() : q.availability === 'week' ? s.start - q.now < 7 * day : [0, 6].includes(new Date(s.start + 8 * HOUR).getUTCDay()) && s.start - q.now < 8 * day);
    if (!avail.length) continue;
    const distU = distanceM(p, q.userPos);
    // deterministic ranking: distance, rating, reliability, completed sessions
    const score = (1 - Math.min(distU, 5000) / 5000) * 40 + (p.rating / 5) * 30 + (p.reliability / 100) * 20 + Math.min(p.completedSessions, 600) / 600 * 10;
    out.push({ provider: p, distance: distU, from, next: avail[0], modes: Array.from(new Set(match.flatMap((s) => s.modes))), score });
  }
  const sorters: Record<SearchParams['sort'], (a: Result, b: Result) => number> = {
    recommended: (a, b) => b.score - a.score, distance: (a, b) => a.distance - b.distance,
    rating: (a, b) => b.provider.rating - a.provider.rating, price: (a, b) => (a.from ?? 0) - (b.from ?? 0),
  };
  return out.sort(sorters[q.sort]);
}
/** Quick-filter category pills ordered by matching local supply (All and Online are always first). */
export function localCategories(results: Result[], db: DB) {
  const counts = new Map<string, number>();
  for (const r of results) for (const s of servicesOf(db, r.provider.id)) { const c = skillOf(s.skillId)?.categoryId; if (c) counts.set(c, (counts.get(c) ?? 0) + 1); }
  return CATEGORIES.map((c) => ({ ...c, count: counts.get(c.id) ?? 0 })).filter((c) => c.count > 0).sort((a, b) => b.count - a.count);
}

// ---------- pricing ----------
export function quote(db: DB, packageId: string, mode: Mode, addressId?: string): Pricing {
  const k = db.packages.find((x) => x.id === packageId) ?? fail('Package not found');
  const s = db.services.find((x) => x.id === k.serviceId)!;
  const p = getProvider(db, s.providerId)!;
  const lines: Pricing['lines'] = [{ label: `${k.label} (${k.durationMin} min)`, amount: k.price }];
  let transport = 0;
  if (!k.trial && mode === PRICING.transport.appliesToMode) {
    const a = db.addresses.find((x) => x.id === addressId);
    if (a) {
      const km = distanceM(p, a) / 1000;
      transport = Math.max(PRICING.transport.minimum, Math.round(km * PRICING.transport.perKm));
      lines.push({ label: 'Transport fee', amount: transport, note: `${km.toFixed(1)} km × RM${PRICING.transport.perKm}/km, min RM${PRICING.transport.minimum}` });
    }
  }
  const serviceFee = Math.round(k.price * PRICING.serviceFeeRate * 100) / 100;
  if (serviceFee > 0) lines.push({ label: 'Service fee', amount: serviceFee });
  return { base: k.price, transport, serviceFee, total: k.price + transport + serviceFee, lines };
}
export function trialUsed(db: DB, learnerId: string, providerId: string) {
  return db.bookings.some((b) => b.learnerId === learnerId && b.providerId === providerId && db.packages.find((k) => k.id === b.packageId)?.trial && !['cancelled', 'declined', 'payment_failed'].includes(b.status));
}

// ---------- notifications ----------
export function notify(db: DB, now: number, accountId: string, role: Role, group: Notification['group'], kind: string, title: string, body: string, href: string) {
  db.notifications.unshift({ id: uid('n'), accountId, role, group, kind, title, body, at: now, read: false, href });
}
const teacherAcc = (db: DB, b: Booking) => getProvider(db, b.providerId)!.accountId;
const pushHist = (b: Booking, status: BookingStatus | string, now: number, note?: string) => b.history.push({ status, at: now, note });

// ---------- booking lifecycle ----------
export interface Draft { providerId: string; serviceId?: string; packageId?: string; learnerId?: string; mode?: Mode; addressId?: string; meetingNote?: string; slotId?: string; notes?: string }

export function createBooking(db: DB, now: number, accountId: string, d: Draft): Booking {
  const acc = db.accounts.find((a) => a.id === accountId)!;
  if (!acc.verified) fail('Please verify your email before booking.');
  const p = getProvider(db, d.providerId) ?? fail('Provider not found');
  if (p.approval !== 'approved' || !p.bookable) fail('This provider is not accepting bookings yet.');
  const k = db.packages.find((x) => x.id === d.packageId) ?? fail('Choose a package.');
  const s = db.services.find((x) => x.id === k.serviceId)!;
  if (!d.learnerId) fail('Choose a learner.');
  if (!d.mode || !s.modes.includes(d.mode)) fail('Choose a supported lesson mode.');
  if (d.mode === 'student' && !d.addressId) fail('Choose an address for at-home sessions.');
  const slot = db.slots.find((x) => x.id === d.slotId) ?? fail('Choose a time.');
  if (slot.start <= now) fail('That time has passed. Pick another slot.');
  if (slot.state !== 'open') fail('That slot was just taken. Please pick another time.');
  if (k.trial && trialUsed(db, d.learnerId!, p.id)) fail('A free trial has already been used for this learner with this teacher.');
  const pricing = quote(db, k.id, d.mode!, d.addressId);
  const id = uid('b');
  slot.state = 'held'; slot.bookingId = id;
  const b: Booking = {
    id, ref: 'GL-' + (4000 + db.bookings.length * 7), studentAccountId: accountId, learnerId: d.learnerId!, providerId: p.id, serviceId: s.id, packageId: k.id, slotId: slot.id,
    start: slot.start, durationMin: k.durationMin, mode: d.mode!, addressId: d.mode === 'student' ? d.addressId : undefined, meetingNote: d.meetingNote, notes: d.notes,
    pricing, status: k.trial ? 'pending_confirmation' : 'awaiting_payment', history: [{ status: 'created', at: now }],
    payment: { status: k.trial ? 'free' : 'none' },
  };
  if (k.trial) { pushHist(b, 'trial_requested', now, 'Free trial request submitted'); requestNotify(db, now, b); }
  db.bookings.unshift(b);
  notify(db, now, accountId, 'student', 'bookings', 'created', 'Booking created', `${s.title} · ${fmtDateTime(b.start)}`, `/booking/${b.id}`);
  return b;
}
function requestNotify(db: DB, now: number, b: Booking) {
  const learner = db.learners.find((l) => l.id === b.learnerId)!;
  notify(db, now, teacherAcc(db, b), 'teacher', 'bookings', 'request', 'New booking request', `${learner.name} · ${fmtDateTime(b.start)} · ${b.pricing.total ? 'Paid ' + rm(b.pricing.total) : 'Free trial'}`, '/t/requests');
}
export function pay(db: DB, now: number, bookingId: string, succeed: boolean, method: string) {
  const b = db.bookings.find((x) => x.id === bookingId) ?? fail('Booking not found');
  if (!['awaiting_payment', 'payment_failed'].includes(b.status)) fail('This booking does not need payment.');
  const slot = db.slots.find((s) => s.id === b.slotId)!;
  if (slot.bookingId !== b.id || slot.state !== 'held') fail('Your slot hold expired. Please choose another time.');
  if (!succeed) {
    b.status = 'payment_failed'; b.payment = { status: 'failed', method }; pushHist(b, 'payment_failed', now, 'Card declined (simulated)');
    notify(db, now, b.studentAccountId, 'student', 'bookings', 'payment_failed', 'Payment failed', `${rm(b.pricing.total)} could not be charged. Your slot is held — retry payment.`, `/book/payment?bookingId=${b.id}`);
    return b;
  }
  b.status = 'pending_confirmation'; b.payment = { status: 'succeeded', method }; pushHist(b, 'payment_succeeded', now, `${rm(b.pricing.total)} received (simulated)`);
  notify(db, now, b.studentAccountId, 'student', 'bookings', 'payment', 'Payment received', `${rm(b.pricing.total)} · waiting for teacher confirmation`, `/book/pending/${b.id}`);
  requestNotify(db, now, b);
  return b;
}
export function teacherConfirm(db: DB, now: number, bookingId: string) {
  const b = db.bookings.find((x) => x.id === bookingId) ?? fail('Booking not found');
  if (b.status !== 'pending_confirmation') fail('Only pending requests can be confirmed.');
  b.status = 'confirmed'; pushHist(b, 'confirmed', now, 'Confirmed by teacher');
  const slot = db.slots.find((s) => s.id === b.slotId)!; slot.state = 'booked';
  const p = getProvider(db, b.providerId)!;
  notify(db, now, b.studentAccountId, 'student', 'bookings', 'confirmed', 'Booking confirmed 🎉', `${p.name} confirmed ${fmtDateTime(b.start)}`, `/book/confirmed/${b.id}`);
  return b;
}
export function cancelQuote(db: DB, now: number, bookingId: string, by: 'student' | 'teacher') {
  const b = db.bookings.find((x) => x.id === bookingId) ?? fail('Booking not found');
  const hours = (b.start - now) / HOUR;
  const paid = b.payment.status === 'succeeded' ? b.pricing.total : 0;
  const pct = by === 'teacher' || b.status === 'pending_confirmation' ? POLICY.teacherCancelRefundPct : POLICY.cancellation.find((t) => hours >= t.minHoursBefore)?.refundPct ?? 0;
  return { hours, paid, pct, amount: Math.round(paid * pct) / 100, window: hours >= 24 ? 'More than 24 hours before' : hours >= 2 ? 'Between 2 and 24 hours before' : 'Less than 2 hours before' };
}
export function cancelBooking(db: DB, now: number, bookingId: string, by: 'student' | 'teacher', reason: string) {
  const b = db.bookings.find((x) => x.id === bookingId) ?? fail('Booking not found');
  if (!['awaiting_payment', 'payment_failed', 'pending_confirmation', 'confirmed'].includes(b.status)) fail('This booking can no longer be cancelled.');
  const q = cancelQuote(db, now, bookingId, by);
  const slot = db.slots.find((s) => s.id === b.slotId); if (slot && slot.start > now) { slot.state = 'open'; slot.bookingId = undefined; }
  b.cancellation = { by, reason, at: now, refundPct: q.pct, refundAmount: q.amount };
  const declined = by === 'teacher' && b.history.every((h) => h.status !== 'confirmed');
  b.status = declined ? 'declined' : 'cancelled';
  pushHist(b, b.status, now, `${by === 'teacher' ? 'Teacher' : 'Student'} cancelled · ${reason}`);
  if (q.amount > 0) {
    b.refund = { amount: q.amount, status: 'processing', method: b.payment.method ?? 'Card', at: now };
    b.payment.status = q.pct === 100 ? 'refunded' : 'partially_refunded';
    pushHist(b, 'refund_processing', now, `${rm(q.amount)} refund (${q.pct}%)`);
  }
  const p = getProvider(db, b.providerId)!;
  notify(db, now, b.studentAccountId, 'student', 'bookings', 'cancelled', declined ? 'Request declined' : 'Booking cancelled', `${p.name} · ${fmtDateTime(b.start)}${q.amount ? ` · refund ${rm(q.amount)}` : ''}`, `/booking/${b.id}`);
  notify(db, now, p.accountId, 'teacher', 'bookings', 'cancelled', 'Booking cancelled', `${fmtDateTime(b.start)} · ${reason}`, `/t/session/${b.id}`);
  return b;
}
export const checkInWindow = (b: Booking) => ({ opens: b.start - POLICY.checkInOpensMinBefore * MIN, closes: b.start + b.durationMin * MIN });
export function checkIn(db: DB, now: number, bookingId: string, who: 'student' | 'teacher') {
  const b = db.bookings.find((x) => x.id === bookingId) ?? fail('Booking not found');
  if (!['confirmed', 'in_progress'].includes(b.status)) fail('Check-in is only available for confirmed sessions.');
  const w = checkInWindow(b);
  if (now < w.opens) fail(`Check-in opens ${POLICY.checkInOpensMinBefore} minutes before the session.`);
  if (now > w.closes) fail('The check-in window has closed.');
  if (who === 'student') b.checkInStudent ??= now; else b.checkInTeacher ??= now;
  pushHist(b, `checkin_${who}`, now, `${who === 'student' ? 'Student' : 'Teacher'} checked in`);
  if (b.status === 'confirmed') { b.status = 'in_progress'; pushHist(b, 'in_progress', now, 'Session started'); }
  const p = getProvider(db, b.providerId)!;
  if (who === 'student') notify(db, now, p.accountId, 'teacher', 'bookings', 'checkin', 'Student checked in', fmtDateTime(b.start), `/t/session/${b.id}`);
  else notify(db, now, b.studentAccountId, 'student', 'bookings', 'checkin', `${p.name} checked in`, 'Your session has started.', `/booking/checkin/${b.id}`);
  return b;
}
export function checkOut(db: DB, now: number, bookingId: string) {
  const b = db.bookings.find((x) => x.id === bookingId) ?? fail('Booking not found');
  if (b.status !== 'in_progress') fail('Check out after the session has started.');
  b.checkOut = now; b.completedAt = now; b.status = 'completed';
  pushHist(b, 'completed', now, 'Teacher checked out');
  const slot = db.slots.find((s) => s.id === b.slotId); if (slot) slot.state = 'booked';
  const earn = Math.round((b.pricing.base * (1 - PRICING.teacherCommissionRate) + b.pricing.transport) * 100) / 100;
  if (earn > 0) db.ledger.unshift({ id: uid('le'), providerId: b.providerId, bookingId: b.id, type: 'earning', amount: earn, at: now, status: 'pending', releaseAt: now + POLICY.disputeWindowHours * HOUR });
  const p = getProvider(db, b.providerId)!;
  notify(db, now, b.studentAccountId, 'student', 'bookings', 'completed', 'Session completed', `${p.name} · ${fmtDateTime(b.start)}`, `/booking/${b.id}`);
  notify(db, now + 1, b.studentAccountId, 'student', 'updates', 'review_request', `How was your session with ${p.name.split(' ')[0]}?`, 'Leave a public review.', `/booking/review/${b.id}`);
  notify(db, now, p.accountId, 'teacher', 'updates', 'earning', 'Earnings pending', `${rm(earn)} releases after the ${POLICY.disputeWindowHours}-hour dispute window.`, '/teacher/finance');
  return b;
}
export function submitReview(db: DB, now: number, bookingId: string, rating: number, tags: string[], text: string) {
  const b = db.bookings.find((x) => x.id === bookingId) ?? fail('Booking not found');
  if (b.status !== 'completed' && b.status !== 'disputed') fail('Only completed bookings can be reviewed.');
  if (rating < 1 || rating > 5) fail('Choose a star rating.');
  if (text.length > POLICY.reviewMaxChars) fail(`Reviews are limited to ${POLICY.reviewMaxChars} characters.`);
  const acc = db.accounts.find((a) => a.id === b.studentAccountId)!;
  const author = acc.name.split(' ')[0] + ' ' + (acc.name.split(' ')[1]?.[0] ?? '') + '.';
  const p = getProvider(db, b.providerId)!;
  const existing = db.reviews.find((r) => r.id === b.reviewId);
  if (existing) {
    if (existing.editableUntil && now > existing.editableUntil) fail('The 14-day edit period has ended.');
    const prevRating = existing.rating;
    Object.assign(existing, { rating, tags, text });
    p.rating = Math.round(((p.rating * p.reviewCount - prevRating + rating) / p.reviewCount) * 10) / 10;
    return existing;
  }
  const r = { id: uid('r'), providerId: b.providerId, bookingId, authorAccountId: acc.id, author, rating, tags, text, at: now, editableUntil: (b.completedAt ?? now) + POLICY.reviewEditDays * DAY };
  db.reviews.unshift(r); b.reviewId = r.id;
  p.rating = Math.round(((p.rating * p.reviewCount + rating) / (p.reviewCount + 1)) * 10) / 10; p.reviewCount += 1;
  notify(db, now, p.accountId, 'teacher', 'updates', 'review', 'New review', `${'★'.repeat(rating)} from ${author}`, '/t/reviews');
  return r;
}
export function openDispute(db: DB, now: number, bookingId: string, reason: string, details: string, evidence: string[]) {
  const b = db.bookings.find((x) => x.id === bookingId) ?? fail('Booking not found');
  if (b.status !== 'completed' || !b.completedAt || now > b.completedAt + POLICY.disputeWindowHours * HOUR) fail('Disputes can be opened within 72 hours of completion.');
  const id = uid('d');
  db.disputes.unshift({ id, bookingId, reason, details, evidence, openedAt: now, status: 'open' });
  b.disputeId = id; b.status = 'disputed'; pushHist(b, 'disputed', now, `Dispute opened · ${reason}`);
  for (const e of db.ledger) if (e.bookingId === b.id && e.type === 'earning' && e.status === 'pending') e.status = 'held';
  const p = getProvider(db, b.providerId)!;
  notify(db, now, b.studentAccountId, 'student', 'bookings', 'dispute', 'Dispute opened', 'Settlement is frozen while the case is reviewed.', `/dispute/${id}`);
  notify(db, now, p.accountId, 'teacher', 'bookings', 'dispute', 'Dispute opened on a session', `${fmtDateTime(b.start)} · earnings on hold`, '/teacher/finance');
  return id;
}
export function resolveDispute(db: DB, now: number, disputeId: string, refundPct: number) {
  const d = db.disputes.find((x) => x.id === disputeId) ?? fail('Dispute not found');
  const b = db.bookings.find((x) => x.id === d.bookingId)!;
  d.status = 'resolved'; d.refundAmount = Math.round(b.pricing.total * refundPct) / 100;
  d.outcome = refundPct === 0 ? 'Resolved in teacher\'s favour — no refund.' : `Resolved — ${refundPct}% refund to student.`;
  b.status = refundPct > 0 ? 'refunded' : 'completed'; pushHist(b, 'dispute_resolved', now, d.outcome);
  if (refundPct > 0) { b.refund = { amount: d.refundAmount, status: 'processing', method: b.payment.method ?? 'Card', at: now }; }
  for (const e of db.ledger) if (e.bookingId === b.id && e.type === 'earning' && e.status === 'held') {
    if (refundPct === 100) e.status = 'reversed';
    else { e.status = 'pending'; if (refundPct > 0) db.ledger.unshift({ id: uid('le'), providerId: b.providerId, bookingId: b.id, type: 'refund_adjustment', amount: -Math.round(e.amount * refundPct) / 100, at: now, status: 'available', note: 'Dispute refund adjustment' }); }
  }
  notify(db, now, b.studentAccountId, 'student', 'bookings', 'dispute', 'Dispute updated', d.outcome!, `/dispute/${d.id}`);
}

/** Moves the demo clock forward and runs time-based server jobs. */
export function runClockJobs(db: DB, prev: number, now: number) {
  for (const e of db.ledger) {
    if (e.type === 'earning' && e.status === 'pending' && e.releaseAt && e.releaseAt <= now) e.status = 'available';
    if (e.type === 'payout' && e.status === 'processing' && e.at + POLICY.payoutBusinessDays * DAY <= now) {
      e.status = 'paid';
      const p = getProvider(db, e.providerId)!;
      notify(db, now, p.accountId, 'teacher', 'updates', 'payout', 'Payout completed', `${rm(e.amount)} sent to ${e.note}`, '/t/payout-history');
    }
  }
  for (const b of db.bookings) {
    if (b.refund?.status === 'processing' && b.refund.at + DAY <= now) { b.refund.status = 'completed'; if (b.status === 'cancelled' || b.status === 'declined') b.status = 'refunded'; pushHist(b, 'refunded', now, `${rm(b.refund.amount)} refunded`); }
    if (b.status === 'confirmed') {
      // reminder 24h before
      if (prev < b.start - DAY && now >= b.start - DAY) notify(db, now, b.studentAccountId, 'student', 'bookings', 'reminder', 'Session reminder', `Tomorrow at ${fmtDateTime(b.start).split('· ')[1]}`, `/booking/${b.id}`);
      // neither party checked in — neutral case for review (spec inconsistency: do not attribute fault)
      if (now > b.start + b.durationMin * MIN + 15 * MIN && !b.checkInStudent && !b.checkInTeacher) { b.status = 'no_show_review'; pushHist(b, 'no_show_review', now, 'Neither party checked in — case under neutral review'); }
    }
  }
}

// ---------- availability ----------
export function addSlot(db: DB, now: number, providerId: string, start: number, end: number) {
  if (end <= start) fail('End time must be after start time.');
  if (start <= now) fail('Slots must be in the future.');
  const clash = db.slots.find((s) => s.providerId === providerId && s.state !== 'blocked' && s.start < end && start < s.end);
  if (clash) fail(`Overlaps an existing ${clash.state} slot (${fmtDateTime(clash.start)}).`);
  const s: Slot = { id: uid('sl'), providerId, start, end, state: 'open' };
  db.slots.push(s); return s;
}
export function deleteSlot(db: DB, slotId: string) {
  const s = db.slots.find((x) => x.id === slotId) ?? fail('Slot not found');
  if (s.state === 'held' || s.state === 'booked') fail('Held or booked slots cannot be deleted.');
  db.slots = db.slots.filter((x) => x.id !== slotId);
}
export function toggleBlockDay(db: DB, providerId: string, dayStart: number) {
  const ss = db.slots.filter((s) => s.providerId === providerId && s.start >= dayStart && s.start < dayStart + DAY && (s.state === 'open' || s.state === 'blocked'));
  const anyOpen = ss.some((s) => s.state === 'open');
  ss.forEach((s) => (s.state = anyOpen ? 'blocked' : 'open'));
  return anyOpen;
}

// ---------- finance ----------
export function wallet(ledger: LedgerEntry[], providerId: string) {
  const es = ledger.filter((e) => e.providerId === providerId);
  const sum = (f: (e: LedgerEntry) => boolean) => Math.round(es.filter(f).reduce((a, e) => a + e.amount, 0) * 100) / 100;
  const pending = sum((e) => e.type === 'earning' && (e.status === 'pending' || e.status === 'held'));
  const held = sum((e) => e.type === 'earning' && e.status === 'held');
  const earned = sum((e) => (e.type === 'earning' && e.status === 'available') || e.type === 'refund_adjustment');
  const outflow = sum((e) => e.type === 'payout' && ['requested', 'processing', 'paid', 'under_review'].includes(e.status));
  const withdrawn = sum((e) => e.type === 'payout' && e.status === 'paid');
  return { pending, held, available: Math.round((earned - outflow) * 100) / 100, withdrawn, inFlight: Math.round((outflow - withdrawn) * 100) / 100 };
}
export function requestPayout(db: DB, now: number, providerId: string, amount: number) {
  const p = getProvider(db, providerId)!;
  if (p.payoutOnboarding !== 'complete') fail('Complete payout onboarding first.');
  const w = wallet(db.ledger, providerId);
  if (!(amount >= POLICY.payoutMinimum)) fail(`Minimum payout is RM ${POLICY.payoutMinimum}.`);
  if (amount > w.available) fail('Amount exceeds your available balance.');
  const e: LedgerEntry = { id: uid('lp'), providerId, type: 'payout', amount, at: now, status: 'processing', note: 'Maybank •• 8812' };
  db.ledger.unshift(e);
  notify(db, now, p.accountId, 'teacher', 'updates', 'payout', 'Payout requested', `${rm(amount)} · arrives in ~${POLICY.payoutBusinessDays} business days`, '/t/payout-history');
  return e;
}
export function failLatestPayout(db: DB, now: number, providerId: string) {
  const e = db.ledger.find((x) => x.providerId === providerId && x.type === 'payout' && ['processing', 'requested', 'under_review'].includes(x.status)) ?? fail('No payout in progress to fail.');
  e.status = 'failed';
  notify(db, now, getProvider(db, providerId)!.accountId, 'teacher', 'updates', 'payout', 'Payout failed', `${rm(e.amount)} was returned to your Available balance.`, '/t/payout-history');
}

// ---------- messaging ----------
export function mask(text: string) {
  let masked = false;
  const out = text
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, () => { masked = true; return '[email hidden]'; })
    .replace(/(\+?6?0?1[\d\s-]{7,12}\d)|(\b\d{3}[\s-]?\d{3,4}[\s-]?\d{4}\b)/g, () => { masked = true; return '[phone hidden]'; })
    .replace(/(^|\s)@[A-Za-z0-9_.]{3,}/g, (m, s) => { masked = true; return `${s}[handle hidden]`; })
    .replace(/\b(wa\.me|t\.me|instagram\.com|facebook\.com|telegram)\S*/gi, () => { masked = true; return '[link hidden]'; });
  return { text: out, masked };
}
export function canStudentMessage(db: DB, accountId: string, providerId: string) {
  return db.bookings.some((b) => b.studentAccountId === accountId && b.providerId === providerId) || db.threads.some((t) => t.studentAccountId === accountId && t.providerId === providerId);
}
export function startInquiry(db: DB, now: number, accountId: string, providerId: string, packageLabel: string, text: string) {
  if (db.threads.some((t) => t.studentAccountId === accountId && t.providerId === providerId)) fail('You already have a conversation with this provider.');
  if (text.trim().length < 10) fail('Please describe what you would like to book (min 10 characters).');
  const m = mask(text);
  const t = { id: uid('t'), providerId, studentAccountId: accountId, origin: 'inquiry' as const, unreadStudent: 0, unreadTeacher: 1, messages: [
    { id: uid('m'), from: 'system' as const, text: `Booking inquiry · ${packageLabel}`, at: now },
    { id: uid('m'), from: 'student' as const, text: m.text, at: now, masked: m.masked }] };
  db.threads.unshift(t);
  const acc = db.accounts.find((a) => a.id === accountId)!;
  notify(db, now, getProvider(db, providerId)!.accountId, 'teacher', 'messages', 'message', 'New booking inquiry', `${acc.name}: ${m.text.slice(0, 60)}`, `/conversation/${t.id}`);
  return t;
}
export function inquiryLocked(db: DB, threadId: string) {
  const t = db.threads.find((x) => x.id === threadId)!;
  return t.origin === 'inquiry' && !t.bookingId && !t.messages.some((m) => m.from === 'teacher');
}
export function sendMessage(db: DB, now: number, threadId: string, from: 'student' | 'teacher', text: string, attachment?: string) {
  const t = db.threads.find((x) => x.id === threadId) ?? fail('Conversation not found');
  if (from === 'student' && inquiryLocked(db, threadId) && t.messages.filter((m) => m.from === 'student').length >= 1) fail('Wait for the provider to reply to your inquiry before sending more messages.');
  const m = mask(text);
  t.messages.push({ id: uid('m'), from, text: m.text, at: now, attachment, masked: m.masked });
  const p = getProvider(db, t.providerId)!;
  if (from === 'student') { t.unreadTeacher += 1; notify(db, now, p.accountId, 'teacher', 'messages', 'message', db.accounts.find((a) => a.id === t.studentAccountId)!.name, m.text.slice(0, 80), `/conversation/${t.id}`); }
  else { t.unreadStudent += 1; notify(db, now, t.studentAccountId, 'student', 'messages', 'message', p.name, m.text.slice(0, 80), `/conversation/${t.id}`); }
  return m.masked;
}

// ---------- teacher onboarding ----------
export function setupChecklist(db: DB, providerId: string, now: number) {
  const p = getProvider(db, providerId)!;
  const svcs = servicesOf(db, providerId, false);
  return [
    { key: 'profile', label: 'Complete Profile', done: !!(p.headline && p.about.length >= 30 && p.languages.length), href: '/t/profile-edit' },
    { key: 'service', label: 'Add Service', done: svcs.length > 0, href: '/t/services' },
    { key: 'package', label: 'Add Package', done: svcs.some((s) => packagesOf(db, s.id, false).length > 0), href: '/t/services' },
    { key: 'availability', label: 'Publish Availability', done: db.slots.some((s) => s.providerId === providerId && s.state === 'open' && s.start > now), href: '/t/availability' },
    { key: 'submit', label: 'Submit for Approval', done: ['pending', 'approved'].includes(p.approval), href: '/t/submit' },
  ];
}
export function submitForApproval(db: DB, now: number, providerId: string) {
  const list = setupChecklist(db, providerId, now).filter((c) => c.key !== 'submit');
  const missing = list.filter((c) => !c.done);
  if (missing.length) fail(`Complete first: ${missing.map((m) => m.label).join(', ')}`);
  const p = getProvider(db, providerId)!; p.approval = 'pending';
  notify(db, now, p.accountId, 'teacher', 'updates', 'approval', 'Submitted for review', 'We usually review new profiles within 2 business days.', '/t/approval');
}
export function setApproval(db: DB, now: number, providerId: string, approval: Provider['approval'], note?: string) {
  const p = getProvider(db, providerId)!; p.approval = approval; p.changesNote = note;
  const text: Record<string, string> = { approved: 'You can now receive bookings.', rejected: 'Your profile was not approved.', changes_requested: note ?? 'Please update your profile.', pending: 'Under review.', incomplete: 'Complete your setup.' };
  notify(db, now, p.accountId, 'teacher', 'updates', 'approval', `Approval: ${approval.replace('_', ' ')}`, text[approval], '/t/approval');
}
