# GlowPass Merchant Template

Template d'application de fidélité pour commerçants individuels. **Une instance = un commerçant**.

## 🚀 Déploiement rapide

### 1. Cloner et personnaliser

```bash
# Cloner le template
git clone glowpass-merchant-template.git mon-salon

# Personnaliser app.json et package.json
cd mon-salon
sed -i 's/glowpass-merchant/mon-salon/g' app.json package.json
```

### 2. Créer une base Supabase

- Aller sur [supabase.com](https://supabase.com)
- Créer un projet
- Copier `Project URL` et `anon key`
- Créer `.env.local` :

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_MERCHANT_NAME=Mon Salon
EXPO_PUBLIC_MERCHANT_PRIMARY_COLOR=#6B2737
EXPO_PUBLIC_MERCHANT_SECONDARY_COLOR=#C96A80
```

### 3. Appliquer les migrations Supabase

```bash
# Via Supabase CLI
supabase db push

# Ou via l'interface Supabase SQL Editor
# Copier/coller les fichiers migration/
```

### 4. Installer et tester

```bash
npm install
npm run dev

# Accéder à http://localhost:8081
```

### 5. Déployer sur Netlify

```bash
npm run build:web
# Déploy dist/ via Netlify
```

---

## 📋 Structure

```
app/                  # Expo Router pages
contexts/             # AuthContext, LoyaltyContext
supabase/
  migrations/         # SQL migrations (à appliquer dans Supabase)
  functions/          # (optionnel) Edge functions
types/               # TypeScript types
constants/           # Thème, couleurs
lib/                 # Utils, Supabase client
```

---

## 🎯 Flux utilisateur

### Client
1. **Inscription** → crée compte global
2. **Scanner QR comptoir** → adhère au merchant
3. **Accueil** → affiche sa carte + points + tier
4. **Roue** → spin + récompenses
5. **Récompenses** → catalogue + demandes d'échange

### Commerçant (Owner)
1. **Inscription** → crée compte (cocher "Propriétaire")
2. **Config** → définir couleurs, récompenses, catalogue
3. **Dashboard** → 
   - QR code comptoir à afficher
   - Liste clients + fiche détail
   - Scanner pour enregistrer visite
   - Valider les échanges

---

## 🔐 Sécurité

- **RLS** (Row Level Security) : données filtrées par merchant_id
- **RPC** : tous les points/spins/échanges passent par des fonctions signées côté serveur
- **Clients isolés** : chaque merchant a sa propre base (ou filtre par tenant_id)

---

## 📝 Personnalisation

### Couleurs

Éditer `.env.local` :
```
EXPO_PUBLIC_MERCHANT_PRIMARY_COLOR=#YOUR_COLOR
EXPO_PUBLIC_MERCHANT_SECONDARY_COLOR=#YOUR_COLOR
```

### Récompenses

- **Accueil** → Dashboard → **Roue** → créer segments
- Définir titre, type (points/discount/product), valeur, probabilité

### Catalogue d'échanges

- **Dashboard** → **Récompenses** → **Catalogue**
- Créer items avec points_cost, stock

---

## 🤝 Support

- Questions Supabase : [docs.supabase.com](https://docs.supabase.com)
- Expo : [expo.dev](https://expo.dev)
- Bug ? → GitHub issues

---

## 📜 Licence

Propriétaire. Chaque commerçant reçoit une licence pour son instance personnalisée.
