/*
# RPC pour le flux complet de roue

scan_merchant_qr → adhésion + 1 spin
spin_wheel → tire une récompense (points ou produit)
claim_reward → client demande à réclamer (status won → claimed)
*/

-- ---------------------------------------------------------------
-- scan_merchant_qr(qr_secret) → adhésion ET crédite 1 spin
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION scan_merchant_qr(p_qr_secret text)
RETURNS jsonb AS $$
DECLARE
  v_merchant_id uuid;
  v_merchant_name text;
  v_client_id uuid;
  v_existing_cm uuid;
BEGIN
  v_client_id := auth.uid();

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

  -- Vérifier ou créer la relation client↔merchant
  SELECT id INTO v_existing_cm
    FROM client_merchant
    WHERE client_id = v_client_id AND merchant_id = v_merchant_id;

  IF v_existing_cm IS NULL THEN
    -- Première visite : créer la relation
    INSERT INTO client_merchant (client_id, merchant_id, points_balance, spins_available, niveau_fidelite)
      VALUES (v_client_id, v_merchant_id, 0, 1, 'Bronze');
  ELSE
    -- Visite suivante : créditer 1 spin
    UPDATE client_merchant
      SET spins_available = spins_available + 1
      WHERE client_id = v_client_id AND merchant_id = v_merchant_id;
  END IF;

  RETURN jsonb_build_object(
    'error', null,
    'merchant_id', v_merchant_id,
    'merchant_name', v_merchant_name,
    'message', 'Vous avez gagné 1 tour de roue!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------
-- spin_wheel() → tire une récompense, gère points ou produit
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
  v_spin_history_id uuid;
BEGIN
  v_client_id := auth.uid();

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

  -- Gérer la récompense selon son type
  IF v_reward_type = 'points' THEN
    -- Points : créditer directement
    UPDATE client_merchant
      SET points_balance = points_balance + v_reward_value
      WHERE client_id = v_client_id AND merchant_id = v_merchant_id;

    INSERT INTO points_history (client_id, merchant_id, amount, action, description)
      VALUES (v_client_id, v_merchant_id, v_reward_value, 'spin_win'::text, v_reward_title);

    RETURN jsonb_build_object(
      'error', null,
      'reward_id', v_reward_id,
      'reward_title', v_reward_title,
      'reward_value', v_reward_value,
      'reward_type', v_reward_type,
      'message', 'Vous avez gagné ' || v_reward_value || ' points!'
    );
  ELSE
    -- Produit/Réduction : créer une demande "à réclamer"
    INSERT INTO spins_history (client_id, merchant_id, reward_id, status, reward_value, reward_type)
      VALUES (v_client_id, v_merchant_id, v_reward_id, 'won'::text, v_reward_value, v_reward_type)
      RETURNING id INTO v_spin_history_id;

    RETURN jsonb_build_object(
      'error', null,
      'reward_id', v_reward_id,
      'spin_history_id', v_spin_history_id,
      'reward_title', v_reward_title,
      'reward_value', v_reward_value,
      'reward_type', v_reward_type,
      'message', 'Vous avez gagné: ' || v_reward_title || '! Réclamez votre gain dans "Mes gains".'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------
-- claim_reward(spin_history_id) → passer de won → claimed
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION claim_reward(p_spin_history_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_client_id uuid;
BEGIN
  v_client_id := auth.uid();

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Non authentifié');
  END IF;

  -- Vérifier que c'est le client qui demande son propre gain
  UPDATE spins_history
    SET status = 'claimed'
    WHERE id = p_spin_history_id AND client_id = v_client_id AND status = 'won';

  IF FOUND THEN
    RETURN jsonb_build_object('error', null, 'message', 'Vous avez demandé votre gain. Le commerçant va valider.');
  ELSE
    RETURN jsonb_build_object('error', 'Gain introuvable ou déjà demandé');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------
-- approve_claimed_reward(spin_history_id, approve) → commerçant valide
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION approve_claimed_reward(
  p_spin_history_id uuid,
  p_approve boolean
)
RETURNS jsonb AS $$
DECLARE
  v_owner_id uuid;
  v_merchant_id uuid;
  v_client_id uuid;
  v_points_cost integer;
  v_reward_type text;
BEGIN
  v_owner_id := auth.uid();

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_owner_id AND is_owner = true) THEN
    RETURN jsonb_build_object('error', 'Accès refusé');
  END IF;

  -- Récupérer les infos du gain
  SELECT merchant_id, client_id, reward_value, reward_type
    INTO v_merchant_id, v_client_id, v_points_cost, v_reward_type
    FROM spins_history
    WHERE id = p_spin_history_id;

  IF v_merchant_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Gain introuvable');
  END IF;

  -- Vérifier ownership
  IF NOT EXISTS (SELECT 1 FROM merchant_config WHERE id = v_merchant_id AND owner_id = v_owner_id) THEN
    RETURN jsonb_build_object('error', 'Accès refusé');
  END IF;

  IF p_approve THEN
    -- Approuver : déduire les points (si c'est une reduction en points)
    IF v_reward_type = 'discount' THEN
      UPDATE client_merchant
        SET points_balance = points_balance - v_points_cost
        WHERE client_id = v_client_id AND merchant_id = v_merchant_id;

      INSERT INTO points_history (client_id, merchant_id, amount, action, description)
        VALUES (v_client_id, v_merchant_id, -v_points_cost, 'redemption'::text, 'Gain roue réclamé');
    END IF;

    UPDATE spins_history
      SET status = 'approved', reviewed_at = now()
      WHERE id = p_spin_history_id;
  ELSE
    -- Refuser
    UPDATE spins_history
      SET status = 'refused', reviewed_at = now()
      WHERE id = p_spin_history_id;
  END IF;

  RETURN jsonb_build_object('error', null);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
