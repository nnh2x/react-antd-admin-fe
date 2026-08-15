import type { AppRouteRecordRaw } from "#src/router/types";

import { filterTree } from "#src/utils/tree";

/**
 * Dynamically generate routes - frontend approach
 */
export function generateRoutesByFrontend(
	routes: AppRouteRecordRaw[],
	roles: string[],
) {
	// Filter the route table based on role identifiers to determine whether the current user has the specified permission
	const finalRoutes = filterTree(routes, (route) => {
		return hasAuthority(route, roles);
	});

	return finalRoutes;
}

/**
 * Determines whether the route is accessible with permission
 * @param route
 * @param accesses
 */
function hasAuthority(route: AppRouteRecordRaw, accesses: string[]) {
	const authority = route.handle?.roles;
	if (!authority) {
		return true;
	}
	return accesses.some(value => authority.includes(value));
}
