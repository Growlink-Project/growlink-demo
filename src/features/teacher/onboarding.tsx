import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { colors, radius } from '@/theme/tokens';
import { Avatar, Card, ConfirmationDialog, DemoLabel, EmptyState, FilterChip, FormField, Gap, GrowlyIllustration, IconButton, KV, ListRow, Notice, Pill, PrimaryButton, Row, Screen, ScreenHeader, SecondaryButton, Segmented, SectionHeader, SkillChip, T, TextLink, Toggle } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { DateSelector } from '@/components/cards';
import { useApp, useMyProvider } from '@/store/useApp';
import * as api from '@/mocks/services/api';
import { CATEGORIES, SKILLS } from '@/mocks/data/seed';
import { DAY, fmtDate, fmtTime, HOUR, MIN, sameDay, startOfDay } from '@/lib/time';
import type { Mode } from '@/mocks/types';
import { modeLabel } from '@/hooks/lookup';

export function useTeacher() {
  const p = useMyProvider();
  return p;
}
export const NeedTeacher = () => <Redirect href="/role-switch?to=teacher" />;

const APPROVAL_COPY = {
  incomplete: { tone: 'warn', title: 'Setup incomplete', body: 'Finish the checklist and submit for approval to start receiving bookings.' },
  pending: { tone: 'info', title: 'Pending review', body: 'Growlink is reviewing your profile (usually 2 business days). You can keep editing your services.' },
  changes_requested: { tone: 'warn', title: 'Changes requested', body: 'Please update the items noted below and resubmit.' },
  approved: { tone: 'mint', title: 'Approved', body: 'Your profile is live and bookable.' },
  rejected: { tone: 'danger', title: 'Not approved', body: 'Your profile did not meet our provider requirements. Contact support for details.' },
} as const;
export function ApprovalBanner() {
  const p = useTeacher(); if (!p || p.approval === 'approved') return null;
  const c = APPROVAL_COPY[p.approval];
  return <Pressable onPress={() => router.push('/t/approval')} accessibilityRole="button"><Notice tone={c.tone} icon="shield" text={`${c.title}: you can't receive new bookings until approved. Tap for details.`} /></Pressable>;
}

export function TeacherSetup() {
  const p = useTeacher(); const st = useApp();
  if (!p) return <NeedTeacher />;
  const list = api.setupChecklist(st.db, p.id, st.now); const done = list.filter((x) => x.done).length;
  return (
    <Screen header={<ScreenHeader title="Teacher setup" right={<TextLink title="Workspace" onPress={() => router.replace('/teacher')} />} />}>
      <Row gap={12} style={{ marginBottom: 8 }}><GrowlyIllustration size={64} mood="happy" ring={false} /><View style={{ flex: 1 }}><T v="h1" style={{ fontSize: 22 }}>Let's get you bookable</T><T v="bodyMuted">{done} of {list.length} complete</T></View></Row>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.soft, overflow: 'hidden', marginBottom: 14 }}><View style={{ width: `${(done / list.length) * 100}%`, height: 8, backgroundColor: colors.green }} /></View>
      <Card pad={0}>{list.map((c, i) => (
        <ListRow key={c.key} label={`${i + 1}. ${c.label}`} sub={c.done ? 'Done' : 'Missing'} onPress={() => router.push(c.href as never)} last={i === list.length - 1}
          right={c.done ? <Icon name="check" size={20} color={colors.green} strokeWidth={2.4} /> : <Pill tone="warn" text="To do" />} />
      ))}</Card>
      <Gap />
      <ApprovalBanner />
    </Screen>
  );
}

const profSchema = z.object({ headline: z.string().min(3, 'Add a short headline'), about: z.string().min(30, 'At least 30 characters'), years: z.string().regex(/^\d{1,2}$/, 'Number of years'), languages: z.string().min(2, 'Add at least one language'), credentials: z.string(), radius: z.string().regex(/^\d{1,2}$/, 'Kilometres') });
export function TeacherProfileEdit() {
  const p = useTeacher(); const st = useApp();
  const { control, handleSubmit, formState } = useForm({ resolver: zodResolver(profSchema), mode: 'onChange', defaultValues: { headline: p?.headline ?? '', about: p?.about ?? '', years: String(p?.years ?? 0), languages: p?.languages.join(', ') ?? '', credentials: p?.credentials.join('\n') ?? '', radius: String(p?.serviceRadiusKm ?? 5) } });
  const [video, setVideo] = useState(!!p?.videoIntro);
  if (!p) return <NeedTeacher />;
  const save = handleSubmit((v) => {
    st.run((db) => Object.assign(db.providers.find((x) => x.id === p.id)!, { headline: v.headline, about: v.about, years: +v.years, languages: v.languages.split(',').map((s) => s.trim()).filter(Boolean), credentials: v.credentials.split('\n').map((s) => s.trim()).filter(Boolean), serviceRadiusKm: +v.radius, videoIntro: video ? { durationSec: 48, moderated: false } : undefined }), 'Profile saved');
    router.back();
  });
  const F = ({ name, label, ...rest }: { name: keyof z.infer<typeof profSchema>; label: string; multiline?: boolean; hint?: string; keyboardType?: 'number-pad' }) => (
    <Controller control={control} name={name} render={({ field, fieldState }) => <FormField label={label} value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} {...rest} />} />
  );
  return (
    <Screen header={<ScreenHeader title="Edit profile" />} footer={<PrimaryButton title="Save" disabled={!formState.isValid} onPress={save} />}>
      <View style={{ height: 96, borderRadius: radius.hero, backgroundColor: colors.mintTint, marginBottom: -36 }} />
      <View style={{ paddingLeft: 16, marginBottom: 12 }}><Avatar photo={p.photo} initials={p.initials} size={72} /><TextLink title="Change avatar / banner" onPress={() => st.showToast('Image picker simulated')} /></View>
      {F({ name: 'headline', label: 'Professional headline' })}
      {F({ name: 'about', label: 'About', multiline: true })}
      {F({ name: 'years', label: 'Years of experience', keyboardType: 'number-pad' })}
      {F({ name: 'languages', label: 'Spoken languages', hint: 'Comma separated' })}
      {F({ name: 'credentials', label: 'Credentials', multiline: true, hint: 'One per line. Shown as self-declared.' })}
      <FormField label="Base location" value={p.area} editable={false} hint="Exact address is never shown publicly." />
      {F({ name: 'radius', label: 'Service radius (km)', keyboardType: 'number-pad' })}
      <Toggle label="Introduction video" sub="Max 60 seconds · reviewed by moderation before it's public" value={video} onChange={setVideo} />
    </Screen>
  );
}

export function ServicesList() {
  const p = useTeacher(); const st = useApp();
  if (!p) return <NeedTeacher />;
  const svcs = api.servicesOf(st.db, p.id, false);
  return (
    <Screen header={<ScreenHeader title="Services & packages" right={<IconButton name="plus" label="Add service" onPress={() => router.push('/t/service-edit')} />} />}>
      <ApprovalBanner />
      {svcs.map((s) => {
        const sk = api.skillOf(s.skillId); const cat = api.categoryOf(sk?.categoryId);
        return (
          <Card key={s.id} style={{ marginTop: 10 }}>
            <Row style={{ justifyContent: 'space-between' }}><Pill text={`${cat?.short} → ${sk?.label}`} icon={cat?.icon} /><Pill tone={s.active ? 'mint' : 'soft'} text={s.active ? 'Active' : 'Inactive'} /></Row>
            <T v="strong" style={{ marginTop: 8, fontSize: 16 }}>{s.title}</T>
            <T v="bodyMuted">{s.offeringType === 'skill' ? 'Lesson' : 'Service'} · {s.modes.map((m) => modeLabel(m, true)).join(' / ')}</T>
            <Gap h={8} />
            {api.packagesOf(st.db, s.id, false).map((k) => (
              <Pressable key={k.id} accessibilityRole="button" onPress={() => router.push(`/t/package-edit?service=${s.id}&id=${k.id}`)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line, gap: 8 }}>
                <View style={{ flex: 1 }}><T v="strong" style={{ fontSize: 14 }}>{k.label}{!k.active ? ' (inactive)' : ''}</T><T v="caption">{k.durationMin} min{k.trial ? ' · Free trial' : ''}</T></View>
                <T v="price">{k.trial ? 'RM 0' : `RM ${k.price}`}</T><Icon name="chevron-right" size={16} color={colors.muted} />
              </Pressable>
            ))}
            <Row gap={14} style={{ marginTop: 6 }}><TextLink title="Add package" icon="plus" onPress={() => router.push(`/t/package-edit?service=${s.id}`)} /><TextLink title="Edit service" onPress={() => router.push(`/t/service-edit?id=${s.id}`)} /></Row>
          </Card>
        );
      })}
      {!svcs.length ? <EmptyState mood="happy" title="No services yet" body="Create a service for one skill, then add packages with prices and durations." actions={[{ label: 'Add Service', onPress: () => router.push('/t/service-edit'), primary: true }]} /> : <><Gap /><SecondaryButton icon="plus" title="Add Service" onPress={() => router.push('/t/service-edit')} /></>}
    </Screen>
  );
}

export function ServiceEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>(); const p = useTeacher(); const st = useApp();
  const s = st.db.services.find((x) => x.id === id);
  const [cat, setCat] = useState(s ? api.skillOf(s.skillId)?.categoryId : undefined); const [skill, setSkill] = useState(s?.skillId);
  const [title, setTitle] = useState(s?.title ?? ''); const [desc, setDesc] = useState(s?.description ?? ''); const [modes, setModes] = useState<Mode[]>(s?.modes ?? []);
  const [type, setType] = useState(s?.offeringType ?? 'skill'); const [active, setActive] = useState(s?.active ?? true);
  if (!p) return <NeedTeacher />;
  const valid = !!skill && title.length >= 3 && desc.length >= 10 && modes.length > 0;
  const save = () => {
    st.run((db) => {
      if (s) Object.assign(db.services.find((x) => x.id === s.id)!, { skillId: skill, title, description: desc, modes, active, offeringType: type });
      else db.services.push({ id: api.uid('s'), providerId: p.id, skillId: skill!, title, description: desc, modes, active, offeringType: type });
      const pr = db.providers.find((x) => x.id === p.id)!; if (!pr.skillIds.includes(skill!)) pr.skillIds.push(skill!); if (!s) pr.categoryId = cat!;
    }, 'Service saved');
    router.back();
  };
  return (
    <Screen header={<ScreenHeader title={s ? 'Edit service' : 'New service'} />} footer={<PrimaryButton title="Save" disabled={!valid} onPress={save} />}>
      <T v="strong" style={{ marginBottom: 8 }}>1. Category</T>
      <Row gap={8} wrap>{CATEGORIES.map((c) => <FilterChip key={c.id} label={c.short} icon={c.icon} iconColor={c.fg} active={cat === c.id} onPress={() => { setCat(c.id); setSkill(undefined); }} />)}</Row>
      {cat ? <><Gap /><T v="strong" style={{ marginBottom: 8 }}>2. Skill</T><Row gap={8} wrap>{SKILLS.filter((x) => x.categoryId === cat).map((x) => <SkillChip key={x.id} label={x.label} active={skill === x.id} onPress={() => setSkill(x.id)} />)}</Row></> : null}
      <Gap />
      <T v="strong" style={{ marginBottom: 8 }}>Offering type</T>
      <Segmented value={type} onChange={setType} options={[{ key: 'skill', label: 'Lesson / coaching' }, { key: 'service', label: 'Service for client' }]} />
      <Gap />
      <FormField label="Title" value={title} onChangeText={setTitle} error={title && title.length < 3 ? 'Too short' : undefined} />
      <FormField label="Description" multiline value={desc} onChangeText={setDesc} error={desc && desc.length < 10 ? 'Add a little more detail' : undefined} />
      <T v="strong" style={{ marginBottom: 8 }}>Delivery modes</T>
      <Row gap={8} wrap>{(['provider', 'student', 'online'] as Mode[]).map((m) => <FilterChip key={m} label={modeLabel(m, true)} active={modes.includes(m)} onPress={() => setModes(modes.includes(m) ? modes.filter((x) => x !== m) : [...modes, m])} />)}</Row>
      {!modes.length ? <T v="caption" color={colors.danger} style={{ marginTop: 4 }}>⚠ Choose at least one mode</T> : null}
      <Toggle label="Active" sub="Inactive services are hidden from students" value={active} onChange={setActive} />
    </Screen>
  );
}

const pkgSchema = z.object({ label: z.string().min(3, 'Required'), description: z.string().min(5, 'Required'), duration: z.string().regex(/^\d{2,3}$/, 'Minutes, e.g. 60'), price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter an amount') });
export function PackageEdit() {
  const { service, id } = useLocalSearchParams<{ service: string; id?: string }>(); const st = useApp();
  const k = st.db.packages.find((x) => x.id === id);
  const [trial, setTrial] = useState(k?.trial ?? false); const [active, setActive] = useState(k?.active ?? true);
  const { control, handleSubmit, formState, setValue } = useForm({ resolver: zodResolver(pkgSchema), mode: 'onChange', defaultValues: { label: k?.label ?? '', description: k?.description ?? '', duration: String(k?.durationMin ?? 60), price: String(k?.price ?? '') } });
  const save = handleSubmit((v) => {
    st.run((db) => {
      const data = { label: v.label, description: v.description, durationMin: +v.duration, price: trial ? 0 : +v.price, trial, active, currency: 'MYR' as const };
      if (k) Object.assign(db.packages.find((x) => x.id === k.id)!, data); else db.packages.push({ id: api.uid('k'), serviceId: service, ...data });
    }, 'Package saved');
    router.back();
  });
  return (
    <Screen header={<ScreenHeader title={k ? 'Edit package' : 'New package'} />} footer={<PrimaryButton title="Save" disabled={!formState.isValid} onPress={save} />}>
      {(['label', 'description', 'duration'] as const).map((n) => <Controller key={n} control={control} name={n} render={({ field, fieldState }) => <FormField label={{ label: 'Package name', description: 'Description', duration: 'Duration (minutes)' }[n]} multiline={n === 'description'} keyboardType={n === 'duration' ? 'number-pad' : 'default'} value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />} />)}
      <Toggle label="Free trial package" sub="Trials are always RM0 · one per learner" value={trial} onChange={(v) => { setTrial(v); if (v) setValue('price', '0', { shouldValidate: true }); }} />
      <Controller control={control} name="price" render={({ field, fieldState }) => <FormField label="Price" value={trial ? '0' : field.value} editable={!trial} onChangeText={field.onChange} keyboardType="decimal-pad" error={fieldState.error?.message} right={<T v="strong" color={colors.muted}>MYR</T>} hint={trial ? 'Locked to RM0 because this is a trial.' : 'Currency: Malaysian Ringgit'} />} />
      <Toggle label="Active" value={active} onChange={setActive} />
    </Screen>
  );
}

export function AvailabilityEditor() {
  const p = useTeacher(); const st = useApp();
  const [day, setDay] = useState(startOfDay(st.now + DAY)); const [startH, setStartH] = useState(14); const [len, setLen] = useState(60); const [del, setDel] = useState<string>();
  if (!p) return <NeedTeacher />;
  const all = st.db.slots.filter((s) => s.providerId === p.id && s.start > st.now - DAY);
  const daySlots = all.filter((s) => sameDay(s.start, day)).sort((a, b) => a.start - b.start);
  const blocked = daySlots.length > 0 && daySlots.filter((s) => s.state === 'open' || s.state === 'blocked').every((s) => s.state === 'blocked');
  const add = () => { const start = day + startH * HOUR; st.run((db, now) => api.addSlot(db, now, p.id, start, start + len * MIN), 'Slot added'); };
  return (
    <Screen header={<ScreenHeader title="Availability" sub="Malaysia Time (GMT+8)" />}>
      <ApprovalBanner />
      <Gap h={4} />
      <Card><DateSelector slots={all} value={day} now={st.now} onChange={setDay} /></Card>
      <SectionHeader title={fmtDate(day)} action={blocked ? 'Unblock day' : 'Block day'} onAction={() => st.run((db) => api.toggleBlockDay(db, p.id, day), blocked ? 'Day reopened' : 'Day blocked')} />
      {daySlots.map((s) => (
        <Row key={s.id} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line, justifyContent: 'space-between' }}>
          <Row gap={10}><Icon name="clock" size={16} color={colors.muted} /><T v="strong">{fmtTime(s.start)} – {fmtTime(s.end)}</T></Row>
          <Row gap={6}><Pill tone={s.state === 'open' ? 'mint' : s.state === 'blocked' ? 'soft' : 'warn'} text={s.state} />
            <IconButton name="trash" size={18} label={`Delete ${fmtTime(s.start)} slot`} color={s.state === 'held' || s.state === 'booked' ? '#B7C2BC' : colors.danger} onPress={() => setDel(s.id)} /></Row>
        </Row>
      ))}
      {!daySlots.length ? <T v="bodyMuted">No slots on this day.</T> : null}
      <SectionHeader title="Add slot" />
      <Card>
        <T v="caption">Start time</T>
        <Row gap={6} wrap style={{ marginVertical: 8 }}>{[8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20].map((h) => <SkillChip key={h} label={`${h > 12 ? h - 12 : h}:00 ${h < 12 ? 'AM' : 'PM'}`} active={startH === h} onPress={() => setStartH(h)} />)}</Row>
        <T v="caption">Length</T>
        <Row gap={6} style={{ marginVertical: 8 }}>{[30, 45, 60, 90, 120].map((m) => <SkillChip key={m} label={`${m} min`} active={len === m} onPress={() => setLen(m)} />)}</Row>
        <PrimaryButton title={`Add ${fmtTime(day + startH * HOUR)} – ${fmtTime(day + startH * HOUR + len * MIN)}`} icon="plus" onPress={add} />
        <T v="caption" style={{ marginTop: 8 }}>Overlapping slots are rejected. Held or booked slots can't be deleted.</T>
      </Card>
      <ConfirmationDialog visible={!!del} danger title="Delete this slot?" confirm="Delete" onCancel={() => setDel(undefined)} onConfirm={() => { st.run((db) => api.deleteSlot(db, del!), 'Slot deleted'); setDel(undefined); }} />
    </Screen>
  );
}

export function SubmitApproval() {
  const p = useTeacher(); const st = useApp();
  if (!p) return <NeedTeacher />;
  const list = api.setupChecklist(st.db, p.id, st.now).filter((c) => c.key !== 'submit');
  const ready = list.every((c) => c.done);
  return (
    <Screen header={<ScreenHeader title="Submit for approval" />} footer={<PrimaryButton title={p.approval === 'pending' ? 'Already submitted' : 'Submit for approval'} disabled={!ready || p.approval === 'pending' || p.approval === 'approved'} onPress={() => { const r = st.run((db, now) => api.submitForApproval(db, now, p.id), 'Submitted for review'); if (r.ok) router.replace('/t/approval'); }} />}>
      <Card onPress={() => router.push(`/provider/${p.id}?preview=1`)} label="Preview public profile">
        <Row gap={12}><Avatar photo={p.photo} initials={p.initials} size={56} /><View style={{ flex: 1 }}><T v="strong">{p.name}</T><T v="bodyMuted">{p.headline || 'No headline yet'}</T><T v="caption" color={colors.link}>Preview public profile →</T></View></Row>
      </Card>
      <SectionHeader title="Completeness" />
      {list.map((c) => <ListRow key={c.key} label={c.label} onPress={() => router.push(c.href as never)} right={c.done ? <Icon name="check" color={colors.green} /> : <Pill tone="warn" text="Missing" />} />)}
      <SectionHeader title="Services & packages" />
      <T v="body">{api.servicesOf(st.db, p.id, false).map((s) => `${s.title} (${api.packagesOf(st.db, s.id, false).length} packages)`).join('\n') || 'None'}</T>
      <SectionHeader title="Availability" />
      <T v="body">{api.openSlots(st.db, p.id, st.now).length} open future slots</T>
    </Screen>
  );
}

export function ApprovalStatus() {
  const p = useTeacher(); const st = useApp();
  if (!p) return <NeedTeacher />;
  const c = APPROVAL_COPY[p.approval];
  const steps = ['incomplete', 'pending', 'approved'] as const;
  return (
    <Screen header={<ScreenHeader title="Approval status" />}>
      <Card><Row gap={12}><Icon name="shield" size={28} color={p.approval === 'approved' ? colors.green : p.approval === 'rejected' ? colors.danger : colors.warn} /><View style={{ flex: 1 }}><T v="screenTitle">{c.title}</T><T v="bodyMuted">{c.body}</T></View></Row></Card>
      {p.approval === 'changes_requested' && p.changesNote ? <><Gap /><Notice tone="warn" text={`Reviewer note: ${p.changesNote}`} /></> : null}
      <Gap />
      <Row gap={6}>{steps.map((s, i) => { const reached = steps.indexOf(p.approval as typeof steps[number]) >= i || (p.approval === 'changes_requested' && i <= 1); return <View key={s} style={{ flex: 1 }}><View style={{ height: 6, borderRadius: 3, backgroundColor: reached ? colors.green : colors.line }} /><T v="caption" style={{ marginTop: 4 }}>{s}</T></View>; })}</Row>
      <Gap />
      {p.approval !== 'approved' ? <Notice tone="warn" text="Unapproved teachers can edit their profile and services but cannot receive new bookings or appear in discovery." /> : <Notice tone="mint" text="You appear in student discovery when you have active packages and open slots." />}
      <Gap />
      <Row gap={10}><SecondaryButton title="Setup checklist" onPress={() => router.push('/t/setup')} style={{ flex: 1 }} />{['incomplete', 'changes_requested'].includes(p.approval) ? <PrimaryButton title="Submit" onPress={() => router.push('/t/submit')} style={{ flex: 1 }} /> : null}</Row>
      <Gap h={18} />
      <DemoLabel text="DEMO ONLY · simulate review decision" />
      <Row gap={6} wrap style={{ marginTop: 8 }}>
        {(['incomplete', 'pending', 'changes_requested', 'approved', 'rejected'] as const).map((a) => <SkillChip key={a} label={a.replace('_', ' ')} active={p.approval === a} onPress={() => st.run((db, now) => api.setApproval(db, now, p.id, a, a === 'changes_requested' ? 'Please add at least one credential and a clearer profile photo.' : undefined))} />)}
      </Row>
      <KV k="Profile" v={p.name} />
    </Screen>
  );
}
