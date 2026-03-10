FROM nginx:1.27-alpine

ARG OCI_TITLE=cnp-proxy
ARG OCI_VERSION=dev
ARG OCI_REVISION=local
ARG OCI_SOURCE=local
ARG OCI_CREATED=unknown

LABEL org.opencontainers.image.title=$OCI_TITLE \
      org.opencontainers.image.version=$OCI_VERSION \
      org.opencontainers.image.revision=$OCI_REVISION \
      org.opencontainers.image.source=$OCI_SOURCE \
      org.opencontainers.image.created=$OCI_CREATED

ENV PROXY_FRONTEND_UPSTREAM=http://frontend:80 \
    PROXY_BACKEND_UPSTREAM=http://backend:3000 \
    PROXY_BASE_PATH=/cnp \
    PROXY_API_PREFIX=/api \
    PROXY_SOCKETIO_PATH=/socket.io \
    PROXY_SOCKETIO_COMPAT_PATH=/cnp/socket.io

COPY default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
