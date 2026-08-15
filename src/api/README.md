## Overview of the api Directory

> The `api` directory holds all request interface files, organized into directories by page — one directory per page. Directories can be nested, but each directory must contain both a request interface file and a type definition file.

Below is a typical directory structure [`src/api/user`](https://github.com/condorheroblog/react-antd-admin/tree/main/src/api/user):

```zsh
├── api
│   └── user                  # User page, api organized by page
│       ├── index.ts          # Request interface file
│       └── types.ts          # Type definition file
```

If a page has sub-pages, you can continue nesting directories, for example: [`src/api/system`](https://github.com/condorheroblog/react-antd-admin/tree/main/src/api/system).

## File Description

### Type Definition File

Type names generally start with the corresponding page name and end with `Type`, for example:

```ts
export interface RoleItemType {
	id: number
	createTime: number
	updateTime: number
	name: string
	code: string
	status: 1 | 0
	remark: string
}
```

### Request Interface File

A typical request interface file looks like this:

> Requests make full use of HTTP methods such as `request.get`, `request.post`, etc. The loading animation can be skipped via the `ignoreLoading` parameter.

Special notes:

1. Parameters for GET requests go in the `searchParams` object; parameters for POST, PUT, etc. go in the `json` object.
2. Request paths must not start with `/`.

```ts
import type { RoleItemType } from "./types";
import { request } from "#src/utils/request";

export * from "./types";

/* Get the role list */
export function fetchRoleList(data: any) {
	return request.get<ApiListResponse<RoleItemType>>("role-list", { searchParams: data, ignoreLoading: true }).json();
}

/* Add a role */
export function fetchAddRoleItem(data: RoleItemType) {
	return request.post<ApiResponse<string>>("role-item", { json: data, ignoreLoading: true }).json();
}

/* Update a role */
export function fetchUpdateRoleItem(data: RoleItemType) {
	return request.put<ApiResponse<string>>("role-item", { json: data, ignoreLoading: true }).json();
}

/* Delete a role */
export function fetchDeleteRoleItem(id: number) {
	return request.delete<ApiResponse<string>>("role-item", { json: id, ignoreLoading: true }).json();
}
```

## `request.ts` Overview

`request.ts` is a request library wrapping [Ky](https://github.com/sindresorhus/ky) — see the implementation at [`src/utils/request`](https://github.com/condorheroblog/react-antd-admin/tree/main/src/utils/request).
