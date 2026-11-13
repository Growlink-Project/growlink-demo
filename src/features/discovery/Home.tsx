import React, { useMemo, useState } from 'react';
import { FlatList, LayoutChangeEvent, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, elevation, radius } from '@/theme/tokens';
import { BearLogo, CategoryChip, EmptyState, ErrorState, FilterChip, IconButton, Loading, Pill, PrimaryButton, Rating, Row, SecondaryButton, SkillChip, T, TextLink, Avatar } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { CompactProviderCard, HScroll, ProviderCard, SearchField } from '@/components/cards';
import { MapCanvas } from '@/components/discovery/MapCanvas';
import { DraggableBottomSheet, snapHeights } from '@/components/discovery/DraggableBottomSheet';
import { DEFAULT_FILTERS, fetchDiscovery, searchParams, useApp } from '@/store/useApp';
import { AREAS, CATEGORIES, SKILLS } from '@/mocks/data/seed';
import { categoryOf, checkInWindow, localCategories, Result, searchProviders } from '@/mocks/services/api';
import { useT } from '@/i18n';
import { dist, fmtDate, fmtTime, rm0 } from '@/lib/time';
import { firstName } from '@/lib/time';
import { bookingView, isUpcoming, modeIcon, modeLabel } from '@/hooks/lookup';

export function activeFilterCount(f = useApp.getState().filters) {
  return [f.categoryId, f.skillId, f.online || undefined, f.offeringType, f.modes.length || undefined, f.radiusKm !== DEFAULT_FILTERS.radiusKm || undefined, f.priceMax, f.minRating, f.availability !== 'any' || undefined, f.sort !== 'recommended' || undefined].filter(Boolean).length;
}
export function useDiscovery() {
  const s = useApp();
  const key = ['discovery', s.version, s.searchCenter, s.filters, s.query, s.blocked, s.demo.emptyNearby, s.demo.networkFail, s.now];
  return useQuery({ queryKey: key, queryFn: () => fetchDiscovery(useApp.getState()), placeholderData: keepPreviousData });
}

export default function StudentHome() {
  const t = useT(); const insets = useSafeAreaInsets();
  const st = useApp(); const { filters, sheet, selectedProviderId, db, now, demo } = st;
  const q = useDiscovery(); const results = q.data ?? [];
  const [region, setRegion] = useState(560);
  const area = AREAS.find((a) => a.id === st.areaId)!;
  const unread = db.notifications.some((n) => n.accountId === st.accountId && n.role === 'student' && !n.read);
  // Quick-filter categories derive from local supply ignoring the current category choice (so pills stay stable)
  const pillCats = useMemo(() => demo.emptyNearby ? [] : localCategories(searchProviders(db, { ...searchParams(st), categoryId: undefined, skillId: undefined }), db), [db, st.searchCenter, filters.online, st.query, st.blocked, now, demo.emptyNearby]);
  const selected = results.find((r) => r.provider.id === selectedProviderId);
  const upcoming = db.bookings.filter((b) => b.studentAccountId === st.accountId && isUpcoming(b, now) && b.status !== 'payment_failed' && b.status !== 'awaiting_payment').sort((a, b) => a.start - b.start)[0];

  const select = (id: string, center = false) => {
    const r = results.find((x) => x.provider.id === id);
    st.set({ selectedProviderId: id, sheet: sheet === 'collapsed' ? 'default' : sheet, ...(center && r ? { camera: { ...st.camera, cx: r.provider.dx, cy: r.provider.dy + 120 } } : {}) });
  };
  const H = snapHeights(region);
  const sheetH = H[sheet];

  const header = (
    <View style={[h.header, { paddingTop: insets.top + 6 }]}>
      <Row style={{ justifyContent: 'space-between' }}>
        <BearLogo size={30} />
        <Pressable accessibilityRole="button" accessibilityLabel={`Location: ${area.name}, ${area.city}. Change location`} onPress={() => router.push('/location')} style={h.area}>
          {st.locationPermission === 'denied' ? <Icon name="pin" size={15} color={colors.muted} /> : null}
          <T v="strong" numberOfLines={1} style={{ fontSize: 15.5, flexShrink: 1 }}>{area.name}, {area.city}</T><Icon name="chevron-down" size={16} />
        </Pressable>
        <IconButton name="bell" label={`Notifications${unread ? ', unread' : ''}`} badge={unread} onPress={() => router.push('/notifications')} />
      </Row>
      <View style={{ marginTop: 8 }}><SearchField placeholder={t('home.search')} value={st.query} onFocusPress={() => router.push('/search')} onFilter={() => router.push('/filters')} filterCount={activeFilterCount(filters)} /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 18, paddingVertical: 10 }} style={{ marginHorizontal: -18 }}>
        <FilterChip label={t('home.all')} icon="grid" active={!filters.categoryId && !filters.online} onPress={() => st.setFilters({ categoryId: undefined, skillId: undefined, online: false })} />
        <FilterChip label={t('home.online')} icon="monitor" active={filters.online} onPress={() => st.setFilters({ online: !filters.online })} />
        {pillCats.map((c) => <FilterChip key={c.id} label={c.short} icon={c.icon} iconColor={c.fg} active={filters.categoryId === c.id} onPress={() => st.setFilters({ categoryId: filters.categoryId === c.id ? undefined : c.id, skillId: undefined })} />)}
        {filters.skillId ? <FilterChip label={SKILLS.find((x) => x.id === filters.skillId)!.label} active onPress={() => st.setFilters({ skillId: undefined })} /> : null}
      </ScrollView>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {header}
      <View style={{ flex: 1 }} onLayout={(e: LayoutChangeEvent) => setRegion(e.nativeEvent.layout.height)}>
        <MapCanvas results={results} bottomInset={sheet === 'full' ? H.default : sheetH} onSelect={(id) => select(id)} />
        {/* Map controls */}
        {sheet !== 'full' ? (
          <View style={[h.controls, { bottom: sheetH + (upcoming && !selected ? 86 : 14) }]}>
            <IconButton tone="surface" name="plus" label="Zoom in" onPress={() => st.set({ camera: { ...st.camera, zoom: Math.min(0.5, st.camera.zoom * 1.4) }, mapMoved: true })} />
            <IconButton tone="surface" name="minus" label="Zoom out" onPress={() => st.set({ camera: { ...st.camera, zoom: Math.max(0.02, st.camera.zoom / 1.4) }, mapMoved: true })} />
            <IconButton tone="surface" name="locate" label="Recenter on my location" onPress={st.recenter} />
          </View>
        ) : null}
        {st.mapMoved && sheet !== 'full' ? (
          <Pressable accessibilityRole="button" onPress={st.searchThisArea} style={h.searchArea}><Icon name="refresh" size={16} color="#fff" /><T v="strong" color="#fff" style={{ fontSize: 13.5 }}>{t('home.searchArea')}</T></Pressable>
        ) : null}
        {/* Upcoming booking card sits immediately above the sheet */}
        {upcoming && sheet !== 'full' ? <UpcomingCard id={upcoming.id} minimized={!!selected} bottom={sheetH + 10} /> : null}
        <DraggableBottomSheet container={region} snap={sheet} onSnap={(s) => st.set({ sheet: s })}
          header={<SheetHeader count={results.length} loading={q.isFetching && !q.data} />}>
          <SheetBody snap={sheet} q={q} results={results} selected={selected} onSelect={(id) => select(id, true)} />
        </DraggableBottomSheet>
      </View>
    </View>
  );
}

function SheetHeader({ count, loading }: { count: number; loading: boolean }) {
  const t = useT(); const sheet = useApp((s) => s.sheet); const set = useApp((s) => s.set); const area = AREAS.find((a) => a.id === useApp.getState().areaId)!;
  const radiusKm = useApp((s) => s.filters.radiusKm);
  if (sheet === 'collapsed') return (
    <View style={{ paddingHorizontal: 18, paddingBottom: 10 }}>
      <T v="section">{loading ? 'Searching…' : t('home.results', { n: count })}</T>
      <T v="caption">Drag up or tap the arrow to browse · within {radiusKm} km of {area.name}</T>
    </View>
  );
  if (sheet === 'full') return (
    <Row style={{ paddingHorizontal: 18, paddingBottom: 6, justifyContent: 'space-between' }}>
      <IconButton tone="soft" name="chevron-down" label="Collapse to preview" onPress={() => set({ sheet: 'default' })} />
      <T v="screenTitle">{t('home.exploreNearby')}</T>
      <IconButton tone="soft" name="sliders" label="Filters" onPress={() => router.push('/filters')} />
    </Row>
  );
  return null;
}

function SheetBody({ snap, q, results, selected, onSelect }: { snap: string; q: ReturnType<typeof useDiscovery>; results: Result[]; selected?: Result; onSelect: (id: string) => void }) {
  const t = useT(); const st = useApp();
  if (snap === 'collapsed') return null;
  const state = q.isError ? 'error' : q.isLoading ? 'loading' : results.length === 0 ? 'empty' : 'ok';
  const stateView = state === 'error' ? <ErrorState title="Can't load providers" body="Check your connection and try again." onRetry={() => { st.set({ demo: { ...st.demo, networkFail: false } }); q.refetch(); }} />
    : state === 'loading' ? <Loading label="Finding providers near you…" /> : state === 'empty' ? <DiscoveryEmpty /> : null;

  if (snap === 'full') return <FullResults results={results} stateView={stateView} onSelect={onSelect} />;
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
      {selected ? <ProviderPreview r={selected} /> : null}
      {!selected ? (
        <>
          <Row style={{ justifyContent: 'space-between', marginBottom: 10, marginTop: 2 }}>
            <T v="section">{t('home.nearby')}</T>
            {state === 'ok' ? <TextLink title={t('common.seeAll')} icon="chevron-right" onPress={() => st.set({ sheet: 'full' })} /> : null}
          </Row>
          {stateView ?? (
            <HScroll>{results.slice(0, 8).map((r) => <CompactProviderCard key={r.provider.id} r={r} selected={st.selectedProviderId === r.provider.id} onPress={() => onSelect(r.provider.id)} />)}</HScroll>
          )}
        </>
      ) : null}
      <Row style={{ justifyContent: 'space-between', marginTop: 18, marginBottom: 10 }}>
        <T v="section">{t('home.explore')}</T>
        <TextLink title={t('common.seeAll')} icon="chevron-right" onPress={() => router.push('/categories')} />
      </Row>
      <HScroll gap={6}>
        {CATEGORIES.map((c) => <CategoryChip key={c.id} label={c.short} icon={c.icon} tint={c.tint} fg={c.fg} onPress={() => router.push(`/categories?open=${c.id}`)} />)}
        <CategoryChip label={t('home.more')} icon="more" tint={colors.soft} fg={colors.muted} onPress={() => router.push('/categories')} />
      </HScroll>
    </ScrollView>
  );
}

function FullResults({ results, stateView, onSelect }: { results: Result[]; stateView: React.ReactNode; onSelect: (id: string) => void }) {
  const t = useT(); const st = useApp(); const [within, setWithin] = useState('');
  const cat = categoryOf(st.filters.categoryId);
  const list = results.filter((r) => !within || `${r.provider.name} ${r.provider.headline}`.toLowerCase().includes(within.toLowerCase()));
  const sorts = [['recommended', 'Recommended'], ['distance', 'Nearest first'], ['rating', 'Top rated'], ['price', 'Lowest price']] as const;
  const area = AREAS.find((a) => a.id === st.areaId)!;
  return (
    <View style={{ flex: 1 }}>
      <FlatList data={stateView ? [] : list} keyExtractor={(r) => r.provider.id} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 90 }}
        ListHeaderComponent={
          <View>
            <SearchField placeholder="Search within results" value={within} onChangeText={setWithin} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 10 }}>
              <FilterChip label="All" icon="grid" active={!st.filters.categoryId} onPress={() => st.setFilters({ categoryId: undefined, skillId: undefined })} />
              {CATEGORIES.map((c) => <FilterChip key={c.id} label={c.short} icon={c.icon} iconColor={c.fg} active={st.filters.categoryId === c.id} onPress={() => st.setFilters({ categoryId: c.id, skillId: undefined })} />)}
            </ScrollView>
            {cat ? <Row gap={6} wrap style={{ marginBottom: 8 }}>{SKILLS.filter((s) => s.categoryId === cat.id).map((s) => <SkillChip key={s.id} label={s.label} active={st.filters.skillId === s.id} onPress={() => st.setFilters({ skillId: st.filters.skillId === s.id ? undefined : s.id })} />)}</Row> : null}
            <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <T v="body" style={{ flex: 1 }}><T v="strong" style={{ fontSize: 13 }}>{list.length} providers</T> within {st.filters.radiusKm} km of {area.name}</T>
              <Pressable accessibilityRole="button" accessibilityLabel="Change sort order" onPress={() => { const i = sorts.findIndex((x) => x[0] === st.filters.sort); st.setFilters({ sort: sorts[(i + 1) % sorts.length][0] }); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36 }}>
                <T v="bodyMuted">{sorts.find((x) => x[0] === st.filters.sort)![1]}</T><Icon name="chevron-down" size={14} color={colors.muted} />
              </Pressable>
            </Row>
            {stateView}
          </View>
        }
        renderItem={({ item }) => <ProviderCard r={item} selected={st.selectedProviderId === item.provider.id} onPress={() => router.push(`/provider/${item.provider.id}`)} />}
        ListEmptyComponent={!stateView ? <EmptyState title="No matches in these results" body="Try a different name or clear the search." /> : undefined}
      />
      <Pressable accessibilityRole="button" onPress={() => st.set({ sheet: 'default' })} style={h.showMap}><Icon name="map" size={18} color="#fff" /><T v="strong" color="#fff">{t('home.showMap')}</T></Pressable>
    </View>
  );
}

function ProviderPreview({ r }: { r: Result }) {
  const t = useT(); const st = useApp(); const p = r.provider; const cat = categoryOf(p.categoryId)!;
  const svc = st.db.services.find((s) => s.providerId === p.id && s.active);
  return (
    <View style={h.preview} accessibilityLabel={`Selected provider ${p.name}`}>
      <Row gap={12} style={{ alignItems: 'flex-start' }}>
        <Avatar photo={p.photo} initials={p.initials} size={76} rounded="tile" />
        <View style={{ flex: 1, gap: 3 }}>
          <T v="strong" style={{ fontSize: 16.5 }}>{p.name}</T>
          <T v="bodyMuted" numberOfLines={1}>{cat.short} · {svc?.title}</T>
          <Row gap={8}><Rating rating={p.rating} count={p.reviewCount} /><T v="bodyMuted">· {dist(r.distance)}</T></Row>
          <Row gap={6} wrap>{r.modes.map((m) => <Pill key={m} icon={modeIcon(m)} text={m === 'online' ? 'Online' : m === 'provider' ? 'Studio' : 'Home visit'} />)}</Row>
        </View>
        <IconButton name="close" size={18} label="Close preview" tone="soft" onPress={() => st.set({ selectedProviderId: undefined })} />
      </Row>
      <Row style={{ justifyContent: 'space-between', marginTop: 12 }}>
        <View><T v="caption">Starting from</T><T v="price">{r.from != null ? rm0(r.from) : '—'}</T></View>
        <View style={{ alignItems: 'flex-end' }}><T v="caption">Next available</T><T v="strong" style={{ fontSize: 13 }}>{r.next ? `${fmtDate(r.next.start)}, ${fmtTime(r.next.start)}` : '—'}</T></View>
      </Row>
      <PrimaryButton title={t('home.viewProfile')} onPress={() => router.push(`/provider/${p.id}`)} style={{ marginTop: 12 }} />
    </View>
  );
}

function UpcomingCard({ id, minimized, bottom }: { id: string; minimized: boolean; bottom: number }) {
  const t = useT(); const db = useApp((s) => s.db); const now = useApp((s) => s.now);
  const b = db.bookings.find((x) => x.id === id)!; const v = bookingView(db, b);
  const w = checkInWindow(b); const canCheckIn = ['confirmed', 'in_progress'].includes(b.status) && now >= w.opens && now <= w.closes && !b.checkInStudent;
  if (minimized) return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${t('home.upcoming')}: ${v.pkg.label}, ${fmtDate(b.start)}`} onPress={() => router.push(`/booking/${b.id}`)} style={[h.upMini, { bottom }]}>
      <Icon name="calendar" size={16} color={colors.forest} /><T v="strong" style={{ fontSize: 12.5 }}>{fmtDate(b.start)} · {fmtTime(b.start)}</T>
    </Pressable>
  );
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${t('home.upcoming')}: ${v.pkg.label} with ${v.provider.name}, ${fmtDate(b.start)} ${fmtTime(b.start)}`} onPress={() => router.push(canCheckIn ? `/booking/checkin/${b.id}` : `/booking/${b.id}`)} style={[h.upcoming, { bottom }]}>
      <View style={h.upIcon}><Icon name={canCheckIn ? 'checkin' : 'calendar'} size={20} color={colors.forest} /></View>
      <View style={{ flex: 1 }}>
        <T v="caption" color={colors.link} style={{ fontFamily: 'Inter_600SemiBold' }}>{canCheckIn ? 'SESSION STARTING · CHECK IN NOW' : t('home.upcoming').toUpperCase()}{b.status === 'pending_confirmation' ? ' · AWAITING CONFIRMATION' : ''}</T>
        <T v="strong" numberOfLines={1} style={{ fontSize: 14 }}>{v.service.title} · {firstName(v.provider.name)}</T>
        <Row gap={6}><T v="caption" color={colors.ink}>{fmtDate(b.start)} · {fmtTime(b.start)}</T><Icon name={modeIcon(b.mode)} size={12} color={colors.muted} /><T v="caption" numberOfLines={1} style={{ flexShrink: 1 }}>{modeLabel(b.mode)}</T></Row>
      </View>
      {canCheckIn ? <View style={h.checkBtn}><T v="strong" color="#fff" style={{ fontSize: 12.5 }}>{t('home.checkIn')}</T></View> : <Icon name="chevron-right" size={20} color={colors.muted} />}
    </Pressable>
  );
}

function DiscoveryEmpty() {
  const st = useApp(); const hasFilters = activeFilterCount(st.filters) > 0 || !!st.query;
  const noOpen = !hasFilters && !st.demo.emptyNearby && st.db.providers.some((p) => p.approval === 'approved' && Math.hypot(p.dx - st.searchCenter.dx, p.dy - st.searchCenter.dy) < st.filters.radiusKm * 1000);
  if (st.locationPermission === 'denied' && st.areaId === 'sungai-way' && false) return null;
  return (
    <EmptyState mood="thinking"
      title={hasFilters ? 'No providers match your filters' : noOpen ? 'No open availability nearby' : 'No providers nearby yet'}
      body={hasFilters ? 'Try removing a filter or widening your search radius.' : noOpen ? 'Providers here are fully booked. Try a wider radius or another date.' : "Growly couldn't find anyone in this area. Try widening the search or another location."}
      actions={[
        ...(hasFilters ? [{ label: 'Clear Filters', onPress: st.clearFilters, primary: true }] : []),
        { label: 'Widen Search', onPress: () => st.setFilters({ radiusKm: Math.min(25, st.filters.radiusKm * 2) }), primary: !hasFilters },
        { label: 'Change Location', onPress: () => router.push('/location') },
      ]} />
  );
}

const h = StyleSheet.create({
  header: { paddingHorizontal: 18, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line, zIndex: 5 },
  area: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 8 },
  controls: { position: 'absolute', right: 14, gap: 10 },
  searchArea: { position: 'absolute', top: 12, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.forest, paddingHorizontal: 16, height: 42, borderRadius: radius.pill, ...elevation },
  preview: { borderRadius: radius.card, borderWidth: 1.5, borderColor: colors.green, padding: 14, backgroundColor: '#FBFEFC', marginBottom: 6 },
  upcoming: { position: 'absolute', left: 14, right: 72, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, ...elevation },
  upMini: { position: 'absolute', left: 14, flexDirection: 'row', gap: 6, alignItems: 'center', height: 36, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, ...elevation },
  upIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.mintTint, alignItems: 'center', justifyContent: 'center' },
  checkBtn: { backgroundColor: colors.forest, paddingHorizontal: 12, height: 36, borderRadius: 18, justifyContent: 'center' },
  showMap: { position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.forest, height: 48, paddingHorizontal: 20, borderRadius: radius.pill, ...elevation },
});
export { SecondaryButton, PrimaryButton };
