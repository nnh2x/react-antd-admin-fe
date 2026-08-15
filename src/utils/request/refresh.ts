import type { KyResponse, Options } from "ky";
import ky from "ky";

import { fetchRefreshToken } from "#src/api/user";
import { useAuthStore } from "#src/store/auth";
import { AUTH_HEADER } from "./constants";
import { goLogin } from "./go-login";

let isRefreshing = false;

/**
 * Refresh the token and retry the request
 *
 * @param request The request object
 * @param options The request options
 * @param refreshToken The refresh token
 * @returns The response object
 * @throws Throws an exception if refreshing the token fails
 */
export async function refreshTokenAndRetry(request: Request, options: Options, refreshToken: string) {
	if (!isRefreshing) {
		isRefreshing = true;
		try {
			// Call fetchRefreshToken with the given refreshToken to get a new token and refreshToken
			const freshResponse = await fetchRefreshToken({ refreshToken });
			// Extract the new token from the response
			const newToken = freshResponse.result.token;
			// Extract the new refreshToken from the response
			const newRefreshToken = freshResponse.result.refreshToken;
			// Save the new token and refreshToken to userStore
			useAuthStore.setState({ token: newToken, refreshToken: newRefreshToken });
			// Call onRefreshed with the new token
			onRefreshed(newToken);

			// Set the request's Authorization header to the new token
			// Retry the current request
			request.headers.set(AUTH_HEADER, `Bearer ${newToken}`);
			// Retry the request using the new token
			return ky(request, options);
		}
		catch (error) {
			// Call onRefreshFailed with the error object
			// refreshToken authentication failed, so reject all pending requests
			onRefreshFailed(error);
			// Navigate to the login page
			goLogin();
			// Rethrow the error
			throw error;
		}
		finally {
			// Set isRefreshing back to false regardless of whether an error occurred
			isRefreshing = false;
		}
	}
	else {
		// Wait for the token refresh to complete
		return new Promise<KyResponse>((resolve, reject) => {
			// Add a refresh subscriber
			addRefreshSubscriber({
				// Once the token refresh succeeds, set the new token on the request's Authorization header and retry the request
				resolve: async (newToken) => {
					request.headers.set(AUTH_HEADER, `Bearer ${newToken}`);
					resolve(ky(request, options));
				},
				// Reject the current Promise if the token refresh fails
				reject,
			});
		});
	}
}

// Defines an array used to store all subscribers waiting for the token refresh
// Each subscriber object contains resolve and reject methods, called when the token refresh succeeds or fails respectively
let refreshSubscribers: Array<{
	resolve: (token: string) => void // Function called when the token refresh succeeds, receiving the new token
	reject: (error: any) => void // Function called when the token refresh fails, receiving the error information
}> = [];

/**
 * Notify all waiting subscribers when the token refresh succeeds.
 * Iterates over all subscribers, calling their resolve method with the new token.
 * Then clears the subscriber list to prepare for the next token refresh.
 *
 * @param token The refreshed token string
 */
function onRefreshed(token: string) {
	refreshSubscribers.forEach(subscriber => subscriber.resolve(token));
	refreshSubscribers = []; // Clear the subscriber list
}

/**
 * Notify all waiting subscribers when the token refresh fails.
 * Iterates over all subscribers, calling their reject method with the error information.
 * Then clears the subscriber list.
 *
 * @param error The error produced when the refresh fails
 */
function onRefreshFailed(error: any) {
	refreshSubscribers.forEach(subscriber => subscriber.reject(error));
	refreshSubscribers = []; // Clear the subscriber list
}

/**
 * Add a new subscriber to the list.
 * The subscriber object should contain resolve and reject methods.
 *
 * @param subscriber The subscriber object, containing resolve and reject methods
 */
function addRefreshSubscriber(subscriber: {
	resolve: (token: string) => void // Function called when the token refresh succeeds
	reject: (error: any) => void // Function called when the token refresh fails
}) {
	refreshSubscribers.push(subscriber); // Add the new subscriber to the list
}
