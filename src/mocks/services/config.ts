/**
 * Mock authoritative pricing / policy configuration.
 * Every fee shown in the UI must be produced from these values by the mock booking service.
 * Values marked ASSUMPTION are prototype placeholders pending confirmation against Product Spec v2.0.
 */
export const PRICING = {
  serviceFeeRate: 0, // no student-facing platform fee in this prototype
  transport: { appliesToMode: 'student' as const, perKm: 2, minimum: 10, roundTo: 1 }, // ASSUMPTION
  teacherCommissionRate: 0.1, // ASSUMPTION: platform commission deducted from teacher earnings
};
export const POLICY = {
  cancellation: [
    { minHoursBefore: 24, refundPct: 100 },
    { minHoursBefore: 2, refundPct: 50 },
    { minHoursBefore: 0, refundPct: 0 },
  ],
  teacherCancelRefundPct: 100,
  disputeWindowHours: 72,
  reviewEditDays: 14,
  checkInOpensMinBefore: 30,
  payoutMinimum: 50,
  payoutBusinessDays: 2,
  maxVideoIntroSec: 60,
  reviewMaxChars: 500,
};
