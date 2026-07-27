import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Palette, Fonts, Spacing, Radius } from '@/constants/theme';

interface QRScannerProps {
  onScanned: (data: string) => void;
  onClose: () => void;
  title?: string;
}

export default function QRScanner({ onScanned, onClose, title = 'Scanner le QR code' }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Palette.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Palette.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Palette.background }]}>
        <View style={styles.center}>
          <Text style={[styles.text, { color: Palette.text, marginBottom: Spacing.md }]}>
            Accès caméra requis
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            style={[styles.button, { backgroundColor: Palette.primary }]}
          >
            <Text style={[styles.buttonText, { color: Palette.textLight }]}>
              Autoriser caméra
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!scanning) return;

    setScanning(false);

    // Éviter les scans multiples
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);

    onScanned(data);

    scanTimeoutRef.current = setTimeout(() => {
      setScanning(true);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Palette.primary }]}>{title}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={[styles.closeButton, { color: Palette.textMuted }]}>✕</Text>
        </TouchableOpacity>
      </View>

      <CameraView
        style={styles.camera}
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={[styles.scanBox, { borderColor: Palette.primary }]} />
          <Text style={[styles.hint, { color: Palette.textLight }]}>
            Alignez le QR code dans le cadre
          </Text>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Palette.surface,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.manropeBold.fontFamily,
  },
  closeButton: {
    fontSize: 24,
    fontFamily: Fonts.manrope.fontFamily,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanBox: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderRadius: Radius.md,
    backgroundColor: 'transparent',
  },
  hint: {
    marginTop: Spacing.lg,
    fontFamily: Fonts.manrope.fontFamily,
    fontSize: 14,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  buttonText: {
    fontFamily: Fonts.manropeBold.fontFamily,
    fontSize: 14,
  },
  text: {
    fontFamily: Fonts.manrope.fontFamily,
  },
});
