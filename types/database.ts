// Types pour GlowPass Merchant Template
// Une instance = un seul commerçant, clients simples (pas de role complexe)

export type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface Profile {
  id: string;
  email: string;
  nom: string | null;
  telephone: string | null;
  avatar: string | null;
  is_owner: boolean;  // true = propriétaire du merchant
  theme_mode: 'light' | 'dark' | 'system';
  created_at: string;
}

// Configuration centralisée du commerçant
export interface MerchantConfig {
  id: string;
  owner_id: string;  // REFERENCES profiles(id)
  nom: string;
  description: string | null;
  adresse: string | null;
  telephone: string | null;

  // QR code fixe du comptoir (généré une fois, scanné par les clients)
  qr_code_url: string;
  qr_secret: string;  // secret pour valider les scans

  // Thème couleurs
  primary_color: string;      // ex: #6B2737
  secondary_color: string;    // ex: #C96A80
  accent_color: string;       // ex: #D4AF37
  logo_url: string | null;

  // Seuils de tier (personnalisables)
  tier_silver_threshold: number;
  tier_gold_threshold: number;
  tier_platinum_threshold: number;

  created_at: string;
}

// Relation client↔commerçant (une seule par instance)
export interface ClientMerchant {
  id: string;
  client_id: string;          // REFERENCES profiles(id)
  merchant_id: string;        // REFERENCES merchant_config(id)
  points_balance: number;
  spins_available: number;
  niveau_fidelite: Tier;
  created_at: string;
}

export interface ClientMerchantWithProfile extends ClientMerchant {
  profiles: Pick<Profile, 'id' | 'nom' | 'email' | 'avatar'>;
}

// Segments de roue
export interface Reward {
  id: string;
  merchant_id: string;
  titre: string;
  description: string | null;
  type: 'points' | 'discount' | 'product' | 'service' | 'bonus';
  valeur: number;
  probability: number;  // poids en %
  is_active: boolean;
  created_at: string;
}

// Catalogue d'échanges
export interface CatalogItem {
  id: string;
  merchant_id: string;
  titre: string;
  description: string | null;
  type: 'soin' | 'produit' | 'reduction' | 'autre';
  points_cost: number;
  stock: number | null;
  is_active: boolean;
  created_at: string;
}

export type RedemptionStatus = 'pending' | 'approved' | 'refused' | 'cancelled';

// Demande d'échange
export interface Redemption {
  id: string;
  client_id: string;
  merchant_id: string;
  catalog_item_id: string;
  points_cost: number;
  status: RedemptionStatus;
  code: string;  // code de récupération
  requested_at: string;
  reviewed_at: string | null;
  catalog_items?: Pick<CatalogItem, 'titre' | 'description'>;
  profiles?: Pick<Profile, 'nom' | 'email'>;
}

// Historique des tours de roue
export interface SpinsHistory {
  id: string;
  client_id: string;
  merchant_id: string;
  reward_id: string;
  status: 'pending' | 'claimed';
  claimed_at: string | null;
  created_at: string;
  rewards?: Pick<Reward, 'titre' | 'valeur' | 'type'>;
  profiles?: Pick<Profile, 'nom' | 'email'>;
}

// Historique des points
export type PointsHistoryAction = 'visit' | 'spin_win' | 'redemption' | 'manual_add' | 'manual_remove' | 'tier_up';

export interface PointsHistory {
  id: string;
  client_id: string;
  merchant_id: string;
  amount: number;
  action: PointsHistoryAction;
  description: string | null;
  created_at: string;
}
