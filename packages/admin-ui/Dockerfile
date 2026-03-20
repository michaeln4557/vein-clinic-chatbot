FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/admin-ui/package.json ./packages/admin-ui/

RUN npm ci --workspace=@vein-clinic/shared --workspace=@vein-clinic/admin-ui

COPY packages/shared ./packages/shared
COPY packages/admin-ui ./packages/admin-ui

RUN npm -w @vein-clinic/shared run build
RUN npm -w @vein-clinic/admin-ui run build

FROM nginx:alpine

COPY --from=builder /app/packages/admin-ui/dist /usr/share/nginx/html
COPY packages/admin-ui/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
