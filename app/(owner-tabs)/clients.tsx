import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Palette, Fonts, Spacing } from '@/constants/theme';

export default function ClientsScreen() {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Palette.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: Palette.primary }]}>Clients</Text>
        <Text style={[styles.text, { color: Palette.textMuted }]}>À implémenter</Text>
      </View>
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
  title: {
    fontSize: 28,
    fontFamily: Fonts.italiana.fontFamily,
    marginBottom: Spacing.lg,
  },
  text: {
    fontFamily: Fonts.manrope.fontFamily,
  },
});
