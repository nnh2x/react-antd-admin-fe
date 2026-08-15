# Router

This project uses React Router. Although the latest V7 version is used, it's recommended to read the V6 docs - https://reactrouter.com/en/6.28.1/ , both docs are pretty rough.

## Router directory

```bash
├── router
│   ├── constants.ts                      # Route whitelist
│   ├── extra-info                        # Extra route information
│   │   ├── index.ts
│   │   ├── route-path.ts                 # Route paths, used for route navigation, centralized in one place for easier maintenance
│   │   └── order.ts                      # Route menu order
│   ├── guards.tsx                        # Route guards
│   ├── router-global-hooks.ts            # Route global hooks
│   ├── routes
│   │   ├── core                          # Core routes
│   │   ├── modules                       # Dynamic routes
│   │   └── static                        # Static routes
│   ├── types.ts                          # Route type definitions
│   └── utils.ts                          # Route utility functions
```

## Router components

Only listing the ones commonly used in the project:

| Component name | Purpose             | Description                  |
|-----------------|--------------------|-------------------------------|
| `<Link>`        | Navigation component | Used for page navigation   |
| `<Outlet/>`     | Render container component | Used to render nested routes. |

## Hooks

### useMatches

Returns all route objects matched by the current route

```ts
import { useMatches } from "react-router";

const matches = useMatches();
console.log(matches);
// Output: [{ pathname: '/path', params: {}, data: {} }, ...]
```

Based on `useMatches()`, the project wraps a `useCurrentRoute` hook, which can be used to get the latest current route information.

### useParams

Returns the params of the dynamic route

```ts
import { useParams } from "react-router";

const { id: templateId } = useParams<{ id: string }>();
```

### useNavigate

Route navigation

```ts
import { useNavigate } from "react-router";

const navigate = useNavigate();
navigate("/path");
```

### useLocation

Returns the current location object

```ts
import { useLocation } from "react-router";

const location = useLocation();
console.log(location);
// Output: { pathname: '/path', search: '?x=1&y=2', hash: '', state: null, key: 'default' }
```

### useSearchParams

Matches route Query parameters (query parameters)

```ts
import { useSearchParams } from "react-router";

const [searchParams] = useSearchParams();
console.log(searchParams.get("x")); // Output the value of x
```

> It's recommended to use [nuqs](https://nuqs.47ng.com/) instead of useSearchParams for business development. [nuqs](https://nuqs.47ng.com/) lets you manage **query parameters** as concisely as using useState.

```ts
import { useQueryState } from "nuqs";

const [hello, setHello] = useQueryState("hello", { defaultValue: "" });
```

### useOutlet

Returns the element generated based on the route

```ts
import { useOutlet } from "react-router";

const outlet = useOutlet();
console.log(outlet); // Output: <div>...</div>
```

Route caching is implemented using this API.

## Route guards and route hooks

Route guards and route hooks are defined in `src/router/guard`.

- `auth-guard.tsx` route guard, used for permission verification
- `common-gurard.ts` no permission verification logic, supports loading animation and other interception features
