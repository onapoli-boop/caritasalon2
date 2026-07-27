import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable, Alert, RefreshControl,
} from 'react-native';
import { ShoppingBag, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { useLoyalty } from '@/contexts/LoyaltyContext';
import { CatalogItem, Redemption } from '@/types/database';
import { Palette, Fonts, Spacing, Radius, Shadows } from '@/constants/theme';
import ConfirmModal from '@/components/ConfirmModal';

const typeLabel: Record<CatalogItem['type'], string> = {
  soin: '✦ Soin',
  produit: '★ Produit',
  reduction: '% Réduction',
  autre: '· Offre',
};

const statusIcon: Record<Redemption['status'], React.ReactNode> = {
  pending: <Clock size={14} color={Palette.warning} />,
  approved: <CheckCircle size={14} color={Palette.success} />,
  refused: <XCircle size={14} color={Palette.error} />,
  cancelled: <XCircle size={14} color={Palette.textMuted} />,
};

const statusLabel: Record<Redemption['status'], string> = {
  pending: 'En attente de validation',
  approved: 'Validé par le salon',
  refused: 'Refusé',
  cancelled: 'Annulé',
};

export default function RewardsScreen() {
  const { catalogItems, myRedemptions, refreshData, loading } = useLoyalty();
  const [tab, setTab] = useState<'catalogue' | 'activite'>('catalogue');
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleRequest = async (item: CatalogItem) => {
    if (busy) return;
    setBusy(item.id);
    // Appel RPC pour demander l'échange (à implémenter)
    Alert.alert('Échange', `Demande d'échange pour "${item.titre}" pour ${item.points_cost} points`);
    setBusy(null);
  };

  const handleCancel = (id: string) => setConfirmCancelId(id);

  const confirmCancel = async () => {
    if (!confirmCancelId) return;
    const id = confirmCancelId;
    setConfirmCancelId(null);
    // Appel RPC pour annuler (à implémenter)
    Alert.alert('Annulation', 'Demande annulée');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Palette.background }]}>
        <View style={styles.content}>
          <Text style={[styles.text, { color: Palette.textMuted }]}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: Palette.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: Palette.primary }]}>Récompenses</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['catalogue', 'activite'] as const).map((t) => (
            <Pressable
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'catalogue' ? 'À échanger' : 'Mon activité'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Contenu */}
        {tab === 'catalogue' ? (
          catalogItems.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={[styles.emptyText, { color: Palette.textMuted }]}>
                Aucun article disponible pour l'instant.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {catalogItems.map((item) => (
                <View key={item.id} style={[styles.itemCard, Shadows.light]}>
                  <View style={styles.itemTop}>
                    <Text style={[styles.itemType, { color: Palette.primary }]}>
                      {typeLabel[item.type]}
                    </Text>
                    {item.stock !== null && (
                      <Text style={[styles.itemStock, { color: Palette.textMuted }]}>
                        {item.stock} restant{item.stock !== 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.itemTitle, { color: Palette.text }]}>{item.titre}</Text>
                  {item.description && (
                    <Text style={[styles.itemDesc, { color: Palette.textMuted }]}>
                      {item.description}
                    </Text>
                  )}
                  <View style={styles.itemBottom}>
                    <Text style={[styles.itemCost, { color: Palette.primary }]}>
                      {item.points_cost} pts
                    </Text>
                    <Pressable
                      onPress={() => handleRequest(item)}
                      disabled={busy === item.id}
                      style={[styles.cta, { backgroundColor: Palette.primary }]}
                    >
                      <Text style={[styles.ctaText, { color: Palette.textLight }]}>
                        {busy === item.id ? '…' : 'Échanger'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )
        ) : (
          myRedemptions.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={[styles.emptyText, { color: Palette.textMuted }]}>
                Aucune activité pour l'instant.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {myRedemptions.map((r) => (
                <View key={r.id} style={[styles.itemCard, Shadows.light]}>
                  <View style={styles.statusRow}>
                    {statusIcon[r.status]}
                    <Text style={[styles.statusText, { color: Palette.textMuted }]}>
                      {statusLabel[r.status]}
                    </Text>
                  </View>
                  <Text style={[styles.itemTitle, { color: Palette.text }]}>
                    {r.catalog_items?.titre || '–'}
                  </Text>
                  {r.catalog_items?.description && (
                    <Text style={[styles.itemDesc, { color: Palette.textMuted }]}>
                      {r.catalog_items.description}
                    </Text>
                  )}
                  <View style={styles.itemBottom}>
                    <Text style={[styles.itemCost, { color: Palette.primary }]}>
                      {r.points_cost} pts
                    </Text>
                    {r.status === 'pending' && (
                      <Pressable
                        onPress={() => handleCancel(r.id)}
                        style={[styles.cancelBtn, { borderColor: Palette.error }]}
                      >
                        <Text style={[styles.cancelText, { color: Palette.error }]}>Annuler</Text>
                      </Pressable>
                    )}
                  </View>
                  <Text style={[styles.date, { color: Palette.textMuted }]}>
                    {new Date(r.requested_at).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              ))}
            </View>
          )
        )}
      </View>

      <ConfirmModal
        visible={!!confirmCancelId}
        title="Annuler la demande ?"
        message="Cette demande d'échange sera annulée."
        confirmLabel="Annuler"
        cancelLabel="Retour"
        destructive
        onConfirm={confirmCancel}
        onCancel={() => setConfirmCancelId(null)}
      />
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: Palette.background,
    borderRadius: Radius.md,
    padding: 4,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Palette.surface,
    ...Shadows.light,
  },
  tabText: {
    fontSize: 14,
    fontFamily: Fonts.manropeBold.fontFamily,
    color: Palette.textMuted,
  },
  tabTextActive: {
    color: Palette.primary,
  },
  list: {
    gap: Spacing.md,
  },
  itemCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
    gap: Spacing.sm,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemType: {
    fontSize: 11,
    fontFamily: Fonts.manropeBold.fontFamily,
    textTransform: 'uppercase',
  },
  itemStock: {
    fontSize: 11,
    fontFamily: Fonts.manrope.fontFamily,
  },
  itemTitle: {
    fontSize: 16,
    fontFamily: Fonts.manropeBold.fontFamily,
  },
  itemDesc: {
    fontSize: 13,
    fontFamily: Fonts.manrope.fontFamily,
    lineHeight: 18,
  },
  itemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  itemCost: {
    fontSize: 20,
    fontFamily: Fonts.manropeBold.fontFamily,
  },
  cta: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: Fonts.manropeBold.fontFamily,
    fontSize: 13,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusText: {
    fontSize: 12,
    fontFamily: Fonts.manrope.fontFamily,
  },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  cancelText: {
    fontFamily: Fonts.manropeBold.fontFamily,
    fontSize: 13,
  },
  date: {
    fontSize: 11,
    fontFamily: Fonts.manrope.fontFamily,
    marginTop: Spacing.sm,
  },
  emptyBlock: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.manrope.fontFamily,
    textAlign: 'center',
  },
});
