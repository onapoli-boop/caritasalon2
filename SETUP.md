# Checklist Setup — GlowPass Merchant Template

Pour chaque commerçant qui clone ce template, voici les étapes :

## ✅ Avant de commencer

- [ ] Node.js 18+ installé
- [ ] Compte Supabase créé
- [ ] Compte Netlify créé (pour le déploiement web)

---

## 📋 Phase 1 : Configuration locale

### 1.1 Cloner et renommer

```bash
git clone <template-url> mon-salon-beaute
cd mon-salon-beaute
rm -rf .git  # Nouveau repo
git init
```

### 1.2 Personnaliser les identifiants

Éditer `package.json` et `app.json` :

```json
{
  "name": "mon-salon",
  "slug": "mon-salon",
  "expo": {
    "ios": { "bundleIdentifier": "com.monsalon.app" },
    "android": { "package": "com.monsalon.app" }
  }
}
```

### 1.3 Créer base Supabase

1. Aller sur https://supabase.com
2. Créer un projet
3. Copier **Project URL** et **anon key**
4. Créer `.env.local` :

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_MERCHANT_NAME=Mon Salon
EXPO_PUBLIC_MERCHANT_DESCRIPTION=Description
EXPO_PUBLIC_MERCHANT_PRIMARY_COLOR=#6B2737
EXPO_PUBLIC_MERCHANT_SECONDARY_COLOR=#C96A80
```

### 1.4 Appliquer les migrations Supabase

**Option A : CLI Supabase (recommandé)**
```bash
npm install -g supabase
supabase login
supabase link --project-ref xxxxx
supabase db push
```

**Option B : SQL Editor Supabase (manuel)**
1. Aller dans **SQL Editor** de Supabase
2. Copier/coller chaque fichier `supabase/migrations/`
3. Exécuter dans l'ordre : `*_schema.sql` → `*_rls.sql` → `*_rpc.sql`

### 1.5 Installer dépendances

```bash
npm install
```

### 1.6 Tester localement

```bash
npm run dev
# Ouvrir http://localhost:8081
```

**Test auth :**
1. S'inscrire (cocher "Propriétaire du commerçant")
2. Vérifier le profil dans Supabase `profiles` table
3. Se déconnecter et se reconnecter

---

## 📱 Phase 2 : Configuration du commerçant

### 2.1 Initialiser merchant_config

Après première connexion (owner), **trigger manually** ou via SQL :

```sql
INSERT INTO merchant_config (
  owner_id, nom, description, adresse,
  primary_color, secondary_color, accent_color,
  qr_secret, qr_code_url
) VALUES (
  'USER_ID_HERE',
  'Mon Salon',
  'Description',
  'Adresse',
  '#6B2737', '#C96A80', '#D4AF37',
  'SECRET123', 'https://...'
);
```

### 2.2 Créer récompenses roue

1. Aller dans le dashboard (owner)
2. **Roue** → **Créer segment**
   - Titre: "50 points"
   - Type: points
   - Valeur: 50
   - Probabilité: 20

Répéter pour 5-6 segments (total 100%)

### 2.3 Créer catalogue d'échanges

1. Dashboard → **Récompenses** → **Catalogue**
2. **Créer item**
   - Titre: "Soin hydratant"
   - Type: soin
   - Points cost: 500
   - Stock: 10

---

## 🌐 Phase 3 : Déploiement Netlify

### 3.1 Connecter Netlify

```bash
npm install -g netlify-cli
netlify login
netlify init
```

### 3.2 Configurer variables d'env

Dans Netlify dashboard:

**Site settings** → **Build & deploy** → **Environment**

Ajouter :
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_MERCHANT_NAME`
- etc.

### 3.3 Déployer

```bash
npm run build:web
netlify deploy --prod
```

Votre app est live ! 🎉

---

## 🔐 Phase 4 : Sécurité production

- [ ] Vérifier RLS Supabase (toutes tables protégées)
- [ ] Tester isolation données (créer 2 clients, vérifier qu'ils ne se voient pas)
- [ ] Activer HTTPS partout (Netlify fait par défaut)
- [ ] Exclure `.env` du git (déjà dans `.gitignore`)

---

## 🆘 Troubleshooting

**"Missing Supabase environment variables"**
→ Vérifier `.env.local` exists et copié depuis `.env.example`

**"Connection refused"**
→ Vérifier que Supabase project est "running" (vérifier dashboard)

**"RLS error: new row violates row-level security policy"**
→ Vérifier que l'utilisateur a le bon `is_owner` flag

**"Migration fails"**
→ Vérifier l'ordre : schema → rls → rpc
→ Copier/coller le SQL entièrement (pas de troncature)

---

## 📚 Ressources

- [Supabase Docs](https://supabase.com/docs)
- [Expo Docs](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)

---

## ✨ Prochaines étapes

Une fois opérationnel :

1. **Importer logo/photos** → storage Supabase
2. **Créer écran QR code** → afficher `qr_secret` sur comptoir
3. **Implémenter scanner** → `expo-camera` pour adhésions
4. **Tester roue** → animation + son
5. **Test utilisateurs** → amis/famille essaient l'app
