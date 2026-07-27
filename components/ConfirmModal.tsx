import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Fonts, Palette, Radius, Spacing } from '@/constants/theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible, title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler',
  destructive = true, onConfirm, onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.btnRow}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, destructive && styles.confirmBtnDestructive]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(44,23,32,0.55)',
    alignItems: 'center', justifyContent: 'center', padding: Spacing.md,
  },
  card: {
    width: '100%', maxWidth: 360, backgroundColor: Palette.blanc,
    borderRadius: Radius.xl, padding: 24, gap: 12,
  },
  title: { fontFamily: Fonts.display, fontSize: 22, color: Palette.texte },
  message: { fontFamily: Fonts.medium, fontSize: 14, color: Palette.texteMuet, lineHeight: 20 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Palette.ligne,
    borderRadius: Radius.full, paddingVertical: 14, alignItems: 'center',
  },
  cancelText: { fontFamily: Fonts.bold, fontSize: 15, color: Palette.texteMuet },
  confirmBtn: { flex: 1, backgroundColor: Palette.rosewood, borderRadius: Radius.full, paddingVertical: 14, alignItems: 'center' },
  confirmBtnDestructive: { backgroundColor: Palette.erreur },
  confirmText: { fontFamily: Fonts.bold, fontSize: 15, color: Palette.blanc },
});
