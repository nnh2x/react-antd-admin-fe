import { useMatches } from "react-router";
import { useUserStore } from "#src/store/user";

import { isString } from "#src/utils/is";
import { accessControlCodes, AccessControlRoles } from "./constants";

export * from "./constants";

/**
 * Access judgment
 */
export function useAccess() {
	const matches = useMatches();
	const { roles: userRoles } = useUserStore();
	const currentRoute = matches[matches.length - 1];

	/**
	 * Determine whether the current route has a specified permission based on permission codes
	 * @param permission An all-lowercase permission name or array of permission names, e.g. `["add", "delete"]`.
	 * @returns boolean Whether the specified permission is present
	 */
	const hasAccessByCodes = (permission?: string | Array<string>) => {
		if (!permission)
			return false;
		/** Get all custom button-level `code` values from the current route's `handle` field */
		const metaAuth = currentRoute?.handle?.permissions;
		if (!metaAuth) {
			return false;
		}
		permission = isString(permission) ? [permission] : permission;
		permission = permission.map(item => item.toLowerCase());
		if (import.meta.env.DEV) {
			// Validate that the permission codes are legal; a warning is logged for invalid ones
			for (const code of permission) {
				if (!Object.values(accessControlCodes).includes(code)) {
					console.warn(`[hasAccessByCodes]: '${code}' is not a valid permission code`);
				}
			}
		}
		const isAuth = metaAuth.some(item => permission.includes(item.toLowerCase()));
		return isAuth;
	};

	/**
	 * Determine whether the current user has a specified permission based on roles; the current system is designed to check this by role id
	 * @param roles An all-lowercase permission name or array of permission names, e.g. `["admin", "super", "user"]`.
	 * @returns boolean Whether the specified permission is present
	 */
	const hasAccessByRoles = (roles?: string | Array<string>) => {
		if (!roles || !userRoles) {
			return false;
		}
		roles = isString(roles) ? [roles] : roles;
		roles = roles.map(item => item.toLowerCase());
		if (import.meta.env.DEV) {
			// Validate that the roles are legal; a warning is logged for invalid ones
			for (const roleItem of roles) {
				if (!Object.values(AccessControlRoles).includes(roleItem)) {
					console.warn(`[hasAccessByRoles]: '${roleItem}' is not a valid role`);
				}
			}
		}
		const isAuth = userRoles.some(item => roles.includes(item.toLowerCase()));
		return isAuth;
	};

	return { hasAccessByCodes, hasAccessByRoles };
}
