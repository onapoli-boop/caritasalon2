/*
# RPC pour GlowPass Merchant Template

Fonctions atomiques côté serveur pour les opérations sensibles.
Appelées par le front via LoyaltyContext.
*/

-- ---------------------------------------------------------------
-- link_to_merchant(qr_secret) → adhésion via QR code comptoir
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION link_to_merchant(p_qr_secret text)
RETURNS jsonb AS $$
DECLARE
  v_merchant_id uuid;
  v_merchant_name text;
  v_client_id uuid;
  v_existing_cm uuid;
BEGIN
  v_client_id := auth.uid();

  -- Vérifier que le client est authentifié
  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Non authentifié');
  END IF;

  -- Trouver le merchant avec ce QR secret
  SELECT id, nom INTO v_merchant_id, v_merchant_name
    FROM merchant_config
    WHERE qr_secret = p_qr_secret;

  IF v_merchant_id IS NULL THEN
    RETURN jsonb_build_object('error', 'QR code invalide');
  END IF;

  -- Vérifier que le client n'est pas déjà adhérent
  SELECT id INTO v_existing_cm
    FROM client_merchant
    WHERE client_id = v_client_id AND merchant_id = v_merchant_id;

  IF v_existing_cm IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Vous êtes déjà adhérent');
  END IF;

  -- Créer la relation client↔merchant
  INSERT INTO client_merchant (client_id, merchant_id, points_balance, spins_available, niveau_fidelite)
    VALUES (v_client_id, v_merchant_id, 0, 0, 'Bronze');

  RETURN jsonb_build_object(
    'error', null,
    'merchant_id', v_merchant_id,
    'merchant_name', v_merchant_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------
-- record_visit(client_id, points, spins) → enregistrer une visite
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION record_visit(
  p_client_id uuid,
  p_points integer,
  p_spins integer,
  p_description text DEFAULT 'Visite'
)
RETURNS jsonb AS $$
DECLARE
  v_merchant_id uuid;
  v_owner_id uuid;
BEGIN
  v_owner_id := auth.uid();

  -- Vérifier que l'appelant est owner
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_owner_id AND is_owner = true) THEN
    RETURN jsonb_build_object('error', 'Accès refusé');
  END IF;

  -- Récupérer merchant_id du owner
  SELECT id INTO v_merchant_id FROM merchant_config WHERE owner_id = v_owner_id;

  IF v_merchant_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Commerçant non configuré');
  END IF;

  -- Vérifier que le client est adhérent au merchant
  IF NOT EXISTS (SELECT 1 FROM client_merchant WHERE client_id = p_client_id AND merchant_id = v_merchant_id) THEN
    RETURN jsonb_build_object('error', 'Client non adhérent');
  END IF;

  -- Mettre à jour les points et spins
  UPDATE client_merchant
    SET
      points_balance = points_balance + p_points,
      spins_available = spins_available + p_spins
    WHERE client_id = p_client_id AND merchant_id = v_merchant_id;

  -- Enregistrer dans l'historique
  INSERT INTO points_history (client_id, merchant_id, amount, action, description)
    VALUES (p_client_id, v_merchant_id, p_points, 'visit'::text, p_description);

  RETURN jsonb_build_object('error', null);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------
-- spin_wheel() → tirage côté serveur, anti-triche
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION spin_wheel()
RETURNS jsonb AS $$
DECLARE
  v_client_id uuid;
  v_merchant_id uuid;
  v_reward_id uuid;
  v_reward_title text;
  v_reward_value integer;
  v_reward_type text;
  v_spins_available integer;
BEGIN
  v_client_id := auth.uid();

  -- Vérifier auth
  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Non authentifié');
  END IF;

  -- Récupérer merchant_id et spins_available
  SELECT merchant_id, spins_available INTO v_merchant_id, v_spins_available
    FROM client_merchant
    WHERE client_id = v_client_id;

  IF v_merchant_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Aucune adhésion active');
  END IF;

  IF v_spins_available <= 0 THEN
    RETURN jsonb_build_object('error', 'Pas de tours disponibles');
  END IF;

  -- Tirage pondéré
  SELECT id, titre, valeur, type INTO v_reward_id, v_reward_title, v_reward_value, v_reward_type
    FROM rewards
    WHERE merchant_id = v_merchant_id AND is_active = true
    ORDER BY random() * probability DESC
    LIMIT 1;

  IF v_reward_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Pas de récompense disponible');
  END IF;

  -- Décrémenter les spins
  UPDATE client_merchant
    SET spins_available = spins_available - 1
    WHERE client_id = v_client_id AND merchant_id = v_merchant_id;

  -- Enregistrer le tirage (en attente de réclamation)
  INSERT INTO spins_history (client_id, merchant_id, reward_id, status)
    VALUES (v_client_id, v_merchant_id, v_reward_id, 'pending');

  -- Si c'est une récompense en points, les créditer immédiatement
  IF v_reward_type = 'points' THEN
    UPDATE client_merchant
      SET points_balance = points_balance + v_reward_value
      WHERE client_id = v_client_id AND merchant_id = v_merchant_id;

    INSERT INTO points_history (client_id, merchant_id, amount, action, description)
      VALUES (v_client_id, v_merchant_id, v_reward_value, 'spin_win'::text, v_reward_title);
  END IF;

  RETURN jsonb_build_object(
    'error', null,
    'reward_id', v_reward_id,
    'reward_title', v_reward_title,
    'reward_value', v_reward_value,
    'reward_type', v_reward_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------
-- request_redemption(catalog_item_id) → demande d'échange
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION request_redemption(p_catalog_item_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_client_id uuid;
  v_merchant_id uuid;
  v_points_cost integer;
  v_points_balance integer;
  v_redemption_id uuid;
BEGIN
  v_client_id := auth.uid();

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Non authentifié');
  END IF;

  -- Récupérer le merchant et les points actuels
  SELECT merchant_id, points_balance INTO v_merchant_id, v_points_balance
    FROM client_merchant
    WHERE client_id = v_client_id;

  IF v_merchant_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Aucune adhésion active');
  END IF;

  -- Vérifier que le catalog_item existe et appartient au même merchant
  SELECT points_cost INTO v_points_cost
    FROM catalog_items
    WHERE id = p_catalog_item_id AND merchant_id = v_merchant_id;

  IF v_points_cost IS NULL THEN
    RETURN jsonb_build_object('error', 'Article invalide');
  END IF;

  -- Vérifier les points
  IF v_points_balance < v_points_cost THEN
    RETURN jsonb_build_object('error', 'Pas assez de points');
  END IF;

  -- Créer la demande (points déductibles seulement à l'approbation)
  INSERT INTO redemptions (client_id, merchant_id, catalog_item_id, points_cost, status)
    VALUES (v_client_id, v_merchant_id, p_catalog_item_id, v_points_cost, 'pending')
    RETURNING id INTO v_redemption_id;

  RETURN jsonb_build_object('error', null, 'redemption_id', v_redemption_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------
-- review_redemption(redemption_id, approve) → valider/refuser
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION review_redemption(
  p_redemption_id uuid,
  p_approve boolean
)
RETURNS jsonb AS $$
DECLARE
  v_owner_id uuid;
  v_merchant_id uuid;
  v_client_id uuid;
  v_points_cost integer;
BEGIN
  v_owner_id := auth.uid();

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_owner_id AND is_owner = true) THEN
    RETURN jsonb_build_object('error', 'Accès refusé');
  END IF;

  -- Récupérer la redemption
  SELECT merchant_id, client_id, points_cost
    INTO v_merchant_id, v_client_id, v_points_cost
    FROM redemptions
    WHERE id = p_redemption_id;

  IF v_merchant_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Demande introuvable');
  END IF;

  -- Vérifier que le merchant appartient au owner
  IF NOT EXISTS (SELECT 1 FROM merchant_config WHERE id = v_merchant_id AND owner_id = v_owner_id) THEN
    RETURN jsonb_build_object('error', 'Accès refusé');
  END IF;

  IF p_approve THEN
    -- Approuver et déduire les points
    UPDATE client_merchant
      SET points_balance = points_balance - v_points_cost
      WHERE client_id = v_client_id AND merchant_id = v_merchant_id;

    UPDATE redemptions
      SET status = 'approved', reviewed_at = now()
      WHERE id = p_redemption_id;

    INSERT INTO points_history (client_id, merchant_id, amount, action, description)
      VALUES (v_client_id, v_merchant_id, -v_points_cost, 'redemption'::text, 'Échange approuvé');
  ELSE
    -- Refuser
    UPDATE redemptions
      SET status = 'refused', reviewed_at = now()
      WHERE id = p_redemption_id;
  END IF;

  RETURN jsonb_build_object('error', null);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------
-- adjust_points(client_id, amount) → ajustement manuel
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION adjust_points(
  p_client_id uuid,
  p_amount integer,
  p_description text DEFAULT 'Ajustement manuel'
)
RETURNS jsonb AS $$
DECLARE
  v_owner_id uuid;
  v_merchant_id uuid;
BEGIN
  v_owner_id := auth.uid();

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_owner_id AND is_owner = true) THEN
    RETURN jsonb_build_object('error', 'Accès refusé');
  END IF;

  SELECT id INTO v_merchant_id FROM merchant_config WHERE owner_id = v_owner_id;

  IF v_merchant_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Commerçant non configuré');
  END IF;

  UPDATE client_merchant
    SET points_balance = points_balance + p_amount
    WHERE client_id = p_client_id AND merchant_id = v_merchant_id;

  INSERT INTO points_history (client_id, merchant_id, amount, action, description)
    VALUES (p_client_id, v_merchant_id, p_amount, 'manual_add'::text, p_description);

  RETURN jsonb_build_object('error', null);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
