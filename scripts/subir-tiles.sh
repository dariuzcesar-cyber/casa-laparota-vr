#!/usr/bin/env bash
# Sube los tiles de un tour a Cloudflare R2.
#   Uso:  scripts/subir-tiles.sh septiembre-2026
#
# Requiere rclone (brew install rclone) y estas variables en TU terminal
# (nunca en el repo ni en el chat):
#   export R2_ACCESS_KEY_ID="..."
#   export R2_SECRET_ACCESS_KEY="..."
set -euo pipefail

MES="${1:?Falta el mes. Ej: scripts/subir-tiles.sh septiembre-2026}"
BUCKET="casa-la-parota-tiles"
ACCOUNT_ID="57350b337d100d70f6c38f9afec6bb0b"
ORIGEN="$(cd "$(dirname "$0")/.." && pwd)/tours/${MES}/tiles"

: "${R2_ACCESS_KEY_ID:?Define R2_ACCESS_KEY_ID}"
: "${R2_SECRET_ACCESS_KEY:?Define R2_SECRET_ACCESS_KEY}"
[ -d "$ORIGEN" ] || { echo "No existe $ORIGEN"; exit 1; }

# Remoto de rclone definido por variables de entorno (sin archivo de config)
export RCLONE_CONFIG_R2_TYPE=s3
export RCLONE_CONFIG_R2_PROVIDER=Cloudflare
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export RCLONE_CONFIG_R2_ENDPOINT="https://${ACCOUNT_ID}.r2.cloudflarestorage.com"
export RCLONE_CONFIG_R2_ACL=private
export RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true

# Destino: <bucket>/<mes>/<escena>/...  (coincide con urlPrefix en index.js)
# Se sube a la RAÍZ del bucket desde una carpeta temporal con un enlace
# llamado <mes>: con rutas dentro del bucket, rclone+R2 falla con
# "is a file not a directory".
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
ln -s "$ORIGEN" "$TMP/${MES}"

rclone copy "$TMP" "R2:${BUCKET}" --copy-links \
  --transfers 32 --checkers 32 --progress \
  --header-upload "Cache-Control: public, max-age=31536000, immutable"

echo "Listo. Prueba: https://tiles.dariuzph.com/${MES}/0-frente/preview.jpg"
