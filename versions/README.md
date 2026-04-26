# Version & Changelog

This folder holds release notes for CareNova. Each file is shown in **Settings → Version** and in the full changelog dialog.

## File naming

- One file per version: `vX.Y.Z.md` (e.g. `v1.0.0.md`, `v1.1.0.md`).
- Versions are sorted by semver (newest first). The latest file is shown as “Current version” on the Version tab.

## File format

Optional YAML frontmatter for **date**, then markdown body for the changelog:

```markdown
---
date: 2025-02-28
---
- Dashboard: batched admin queries for faster load.
- Settings: new Version & Changelog tab.
- Fix: currency options updated.
```

- **date** (optional): Release date in `YYYY-MM-DD`. Used for “Release date” and sorting.
- **Body**: Any markdown (lists, headings, links). The first 5 non-empty lines are used as the “Recent updates” preview; the full body is shown in “View full changelog”.

## Adding a new release

1. Add a new file `vX.Y.Z.md` in this folder.
2. Set `date` in frontmatter and write the changelog in the body.
3. The new version will appear automatically on the next load (no code changes needed).
