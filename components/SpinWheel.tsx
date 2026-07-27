import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';
import { Palette, Fonts, Spacing, Radius, Shadows } from '@/constants/theme';
import { Reward } from '@/types/database';
import * as Haptics from 'expo-haptics';

interface SpinWheelProps {
  rewards: Reward[];
  onSpin: () => Promise<{ error: string | null; result?: any }>;
  spinsAvailable: number;
  loading?: boolean;
}

export default function SpinWheel({
  rewards,
  onSpin,
  spinsAvailable,
  loading = false,
}: SpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const handleSpin = async () => {
    if (spinsAvailable <= 0 || spinning || loading) return;

    setSpinning(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { error, result } = await onSpin();

      if (!error && result) {
        // Animation : spinner 3-4 tours + arriver à la bonne position
        const randomSpin = Math.floor(Math.random() * 360) + 1080; // 3 tours + random
        setRotation((prev) => prev + randomSpin);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setSpinning(false);
    }
  };

  const radius = 120;
  const numSegments = rewards.length || 1;
  const anglePerSegment = 360 / numSegments;
  const cx = radius;
  const cy = radius;

  // Générer les points pour chaque segment
  const segments = rewards.map((reward, index) => {
    const startAngle = (index * anglePerSegment - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * anglePerSegment - 90) * (Math.PI / 180);

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const color = `hsl(${(index * 360) / numSegments}, 70%, 60%)`;

    return (
      <Polygon
        key={index}
        points={`${cx},${cy} ${x1},${y1} ${x2},${y2}`}
        fill={color}
        strokeWidth="1"
        stroke={Palette.surface}
      />
    );
  });

  return (
    <View style={styles.container}>
      <View style={[styles.wheelContainer, { transform: [{ rotate: `${rotation}deg` }] }]}>
        <Svg width={radius * 2} height={radius * 2} viewBox={`0 0 ${radius * 2} ${radius * 2}`}>
          <Circle cx={radius} cy={radius} r={radius} fill={Palette.card} stroke={Palette.border} strokeWidth="2" />
          {segments}
        </Svg>
      </View>

      {/* Pointer / Flèche */}
      <View style={styles.pointer} />

      {/* Bouton au centre */}
      <TouchableOpacity
        onPress={handleSpin}
        disabled={spinning || spinsAvailable <= 0 || loading}
        style={[
          styles.spinButton,
          { backgroundColor: Palette.primary },
          (spinning || spinsAvailable <= 0) && { opacity: 0.5 },
        ]}
      >
        {spinning || loading ? (
          <ActivityIndicator size="small" color={Palette.textLight} />
        ) : (
          <Text style={[styles.spinText, { color: Palette.textLight }]}>
            SPIN
          </Text>
        )}
      </TouchableOpacity>

      {/* Info */}
      <Text style={[styles.infoText, { color: Palette.textMuted }]}>
        {spinsAvailable} tour{spinsAvailable !== 1 ? 's' : ''} disponible{spinsAvailable !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  wheelContainer: {
    marginBottom: Spacing.lg,
  },
  pointer: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Palette.primary,
    zIndex: 10,
  },
  spinButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  spinText: {
    fontFamily: Fonts.manropeBold.fontFamily,
    fontSize: 16,
  },
  infoText: {
    fontFamily: Fonts.manrope.fontFamily,
    fontSize: 12,
  },
});
