#!/bin/sh
set -eu

if [ -d /github/workspace ]; then
  source_path=${1:-.}
  output_path=${2:-dist}
  site_url=${3:-auto}
  external_fonts=${4:-false}
  export GRAPHITE_CONTENT_DIR="$(realpath "/github/workspace/$source_path")"
  export GRAPHITE_OUTPUT_DIR="$(realpath -m "/github/workspace/$output_path")"

  if [ "$site_url" = auto ]; then
    site_url="https://${GITHUB_REPOSITORY_OWNER}.github.io"
  fi
  export SITE_URL="$site_url"
  case "$external_fonts" in
    true|false) export GRAPHITE_ENABLE_EXTERNAL_FONTS="$external_fonts" ;;
    *) echo "enable-external-fonts must be true or false" >&2; exit 1 ;;
  esac

  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    printf 'path=%s\n' "$output_path" >> "$GITHUB_OUTPUT"
  fi
fi

cd /app
exec bun run build
