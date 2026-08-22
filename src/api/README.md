## Overview of the `api` directory

Implemented modules no longer live here — see
[`.claude/skills/clean-architecture/SKILL.md`](../../.claude/skills/clean-architecture/SKILL.md)
for the current convention. A module's request/repository code now lives in
`src/domain/<module>/<name>/`, `src/infrastructure/<module>/<name>/`, and
`src/application/<module>/<name>/`; `src/pages/<module>/<name>/` holds the UI
and only imports from `#src/domain/...` / `#src/application/...`.

`src/api/**` is kept only for pages that don't have a real backend wired up
yet (currently empty placeholder directories: `catalog/product`,
`audit-log`, `master-data/order-report`, `master-data/stock-item`). When one
of those gets implemented, follow the skill instead of this old pattern.

`request.ts` (the underlying HTTP client) is unchanged — it's a wrapper
around [Ky](https://github.com/sindresorhus/ky), still at
[`src/utils/request`](https://github.com/condorheroblog/react-antd-admin/tree/main/src/utils/request),
and infrastructure repositories import it the same way the old `api/**`
files did.
