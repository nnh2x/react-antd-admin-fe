import { defineFakeRoute } from "vite-plugin-fake-server/client";

import { system } from "#/src/router/extra-info";
import { resultSuccess } from "./utils";

const systemMenu = [
	// System management
	{
		id: system,
		menuType: 0, // Menu type (0 = menu, 1 = iframe, 2 = external link, 3 = button)
		name: "common.menu.system",
	},
	{
		parentId: system,
		id: system + 2,
		menuType: 0,
		name: "common.menu.role",
	},
];

export default defineFakeRoute([
	// Role management
	{
		url: "/role-list",
		method: "get",
		response: ({ body }) => {
			let list = [
				{
					createTime: 1729752330782, // Timestamp (ms)
					updateTime: 1729752330782,
					id: 1,
					name: "Super Administrator",
					code: "admin",
					status: 1, // Status: 1 enabled, 0 disabled
					remark: "Super administrator has the highest privileges",
				},
				{
					createTime: 1729752330782,
					updateTime: 1729752330782,
					id: 2,
					name: "Regular Role",
					code: "common",
					status: 1,
					remark: "Regular role has partial privileges",
				},
			];
			// list = Array.from({ length: 10000 }).flatMap(() => list);
			list = list.filter(item =>
				item.name.includes(body?.name ?? "")
				&& String(item.status).includes(String(body?.status ?? ""))
				&& (!body?.code || item.code === body?.code),
			);
			return resultSuccess({
				list,
				total: list.length, // Total number of items
				pageSize: 10, // Number of items per page
				current: 1, // Current page number
			});
		},
	},
	// Role management - add role
	{
		url: "/role-item",
		method: "post",
		response: ({ body }) => {
			return resultSuccess(body);
		},
	},
	// Role management - update role
	{
		url: "/role-item",
		method: "put",
		response: ({ body }) => {
			return resultSuccess(body);
		},
	},
	// Role management - delete role
	{
		url: "/role-item",
		method: "delete",
		response: ({ body }) => {
			return resultSuccess(body);
		},
	},
	// Role management - permissions - menu permissions
	{
		url: "/role-menu",
		method: "get",
		response: () => {
			return resultSuccess(systemMenu);
		},
	},
	// Role management - permissions - menu permissions, look up the menu for a given role id
	{
		url: "/menu-by-role-id",
		method: "get",
		response: ({ query }) => {
			if (query.id === "1") {
				return resultSuccess(systemMenu.map(item => item.id));
			}
			else if (query.id === "2") {
				return resultSuccess([]);
			}
			return resultSuccess([]);
		},
	},
]);
