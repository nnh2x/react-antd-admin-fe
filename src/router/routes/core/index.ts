import type { RouteObject } from "react-router";

import { addRouteIdByPath } from "#src/router/utils/add-route-id-by-path";

import authRoutes from "./auth";
import exceptionRoutes from "./exception";
import fallbackRoute from "./fallback";

/** Core routes */
export const coreRoutes: any = [
	...addRouteIdByPath([...authRoutes, ...exceptionRoutes]),
	...fallbackRoute,
] satisfies RouteObject[];
