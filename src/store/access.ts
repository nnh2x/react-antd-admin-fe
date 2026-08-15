import type { MenuItemType } from "#src/layout/layout-menu/types";
import type { AppRouteRecordRaw } from "#src/router/types";

import { create } from "zustand";
import { rootRoute, router } from "#src/router";
import { ROOT_ROUTE_ID } from "#src/router/constants";
import { baseRoutes } from "#src/router/routes";
import { ascending } from "#src/router/utils/ascending";
import { flattenRoutes } from "#src/router/utils/flatten-routes";

import { generateMenuItemsFromRoutes } from "#src/router/utils/generate-menu-items-from-routes";

interface AccessState {
	// Route menus
	wholeMenus: MenuItemType[]
	// Authorized React Router routes
	routeList: AppRouteRecordRaw[]
	// Flattened routes, with route id as the index key
	flatRouteList: Record<string, AppRouteRecordRaw>
	// Whether access permissions have been fetched
	isAccessChecked: boolean
}

const initialState: AccessState = {
	wholeMenus: generateMenuItemsFromRoutes(baseRoutes),
	routeList: baseRoutes,
	flatRouteList: flattenRoutes(baseRoutes),
	isAccessChecked: false,
};

interface AccessAction {
	setAccessStore: (routes: AppRouteRecordRaw[]) => AccessState
	reset: () => void
};

export const useAccessStore = create<AccessState & AccessAction>(set => ({
	...initialState,

	setAccessStore: (routes) => {
		const newRoutes = ascending([...baseRoutes, ...routes]);
		/* Add the new routes to the root route */
		router.patchRoutes(ROOT_ROUTE_ID, routes);
		const flatRouteList = flattenRoutes(newRoutes);
		const wholeMenus = generateMenuItemsFromRoutes(newRoutes);
		const newState = {
			wholeMenus,
			routeList: newRoutes,
			flatRouteList,
			isAccessChecked: true,
		};
		set(() => newState);
		return newState;
	},

	reset: () => {
		/* Remove dynamic routes */
		router._internalSetRoutes(rootRoute);
		set(initialState);
	},
}));
