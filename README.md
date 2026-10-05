# DangerMap

Mapa colaborativo de perigos urbanos (buracos, alagamentos, iluminação etc.).
Funciona no navegador, como app de Windows (Electron) e como app Android (Capacitor).

## O que instalar antes
- [Node.js](https://nodejs.org) 20 ou mais novo
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (só para o banco de dados)

## Como rodar (primeira vez)
1. Copie `.env.example` para `.env` e preencha (pelo menos as senhas e os dois segredos do login).
2. Suba o banco (deixe o Docker Desktop aberto):
   ```
   docker compose up -d
   ```
3. Instale e prepare o servidor:
   ```
   cd backend
   npm install
   npx dotenv -e ../.env -- prisma migrate deploy
   npm run dev
   ```
   O servidor fica em http://localhost:3000.
   Num banco novo, cadastre também as categorias (uma vez só, com o Docker ligado):
   ```
   docker cp backend/prisma/seed-categorias.sql dangermap_db:/tmp/seed.sql
   docker exec dangermap_db psql -U admin -d dangermap_db -f /tmp/seed.sql
   ```
   (se você mudou `DB_USER`/`DB_NAME` no `.env`, troque `admin` e `dangermap_db` por eles)
4. Em **outro terminal**, abra o site:
   ```
   cd frontend
   npm install
   npm run dev
   ```
   Acesse http://localhost:5173.

## Virar administrador
Crie sua conta pelo site e depois rode (troque o e-mail):
```
docker exec dangermap_db psql -U admin -d dangermap_db -c "UPDATE usuarios SET tipo_usuario='admin' WHERE email='seu@email.com';"
```

## Nas próximas vezes
Abra o Docker Desktop, rode `docker compose up -d` na pasta do projeto e depois `npm run dev` em `backend` e em `frontend`.

## Como enviar o projeto zipado
Na pasta do projeto: `powershell -ExecutionPolicy Bypass -File scripts\zipar-dangermap.ps1`
(cria `DangerMap.zip` na Área de Trabalho, sem `node_modules`, sem builds e sem o `.env`).

## Documentação
- Documentação da API (com o servidor ligado): http://localhost:3000/api/docs

## Estrutura
- `backend/` servidor (Node, Express, Prisma, PostGIS)
- `frontend/` site (React + Vite) e app Android (Capacitor, pasta `frontend/android`)
- `desktop/` app de Windows (Electron)
- `shared/` tipos usados pelos dois lados
