import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, radius } from '@/theme/tokens';
import { IMG } from '@/assets';
import { Avatar, Card, ConfirmationDialog, EmptyState, FormField, Gap, IconButton, KV, ListRow, Notice, Pill, PrimaryButton, Row, Screen, ScreenHeader, SecondaryButton, Segmented, SectionHeader, Stars, T, TextLink } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { ReviewCard } from '@/components/cards';
import { useApp } from '@/store/useApp';
import * as api from '@/mocks/services/api';
import { relative } from '@/lib/time';
import { useT } from '@/i18n';
import { NeedTeacher, useTeacher } from './onboarding';

export function TeacherProfile() {
  const t = useT(); const p = useTeacher(); const st = useApp();
  if (!p) return <NeedTeacher />;
  const svcs = api.servicesOf(st.db, p.id, false);
  const statusTone = p.approval === 'approved' ? 'mint' : p.approval === 'rejected' ? 'danger' : 'warn';
  return (
    <Screen header={<View style={{ paddingHorizontal: 18, paddingTop: 8 }}><T v="h1">{t('tab.profile')}</T></View>}>
      <Gap h={10} />
      <Card>
        <Row gap={14}><Avatar photo={p.photo} initials={p.initials} size={64} /><View style={{ flex: 1 }}><T v="screenTitle">{p.name}</T><T v="bodyMuted">{p.headline || 'Add a headline'}</T><Row gap={6} style={{ marginTop: 4 }}><Pill tone={statusTone} icon="shield" text={p.approval.replace('_', ' ')} /><Pill icon="trophy" text={p.tier} /></Row></View></Row>
        <Gap h={10} /><SecondaryButton small icon="eye" title="Public Profile Preview" onPress={() => router.push(`/provider/${p.id}?preview=1`)} />
      </Card>
      <Gap />
      <Card pad={0}>
        <ListRow icon="edit" label="Professional profile" onPress={() => router.push('/t/profile-edit')} />
        <ListRow icon="layers" label="Services & packages" sub={`${svcs.length} services · ${svcs.flatMap((s) => api.packagesOf(st.db, s.id, false)).length} packages`} onPress={() => router.push('/t/services')} />
        <ListRow icon="calendar" label="Availability" onPress={() => router.push('/t/availability')} />
        <ListRow icon="image" label="Posts" sub={`${st.db.posts.filter((x) => x.providerId === p.id && x.status === 'published').length} published`} onPress={() => router.push('/t/posts')} />
        <ListRow icon="star" label="Reviews" sub={`${p.rating ? p.rating.toFixed(1) : 'New'} · ${p.reviewCount} reviews`} onPress={() => router.push('/t/reviews')} />
        <ListRow icon="trophy" label="Growth & reliability" sub={`${p.tier} tier`} onPress={() => router.push('/t/growth')} />
        <ListRow icon="shield" label="Approval status" onPress={() => router.push('/t/approval')} last />
      </Card>
      <Gap />
      <Card pad={0}>
        <ListRow icon="settings" label="Settings" onPress={() => router.push('/settings')} />
        <ListRow icon="help" label="Support" onPress={() => router.push('/help')} />
        <ListRow icon="swap" label={t('profile.switchStudent')} onPress={() => router.push('/role-switch?to=student')} />
        <ListRow icon="logout" label={t('profile.logout')} danger onPress={() => { st.set({ authed: false }); router.replace('/welcome'); }} last />
      </Card>
    </Screen>
  );
}

export function PostsManage() {
  const p = useTeacher(); const st = useApp(); const [tab, setTab] = useState<'published' | 'draft' | 'hidden'>('published'); const [del, setDel] = useState<string>();
  if (!p) return <NeedTeacher />;
  const list = st.db.posts.filter((x) => x.providerId === p.id && x.status === tab).sort((a, b) => b.at - a.at);
  return (
    <Screen header={<ScreenHeader title="Posts" right={<IconButton name="plus" label="Create post" onPress={() => router.push('/t/post-create')} />} />}>
      <Segmented value={tab} onChange={setTab} options={[{ key: 'published', label: 'Published' }, { key: 'draft', label: 'Drafts' }, { key: 'hidden', label: 'Hidden' }]} />
      <Gap />
      {list.map((po) => (
        <Card key={po.id} style={{ marginBottom: 10 }}>
          <T v="caption">{relative(po.at, st.now)}</T>
          <T v="body" style={{ marginTop: 4, fontSize: 14 }}>{po.text}</T>
          {po.image ? <Image source={IMG[po.image]} style={{ width: '100%', height: 140, borderRadius: radius.tile, marginTop: 8 }} /> : null}
          <Row gap={14} style={{ marginTop: 8 }}>
            <TextLink title="Edit" onPress={() => router.push(`/t/post-create?id=${po.id}`)} />
            {po.status !== 'hidden' ? <TextLink title="Hide" onPress={() => st.run((db) => { db.posts.find((x) => x.id === po.id)!.status = 'hidden'; }, 'Post hidden')} /> : <TextLink title="Unhide" onPress={() => st.run((db) => { db.posts.find((x) => x.id === po.id)!.status = 'published'; }, 'Post visible')} />}
            <TextLink title="Delete" color={colors.danger} onPress={() => setDel(po.id)} />
          </Row>
        </Card>
      ))}
      {!list.length ? <EmptyState mood="calm" title={`No ${tab} posts`} actions={[{ label: 'Create post', onPress: () => router.push('/t/post-create'), primary: true }]} /> : null}
      <ConfirmationDialog visible={!!del} danger title="Delete post?" confirm="Delete" onCancel={() => setDel(undefined)} onConfirm={() => { st.run((db) => { db.posts = db.posts.filter((x) => x.id !== del); }, 'Post deleted'); setDel(undefined); }} />
    </Screen>
  );
}

export function PostCreate() {
  const { id } = useLocalSearchParams<{ id?: string }>(); const p = useTeacher(); const st = useApp(); const po = st.db.posts.find((x) => x.id === id);
  const [text, setText] = useState(po?.text ?? ''); const [img, setImg] = useState(po?.image); const [preview, setPreview] = useState(false);
  if (!p) return <NeedTeacher />;
  const save = (status: 'published' | 'draft') => {
    st.run((db, now) => {
      if (po) Object.assign(db.posts.find((x) => x.id === po.id)!, { text, image: img, status });
      else db.posts.unshift({ id: api.uid('po'), providerId: p.id, text, image: img, at: now, status });
      if (status === 'published') for (const accId of ['acc_aisyah']) if (useApp.getState().following.includes(p.id)) api.notify(db, now, accId, 'student', 'updates', 'post', `${p.name} posted`, text.slice(0, 80), `/posts/${p.id}`);
    }, status === 'published' ? 'Published to your public profile' : 'Saved as draft');
    router.back();
  };
  return (
    <Screen header={<ScreenHeader title={po ? 'Edit post' : 'Create post'} right={<TextLink title={preview ? 'Edit' : 'Preview'} onPress={() => setPreview(!preview)} />} />}
      footer={<Row gap={10}><SecondaryButton title="Save draft" disabled={text.length < 5} onPress={() => save('draft')} style={{ flex: 1 }} /><PrimaryButton title="Publish" disabled={text.length < 5} onPress={() => save('published')} style={{ flex: 1.3 }} /></Row>}>
      {preview ? (
        <Card><Row gap={10}><Avatar photo={p.photo} initials={p.initials} size={40} /><View><T v="strong">{p.name}</T><T v="caption">just now</T></View></Row><T v="body" style={{ marginTop: 10, fontSize: 14 }}>{text}</T>{img ? <Image source={IMG[img]} style={{ width: '100%', height: 180, borderRadius: radius.tile, marginTop: 10 }} /> : null}</Card>
      ) : (
        <>
          <FormField label="What would you like to share?" multiline value={text} onChangeText={setText} maxLength={600} hint={`${text.length}/600 · posts are public`} />
          {img ? <View><Image source={IMG[img]} style={{ width: '100%', height: 160, borderRadius: radius.tile }} /><TextLink title="Remove image" color={colors.danger} onPress={() => setImg(undefined)} /></View>
            : <SecondaryButton icon="image" title="Add image" onPress={() => setImg(p.hero ?? p.photo ?? undefined)} />}
          <Gap /><Notice text="Keep posts about your teaching or services. Contact details are not allowed." />
        </>
      )}
    </Screen>
  );
}

export function ReviewsReceived() {
  const p = useTeacher(); const st = useApp();
  if (!p) return <NeedTeacher />;
  const list = st.db.reviews.filter((r) => r.providerId === p.id).sort((a, b) => b.at - a.at);
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: list.filter((r) => r.rating === n).length }));
  return (
    <Screen header={<ScreenHeader title="Reviews" />}>
      <Card>
        <Row gap={16}>
          <View style={{ alignItems: 'center' }}><T v="display" style={{ fontSize: 40 }}>{p.rating ? p.rating.toFixed(1) : '—'}</T><Stars value={p.rating} /><T v="caption">{p.reviewCount} reviews</T></View>
          <View style={{ flex: 1, gap: 4 }}>{dist.map((d) => <Row key={d.n} gap={6}><T v="caption" style={{ width: 10 }}>{d.n}</T><View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.soft }}><View style={{ width: `${list.length ? (d.c / list.length) * 100 : 0}%`, height: 6, borderRadius: 3, backgroundColor: colors.star }} /></View></Row>)}</View>
        </Row>
        <T v="caption" style={{ marginTop: 8 }}>Distribution shown for reviews in the prototype dataset.</T>
      </Card>
      <Gap />
      {list.map((r) => <ReviewCard key={r.id} r={r} onReport={() => router.push(`/report?target=review&id=${r.id}`)} />)}
      {!list.length ? <EmptyState mood="calm" title="No reviews yet" /> : null}
    </Screen>
  );
}

const TIERS = [
  { name: 'Hatchling', req: 'New on Growlink', min: 0 },
  { name: 'Loyalist', req: '100+ completed sessions · 4.6★ · 92% reliability', min: 100 },
  { name: 'Explorer', req: '400+ completed sessions · 4.8★ · 96% reliability', min: 400 },
] as const;
export function Growth() {
  const p = useTeacher();
  if (!p) return <NeedTeacher />;
  const idx = TIERS.findIndex((t) => t.name === p.tier); const next = TIERS[idx + 1];
  return (
    <Screen header={<ScreenHeader title="Growth & reliability" />}>
      <View style={{ backgroundColor: colors.mintTint, borderRadius: radius.hero, padding: 18 }}>
        <Row gap={12}><Icon name="trophy" size={30} color={colors.forest} /><View style={{ flex: 1 }}><T v="caption">CURRENT EARNED TIER</T><T v="hero" style={{ fontSize: 26 }}>{p.tier}</T></View></Row>
        {next ? <T v="body" style={{ marginTop: 8 }}>Next: <T v="strong" style={{ fontSize: 13 }}>{next.name}</T> — {next.req}</T> : <T v="body" style={{ marginTop: 8 }}>You've reached the highest tier.</T>}
      </View>
      <Gap />
      <Row gap={10}>{[['Completed', `${p.completedSessions}`], ['Avg rating', p.rating ? p.rating.toFixed(1) : '—'], ['Reliability', `${p.reliability}%`]].map(([k, v]) => <Card key={k} style={{ flex: 1 }} pad={12}><T v="caption">{k}</T><T v="h1" style={{ fontSize: 22 }}>{v}</T></Card>)}</Row>
      <SectionHeader title="Tiers" />
      {TIERS.map((t, i) => <ListRow key={t.name} icon={i <= idx ? 'check' : 'lock'} label={t.name} sub={t.req} right={i === idx ? <Pill tone="mint" text="Current" /> : <View />} />)}
      <SectionHeader title="What affects reliability" />
      <Card><T v="body">• Checking in on time{'\n'}• Not cancelling confirmed sessions{'\n'}• Responding to booking requests quickly{'\n'}• Few upheld disputes{'\n'}• Completing sessions as described</T></Card>
      <Gap /><Notice tone="mint" icon="info" text="Tiers are earned from your track record — they can't be purchased." />
      <KV k="Response rate" v={`${p.responseRate}%`} />
    </Screen>
  );
}
