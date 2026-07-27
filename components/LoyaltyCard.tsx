import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'expo-linear-gradient';
import { Palette, Fonts, Spacing, Radius, Shadows, CardKits } from '@/constants/theme';
import { ClientMerchant, MerchantConfig } from '@/types/database';

interface LoyaltyCardProps {
  clientMerchant: ClientMerchant | null;
  merchant: MerchantConfig | null;
  clientName?: string;
}

export default function LoyaltyCard({ clientMerchant, merchant, clientName }: LoyaltyCardProps) {
  if (!clientMerchant || !merchant) {
    return null;
  }

  const kit = CardKits.rosewood; // TODO: personnaliser par merchant

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={kit.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, Shadows.heavy]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.merchantName, { color: kit.text }]}>
            {merchant.nom}
          </Text>
          <Text style={[styles.tierBadge, { color: Palette.accent }]}>
            {clientMerchant.niveau_fidelite}
          </Text>
        </View>

        {/* Points + Tier progress */}
        <View style={styles.pointsSection}>
          <Text style={[styles.pointsValue, { color: Palette.accent }]}>
            {clientMerchant.points_balance}
          </Text>
          <Text style={[styles.pointsLabel, { color: kit.text }]}>points</Text>
        </View>

        {/* Spins available */}
        <View style={styles.spinsSection}>
          <Text style={[styles.spinsValue, { color: Palette.accent }]}>
            {clientMerchant.spins_available}
          </Text>
          <Text style={[styles.spinsLabel, { color: kit.text }]}>tours gratuits</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.clientName, { color: kit.text }]}>
            {clientName || 'Client'}
          </Text>
          <Text style={[styles.memberNumber, { color: kit.text, opacity: 0.7 }]}>
            Membre depuis {new Date(clientMerchant.created_at).getFullYear()}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.lg,
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    minHeight: 280,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  merchantName: {
    fontSize: 20,
    fontFamily: Fonts.italiana.fontFamily,
  },
  tierBadge: {
    fontSize: 12,
    fontFamily: Fonts.manropeBold.fontFamily,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  pointsSection: {
    marginBottom: Spacing.lg,
  },
  pointsValue: {
    fontSize: 32,
    fontFamily: Fonts.italiana.fontFamily,
  },
  pointsLabel: {
    fontSize: 12,
    fontFamily: Fonts.manrope.fontFamily,
    marginTop: 2,
  },
  spinsSection: {
    marginBottom: Spacing.lg,
  },
  spinsValue: {
    fontSize: 24,
    fontFamily: Fonts.manropeBold.fontFamily,
  },
  spinsLabel: {
    fontSize: 11,
    fontFamily: Fonts.manrope.fontFamily,
    marginTop: 2,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: Spacing.md,
  },
  clientName: {
    fontSize: 14,
    fontFamily: Fonts.manropeBold.fontFamily,
    marginBottom: 2,
  },
  memberNumber: {
    fontSize: 11,
    fontFamily: Fonts.manrope.fontFamily,
  },
});
