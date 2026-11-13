import React, { useState } from 'react';
import { Image, Platform, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '@/theme/tokens';
import { fonts } from '@/theme/typography';
import { IMG } from '@/assets';
import { Avatar, Card, DemoLabel, FormField, Gap, GrowlyIllustration, IconButton, Notice, PrimaryButton, Radio, Row, Screen, ScreenHeader, SecondaryButton, T, TextLink } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { LANGS, useT } from '@/i18n';
import { useAccount, useApp } from '@/store/useApp';
import { AREAS } from '@/mocks/data/seed';

const goHome = () => { const s = useApp.getState(); router.replace(s.role === 'teacher' ? '/teacher' : '/student'); };

export function Welcome() {
  const t = useT(); const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <Image source={IMG.landscape} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: 300, opacity: 0.95 }} resizeMode="cover" />
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 28 }}>
        <GrowlyIllustration size={170} mood="happy" />
        <T v="display" style={{ fontSize: 44, lineHeight: 48, color: colors.forest, marginTop: 4 }}>Growlink</T>
        <T v="strong" color={colors.link} style={{ marginTop: 2 }}>{t('welcome.tagline')}</T>
        <Gap h={22} />
        <T v="hero" center>{t('welcome.h1')}{'\n'}{t('welcome.h2')}{'\n'}{t('welcome.h3a')}<T v="hero" color={colors.green}>{t('welcome.h3b')}</T></T>
        <T v="bodyMuted" center style={{ fontSize: 14, lineHeight: 21, marginTop: 12, maxWidth: 300 }}>{t('welcome.body')}</T>
        <Gap h={22} />
        <PrimaryButton title={t('welcome.cta')} onPress={() => router.push('/language')} style={{ width: '100%', maxWidth: 300, borderRadius: 999 }} />
        <TextLink title={t('welcome.signin')} onPress={() => router.push('/sign-in')} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function Language() {
  const t = useT(); const lang = useApp((s) => s.lang); const set = useApp((s) => s.set);
  return (
    <Screen header={<ScreenHeader />} footer={<PrimaryButton title={t('common.continue')} onPress={() => (router.canGoBack() && useApp.getState().authed ? router.back() : router.push('/register'))} />}>
      <T v="h1">{t('lang.title')}</T><T v="bodyMuted" style={{ marginTop: 4, marginBottom: 18 }}>{t('lang.sub')}</T>
      {LANGS.map((l) => <Radio key={l.id} selected={lang === l.id} label={l.native} sub={l.label} onPress={() => set({ lang: l.id })} icon="globe" />)}
    </Screen>
  );
}

const signInSchema = z.object({ email: z.string().email('Enter a valid email'), password: z.string().min(6, 'At least 6 characters') });
export function SignIn() {
  const t = useT(); const [show, setShow] = useState(false); const [err, setErr] = useState('');
  const { control, handleSubmit, formState } = useForm({ resolver: zodResolver(signInSchema), defaultValues: { email: '', password: '' }, mode: 'onChange' });
  const demo = () => { useApp.getState().signIn('acc_aisyah', 'student'); router.replace('/location-permission'); };
  const submit = handleSubmit((v) => {
    const acc = useApp.getState().db.accounts.find((a) => a.email === v.email.toLowerCase());
    if (!acc) return setErr('No account found. For the prototype, use the demo account below.');
    useApp.getState().signIn(acc.id, acc.providerId && !acc.studentEnabled ? 'teacher' : 'student'); goHome();
  });
  return (
    <Screen header={<ScreenHeader />} keyboard>
      <T v="h1">Welcome back</T><T v="bodyMuted" style={{ marginBottom: 20 }}>Sign in to continue to Growlink.</T>
      <Controller control={control} name="email" render={({ field, fieldState }) => <FormField label={t('auth.email')} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.my" />} />
      <Controller control={control} name="password" render={({ field, fieldState }) => <FormField label={t('auth.password')} value={field.value} onChangeText={field.onChange} secureTextEntry={!show} error={fieldState.error?.message} placeholder="••••••••"
        right={<IconButton name={show ? 'eye-off' : 'eye'} label={show ? 'Hide password' : 'Show password'} size={18} onPress={() => setShow(!show)} />} />} />
      <TextLink title={t('auth.forgot')} onPress={() => router.push('/recover')} style={{ alignSelf: 'flex-end' }} />
      {err ? <><Gap h={6} /><Notice tone="danger" text={err} /></> : null}
      <Gap h={14} />
      <PrimaryButton title={t('auth.signin')} onPress={submit} disabled={!formState.isValid} />
      <Gap h={10} />
      <SecondaryButton title={t('auth.google')} icon="globe" onPress={demo} />
      {Platform.OS !== 'android' ? <><Gap h={10} /><SecondaryButton title={t('auth.apple')} icon="lock" onPress={demo} /></> : null}
      <Gap h={18} />
      <Card style={{ backgroundColor: colors.mintTint, borderColor: colors.mintTint }}>
        <DemoLabel /><Gap h={8} />
        <T v="body">Explore without credentials. Social buttons also sign in to the demo account.</T><Gap h={10} />
        <PrimaryButton small title={t('auth.demo') + ' · Aisyah'} onPress={demo} />
        <Gap h={8} />
        <SecondaryButton small title="Demo teacher · Mei Ling" onPress={() => { useApp.getState().signIn('acc_meiling', 'teacher'); router.replace('/teacher'); }} />
      </Card>
      <Row style={{ justifyContent: 'center', marginTop: 14 }}><T v="bodyMuted">{t('auth.noAccount')} </T><TextLink title={t('auth.create')} onPress={() => router.push('/register')} /></Row>
    </Screen>
  );
}

const regSchema = z.object({
  name: z.string().min(2, 'Enter your name'), email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'), confirm: z.string(), terms: z.literal(true, { message: 'Required' }), privacy: z.literal(true, { message: 'Required' }),
}).refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });
export function Register() {
  const { control, handleSubmit, formState, watch, setValue } = useForm<z.input<typeof regSchema>>({ resolver: zodResolver(regSchema), mode: 'onChange', defaultValues: { name: '', email: '', password: '', confirm: '', terms: false as unknown as true, privacy: false as unknown as true } });
  const submit = handleSubmit((v) => {
    useApp.getState().run((db) => { const a = db.accounts.find((x) => x.id === 'acc_aisyah')!; a.name = v.name; a.email = v.email; a.verified = false; });
    router.push('/role');
  });
  const Check = ({ k, label }: { k: 'terms' | 'privacy'; label: string }) => (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: !!watch(k) }} onPress={() => setValue(k, !watch(k) as true, { shouldValidate: true })} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 44 }}>
      <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: watch(k) ? colors.forest : '#B9C5BE', backgroundColor: watch(k) ? colors.forest : '#fff', alignItems: 'center', justifyContent: 'center' }}>{watch(k) ? <Icon name="check" size={14} color="#fff" strokeWidth={3} /> : null}</View>
      <T v="body" style={{ flex: 1 }}>{label}</T>
    </Pressable>
  );
  return (
    <Screen header={<ScreenHeader title="Create account" />} footer={<PrimaryButton title="Continue" onPress={submit} disabled={!formState.isValid} />}>
      {(['name', 'email', 'password', 'confirm'] as const).map((k) => (
        <Controller key={k} control={control} name={k} render={({ field, fieldState }) => (
          <FormField label={{ name: 'Display name', email: 'Email', password: 'Password', confirm: 'Confirm password' }[k]} value={field.value as string} onChangeText={field.onChange} error={fieldState.error?.message}
            secureTextEntry={k === 'password' || k === 'confirm'} autoCapitalize={k === 'name' ? 'words' : 'none'} keyboardType={k === 'email' ? 'email-address' : 'default'} />
        )} />
      ))}
      <Check k="terms" label="I agree to the Growlink Terms of Service" />
      <Check k="privacy" label="I acknowledge the Privacy Notice (PDPA 2010)" />
    </Screen>
  );
}

export function RoleSelect() {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  return (
    <Screen header={<ScreenHeader />} footer={<PrimaryButton title="Continue" onPress={() => { useApp.getState().signIn('acc_aisyah', 'student'); useApp.getState().set({ setupTeacherProviderId: role === 'teacher' ? 'pending' : undefined }); router.push('/verify'); }} />}>
      <T v="h1">How will you use Growlink?</T><T v="bodyMuted" style={{ marginBottom: 18 }}>You can switch roles later from your profile.</T>
      <Radio selected={role === 'student'} icon="academic" label="I'm here to learn or book services" sub="Find teachers, tutors and service providers nearby." onPress={() => setRole('student')} />
      <Radio selected={role === 'teacher'} icon="sparkle" label="I'm here to teach or offer services" sub="Create a professional profile, packages and availability." onPress={() => setRole('teacher')} />
    </Screen>
  );
}

export function Verify() {
  const acc = useAccount(); const run = useApp((s) => s.run);
  const next = () => router.replace('/account-setup');
  return (
    <Screen header={<ScreenHeader title="Verify email" />}>
      <View style={{ alignItems: 'center', paddingVertical: 10 }}><GrowlyIllustration size={90} mood="calm" /></View>
      <T v="h1" center>Check your inbox</T>
      <T v="bodyMuted" center style={{ marginTop: 6 }}>We sent a verification link to {acc.email}. You can browse now — booking requires a verified email.</T>
      <Gap h={16} />
      <Card><Row style={{ justifyContent: 'space-between' }}><T v="strong">Status</T>{acc.verified ? <T v="strong" color={colors.link}>✓ Verified</T> : <T v="strong" color={colors.warn}>⏳ Not verified</T>}</Row></Card>
      <Gap h={16} />
      <PrimaryButton title={acc.verified ? 'Continue' : 'Verify now (demo)'} onPress={() => { if (!acc.verified) run((db) => { db.accounts.find((a) => a.id === acc.id)!.verified = true; }, 'Email verified (demo)'); else next(); }} />
      <Gap h={10} />
      <SecondaryButton title="Resend email" icon="send" onPress={() => useApp.getState().showToast('Verification email re-sent (simulated)')} />
      <Gap h={6} />
      <Row style={{ justifyContent: 'space-between' }}><TextLink title="Continue browsing" onPress={next} /><TextLink title="Back to login" onPress={() => router.replace('/sign-in')} /></Row>
    </Screen>
  );
}

export function Recover() {
  const [step, setStep] = useState<'request' | 'sent' | 'reset' | 'done'>('request');
  const [email, setEmail] = useState(''); const [p1, setP1] = useState(''); const [p2, setP2] = useState('');
  const validEmail = /\S+@\S+\.\S+/.test(email);
  return (
    <Screen header={<ScreenHeader title="Reset password" />}>
      {step === 'request' && <>
        <T v="bodyMuted" style={{ marginBottom: 14 }}>Enter your account email and we'll send a reset link.</T>
        <FormField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={email && !validEmail ? 'Enter a valid email' : undefined} />
        <PrimaryButton title="Send reset link" disabled={!validEmail} onPress={() => setStep('sent')} />
      </>}
      {step === 'sent' && <>
        <Notice tone="mint" text={`If an account exists for ${email}, a reset link is on its way (simulated).`} /><Gap />
        <PrimaryButton title="Open reset link (demo)" onPress={() => setStep('reset')} />
      </>}
      {step === 'reset' && <>
        <FormField label="New password" value={p1} onChangeText={setP1} secureTextEntry error={p1 && p1.length < 8 ? 'At least 8 characters' : undefined} />
        <FormField label="Confirm password" value={p2} onChangeText={setP2} secureTextEntry error={p2 && p1 !== p2 ? 'Passwords do not match' : undefined} />
        <PrimaryButton title="Update password" disabled={p1.length < 8 || p1 !== p2} onPress={() => setStep('done')} />
      </>}
      {step === 'done' && <><Notice tone="mint" text="Password updated. You can sign in now." /><Gap /><PrimaryButton title="Back to sign in" onPress={() => router.replace('/sign-in')} /></>}
    </Screen>
  );
}

export function AccountSetup() {
  const acc = useAccount(); const lang = useApp((s) => s.lang);
  const [name, setName] = useState(acc.name); const [phone, setPhone] = useState(acc.phone ?? '');
  const phoneOk = /^\+?6?0?1\d[\d\s-]{6,10}$/.test(phone.replace(/\s/g, ''));
  const save = () => {
    useApp.getState().run((db) => { const a = db.accounts.find((x) => x.id === acc.id)!; a.name = name; a.phone = phone; });
    if (useApp.getState().setupTeacherProviderId === 'pending') { router.replace('/role-switch?to=teacher'); return; }
    router.replace('/location-permission');
  };
  return (
    <Screen header={<ScreenHeader title="Set up your account" />} footer={<PrimaryButton title="Save and continue" disabled={name.length < 2 || !phoneOk} onPress={save} />}>
      <View style={{ alignItems: 'center', marginVertical: 12 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" onPress={() => useApp.getState().showToast('Photo picker is simulated in the prototype')}>
          <Avatar initials={name.split(' ').map((x) => x[0]).join('').slice(0, 2)} size={88} />
          <View style={{ position: 'absolute', right: 0, bottom: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' }}><Icon name="camera" size={16} color="#fff" /></View>
        </Pressable>
      </View>
      <FormField label="Display name" value={name} onChangeText={setName} error={name.length < 2 ? 'Enter your name' : undefined} />
      <FormField label="Contact number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+60 12-345 6789" error={phone && !phoneOk ? 'Enter a Malaysian mobile number' : undefined} hint="Only shared with providers you book." />
      <Pressable onPress={() => router.push('/language')} accessibilityRole="button"><FormField label="Language" value={LANGS.find((l) => l.id === lang)!.native} editable={false} right={<Icon name="chevron-right" size={18} color={colors.muted} />} /></Pressable>
      <Notice tone="mint" text="Your personal learner profile is created automatically. Add children later under Learner Profiles." />
    </Screen>
  );
}

export function LocationPermission() {
  const set = useApp((s) => s.set); const [state, setState] = useState<'ask' | 'denied' | 'unavailable'>('ask');
  const done = () => goHome();
  return (
    <Screen header={<ScreenHeader back={false} right={<TextLink title="Skip" onPress={() => { set({ locationPermission: 'denied' }); done(); }} />} />}>
      <View style={{ alignItems: 'center', paddingVertical: 16 }}><GrowlyIllustration size={120} mood="happy" /></View>
      <T v="h1" center>Find help around the corner</T>
      <T v="bodyMuted" center style={{ marginTop: 8, fontSize: 14, lineHeight: 21 }}>Growlink uses your location to show nearby teachers and services, accurate distances and transport fees. We never share your live location.</T>
      <Gap h={20} />
      {state === 'denied' && <><Notice tone="warn" text="Location permission was denied. You can still browse by choosing an area manually." /><Gap /></>}
      {state === 'unavailable' && <><Notice tone="warn" text="Location services are unavailable on this device right now." /><Gap /></>}
      <PrimaryButton title="Use Current Location" icon="locate" onPress={() => { set({ locationPermission: 'granted' }); useApp.getState().setArea('sungai-way'); done(); }} />
      <Gap h={10} />
      <SecondaryButton title="Choose Location Manually" icon="pin" onPress={() => { set({ locationPermission: state === 'ask' ? 'denied' : state }); router.replace('/student'); setTimeout(() => router.push('/location'), 50); }} />
      <Gap h={18} />
      <DemoLabel text="DEMO ONLY · simulate OS response" />
      <Row gap={8} style={{ marginTop: 8 }}>
        <SecondaryButton small title="Deny" onPress={() => { setState('denied'); set({ locationPermission: 'denied' }); }} style={{ flex: 1 }} />
        <SecondaryButton small title="Unavailable" onPress={() => { setState('unavailable'); set({ locationPermission: 'unavailable' }); }} style={{ flex: 1 }} />
      </Row>
      <T v="caption" center style={{ marginTop: 12 }}>Default area: {AREAS[0].name}, {AREAS[0].city}</T>
    </Screen>
  );
}
export { radius, fonts };
