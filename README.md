# Fantabon

Fantabon è una web app full stack per impostare obiettivi estivi, completare attività e accumulare punti in una classifica condivisa tra utenti.

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Deploy frontend: Vercel
- Deploy backend: Vercel Serverless Functions oppure Node server tradizionale

## Funzioni principali
- Creazione utenti con nickname
- Creazione di obiettivi estivi con target punti
- Completamento obiettivi e assegnazione punti
- Dashboard con statistiche
- Classifica globale utenti
- Dati demo iniziali inclusi

## Struttura progetto
- `client/`: frontend React
- `server/`: backend Express API
- `vercel.json`: routing per deploy su Vercel

## Avvio locale
```bash
npm run install:all
npm run dev
```

Frontend su `http://localhost:5173`
Backend su `http://localhost:3001`

## Deploy su GitHub e Vercel
1. Crea un repository GitHub e fai push della cartella.
2. Importa il repo su Vercel.
3. Imposta Root Directory su `client` se vuoi deployare solo il frontend, oppure usa il `vercel.json` incluso per frontend + API.
4. Variabile frontend: `VITE_API_URL` se il backend è separato.

## API principali
- `GET /api/health`
- `GET /api/users`
- `POST /api/users`
- `GET /api/goals`
- `POST /api/goals`
- `PATCH /api/goals/:id/progress`
- `GET /api/leaderboard`
- `GET /api/stats`

## Evoluzioni consigliate
- Database PostgreSQL con Prisma
- Login con Clerk o Auth.js
- Salvataggio cloud e profili privati/pubblici
- Badge e streak giornaliere
