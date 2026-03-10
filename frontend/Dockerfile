FROM node:24-bookworm-slim AS build

WORKDIR /app

ARG VITE_BASEPATH=/cnp/
ARG VITE_BACKEND_URL=
ARG VITE_API_BASE_URL=/api
ARG VITE_API_URL=
ARG VITE_SOCKET_URL=
ARG VITE_VALIDATION_ENDPOINT=
ARG VITE_STATUS_ENDPOINT=
ARG VITE_CHANGE_PASSWORD_ENDPOINT=
ARG VITE_LOGIN_ENDPOINT=/auth/login
ARG VITE_STATUS_PAGE_URL=
ARG VITE_SECRET_KEY=

ENV VITE_BASEPATH=${VITE_BASEPATH} \
    VITE_BACKEND_URL=${VITE_BACKEND_URL} \
    VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_API_URL=${VITE_API_URL} \
    VITE_SOCKET_URL=${VITE_SOCKET_URL} \
    VITE_VALIDATION_ENDPOINT=${VITE_VALIDATION_ENDPOINT} \
    VITE_STATUS_ENDPOINT=${VITE_STATUS_ENDPOINT} \
    VITE_CHANGE_PASSWORD_ENDPOINT=${VITE_CHANGE_PASSWORD_ENDPOINT} \
    VITE_LOGIN_ENDPOINT=${VITE_LOGIN_ENDPOINT} \
    VITE_STATUS_PAGE_URL=${VITE_STATUS_PAGE_URL} \
    VITE_SECRET_KEY=${VITE_SECRET_KEY}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime

ARG OCI_TITLE=cnp-frontend
ARG OCI_VERSION=dev
ARG OCI_REVISION=local
ARG OCI_SOURCE=local
ARG OCI_CREATED=unknown

LABEL org.opencontainers.image.title=$OCI_TITLE \
      org.opencontainers.image.version=$OCI_VERSION \
      org.opencontainers.image.revision=$OCI_REVISION \
      org.opencontainers.image.source=$OCI_SOURCE \
      org.opencontainers.image.created=$OCI_CREATED

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/* && mkdir -p /usr/share/nginx/html/cnp
COPY --from=build /app/dist/ /usr/share/nginx/html/cnp/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
