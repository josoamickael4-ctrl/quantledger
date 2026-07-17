# Guide部署 Docker

## Prérequis

- Docker installé sur votre machine
- Docker Compose installé

## Étapes de déploiement

### 1. Configurer les variables d'environnement

Créez le fichier `backend/.env` basé sur `backend/.env.example` :

```bash
cd backend
cp .env.example .env
```

Éditez le fichier `.env` avec vos valeurs :

```env
PORT=3000
OPENAI_API_KEY=votre_cle_openai
SUPABASE_URL=votre_url_supabase
SUPABASE_KEY=votre_cle_supabase
```

### 2. Construire et démarrer les conteneurs

Depuis la racine du projet :

```bash
docker-compose up -d --build
```

Cette commande va :
- Construire l'image Docker du backend
- Construire l'image Docker du frontend
- Démarrer les deux conteneurs
- Le frontend sera accessible sur `http://localhost:80`
- Le backend sera accessible sur `http://localhost:3000`

### 3. Vérifier les logs

```bash
# Voir les logs de tous les services
docker-compose logs -f

# Voir les logs du backend uniquement
docker-compose logs -f backend

# Voir les logs du frontend uniquement
docker-compose logs -f frontend
```

### 4. Arrêter les services

```bash
docker-compose down
```

### 5. Redémarrer après modifications

```bash
docker-compose up -d --build
```

## Structure des volumes

Les données sont persistées via des volumes montés :

- `./backend/members_db.json` → Base de données des membres
- `./backend/trades_db.json` → Base de données des trades
- `./backend/conseils_db.json` → Base de données des conseils
- `./backend/strategies_db.json` → Base de données des stratégies

Ces fichiers sont créés automatiquement au premier démarrage.

## Déploiement sur un serveur

### Sur VPS (DigitalOcean, Hetzner, etc.)

1. **Installer Docker et Docker Compose** sur le serveur
2. **Cloner le repository** sur le serveur
3. **Configurer le fichier `.env`** dans le backend
4. **Lancer les conteneurs** :

```bash
docker-compose up -d --build
```

5. **Configurer un reverse proxy** (optionnel) avec Nginx ou Caddy pour HTTPS

### Avec un nom de domaine

Modifiez `frontend/nginx.conf` pour inclure votre domaine :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    ...
}
```

Puis redémarrez :

```bash
docker-compose up -d --build frontend
```

## Dépannage

### Le frontend ne peut pas communiquer avec le backend

Vérifiez que le proxy dans `nginx.conf` pointe vers `http://backend:3000` (le nom du service Docker).

### Les données ne persistent pas

Assurez-vous que les volumes sont correctement montés dans `docker-compose.yml`.

### Erreur de build

Nettoyez et reconstruisez :

```bash
docker-compose down
docker system prune -a
docker-compose up -d --build
```

## Mise à jour

Pour mettre à jour l'application :

```bash
git pull
docker-compose up -d --build
```
