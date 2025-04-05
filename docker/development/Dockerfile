# ----------------------
# 1) 빌드 스테이지
# ----------------------
FROM node:20-alpine AS build-deps

RUN apk add --no-cache libc6-compat \
    python3 \
    build-base \
    pkgconfig \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev 

WORKDIR /app

COPY package.json package-lock.json* .npmrc* ./
RUN npm ci --force

COPY . .

RUN npm run build

# ----------------------
# 2) 런타임 스테이지
# ----------------------
FROM node:20-alpine AS runner
RUN apk add --no-cache \
    libc6-compat \
    cairo \
    pango \
    jpeg \
    giflib \
    librsvg
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=build-deps /app/node_modules ./node_modules
COPY --from=build-deps /app/public ./public
COPY --from=build-deps --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build-deps --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]