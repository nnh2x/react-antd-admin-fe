import type { AppRouteRecordRaw } from "#src/router/types";

/**
 * Flattens routes into an object, keyed by the route's path, with the route object as the value
 */

export function flattenRoutes(routes: AppRouteRecordRaw[]) {
	const result: Record<string, AppRouteRecordRaw> = {};

	function traverse(items: AppRouteRecordRaw[], parent?: AppRouteRecordRaw) {
		items.forEach((item) => {
			if (item.index && parent?.path) {
				result[`${parent.path}/`] = item;
			}
			if (item.path) {
				result[item.path] = item;
			}
			if (item.children && item.children.length > 0) {
				traverse(item.children, item);
			}
		});
	}

	traverse(routes);
	return result;
}
