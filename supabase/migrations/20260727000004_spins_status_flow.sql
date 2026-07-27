/*
# Adapter spins_history pour le flux de roue complet

Nouveau flux:
- won → client a gagné à la roue, voit dans "Mes gains"
- claimed → client demande à réclamer, commerçant voit demande
- approved → commerçant valide, points déduits
- refused → commerçant refuse
*/

-- Modifier la contrainte CHECK pour spins_history.status
ALTER TABLE spins_history
  DROP CONSTRAINT IF EXISTS spins_history_status_check;

ALTER TABLE spins_history
  ADD CONSTRAINT spins_history_status_check
    CHECK (status IN ('won', 'claimed', 'approved', 'refused'));

-- Ajouter colonne reviewed_at pour savoir quand commerçant a validé/refusé
ALTER TABLE spins_history
  ADD COLUMN reviewed_at timestamptz DEFAULT NULL;

-- Ajouter colonne reward_value pour garder la valeur gagnée (au cas où reward est modifiée)
ALTER TABLE spins_history
  ADD COLUMN reward_value integer DEFAULT 0;

-- Ajouter colonne reward_type pour savoir si c'est points ou produit
ALTER TABLE spins_history
  ADD COLUMN reward_type text CHECK (reward_type IN ('points', 'discount', 'product', 'service', 'bonus'));

-- Index sur claimed_at pour les demandes récentes
CREATE INDEX IF NOT EXISTS idx_spins_reviewed_at ON spins_history(reviewed_at);
