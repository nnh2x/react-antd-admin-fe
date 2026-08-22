---
name: clean-architecture
description: Layering convention (domain / application / infrastructure / presentation) for this codebase. Use when adding a new data-backed module/page, or touching how a page fetches/mutates data.
---

# Clean Architecture layering for react-antd-admin-fe

This repo separates every data-backed feature into four layers. One rule
governs all of it:

```
presentation  →  application  →  domain  ←  infrastructure
```

`domain` never imports from any other layer. Everything else points inward
toward it (directly or via the type it defines).

## The four layers

| Layer | Folder | Contains | May import |
|---|---|---|---|
| **Domain** | `src/domain/<module>/<name>/` | Entity types (`<name>.entity.ts`) and a repository **interface** (`<name>.repository.ts`) describing the operations the feature needs (`list`, `create`, `update`, `remove`, plus any custom query) | nothing project-specific |
| **Infrastructure** | `src/infrastructure/<module>/<name>/` | One object implementing the domain repository interface, using `#src/utils/request` (the shared `ky` client) | domain (implements its interface) |
| **Application** | `src/application/<module>/<name>/` | Use-case hooks/functions: `useCreateX`/`useUpdateX`/`useDeleteX` (`useMutation` wrapping a repository method), `useXQuery` (`useQuery`), or a plain async function when the caller isn't react-query (e.g. `BasicTable`'s `request` prop). This is the **only** layer that calls `useQuery`/`useMutation` | domain (types) + the bound infrastructure repository |
| **Presentation** | `src/pages/<module>/<name>/` (route location, unchanged) | Page component, `constants.tsx` (table/form column defs), drawer/detail components | application (hooks) + domain (types) — **never** infrastructure or `#src/utils/request` directly |

`<module>/<name>` mirrors the page's route path, e.g. `system/role` →
`src/domain/system/role/`, `src/application/system/role/`,
`src/infrastructure/system/role/`, `src/pages/system/role/` (unchanged, so
`src/router/**`'s `lazy(() => import(...))` calls never need to change).

Each layer folder has a barrel `index.ts` re-exporting its public surface, so
call sites import one path: `#src/domain/system/role`,
`#src/application/system/role`, `#src/infrastructure/system/role`.

## Worked example: `system/role`

Read these four files together as the canonical reference:

- `src/domain/system/role/role.entity.ts` — `RoleItemType`
- `src/domain/system/role/role.repository.ts` — `interface RoleRepository { list, create, update, remove, getMenuTree, getMenuIdsByRoleId }`
- `src/infrastructure/system/role/role.repository.ts` — `export const roleRepository: RoleRepository = { list: data => request.get<ApiListResponse<RoleItemType>>("role-list", { searchParams: data, ignoreLoading: true }).json(), ... }`
- `src/application/system/role/list-roles.ts`, `use-role-mutations.ts`, `use-role-menu-tree.ts` — the hooks/functions the page calls
- `src/pages/system/role/index.tsx`, `constants.tsx`, `components/detail.tsx` — consume only `#src/application/system/role` and `#src/domain/system/role`

## Response envelope

Repository methods keep returning the app's existing global envelope types —
`ApiResponse<T>` / `ApiListResponse<T>` (declared ambient in
`src/types/index.d.ts`, no import needed). Don't invent an unwrapped domain
shape; presentation code already knows how to read `.result`/`.success`, and
re-plumbing that everywhere isn't worth it.

## Mock repositories (no backend yet)

Some flows have no real endpoint yet and are faked in the UI (e.g. a
`setTimeout` + success toast). Don't leave that logic inline in a component —
move it into the infrastructure repository method behind the same interface
as the real methods, commented:

```ts
// TODO: replace mock with real endpoint once backend is ready
sendLoginCode: () => new Promise<ApiResponse<null>>(resolve => setTimeout(() => resolve({ code: 0, success: true, message: "", result: null }), 800)),
```

The domain interface and the application hook calling it look identical
whether the method is real or mocked — swapping in the real backend later is
a one-file change (the infrastructure method body), not a hunt through
components. See `src/infrastructure/user/user.repository.ts` for the pattern
(`sendLoginCode`, `forgotPassword`, `register`, `updateProfile`).

## When NOT to add a layer

If a page has no I/O boundary at all — pure static content, a local counter,
a store-only read with no mutation — don't fabricate domain/application/
infrastructure folders for it. That's not cleanup, it's ceremony. Leave it as
a plain presentation component. (Examples in this repo: `system/dept`,
`about`, `personal-center/settings`, the exception pages.)

## Adding a new CRUD module

Prefer the generator — it emits all four layers already wired to this
convention, plus a router module (glob-loaded, no manual registration) and
`vi-VN`/`en-US` locale namespaces, so the page is reachable from the menu in
both languages as soon as the command finishes:

```
yarn generate:crud <name> --module=<module> --title="<title>" --title-en="<title>"   # quick: code/name/description fields
yarn generate:crud --config path/to/config.json                                       # full control over fields
yarn generate:crud                                                                     # interactive, asks per field
```

See `scripts/crud-generator/README.md` for the config shape. If you're adding
a module by hand instead, copy the `system/role` shape file-by-file:

1. `src/domain/<module>/<name>/<name>.entity.ts` + `.repository.ts` (+ barrel `index.ts`)
2. `src/infrastructure/<module>/<name>/<name>.repository.ts` (+ barrel)
3. `src/application/<module>/<name>/` — one file per use-case (+ barrel)
4. `src/pages/<module>/<name>/` — page + `constants.tsx` + `components/` — import only from `#src/application/...` and `#src/domain/...`
5. Wire the route in `src/router/routes/**` as usual (unchanged from before)
