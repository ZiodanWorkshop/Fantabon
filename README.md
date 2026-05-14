# Fantabon - file mancanti

Aggiungi questi file nella root della repository in modo che la struttura finale sia:

- `client/`
- `api/`
- `server/`
- `package.json`
- `vercel.json`

## Deploy su Vercel
- Root Directory: vuota
- Build Command: `npm run build --prefix client`
- Output Directory: `client/dist`

## Dopo aver copiato i file
```bash
git add .
git commit -m "add missing fantabon files"
git push origin main
```
