#!/usr/bin/env bash
# Manual smoke test checklist for Mahfuz
# Run after each release to verify critical flows.
#
# Usage: bash scripts/smoke-test.sh
# Opens the dev server and prints a checklist to follow.

set -euo pipefail

echo "=== Mahfuz Smoke Test Checklist ==="
echo ""
echo "Start the dev server: npx pnpm@9 dev"
echo "Open: http://localhost:3000"
echo ""
echo "--- Search ---"
echo "[ ] Type '33:35' in search → verse result appears"
echo "[ ] Type 'Fatiha' in search → surah result appears"
echo "[ ] Click result → navigates to correct page"
echo ""
echo "--- Language Toggle ---"
echo "[ ] Go to Settings → switch to English"
echo "[ ] Navigation labels show in English (Browse, Listen, Memorize)"
echo "[ ] PWA install prompt (if shown) is in English"
echo "[ ] Switch back to Turkish → labels restore"
echo ""
echo "--- Settings ---"
echo "[ ] Change theme → 'Saved' toast appears and disappears within 3s"
echo "[ ] Change font → 'Saved' toast appears and disappears within 3s"
echo "[ ] Change color palette → 'Saved' toast appears and disappears within 3s"
echo ""
echo "--- Cache Keys ---"
echo "[ ] Navigate to a surah → header shows correct surah name"
echo "[ ] Open Command Palette (Cmd+K) → surah list loads from cache"
echo "[ ] Navigate between surahs → no stale data shown"
echo ""
echo "--- Build ---"
echo "[ ] npx pnpm@9 build passes clean"
echo "[ ] bash scripts/audit.sh reports 0 violations"
echo ""
echo "=== End of checklist ==="
