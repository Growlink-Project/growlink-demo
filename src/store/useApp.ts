import { create } from 'zustand';
import { AREAS, createSeed, DB, DEMO_START } from '@/mocks/data/seed';
import * as api from '@/mocks/services/api';
import type { Lang, Mode, Role } from '@/mocks/types';
import { DAY, HOUR, myt } from '@/lib/time';

export type SheetSnap = 'collapsed' | 'default' | 'full';
export interface Filters {
  categoryId?: string; skillId?: string; online: boolean; offeringType?: 'skill' | 'service'; modes: Mode[];
  radiusKm: number; priceMax?: number; minRating?: number; availability: 'any' | 'today' | 'week' | 'weekend';
  sort: 'recommended' | 'distance' | 'rating' | 'price';
}
export const DEFAULT_FILTERS: Filters = { online: false, modes: [], radiusKm: 3, availability: 'any', sort: 'recommended' };

interface Demo { emptyNearby: boolean; networkFail: boolean; nextPaymentFails: boolean; reduceMotion: boolean }
interface State {
  db: DB; now: number; version: number;
  authed: boolean; accountId: string; role: Role; lang: Lang;
  locationPermission: 'unknown' | 'granted' | 'denied' | 'unavailable';
  areaId: string; userPos: { dx: number; dy: number }; searchCenter: { dx: number; dy: number };
  camera: { cx: number; cy: number; zoom: number }; mapMoved: boolean;
  filters: Filters; query: string; recentSearches: string[]; recentAreas: string[];
  selectedProviderId?: string; sheet: SheetSnap;
  draft?: api.Draft; draftNotes: string;
  blocked: string[]; saved: string[]; following: string[];
  demo: Demo; toast?: { text: string; kind: 'ok' | 'error'; id: number };
  setupTeacherProviderId?: string; defaultLearnerId?: string;
}
type Result<T = unknown> = { ok: true; value: T } | { ok: false; error: string };

interface Actions {
  set: (p: Partial<State>) => void;
  run: <T>(fn: (db: DB, now: number) => T, success?: string) => Result<T>;
  showToast: (text: string, kind?: 'ok' | 'error') => void;
  setFilters: (p: Partial<Filters>) => void; clearFilters: () => void;
  setArea: (id: string) => void; searchThisArea: () => void; recenter: () => void;
  advance: (ms: number) => void; setNow: (ms: number) => void; reset: () => void;
  signIn: (accountId: string, role: Role) => void; switchRole: (role: Role) => void;
  toggle: (key: 'saved' | 'following' | 'blocked', id: string) => void;
}

const init = (): State => ({
  db: createSeed(), now: DEMO_START, version: 0,
  authed: false, accountId: 'acc_aisyah', role: 'student', lang: 'en', locationPermission: 'unknown',
  areaId: 'sungai-way', userPos: { dx: 0, dy: 0 }, searchCenter: { dx: 0, dy: 0 },
  camera: { cx: 0, cy: 0, zoom: 0.16 }, mapMoved: false,
  filters: { ...DEFAULT_FILTERS }, query: '', recentSearches: ['violin', 'maths tuition', 'aircon'], recentAreas: ['kelana-jaya', 'ss2'],
  sheet: 'default', draftNotes: '', blocked: [], saved: ['p_farah'], following: ['p_meiling'],
  demo: { emptyNearby: false, networkFail: false, nextPaymentFails: false, reduceMotion: false },
});
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export const useApp = create<State & Actions>((set, get) => ({
  ...init(),
  set: (p) => set(p as State),
  run: (fn, success) => {
    const draft = clone(get().db);
    try {
      const value = fn(draft, get().now);
      set((s) => ({ db: draft, version: s.version + 1 }));
      if (success) get().showToast(success);
      return { ok: true, value };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      get().showToast(msg, 'error');
      return { ok: false, error: msg };
    }
  },
  showToast: (text, kind = 'ok') => set({ toast: { text, kind, id: Date.now() } }),
  setFilters: (p) => set((s) => ({ filters: { ...s.filters, ...p }, selectedProviderId: undefined })),
  clearFilters: () => set((s) => ({ filters: { ...DEFAULT_FILTERS, radiusKm: s.filters.radiusKm }, query: '' })),
  setArea: (id) => {
    const a = AREAS.find((x) => x.id === id)!;
    set((s) => ({ areaId: id, userPos: { dx: a.dx, dy: a.dy }, searchCenter: { dx: a.dx, dy: a.dy }, camera: { ...s.camera, cx: a.dx, cy: a.dy }, mapMoved: false, selectedProviderId: undefined,
      recentAreas: [id, ...s.recentAreas.filter((r) => r !== id)].slice(0, 4) }));
  },
  searchThisArea: () => set((s) => ({ searchCenter: { dx: s.camera.cx, dy: s.camera.cy }, mapMoved: false, version: s.version + 1 })),
  recenter: () => set((s) => ({ camera: { ...s.camera, cx: s.userPos.dx, cy: s.userPos.dy }, searchCenter: { ...s.userPos }, mapMoved: false })),
  advance: (ms) => get().setNow(get().now + ms),
  setNow: (ms) => {
    const prev = get().now; const db = clone(get().db);
    api.runClockJobs(db, prev, ms);
    set((s) => ({ now: ms, db, version: s.version + 1 }));
  },
  reset: () => set({ ...init(), authed: get().authed }),
  signIn: (accountId, role) => set({ authed: true, accountId, role, selectedProviderId: undefined, draft: undefined }),
  switchRole: (role) => set({ role }),
  toggle: (key, id) => set((s) => ({ [key]: s[key].includes(id) ? s[key].filter((x) => x !== id) : [...s[key], id] }) as Partial<State>),
}));

// ---------- selectors ----------
export const useDB = () => useApp((s) => s.db);
export const useNow = () => useApp((s) => s.now);
export const useAccount = () => useApp((s) => s.db.accounts.find((a) => a.id === s.accountId)!);
export const useMyProvider = () => useApp((s) => { const a = s.db.accounts.find((x) => x.id === s.accountId)!; return a.providerId ? s.db.providers.find((p) => p.id === a.providerId) : undefined; });

export function searchParams(s: State): api.SearchParams {
  return { ...s.filters, center: s.searchCenter, userPos: s.userPos, query: s.query, blocked: s.blocked, now: s.now };
}
/** Mock query layer (TanStack-style): simulated latency + failure, keyed on params. */
export async function fetchDiscovery(s: State) {
  await new Promise((r) => setTimeout(r, 350));
  if (s.demo.networkFail) throw new Error('Network unavailable');
  if (s.demo.emptyNearby) return [];
  return api.searchProviders(s.db, searchParams(s));
}

export const DEMO = { mainDate: myt(2026, 11, 18, 10, 30), DAY, HOUR };
