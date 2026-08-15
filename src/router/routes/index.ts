import type { AppRouteRecordRaw, RouteFileModule } from "#src/router/types";

import { loginPath } from "#src/router/extra-info";
import { ascending } from "#src/router/utils/ascending";
import { mergeRouteModules } from "#src/router/utils/merge-route-modules";
import { traverseTreeValues } from "#src/utils/tree";
import { coreRoutes } from "./core";

// External route files
export const externalRouteFiles: RouteFileModule = import.meta.glob("./external/**/*.ts", { eager: true });
// Frontend static route files
export const staticRouteFiles: RouteFileModule = import.meta.glob("./static/**/*.ts", { eager: true });

/**
 * Backend dynamic route files
 */
export const dynamicRouteFiles: RouteFileModule = import.meta.glob("./modules/**/*.ts", { eager: true });

/**
 * External routes 1. No permission verification, 2. Will not trigger requests, such as user information interface
 * @example "privacy-policy", "terms-of-service" etc.
 */
export const externalRoutes: AppRouteRecordRaw[] = mergeRouteModules(externalRouteFiles);

/** Dynamic routes */
export const dynamicRoutes: AppRouteRecordRaw[] = mergeRouteModules(dynamicRouteFiles);

/** Static routes */
export const staticRoutes: AppRouteRecordRaw[] = mergeRouteModules(staticRouteFiles);

/**
 * Base route list, composed of core routes and external routes, always present in the system
 */
const baseRoutes = ascending([
	...coreRoutes,
	...externalRoutes,
]);

/** Access-controlled route list, includes dynamic routes and static routes */
const accessRoutes = [
	...dynamicRoutes,
	...staticRoutes,
];

/**
 * Route whitelist 1. No permission verification, 2. Will not trigger requests, such as user information interface
 * @example "privacy-policy", "terms-of-service" etc.
 */
const whiteRouteNames = [
	loginPath,
	...traverseTreeValues(externalRoutes, route => route.path),
];

export {
	accessRoutes,
	baseRoutes,
	whiteRouteNames,
};
