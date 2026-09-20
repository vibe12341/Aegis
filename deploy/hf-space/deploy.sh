#!/usr/bin/env bash
# Deploy Aegis to a Hugging Face Space (Docker SDK, free CPU tier).
#
# Prereqs:
#   1. The Space must already exist on huggingface.co with SDK = Docker
#      (create it at https://huggingface.co/new-space — pick "Docker", blank template).
#   2. You are authenticated for git pushes to huggingface.co — either
#      `huggingface-cli login` or a stored git credential works.
#
# Usage:  bash deploy/hf-space/deploy.sh <hf-username> [space-name]
set -euo pipefail

HF_USER="${1:?usage: deploy.sh <hf-username> [space-name]}"
SPACE="${2:-aegis}"
STAGING="$(mktemp -d)"

# 1. Assemble the Space repo from tracked files (git archive skips
#    node_modules/dist/.modelcache automatically) + Docker config.
git archive HEAD | tar -x -C "$STAGING"
cp deploy/hf-space/Dockerfile deploy/hf-space/.dockerignore "$STAGING/"
cp deploy/hf-space/README.space.md "$STAGING/README.md"
rm -rf "$STAGING/deploy" "$STAGING/examples"

# 2. Push to the Space (build starts automatically).
cd "$STAGING"
git init -q
git add -A
git commit -qm "Deploy Aegis to HF Space"
git remote add space "https://huggingface.co/spaces/$HF_USER/$SPACE"
git push -f space main

echo
echo "Done — watch the build at:"
echo "  https://huggingface.co/spaces/$HF_USER/$SPACE"
