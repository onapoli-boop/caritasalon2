import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLoyalty } from '@/contexts/LoyaltyContext';
import { Palette, Fonts, Spacing } from '@/constants/theme';

export default function OwnerDashboardScreen() {
  const { profile, signOut } = useAuth();
  const { merchant, loading } = useLoyalty();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Palette.background }]}>
      <View style={styles.content}>
        <Text style={[styles.greeting, { color: Palette.primary }]}>
          Dashboard
        </Text>

        {loading ? (
          <Text style={[styles.text, { color: Palette.textMuted }]}>Chargement...</Text>
        ) : merchant ? (
          <View>
            <Text style={[styles.text, { color: Palette.text }]}>
              {merchant.nom}
            </Text>
            <Text style={[styles.info, { color: Palette.textMuted }]}>
              QR Code: {merchant.qr_secret}
            </Text>
            <TouchableOpacity style={[styles.button, { backgroundColor: Palette.accent }]}>
              <Text style={[styles.buttonText, { color: Palette.text }]}>
                Afficher QR Code Comptoir
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={[styles.text, { color: Palette.textMuted }]}>
            Configuration en cours...
          </Text>
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
  info: {
    fontSize: 12,
    fontFamily: Fonts.manrope.fontFamily,
    marginBottom: Spacing.md,
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
