## Fake Directory Overview

Mocks backend data, mainly for use during frontend development and debugging.

| File                   | Description                        |
|------------------------|-------------------------------------|
| `utils.ts`             | Response utility functions          |
| `auth.fake.ts`         | Auth endpoints (login, logout, etc.) |
| `user.fake.ts`         | User info endpoints                 |
| `async-routes.fake.ts` | Dynamic route endpoints             |
| `constants.ts`         | Constant data                       |
| ...                    | ...                                  |

## Fake File Convention

A typical fake file looks like this:

> File name: `auth.fake.ts` — the middle segment (`.fake.`) of the file name is required.

```ts
import { defineFakeRoute } from "vite-plugin-fake-server/client";

import { resultSuccess } from "./utils";

export default defineFakeRoute([
	{
		url: "/logout",
		timeout: 1000,
		method: "post",
		response: () => resultSuccess({}),
	},
]);
```

## Recommendations for Using Fake in the Project

It's recommended to create one fake file per page, with the file name matching the page name.
