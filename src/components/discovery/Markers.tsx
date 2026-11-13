import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Pressable, StyleSheet, View } from 'react-native';
import { colors, elevation } from '@/theme/tokens';
import { IMG } from '@/assets';
import { Icon } from '../ui/Icon';
import { T } from '../ui/core';
import { useApp } from '@/store/useApp';
import type { Category, Provider } from '@/mocks/types';

/**
 * Current-location marker: fixed bear symbol in a ~44px mint core, with layered translucent halos
 * that breathe (scale + opacity in and out) on slightly different periods. No travelling rings.
 */
const LAYERS = [
  { size: 76, period: 3400, from: 0.92, to: 1.08, o1: 0.42, o2: 0.26, delay: 0 },
  { size: 112, period: 4000, from: 0.9, to: 1.1, o1: 0.26, o2: 0.12, delay: 380 },
  { size: 150, period: 4600, from: 0.88, to: 1.1, o1: 0.16, o2: 0.06, delay: 760 },
];
export function CurrentLocationMarker() {
  const demoReduce = useApp((s) => s.demo.reduceMotion);
  const [sysReduce, setSysReduce] = useState(false);
  const vals = useRef(LAYERS.map(() => new Animated.Value(0))).current;
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled?.().then(setSysReduce).catch(() => {}); const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setSysReduce); return () => sub?.remove?.(); }, []);
  const reduce = demoReduce || sysReduce;
  useEffect(() => {
    if (reduce) { vals.forEach((v) => v.setValue(0.5)); return; }
    const loops = vals.map((v, i) => Animated.loop(Animated.sequence([
      Animated.delay(LAYERS[i].delay),
      Animated.timing(v, { toValue: 1, duration: LAYERS[i].period / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: LAYERS[i].period / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])));
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [reduce]);
  return (
    <View style={m.locWrap} pointerEvents="none" accessibilityLabel="Your location">
      {LAYERS.slice().reverse().map((L, ri) => {
        const i = LAYERS.length - 1 - ri; const v = vals[i];
        return <Animated.View key={i} style={[m.halo, { width: L.size, height: L.size, borderRadius: L.size / 2, marginLeft: -L.size / 2, marginTop: -L.size / 2,
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [L.o1, L.o2] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [L.from, L.to] }) }] }]} />;
      })}
      <View style={m.core}><Image source={IMG.growly} style={{ width: 50, height: 50 }} /></View>
    </View>
  );
}

export function ProviderPhotoPin({ p, cat, selected, onPress }: { p: Provider; cat: Category; selected?: boolean; onPress: () => void }) {
  const size = selected ? 60 : 50;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${p.name}, ${p.headline}${selected ? ', selected' : ''}`} onPress={onPress} hitSlop={6}
      style={{ alignItems: 'center', marginLeft: -size / 2, marginTop: -size - 8, zIndex: selected ? 10 : 1 }}>
      <View style={[m.photoRing, { width: size, height: size, borderRadius: size / 2 }, selected && { borderColor: colors.green, borderWidth: 3 }]}>
        {p.photo ? <Image source={IMG[p.photo]} style={{ width: '100%', height: '100%', borderRadius: size / 2 }} /> :
          <View style={{ flex: 1, alignSelf: 'stretch', borderRadius: size / 2, backgroundColor: colors.mintTint, alignItems: 'center', justifyContent: 'center' }}><T v="strong" color={colors.forest}>{p.initials}</T></View>}
      </View>
      <View style={[m.catBadge, { backgroundColor: cat.tint }]}><Icon name={cat.icon} size={11} color={cat.fg} strokeWidth={2.2} /></View>
      <View style={[m.tri, selected && { borderTopColor: colors.green }]} />
    </Pressable>
  );
}
export function CategoryMapPin({ cat, label, onPress, selected }: { cat: Category; label: string; onPress: () => void; selected?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8} style={{ alignItems: 'center', marginLeft: -20, marginTop: -48 }}>
      <View style={[m.catPin, selected && { borderColor: colors.green, borderWidth: 2 }]}><Icon name={cat.icon} size={18} color={cat.fg} /></View>
      <View style={[m.tri, { borderTopColor: '#fff' }]} />
    </Pressable>
  );
}

const m = StyleSheet.create({
  locWrap: { width: 0, height: 0, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', left: 0, top: 0, backgroundColor: colors.mintDeep, borderWidth: 1.5, borderColor: 'rgba(47,163,107,0.35)' },
  core: { position: 'absolute', left: -22, top: -22, width: 44, height: 44, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint, borderWidth: 2, borderColor: '#fff', ...elevation },
  photoRing: { borderWidth: 3, borderColor: '#fff', backgroundColor: '#fff', ...elevation },
  catBadge: { position: 'absolute', right: -6, top: -4, width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tri: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: colors.forest, marginTop: -1 },
  catPin: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...elevation, borderWidth: 1, borderColor: colors.line },
});
