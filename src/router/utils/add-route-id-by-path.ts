import type { AppRouteRecordRaw } from "#src/router/types";

/**
 * Adds a unique ID to a route object, replacing the auto-generated route id. The ID defaults to the route's path
 * {
 *   path: '/dashboard',
 * }
 *
 * After transformation
 *
 * {
 *   path: '/dashboard',
 *   id: '/dashboard',
 * }
 */
export function addRouteIdByPath(routes: AppRouteRecordRaw[], parentId = "") {
	return routes.map((route) => {
		// If it's an index route, the id is the parent path + "/"
		const newRoute = { ...route, id: route.index ? `${parentId}/` : route.path };

		if (newRoute.children && newRoute.children.length > 0) {
			newRoute.children = addRouteIdByPath(newRoute.children, route.path);
		}

		return newRoute;
	});
}
