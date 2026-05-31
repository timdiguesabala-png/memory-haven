# Memory Haven API — déploiement Railway (racine du dépôt, Root Directory vide)
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/prisma ./prisma
COPY backend/src ./src
COPY backend/scripts ./scripts

RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && (node prisma/seed.js || true) && node src/app.js"]
