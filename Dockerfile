FROM node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app

ENV NODE_ENV=production
ENV DB_HOST=127.0.0.1
ENV DB_PORT=3306
ENV DB_NAME=build_placeholder
ENV DB_USER=build_placeholder

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN DB_PASSWORD=build_placeholder AUTH_SECRET=build-placeholder-secret-32-characters-minimum npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5173
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/messages ./messages
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 5173

CMD ["npm", "start"]
