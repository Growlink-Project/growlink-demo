import React, { useMemo, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { colors } from '@/theme/tokens';
import { useApp } from '@/store/useApp';
import { categoryOf, Result } from '@/mocks/services/api';
import { CategoryMapPin, CurrentLocationMarker, ProviderPhotoPin } from './Markers';

/**
 * Locally rendered interactive map fallback (no API key required).
 * World units are metres relative to Sungai Way. Supports drag-pan, zoom controls and marker selection.
 * Swap for react-native-maps + Google provider when configured; the props contract stays the same.
 */
const R = 22000;
function buildWorld() {
  const minor: string[] = []; const blocks: string[] = [];
  for (let x = -R; x <= R; x += 380) minor.push(`M${x + Math.sin(x) * 40} ${-R}L${x - Math.sin(x) * 40} ${R}`);
  for (let y = -R; y <= R; y += 330) minor.push(`M${-R} ${y}L${R} ${y + Math.cos(y) * 60}`);
  for (let x = -R; x < R; x += 760) for (let y = -R; y < R; y += 660) if (((x * 7 + y * 3) / 380) % 3 === 0) blocks.push(`M${x + 60} ${y + 50}h260v220h-260z`);
  const major = [
    `M${-R} 900 C -6000 600, -2500 -300, 0 -520 S 6000 -1800, ${R} -2600`,
    `M -900 ${-R} C -700 -6000, -300 -2000, -200 0 S 400 6000, 600 ${R}`,
    `M ${-R} -4200 C -8000 -3600, -3000 -2200, 2200 -1900 S 9000 -5200, ${R} -6400`,
  ];
  const parks = ['M 900 600 h 900 v 640 h -900 z', 'M -2600 -1500 h 700 v 520 h -700 z', 'M 2600 -3600 h 1100 v 700 h -1100 z', 'M -5200 2400 h 1400 v 900 h -1400 z'];
  const river = `M ${R} -900 C 9000 -600, 5000 -1400, 2800 -1100 S -2000 1800, -6000 2100 S -15000 1500, ${-R} 2600`;
  return { minor: minor.join(' '), blocks: blocks.join(' '), major, parks, river };
}
const WORLD = buildWorld();

export function MapCanvas({ results, bottomInset, onSelect }: { results: Result[]; bottomInset: number; onSelect: (id: string) => void }) {
  const camera = useApp((s) => s.camera); const set = useApp((s) => s.set); const userPos = useApp((s) => s.userPos);
  const selected = useApp((s) => s.selectedProviderId); const perm = useApp((s) => s.locationPermission);
  const [size, setSize] = useState({ w: 380, h: 600 });
  const pan = useRef(new Animated.ValueXY()).current;
  const camRef = useRef(camera); camRef.current = camera;
  const responder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 6,
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_, g) => {
      const c = camRef.current;
      set({ camera: { ...c, cx: c.cx - g.dx / c.zoom, cy: c.cy - g.dy / c.zoom }, mapMoved: true });
      pan.setValue({ x: 0, y: 0 });
    },
    onPanResponderTerminate: () => pan.setValue({ x: 0, y: 0 }),
  }), []);
  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const focalY = Math.max(140, (size.h - bottomInset) * 0.5);
  const toScreen = (dx: number, dy: number) => ({ x: size.w / 2 + (dx - camera.cx) * camera.zoom, y: focalY + (dy - camera.cy) * camera.zoom });
  const W = size.w * 3, H = size.h * 3; // oversized canvas so drag never reveals blank edges
  const tx = size.w + size.w / 2 - camera.cx * camera.zoom, ty = size.h + focalY - camera.cy * camera.zoom;
  const showPhotos = camera.zoom >= 0.07;
  const me = toScreen(userPos.dx, userPos.dy);
  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} {...responder.panHandlers} accessibilityLabel="Map of nearby providers. Drag to move." accessibilityHint="Use the zoom buttons to change scale">
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: size.w, height: size.h, transform: pan.getTranslateTransform() }}>
        <Svg width={W} height={H} style={{ position: 'absolute', left: -size.w, top: -size.h }}>
          <Rect x={0} y={0} width={W} height={H} fill={colors.mapBase} />
          <G transform={`translate(${tx} ${ty}) scale(${camera.zoom})`}>
            <Path d={WORLD.blocks} fill={colors.mapBlock} />
            {WORLD.parks.map((d) => <Path key={d} d={d} fill={colors.mapPark} />)}
            <Path d={WORLD.river} stroke={colors.mapWater} strokeWidth={180} fill="none" strokeLinecap="round" />
            <Path d={WORLD.minor} stroke={colors.mapRoad} strokeWidth={Math.max(18, 4 / camera.zoom)} fill="none" />
            {WORLD.major.map((d) => <Path key={d} d={d} stroke="#FFFFFF" strokeWidth={Math.max(70, 11 / camera.zoom)} fill="none" strokeLinecap="round" />)}
            {WORLD.major.map((d) => <Path key={d + 'e'} d={d} stroke="#E3E9E2" strokeWidth={Math.max(8, 1 / camera.zoom)} fill="none" />)}
          </G>
        </Svg>
        {perm !== 'denied' ? <View style={{ position: 'absolute', left: me.x, top: me.y }}><CurrentLocationMarker /></View> : null}
        {results.map((r) => {
          const pt = toScreen(r.provider.dx, r.provider.dy); const cat = categoryOf(r.provider.categoryId)!;
          if (pt.x < -60 || pt.x > size.w + 60 || pt.y < -80 || pt.y > size.h + 40) return null;
          const sel = selected === r.provider.id;
          return (
            <View key={r.provider.id} style={{ position: 'absolute', left: pt.x, top: pt.y, zIndex: sel ? 10 : 1 }}>
              {showPhotos || sel ? <ProviderPhotoPin p={r.provider} cat={cat} selected={sel} onPress={() => onSelect(r.provider.id)} />
                : <CategoryMapPin cat={cat} label={`${r.provider.name}, ${cat.short}`} onPress={() => onSelect(r.provider.id)} />}
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
}
