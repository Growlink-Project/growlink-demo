# Growlink v2.1 — Interactive Mobile Prototype

Expo SDK 58 · React Native 0.88 · TypeScript · Expo Router · Zustand · TanStack Query · React Hook Form + Zod.
Prototype-first: all data and server operations are mocked; no backend, payment or map API keys required.

## Run

```bash
npm install
npx expo start          # press i (iOS), a (Android) or w (web)
npm run typecheck       # tsc --noEmit
npm run export:web      # static web build in dist/
```

Sign in with **Use demo account · Aisyah** (student) or **Demo teacher · Mei Ling**.

## Prototype Lab (DEMO ONLY)

Small translucent tab on the right edge of every screen once signed in. It lets you switch accounts/roles,
toggle location permission, empty results, network failure, payment failure, force booking states,
approve teachers, fail payouts, advance the demo clock and reset data. It also has a screen directory (A01–H07).

### 22-step demo journey
Home → **Music** → tap Mei Ling's pin → View Profile → Book a Lesson → *Regular 60-minute Lesson* → Myself →
In-Person → Wed 18 Nov 10:30 AM → Proceed to Pay → Pay → *Pending confirmation* → Lab: **Mei Ling · Teacher** →
"booking requests to confirm" → Confirm → Lab: **Aisyah · Student** → Bookings (Confirmed) →
Lab: **Jump to 10 min before GL-…** → Home card **Check In** → Lab: Mei Ling → View Session → Check Out →
Lab: Aisyah → Bookings › Past → Leave a review → Lab: **+73 h** → Mei Ling → Finance (Available) → Request Payout.

## Structure

```
src/app/            Expo Router routes (thin re-exports; student/ and teacher/ are tab groups, t/ = teacher stack)
src/features/       Screens by domain: auth, discovery, providers, booking, messaging, settings, teacher, finance, lab
src/components/     ui/ (core system + icons), cards/, discovery/ (MapCanvas, markers, DraggableBottomSheet), navigation/
src/mocks/          data/seed.ts (Malaysian demo data), services/api.ts (authoritative mock operations), services/config.ts
src/store/useApp.ts Single Zustand store; all mutations go through `run(fn)` → mock service
src/theme/          tokens.ts, typography.ts
src/i18n/           EN / BM / 中文 strings for navigation, CTAs, statuses and key screens
```

## Integration boundaries
- `mocks/services/api.ts` mirrors future Supabase RPCs (createBooking, pay, teacherConfirm, cancelBooking, checkIn,
  checkOut, openDispute, requestPayout, …). UI never mutates money, status or slots directly.
- `components/discovery/MapCanvas.tsx` is a locally rendered map; replace with react-native-maps (Google provider)
  keeping the same `results / onSelect` contract.
- Wallet balances are derived from ledger entries (`wallet()`), never stored.

## Assumptions to confirm against Spec v2.0
- Platform commission on teacher earnings: **10%** (`PRICING.teacherCommissionRate`).
- Student service fee: **0** (no fee line shown).
- Transport fee (at-student-location only): **RM2/km, min RM10**.
- Neither-party check-in → neutral `no_show_review` (no fault assigned).
- Growly: only the supplied bear mark was available; moods are expressed with small accents, not a redrawn character.
