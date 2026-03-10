## Summary

<!-- Brief description of changes -->

## Quality Checklist

- [ ] New UI components use `useTranslation()` (no hardcoded strings)
- [ ] New locale keys added to both `tr.ts` and `en.ts`
- [ ] Cache keys use `QUERY_KEYS` constants from `lib/query-keys.ts`
- [ ] UI state (toast/modal/prompt) has proper show/hide lifecycle
- [ ] `bash scripts/audit.sh` reports zero violations
- [ ] `npx pnpm@9 build` passes clean

## Test Plan

<!-- How was this tested? -->
