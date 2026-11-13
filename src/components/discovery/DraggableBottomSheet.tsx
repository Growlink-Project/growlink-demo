import React, { ReactNode, useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '@/theme/tokens';
import { Icon } from '../ui/Icon';
import type { SheetSnap } from '@/store/useApp';

/**
 * Three-snap draggable sheet (collapsed / default / full).
 * Drag is captured only on the handle/header strip so carousels and the inner ScrollView keep their own gestures.
 * Accessible buttons expand/collapse without swiping.
 */
export function snapHeights(container: number) {
  return { collapsed: 104, default: Math.round(Math.min(Math.max(container * 0.4, 270), container - 80)), full: container - 8 };
}
export function DraggableBottomSheet({ container, snap, onSnap, header, children }: { container: number; snap: SheetSnap; onSnap: (s: SheetSnap) => void; header: ReactNode; children: ReactNode }) {
  const H = snapHeights(container);
  const offsetFor = (s: SheetSnap) => H.full - H[s];
  const y = useRef(new Animated.Value(offsetFor(snap))).current;
  const base = useRef(offsetFor(snap));
  const snapRef = useRef(snap); snapRef.current = snap;
  const Href = useRef(H); Href.current = H;
  useEffect(() => {
    base.current = offsetFor(snap);
    Animated.spring(y, { toValue: base.current, useNativeDriver: false, damping: 22, stiffness: 220, mass: 0.9 }).start();
  }, [snap, container]);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_, g) => { const h = Href.current; y.setValue(Math.min(h.full - h.collapsed, Math.max(0, base.current + g.dy))); },
    onPanResponderRelease: (_, g) => {
      const h = Href.current; const pos = base.current + g.dy;
      const cand: SheetSnap[] = ['full', 'default', 'collapsed'];
      let target = cand.reduce((best, s) => (Math.abs(h.full - h[s] - pos) < Math.abs(h.full - h[best] - pos) ? s : best), 'default' as SheetSnap);
      if (g.vy < -0.8) target = snapRef.current === 'collapsed' ? 'default' : 'full';
      if (g.vy > 0.8) target = snapRef.current === 'full' ? 'default' : 'collapsed';
      if (target === snapRef.current) Animated.spring(y, { toValue: base.current, useNativeDriver: false }).start();
      onSnap(target);
    },
  }), []);
  const next: SheetSnap = snap === 'collapsed' ? 'default' : snap === 'default' ? 'full' : 'default';
  return (
    <Animated.View style={[st.sheet, { height: H.full, transform: [{ translateY: y }] }]}>
      <View {...responder.panHandlers}>
        <Pressable accessibilityRole="button" accessibilityLabel={snap === 'full' ? 'Collapse results' : 'Expand results'} onPress={() => onSnap(next)} style={st.handleHit}>
          <View style={st.handle} />
        </Pressable>
        {header}
      </View>
      <View style={{ flex: 1, overflow: 'hidden' }}>{children}</View>
      {snap === 'collapsed' ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Show list" onPress={() => onSnap('default')} style={st.expandBtn}><Icon name="chevron-up" size={18} /></Pressable>
      ) : null}
    </Animated.View>
  );
}
const st = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderTopWidth: 1, borderColor: colors.line,
    shadowColor: '#10251B', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 8 },
  handleHit: { alignItems: 'center', paddingTop: 10, paddingBottom: 6, minHeight: 28 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#D3DCD6' },
  expandBtn: { position: 'absolute', right: 14, top: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
});
