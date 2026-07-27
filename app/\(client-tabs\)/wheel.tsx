import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useLoyalty } from '@/contexts/LoyaltyContext';
import SpinWheel from '@/components/SpinWheel';
import { Fonts, Palette, Radius, Shadows, Spacing } from '@/constants/theme';
import Constants from 'expo-constants';

const merchantName = Constants.expoConfig?.extra?.merchantName || 'Salon';

export default function WheelScreen() {
  const { merchant, clientMerchant, loading } = useLoyalty();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Palette.background }]}>
        <View style={styles.content}>
          <Text style={[styles.text, { color: Palette.textMuted }]}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!clientMerchant) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Palette.background }]}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: Palette.primary }]}>La Roue</Text>
          <Text style={[styles.text, { color: Palette.textMuted }]}>
            Scannez le QR code du salon pour débloquer la roue de la chance.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: Palette.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: Palette.primary }]}>La Roue</Text>

        <View style={[styles.infoCard, Shadows.light]}>
          <Text style={[styles.infoLabel, { color: Palette.textMuted }]}>Tours disponibles</Text>
          <Text style={[styles.infoValue, { color: Palette.primary }]}>
            {clientMerchant.tours_restants || 0}
          </Text>
        </View>

        <View style={[styles.wheelCard, Shadows.light]}>
          <SpinWheel />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.italiana.fontFamily,
    marginBottom: Spacing.md,
  },
  text: {
    fontSize: 14,
    fontFamily: Fonts.manrope.fontFamily,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: Fonts.manrope.fontFamily,
    marginBottom: Spacing.sm,
  },
  infoValue: {
    fontSize: 48,
    fontFamily: Fonts.italiana.fontFamily,
  },
  wheelCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
});
