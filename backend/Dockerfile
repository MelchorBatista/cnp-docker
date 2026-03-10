FROM node:24-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ unixodbc unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build \
    && npm prune --omit=dev

FROM node:24-bookworm-slim AS runtime

WORKDIR /app

ARG OCI_TITLE=cnp-backend
ARG OCI_VERSION=dev
ARG OCI_REVISION=local
ARG OCI_SOURCE=local
ARG OCI_CREATED=unknown

LABEL org.opencontainers.image.title=$OCI_TITLE \
      org.opencontainers.image.version=$OCI_VERSION \
      org.opencontainers.image.revision=$OCI_REVISION \
      org.opencontainers.image.source=$OCI_SOURCE \
      org.opencontainers.image.created=$OCI_CREATED

ENV NODE_ENV=production \
    PORT=3000 \
    SERVER_PORT=3000

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

USER node

CMD ["node", "build/server.js"]
