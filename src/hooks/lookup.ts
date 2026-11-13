import type { DB } from '@/mocks/data/seed';
import { categoryOf, skillOf } from '@/mocks/services/api';
import type { Booking, Mode } from '@/mocks/types';

export function bookingView(db: DB, b: Booking) {
  const provider = db.providers.find((p) => p.id === b.providerId)!;
  const service = db.services.find((s) => s.id === b.serviceId)!;
  const pkg = db.packages.find((k) => k.id === b.packageId)!;
  const learner = db.learners.find((l) => l.id === b.learnerId)!;
  const student = db.accounts.find((a) => a.id === b.studentAccountId)!;
  const address = db.addresses.find((a) => a.id === b.addressId);
  const skill = skillOf(service.skillId);
  const category = categoryOf(skill?.categoryId);
  return { provider, service, pkg, learner, student, address, skill, category };
}
export const modeIcon = (m: Mode) => (m === 'online' ? 'monitor' : m === 'provider' ? 'home' : 'pin');
export const modeLabel = (m: Mode, teacherView = false) => (m === 'online' ? 'Online' : m === 'provider' ? (teacherView ? 'At your studio' : "At provider's location") : teacherView ? "At student's location" : 'At your location');
export const isUpcoming = (b: Booking, now: number) => ['awaiting_payment', 'payment_failed', 'pending_confirmation', 'confirmed', 'in_progress'].includes(b.status) && b.start + b.durationMin * 60000 > now - 60 * 60000;
export const isCancelled = (b: Booking) => ['cancelled', 'declined', 'refunded'].includes(b.status) && !!b.cancellation;
