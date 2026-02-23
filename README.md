# Assmat Contrats (Next.js + Prisma + Postgres)

Application web mono-utilisateur pour gérer des contrats d’assistante maternelle (1 contrat = 1 enfant), la saisie des horaires, les calculs mensuels (mensualisation/lissage, heures complémentaires, majorations >45h/sem, prime CDD, indemnités) et l’export PDF (style proche Pajemploi).

## Stack

- Next.js App Router + TypeScript
- Prisma + PostgreSQL
- Zod (validation client + serveur)
- `@react-pdf/renderer` (export PDF)
- Jest + React Testing Library + Playwright
- Déploiement VPS via Docker Compose (`app` + `postgres`)

## Fonctionnalités couvertes

- CRUD contrats (enfant, planning, taux horaire, heures compl., majoration, indemnités, prime CDD)
- Pointage quotidien (arrivée/départ, repas, tags absence/férié/indisponible)
- Vue contrat avec onglets `Jour / Semaine / Mois`
- Calculs mensuels détaillés:
  - heures prévues lissées (absences prévues déduites du volume annuel)
  - heures faites
  - heures complémentaires (affichées et facturées/non facturées selon option)
  - majoration heures > 45h / semaine (Mon -> Sun)
  - brut base / brut compl. / brut majoré
  - prime de précarité CDD (10% annuel lissé mensuellement)
  - net (coef fixe `0.7812`)
  - indemnités repas et entretien (grille libre par contrat)
  - total à payer
- Réglages:
  - info `ADMIN_TOKEN` (lecture seule)
  - coefficient net fixe (lecture seule)
  - grille de référence (JSON initial en repo, édition via UI + DB)
- Export PDF mensuel par contrat
- Middleware de protection minimale par header `x-admin-token`

## Variables d’environnement

Copier `.env.example` vers `.env`.

- `DATABASE_URL` (Postgres)
- `ADMIN_TOKEN`:
  - vide/non défini: pas de protection middleware
  - défini: toutes les routes `app` + `api` exigent `x-admin-token: <ADMIN_TOKEN>`

## Setup local (sans Docker)

### 1. Prérequis

- Node.js 20+
- PostgreSQL 15+ (ou 16)

### 2. Installation

```bash
npm install
```

### 3. Configuration

Créer `.env`:

```env
DATABASE_URL="postgresql://assmat:assmat@localhost:5432/assmat?schema=public"
ADMIN_TOKEN=""
```

### 4. Migration + seed

```bash
npm run prisma:migrate
npm run prisma:seed
```

### 5. Lancer l’app

```bash
npm run dev
```

Ouvrir `http://localhost:3000`.

## Utilisation d’ADMIN_TOKEN

Si `ADMIN_TOKEN` est défini, toute requête doit inclure:

```http
x-admin-token: votre_token
```

Exemples:

```bash
curl -H "x-admin-token: change-me" http://localhost:3000/api/contracts
```

Pour un navigateur (routes pages), le plus simple est d’ajouter ce header via reverse proxy.

## Reverse Proxy (Nginx / Caddy)

### Nginx (ajout automatique du header)

```nginx
server {
  listen 80;
  server_name votre-domaine.tld;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header x-admin-token "VOTRE_TOKEN_ICI";
  }
}
```

### Caddy

```caddy
votre-domaine.tld {
  reverse_proxy 127.0.0.1:3000 {
    header_up x-admin-token "VOTRE_TOKEN_ICI"
  }
}
```

## Docker (local / VPS)

### Démarrage

```bash
docker compose up --build -d
```

L’app sera disponible sur `http://IP_DU_VPS:3000`.

Par défaut dans `docker-compose.yml`:

- Postgres: `assmat/assmat`
- `ADMIN_TOKEN=change-me` (à changer impérativement)

### Logs

```bash
docker compose logs -f app
docker compose logs -f db
```

### Arrêt

```bash
docker compose down
```

### Mise à jour (VPS)

```bash
docker compose pull
docker compose up --build -d
```

## Déploiement VPS (recommandé)

1. Installer Docker + Docker Compose plugin.
2. Copier le projet sur le VPS.
3. Modifier `docker-compose.yml`:
   - `ADMIN_TOKEN`
   - mot de passe Postgres
   - port exposé si besoin
4. Lancer `docker compose up --build -d`.
5. Mettre un reverse proxy (Nginx/Caddy) devant.
6. Ajouter HTTPS (Let’s Encrypt via Caddy ou certbot/Nginx).

## Scripts npm

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm test`
- `npm run test:e2e`
- `npm run prisma:migrate`
- `npm run prisma:seed`

## Tests

### Unitaires + RTL

```bash
npm test
```

### E2E Playwright

```bash
npx playwright install
npm run test:e2e
```

Notes:

- Les tests e2e lancent l’app via `npm run dev`.
- Prévoir une DB de test Postgres accessible par `DATABASE_URL`.
- Pour simplifier, laisser `ADMIN_TOKEN` vide en e2e (ou configurer des headers dans Playwright/proxy).

## Modèle de données (résumé)

- `Contract`
  - planning (`hoursPerDay`, `daysPerWeek`, `weeksPerYear`, `plannedAbsences`)
  - taux (`baseHourlyRate`, override optionnel)
  - heures complémentaires (facturation oui/non)
  - majoration (`overtimeRatePercent`)
  - indemnités repas / entretien
  - prime précarité (CDD)
- `TimeEntry`
  - date, horaires, durée calculée
  - repas
  - tags absences/férié/indispo
- `Settings`
  - coefficient net (fixe)
  - grille de référence (editable en UI, persistée en DB)

## Notes de calcul importantes

- Les calculs affichent des arrondis à 2 décimales, mais conservent les valeurs internes non arrondies.
- Les heures complémentaires sont calculées à la journée (`heures faites - hoursPerDay` si positif).
- Les majorations sont calculées par semaine calendaire (lundi -> dimanche) sur les heures réelles.
- Les absences prévues diminuent le volume annuel contractuel avant lissage mensuel.

## Seed de démonstration

Un seed est fourni avec:

- 1 contrat (`Lina`)
- quelques pointages
- la grille de référence par défaut

Exécution:

```bash
npm run prisma:seed
```
