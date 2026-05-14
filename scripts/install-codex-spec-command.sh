#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="${ROOT_DIR}/codex/slash-commands/agentic-spec"
TARGET_ROOT="${CODEX_USER_SKILLS_DIR:-${HOME}/.agents/skills}"
TARGET_DIR="${TARGET_ROOT}/agentic-spec"
LEGACY_TARGET_DIR="${TARGET_ROOT}/specdrive"
FORCE=0
DRY_RUN=0

usage() {
  cat <<'USAGE'
Usage: bash scripts/install-codex-spec-command.sh [--force] [--dry-run] [--target <skills-dir>]

Installs the Agentic Spec command-style skill into Codex's user skill path.

Defaults:
  source: codex/slash-commands/agentic-spec
  target: $HOME/.agents/skills/agentic-spec

Environment:
  CODEX_USER_SKILLS_DIR  Override the target skills directory.
USAGE
}

remove_legacy_specdrive() {
  if [[ ! -f "${LEGACY_TARGET_DIR}/SKILL.md" ]]; then
    return
  fi

  if grep -q '^name: specdrive$' "${LEGACY_TARGET_DIR}/SKILL.md" \
    && grep -q '^# SpecDrive Command$' "${LEGACY_TARGET_DIR}/SKILL.md"; then
    rm -rf "${LEGACY_TARGET_DIR}"
    echo "Removed legacy command skill: ${LEGACY_TARGET_DIR}"
  else
    echo "Legacy target exists but was not removed because it does not match the generated specdrive command skill: ${LEGACY_TARGET_DIR}" >&2
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force)
      FORCE=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --target)
      if [[ $# -lt 2 || -z "$2" ]]; then
        echo "--target requires a directory" >&2
        exit 2
      fi
      TARGET_ROOT="$2"
      TARGET_DIR="${TARGET_ROOT}/agentic-spec"
      LEGACY_TARGET_DIR="${TARGET_ROOT}/specdrive"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ ! -f "${SOURCE_DIR}/SKILL.md" ]]; then
  echo "Missing source skill: ${SOURCE_DIR}/SKILL.md" >&2
  exit 1
fi

if [[ "${DRY_RUN}" -eq 1 ]]; then
  echo "Would install Agentic Spec command skill:"
  echo "  source: ${SOURCE_DIR}"
  echo "  target: ${TARGET_DIR}"
  if [[ -e "${LEGACY_TARGET_DIR}" ]]; then
    echo "  legacy: would remove generated specdrive command if it matches ${LEGACY_TARGET_DIR}"
  fi
  exit 0
fi

mkdir -p "${TARGET_ROOT}"

if [[ -e "${TARGET_DIR}" ]]; then
  if diff -qr "${SOURCE_DIR}" "${TARGET_DIR}" >/dev/null 2>&1; then
    remove_legacy_specdrive
    echo "Agentic Spec command skill is already installed at ${TARGET_DIR}"
    echo "Restart Codex, then invoke it with: \$agentic-spec <request>"
    exit 0
  fi

  if [[ "${FORCE}" -ne 1 ]]; then
    echo "Target already exists and differs: ${TARGET_DIR}" >&2
    echo "Re-run with --force to replace only this skill directory." >&2
    exit 1
  fi

  rm -rf "${TARGET_DIR}"
fi

mkdir -p "${TARGET_DIR}"
cp -R "${SOURCE_DIR}/." "${TARGET_DIR}/"
remove_legacy_specdrive

echo "Installed Agentic Spec command skill:"
echo "  ${TARGET_DIR}"
echo
echo "Restart Codex, then invoke it with: \$agentic-spec <request>"
echo "You can also type /skills and choose Agentic Spec."
