FROM node:22-alpine AS builder

RUN apk add --no-cache openssl
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN npm ci -w @travel-app/api --include-workspace-root

COPY apps/api ./apps/api
COPY packages/shared-types ./packages/shared-types
RUN npm run prisma:generate -w @travel-app/api
RUN npm run build -w @travel-app/api

FROM node:22-alpine AS production-dependencies

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN npm ci -w @travel-app/api --omit=dev --ignore-scripts

FROM node:22-alpine AS runtime

RUN apk add --no-cache openssl \
  && addgroup -S travel \
  && adduser -S travel -G travel
WORKDIR /app
ENV NODE_ENV=production

COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

USER travel
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/index.js"]
