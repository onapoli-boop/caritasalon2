import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import {
  ClientMerchant, MerchantConfig, Reward, CatalogItem, Redemption,
  SpinsHistory, PointsHistory,
} from '@/types/database';

interface LoyaltyContextType {
  // Données du merchant (config + stats)
  merchant: MerchantConfig | null;
  clientMerchant: ClientMerchant | null;

  // Catalogues et récompenses
  rewards: Reward[];
  catalogItems: CatalogItem[];
  myRedemptions: Redemption[];
  spinsHistory: SpinsHistory[];
  pointsHistory: PointsHistory[];

  // État des demandes en attente (côté owner)
  pendingRedemptions: Redemption[];
  pendingSpins: SpinsHistory[];

  loading: boolean;
  refreshData: () => Promise<void>;

  // RPC
  linkToMerchant: (qrSecret: string) => Promise<{ error: string | null; merchantName?: string }>;
  spinWheel: () => Promise<{ error: string | null; result?: any }>;
  requestRedemption: (catalogItemId: string) => Promise<{ error: string | null }>;
  reviewRedemption: (redemptionId: string, approve: boolean) => Promise<{ error: string | null }>;
  recordVisit: (clientId: string, points: number, spins: number) => Promise<{ error: string | null }>;
  adjustPoints: (clientId: string, amount: number, description?: string) => Promise<{ error: string | null }>;
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function LoyaltyProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [merchant, setMerchant] = useState<MerchantConfig | null>(null);
  const [clientMerchant, setClientMerchant] = useState<ClientMerchant | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<Redemption[]>([]);
  const [spinsHistory, setSpinsHistory] = useState<SpinsHistory[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([]);
  const [pendingRedemptions, setPendingRedemptions] = useState<Redemption[]>([]);
  const [pendingSpins, setPendingSpins] = useState<SpinsHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    try {
      // Récupérer merchant_config
      const { data: merchantData } = await supabase
        .from('merchant_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      setMerchant((merchantData as MerchantConfig) || null);

      if (merchantData) {
        const merchantId = merchantData.id;

        // Client data
        if (profile.is_owner === false) {
          const { data: cmData } = await supabase
            .from('client_merchant')
            .select('*')
            .eq('client_id', user.id)
            .eq('merchant_id', merchantId)
            .maybeSingle();

          setClientMerchant((cmData as ClientMerchant) || null);

          const [{ data: rewards }, { data: catalog }, { data: reds }, { data: spins }, { data: points }] =
            await Promise.all([
              supabase.from('rewards').select('*').eq('merchant_id', merchantId).eq('is_active', true),
              supabase.from('catalog_items').select('*').eq('merchant_id', merchantId).eq('is_active', true),
              supabase.from('redemptions').select('*, catalog_items(titre, description)')
                .eq('client_id', user.id).eq('merchant_id', merchantId),
              supabase.from('spins_history').select('*, rewards(titre, valeur, type)')
                .eq('client_id', user.id).eq('merchant_id', merchantId),
              supabase.from('points_history').select('*')
                .eq('client_id', user.id).eq('merchant_id', merchantId),
            ]);

          setRewards((rewards as Reward[]) || []);
          setCatalogItems((catalog as CatalogItem[]) || []);
          setMyRedemptions((reds as Redemption[]) || []);
          setSpinsHistory((spins as SpinsHistory[]) || []);
          setPointsHistory((points as PointsHistory[]) || []);
        } else {
          // Owner data
          const [{ data: rewards }, { data: catalog }, { data: pending }, { data: pendingSpins }] =
            await Promise.all([
              supabase.from('rewards').select('*').eq('merchant_id', merchantId),
              supabase.from('catalog_items').select('*').eq('merchant_id', merchantId),
              supabase.from('redemptions').select('*, catalog_items(titre), profiles(nom, email)')
                .eq('merchant_id', merchantId).eq('status', 'pending'),
              supabase.from('spins_history').select('*, profiles(nom), rewards(titre, valeur, type)')
                .eq('merchant_id', merchantId).eq('status', 'pending'),
            ]);

          setRewards((rewards as Reward[]) || []);
          setCatalogItems((catalog as CatalogItem[]) || []);
          setPendingRedemptions((pending as Redemption[]) || []);
          setPendingSpins((pendingSpins as SpinsHistory[]) || []);
        }
      }
    } catch (e) {
      console.error('Loyalty refresh error:', e);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Realtime pour les clients
  useEffect(() => {
    if (!user || profile?.is_owner !== false || !merchant) return;
    const channel = supabase
      .channel(`client_realtime_${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'client_merchant', filter: `client_id=eq.${user.id}` },
        () => { refreshData(); })
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'redemptions', filter: `client_id=eq.${user.id}` },
        () => { refreshData(); })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, profile, merchant, refreshData]);

  // ====== RPC ======

  const linkToMerchant = async (qrSecret: string) => {
    try {
      const { data } = await supabase.rpc('link_to_merchant', { p_qr_secret: qrSecret });
      if (data?.error) {
        return { error: data.error };
      }
      await refreshData();
      return { error: null, merchantName: data.merchant_name };
    } catch (e) {
      return { error: msg(e) };
    }
  };

  const spinWheel = async () => {
    try {
      const { data } = await supabase.rpc('spin_wheel', {});
      if (data?.error) {
        return { error: data.error };
      }
      await refreshData();
      return { error: null, result: data };
    } catch (e) {
      return { error: msg(e) };
    }
  };

  const requestRedemption = async (catalogItemId: string) => {
    try {
      const { data } = await supabase.rpc('request_redemption', { p_catalog_item_id: catalogItemId });
      if (data?.error) {
        return { error: data.error };
      }
      await refreshData();
      return { error: null };
    } catch (e) {
      return { error: msg(e) };
    }
  };

  const reviewRedemption = async (redemptionId: string, approve: boolean) => {
    try {
      const { data } = await supabase.rpc('review_redemption', {
        p_redemption_id: redemptionId,
        p_approve: approve,
      });
      if (data?.error) {
        return { error: data.error };
      }
      await refreshData();
      return { error: null };
    } catch (e) {
      return { error: msg(e) };
    }
  };

  const recordVisit = async (clientId: string, points: number, spins: number) => {
    try {
      const { data } = await supabase.rpc('record_visit', {
        p_client_id: clientId,
        p_points: points,
        p_spins: spins,
      });
      if (data?.error) {
        return { error: data.error };
      }
      await refreshData();
      return { error: null };
    } catch (e) {
      return { error: msg(e) };
    }
  };

  const adjustPoints = async (clientId: string, amount: number, description?: string) => {
    try {
      const { data } = await supabase.rpc('adjust_points', {
        p_client_id: clientId,
        p_amount: amount,
        p_description: description,
      });
      if (data?.error) {
        return { error: data.error };
      }
      await refreshData();
      return { error: null };
    } catch (e) {
      return { error: msg(e) };
    }
  };

  return (
    <LoyaltyContext.Provider
      value={{
        merchant,
        clientMerchant,
        rewards,
        catalogItems,
        myRedemptions,
        spinsHistory,
        pointsHistory,
        pendingRedemptions,
        pendingSpins,
        loading,
        refreshData,
        linkToMerchant,
        spinWheel,
        requestRedemption,
        reviewRedemption,
        recordVisit,
        adjustPoints,
      }}
    >
      {children}
    </LoyaltyContext.Provider>
  );
}

export function useLoyalty() {
  const context = useContext(LoyaltyContext);
  if (!context) {
    throw new Error('useLoyalty doit être utilisé dans LoyaltyProvider');
  }
  return context;
}
