import type { AppRouteRecordRaw } from "#src/router/types";
import { lazy } from "react";
import { Outlet } from "react-router";
import { Iframe } from "#src/components/iframe";
import ContainerLayout from "#src/layout/container-layout";
import { addRouteIdByPath } from "./add-route-id-by-path";

const ExceptionUnknownComponent = lazy(() => import("#src/pages/exception/unknown-component"));

/**
 * Async load page components
 */
const pageModules = import.meta.glob([
	"/src/pages/**/*.tsx",
	// Exclude exception pages from lazy loading
	"!/src/pages/exception/**/*.tsx",
]);

/**
 * Get component path based on route
 */
export function getComponentPathByRoute(route: AppRouteRecordRaw & { component?: string }) {
	if (route.component) {
		return `/src/pages${route.component}`;
	}
	else {
		return `/src/pages${route.path}/index.tsx`;
	}
}

/**
 * Generate frontend routes based on backend route configurations
 */
export async function generateRoutesFromBackend(backendRoutes: Array<AppRouteRecordRaw>) {
	const pageModulePaths = Object.keys(pageModules);
	if (!backendRoutes?.length)
		return [];

	/**
	 * Dynamically load and set route components
	 * @param route Route configuration object
	 * @param componentPath Component file path
	 */
	const loadRouteComponent = async (route: AppRouteRecordRaw, componentPath: string) => {
		const modulePath = componentPath;
		const moduleIndex = pageModulePaths.findIndex(path => path === modulePath);

		if (moduleIndex !== -1) {
			const lazyComponent = pageModules[pageModulePaths[moduleIndex]];
			route.Component = lazy(lazyComponent as any);
		}
		else {
			console.warn(`[Frontend component not found]: ${componentPath}`);
			route.Component = ExceptionUnknownComponent;
		}
	};

	/**
	 * Transform route configuration
	 * @param route Original route configuration
	 * @param parentPath Parent path (used for nested routes)
	 * @returns Transformed route configuration
	 */
	const transformRoute = async (route: AppRouteRecordRaw, parentComponentPath?: string): Promise<AppRouteRecordRaw> => {
		const transformedRoute: AppRouteRecordRaw = {
			...route,
			handle: {
				...route.handle,
				backstage: true,
			},
		};

		// Handle index route (inherits parent path)
		if (transformedRoute.index === true && parentComponentPath) {
			await loadRouteComponent(transformedRoute, parentComponentPath);
		}
		// Handle iframe route
		else if (transformedRoute.handle?.iframeLink) {
			transformedRoute.Component = Iframe;
		}
		// Handle external link route
		else if (transformedRoute.handle?.externalLink) {
			// External links don't need a component
		}
		// Handle case with child routes
		else if (transformedRoute.children?.length) {
			transformedRoute.Component = parentComponentPath ? Outlet : ContainerLayout;
		}
		// Handle regular route
		else {
			await loadRouteComponent(transformedRoute, getComponentPathByRoute(transformedRoute));
		}

		// Recursively process child routes
		if (transformedRoute.children?.length) {
			transformedRoute.children = await Promise.all(
				transformedRoute.children.map(child =>
					transformRoute(child, getComponentPathByRoute(transformedRoute)),
				),
			);
		}

		return transformedRoute;
	};

	/**
	 * Normalize route configuration, ensuring each route has child routes
	 */
	const normalizeRouteStructure = (route: AppRouteRecordRaw): AppRouteRecordRaw => {
		if (!route.children?.length) {
			return {
				...route,
				children: [{
					index: true,
					handle: { ...route.handle },
				}],
			} as AppRouteRecordRaw;
		}
		return route;
	};

	// Process route configuration
	const normalizedRoutes = backendRoutes.map(normalizeRouteStructure);
	const transformedRoutes = await Promise.all(
		normalizedRoutes.map(route => transformRoute(route)),
	);

	return addRouteIdByPath(transformedRoutes);
}
