import type { AppRouteRecordRaw } from "#src/router/types";

/** Sort routes in ascending order based on the order field in the route */
export function ascending(arr: AppRouteRecordRaw[]) {
	return arr.map((routeItem, routeIndex) => ({
		...routeItem,
		handle: {
			...routeItem.handle,
			// When order does not exist, create it automatically based on the sequence
			order: routeItem?.handle?.order || routeIndex + 2,
		},
	})).sort(
		(a, b) => {
			return a?.handle?.order - b?.handle?.order;
		},
	);
}
