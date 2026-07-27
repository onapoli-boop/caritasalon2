/*
# GlowPass Merchant Template — Schéma initial

Adaptation pour une instance = un commerçant.
- Pas de table `providers` multi-instituts
- Une seule relation client↔merchant
- Propriétaire unique (owner)
- RLS simple (owner vs clients)
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------
-- profiles — clients + owner
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  nom text,
  telephone text,
  avatar text,
  is_owner boolean NOT NULL DEFAULT false,
  theme_mode text NOT NULL DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark', 'system')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_owner ON profiles(is_owner);

-- ---------------------------------------------------------------
-- merchant_config — configuration centralisée (1 par instance)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchant_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  nom text NOT NULL,
  description text,
  adresse text,
  telephone text,

  -- QR code fixe du comptoir
  qr_code_url text,
  qr_secret text UNIQUE,

  -- Thème couleurs
  primary_color text NOT NULL DEFAULT '#6B2737',
  secondary_color text NOT NULL DEFAULT '#C96A80',
  accent_color text NOT NULL DEFAULT '#D4AF37',
  logo_url text,

  -- Seuils de tier
  tier_silver_threshold integer NOT NULL DEFAULT 200,
  tier_gold_threshold integer NOT NULL DEFAULT 500,
  tier_platinum_threshold integer NOT NULL DEFAULT 1000,

  created_at timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------
-- client_merchant — LA relation centrale (une seule par instance)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_merchant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES merchant_config(id) ON DELETE CASCADE,
  points_balance integer NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  spins_available integer NOT NULL DEFAULT 0 CHECK (spins_available >= 0),
  niveau_fidelite text NOT NULL DEFAULT 'Bronze'
    CHECK (niveau_fidelite IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (client_id, merchant_id)
);

CREATE INDEX IF NOT EXISTS idx_cm_client ON client_merchant(client_id);
CREATE INDEX IF NOT EXISTS idx_cm_merchant ON client_merchant(merchant_id);

-- ---------------------------------------------------------------
-- rewards — segments de la roue
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchant_config(id) ON DELETE CASCADE,
  titre text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('points', 'discount', 'product', 'service', 'bonus')),
  valeur integer NOT NULL DEFAULT 0,
  probability integer NOT NULL DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rewards_merchant ON rewards(merchant_id);

-- ---------------------------------------------------------------
-- catalog_items — items échangeables
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchant_config(id) ON DELETE CASCADE,
  titre text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('soin', 'produit', 'reduction', 'autre')),
  points_cost integer NOT NULL,
  stock integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_merchant ON catalog_items(merchant_id);

-- ---------------------------------------------------------------
-- redemptions — demandes d'échange
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES merchant_config(id) ON DELETE CASCADE,
  catalog_item_id uuid NOT NULL REFERENCES catalog_items(id) ON DELETE RESTRICT,
  points_cost integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'refused', 'cancelled')),
  code text UNIQUE DEFAULT upper(left(md5(random()::text), 8)),
  requested_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_redemptions_client ON redemptions(client_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_merchant ON redemptions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);

-- ---------------------------------------------------------------
-- spins_history — tours de roue
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS spins_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES merchant_config(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES rewards(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed')),
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spins_client ON spins_history(client_id);
CREATE INDEX IF NOT EXISTS idx_spins_merchant ON spins_history(merchant_id);
CREATE INDEX IF NOT EXISTS idx_spins_status ON spins_history(status);

-- ---------------------------------------------------------------
-- points_history — journal des points
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS points_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES merchant_config(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  action text NOT NULL CHECK (action IN ('visit', 'spin_win', 'redemption', 'manual_add', 'manual_remove', 'tier_up')),
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_points_client ON points_history(client_id);
CREATE INDEX IF NOT EXISTS idx_points_merchant ON points_history(merchant_id);

-- ---------------------------------------------------------------
-- Trigger : calcul automatique du tier (Silver/Gold/Platinum)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_tier_on_points_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE client_merchant
  SET niveau_fidelite = CASE
    WHEN NEW.points_balance >= (SELECT tier_platinum_threshold FROM merchant_config WHERE id = NEW.merchant_id) THEN 'Platinum'
    WHEN NEW.points_balance >= (SELECT tier_gold_threshold FROM merchant_config WHERE id = NEW.merchant_id) THEN 'Gold'
    WHEN NEW.points_balance >= (SELECT tier_silver_threshold FROM merchant_config WHERE id = NEW.merchant_id) THEN 'Silver'
    ELSE 'Bronze'
  END
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_tier
  AFTER UPDATE OF points_balance ON client_merchant
  FOR EACH ROW
  EXECUTE FUNCTION update_tier_on_points_change();
