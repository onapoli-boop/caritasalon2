import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLoyalty } from '@/contexts/LoyaltyContext';
import { Palette, Fonts, Spacing } from '@/constants/theme';

export default function ClientHomeScreen() {
  const { profile, signOut } = useAuth();
  const { merchant, clientMerchant, loading } = useLoyalty();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Palette.background }]}>
      <View style={styles.content}>
        <Text style={[styles.greeting, { color: Palette.primary }]}>
          Bienvenue, {profile?.nom || 'client'} !
        </Text>

        {loading ? (
          <Text style={[styles.text, { color: Palette.textMuted }]}>Chargement...</Text>
        ) : !clientMerchant ? (
          <View>
            <Text style={[styles.text, { color: Palette.textMuted }]}>
              Scanner le QR code du commerçant pour adhérer
            </Text>
            <TouchableOpacity style={[styles.button, { backgroundColor: Palette.primary }]}>
              <Text style={[styles.buttonText, { color: Palette.textLight }]}>
                Scanner QR Code
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={[styles.text, { color: Palette.text }]}>
              {merchant?.nom}
            </Text>
            <Text style={[styles.points, { color: Palette.primary }]}>
              {clientMerchant.points_balance} points • {clientMerchant.niveau_fidelite}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={signOut}
        style={[styles.logoutButton, { borderColor: Palette.error }]}
      >
        <Text style={[styles.logoutText, { color: Palette.error }]}>Déconnexion</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  greeting: {
    fontSize: 28,
    fontFamily: Fonts.italiana.fontFamily,
    marginBottom: Spacing.xl,
  },
  text: {
    fontSize: 14,
    fontFamily: Fonts.manrope.fontFamily,
    marginBottom: Spacing.md,
  },
  points: {
    fontSize: 20,
    fontFamily: Fonts.manropeBold.fontFamily,
  },
  button: {
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: Fonts.manropeBold.fontFamily,
  },
  logoutButton: {
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  logoutText: {
    fontFamily: Fonts.manropeBold.fontFamily,
  },
});
