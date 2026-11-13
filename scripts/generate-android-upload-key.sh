#!/usr/bin/env bash
set -euo pipefail

KEYSTORE_FILE="${1:-android/app/upload-key.keystore}"
KEY_ALIAS="${2:-aaptha-upload}"

if [[ -e "$KEYSTORE_FILE" ]]; then
  printf 'Refusing to overwrite existing keystore: %s\n' "$KEYSTORE_FILE" >&2
  exit 1
fi

if ! command -v keytool >/dev/null 2>&1; then
  printf 'keytool was not found. Install a JDK and try again.\n' >&2
  exit 1
fi

mkdir -p "$(dirname "$KEYSTORE_FILE")"
keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias "$KEY_ALIAS" \
  -keystore "$KEYSTORE_FILE"

printf '\nGenerated keystore: %s\n' "$KEYSTORE_FILE"
printf 'Key alias: %s\n' "$KEY_ALIAS"
printf 'Copy this one-line value to the ANDROID_KEYSTORE_BASE64 GitHub secret:\n'
base64 < "$KEYSTORE_FILE" | tr -d '\n'
printf '\n\nDo not commit the keystore or expose its passwords/base64 value in logs.\n'
