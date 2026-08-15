import { useAuthStore } from "#src/store/auth";
import { rememberRoute } from "#src/utils/remember-route";

/**
 * Navigate to the login page
 *
 * @returns No return value
 */
export function goLogin() {
	// Reset the login state
	useAuthStore.getState().reset();
	// Navigate to the login page, carrying the route information to remember
	window.location.href = `${import.meta.env.BASE_URL}login${rememberRoute()}`;
}
