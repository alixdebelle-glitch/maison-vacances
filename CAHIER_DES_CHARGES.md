# Cahier des charges — App Suivi Achat Maison de Vacances

## Contexte

Application web pour suivre un projet d'achat de maison de vacances en famille. Plusieurs membres de la famille utilisent l'app avec leurs propres comptes. L'app est déjà développée et déployée — ce document décrit l'existant pour un travail de redesign.

**URL de production :** https://maison-vacances-green.vercel.app

---

## Stack technique

| Composant | Technologie |
|---|---|
| Framework | Next.js 14 (App Router) |
| Base de données + Auth + Stockage | Supabase |
| Style | Tailwind CSS |
| Hébergement | Vercel |
| Drag & drop kanban | @dnd-kit/core + @dnd-kit/sortable |
| Carte géographique | react-leaflet + OpenStreetMap (gratuit, sans clé API) |
| Géocodage adresses | API Nominatim d'OpenStreetMap |
| Distance routière | API OSRM (OpenStreetMap, gratuit, sans clé API) |

---

## Schéma base de données

```sql
-- Critères de scoring
CREATE TABLE criteria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 10,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Biens immobiliers
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Identification
  nickname TEXT,                      -- Nom/surnom personnalisé (ex: "Mas provençal")
                                      -- Affiché à la place de la ville si renseigné

  -- Localisation
  address TEXT,
  city TEXT,
  postal_code TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  distance_suresnes_km NUMERIC,       -- Distance routière en km (calculée via OSRM)
  distance_suresnes_drive TEXT,       -- Durée du trajet (ex: "2h15") calculée via OSRM

  -- Prix
  price NUMERIC,
  agency_fees NUMERIC,
  agency_fees_pct NUMERIC,
  land_tax NUMERIC,
  housing_tax NUMERIC,

  -- Caractéristiques
  surface NUMERIC,
  rooms INTEGER,
  annonce_url TEXT,                   -- Vérification doublon à la saisie

  -- Agence
  agency_name TEXT,
  agency_contact TEXT,
  agency_phone TEXT,
  agency_email TEXT,

  -- Descriptions (3 blocs)
  description_libre TEXT,
  description_technique TEXT,
  description_travaux TEXT,

  -- Pipeline
  status TEXT NOT NULL DEFAULT 'a_visiter'
    CHECK (status IN ('a_visiter','visite_1','visite_2','visite_3',
                      'offre_faite','compromis','acte','elimine'))
);

-- Photos des biens
CREATE TABLE property_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fichiers attachés
CREATE TABLE property_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scores par membre et par bien
CREATE TABLE scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  criteria_id UUID REFERENCES criteria(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 1 AND score <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, user_id, criteria_id)
);

-- Profils utilisateurs
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes & mémos partagés
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'memo'
    CHECK (category IN ('memo','criteres_recherche','template_agence','budget','autre'))
);
```

---

## Structure de l'application

### Pages

| Route | Description |
|---|---|
| `/login` | Connexion email + mot de passe |
| `/register` | Inscription (prénom, nom, email, mot de passe) |
| `/dashboard` | Vue Kanban + Vue Liste (toggle) |
| `/biens/nouveau` | Formulaire de création d'un bien |
| `/biens/[id]` | Fiche détail complète |
| `/biens/[id]/modifier` | Édition de la fiche |
| `/carte` | Carte interactive avec tous les biens géolocalisés |
| `/comparaison` | Tableau comparatif des biens visités |
| `/notes` | Espace notes collaboratif famille |
| `/parametres/criteres` | Gestion des critères de scoring |

---

## Navigation principale (sidebar fixe à gauche)

Dans l'ordre d'affichage :

1. **Logo** "Maison de vacances" avec icône montagne
2. 🟠 **Bouton "Ajouter un bien"** — bien visible en orange, accessible depuis toutes les pages
3. 🏠 Tableau de bord
4. 🗺️ Carte
5. 📊 Comparaison
6. 📝 Notes
7. ⚙️ Paramètres
8. Bouton Déconnexion (en bas, en rouge discret)

---

## Fonctionnalités détaillées

### Pipeline Kanban — 7 colonnes actives + zone "Éliminés"

Les **7 colonnes actives** dans le kanban :
1. À visiter
2. Visite 1
3. Visite 2
4. Visite 3
5. Offre faite
6. Compromis
7. Acte notarié

**Zone "Biens éliminés"** (séparée du kanban) :
- Bandeau cliquable en bas du dashboard avec le compteur de biens éliminés
- Clic → déploie/replie une grille de cartes grisées
- Photos en noir & blanc pour les distinguer visuellement
- Bouton "↩ Remettre en liste" par bien (remet en statut "À visiter")
- On peut aussi glisser-déposer un bien sur ce bandeau pour l'éliminer
- Cette séparation permet de garder le kanban principal propre et lisible

**Drag & drop :** entre les 7 colonnes actives et vers la zone éliminés.

**Chaque carte kanban affiche :**
- Nom (nickname si renseigné, sinon ville)
- Ville en sous-titre si nickname renseigné
- Prix
- Surface + nombre de pièces
- Score moyen famille (si existant)
- Distance depuis Suresnes en km + durée de trajet
- Photo principale (si disponible)

---

### Vue Liste (alternative au Kanban)

Toggle **Kanban / Liste** en haut du dashboard.

La vue liste affiche tous les biens dans un tableau avec :
- Miniature photo
- Nom du bien (nickname ou ville)
- Statut (badge coloré)
- Prix
- Surface
- Distance + durée
- Score famille
- Icône lien annonce

**Toutes les colonnes sont triables** (clic sur l'en-tête = tri croissant/décroissant).

---

### Nom personnalisé (nickname)

Chaque bien peut avoir un **nom/surnom** libre (ex : "Mas provençal", "Maison du lac", "Villa des pins").

- Champ optionnel, en haut du formulaire
- Si renseigné : utilisé partout (kanban, liste, fiche, carte, comparaison)
- Si vide : la ville est utilisée automatiquement comme nom d'affichage
- La ville reste toujours affichée en sous-titre si un nickname est renseigné

---

### Détection de doublon sur l'URL d'annonce

Quand l'utilisateur saisit une URL d'annonce dans le formulaire :
- Dès que le champ perd le focus (onBlur), une vérification silencieuse est faite en base
- Si l'URL existe déjà pour un autre bien → alerte orange sous le champ avec un lien cliquable vers le bien existant
- Le formulaire reste soumissible (c'est un avertissement, pas un blocage)
- Pas de vérification sur le bien en cours d'édition (pas de faux positif)

---

### Fiche détail d'un bien — ordre des sections

1. **En-tête** : nom, statut (badge), score famille, adresse, boutons Modifier + Voir l'annonce
2. **Prix & finances** : prix affiché, prix net vendeur, honoraires agence, coût annuel détention
3. **Caractéristiques** : surface, nombre de pièces
4. **Agence** : nom, contact, téléphone, email
5. **Descriptions** : description générale, description technique, travaux à prévoir
6. **Photos** : galerie avec upload multiple et suppression
7. **Fichiers attachés** : devis, diagnostics, plans — avec icône type et bouton télécharger
8. **Scoring** : notes étoiles (1-5) par critère, score personnel + scores de tous les membres de la famille
9. **Distance & carte** : distance routière + durée de trajet, mini-carte Leaflet centrée sur le bien

> ⚠️ La distance est délibérément placée **en bas de page** — c'est une info secondaire.

---

### Calculs automatiques

| Calcul | Formule |
|---|---|
| Prix net vendeur | Prix de vente − Honoraires agence |
| Coût annuel de détention | Taxe foncière + Taxe d'habitation |
| Score global membre | Σ (note × poids du critère / 100) |
| Moyenne famille | Moyenne des scores des membres ayant noté (membres sans note ignorés) |

---

### Géolocalisation & Distance

**Géocodage :** à la création/modification d'un bien, bouton "Géocoder l'adresse" qui :
1. Appelle **Nominatim** (OpenStreetMap) pour obtenir les coordonnées GPS
2. Appelle **OSRM** (OpenStreetMap Routing) pour calculer la **vraie distance routière** en km et la durée de trajet depuis Suresnes (48.8698, 2.2190)
3. Remplit automatiquement les champs latitude, longitude, distance (km) et durée

Les deux champs restent modifiables manuellement.

**Carte interactive** (`/carte`) :
- Marqueur coloré par statut :
  - 🔵 À visiter
  - 🟡 Visite 1/2/3
  - 🟠 Offre faite / Compromis
  - 🟢 Acte notarié
  - ⚫ Éliminé
- Clic sur marqueur → popup avec photo, ville, prix, score famille, lien fiche
- Centrage automatique sur l'ensemble des biens

---

### Scoring

- Chaque membre connecté note de **1 à 5 étoiles** chaque critère
- Sauvegarde automatique à chaque note (pas de bouton "Enregistrer")
- La fiche affiche :
  - La grille de notation interactive de l'utilisateur connecté
  - Le score global de chaque membre (barre de progression + chiffre)
  - La moyenne famille
- **Critères par défaut** (modifiables dans Paramètres) :

| Critère | Poids |
|---|---|
| Localisation & accès | 20% |
| Environnement (calme, nature, voisinage) | 15% |
| État général du bien | 15% |
| Extérieur (jardin, terrasse, piscine…) | 15% |
| Surface & agencement | 10% |
| Potentiel locatif saisonnier | 10% |
| Luminosité | 5% |
| Travaux à prévoir | 5% |
| Coup de cœur | 5% |

---

### Notes & Mémos

- Espace collaboratif partagé — tous les membres voient et peuvent modifier toutes les notes
- Filtrage par catégorie
- Édition inline (modal, pas de page séparée)
- 5 catégories avec couleur distincte :

| Emoji | Catégorie | Couleur |
|---|---|---|
| 📝 | Mémo général | Gris |
| 🔍 | Critères de recherche | Bleu |
| 📨 | Template agence | Terracotta |
| 💰 | Budget | Vert |
| 📌 | Autre | Jaune |

---

### Upload photos & fichiers

- **Photos** → Supabase Storage bucket `property-photos` (public)
- **Fichiers** → Supabase Storage bucket `property-files` (public)
- Upload multiple pour les photos
- Galerie photos avec suppression individuelle
- Fichiers : nom + icône selon type + bouton télécharger + suppression

---

### Comparaison

Page `/comparaison` — uniquement les biens avec statut Visite 1, 2 ou 3.

Tableau avec :
- Colonne par bien (classés par score famille décroissant)
- Ligne par critère avec score moyen famille pour ce critère
- Lignes des scores individuels de chaque membre
- Ligne récapitulative "Score famille" mise en évidence
- Badge 🏆 N°1 sur le bien avec le meilleur score
- Toutes les infos du bien en en-tête de colonne (ville, prix, surface)

---

### Paramètres — Gestion des critères

- Modifier le nom et le poids de chaque critère
- Ajouter / supprimer un critère
- Indicateur visuel du total (doit être égal à 100%)
- Bouton "Enregistrer" actif seulement si total = 100%

---

## Design actuel

**Direction :** élégant et chaleureux, inspiré de l'immobilier premium et du sud de la France.

**Palette :**
- Pierre/stone (`stone-*`) — couleur dominante du fond et des textes
- Terracotta/orange (`orange-600` principalement) — couleur d'accentuation (boutons, liens, scores)
- Sage vert — utilisé ponctuellement

**Typographie :**
- Titres : **Playfair Display** (serif, Google Fonts)
- Corps : **Inter** (sans-serif)

**Composants :**
- Fonds blancs, coins très arrondis (`rounded-xl`, `rounded-2xl`)
- Ombres douces (`shadow-sm`)
- Beaucoup d'espace blanc
- Interface aérée

**Layout :**
- Sidebar fixe à gauche (264px) sur desktop
- Contenu scrollable à droite
- Responsive mobile (l'app s'installe sur téléphone via "Ajouter à l'écran d'accueil")

---

## Variables d'environnement nécessaires

```
NEXT_PUBLIC_SUPABASE_URL=https://[projet].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## Ce qui pourrait être amélioré (pistes pour le redesign)

- **Mobile first** : la sidebar devient un menu hamburger sur mobile
- **Mode sombre** : palette pierre/terracotta se prête bien à un dark mode
- **Onboarding** : page de bienvenue pour les nouveaux membres avec explication des fonctionnalités
- **Animations** : transitions plus fluides entre les vues (kanban → liste, ouverture des cartes)
- **Photo principale** : possibilité de définir quelle photo est la "principale" dans la galerie
- **Filtres sur le kanban** : filtrer les cartes par prix, surface, score
- **Notifications** : alerter les membres quand un nouveau bien est ajouté ou une note modifiée
- **Export PDF** : générer une fiche de synthèse par bien ou un rapport comparatif
