FROM oven/bun:1 AS dependencies
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ENV GRAPHITE_CONTENT_DIR=/content
ENV GRAPHITE_OUTPUT_DIR=/output
ENV ASTRO_TELEMETRY_DISABLED=1
VOLUME ["/content", "/output"]
ENTRYPOINT ["/app/scripts/entrypoint.sh"]
