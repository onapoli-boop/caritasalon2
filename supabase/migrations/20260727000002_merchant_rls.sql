/*
# RLS pour GlowPass Merchant Template

Deux rôles :
- Owner (is_owner = true) : accès lecture/écriture sur tout
- Client (is_owner = false) : accès limité à ses données
*/

-- ---------------------------------------------------------------
-- profiles : chacun voit le sien, owner voit tous
-- ---------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_self ON profiles
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = true
  ));

CREATE POLICY profiles_update_self ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY profiles_insert_self ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------
-- merchant_config : owner accès complet, clients accès lecture
-- ---------------------------------------------------------------
ALTER TABLE merchant_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY merchant_config_select_all ON merchant_config
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = true) OR
    EXISTS (SELECT 1 FROM client_merchant WHERE client_id = auth.uid() AND merchant_id = merchant_config.id)
  );

CREATE POLICY merchant_config_update_owner ON merchant_config
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = true)
  );

-- ---------------------------------------------------------------
-- client_merchant : clients voient leur relation, owner voit tout
-- ---------------------------------------------------------------
ALTER TABLE client_merchant ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_merchant_select ON client_merchant
  FOR SELECT USING (
    auth.uid() = client_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = true)
  );

CREATE POLICY client_merchant_insert_self ON client_merchant
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY client_merchant_update_owner ON client_merchant
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = true)
  );

-- ---------------------------------------------------------------
-- rewards : clients lisent, owner gère
-- ---------------------------------------------------------------
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY rewards_select_public ON rewards
  FOR SELECT USING (
    is_active = true OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = true)
  );

CREATE POLICY rewards_manage_owner ON rewards
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = true)
  );

-- ---------------------------------------------------------------
-- catalog_items : clients lisent, owner gère
-- ---------------------------------------------------------------
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY catalog_items_select_public ON catalog_items
  FOR SELECT USING (
    is_active = true OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = true)
  );

CREATE POLICY catalog_items_manage_owner ON catalog_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = true)
  );

-- ---------------------------------------------------------------
-- redemptions : clients voient leurs demandes, owner voit tout
-- ---------------------------------------------------------------
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY redemptions_select_own ON redemptions
  FOR SELECT USING (
    auth.uid() = client_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = true)
  );

CREATE POLICY redemptions_insert_own ON redemptions
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY redemptions_update_owner ON redemptions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = true)
  );

-- ---------------------------------------------------------------
-- spins_history : clients voient leurs tours, owner voit tout
-- ---------------------------------------------------------------
ALTER TABLE spins_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY spins_history_select_own ON spins_history
  FOR SELECT USING (
    auth.uid() = client_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = true)
  );

CREATE POLICY spins_history_update_owner ON spins_history
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = true)
  );

-- ---------------------------------------------------------------
-- points_history : clients lisent, owner gère
-- ---------------------------------------------------------------
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY points_history_select_own ON points_history
  FOR SELECT USING (
    auth.uid() = client_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = true)
  );

CREATE POLICY points_history_insert_owner ON points_history
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_owner = true)
  );
