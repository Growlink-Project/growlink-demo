import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, elevation, radius } from '@/theme/tokens';
import { IMG } from '@/assets';
import { Avatar, Card, ConfirmationDialog, DemoLabel, EmptyState, FormField, Gap, IconButton, Notice, Pill, PrimaryButton, Radio, Row, Screen, ScreenHeader, SecondaryButton, SectionHeader, SkillChip, T, TextLink } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { ReviewCard } from '@/components/cards';
import { useApp } from '@/store/useApp';
import * as api from '@/mocks/services/api';
import { dist, fmtDate, fmtShort, fmtTime, relative, rm0 } from '@/lib/time';
import { firstName } from '@/lib/time';
import { useT } from '@/i18n';
import { modeIcon } from '@/hooks/lookup';

export function ProviderProfile() {
  const { id, preview } = useLocalSearchParams<{ id: string; preview?: string }>();
  const t = useT(); const insets = useSafeAreaInsets(); const st = useApp(); const db = st.db;
  const p = db.providers.find((x) => x.id === id);
  const [menu, setMenu] = useState(false); const [inquiry, setInquiry] = useState(false);
  if (!p) return <Screen header={<ScreenHeader />}><EmptyState title="Provider not found" /></Screen>;
  const isPreview = preview === '1';
  const blocked = st.blocked.includes(p.id); const saved = st.saved.includes(p.id);
  const services = api.servicesOf(db, p.id);
  const pkgs = services.flatMap((s) => api.packagesOf(db, s.id).map((k) => ({ k, s })));
  const reviews = db.reviews.filter((r) => r.providerId === p.id);
  const posts = db.posts.filter((x) => x.providerId === p.id && x.status === 'published');
  const slots = api.openSlots(db, p.id, st.now).slice(0, 6);
  const modes = api.providerModes(db, p.id);
  const isService = services.every((s) => s.offeringType === 'service');
  const eligible = api.eligibleBase(db, p, st.now);
  const thread = db.threads.find((th) => th.providerId === p.id && th.studentAccountId === st.accountId);
  const canMsg = api.canStudentMessage(db, st.accountId, p.id);
  const startBooking = () => { st.set({ draft: { providerId: p.id } }); router.push('/book/package'); };
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <Row style={{ paddingHorizontal: 10, justifyContent: 'space-between' }}>
        <IconButton name="back" label="Back" onPress={() => router.back()} />
        <Row gap={2}>
          <IconButton name="share" label="Share profile" onPress={() => st.showToast('Share sheet is simulated in the prototype')} />
          {!isPreview ? <IconButton name="heart" label={saved ? 'Remove from saved' : 'Save provider'} color={saved ? colors.green : colors.ink} onPress={() => { st.toggle('saved', p.id); st.showToast(saved ? 'Removed from saved' : 'Saved to your list'); }} /> : null}
          {!isPreview ? <IconButton name="more-v" label="More options" onPress={() => setMenu(true)} /> : null}
        </Row>
      </Row>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        {isPreview ? <><Notice tone="info" icon="eye" text="Public preview — this is exactly what students see." /><Gap h={10} /></> : null}
        {blocked ? <><Notice tone="danger" text="You blocked this provider. Booking and messaging are disabled." /><Gap h={10} /></> : null}
        {/* Hero */}
        <View style={pr.hero}>
          <View style={pr.heroBg}>
            {p.hero || p.photo ? <Image source={IMG[p.hero ?? p.photo!]} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '54%' }} resizeMode="cover" /> : null}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15,61,46,0.22)' }]} />
            <View style={{ padding: 18, flex: 1, justifyContent: 'flex-end', maxWidth: '64%' }}>
              {p.tier !== 'Hatchling' ? <View style={pr.tierChip}><Icon name="trophy" size={12} /><T v="caption" color={colors.ink} style={{ fontFamily: 'Inter_600SemiBold' }}>{p.tier} tier</T></View> : null}
              <T v="hero" color="#fff" style={{ fontSize: 30, lineHeight: 33 }}>{p.headline}</T>
              <T v="screenTitle" color="#fff" style={{ marginTop: 6 }}>{p.name}</T>
              <Row gap={6} style={{ marginTop: 6 }}><Icon name="pin" size={14} color="#fff" /><T v="body" color="#fff">{p.area}</T></Row>
              <Row gap={6}><Icon name="locate" size={14} color="#fff" /><T v="body" color="#fff">{dist(api.distanceM(p, st.userPos))} away</T></Row>
            </View>
          </View>
          <Row style={pr.stats} gap={0}>
            {[[p.rating ? `${p.rating.toFixed(1)} ★` : 'New', `(${p.reviewCount} reviews)`], [`${p.years}+`, 'Years Exp.'], [p.students ? `${p.students}+` : `${p.completedSessions}`, p.students ? 'Students' : 'Jobs done'], [`${p.responseRate}%`, 'Response']].map(([a, b], i) => (
              <View key={b} style={[{ flex: 1, alignItems: 'center', paddingVertical: 12 }, i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.line }]}><T v="strong" style={{ fontSize: 17 }}>{a}</T><T v="caption" center>{b}</T></View>
            ))}
          </Row>
        </View>
        <Row gap={6} wrap style={{ marginTop: 12 }}>{modes.map((m) => <Pill key={m} icon={modeIcon(m)} text={m === 'online' ? 'Online' : m === 'provider' ? "At provider's location" : 'At your location'} />)}</Row>
        <SectionHeader title={`About ${firstName(p.name)}`} />
        <T v="body" style={{ fontSize: 14, lineHeight: 21 }}>{p.about}</T>
        {p.tags.length ? <Row gap={8} wrap style={{ marginTop: 10 }}>{p.tags.map((x) => <SkillChip key={x} label={x} />)}</Row> : null}
        <Card style={{ marginTop: 14 }}>
          <Row gap={10} style={{ alignItems: 'flex-start' }}><Icon name="globe" size={18} color={colors.muted} /><View style={{ flex: 1 }}><T v="caption">Languages</T><T v="body">{p.languages.join(', ')}</T></View></Row>
          <Gap h={10} />
          <Row gap={10} style={{ alignItems: 'flex-start' }}><Icon name="academic" size={18} color={colors.muted} /><View style={{ flex: 1 }}><T v="caption">Credentials (self-declared)</T>{p.credentials.length ? p.credentials.map((c) => <T key={c} v="body">• {c}</T>) : <T v="bodyMuted">None listed</T>}</View></Row>
          <Gap h={10} />
          <Row gap={10}><Icon name="tag" size={18} color={colors.muted} /><View style={{ flex: 1 }}><T v="caption">Skills</T><T v="body">{p.skillIds.map((s) => api.skillOf(s)?.label).join(', ')}</T></View></Row>
        </Card>
        {p.videoIntro ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Play introduction video" onPress={() => st.showToast('Video playback is simulated (48 s, moderated)')} style={pr.video}>
            <View style={pr.play}><Icon name="video" size={20} color="#fff" /></View>
            <View style={{ flex: 1 }}><T v="strong">Introduction video</T><T v="caption">{p.videoIntro.durationSec} s · reviewed by Growlink moderation</T></View>
          </Pressable>
        ) : null}
        <SectionHeader title="Availability" action="All times" onAction={eligible && !isPreview && !blocked ? startBooking : undefined} />
        {slots.length ? <Row gap={8} wrap>{slots.map((s) => <View key={s.id} style={pr.slot}><T v="caption">{fmtDate(s.start)}</T><T v="strong" style={{ fontSize: 13 }}>{fmtTime(s.start)}</T></View>)}</Row>
          : <Notice tone="warn" text="No open slots right now. Check back soon or follow for updates." />}
        <SectionHeader title="Packages" />
        {pkgs.map(({ k, s }) => (
          <Pressable key={k.id} disabled={isPreview || blocked || !eligible} accessibilityRole="button" accessibilityLabel={`${k.label}, ${k.durationMin} minutes, ${rm0(k.price)}`} onPress={() => { st.set({ draft: { providerId: p.id, serviceId: s.id, packageId: k.id } }); router.push('/book/learner'); }} style={pr.pkg}>
            <View style={{ flex: 1 }}>
              <Row gap={6}><T v="strong" style={{ fontSize: 15.5 }}>{k.label}</T>{k.trial ? <Pill tone="mint" text="Free trial" /> : null}</Row>
              <T v="caption">{k.durationMin} min · {s.title}</T>
            </View>
            <T v="price" style={{ fontSize: 17 }}>{k.trial ? 'RM 0' : `RM ${k.price}`}</T>
          </Pressable>
        ))}
        {posts.length ? <><SectionHeader title="Posts" action="See all" onAction={() => router.push(`/posts/${p.id}`)} />
          <Card onPress={() => router.push(`/posts/${p.id}`)}><T v="caption">{relative(posts[0].at, st.now)}</T><T v="body" numberOfLines={3} style={{ marginTop: 4, fontSize: 13.5 }}>{posts[0].text}</T></Card></> : null}
        <SectionHeader title={`Reviews (${p.reviewCount})`} />
        {reviews.length ? reviews.slice(0, 3).map((r) => <ReviewCard key={r.id} r={r} onReport={isPreview ? undefined : () => router.push(`/report?target=review&id=${r.id}`)} />) : <T v="bodyMuted">No reviews yet.</T>}
      </ScrollView>
      {!isPreview ? (
        <View style={[pr.sticky, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <SecondaryButton title={thread ? t('book.message') : t('book.inquiry')} icon="chat" disabled={blocked} style={{ flex: 1 }}
            onPress={() => (thread ? router.push(`/conversation/${thread.id}`) : setInquiry(true))} />
          <PrimaryButton title={!eligible ? (p.approval !== 'approved' ? 'Not yet bookable' : 'No open slots') : isService ? t('book.service') : t('book.lesson')} disabled={blocked || !eligible} onPress={startBooking} style={{ flex: 1.3 }} />
        </View>
      ) : null}
      <ConfirmationDialog visible={menu} title="Options" confirm="Report" onConfirm={() => { setMenu(false); router.push(`/report?target=provider&id=${p.id}`); }} onCancel={() => setMenu(false)} danger>
        <Gap h={10} />
        <SecondaryButton icon="block" title={blocked ? 'Unblock provider' : 'Block provider'} onPress={() => { st.toggle('blocked', p.id); setMenu(false); st.showToast(blocked ? 'Provider unblocked' : 'Provider blocked — hidden from discovery'); }} />
        {!canMsg ? <T v="caption" style={{ marginTop: 8 }}>Messaging opens through a booking inquiry.</T> : null}
      </ConfirmationDialog>
      <InquiryDialog visible={inquiry} onClose={() => setInquiry(false)} providerId={p.id} />
    </View>
  );
}

function InquiryDialog({ visible, onClose, providerId }: { visible: boolean; onClose: () => void; providerId: string }) {
  const st = useApp(); const pkgs = api.providerPackages(st.db, providerId);
  const [pk, setPk] = useState(pkgs[0]?.id); const [text, setText] = useState('');
  return (
    <ConfirmationDialog visible={visible} title="Booking inquiry" body="Ask a question about a specific package. Open chat unlocks once the provider replies or you book." confirm="Send inquiry"
      onCancel={onClose} onConfirm={() => { const r = st.run((db, now) => api.startInquiry(db, now, st.accountId, providerId, pkgs.find((k) => k.id === pk)?.label ?? 'General', text), 'Inquiry sent'); if (r.ok) { onClose(); router.push(`/conversation/${r.value.id}`); } }}>
      <Gap h={10} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>{pkgs.map((k) => <SkillChip key={k.id} label={k.label} active={pk === k.id} onPress={() => setPk(k.id)} />)}</ScrollView>
      <Gap h={10} />
      <FormField label="Your question" multiline value={text} onChangeText={setText} placeholder="e.g. Is the trial suitable for a 10-year-old beginner?" hint="Phone numbers, emails and social handles are hidden automatically." />
    </ConfirmationDialog>
  );
}

export function ProviderPosts() {
  const { id } = useLocalSearchParams<{ id: string }>(); const st = useApp();
  const p = st.db.providers.find((x) => x.id === id)!;
  const posts = st.db.posts.filter((x) => x.providerId === id && x.status === 'published');
  const following = st.following.includes(id);
  return (
    <Screen header={<ScreenHeader title={`${p.name}'s posts`} right={<TextLink title={following ? 'Following ✓' : 'Follow'} onPress={() => st.toggle('following', id)} />} />}>
      {posts.length ? posts.map((po) => (
        <Card key={po.id} style={{ marginBottom: 12 }}>
          <Row gap={10}>
            <Pressable onPress={() => router.push(`/provider/${p.id}`)} accessibilityRole="link"><Avatar photo={p.photo} initials={p.initials} size={40} /></Pressable>
            <View style={{ flex: 1 }}><T v="strong">{p.name}</T><T v="caption">{fmtShort(po.at)} · {relative(po.at, st.now)}</T></View>
            <IconButton name="flag" size={18} label="Report post" onPress={() => router.push(`/report?target=post&id=${po.id}`)} />
          </Row>
          <T v="body" style={{ marginTop: 10, fontSize: 14, lineHeight: 21 }}>{po.text}</T>
          {po.image ? <Image source={IMG[po.image]} style={{ width: '100%', height: 180, borderRadius: radius.tile, marginTop: 10 }} resizeMode="cover" /> : null}
        </Card>
      )) : <EmptyState title="No posts yet" mood="calm" />}
    </Screen>
  );
}

const REASONS: Record<string, string[]> = {
  provider: ['Misleading profile', 'Inappropriate behaviour', 'Safety concern', 'Spam or scam', 'Other'],
  message: ['Harassment', 'Asking to pay outside Growlink', 'Spam', 'Safety concern', 'Other'],
  post: ['Inappropriate content', 'Misleading', 'Spam', 'Other'],
  review: ['Fake or not genuine', 'Offensive language', 'Contains personal info', 'Other'],
  user: ['Inappropriate behaviour', 'Safety concern', 'Other'],
};
export function Report() {
  const { target = 'provider', id } = useLocalSearchParams<{ target?: string; id: string }>(); const st = useApp();
  const [reason, setReason] = useState<string>(); const [details, setDetails] = useState(''); const [confirm, setConfirm] = useState(false); const [done, setDone] = useState(false);
  const [alsoBlock, setAlsoBlock] = useState(false);
  const blockId = target === 'provider' ? id : target === 'message' ? st.db.threads.find((t) => t.id === id)?.providerId : undefined;
  if (done) return <Screen header={<ScreenHeader title="Report sent" />}><EmptyState mood="calm" title="Thanks for letting us know" body="Our trust & safety team reviews every report. We'll notify you if we need more details." actions={[{ label: 'Done', onPress: () => router.back(), primary: true }]} /></Screen>;
  return (
    <Screen header={<ScreenHeader title={`Report ${target}`} />} footer={<PrimaryButton title="Submit report" disabled={!reason} onPress={() => setConfirm(true)} />}>
      <T v="bodyMuted" style={{ marginBottom: 12 }}>Reports are confidential. The other party isn't told who reported them.</T>
      {REASONS[target]?.map((r) => <Radio key={r} selected={reason === r} label={r} onPress={() => setReason(r)} />)}
      <FormField label="Details (optional)" multiline value={details} onChangeText={setDetails} placeholder="What happened?" />
      {blockId && st.role === 'student' ? <Radio selected={alsoBlock} label="Also block this provider" sub="Hides them from discovery and disables messaging" onPress={() => setAlsoBlock(!alsoBlock)} /> : null}
      <ConfirmationDialog visible={confirm} title="Submit report?" body={`Reason: ${reason}`} confirm="Submit" onCancel={() => setConfirm(false)}
        onConfirm={() => { st.run((db, now) => { db.reports.unshift({ id: api.uid('rp'), target, targetId: id, reason: reason!, details, at: now }); }); if (alsoBlock && blockId && !st.blocked.includes(blockId)) st.toggle('blocked', blockId); setConfirm(false); setDone(true); }} />
    </Screen>
  );
}

const pr = StyleSheet.create({
  hero: { borderRadius: radius.hero, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, ...elevation },
  heroBg: { height: 300, backgroundColor: '#8EC19D' },
  tierChip: { flexDirection: 'row', gap: 4, alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10 },
  stats: { backgroundColor: colors.surface },
  video: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginTop: 10, borderRadius: radius.card, backgroundColor: colors.soft, minHeight: 60 },
  play: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  slot: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.tile, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center' },
  pkg: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginBottom: 10, borderRadius: radius.card, backgroundColor: colors.soft, minHeight: 64 },
  sticky: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingTop: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line },
});
export { DemoLabel };
