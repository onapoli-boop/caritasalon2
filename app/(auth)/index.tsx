import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Palette, Fonts, Spacing, Radius, Shadows } from '@/constants/theme';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp, profile } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, nom, isOwner);
        if (error) {
          setError(error);
        } else {
          router.replace(isOwner ? '/(owner-tabs)' : '/(client-tabs)');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error);
        } else {
          setTimeout(() => {
            if (profile?.is_owner) {
              router.replace('/(owner-tabs)');
            } else {
              router.replace('/(client-tabs)');
            }
          }, 100);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Palette.background }]}>
      <KeyboardAvoidingView behavior="padding" style={styles.inner}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: Palette.primary }]}>GlowPass</Text>
          <Text style={[styles.subtitle, { color: Palette.textMuted }]}>
            {isSignUp ? 'Créer un compte' : 'Connexion'}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
            style={[styles.input, { borderColor: Palette.border }]}
            placeholderTextColor={Palette.textMuted}
          />

          <TextInput
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
            style={[styles.input, { borderColor: Palette.border }]}
            placeholderTextColor={Palette.textMuted}
          />

          {isSignUp && (
            <>
              <TextInput
                placeholder="Nom"
                value={nom}
                onChangeText={setNom}
                editable={!loading}
                style={[styles.input, { borderColor: Palette.border }]}
                placeholderTextColor={Palette.textMuted}
              />

              <TouchableOpacity
                style={[styles.checkboxRow, { borderColor: Palette.border }]}
                onPress={() => setIsOwner(!isOwner)}
                disabled={loading}
              >
                <View
                  style={[
                    styles.checkbox,
                    isOwner && { backgroundColor: Palette.primary, borderColor: Palette.primary },
                    { borderColor: Palette.border },
                  ]}
                >
                  {isOwner && <Text style={{ color: Palette.textLight }}>✓</Text>}
                </View>
                <Text style={[styles.checkboxLabel, { color: Palette.text }]}>
                  Je suis propriétaire du commerçant
                </Text>
              </TouchableOpacity>
            </>
          )}

          {error && <Text style={[styles.error, { color: Palette.error }]}>{error}</Text>}

          <TouchableOpacity
            onPress={handleAuth}
            disabled={loading}
            style={[styles.button, { backgroundColor: Palette.primary }]}
          >
            <Text style={[styles.buttonText, { color: Palette.textLight }]}>
              {loading ? '...' : isSignUp ? 'S\'inscrire' : 'Se connecter'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => { setIsSignUp(!isSignUp); setError(''); }}>
          <Text style={[styles.toggleText, { color: Palette.textMuted }]}>
            {isSignUp ? 'Déjà inscrit ?' : 'Pas encore de compte ?'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xxl,
    alignItems: 'center',
  },
  title: {
    fontSize: Fonts.italiana.fontSize,
    fontFamily: Fonts.italiana.fontFamily,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.manrope.fontFamily,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    fontFamily: Fonts.manrope.fontFamily,
    backgroundColor: Palette.surface,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: Fonts.manrope.fontFamily,
    fontSize: 14,
  },
  error: {
    fontSize: 12,
    marginBottom: Spacing.md,
    fontFamily: Fonts.manrope.fontFamily,
  },
  button: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    ...Shadows.light,
  },
  buttonText: {
    fontFamily: Fonts.manropeBold.fontFamily,
    fontSize: 16,
  },
  toggleText: {
    textAlign: 'center',
    fontFamily: Fonts.manrope.fontFamily,
    fontSize: 14,
  },
});
