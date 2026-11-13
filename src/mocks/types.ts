export type Lang = 'en' | 'ms' | 'zh';
export type Role = 'student' | 'teacher';
export type Mode = 'online' | 'provider' | 'student'; // provider = at provider's location, student = at student's location
export type OfferingType = 'skill' | 'service'; // 'hire' reserved, not exposed
export type Approval = 'incomplete' | 'pending' | 'changes_requested' | 'approved' | 'rejected';

export interface Category { id: string; label: string; short: string; icon: string; tint: string; fg: string }
export interface Skill { id: string; categoryId: string; label: string }

export interface Provider {
  id: string; accountId: string; name: string; headline: string; skillIds: string[]; categoryId: string;
  photo?: string; hero?: string; initials: string;
  rating: number; reviewCount: number; dx: number; dy: number; area: string;
  about: string; languages: string[]; years: number; credentials: string[]; tags: string[];
  approval: Approval; active: boolean; suspended: boolean; bookable: boolean;
  reliability: number; completedSessions: number; responseRate: number; students: number;
  serviceRadiusKm: number; videoIntro?: { durationSec: number; moderated: boolean };
  tier: 'Hatchling' | 'Loyalist' | 'Explorer'; payoutOnboarding: 'not_started' | 'incomplete' | 'complete';
  changesNote?: string;
}
export interface Service { id: string; providerId: string; skillId: string; title: string; description: string; modes: Mode[]; active: boolean; offeringType: OfferingType }
export interface Package { id: string; serviceId: string; label: string; description: string; durationMin: number; price: number; currency: 'MYR'; trial: boolean; active: boolean }
export type SlotState = 'open' | 'held' | 'booked' | 'blocked';
export interface Slot { id: string; providerId: string; start: number; end: number; state: SlotState; bookingId?: string }

export interface Account { id: string; name: string; email: string; phone?: string; verified: boolean; providerId?: string; studentEnabled: boolean; avatar?: string }
export interface Learner { id: string; accountId: string; name: string; relation: 'self' | 'child'; dob?: string; notes?: string }
export interface Address { id: string; accountId: string; label: string; line1: string; line2?: string; area: string; dx: number; dy: number; isDefault: boolean }
export interface PaymentMethod { id: string; accountId: string; brand: string; last4: string; expiry: string; isDefault: boolean }

export type BookingStatus =
  | 'awaiting_payment' | 'payment_failed' | 'pending_confirmation' | 'confirmed' | 'in_progress'
  | 'completed' | 'cancelled' | 'refunded' | 'disputed' | 'no_show_review' | 'declined';

export interface Pricing { base: number; transport: number; serviceFee: number; total: number; lines: { label: string; amount: number; note?: string }[] }
export interface Booking {
  id: string; ref: string; studentAccountId: string; learnerId: string; providerId: string; serviceId: string; packageId: string; slotId: string;
  start: number; durationMin: number; mode: Mode; addressId?: string; meetingNote?: string; notes?: string;
  pricing: Pricing; status: BookingStatus; history: { status: BookingStatus | string; at: number; note?: string }[];
  payment: { status: 'none' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded' | 'free'; method?: string };
  checkInStudent?: number; checkInTeacher?: number; checkOut?: number; completedAt?: number;
  reviewId?: string; disputeId?: string;
  cancellation?: { by: 'student' | 'teacher'; reason: string; at: number; refundPct: number; refundAmount: number };
  refund?: { amount: number; status: 'requested' | 'processing' | 'completed'; method: string; at: number };
  learnerRating?: { reliability: number; punctuality: number; respect: number };
}
export interface Dispute { id: string; bookingId: string; reason: string; details: string; evidence: string[]; openedAt: number; status: 'open' | 'under_review' | 'resolved'; outcome?: string; refundAmount?: number }

export interface Message { id: string; from: 'student' | 'teacher' | 'system'; text: string; at: number; attachment?: string; masked?: boolean }
export interface Thread { id: string; providerId: string; studentAccountId: string; bookingId?: string; messages: Message[]; unreadStudent: number; unreadTeacher: number; origin: 'booking' | 'inquiry' }

export type NotifGroup = 'bookings' | 'messages' | 'updates';
export interface Notification { id: string; accountId: string; role: Role; group: NotifGroup; kind: string; title: string; body: string; at: number; read: boolean; href: string }

export interface Review { id: string; providerId: string; bookingId?: string; authorAccountId?: string; author: string; rating: number; tags: string[]; text: string; at: number; editableUntil?: number }
export interface Post { id: string; providerId: string; text: string; image?: string; at: number; status: 'published' | 'draft' | 'hidden' }
export interface Material { id: string; providerId: string; learnerId: string; bookingId?: string; title: string; body: string; attachment?: string; at: number; kind: 'material' | 'progress' | 'session_note' }

export type LedgerType = 'earning' | 'payout' | 'refund_adjustment';
export interface LedgerEntry {
  id: string; providerId: string; bookingId?: string; type: LedgerType; amount: number; at: number;
  // earnings: pending -> available (after 72h dispute window) | held (dispute) | reversed (refund)
  // payouts: requested -> processing -> paid | failed | under_review
  status: 'pending' | 'available' | 'held' | 'reversed' | 'requested' | 'processing' | 'paid' | 'failed' | 'under_review';
  releaseAt?: number; note?: string;
}
export interface Task { id: string; providerId: string; title: string; due: number; done: boolean }
export interface Report { id: string; target: string; targetId: string; reason: string; details?: string; at: number }

export interface Area { id: string; name: string; city: string; dx: number; dy: number }
