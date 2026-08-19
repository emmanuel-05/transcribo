# Stage Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Argument et variable d'environnement au build Next.js
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copier et installer les dépendances
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copier le code source et build
COPY . .
RUN npm run build

# Stage Final
FROM node:20-alpine

WORKDIR /app

# Copier uniquement les fichiers nécessaires depuis le builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/public ./public
# On copie aussi le next.config si besoin
COPY --from=builder /app/next.config.ts ./next.config.ts

# Installer uniquement les dépendances de prod
RUN npm ci --only=production --legacy-peer-deps

EXPOSE 3000

CMD ["npm", "start"]
