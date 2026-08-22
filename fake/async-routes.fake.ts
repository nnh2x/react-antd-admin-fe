import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { home, system } from "#/src/router/extra-info";
import { resultSuccess } from "./utils";

const systemManagementRouter = {
	path: "/system",
	handle: {
		icon: "SettingOutlined",
		title: "common.menu.system",
		order: system,
		roles: ["admin"],
	},
	children: [
		{
			path: "/system/role",
			component: "/system/role/index.tsx",
			handle: {
				icon: "TeamOutlined",
				title: "common.menu.role",
				roles: ["admin"],
				permissions: [
					"permission:button:add",
					"permission:button:update",
					"permission:button:delete",
				],
			},
		},
	],
};

const homeRouter = {
	path: "/home",
	component: "/home/index.tsx",
	handle: {
		icon: "HomeOutlined",
		title: "common.menu.home",
		order: home,
	},
};

export default defineFakeRoute([
	{
		url: "/get-async-routes",
		timeout: 1000,
		method: "get",
		response: () => {
			return resultSuccess(
				[
					homeRouter,
					systemManagementRouter,
				],
			);
		},
	},
]);
