# Approval Page: Display Group Info & Model List

**Date:** 2026-05-26
**Branch:** zjnx-approval-info

## Context

The API Key approval review page (`api-keys-review-table.tsx`) currently shows: Applicant, Name, System, Team, Models (count only), Created, Status, Actions. Two pieces of information are missing:

1. **Group** — the token's `group` field is not displayed at all
2. **Model list** — only the count is shown (e.g. "3 model(s)"), not the actual model names

## Design

### 1. Add "Group" Column

Insert a new column between "Team" and "Models" that displays `key.group`. Show `-` when the group is empty.

### 2. Models Column with Tooltip

Keep the Models cell showing the count (`N model(s)` or `All`), but add a Tooltip on hover that lists the actual model names (one per line, parsed from comma-separated `model_limits`). When `model_limits` is empty, show `All` with no tooltip.

Use the existing `@base-ui/react/tooltip` component (already in `components/ui/tooltip.tsx`).

### i18n

The `'Group'` translation key already exists in zh.json and en.json — no new entries needed.

## Files Changed

- `web/default/src/features/keys/components/api-keys-review-table.tsx` — add Group column, wrap Models cell with Tooltip
