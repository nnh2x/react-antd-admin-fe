import { useEffect } from "react";
import { matchRoutes, Navigate, useLocation, useNavigate, useSearchParams } from "react-router";
import { fetchAsyncRoutes } from "#src/api/user";
import { useCurrentRoute } from "#src/hooks/use-current-route";
import { hideLoading } from "#src/plugins/hide-loading";
import { setupLoading } from "#src/plugins/loading";
import { exception403Path, exception404Path, exception500Path, loginPath } from "#src/router/extra-info";
import { accessRoutes, whiteRouteNames } from "#src/router/routes";
import { isSendRoutingRequest } from "#src/router/routes/config";
import { generateRoutesFromBackend } from "#src/router/utils/generate-routes-from-backend";
import { generateRoutesByFrontend } from "#src/router/utils/generate-routes-from-frontend";
import { useAccessStore } from "#src/store/access";
import { useAuthStore } from "#src/store/auth";

import { usePreferencesStore } from "#src/store/preferences";
import { useUserStore } from "#src/store/user";

import { removeDuplicateRoutes } from "./utils";

/**
 * Routes whitelist 1. No permission verification, 2. Will not trigger requests, such as user information interface
 * @example "privacy-policy", "terms-of-service" and so on.
 */
const noLoginWhiteList = Array.from(whiteRouteNames).filter(item => item !== loginPath);

interface AuthGuardProps {
	children?: React.ReactNode
}

/**
 * AuthGuard component, used for permission verification. The order of the code is important and should not be arbitrarily adjusted
 */
export function AuthGuard({ children }: AuthGuardProps) {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const currentRoute = useCurrentRoute();
	const { pathname, search } = useLocation();
	const isLogin = useAuthStore(state => Boolean(state.token));
	const isAuthorized = useUserStore(state => Boolean(state.id));
	const getUserInfo = useUserStore(state => state.getUserInfo);
	const userRoles = useUserStore(state => state.roles);
	const { setAccessStore, isAccessChecked, routeList } = useAccessStore();
	const { enableBackendAccess, enableFrontendAceess } = usePreferencesStore(state => state);

	const isPathInNoLoginWhiteList = noLoginWhiteList.includes(pathname);

	/**
	 * Fetch user information and route configuration asynchronously
	 */
	useEffect(() => {
		async function fetchUserInfoAndRoutes() {
			/**
			 * Login redirect, prevent flicker
			 */
			setupLoading();

			/**
			 * Initialize an empty array to hold Promise objects
			 */
			const promises = [];

			/**
			 * Fetch user information
			 */
			promises.push(getUserInfo());

			/**
			 * If backend routing is enabled and the route is obtained from a separate interface, then initiate a request
			 */
			if (enableBackendAccess && isSendRoutingRequest) {
				promises.push(fetchAsyncRoutes());
			}

			const results = await Promise.allSettled(promises);
			const [userInfoResult, routeResult] = results;
			const routes = [];
			const latestRoles = [];
			/**
			 * Fetch role information from the user interface
			 */
			if (userInfoResult.status === "fulfilled" && "roles" in userInfoResult.value) {
				latestRoles.push(...userInfoResult.value?.roles ?? []);
			}
			/**
			 * If backend routing is enabled and the route is obtained from the user interface
			 */
			if (enableBackendAccess && !isSendRoutingRequest && userInfoResult.status === "fulfilled" && "menus" in userInfoResult.value) {
				routes.push(...await generateRoutesFromBackend(userInfoResult.value?.menus ?? []));
			}
			/**
			 * If backend routing is enabled and the route is obtained from a separate interface
			 */
			if (enableBackendAccess && isSendRoutingRequest && routeResult.status === "fulfilled" && "result" in routeResult.value) {
				routes.push(...await generateRoutesFromBackend(routeResult.value?.result ?? []));
			}

			/**
			 * If frontend routing is enabled
			 */
			if (enableFrontendAceess) {
				routes.push(...generateRoutesByFrontend(accessRoutes, latestRoles));
			}

			const uniqueRoutes = removeDuplicateRoutes(routes);
			setAccessStore(uniqueRoutes);

			const hasError = results.some(result => result.status === "rejected");
			/**
			 * Network request failed, redirect to 500 page
			 */
			if (hasError) {
				const unAuthorized = results.some((result) => {
					if (result.status !== "rejected")
						return false;
					return (result.reason as { response?: Response })?.response?.status === 401;
				});
				if (!unAuthorized) {
					return navigate(exception500Path);
				}
			}

			/**
			 * Under the condition of dynamic routing, do you need to replace the current route?
			 * 1. Browser navigation into a dynamic routing address, such as /system/user
			 * 2. The dynamic route is not added to the route, so the address bar is still /system/user but the matched route is the fallback (path = "*") route
			 * 3. After adding the dynamic route, use replace to replace the current route and trigger the program to match /system/user again
			 *
			 * Refer: https://router.vuejs.org/guide/advanced/dynamic-routing#Adding-routes
			 */
			navigate(`${pathname}${search}`, {
				replace: true,
				/**
				 * Ensure that the 404 page will not be displayed before replacing the route
				 */
				flushSync: true,
			});
		}
		/**
		 * The logic of obtaining user information and routes is only executed under the following conditions
		 * 1. Not in the route whitelist
		 * 2. Logged in
		 * 3. Unable to obtain user information and route information
		 */
		if (!whiteRouteNames.includes(pathname) && isLogin && !isAuthorized) {
			fetchUserInfoAndRoutes();
		}
	}, [pathname, isLogin, isAuthorized]);

	/**
	 * Route whitelist
	 * @see {noLoginWhiteList}
	 */
	if (isPathInNoLoginWhiteList) {
		hideLoading();
		return children;
	}

	/**
	 * Processing logic under unlogged conditions
	 */
	/* --------------- Start ------------------ */
	if (!isLogin) {
		hideLoading();
		// If not logged in and the target page is not the login page, redirect to the login page
		if (pathname !== loginPath) {
			// If pathname length is greater than 1, carry the current path when redirecting to the login page, otherwise redirect directly to the login page
			const redirectPath = pathname.length > 1 ? `${loginPath}?redirect=${pathname}${search}` : loginPath;
			return (
				<Navigate
					to={redirectPath}
					replace
				/>
			);
		}
		// If not logged in and the target page is the login page, stay on the login page
		else {
			return children;
		}
	}
	/* --------------- End ------------------ */

	/**
	 * Processing logic under logged conditions
	 */
	/* --------------- Start ------------------ */

	/**
	 * Under logged conditions, match the login route and jump to the home page
	 * Put it before user information, because the login route will not request user information, so put it in front to judge
	 */
	if (pathname === loginPath) {
		/**
		 * @example login?redirect=/system/user
		 */
		const redirectPath = searchParams.get("redirect");
		if (redirectPath?.length && redirectPath !== pathname) {
			return (
				<Navigate
					to={redirectPath}
					replace
				/>
			);
		}
		return (
			<Navigate
				to={import.meta.env.VITE_BASE_HOME_PATH}
				replace
			/>
		);
	}

	/**
	 * Waiting for user information to be obtained
	 */
	if (!isAuthorized) {
		return null;
	}
	/**
	 * Waiting for route information to be obtained
	 */
	if (!isAccessChecked) {
		return null;
	}

	/**
	 * Hide loading animation
	 */
	hideLoading();

	/**
	 * If it is the root route, jump to the home page (jump to the default home page after obtaining user information to prevent requesting twice for user information interface)
	 * pathname returns the path relative to import.meta.env.BASE_URL, so here is the root route "/" relative to BASE_URL
	 */
	if (pathname === "/") {
		return (
			<Navigate
				to={import.meta.env.VITE_BASE_HOME_PATH}
				replace
			/>
		);
	}

	/* --------------- End ------------------ */

	/**
	 * Route permission verification logic
	 */
	const routeRoles = currentRoute?.handle?.roles;
	const ignoreAccess = currentRoute?.handle?.ignoreAccess;

	/**
	 * Ignore permission verification
	 */
	if (ignoreAccess === true) {
		return children;
	}

	const matches = matchRoutes(
		routeList,
		pathname,
		/**
		 * pathname returns the path relative to import.meta.env.BASE_URL, so there is no need to specify the third parameter basename
		 */
	) ?? [];

	const hasChildren = matches[matches.length - 1]?.route?.children?.filter(item => !item.index)?.length;
	/**
	 * If the current route has sub-routes, jump to the 404 page
	 */
	if (hasChildren && hasChildren > 0) {
		return (
			<Navigate
				to={exception404Path}
				replace
			/>
		);
	}

	/**
	 * Role permission verification
	 */
	const hasRoutePermission = userRoles.some(role => routeRoles?.includes(role));
	/**
	 * Role permission verification logic:
	 * 1. If there is no role on the route, it is considered as a permissionless route, equivalent to ignoreAccess being true
	 * 2. For routes that do not pass permission verification, cancel the current route navigation and jump to the 403 page
	 */
	if (routeRoles && routeRoles.length && !hasRoutePermission) {
		return (
			<Navigate
				to={exception403Path}
				replace
			/>
		);
	}

	return children;
}
/**
 * Steps to verify that route navigation is correct:
 * 1. When not logged in, navigate to the login route
 * 2. When not logged in, navigate to a non-login route
 * 3. When logged in, use the system's logout, then log in again
 * 4. Pick any non-home page, clear localStorage using dev tools, then log in after refreshing the page
 * 5. When logged in, navigate to the login route
 * 6. When logged in, navigate to a non-login route
 * 7. When logged in, entering http://localhost:3333 redirects to the /home route, the user interface is called once
 * 8. When logged in, entering http://localhost:3333/ redirects to the /home route, the user interface is called once
 * 9. When logged in, entering http://localhost:3333/home redirects to the /home route, the user interface is called once
 */
