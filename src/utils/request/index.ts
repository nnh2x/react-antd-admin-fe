import type { Options } from "ky";

import ky from "ky";
import { loginPath } from "#src/router/extra-info";
import { useAuthStore } from "#src/store/auth";
import { usePreferencesStore } from "#src/store/preferences";

import { AUTH_HEADER, LANG_HEADER, REFRESH_TOKEN_PATH } from "./constants";
import { handleErrorResponse } from "./error-response";
import { globalProgress } from "./global-progress";
import { goLogin } from "./go-login";
import { refreshTokenAndRetry } from "./refresh";

// Request whitelist; APIs in the whitelist do not need to carry a token
const requestWhiteList = [loginPath];

// Request timeout duration
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;

const defaultConfig: Options = {
	prefix: import.meta.env.VITE_API_BASE_URL,
	timeout: API_TIMEOUT,
	retry: {
		// Maximum number of retries when a request fails
		limit: 3,
	},
	hooks: {
		beforeError: [
			({ error, options }) => {
				if (!options.ignoreLoading) {
					globalProgress.done();
				}
				return error;
			},
		],
		beforeRequest: [
			({ request, options }) => {
				const ignoreLoading = options.ignoreLoading;
				if (!ignoreLoading) {
					globalProgress.start();
				}
				// Requests that do not need to carry a token
				const isWhiteRequest = requestWhiteList.some(url => request.url.endsWith(url));
				if (!isWhiteRequest) {
					const { token } = useAuthStore.getState();
					request.headers.set(AUTH_HEADER, `Bearer ${token}`);
				}
				// The language header must be carried on all requests
				request.headers.set(LANG_HEADER, usePreferencesStore.getState().language);
			},
		],
		afterResponse: [
			async ({ request, options, response }) => {
				const ignoreLoading = options.ignoreLoading;
				if (!ignoreLoading) {
					globalProgress.done();
				}
				// request error
				if (!response.ok) {
					if (response.status === 401) {
						// Prevent an infinite loop caused by refreshing the refresh-token and continuing to receive 401 errors
						if ([`/${REFRESH_TOKEN_PATH}`].some(url => request.url.endsWith(url))) {
							goLogin();
							return response;
						}
						// If the token is expired, refresh it and try again.
						const { refreshToken } = useAuthStore.getState();
						// If there is no refresh token, it means that the user has not logged in.
						if (!refreshToken) {
							// If the page has already been redirected to the login page, return the result directly without redirecting
							if (location.pathname === loginPath) {
								return response;
							}
							else {
								goLogin();
								return response;
							}
						}

						return refreshTokenAndRetry(request, options, refreshToken);
					}
					else {
						return handleErrorResponse(response);
					}
				}
				// request success
				return response;
			},
		],
	},
};

export const request = ky.create(defaultConfig);
