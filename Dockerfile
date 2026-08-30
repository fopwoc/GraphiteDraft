FROM oven/bun:1 AS dependencies
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/graphite-draft/package.json ./packages/graphite-draft/package.json
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS builder
ARG VERSION=0.0.0-development
ARG BUILD_NUMBER=0
WORKDIR /app/packages/graphite-draft
COPY --from=dependencies /app/node_modules ./node_modules
COPY packages/graphite-draft ./
ENV GRAPHITE_CONTENT_DIR=/content
ENV GRAPHITE_OUTPUT_DIR=/output
ENV GRAPHITE_VERSION=$VERSION
ENV GRAPHITE_BUILD_NUMBER=$BUILD_NUMBER
ENV ASTRO_TELEMETRY_DISABLED=1
VOLUME ["/content", "/output"]
ENTRYPOINT ["/app/packages/graphite-draft/scripts/entrypoint.sh"]
