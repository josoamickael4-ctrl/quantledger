# Déploiement de QuantLedger sur Render

## Instructions de déploiement

### 1. Créer un compte Render
- Allez sur [render.com](https://render.com)
- Créez un compte (gratuit)

### 2. Créer un nouveau projet
- Cliquez sur "New" → "Web Service"
- Connectez votre compte GitHub
- Sélectionnez le repository `quantledger`

### 3. Configuration du service

#### Backend (Docker)
- **Name**: `quantledger-backend`
- **Environment**: `Docker`
- **Dockerfile path**: `./backend/Dockerfile`
- **Docker context**: `./backend`
- **Plan**: Free
- **Region**: Choisissez la région la plus proche

#### Variables d'environnement
Render créera automatiquement les variables pour PostgreSQL et Redis.

Ajoutez ces variables manuelles :
```
PORT=3000
NODE_ENV=production
```

### 4. Créer la base de données PostgreSQL
- Cliquez sur "New" → "PostgreSQL"
- **Name**: `quantledger-db`
- **Database**: `trading_journal`
- **User**: `trading_user`
- **Plan**: Free
- **Region**: Même région que le backend

### 5. Créer Redis
- Cliquez sur "New" → "Redis"
- **Name**: `quantledger-redis`
- **Plan**: Free
- **Region**: Même région que le backend

### 6. Connecter les services
- Dans le service backend, ajoutez les variables d'environnement :
  - `DATABASE_URL` : Connectez à la base de données PostgreSQL
  - `REDIS_URL` : Connectez au service Redis

### 7. Déploiement
- Cliquez sur "Create Web Service"
- Render construira et déploiera automatiquement
- Le déploiement prend quelques minutes

### 8. Obtenir l'URL
- Une fois déployé, Render vous donnera une URL publique
- Exemple : `https://quantledger-backend.onrender.com`

## Variables d'environnement

Dans le tableau de bord Render, configurez :

```
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://trading_user:password@host:5432/trading_journal
REDIS_URL=redis://host:6379
```

## Déploiement du frontend

Le frontend React doit être déployé séparément :

1. **Option 1 : Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Importez le repository GitHub
   - Configurez le répertoire racine comme `frontend`
   - Configurez l'URL de l'API backend

2. **Option 2 : Netlify**
   - Allez sur [netlify.com](https://netlify.com)
   - Importez le repository GitHub
   - Configurez le répertoire de publication comme `frontend/dist`
   - Configurez la commande de build comme `cd frontend && npm run build`

## Avantages de Render

- **Plan gratuit** disponible
- **PostgreSQL** inclus gratuitement
- **Redis** inclus gratuitement
- **Déploiement automatique** à chaque push GitHub
- **SSL/TLS** automatique
- **Domaines personnalisés** supportés

## Structure du projet

```
/
├── backend/          # API NestJS
├── frontend/         # React frontend
├── docker-compose.yml
├── render.yaml       # Configuration Render
└── RENDER_DEPLOYMENT.md
```

## Notes importantes

- Render offre un plan gratuit avec 750 heures/mois d'exécution
- PostgreSQL et Redis sont inclus gratuitement
- Les services "free" s'endorment après 15 minutes d'inactivité
- Le premier démarrage après mise en veille peut prendre quelques secondes
- Les logs sont disponibles dans le tableau de bord Render
