#!/bin/sh
# Writes /config.js from the environment at container start, so one image serves every environment
# (src/platform/config.ts reads window.__UNICHE_CONFIG__). Runs from /docker-entrypoint.d/; the nginx
# base image then starts nginx itself (do not exec nginx here).
#
# Fails the start on a missing or malformed value instead of serving a CMS that stops later with a
# configuration error. The values are written into a JavaScript string literal, so only the characters
# a URL or an identifier needs are accepted: no quotes, backslashes, spaces, newlines or angle brackets.
set -eu

CONFIG_FILE=/usr/share/nginx/html/config.js

fail() {
  echo "[iguide] $1" >&2
  exit 1
}

require_url_chars() {
  case $2 in
    *[!A-Za-z0-9.:/_-]*) fail "$1 contains characters not allowed in a URL: $2" ;;
  esac
}

# Origin only: scheme, host, optional port; no path, no trailing slash.
require_origin() {
  [ -n "$2" ] || fail "$1 is required"
  require_url_chars "$1" "$2"
  printf '%s' "$2" | grep -Eq '^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?$' \
    || fail "$1 must be an origin like https://host or http://host:port, without a path or trailing slash: $2"
}

# The authoring API base: an origin followed by a path ending in /api/v1.
require_api_base() {
  [ -n "$2" ] || fail "$1 is required"
  require_url_chars "$1" "$2"
  printf '%s' "$2" | grep -Eq '^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?(/[A-Za-z0-9._-]+)*/api/v1$' \
    || fail "$1 must be a URL ending in /api/v1, like https://host/iguide/api/v1: $2"
}

require_id() {
  [ -n "$2" ] || fail "$1 is required"
  case $2 in
    *[!A-Za-z0-9._-]*) fail "$1 may contain only letters, digits, '.', '_' and '-': $2" ;;
  esac
}

# Environment-specific values have no default, as in src/platform/config.ts.
IDP_URL=${IDP_URL:-}
API_BASE_URL=${API_BASE_URL:-}
PORTAL_URL=${PORTAL_URL:-}
REALM=${REALM:-uniche}
CLIENT_ID=${CLIENT_ID:-iguide-web}
AUDIENCE=${AUDIENCE:-uniche-platform}

require_origin IDP_URL "$IDP_URL"
require_api_base API_BASE_URL "$API_BASE_URL"
require_id REALM "$REALM"
require_id CLIENT_ID "$CLIENT_ID"
require_id AUDIENCE "$AUDIENCE"

# PORTAL_URL is optional (D-041): without it the CMS names the Portal without linking it.
if [ -n "$PORTAL_URL" ]; then
  require_origin PORTAL_URL "$PORTAL_URL"
  PORTAL_LINE="  PORTAL_URL: \"$PORTAL_URL\","
else
  PORTAL_LINE=""
fi

cat > "$CONFIG_FILE" <<EOF
window.__UNICHE_CONFIG__ = {
  IDP_URL: "$IDP_URL",
  REALM: "$REALM",
  CLIENT_ID: "$CLIENT_ID",
  AUDIENCE: "$AUDIENCE",
  API_BASE_URL: "$API_BASE_URL",
$PORTAL_LINE
};
EOF

echo "[iguide] wrote $CONFIG_FILE: IDP_URL=$IDP_URL REALM=$REALM CLIENT_ID=$CLIENT_ID API_BASE_URL=$API_BASE_URL PORTAL_URL=${PORTAL_URL:-(none)}"
