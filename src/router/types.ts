import type { ReactNode } from "react";
import type { IndexRouteObject, NonIndexRouteObject, createBrowserRouter as RemixRouter } from "react-router";

export interface IndexRouteMeta extends Omit<IndexRouteObject, "id"> {
	redirect?: string
	handle: RouteMeta
}
export interface NonIndexRouteMeta extends Omit<NonIndexRouteObject, "id"> {
	redirect?: string
	handle: RouteMeta
	children?: AppRouteRecordRaw[]
}

export type AppRouteRecordRaw = IndexRouteMeta | NonIndexRouteMeta;

export interface RouteMeta {
	/**
	 * Route title, usually used for the page title or sidebar menu display
	 */
	title: ReactNode

	/**
	 * Menu icon, used for the icon display of the sidebar menu item
	 */
	icon?: ReactNode

	/**
	 * Menu order, used to control the display order of the sidebar menu
	 */
	order?: number

	/**
	 * Used to configure page permissions; only users with the corresponding permission can access the page. If not configured, no permission is required.
	 */
	roles?: string[]

	/**
	 * Button-level permissions within the page, used to control the show/hide of buttons within the page
	 */
	permissions?: string[]

	/**
	 * Sets whether the page enables caching; once enabled, the page will be cached and not reloaded, only effective when tab pages are enabled.
	 * @default true
	 */
	keepAlive?: boolean

	/**
	 * Whether to hide in the menu, used to control certain routes not being shown in the sidebar menu
	 */
	hideInMenu?: boolean

	/**
	 * iframe link, used when the route needs to load an external page inside an iframe
	 */
	iframeLink?: string

	/**
	 * External link, opens directly in a new tab when clicked
	 */
	externalLink?: string

	/**
	 * Used to configure whether the page ignores permissions and can be accessed directly
	 */
	ignoreAccess?: boolean

	/**
	 * @description Specifies the currently active menu, applicable to highlighting the parent menu in dynamic route scenarios
	 * @example When navigating from the parent route '/user/info' to the child route '/user/info/1', you can manually specify this to highlight the parent menu '/user/info'
	 */
	currentActiveMenu?: string

	/**
	 * Indicates the current route was obtained by requesting the backend interface
	 */
	backstage?: boolean
}

export type ReactRouterType = ReturnType<typeof RemixRouter>;
export type RouterSubscriber = Parameters<ReactRouterType["subscribe"]>[0];
export type RouterState = ReactRouterType["state"];
export type RouterNavigate = ReactRouterType["navigate"];

// Use type alias to extract common type
export type RouteFileModule = Record<string, { default: AppRouteRecordRaw[] }>;
