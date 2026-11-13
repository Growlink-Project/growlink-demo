import { firstName } from '@/lib/time';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { colors } from '@/theme/tokens';
import { Avatar, Card, ConfirmationDialog, DemoLabel, EmptyState, FormField, Gap, IconButton, ListRow, Notice, Pill, PrimaryButton, Radio, Row, Screen, ScreenHeader, SecondaryButton, Segmented, SectionHeader, T, TextLink, Toggle } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { ProviderCard } from '@/components/cards';
import { useAccount, useApp } from '@/store/useApp';
import * as api from '@/mocks/services/api';
import { AREAS } from '@/mocks/data/seed';
import { LANGS, useT } from '@/i18n';
import { isUpcoming } from '@/hooks/lookup';

export function StudentProfile() {
  const t = useT(); const acc = useAccount(); const st = useApp();
  const learners = st.db.learners.filter((l) => l.accountId === acc.id);
  return (
    <Screen header={<View style={{ paddingHorizontal: 18, paddingTop: 8 }}><T v="h1">{t('tab.profile')}</T></View>}>
      <Gap h={12} />
      <Card>
        <Row gap={14}><Avatar initials={acc.name.split(' ').map((x) => x[0]).join('').slice(0, 2)} size={64} />
          <View style={{ flex: 1 }}><T v="screenTitle">{acc.name}</T><T v="bodyMuted">{acc.email}</T>{acc.verified ? <Pill tone="mint" icon="check" text="Email verified" /> : <Pressable onPress={() => router.push('/verify')}><Pill tone="warn" text="Verify email →" /></Pressable>}</View></Row>
      </Card>
      <Gap />
      <Card pad={0}>
        <ListRow icon="users" label={t('profile.learners')} sub={learners.map((l) => firstName(l.name)).join(', ')} onPress={() => router.push('/learners')} />
        <ListRow icon="heart" label={t('profile.saved')} sub={`${st.saved.length} saved · ${st.following.length} following`} onPress={() => router.push('/saved')} />
        <ListRow icon="pin" label={t('profile.addresses')} onPress={() => router.push('/addresses')} />
        <ListRow icon="card" label={t('profile.payment')} onPress={() => router.push('/payment-methods')} last />
      </Card>
      <Gap />
      <Card pad={0}>
        <ListRow icon="settings" label={t('profile.settings')} onPress={() => router.push('/settings')} />
        <ListRow icon="help" label={t('profile.help')} onPress={() => router.push('/help')} />
        <ListRow icon="swap" label={t('profile.switchTeacher')} sub={acc.providerId ? 'Go to your teaching workspace' : 'Start teaching or offering services'} onPress={() => router.push('/role-switch?to=teacher')} last />
      </Card>
      <Gap />
      <Card pad={0}><ListRow icon="logout" label={t('profile.logout')} danger onPress={() => { useApp.getState().set({ authed: false }); router.replace('/welcome'); }} last /></Card>
    </Screen>
  );
}

export function Learners() {
  const st = useApp(); const learners = st.db.learners.filter((l) => l.accountId === st.accountId);
  return (
    <Screen header={<ScreenHeader title="Learner profiles" right={<IconButton name="plus" label="Add learner" onPress={() => router.push('/learner-edit')} />} />}>
      <T v="bodyMuted" style={{ marginBottom: 12 }}>You own every learner profile. A guardian is a relationship — children never get their own login.</T>
      {learners.map((l) => (
        <Card key={l.id} style={{ marginBottom: 10 }} onPress={() => router.push(`/learner-edit?id=${l.id}`)} label={`Edit ${l.name}`}>
          <Row gap={12}><Avatar initials={l.name[0]} size={46} /><View style={{ flex: 1 }}><T v="strong">{l.name}</T><T v="bodyMuted">{l.relation === 'self' ? 'Myself · created automatically' : `Child${l.dob ? ' · born ' + l.dob : ''}`}</T>{l.notes ? <T v="caption" numberOfLines={1}>{l.notes}</T> : null}</View><Icon name="edit" size={18} color={colors.muted} /></Row>
        </Card>
      ))}
      <SecondaryButton icon="plus" title="Add learner" onPress={() => router.push('/learner-edit')} />
    </Screen>
  );
}

const learnerSchema = z.object({ name: z.string().min(2, 'Enter a name'), dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').or(z.literal('')), notes: z.string().max(300, 'Max 300 characters') });
export function LearnerEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>(); const st = useApp();
  const l = st.db.learners.find((x) => x.id === id);
  const [discard, setDiscard] = useState(false);
  const { control, handleSubmit, formState } = useForm({ resolver: zodResolver(learnerSchema), mode: 'onChange', defaultValues: { name: l?.name ?? '', dob: l?.dob ?? '', notes: l?.notes ?? '' } });
  const save = handleSubmit((v) => {
    st.run((db) => { if (l) Object.assign(db.learners.find((x) => x.id === l.id)!, v); else db.learners.push({ id: api.uid('l'), accountId: st.accountId, relation: 'child', ...v }); }, l ? 'Learner updated' : 'Learner added');
    router.back();
  });
  return (
    <Screen header={<ScreenHeader title={l ? 'Edit learner' : 'Add learner'} onBack={() => (formState.isDirty ? setDiscard(true) : router.back())} />}
      footer={<PrimaryButton title="Save" disabled={!formState.isValid} onPress={save} />}>
      <View style={{ alignItems: 'center', marginBottom: 16 }}><Avatar initials="+" size={72} /><TextLink title="Add photo (optional)" onPress={() => st.showToast('Photo picker simulated')} /></View>
      <Controller control={control} name="name" render={({ field, fieldState }) => <FormField label="Name" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />} />
      {l?.relation !== 'self' ? <Controller control={control} name="dob" render={({ field, fieldState }) => <FormField label="Date of birth" value={field.value} onChangeText={field.onChange} placeholder="2016-03-12" error={fieldState.error?.message} hint="Only visible to teachers you book." />} /> : null}
      <Controller control={control} name="notes" render={({ field, fieldState }) => <FormField label="Learner notes (optional)" multiline value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} placeholder="Level, goals, learning preferences" />} />
      <ConfirmationDialog visible={discard} title="Discard changes?" confirm="Discard" danger onCancel={() => setDiscard(false)} onConfirm={() => { setDiscard(false); router.back(); }} />
    </Screen>
  );
}

export function Addresses() {
  const st = useApp(); const list = st.db.addresses.filter((a) => a.accountId === st.accountId);
  const [del, setDel] = useState<string>();
  return (
    <Screen header={<ScreenHeader title="Saved addresses" right={<IconButton name="plus" label="Add address" onPress={() => router.push('/address-edit')} />} />}>
      {list.map((a) => (
        <Card key={a.id} style={{ marginBottom: 10 }}>
          <Row gap={12} style={{ alignItems: 'flex-start' }}>
            <Icon name={a.label === 'Home' ? 'home' : a.label === 'Work' ? 'desk' : 'pin'} size={22} />
            <View style={{ flex: 1 }}><Row gap={6}><T v="strong">{a.label}</T>{a.isDefault ? <Pill tone="mint" text="Default" /> : null}</Row><T v="bodyMuted">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</T><T v="bodyMuted">{a.area}</T></View>
          </Row>
          <Row gap={14} style={{ marginTop: 8 }}>
            <TextLink title="Edit" onPress={() => router.push(`/address-edit?id=${a.id}`)} />
            {!a.isDefault ? <TextLink title="Set default" onPress={() => st.run((db) => db.addresses.forEach((x) => { if (x.accountId === st.accountId) x.isDefault = x.id === a.id; }))} /> : null}
            <TextLink title="Delete" color={colors.danger} onPress={() => setDel(a.id)} />
          </Row>
        </Card>
      ))}
      {!list.length ? <EmptyState title="No saved addresses" body="Add one for at-home sessions." /> : null}
      <SecondaryButton icon="plus" title="Add address" onPress={() => router.push('/address-edit')} />
      <ConfirmationDialog visible={!!del} danger title="Delete address?" confirm="Delete" onCancel={() => setDel(undefined)} onConfirm={() => { st.run((db) => { db.addresses = db.addresses.filter((x) => x.id !== del); }, 'Address deleted'); setDel(undefined); }} />
    </Screen>
  );
}
const addrSchema = z.object({ label: z.string().min(1, 'Required'), line1: z.string().min(4, 'Enter the street address'), line2: z.string(), area: z.string().min(2, 'Required') });
export function AddressEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>(); const st = useApp(); const a = st.db.addresses.find((x) => x.id === id);
  const [pinArea, setPinArea] = useState(a ? AREAS.reduce((best, x) => (Math.hypot(x.dx - a.dx, x.dy - a.dy) < Math.hypot(best.dx - a.dx, best.dy - a.dy) ? x : best)).id : 'sungai-way');
  const { control, handleSubmit, formState, setValue, watch } = useForm({ resolver: zodResolver(addrSchema), mode: 'onChange', defaultValues: { label: a?.label ?? 'Home', line1: a?.line1 ?? '', line2: a?.line2 ?? '', area: a?.area ?? 'Sungai Way, Petaling Jaya' } });
  const save = handleSubmit((v) => {
    const ar = AREAS.find((x) => x.id === pinArea)!;
    st.run((db) => { if (a) Object.assign(db.addresses.find((x) => x.id === a.id)!, v, { dx: ar.dx + 80, dy: ar.dy + 60 }); else db.addresses.push({ id: api.uid('ad'), accountId: st.accountId, ...v, dx: ar.dx + 80, dy: ar.dy + 60, isDefault: !db.addresses.some((x) => x.accountId === st.accountId) }); }, 'Address saved');
    router.back();
  });
  return (
    <Screen header={<ScreenHeader title={a ? 'Edit address' : 'Add address'} />} footer={<PrimaryButton title="Save" disabled={!formState.isValid} onPress={save} />}>
      <Row gap={8} style={{ marginBottom: 12 }}>{['Home', 'Work', 'Other'].map((l) => <Pressable key={l} onPress={() => setValue('label', l, { shouldValidate: true, shouldDirty: true })} accessibilityRole="radio" accessibilityState={{ checked: watch('label') === l }}><Pill tone={watch('label') === l ? 'dark' : 'soft'} text={l} /></Pressable>)}</Row>
      <Controller control={control} name="label" render={({ field, fieldState }) => <FormField label="Label" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />} />
      <Controller control={control} name="line1" render={({ field, fieldState }) => <FormField label="Address line 1" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} placeholder="No. 12, Jalan SS 9A/14" />} />
      <Controller control={control} name="line2" render={({ field }) => <FormField label="Address line 2 (optional)" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="area" render={({ field, fieldState }) => <FormField label="Area / city" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />} />
      <T v="strong" style={{ marginBottom: 8 }}>Map location</T>
      <Card style={{ backgroundColor: colors.mapBase }}><Row gap={8} wrap>{AREAS.slice(0, 5).map((x) => <Pressable key={x.id} onPress={() => setPinArea(x.id)} accessibilityRole="radio" accessibilityState={{ checked: pinArea === x.id }}><Pill icon="pin" tone={pinArea === x.id ? 'dark' : 'soft'} text={x.name} /></Pressable>)}</Row>
        <T v="caption" style={{ marginTop: 8 }}>Drop-pin is simplified in the prototype; used for transport-fee distance.</T></Card>
    </Screen>
  );
}

export function PaymentMethods() {
  const st = useApp(); const list = st.db.paymentMethods.filter((m) => m.accountId === st.accountId); const [adding, setAdding] = useState(false);
  return (
    <Screen header={<ScreenHeader title="Payment methods" />}>
      <DemoLabel text="DEMO ONLY · no card data is collected" /><Gap h={10} />
      {list.map((m) => <Card key={m.id} style={{ marginBottom: 10 }}><Row gap={12}><Icon name="card" size={24} /><View style={{ flex: 1 }}><T v="strong">{m.brand} •••• {m.last4}</T><T v="bodyMuted">Expires {m.expiry}</T></View>{m.isDefault ? <Pill tone="mint" text="Default" /> : <TextLink title="Make default" onPress={() => st.run((db) => db.paymentMethods.forEach((x) => { if (x.accountId === st.accountId) x.isDefault = x.id === m.id; }))} />}</Row></Card>)}
      <PrimaryButton title="Add payment method" icon="plus" onPress={() => setAdding(true)} />
      <Gap /><Notice text="Cards are added through our payment provider's secure hosted form. Growlink never stores full card numbers." />
      <ConfirmationDialog visible={adding} title="Payment provider (simulated)" body="In production this opens the provider's hosted card form. For the prototype, add a test card." confirm="Add test Mastercard" onCancel={() => setAdding(false)}
        onConfirm={() => { st.run((db) => { db.paymentMethods.push({ id: api.uid('pm'), accountId: st.accountId, brand: 'Mastercard', last4: '5100', expiry: '11/29', isDefault: false }); }, 'Test card added'); setAdding(false); }} />
    </Screen>
  );
}

export function SavedProviders() {
  const st = useApp(); const [tab, setTab] = useState<'saved' | 'following'>('saved');
  const ids = tab === 'saved' ? st.saved : st.following;
  const results = ids.map((id) => st.db.providers.find((p) => p.id === id)!).filter(Boolean).map((p) => ({ provider: p, distance: api.distanceM(p, st.userPos), from: api.startingPrice(st.db, p.id), modes: api.providerModes(st.db, p.id), score: 0, next: api.nextOpen(st.db, p.id, st.now) }));
  return (
    <Screen header={<ScreenHeader title="Saved & following" />}>
      <Segmented value={tab} onChange={setTab} options={[{ key: 'saved', label: 'Saved', count: st.saved.length }, { key: 'following', label: 'Following', count: st.following.length }]} />
      <Gap />
      {results.map((r) => (
        <View key={r.provider.id}>
          <ProviderCard r={r} onPress={() => router.push(`/provider/${r.provider.id}`)} />
          {tab === 'following' ? <Row style={{ marginTop: -4, marginBottom: 10, justifyContent: 'space-between' }}><TextLink title="View posts" onPress={() => router.push(`/posts/${r.provider.id}`)} /><TextLink title="Unfollow" color={colors.danger} onPress={() => st.toggle('following', r.provider.id)} /></Row> : null}
        </View>
      ))}
      {!results.length ? <EmptyState mood="calm" title={tab === 'saved' ? 'No saved providers' : 'Not following anyone'} body="Tap the heart on a profile to save it." actions={[{ label: 'Explore nearby', onPress: () => router.replace('/student'), primary: true }]} /> : null}
      <T v="caption" style={{ marginTop: 8 }}>Save/follow is simulated and isolated from booking logic.</T>
    </Screen>
  );
}

export function Settings() {
  const t = useT(); const st = useApp(); const acc = useAccount(); const teacher = st.role === 'teacher';
  const [n, setN] = useState({ bookings: true, messages: true, reminders: true, posts: !teacher, marketing: false });
  return (
    <Screen header={<ScreenHeader title={t('profile.settings')} />}>
      <SectionHeader title="Language" style={{ marginTop: 4 }} />
      <Card pad={0}><ListRow icon="globe" label={LANGS.find((l) => l.id === st.lang)!.native} sub="App language" onPress={() => router.push('/language')} last /></Card>
      <SectionHeader title="Notifications" />
      <Card pad={6}>
        <View style={{ paddingHorizontal: 8 }}>
          <Toggle label="Booking updates" value={n.bookings} onChange={(v) => setN({ ...n, bookings: v })} />
          <Toggle label="Messages" value={n.messages} onChange={(v) => setN({ ...n, messages: v })} />
          <Toggle label="Session reminders" value={n.reminders} onChange={(v) => setN({ ...n, reminders: v })} />
          {!teacher ? <Toggle label="Posts from followed providers" value={n.posts} onChange={(v) => setN({ ...n, posts: v })} /> : null}
          <Toggle label="Growlink news & offers" value={n.marketing} onChange={(v) => setN({ ...n, marketing: v })} />
        </View>
      </Card>
      {teacher ? <><SectionHeader title="Service preferences" /><Card pad={0}>
        <ListRow icon="pin" label="Base location & service radius" onPress={() => router.push('/t/profile-edit')} />
        <ListRow icon="calendar" label="Availability" onPress={() => router.push('/t/availability')} />
        <ListRow icon="bank" label="Payout account" onPress={() => router.push('/t/payout-onboarding')} last /></Card></> : null}
      <SectionHeader title="Account" />
      <Card pad={0}>
        <ListRow icon="user" label="Account information" sub={`${acc.name} · ${acc.email}`} onPress={() => router.push('/account-setup')} />
        <ListRow icon="lock" label="Privacy" sub="Data, visibility & blocked providers" onPress={() => st.showToast(`${st.blocked.length} blocked provider(s). Manage from each profile.`)} />
        <ListRow icon="help" label="Help" onPress={() => router.push('/help')} />
        <ListRow icon="swap" label={teacher ? t('profile.switchStudent') : t('profile.switchTeacher')} onPress={() => router.push(`/role-switch?to=${teacher ? 'student' : 'teacher'}`)} />
        <ListRow icon="trash" label="Delete account" danger onPress={() => router.push('/delete-account')} />
        <ListRow icon="logout" label={t('profile.logout')} danger onPress={() => { st.set({ authed: false }); router.replace('/welcome'); }} last />
      </Card>
      <T v="caption" center style={{ marginTop: 16 }}>Growlink v2.1.0 (prototype) · build 2026.11</T>
    </Screen>
  );
}

const FAQ = [
  ['When is my booking confirmed?', 'Only after the teacher accepts. Payment success alone is not a confirmation — you will see "Awaiting confirmation" until they respond.'],
  ['How do refunds work?', 'More than 24 h before: 100%. 2–24 h: 50%. Under 2 h: no refund. If the teacher cancels or declines, you get 100% back.'],
  ['Are trial lessons free?', 'Yes. Trials are always RM0 and limited to one per learner with each teacher.'],
  ['How do teachers get paid?', 'Earnings stay Pending for 72 hours after check-out (the dispute window), then become Available for payout (min RM50, ~2 business days).'],
];
export function Help() {
  const { topic } = useLocalSearchParams<{ topic?: string }>(); const st = useApp(); const [open, setOpen] = useState<number>(); const [msg, setMsg] = useState(''); const [cat, setCat] = useState(topic === 'payment' ? 'Payment' : 'Booking');
  return (
    <Screen header={<ScreenHeader title="Help & support" />}>
      <SectionHeader title="FAQ" style={{ marginTop: 4 }} />
      <Card pad={0}>{FAQ.map(([q, a], i) => (
        <Pressable key={q} accessibilityRole="button" accessibilityState={{ expanded: open === i }} onPress={() => setOpen(open === i ? undefined : i)} style={{ padding: 14, borderBottomWidth: i < FAQ.length - 1 ? 1 : 0, borderBottomColor: colors.line }}>
          <Row style={{ justifyContent: 'space-between' }}><T v="strong" style={{ flex: 1, fontSize: 14 }}>{q}</T><Icon name={open === i ? 'chevron-up' : 'chevron-down'} size={16} color={colors.muted} /></Row>
          {open === i ? <T v="bodyMuted" style={{ marginTop: 6 }}>{a}</T> : null}
        </Pressable>))}</Card>
      <SectionHeader title="Contact support" />
      <Row gap={8} wrap style={{ marginBottom: 10 }}>{['Booking', 'Payment', 'Report issue', 'Account'].map((c) => <Pressable key={c} onPress={() => setCat(c)} accessibilityRole="radio" accessibilityState={{ checked: cat === c }}><Pill tone={cat === c ? 'dark' : 'soft'} text={c} /></Pressable>)}</Row>
      <FormField label={`${cat} support request`} multiline value={msg} onChangeText={setMsg} placeholder="Describe the issue. Include your booking reference if relevant." />
      <PrimaryButton title="Send request" disabled={msg.length < 10} onPress={() => { st.showToast(`Support request #SR-${2400 + msg.length} created (simulated)`); setMsg(''); }} />
    </Screen>
  );
}

export function RoleSwitch() {
  const { to } = useLocalSearchParams<{ to: 'teacher' | 'student' }>(); const st = useApp(); const acc = useAccount();
  const toTeacher = to === 'teacher';
  const go = () => {
    if (toTeacher) {
      if (!acc.providerId) st.run((db, now) => {
        const id = 'p_' + acc.id.slice(4);
        db.providers.push({ id, accountId: acc.id, name: acc.name, headline: '', skillIds: [], categoryId: 'academic', initials: acc.name.split(' ').map((x) => x[0]).join('').slice(0, 2), rating: 0, reviewCount: 0, dx: 60, dy: 90, area: 'Sungai Way, Petaling Jaya', about: '', languages: [], years: 0, credentials: [], tags: [], approval: 'incomplete', active: true, suspended: false, bookable: true, reliability: 0, completedSessions: 0, responseRate: 0, students: 0, serviceRadiusKm: 5, tier: 'Hatchling', payoutOnboarding: 'not_started' });
        db.accounts.find((a) => a.id === acc.id)!.providerId = id;
        api.notify(db, now, acc.id, 'teacher', 'updates', 'approval', 'Welcome to teaching on Growlink', 'Complete your setup checklist to submit for approval.', '/t/setup');
      });
      st.switchRole('teacher'); st.set({ setupTeacherProviderId: undefined });
      const p = useApp.getState().db.providers.find((x) => x.id === useApp.getState().db.accounts.find((a) => a.id === acc.id)!.providerId);
      router.replace(p?.approval === 'approved' ? '/teacher' : '/t/setup');
    } else {
      st.run((db) => { const a = db.accounts.find((x) => x.id === acc.id)!; a.studentEnabled = true; if (!db.learners.some((l) => l.accountId === a.id && l.relation === 'self')) db.learners.push({ id: api.uid('l'), accountId: a.id, name: a.name, relation: 'self' }); });
      st.switchRole('student'); router.replace('/student');
    }
  };
  return (
    <Screen header={<ScreenHeader title={toTeacher ? 'Switch to Teacher' : 'Switch to Student'} />} footer={<PrimaryButton title={toTeacher ? (acc.providerId ? 'Open teaching workspace' : 'Start teacher setup') : 'Switch to Student'} onPress={go} />}>
      <View style={{ alignItems: 'center', paddingVertical: 10 }}><Icon name="swap" size={44} color={colors.forest} /></View>
      <T v="h1" center>{toTeacher ? 'Teach on Growlink' : 'Book as a student'}</T>
      <T v="bodyMuted" center style={{ marginTop: 6 }}>{toTeacher ? 'Your bookings, learner profiles and messages as a student stay exactly as they are.' : 'Your teaching profile, clients and earnings history remain available when you switch back.'}</T>
      <Gap />
      <Card><T v="strong">What carries over</T><Gap h={6} /><T v="body">✓ Booking history{'\n'}✓ Learner profiles{'\n'}✓ Messages{'\n'}✓ Teacher history & earnings ledger</T></Card>
      {toTeacher && !acc.providerId ? <><Gap /><Notice tone="warn" text="New teacher profiles must be approved before they can receive bookings." /></> : null}
    </Screen>
  );
}

export function DeleteAccount() {
  const st = useApp(); const [confirm, setConfirm] = useState(false); const [requested, setRequested] = useState(false);
  const blockers = st.db.bookings.filter((b) => (b.studentAccountId === st.accountId || st.db.providers.find((p) => p.id === b.providerId)?.accountId === st.accountId) && (isUpcoming(b, st.now) || b.status === 'disputed' || b.refund?.status === 'processing'));
  return (
    <Screen header={<ScreenHeader title="Delete account" />} footer={<SecondaryButton danger title="Request deletion" disabled={blockers.length > 0 || requested} onPress={() => setConfirm(true)} />}>
      <DemoLabel text="DEMO ONLY · no data is deleted" /><Gap h={10} />
      <T v="body" style={{ fontSize: 14, lineHeight: 21 }}>Deleting your account removes your profile, learner profiles and saved data. Some records (completed bookings, payments, reviews) are kept in redacted form for legal, tax and dispute purposes. Your public reviews will show as "Former member".</T>
      <SectionHeader title={blockers.length ? `Resolve first (${blockers.length})` : 'No blockers'} />
      {blockers.length ? blockers.map((b) => <ListRow key={b.id} icon="calendar" label={b.ref} sub={`Status: ${b.status.replace(/_/g, ' ')}`} onPress={() => router.push(`/booking/${b.id}`)} />) : <Notice tone="mint" text="You have no active bookings, disputes or pending refunds." />}
      {requested ? <><Gap /><Notice tone="mint" text="Deletion request recorded (simulated). In production you'd receive a confirmation email and a 14-day grace period." /></> : null}
      <ConfirmationDialog visible={confirm} danger title="Request account deletion?" body="This is a simulated request. Nothing will be deleted in the prototype." confirm="Request" onCancel={() => setConfirm(false)} onConfirm={() => { setConfirm(false); setRequested(true); }} />
    </Screen>
  );
}
export { Radio };
