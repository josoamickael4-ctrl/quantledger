# Déploiement de QuantLedger sur Railway

## Instructions de déploiement

### 1. Créer un compte Railway
- Allez sur [railway.app](https://railway.app)
- Créez un compte (gratuit)

### 2. Créer un nouveau projet
- Cliquez sur "New Project"
- Sélectionnez "Deploy from GitHub repo"

### 3. Connecter votre repository
- Connectez votre compte GitHub
- Sélectionnez le repository de QuantLedger

### 4. Configuration des services

#### Backend (NestJS)
- Railway détectera automatiquement le backend
- Variables d'environnement à configurer :
  ```
  PORT=3000
  NODE_ENV=production
  DB_HOST=${{RAILWAY_PRIVATE_DOMAIN}}
  DB_PORT=5432
  DB_USERNAME=${{PGUSER}}
  DB_PASSWORD=${{PGPASSWORD}}
  DB_DATABASE=${{PGDATABASE}}
  REDIS_HOST=${{RAILWAY_PRIVATE_DOMAIN}}
  REDIS_PORT=6379
  ```

#### Base de données PostgreSQL
- Ajoutez un service "PostgreSQL"
- Railway créera automatiquement les variables d'environnement

#### Redis
- Ajoutez un service "Redis"
- Railway créera automatiquement les variables d'environnement

### 5. Configuration du frontend
- Le frontend doit être déployé séparément sur Vercel ou Netlify
- Configurez l'URL de l'API backend dans le frontend

### 6. Déploiement
- Cliquez sur "Deploy"
- Railway construira et déploiera automatiquement votre application

### 7. Obtenir l'URL
- Une fois déployé, Railway vous donnera une URL publique
- Exemple : `https://quantledger-production.up.railway.app`

## Variables d'environnement

Dans le tableau de bord Railway, ajoutez ces variables :

```
PORT=3000
NODE_ENV=production
```

Les variables de base de données et Redis seront automatiquement créées par Railway.

## Structure du projet

```
/
├── backend/          # API NestJS
├── frontend/         # React frontend
├── docker-compose.yml
├── railway.json      # Configuration Railway
└── RAILWAY_DEPLOYMENT.md
```

## Notes importantes

- Railway offre un plan gratuit avec 500h/mois d'exécution
- PostgreSQL et Redis sont inclus gratuitement
- Le déploiement est automatique à chaque push sur GitHub
- Les logs sont disponibles dans le tableau de bord Railway
