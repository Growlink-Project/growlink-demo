import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, radius } from '@/theme/tokens';
import { Avatar, Card, DemoLabel, EmptyState, FilterChip, Gap, ListRow, Notice, PrimaryButton, Radio, Row, Screen, ScreenHeader, SecondaryButton, SectionHeader, SkillChip, T, TextLink, Toggle } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { SearchField } from '@/components/cards';
import { DEFAULT_FILTERS, Filters, searchParams, useApp } from '@/store/useApp';
import { AREAS, CATEGORIES, SKILLS } from '@/mocks/data/seed';
import { searchProviders } from '@/mocks/services/api';
import { dist } from '@/lib/time';
import { useT } from '@/i18n';
import { activeFilterCount } from './Home';

const backHome = () => { useApp.getState().set({ sheet: 'default', selectedProviderId: undefined }); router.canGoBack() ? router.back() : router.replace('/student'); };

export function Search() {
  const t = useT(); const st = useApp(); const [q, setQ] = useState(st.query);
  const text = q.trim().toLowerCase();
  const cats = text ? CATEGORIES.filter((c) => c.label.toLowerCase().includes(text)) : [];
  const skills = text ? SKILLS.filter((s) => s.label.toLowerCase().includes(text)) : [];
  const providers = text ? searchProviders(st.db, { ...searchParams(st), query: text, categoryId: undefined, skillId: undefined, radiusKm: 25 }) : [];
  const suggestions = ['Violin lessons', 'SPM Add Maths', 'Yoga for beginners', 'Aircon servicing'].filter((x) => !text || x.toLowerCase().includes(text));
  const commit = (query: string, f?: Partial<Filters>) => {
    st.set({ query, recentSearches: query ? [query, ...st.recentSearches.filter((r) => r !== query)].slice(0, 6) : st.recentSearches });
    if (f) st.setFilters(f); backHome();
  };
  const nothing = text && !cats.length && !skills.length && !providers.length;
  return (
    <Screen header={<View style={{ paddingHorizontal: 10 }}><Row gap={4}><Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name="back" size={22} /></Pressable>
      <View style={{ flex: 1 }}><SearchField autoFocus value={q} onChangeText={setQ} placeholder={t('home.search')} onSubmit={() => commit(q)} /></View></Row></View>}>
      {!text && <>
        <SectionHeader title="Recent searches" action={st.recentSearches.length ? 'Clear' : undefined} onAction={() => st.set({ recentSearches: [] })} />
        {st.recentSearches.length ? st.recentSearches.map((r) => <ListRow key={r} icon="clock" label={r} onPress={() => setQ(r)} />) : <T v="bodyMuted">No recent searches.</T>}
      </>}
      {suggestions.length > 0 && <><SectionHeader title="Suggestions" /><Row gap={8} wrap>{suggestions.map((s) => <SkillChip key={s} label={s} onPress={() => setQ(s.split(' ')[0])} />)}</Row></>}
      {cats.length > 0 && <><SectionHeader title="Categories" />{cats.map((c) => <ListRow key={c.id} icon={c.icon} label={c.label} onPress={() => commit('', { categoryId: c.id, skillId: undefined })} />)}</>}
      {skills.length > 0 && <><SectionHeader title="Skills" />{skills.map((s) => <ListRow key={s.id} icon="tag" label={s.label} sub={CATEGORIES.find((c) => c.id === s.categoryId)!.label} onPress={() => commit('', { categoryId: s.categoryId, skillId: s.id })} />)}</>}
      {providers.length > 0 && <><SectionHeader title="Providers" />{providers.slice(0, 6).map((r) => (
        <Pressable key={r.provider.id} accessibilityRole="button" onPress={() => router.push(`/provider/${r.provider.id}`)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 10 }}>
          <Avatar photo={r.provider.photo} initials={r.provider.initials} size={46} /><View style={{ flex: 1 }}><T v="strong">{r.provider.name}</T><T v="bodyMuted">{r.provider.headline} · {dist(r.distance)}</T></View><Icon name="chevron-right" size={18} color={colors.muted} />
        </Pressable>))}</>}
      {nothing ? <EmptyState title={`No results for “${q}”`} body="Check the spelling or browse categories instead." actions={[{ label: 'Browse categories', onPress: () => router.replace('/categories'), primary: true }]} /> : null}
      {text && !nothing ? <><Gap /><PrimaryButton title={`Show all results for “${q}”`} onPress={() => commit(q)} /></> : null}
    </Screen>
  );
}

export function Categories() {
  const { open } = useLocalSearchParams<{ open?: string }>(); const st = useApp();
  const [expanded, setExpanded] = useState<string | undefined>(open ?? st.filters.categoryId);
  const apply = (categoryId: string, skillId?: string) => { st.setFilters({ categoryId, skillId }); backHome(); };
  return (
    <Screen header={<ScreenHeader title="Categories & skills" />}>
      <T v="bodyMuted" style={{ marginBottom: 12 }}>Pick a category, then a skill. Filters apply to the map, carousel and results together.</T>
      {CATEGORIES.map((c) => {
        const isOpen = expanded === c.id; const skills = SKILLS.filter((s) => s.categoryId === c.id);
        return (
          <Card key={c.id} pad={0} style={{ marginBottom: 10, overflow: 'hidden' }}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} onPress={() => setExpanded(isOpen ? undefined : c.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 64 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center' }}><Icon name={c.icon} size={22} color={c.fg} /></View>
              <View style={{ flex: 1 }}><T v="strong">{c.label}</T><T v="caption">{skills.length} skills</T></View>
              <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
            </Pressable>
            {isOpen ? (
              <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                <Row gap={8} wrap>{skills.map((s) => <SkillChip key={s.id} label={s.label} active={st.filters.skillId === s.id} onPress={() => apply(c.id, s.id)} />)}</Row>
                <TextLink title={`Show all ${c.short}`} icon="arrow" onPress={() => apply(c.id)} style={{ marginTop: 8 }} />
              </View>
            ) : null}
          </Card>
        );
      })}
    </Screen>
  );
}

export function FiltersScreen() {
  const st = useApp(); const [f, setF] = useState<Filters>({ ...st.filters });
  const upd = (p: Partial<Filters>) => setF((x) => ({ ...x, ...p }));
  const preview = searchProviders(st.db, { ...searchParams(st), ...f }).length;
  const cnt = activeFilterCount(f);
  return (
    <Screen header={<ScreenHeader title={`Filters${cnt ? ` (${cnt})` : ''}`} right={<TextLink title="Clear Filters" onPress={() => setF({ ...DEFAULT_FILTERS })} />} />}
      footer={<PrimaryButton title={`Show ${st.demo.emptyNearby ? 0 : preview} Results`} onPress={() => { st.set({ filters: f }); backHome(); }} />}>
      <SectionHeader title="Category" style={{ marginTop: 4 }} />
      <Row gap={8} wrap>
        <FilterChip label="Any" active={!f.categoryId} onPress={() => upd({ categoryId: undefined, skillId: undefined })} />
        {CATEGORIES.map((c) => <FilterChip key={c.id} label={c.short} icon={c.icon} iconColor={c.fg} active={f.categoryId === c.id} onPress={() => upd({ categoryId: c.id, skillId: undefined })} />)}
      </Row>
      {f.categoryId ? <><SectionHeader title="Skill" /><Row gap={8} wrap>{SKILLS.filter((s) => s.categoryId === f.categoryId).map((s) => <SkillChip key={s.id} label={s.label} active={f.skillId === s.id} onPress={() => upd({ skillId: f.skillId === s.id ? undefined : s.id })} />)}</Row></> : null}
      <SectionHeader title="Offering type" />
      <Row gap={8}>{([[undefined, 'All'], ['skill', 'Lessons'], ['service', 'Services']] as const).map(([k, l]) => <FilterChip key={l} label={l} active={f.offeringType === k} onPress={() => upd({ offeringType: k })} />)}</Row>
      <SectionHeader title="Delivery" />
      <Toggle label="Online only" sub="Still within your selected area" value={f.online} onChange={(v) => upd({ online: v })} />
      <Row gap={8} wrap>{([['provider', "At provider's location"], ['student', 'At my location']] as const).map(([k, l]) => <FilterChip key={k} label={l} active={f.modes.includes(k)} onPress={() => upd({ modes: f.modes.includes(k) ? f.modes.filter((m) => m !== k) : [...f.modes, k] })} />)}</Row>
      <SectionHeader title={`Search radius · ${f.radiusKm} km`} />
      <Row gap={8} wrap>{[1, 3, 5, 10, 25].map((r) => <FilterChip key={r} label={`${r} km`} active={f.radiusKm === r} onPress={() => upd({ radiusKm: r })} />)}</Row>
      <SectionHeader title="Max starting price" />
      <Row gap={8} wrap>{[undefined, 80, 100, 150, 200].map((p) => <FilterChip key={String(p)} label={p ? `≤ RM${p}` : 'Any'} active={f.priceMax === p} onPress={() => upd({ priceMax: p })} />)}</Row>
      <SectionHeader title="Minimum rating" />
      <Row gap={8} wrap>{[undefined, 4.5, 4.7, 4.8].map((r) => <FilterChip key={String(r)} label={r ? `★ ${r}+` : 'Any'} active={f.minRating === r} onPress={() => upd({ minRating: r })} />)}</Row>
      <SectionHeader title="Availability" />
      <Row gap={8} wrap>{([['any', 'Any time'], ['today', 'Today'], ['week', 'Next 7 days'], ['weekend', 'This weekend']] as const).map(([k, l]) => <FilterChip key={k} label={l} active={f.availability === k} onPress={() => upd({ availability: k })} />)}</Row>
      <SectionHeader title="Sort by" />
      {([['recommended', 'Recommended', 'Distance, rating, reliability & completed sessions'], ['distance', 'Nearest first', ''], ['rating', 'Top rated', ''], ['price', 'Lowest price', '']] as const).map(([k, l, s]) => <Radio key={k} selected={f.sort === k} label={l} sub={s || undefined} onPress={() => upd({ sort: k })} />)}
    </Screen>
  );
}

export function LocationSelector() {
  const st = useApp(); const [sel, setSel] = useState(st.areaId); const [q, setQ] = useState('');
  const list = AREAS.filter((a) => !q || `${a.name} ${a.city}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Screen header={<ScreenHeader title="Choose location" />} footer={<PrimaryButton title="Apply location" onPress={() => { st.setArea(sel); backHome(); }} />}>
      <SearchField value={q} onChangeText={setQ} placeholder="Search city or area" />
      <Gap h={12} />
      {st.locationPermission === 'denied' || st.locationPermission === 'unavailable' ? <><Notice tone="warn" text="Location access is off. Choose an area manually — you can still browse everything." /><Gap /></> : null}
      <Radio selected={sel === 'sungai-way' && st.locationPermission === 'granted'} icon="locate" label="Use current location" sub={st.locationPermission === 'granted' ? 'Sungai Way, Petaling Jaya' : 'Permission required'}
        onPress={() => { if (st.locationPermission !== 'granted') { st.set({ locationPermission: 'granted' }); st.showToast('Location permission granted (demo)'); } setSel('sungai-way'); }} />
      {!q && st.recentAreas.length ? <><SectionHeader title="Recent" />{st.recentAreas.map((id) => { const a = AREAS.find((x) => x.id === id)!; return <ListRow key={id} icon="clock" label={a.name} sub={a.city} onPress={() => setSel(id)} right={sel === id ? <Icon name="check" color={colors.green} /> : <View />} />; })}</> : null}
      <SectionHeader title="Klang Valley areas" />
      {list.map((a) => <Radio key={a.id} selected={sel === a.id} label={a.name} sub={a.city} icon="pin" onPress={() => setSel(a.id)} />)}
      {!list.length ? <EmptyState growly={false} title="Area not found" body="Growlink currently covers the Klang Valley." /> : null}
      <DemoLabel text="DEMO ONLY · Shah Alam has no seeded providers" />
    </Screen>
  );
}
export { SecondaryButton, radius };
