#!/usr/bin/env bash

set -euo pipefail

mkdir -p \
  "apps/web/src/app/(marketing)" \
  "apps/web/src/app/api/auth" \
  "apps/web/src/app/api/spotify" \
  "apps/web/src/app/api/dj" \
  "apps/web/src/app/api/session" \
  "apps/web/src/app/player" \
  "apps/web/src/app/chat" \
  "apps/web/src/app/session" \
  "apps/web/src/components/player" \
  "apps/web/src/components/chat" \
  "apps/web/src/components/queue" \
  "apps/web/src/components/vibe" \
  "apps/web/src/components/ui" \
  "apps/web/src/features/auth" \
  "apps/web/src/features/spotify" \
  "apps/web/src/features/dj" \
  "apps/web/src/features/queue" \
  "apps/web/src/features/session" \
  "apps/web/src/lib/api" \
  "apps/web/src/lib/env" \
  "apps/web/src/lib/logger" \
  "apps/web/src/lib/errors" \
  "apps/web/src/lib/utils" \
  "apps/web/src/styles" \
  "apps/web/src/types" \
  "apps/web/public" \
  "packages/config/eslint" \
  "packages/config/typescript" \
  "packages/shared/src/types" \
  "packages/shared/src/constants" \
  "packages/shared/src/schemas" \
  "packages/shared/src/utils" \
  "packages/spotify-client/src/auth" \
  "packages/spotify-client/src/player" \
  "packages/spotify-client/src/catalog" \
  "packages/spotify-client/src/queue" \
  "packages/spotify-client/src/types" \
  "packages/dj-engine/src/prompts" \
  "packages/dj-engine/src/parsers" \
  "packages/dj-engine/src/planners" \
  "packages/dj-engine/src/ranking" \
  "packages/dj-engine/src/memory" \
  "packages/dj-engine/src/types" \
  "packages/database/prisma" \
  "packages/database/src/repositories" \
  "packages/database/src/types" \
  "docs/architecture" \
  "docs/api" \
  "docs/product" \
  "docs/decisions"

touch \
  ".env.example" \
  "package.json" \
  "turbo.json" \
  "pnpm-workspace.yaml" \
  "apps/web/package.json" \
  "packages/database/src/client.ts"

echo "AI DJ project structure created successfully."