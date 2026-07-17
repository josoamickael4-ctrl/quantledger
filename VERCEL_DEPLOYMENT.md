# Déploiement du frontend QuantLedger sur Vercel

## Instructions de déploiement

### 1. Créer un compte Vercel
- Allez sur [vercel.com](https://vercel.com)
- Créez un compte (gratuit)

### 2. Importer le projet
- Cliquez sur "Add New" → "Project"
- Connectez votre compte GitHub
- Sélectionnez le repository `quantledger`

### 3. Configuration du projet

#### Framework Preset
- **Framework**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

#### Variables d'environnement
Ajoutez cette variable :
```
VITE_API_URL=https://quantledger-backend.onrender.com
```

### 4. Déploiement
- Cliquez sur "Deploy"
- Vercel construira et déploiera automatiquement
- Le déploiement prend environ 1-2 minutes

### 5. Obtenir l'URL
- Une fois déployé, Vercel vous donnera une URL publique
- Exemple : `https://quantledger.vercel.app`

## Configuration personnalisée

Le fichier `vercel.json` est déjà configuré pour :
- Rediriger toutes les routes vers `index.html` (pour React Router)
- Utiliser le répertoire `dist` comme répertoire de sortie

## Domaine personnalisé

Vous pouvez ajouter un domaine personnalisé :
1. Allez dans les paramètres du projet Vercel
2. Cliquez sur "Domains"
3. Ajoutez votre domaine personnalisé
4. Configurez les DNS selon les instructions de Vercel

## Avantages de Vercel

- **Plan gratuit** disponible
- **Déploiement automatique** à chaque push GitHub
- **SSL/TLS** automatique
- **CDN global** pour des performances optimales
- **Domaines personnalisés** gratuits
- **Preview deployments** pour chaque pull request

## Structure du projet

```
/
├── frontend/         # React frontend
│   ├── vercel.json   # Configuration Vercel
│   └── ...
└── VERCEL_DEPLOYMENT.md
```

## Notes importantes

- Vercel offre un plan gratuit avec :
  - Déploiements illimités
  - 100 GB de bande passante par mois
  - Prévisualisations pour chaque commit
- Les builds sont automatiques à chaque push
- Les logs sont disponibles dans le tableau de bord Vercel
