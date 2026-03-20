FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/

RUN npm ci --workspace=@vein-clinic/shared --workspace=@vein-clinic/backend

COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend
COPY config ./config

RUN npm -w @vein-clinic/shared run build
RUN npm -w @vein-clinic/backend run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/package.json ./packages/backend/
COPY --from=builder /app/packages/backend/prisma ./packages/backend/prisma
COPY --from=builder /app/config ./config

RUN npm ci --workspace=@vein-clinic/shared --workspace=@vein-clinic/backend --omit=dev

EXPOSE 3001

CMD ["node", "packages/backend/dist/index.js"]
