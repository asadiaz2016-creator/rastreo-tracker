FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install

# Dev stage: hot reload, used by docker-compose.yml locally.
FROM deps AS dev
COPY . .
RUN npx prisma generate
CMD ["npm", "run", "dev"]

FROM deps AS builder
COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage: used when deploying to a real server.
FROM builder AS runner
ENV NODE_ENV=production
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
