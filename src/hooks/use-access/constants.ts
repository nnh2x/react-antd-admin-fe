/**
 * Manage permission constants in one place, avoiding hardcoded strings scattered across the project, for easier maintenance.
 */

/**
 * Button permission prefix
 */
export const permissionPrefix = "permission:button";

/**
 * Common button permissions:
 * - get: fetch
 * - update: update
 * - delete: delete
 * - add: create
 */
export const accessControlCodes = {
	get: `${permissionPrefix}:get`,
	update: `${permissionPrefix}:update`,
	delete: `${permissionPrefix}:delete`,
	add: `${permissionPrefix}:add`,
};

export const AccessControlRoles = {
	admin: "admin",
	common: "common",
	// user: "user",
};
